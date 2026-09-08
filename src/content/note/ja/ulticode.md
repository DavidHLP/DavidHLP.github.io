---
title: "UltiCode：オンラインジャッジプラットフォームのモジュール型アーキテクチャとドメイン境界"
timestamp: 2026-08-21 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: entity
status: provisional
sources: ["ulticode-project-context"]
related: ["microservice-data-ownership", "dubbo-nacos-runtime", "jjwt-013-security-api", "multi-service-readiness", "database-schema-drift"]
tags: [UltiCode, OnlineJudge, DDD, Port, Projection, Dubbo, Nacos, Sandbox]
description: "固定コミットの README/CONTEXT を証拠として、UltiCode の owner 分割、port/projection による深いモジュール構造、ジャッジトランザクション不変条件、移行期の互換 seam を整理し、アーキテクチャ収束中の不確実性を明示する。"
toc: true
---

> **卒業条件（検証可能な 3 項目）**：
> 1. ジャッジトランザクションの最小 E2E 検証実験（port/projection のトランザクションロールバック）；
> 2. モジュール owner 境界が破られた場合の反例とリファクタリング証拠；
> 3. Redis Streams の消費と並行処理境界について、明確な宣言とテストを補うこと。

`UltiCode` は問題集、コンテスト、コミュニティ、実績、管理バックエンドを扱うフルスタックのオンラインジャッジ（Online Judge）プラットフォームである。バックエンドは Java 17 + Spring Boot 3.2.5 の Maven reactor マルチモジュール（auth/admin/app/notification/judge/submission）、フロントエンドは Vue 3 + TypeScript strict モードの Console と Management の 2 アプリケーションで構成される。本ページは公開リポジトリ main の固定コミット `3f14ac89` の宣言状態を扱う。リポジトリはアーキテクチャ収束中のため、ページ全体を `provisional` とする。

## コアメカニズム

### Owner 分割とゲートウェイ

- 各 API ゲートウェイルートは 1 つの owner に対応する：Auth :9101、Admin :9102、App :9103、Notification :9105。認証は JWT + Redis Session。
- Submission は互換 owner seam（:9106 / 内部 Dubbo 20886）であり、移行期にあって業務 HTTP は持たない。Judge worker は独立プロセスとして Redis Streams を消費する。
- 基盤は MySQL 9.1（Flyway マイグレーション）、Redis 7、Nacos 2.3.2 のレジストリ／設定センターである（実行時の登録境界は [Dubbo + Nacos](/note/dubbo-nacos-runtime) を参照）。

### Port / Projection の深いモジュールパターン

- **Port**：利用側モジュールが所有し、提供側モジュールが適応実装するインターフェース（依存性逆転）。例は `ContestSubmissionPort`、`TokenBlacklistPort`、`CurrentUserProvider`。`TokenBlacklistPort` は読み取り側だけを公開し、fail-closed である。Redis 障害時に失効済みトークンを通してはならない。
- **Projection**：各ドメインが深いモジュールとして entity → VO 投影と読み取り側集約（`ProblemProjection`、`AdminXxxProjection` 系列）を所有し、VO の整形をオーケストレーションサービスから下ろす。
- **Realtime push seam**：6 つの利用側モジュールが保有する push port によって WebSocket パスを反転し、旧 `RealtimeService` god service を削除した。

### ジャッジトランザクションの不変条件

- Submission と ContestSubmission は**同一トランザクション**内で同期記録する（D-04）。コンテスト後のスコアリングは AFTER_COMMIT イベント駆動で行う。
- ContestSubmission はコンテストが RUNNING かつ参加者が STARTED の場合だけ記録する（D-05/D-06）。仮想コンテストでの Accepted は実績を発火しない（R6.3/F-08）。
- HIDDEN テストケースの内容はユーザーに決して公開してはならない（P0-1）。

## 適用条件

- 問題演習、コンテスト、コミュニティ、管理の一連の流れが必要なオンラインジャッジ／社内研修プラットフォーム。
- マルチモジュール単一リポジトリ、モジュール固有ドメイン（`modules/`）、明示的な port 境界による協業を受け入れられるチーム。

## 非適用条件とリスク

- アーキテクチャ文書は収束中である。Submission 互換 seam と Admin read model seam には「future phases」の未完了項目があり、インターフェース形状は変わる可能性がある。
- 旧 `wiki/concepts/` ADR 層は 2026-07-09 に退役した。設計根拠は commit message とソース Javadoc に分散しており、追跡コストが高い。
- README のポートとバージョンは開発時の状態を示すもので、本番デプロイでは検証していない。

## 最小検証

1. Docker Compose で基盤を起動し、`scripts/dev` の初期化フローを実行する。Nacos の登録とゲートウェイルートのヘルスを確認する（マルチサービス準備ゲートは [multi-service-readiness](/note/multi-service-readiness) を参照）。
2. コードを 1 件提出し、Submission → Judge outbox → verdict → AFTER_COMMIT スコアリングのチェーンを検証する。
3. Flyway マイグレーション履歴とローカル schema を照合し、ドリフトを確認する（方法は [Database Schema Drift](/note/database-schema-drift)）。

## 証拠と不確実性

- **ソース事実**：アーキテクチャ図、owner 分割、ドメイン用語、不変条件は固定コミット `3f14ac89` の README と CONTEXT.md（`ulticode-project-context`）に基づく。
- **本ページの統合**：用語集を「owner—seam—不変条件」の 3 層に整理した。
- **未確認**：ローカルワークスペースは `origin/main` より 25 コミット先行しているが、その未公開リファクタリングは含めない。Sandbox D-form の隔離強度、ジャッジスループット、ランキング規則の正しさは独立した実験で再検証していない。

## 関連ページ

- [microservice-data-ownership](/note/microservice-data-ownership)
- [dubbo-nacos-runtime](/note/dubbo-nacos-runtime)
- [jjwt-013-security-api](/note/jjwt-013-security-api)
- [multi-service-readiness](/note/multi-service-readiness)
- [database-schema-drift](/note/database-schema-drift)
