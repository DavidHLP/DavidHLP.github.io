---
title: "UltiCode の generation と attemptId：条件付き更新で古い判定結果を遮断する"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Generation, AttemptId, Lease, CAS, Concurrency, LLM]
description: "generation、attemptId、lease、条件付き更新によって、再判定・タイムアウト・古い Worker の結果が新しい状態を上書きしないようにする UltiCode の方法。"
toc: true
---

> **証拠の状態**：この記事は UltiCode の Submission mapper、再判定サービス、lease 回収器、Judge attempt executor に基づく。リポジトリが実装する結果フェンスを説明するものであり、システム間の exactly-once や本番並行性の証明へ拡張するものではない。

非同期判定では、一つの submission が複数回実行されることがある。管理者が再判定を開始する、元の Worker がタイムアウトする、lease が回収される、Redis が古いメッセージを再配送する、といった場合である。結果の書き込みを `submissionId` だけで特定すると、最後に到着した古い結果が最新結果を上書きし得る。

UltiCode は、論理的な submission の世代と具体的な実行 lease を分けて表現する。

- `generation`：submission または再判定の論理 epoch。
- `attemptId`：一つの Worker 実行 lease の token。

## 並行性のルールを SQL 条件にする

重要な経路は次の四つの条件に圧縮できる。

```text
acquire lease:  id + status=Pending + generation
renew lease:    id + current_attempt_id
write verdict:  id + generation + current_attempt_id
rejudge/reaper: expected generation -> generation + 1
```

[SubmissionMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java) では、これが条件付き更新になる。

1. Submission が Pending で generation が一致する場合だけ、Worker は lease を取得できる。
2. 現在の `attemptId` が lease を保持している場合だけ、heartbeat は lease を延長できる。
3. id、generation、`attemptId` がすべて一致する場合だけ、verdict を書き込める。
4. 再判定または lease 回復は、期待する generation に対する CAS を行ってから次の世代へ進み、新しい判定意図を作成する。

更新行数が 0 の場合、呼び出し側は古い結果の書き込みを続けず、lease 喪失、generation 期限切れ、競合者の takeover と解釈する。判定 executor は `judge.stale_result.dropped` を記録し、安全に古いと判定できたメッセージを ACK する。

## 再判定と回収はどのように epoch を進めるか

[SubmissionRejudgeService](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/submission/admin/SubmissionRejudgeService.java) は終端状態の submission を、現在の generation に一を加えることで再び判定フローへ開き、新しい outbox record を作成する。[JudgingLeaseReaper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/reaper/JudgingLeaseReaper.java) も同じ進め方で期限切れ lease を回復する。

したがって、古いメッセージが Redis PEL に再び現れても、そこには古い generation が付いている。消費、識別、安全な破棄はできるが、Submission owner のデータベース境界を越えることはできない。

## これは境界であり、魔法ではない

結果フェンスが守れるのは、対象となる書き込み seam だけである。メッセージの永続性、owner 間の認可、業務監査、外部システムの冪等性を自動的に代替するものではない。また古いコードが実行されないことを保証するのでもなく、古い実行結果が新しい状態を上書きする資格を持たないことを保証する。

これが条件付き更新の価値である。並行性の正しさを「すべての呼び出し側が注意する」状態から、検査可能な一つのデータベース規則へ収束させる。

## LLM/Agent システムへの適用

Agent のタスクも retry、キャンセル後の再開、model の切り替え、再計画を経験する。計画バージョンを `generation`、provider lease を `attemptId` とし、最終書き込みを `taskId + planVersion + attemptId` に制限できる。遅れて返った tool の結果は、現在の計画を書き換えるのではなく、観測可能な stale result に留まる。

## 最小検証経路

[SubmissionMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java) を読み、[DefaultJudgeAttemptExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/processor/DefaultJudgeAttemptExecutor.java) の acquire/renew/write/ACK-NACK 経路を確認する。対応する統合挙動は実際の MySQL、Redis、並行性テストと組み合わせて検証すべきであり、この記事はこのラウンドでその検証を実行したとは主張しない。

