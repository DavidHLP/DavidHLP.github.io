---
title: "Owner 間 audit を cross-database write にしない：UltiCode の Local Outbox と Consumer Inbox"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-owner-and-facts", "ulticode-outbox-redis-streams"]
tags: [UltiCode, Audit, DataOwner, Outbox, Inbox, RedisStreams, EventualConsistency, Idempotency, LLM]
description: "Auth/App の local audit outbox、owner-specific Redis Stream、Admin consumer inbox から、owner 間 audit の double write、重複 delivery、lease 回復、eventual consistency を説明する。"
toc: true
---

> **証拠の状態**：この記事は固定コミット時点の UltiCode audit adapter、dispatcher、Admin inbox bridge、consumer inbox、database migration に基づく。repository に mechanism があることは、service 間 exactly-once や本番で audit が一件も失われないことの証明ではない。

audit log には見落としやすい制約がある。audit event を生む action と audit log を保存する module は、異なる Data Owner であることが多い。

例えば Auth が login policy を変更するとき、その action が本当に commit したかを最もよく知るのは Auth である。一方、統一された audit_logs read model を所有するのは Admin かもしれない。Auth の business transaction 後に Admin へ同期で log を書くと、business は成功したが remote log write は失敗する rollback 不可能な窓が生まれる。先に Admin に書いてから Auth を commit すると、対応する business action のない log が残り得る。

これは「message queue を入れるか」だけの問題ではない。どの database transaction が action と audit intent の同時存在を保証し、どの module が最終 materialize を所有し、重複と failure を誰が収束させるかを先に決める必要がある。

## 直接の cross-database write が不十分な理由

最も直接的なのは Auth/App service method が local transaction 内で Admin write API を呼ぶ方法である。

```text
begin Auth transaction
  update Auth data
  call Admin.writeAudit()
commit Auth transaction
```

具体的な不足は三つある。

1. Admin request が失敗したとき local transaction が rollback するかは remote call の時系列と exception propagation に依存する。network timeout は Admin が既に write 成功したが response が戻らない意味かもしれない。
2. Admin audit table と Auth/App business table が別 database にあれば、通常の @Transactional は一つの atomic commit にできない。
3. message queue を入れても consumer retry により同じ event が複数回届く。「message が送られた」ことは business side effect が一度だけ起きたことを意味しない。

失ってもよい低価値の diagnostic log なら、直接 async logging で十分な場合がある。audit record に traceability と replayability が必要なら、以下の state machine の cost を払う価値がある。

## 第一の境界：fact を生んだ owner に audit intent を残す

UltiCode は action commit 時に Auth/App が Admin table を直接書かせず、それぞれが local audit outbox を持つ。

```text
Auth/App local transaction
    ├── write business state
    └── insert audit_outbox(PENDING, eventId, payload)
              │
              └── local dispatcher
                    └── owner-specific Redis Stream
```

AuthAuditSinkAdapter と AppAuditSinkAdapter の価値は「table が一つ増えた」ことではない。必ず一緒に起きるべき二つの action を一つの Owner の local transaction に入れる。

```text
@Transactional
    ├── commit the Auth/App change
    └── insert local audit_outbox
```

business action が成功したのに audit intent が完全にない窓を、local database transaction が扱える範囲へ縮める。dispatcher はその後の cross-system delivery を担う。claim owner 付き record を取得し、対応する Stream に write し、成功時に delivered、失敗時に retry を記録し、delivery failure を log に隠さない。

Admin が Auth/App table を直接読むことは意図的にしない。Admin が受け取るのは event contract であり、別 Owner の Mapper や Entity ではない。これにより Data Owner の write boundary を保つ。

## 第二の境界：Inbox に入れてから message を引き取ったと確認する

Admin bridge の順序は重要である。

```text
Redis Stream
    │ read
    ▼
validate eventId / type / owner / payload
    │
    ├── invalid -> poison path
    └── valid
          │
          ▼
consumer_inbox.insertIfAbsent(consumer, eventId, payload)
          │
          └── only then ACK Stream
```

AdminAuditIntegrationInboxBridge は message を先に validate し、Admin local の consumer_inbox に引き取る。Inbox write 前に process が落ちれば Stream message は unacknowledged のままで再読できる。Inbox insert 後 ACK 前に落ちても、次の read は unique key に当たり、insertIfAbsent が duplicate と認識して安全に ACK できる。

consumer inbox の unique key は (consumer, event_id) である。eventId を global unique にするより正確だ。同じ event に複数の正当な consumer がいてもよく、各 consumer が deduplication するのは自分の side effect だけだからである。

Admin は event id と payload 内の auditId も一致確認する。保守的に見えるが、外側の message は A と言いながら内側 payload は B という関連の混乱を防ぐ。audit log の idempotency key も同じ event id が駆動する。

## 第三の境界：Inbox 自身も復旧可能な state machine である

message を Inbox に write するだけでは「永続的に引き取った」ことしか解決しない。consumer が処理途中で crash する問題は残るため、ConsumerInboxMapper と InboxConsumer が local state をもう一層作る。

```text
PENDING
  └── claim -> PROCESSING
                 ├── heartbeat/renew
                 ├── success -> PROCESSED
                 └── failure -> PENDING(next_retry_at) or DEAD
```

consumer は PENDING または lease expired の PROCESSING row を claim し、lease owner/expiry を write する。通常 handler の business side effect と Inbox terminal update は一つの transaction に置く。

```text
@Transactional
    ├── apply Admin audit log if event is new
    └── mark inbox row PROCESSED
```

handler が失敗すると error と次回 retry 時刻を記録し、上限に達すれば DEAD に入る。side effect の commit 前に process が crash すれば transaction rollback し Inbox は retry できる。side effect が commit して terminal update が commit しない場合も、一つの transaction が両者を分離させない。同じ transaction に入れない external side effect には downstream idempotency key や compensation rule が必要である。

## なぜ共有 event table 一枚ではなく二層 Outbox/Inbox なのか

二層は重複に見えるが、責務が違う。

| 位置 | 解決する問題 | 代替できないもの |
|---|---|---|
| Auth/App local outbox | local business commit 後も audit intent が消えない | remote delivery の一回成功は保証しない |
| Redis Stream | Owner 間 async transport、consumer group、Pending visibility | database idempotency と business transaction の代わりにならない |
| Admin consumer inbox | どの consumer が event を永続的に引き取ったか、重複排除 | 全 handler side effect の atomicity は保証しない |
| audit_logs | Admin local audit read model | Auth/App business transaction を rollback できない |

全 module が一枚の event table を共有すれば bridge code は少なく見えるが、異なる Owner の write permission、migration schedule、failure recovery が結合する。直接の代替は two-phase commit だが、全 resource が同じ coordination protocol に参加する必要がある。database、Redis、独立 service が混ざる path では、明示的な eventual-consistency state machine の方が通常安い。

## この設計が実際に保証すること

混同されやすい保証を分ける。

- **local atomicity**：business change と local audit outbox を同じ Owner transaction で commit。
- **retryable delivery**：dispatcher failure は retry state を残し、未 ACK Stream message は再取得できる。
- **consumer deduplication**：(consumer, event_id) unique key と insertIfAbsent が duplicate delivery による同じ Inbox task の重複作成を防ぐ。
- **processing recovery**：consumer lease expiry 後に再取得し、failure は backoff、長期 failure は dead-letter state にできる。
- **audit persistence の idempotency**：Admin は event id を audit record の idempotent identity とし、payload との関連を検証する。

cross-database の即時整合性、任意の external side effect の exactly-once、message が決して失われないこと、consumer が二度実行しないこと、すべての poison event が自動修復できることは保証しない。正確には、delivery と attempt は繰り返し得るが、最終 side effect の資格を local transaction、unique key、idempotent handler に収束させる。

## コスト、適用条件、失敗境界

event source と final read model が異なる Owner に属し、audit service が一時利用不能でも business action を失敗させず、audit event に traceability、retry、duplicate detection が必要な場合に向く。

コストも現実的である。outbox、Stream、Inbox の三種類以上の state を維持し、claim lease、backoff、dead letter、monitoring、schema compatibility を扱い、各 event に stable id と payload validation を定義する必要がある。小さな monolith で database が一つ、audit を business と同じ transaction に含めてよいなら local audit table 一枚が適切かもしれない。

見落としやすい failure は三つある。

1. business write path が outbox insert を漏らし、reliable delivery chain に source から event がない。
2. consumer が external call と markProcessed を分離し、idempotency key や compensation がない。Inbox は「retry した」ことしか保証せず、side effect の重複を防がない。
3. Stream lag だけを監視し、Inbox DEAD 数、最古 lease、retry age を監視しない。message は consumed に見えても local state machine が止まっている。

## LLM/Agent system への適用

Agent tool call にも「task は受理されたが audit event が残らない」、「tool result は適用されたが ACK 前に confirmation が失われる」という事象がある。user request と tool intent を caller の local outbox に書き、event id 付き stream で component 間を渡し、各 side-effect consumer に独自 Inbox と idempotency rule を持たせる。

ただし「Agent に message queue を足す」と単純化しない。移植すべき責務分担は、fact を誰が所有し、send intent を誰が保存し、durable takeover を誰が確認し、重複実行の安全性を誰が担うかである。

## 最小検証経路

source review では table structure だけを見るより次の順が断点を見つけやすい。

1. AuthAuditSinkAdapter と AppAuditSinkAdapter を読み、outbox insert が本当に business transaction path にあるか確認する。
2. AdminAuditIntegrationInboxBridge を読み、ACK が Inbox persistence より後か確認する。
3. ConsumerInboxMapper、InboxConsumer、AdminAuditEventConsumer を同時に読み、lease recovery、unique key、handler transaction が閉じているか確認する。

repository には Auth/App audit dispatcher test と Admin audit/inbox test がある。本 article の write 段階では UltiCode Maven test を再実行しておらず、test file の存在を real Redis multi-instance や cross-database failure exercise の証明とはしていない。

