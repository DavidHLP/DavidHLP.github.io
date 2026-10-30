---
title: "UltiCode の Data Owner と fact snapshot：サービス間 submit の境界を保つ"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, DataOwner, Contract, Port, Projection, Snapshot, LLM]
description: "UltiCode の owner 分割と SubmissionFactsSnapshot から、サービス間 submit に必要な事実の出所・取得時刻・schema version を明示的なコントラクトにする方法を説明する。"
toc: true
---

> **証拠の状態**：この記事は UltiCode の固定コミット f801a1076 のアーキテクチャ文書とソースに基づく。「Repository Implemented」はリポジトリに対応する設計と実装があることを示すだけで、本番検証を意味しない。

オンライン判定の submit API は単純に見える。ユーザーがコードを送り、システムが問題を見つけ、Judge に渡す。しかし「問題を見つけること」と「ユーザーが有効であることの確認」はサービス間の事実である。Submission が自分のデータベーストランザクション内で App、Auth、Contest を都度照会すると、書き込み経路がリモート呼び出し、権限判断、時系列の整合性まで引き受けることになる。

UltiCode は先に data owner の境界を定め、submit に必要な外部事実を不変 snapshot に集約する。重要なのは DTO を増やすことではなく、「事実を誰が供給し、いつ取得し、どの version で解釈するか」を検査可能な入力コントラクトにすることである。

## まず事実の owner を決める

現在のアーキテクチャ文書は、五つの Data Owner と二つの Worker に分けている。

| 役割 | 所有する事実と書き込み | 境界 |
|---|---|---|
| Auth | identity、credential、refresh state、RBAC、JWKS | 他 owner の業務テーブルを書かない |
| Admin | 管理、監査、設定、monitoring、backup、read model | App/Submission の domain write を引き取らない |
| App | user profile、problem、contest、community、interaction、subscription | Submission の結果を直接所有しない |
| Submission | submission、判定状態、generation、lease、結果、judge outbox | Problem、TestCase、Contest table を書かない |
| Notification | notification、preference、delivery ledger、email、retry | 通知状態を各業務 owner に分散させない |
| Judge/Search Worker | 判定実行または派生 search index | 業務 table を書かず、HTTP 業務入口を持たない |

出典：[owner と module の境界](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/modules.md)。owner 間の呼び出しには provider-owned contract または consumer-owned port を使い、shared Entity、Mapper、業務 Service を統合プロトコルにしない。

## Submission は不変の fact snapshot を受け取る

App 側の [RemoteSubmissionWritePort](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java) は remote submit 前に次を取得する。

- userId と userExists。
- problem id、title、slug、time limit、memory limit、starter code。
- capturedAtEpochMillis と schemaVersion。

Submission API はこれらの事実を [SubmissionFactsSnapshot](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) で受け取る。中心的な検証は次のようにまとめられる。

```java
return schemaVersion == CURRENT_SCHEMA_VERSION
        && userExists
        && Objects.equals(userId, requestedUserId)
        && problem != null
        && Objects.equals(problem.id(), requestedProblemId);
```

これは App の database を Submission に複製することではない。一つの request に必要な最小事実を version 付き input として包む。Submission は暗黙の remote query で「この id が今何を意味するか」を決めず、自分の transaction 内で snapshot を検証し Pending を書き込める。

## この設計が実際に解決すること

第一に、Submission の依存面を小さくする。書き込み側が依存するのは App/Auth の実装詳細ではなく、SubmissionIntakePort と snapshot contract である。

第二に、テストが明確な境界を構成できる。ユーザーが存在しない、schema version が古い、snapshot 内の problem id と request が一致しない、といった条件をシステム全体を起動せずに検証できる。

第三に、非同期判定のために request 時点の context を保持できる。後で retry するとき、task が持つのは既に確定した input であり、consumer が変更された可能性のある表示情報を読み直す必要はない。

## 過剰に解釈してはいけないこと

fact snapshot は完全な認可証明でも、owner 間の global consistency protocol でもない。snapshot の期限、problem の取消、ユーザー権限の変更、Contest admission、sensitive field の秘匿には別の規則が必要である。解決するのは submit write がどの取得済み事実に依存するかであり、identity や業務 policy のすべてではない。

## LLM/Agent システムへの適用

LLM tool call にも request 時点の事実が必要である。アクセス可能な file、user permission、tool/model version、input summary、resource limit などである。これらを timestamp と schema 付きの snapshot にすれば、長い chain の各 Agent が global state を都度照会するより、再現、監査、期限切れ拒否が容易になる。

## 最小検証経路

[SubmissionFactsSnapshot.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) と [RemoteSubmissionWritePort.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java) を読み、[SubmissionFactsSnapshotTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/submission/port/SubmissionFactsSnapshotTest.java) を確認する。テストファイルの存在はソース上の証拠であり、この記事はこのラウンドで実行・成功したとは書いていない。

