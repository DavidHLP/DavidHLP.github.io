---
title: "UltiCode Outbox と Redis Streams：判定投递を復旧可能な状態にする"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Outbox, RedisStreams, Retry, DeadLetter, Idempotency, LLM]
description: "データベース outbox、Redis Streams の atomic delivery、retry/dead letter、PEL 回収によって、判定メッセージを復旧可能な状態へ変える UltiCode の方法。"
toc: true
---

> **証拠の状態**：この記事は UltiCode の固定コミット時点の outbox、Redis Streams、reaper ソースに基づく。ここでの「復旧可能」とは永続的な意図と retry 経路が実装されているという意味であり、exactly-once、無限のスループット、本番 HA が検証済みという意味ではない。

キューで最も危険な障害は「送信時にエラーが返る」ことではない。業務トランザクションは成功したのに、「何を送る必要があるか」という信頼できる記録が残らないことである。オンライン判定でこの窓が生じると、ユーザーには submit 成功と見える一方、Judge にはタスクが届かない。

judge outbox 経路を有効にすると、UltiCode は submit と判定意図を同じデータベーストランザクションに入れる。

```text
submit @Transactional
    ├── submissions: Pending
    └── judge_outbox: PENDING
             │
             ├── claim: FOR UPDATE SKIP LOCKED
             ├── atomic SET + XADD
             └── judge-workers
```

## Outbox record は状態機械である

[JudgeOutboxMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/outbox/mapper/JudgeOutboxMapper.java) は状態と次回 retry 時刻で record を取得し、`FOR UPDATE SKIP LOCKED` を使って dispatcher 間の同一行の重複取得を避ける。現在の dispatcher のデフォルト batch size は 50、定期実行間隔は 2 秒であり、スループット指標ではない。

[JudgeOutboxDispatcher](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) は障害ごとに異なる状態遷移へ写像する。

| 状況 | 処理 |
|---|---|
| provider がない | delivery intent を保持して retry |
| enqueue 例外 | exponential backoff で retry、現在の上限は 60 秒 |
| `problemId/userId/language/code` がない | `DEAD`、中身の半分しかない message を成功扱いしない |
| enqueue 成功 | sent にする |

実際の dispatch は shadow flag と cutover watermark も受ける。移行期間に shadow task と実タスクを区別するために重要である。

## なぜ一回の XADD ではなく Redis Streams なのか

[RedissonStreamsJudgeQueueAdapter](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java) は enqueue で Lua を使い、deduplication key の書き込みと `XADD` を一つの atomic operation にする。deduplication key には `submissionId:generation` が含まれる。

これは具体的な障害を防ぐ。`SETNX` の後 `XADD` 前にプロセスが落ちると、Stream に実際のタスクがないのに、システムは message を既に見たと判断してしまう。atomic script は外部システムのすべての障害を消せないが、この再現可能な半端な状態を消す。

consumer group は `0-0` から作るため、group 作成前の entry にも消費される機会が残る。worker が NACK したときは、失敗メッセージを黙って削除せず Pending Entries List（PEL）に残す。

## PEL 回収と観測可能な状態

[UnackedStreamEntriesReaper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/outbox/reaper/UnackedStreamEntriesReaper.java) はデフォルトで 10 秒ごとに idle entry を走査し、1 sweep につき最大一件を進め、PEL size、queue delay、最古 entry の age、DLQ のメトリクスを公開する。現在の visibility timeout 定数は `1_800_000L`、つまり 30 分であり、実装パラメータであって SLO ではない。

回収されたタスクも judge executor の generation/attempt フェンスを通る。復旧可能な delivery は、古い message に恒久的な書き込み権限を与えない。

## これは exactly-once ではない

データベーストランザクションと外部 Redis 操作の間には依然として境界がある。より正確には次のように表現できる。

```text
persistent business intent
    + retryable delivery
    + message-level deduplication
    + fenced result writes
    = explainable at-least-once processing path
```

「message は絶対に重複しない」と言うより信頼できる。重複 delivery と重複実行はなお起こり得るからである。実際に守られるのは、重複または期限切れの結果が最終状態を勝手に変えないことである。

## LLM/Agent システムへの適用

長時間の Agent タスクも in-memory queue だけに依存してはいけない。ユーザー要求、tool-call intent、実行状態、retry 理由は復旧可能な record に残す必要がある。冪等キーで重複 trigger を識別し、最終書き込みにも version fence を持たせる。「model request は成功したが tool task は作成されなかった」という窓は、オンライン判定における submit/outbox の窓と同じ種類の問題である。

## 最小検証経路

[JudgeOutboxDispatcher.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) と [RedissonStreamsJudgeQueueAdapter.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java) を読み、[SubmissionOutboxDispatcherIT](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/queue/outbox/dispatcher/SubmissionOutboxDispatcherIT.java) を確認する。

