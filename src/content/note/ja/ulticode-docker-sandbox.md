---
title: "UltiCode Docker sandbox：リソース隔離とインフラエラーの分類"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Docker, Seccomp, Sandbox, ResourceLimit, ErrorHandling, LLM]
description: "UltiCode の D-form 実行経路から、Docker のリソース・安全パラメータ、seccomp の fail-closed、ユーザーエラーとインフラエラーの分類を整理する。"
toc: true
---

> **証拠の状態**：この記事は固定コミット時点の UltiCode Docker executor、エラー分類器、sandbox テストに基づく。明確な隔離と分類の境界が実装されていることを示すが、完全なコンテナ脱出監査や本番安全性の証明ではない。

ユーザーコードを実行する難しさは、単にプロセスを起動することではない。コードがホストのリソースへ容易に影響できないようにし、さらに「ユーザーコードが失敗したのか、Docker/ホストが失敗したのか」をプラットフォームが判別できなければならない。両方を同じ Runtime Error にすると、正しいユーザー通知もインフラの再試行判断もできない。

## D-form 実行経路

D-form の [SandboxExecutorImpl](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) は次を行う。

1. 言語 profile と有効なリソース制限を解決する。
2. 一時 job workspace を作成する。
3. 読み取り専用の `input.json` と workspace の内容を書き込む。
4. lifecycle runner 経由で Docker を起動する。
5. 結果 envelope を解析する。
6. `finally` で job directory の削除を試みる。

## 安全性とリソースのパラメータは明示される

現在の Docker コマンドには次が含まれる。

```text
--network none
--cap-drop ALL
--read-only
--user 1000:1000
--security-opt no-new-privileges
--security-opt seccomp=<resolved profile>
--memory <effective limit>
--cpus <effective limit>
--pids-limit <effective limit>
--ulimit nofile=128:128
--tmpfs /tmp:rw,exec,size=64m
<workspace>:/workspace:ro
--rm
```

このパラメータ群は、ネットワーク、Linux capability、ファイルシステム、ユーザー ID、プロセス数、file descriptor、CPU/メモリに多層の境界を作る。seccomp profile の解決に失敗してもフィルターを黙って削除せず、エラーを保持して Docker に明確な設定エラーを返させる。

これは fail-closed の動作である。設定が不完全なら実行を拒否し、「今は動く」ことを隔離が有効である証拠にしない。

## 一つの `FAILED` より分類が重要

[SandboxOutcomeClassifier](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java) は結果を次のように分ける。

| 現象 | 分類 |
|---|---|
| プロセス自体の起動に失敗 | launch failure |
| exit code 137 | out of memory |
| exit code 125 | OCI/daemon error |
| `Cannot fork`、pids、`RLIMIT_NPROC` | fork limit |
| compiler がコードを拒否 | compile error |
| その他の非ゼロ終了 | runtime error |

したがって Docker daemon がコンテナを作成できなかった場合、seccomp path が不正な場合、ホストの pids リソースが不足する場合でも、通常のユーザープログラム実行エラーには偽装されない。この分類は monitoring、retry、ユーザー向けメッセージとも一致させる必要があり、そうでなければ分類器は見栄えのよい enum に過ぎない。

## 安全境界は正直に説明する必要がある

これらは重要な防御層だが、ソースを読むだけで「脱出を完全に防ぐ」とは証明できない。実際の安全性の結論には、対象 Docker、kernel、image、Rootless/remote daemon、権限設定に対する専用テストと監査が必要である。この記事が確認するのは、実装に fail-closed パラメータとインフラエラー分類が存在することまでである。

## LLM/Agent システムへの適用

モデル生成コード、plugin、tool script は信頼できない実行入力として扱うべきである。コンテナ隔離に加え、ファイル、ネットワーク、プロセス、時間、出力サイズの上限を明示する必要がある。また provider/権限拒否とモデル生成エラーを分けることで、Agent は入力を変えるのか、認可を求めるのか、インフラを再試行するのかを判断できる。

## 最小検証経路

[SandboxExecutorImpl.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) と [SandboxOutcomeClassifier.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java) を読み、[SandboxExecutorImplForkDetectionTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplForkDetectionTest.java) と [SandboxExecutorImplSeccompResolutionTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplSeccompResolutionTest.java) を確認する。

