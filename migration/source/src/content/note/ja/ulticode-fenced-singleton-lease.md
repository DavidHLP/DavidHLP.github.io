---
title: "database lease だけでは足りない：UltiCode の fence token で期限切れ singleton task を止める"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-generation-attempt-fence"]
tags: [UltiCode, FencedLease, DistributedLock, Reconciliation, CAS, MySQL, Concurrency, LLM]
description: "期限時刻だけでは不十分な理由と、UltiCode の fenced_job_leases と reconciliation run の write path が database 境界で古い executor を無効にする方法。"
toc: true
---

> **証拠の状態**：この記事は固定コミット時点の UltiCode FencedJobLeaseMapper、FencedJobLeaseService、OwnerReconciler、ReconciliationRunMapper、ADR、MySQL migration に基づく。source と boundary test は stale completion が拒否されることを示すが、すべての external side effect に fencing があることや singleton task の exactly-once を意味しない。

system が一つの reconciliation task だけを許すとする。instance A が lease を取得し scan を開始する。しばらくして A が停止し lease が expire する。instance B が新しい lease を取得し、新しい scan を完了する。その後 A が復帰して最後の step、「task が完了した」と自分の result を write する。

database update が lease_name や owner_token だけを確認するなら A も成功し得る。A はかつて正しい owner だったが、database が知っているのは「現在 lease がある」ことだけで、どの lease generation から write が来たかではない。B の新しい result が古い executor に上書きされる可能性がある。

これが通常の lease と fenced lease の違いである。lease は誰が開始できるかを決め、fence token は誰が終了する資格をまだ持つかを決める。

## 素朴な設計が失敗する理由

### process 内 lock は一つの process だけを解決する

synchronized、ReentrantLock、singleton Bean は同じ JVM の重複実行を止められる。しかし service が restart し、二つ目の replica や独立した運用 script が現れると lock の scope は終わる。一つの process だけの offline task には向くが、database write を global fact として扱う service cluster には向かない。

### owner + expiry だけでは古い owner の復帰を許す

典型的な lease table には lease_name、owner_token、leased_until がある。expired lease を takeover し、write 時に owner と time を確認すれば crash recovery に対応できそうだが、「これは何回目の取得か」を表せない。

time check も万能ではない。old worker が check 後に pause し、lease expiry と new owner takeover の後に write を続ける可能性がある。application local time と database time がずれることもある。

### Redis distributed lock は自動的に fencing しない

Redis lock は取得を調整できる。しかし downstream database update が monotonically increasing token を持ち、確認しなければ、古い owner は lock expiry 後にも write を完了できる。lock の保存先を変えるだけで stale-writer protection は得られない。

## UltiCode の中心機構：takeover ごとに lease generation を増やす

UltiCode は singleton task の lease を fenced_job_leases に保存し、有効な takeover ごとに fence_token を割り当てる。

```text
lease_name = admin:reconciliation

first owner:  owner=A, fence=7, leased_until=T1
lease expires
new owner:   owner=B, fence=8, leased_until=T2
```

FencedJobLeaseMapper は lease が expired の場合だけ takeover し、token を増やす。acquire、renew、release、isHeld はすべて lease_name + owner_token + fence_token の一致を要求する。lease time の判定は database の CURRENT_TIMESTAMP(3) を使い、application process の local clock を唯一の事実源にしない。

これにより「current owner は誰か」と「この owner はどの lease generation か」の曖昧さを解消する。A が古い owner token を持っていても fence は 7 のままであり、B の takeover 後 database は fence 8 へ進むため、A の後続 update は条件で拒否できる。

## 本当の fence は completion write にある

token を取得するだけでは足りない。最も damage を起こしやすい old worker の final write まで token を運び、そこで check する必要がある。

OwnerReconciler は admin:reconciliation を取得し、owner token と fence token を reconciliation run に記録し、実行中に renew する。run 完了時、ReconciliationRunMapper は join 付き conditional update を使う。

```sql
UPDATE reconciliation_runs AS r
JOIN fenced_job_leases AS l
  ON l.lease_name = :leaseName
SET r.status = :status,
    r.finished_at = :finishedAt
WHERE r.run_id = :runId
  AND r.fence_token = :runFenceToken
  AND l.owner_token = :ownerToken
  AND l.fence_token = :fenceToken
  AND l.leased_until > CURRENT_TIMESTAMP(3)
```

これは実装から取り出した簡略例で、他の field は省略しているが semantic condition は残している。一つでも条件を満たさなければ affected rows は 0 になる。呼び出し側は 0 rows を「後で再度 write」と扱わず、lease loss、old token、競合者 takeover と解釈する。

次のように Java だけで書く場合とは違う。

```java
if (lease.isHeld()) {
    run.setFinished(true);
}
```

Java check と database update の間には race がある。conditional update は check と write を一つの atomic database operation に置く。

## なぜ database pessimistic lock を直接使わないのか

SELECT ... FOR UPDATE は一つの transaction 内の row を保護できる。しかし reconciliation は長時間動く可能性があり、database transaction を開き続けられない。long transaction は lock を保持し、resource 消費を拡大し、複数の external step に向かない。

fenced lease は long task を短い transaction に分ける。acquire、renew、progress 記録、finish の各回で token により current authority を確認する。「全 task を一つの lock で包む」単純さは失うが、task を long transaction の外で動かし、final commit は database に判定させられる。

pessimistic lock が不要という意味ではない。短い local critical section では直接的である。network、file、長時間計算を含む task では lease + fencing の方が lifecycle に合うことが多い。

## この設計が実際に解決すること

- **instance 間 coordination**：一つの lease_name と database constraint で複数 instance が singleton task を競合する。
- **expiry takeover**：old instance が renew しなければ、expiry 後に new instance が takeover できる。
- **old completion の無効化**：new takeover が fence token を増やし、old executor は final-write condition を満たせない。
- **database time の一貫性**：lease validity は local application time ではなく database clock を使う。
- **failure の可観測性**：0 rows は stale/lost-lease の明確な signal であり、silent overwrite ではない。

既に呼び出した external API を rollback できるか、file が write 済みか、third party が token を確認するか、old worker が CPU を使い続けるか、business 全体が一度だけ動くかは解決しない。Fencing が主に保護するのは token を持つ write seam であり、token 条件のない side effect には idempotency key、compensation、独立した fencing protocol が必要である。

## コスト、適用条件、失敗境界

singleton 実行が必要、task が lease TTL を越える可能性がある、instance が pause/restart/replace される、final state を同じ database に write-back できる、という条件なら適用しやすい。

cost も明確である。token を acquire point からすべての side-effecting write へ渡し、renew と TTL を monitor し、各 terminal update に正しい condition を書き、new owner takeover 後に old owner が戻る test を行う必要がある。すべてが短い一つの transaction で完了するなら row lock や unique constraint の方が簡単である。

最も見落としやすい境界は acquire だけを fence し、completion、publish、delete、success mark を fence しないことである。それでは番号付き lock を持つだけで、stale completion を止められない。

## LLM/Agent scheduling への適用

long-running Agent task も model switch、cancel-and-resume、worker restart により複数 executor を持ち得る。plan version や task epoch を fence token とし、tool result、final summary、task state update に同じ token を要求できる。old plan は自然終了まで動いても、new plan を complete と mark する資格はない。

移植の中心は「Agent に distributed lock を付けるか」ではない。どの side effect が database 境界で current plan version を再検証すべきかを問うことである。memory 内の isCurrent だけに依存する tool は check と write の間に stale になり得る。

## 最小検証経路

[FencedJobLeaseMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/lease/FencedJobLeaseMapper.java) の acquire/renew/release condition を読み、[ReconciliationRunMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/reconciliation/ReconciliationRunMapper.java) の completion update を読む。最後に [FencedJobLeaseIT](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/test/java/com/ulticode/modules/lease/FencedJobLeaseIT.java) と [OwnerReconcilerTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/test/java/com/ulticode/modules/reconciliation/OwnerReconcilerTest.java) を確認する。一つは takeover 後の old release failure、もう一つは old owner の completion write 拒否を検証する。

UltiCode 分析段階では、この fenced lease の MySQL 8 Testcontainers integration test 二件と reconciliation の targeted unit test を実際に実行し、通過した。これは選択した競合 scenario の検証であり、性能、network partition、すべての external side effect の証明ではない。

