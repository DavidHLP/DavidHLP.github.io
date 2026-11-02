---
{
  "variant": "java-vue",
  "title": "Java + Vue",
  "lang": "ja",
  "role": "Java + Vue フルスタック開発エンジニア",
  "summary": "Java バックエンドを中心に Vue 3・TypeScript・Nuxt 4 の画面と API 連携を実践し、業務フロー、認可境界、異常処理を重視しています。"
}
---

## <span class="resume-section-number">[ SEC 01 ]</span> 実習経験

### 博彦科技（Beyondsoft）

<p class="resume-meta">2026.01 - 2026.06</p>

<p class="resume-meta">バックエンド開発インターン｜Alibaba Cloud 専有クラウド・Aegis ホストセキュリティ</p>

- **業務背景**：Aegis ホストセキュリティ製品のサーバー開発に参加し、クラスターリソースの取り込み、AI 資産識別、検索最適化、本番環境の障害診断を担当。
- **GPU 資源取り込み**：プラットフォーム、ECS、BMS、BMCP などのチームと連携し、クラスター側 GPU 情報の取り込み・集約を独力で実装。統計、条件による絞り込み、関連検索を支援。
- **AI 資産識別**：機能開発に参加し、OpenClaw・Ollama のテスト用コンテナー環境を独力で構築。コンテナーの状態、GPU の関連情報、脆弱性データから、資産状態の判定、GPU との関連付け、リスク表示を実装。
- **複雑な検索の最適化**：SQL 実行計画を分析し、インデックス、検索条件、カバーするフィールドを調整して、リソース一覧・統計 API のクエリ時間を短縮。
- **本番環境の問題特定**：Arthas `watch` / `trace` / `stack` で呼び出し経路、処理時間、例外スタック、重要な引数を調べ、不具合の特定・修正・回帰検証を独力で実施。
- **コンテナーイメージの障害診断**：containerd による Harbor プライベートイメージ取得時の TLS 証明書検証・信頼チェーンの問題を特定。CA、`certs.d`、`hosts.toml`、`imagePullSecrets` とノードのキャッシュを調べ、診断スクリプトとチェックリストに整理。

## <span class="resume-section-number">[ SEC 02 ]</span> プロジェクト経験

### オンラインプログラミング評価システム UltiCode [GitHub](https://github.com/DavidHLP/UltiCode)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spring Security / MySQL / Redis Streams / Vue 3 / TypeScript / Docker</p>

個人開発の OSS 評価システム。利用者向けの問題・提出・判定結果と、管理側の問題・コンテスト操作を接続。バックエンドは業務 Owner サービスと独立 Judge Worker で構成。

- **業務フロー全体の接続**：問題閲覧、コード編集、提出、判定結果の画面を連携。ブラウザーと実 Judge の検証で、ログイン、AC/WA、管理側編集の読み戻し、再判定、順位表を確認。
- **認証とリクエスト再送**：Cookie セッション・CSRF とバックエンドの更新処理を連携。認証更新後の再送では新 CSRF トークンを付け、元のペイロード、アカウント紐付け、再試行一回の制限を保持。
- **バックエンドの信頼性**：トランザクショナル Outbox と Redis Streams で配信し、Lua で重複排除とキュー追加を結合。`generation` + `attemptId`、リース、SQL CAS で古い判定による上書きを防ぐ。
- **実行と検証**：Docker で信頼できないコードのネットワーク・権限・資源を制限。実 MySQL の新規導入・アップグレード移行とブラウザー業務検証を CI に組み込み、成果物の署名・来歴を照合。

### BossAnalyze 求人データ分析 [GitHub](https://github.com/DavidHLP/BossAnalyze)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spark / Scala / Vue 3 / TypeScript / Nuxt 4 / shadcn-vue / MySQL</p>

既存 Java/Spark API を使って管理・求人分析画面を再構築。契約、認可規則、保存済みデータを保ち、実 API 連携、状態表示、異常処理を重点的に扱う。

- **分析画面とコンポーネント**：都市・職種の絞り込み、標本概要、SVG 散布図、クライアント側ページング、読み取り専用の求人詳細、独立した給与順位を実装。既存の四種類の Spark 読み取りを再利用。
- **認証と権限**：分析ルートはログイン必須で、認証後に元のルートへ戻る。一般アカウントは分析を利用でき、未許可の管理ルートは引き続き 403。画面入口によってサーバー権限を拡張しない。
- **データと操作状態**：空データ、給与不明、数値ゼロを区別し、読み込み、失敗、再試行に対応。外部出典リンクは実行可能プロトコルや認証情報を含む URL を拒否。
- **契約不整合の修正**：共有パーサーでキャッシュの整数ミリ秒タイムスタンプと有効な日付文字列を処理。紹介文の作成・編集を既存 `varchar(255)` に揃え、超過入力は黙って切り詰めず送信を拒否。
- **回帰とレスポンシブ検証**：フロントエンドテスト、Nuxt 型検査、ビルドを通過。絞り込み引数、ページング、詳細、狭い画面を検証。実 API は空 DB で確認し、データありの図表とページングはブラウザーフィクスチャーで別途検証。

## <span class="resume-section-number">[ SEC 03 ]</span> 専門スキル

### Java バックエンド

- Java、Spring Boot、Spring Security、MyBatis-Plus、MySQL に習熟。API 設計、認証・認可、SQL 実行計画、インデックス最適化の実践経験。
- Redis キャッシュ保護、分散ロック、Streams、Outbox、Dubbo、Docker の実装経験。トランザクション境界、再試行、結果整合性を理解。
- Arthas、Linux、コンテナーログ、SQL 観測で問題を調査し、回帰と実サービスの確認で修正を検証。

### Vue フロントエンドと連携

- Vue 3、TypeScript、Nuxt 4、shadcn-vue の実装経験。画面のコンポーネント分割、フォーム・一覧の状態管理、レスポンシブ配置に対応。
- Cookie/CSRF、認証後の遷移、権限表示、API 解析を実践。バックエンド契約に従い、null・ゼロ・時刻・文字数制限・再試行を処理。
- フロントエンド回帰、型検査、ビルド、ブラウザー操作で業務フローを確認し、実際の保存データと画面用フィクスチャーを区別。

## <span class="resume-section-number">[ SEC 04 ]</span> 学歴・受賞

### 学歴

**洛陽師範学院**

データ科学とビッグデータ技術・学士課程

<p class="resume-meta">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</p>

### 受賞

- 2025 藍橋杯 Java ソフトウェア設計 B 組・ **全国三等賞**

- 2024 テディ杯データ分析技能競技・ **全国三等賞**

- 2023 全国大学コンピューター能力挑戦・ **全国三等賞**

## <span class="resume-section-number">[ SEC 05 ]</span> OSS 貢献と技術記録

### OSS 貢献

**codebase-memory-mcp**：[PR #1229](https://github.com/DeusData/codebase-memory-mcp/pull/1229) **マージ済み**。Oh My Pi（OMP）接続を追加し、設定ディレクトリ検出、MCP 登録、Skill の配置、インストール・アンインストールに対応し、設定の隔離と利用者コンテンツ保持のテストを追加。

[PR #2203](https://github.com/DeusData/codebase-memory-mcp/pull/2203) **マージ済み**。Linux のシステムパス別名によるインストール用ステージングの失敗を修正。root 所有の信頼できるシステム別名のみを許可し、任意のユーザー所有シンボリックリンクの拒否を維持。許可・拒否の両経路を検証。

### 代表的な技術知識頁

- [Java 性能障害：現象から証拠への最小判断木](/blog/legacy/note/ja/java-online-performance-debug/)：プロセス、スレッドスタック、GC、Arthas の観測をつなぎ、影響の抑制・証拠保全・問題特定・復旧の手順を整理。
- [containerd TLS：証明書信頼と一時検証省略の判断](/blog/legacy/note/ja/containerd-tls-troubleshooting/)：ランタイムの CA、ノードの信頼設定、Registry 認証、イメージキャッシュを区別し、段階的な診断手順を整理。
