---
title: "UltiCode 非同期実行コントラクト：冪等性、フィンガープリント、上限付き receipt"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Async, Idempotency, Fingerprint, StateMachine, Judge0, LLM]
description: "UltiCode が同期プレビューと非同期実行で同じコントラクトを共有し、冪等キー、SHA-256 フィンガープリント、状態機械、メモリ上限で長時間タスクを制約する方法。"
toc: true
---

> **証拠の状態**：この記事は UltiCode の非同期実行インターフェースと Judge provider のソースに基づく。現在の実装には Docker のデフォルト adapter、任意の Judge0 adapter、上限付きのプロセス内 metadata が含まれる。一方、複数レプリカや再起動をまたぐ durable receipt の冪等性は明確な未完了点である。

同期プレビューと非同期実行は、時間尺度の異なる同じ問題を解決する。前者はできるだけ早く結果を返し、後者はタスクのキュー待ち、実行、キャンセル、タイムアウトを許容する。両方の経路が入力、状態、エラーを別々に定義すると、呼び出し側には互換性のない二つの実行セマンティクスが残る。

## まず実行コントラクトを定義する

[AsyncSandboxExecutor](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) は `submit`、`poll`、`cancel` を提供し、実行状態を次に制限する。

```text
QUEUED -> RUNNING -> COMPLETED
                  ├-> FAILED
                  ├-> CANCELLED
                  └-> TIMED_OUT
```

`ExecutionRequest` には job、test case、visibility、空でない冪等キーが必要である。デフォルトキーは `job.runId:testCase.id` で、同時に SHA-256 フィンガープリントも計算する。つまり「同じキー」とは文字列が同じというだけでなく、payload の一致も検査できる。

## Provider が入口の制約を担う

[CodeExecutionProvider](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java) は入口で次の境界を適用する。

- 同期 `execute` は `PUBLIC_PREVIEW` だけを受け付ける。
- 業務エラーは型付きの `RpcResult` に変換され、呼び出し側が任意の文字列を解析する必要はない。
- 非同期 submit は一つの test case に制限される。
- 完了、キャンセル、タイムアウト後に metadata を回収する。ただし失敗状態は引き続き照会できる。
- metadata は 1024 件、TTL は 15 分に制限される。

これらは保守的に見えるが、プレビュー API が容量上限のないグローバルなタスク管理器へ変質するのを防ぐ。

## Adapter は交換できるが、意味はずれてはいけない

Docker はデフォルトの非同期 runtime で、Judge0 は任意の adapter である。Docker と Judge0 の両方に冪等 replay テストがあり、同じ冪等キーの終端 receipt は再生できる一方、payload が異なる場合は同じ handle を無条件に再利用できない。

実行 backend を交換するときに守るべきなのは adapter 内部 API ではなく、入力フィンガープリント、状態不変条件、キャンセルの意味、終端結果というコントラクトである。

## 現在の未完了点：receipt は永続キューではない

アーキテクチャ文書は、非同期 receipt metadata がプロセス内メモリに制限されていることを明記している。複数レプリカや再起動後の durable idempotency は未完成で、外部 Judge0 インスタンスもデフォルトでは検証されない。したがって、この記事が言えるのは「上限付きの非同期実行 seam」を実装しているということまでであり、「どの再起動後でもタスクを復元できる」とは言えない。

## LLM/Agent システムへの適用

Agent のタスクにも明確な `QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED/TIMED_OUT` 状態、冪等キー、入力フィンガープリント、metadata 上限を持たせるべきである。ユーザーが「実行を続ける」を繰り返し押したり、複数の Agent が同じタスクを引き継いだりする場合、payload の衝突は明示的に返し、古い結果を黙って再利用してはいけない。

## 最小検証経路

[AsyncSandboxExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) と [CodeExecutionProvider.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java) を読み、[DockerAsyncSandboxAdapterTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/DockerAsyncSandboxAdapterTest.java) と [Judge0AsyncSandboxAdapterTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/Judge0AsyncSandboxAdapterTest.java) を照合する。

