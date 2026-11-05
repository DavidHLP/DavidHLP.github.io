---
{
  "variant": "java-vue",
  "title": "Java + Vue",
  "lang": "ja",
  "role": "Java + Vue フルスタック開発エンジニア",
  "summary": "2026 年卒。セキュリティ製品のバックエンド実習を経験し、Java と Vue 3・TypeScript・Nuxt 4 で業務画面、API 連携、異常処理を実装。"
}
---

## <span class="resume-section-number">[ SEC 00 ]</span> 主な強み

- **一連の業務フロー**：UltiCode の問題・提出・判定・管理画面を連携。実ブラウザー/Judge でログイン、AC/WA、再判定、順位表を検証。
- **管理・分析画面**：BossAnalyze でユーザー表・フォーム、ロール認可ツリー、求人の絞り込み・図表・ページングを実装し、既存 Java/Spark API を利用。
- **契約と異常処理**：更新後の CSRF 再送、キャッシュの時刻、紹介文の長さ制約を修正。実 API・ブラウザーフィクスチャー・書込検証の境界を区別。

## <span class="resume-section-number">[ SEC 01 ]</span> 実習経験

### 博彦科技（Beyondsoft）

<p class="resume-meta">2026.01 - 2026.06</p>

<p class="resume-meta">バックエンド開発インターン｜Alibaba Cloud 専有クラウド・Aegis ホストセキュリティ</p>

- **リソース連携**：Alibaba Cloud 専有クラウドの Aegis セキュリティ製品のバックエンド開発に参加。プラットフォーム/ECS/BMS/BMCP と連携し、GPU 情報の取り込み・集約を独力で実装して統計・絞り込み・関連検索を支援。
- **AI 資産識別**：機能開発に参加し、OpenClaw/Ollama のテスト用コンテナーを独力で構築。コンテナー状態、GPU 関連、脆弱性データから資産状態・関連付け・リスク表示を実装。
- **検索最適化と障害修正**：SQL 実行計画、インデックス、条件、対象フィールドを調整し、一覧/統計検索の時間を短縮。Arthas `watch` / `trace` / `stack` で経路・時間・例外・引数を調べ、不具合修正と回帰検証を独力で実施。
- **イメージ信頼チェーン調査**：containerd による Harbor プライベートイメージ取得時の TLS 障害を特定。CA、`certs.d`、`hosts.toml`、`imagePullSecrets`、ノードキャッシュを調べ、診断スクリプトとチェックリストを整備。

## <span class="resume-section-number">[ SEC 02 ]</span> プロジェクト経験

### オンラインプログラミング評価システム UltiCode [GitHub](https://github.com/DavidHLP/UltiCode)

<p class="resume-stack">Java 17 / Spring Boot 4 / Spring Security / MySQL / Redis Streams / Vue 3 / TypeScript / Docker</p>

個人開発の OSS 評価システム。利用者向けの問題・提出・判定結果と、管理側の問題・コンテスト操作を接続。バックエンドは業務 Owner サービスと独立 Judge Worker で構成。

- **業務フロー全体の接続**：問題閲覧、コード編集、提出、判定結果の画面を連携。ブラウザーと実 Judge の検証で、ログイン、AC/WA、管理側編集の読み戻し、再判定、順位表を確認。
- **認証とリクエスト再送**：Cookie セッション・CSRF とバックエンドの更新処理を連携。認証更新後の再送では新 CSRF トークンを付け、元のペイロード、アカウント紐付け、再試行一回の制限を保持。
- **バックエンドの信頼性**：トランザクショナル Outbox と Redis Streams で配信し、Lua で重複排除とキュー追加を結合。`generation` + `attemptId`、リース、SQL CAS で古い判定による上書きを防ぐ。
- **実行と検証**：Docker で信頼できないコードのネットワーク・権限・資源を制限。実 MySQL の新規導入・アップグレード移行とブラウザー業務検証を CI に組み込み、成果物の署名・来歴を照合。

### BossAnalyze 求人データ分析 [GitHub](https://github.com/DavidHLP/BossAnalyze)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spark / Scala / Vue 3 / TypeScript / Nuxt 4 / shadcn-vue / MySQL</p>

既存 Java/Spark API を使って管理・求人分析画面を再構築。契約、認可規則、保存済みデータを保ち、実 API 連携、状態表示、異常処理を重点的に扱う。

- **管理画面の操作**：既存ユーザー/ロール API で検索・ページング、詳細/作成/編集フォーム、認可ツリーを実装。未保存変更の保護、権限読戻し、誤削除防止を追加。
- **分析画面とコンポーネント**：都市・職種の絞り込み、標本概要、SVG 散布図、クライアント側ページング、読み取り専用の求人詳細、独立した給与順位を実装。既存の四種類の Spark 読み取りを再利用。
- **認証と権限**：分析ルートはログイン必須で、認証後に元のルートへ戻る。一般アカウントは分析を利用でき、未許可の管理ルートは引き続き 403。画面入口によってサーバー権限を拡張しない。
- **データと操作状態**：空データ、給与不明、数値ゼロを区別し、読み込み、失敗、再試行に対応。外部出典リンクは実行可能プロトコルや認証情報を含む URL を拒否。
- **契約不整合の修正**：共有パーサーでキャッシュの整数ミリ秒タイムスタンプと有効な日付文字列を処理。紹介文の作成・編集を既存 `varchar(255)` に揃え、超過入力は黙って切り詰めず送信を拒否。
- **回帰とレスポンシブ検証**：フロントエンドテスト、Nuxt 型検査、ビルドを通過。絞り込み引数、ページング、詳細、狭い画面を検証。実 API は空 DB で確認し、データありの図表とページングはブラウザーフィクスチャーで別途検証。 管理画面の書込はブラウザーでの通信差替えのみで検証し、実アカウントには実行していない。

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

**[codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)**：Oh My Pi クライアント接続、MCP 登録、インストール・アンインストールと利用者設定の保護に貢献。Linux の信頼できるシステムパスとの互換性を修正し、回帰テストを追加。

### 代表的な技術知識頁

- [Java 性能障害：現象から証拠への最小判断木](/blog/legacy/note/ja/java-online-performance-debug/)：プロセス、スレッドスタック、GC、Arthas の観測をつなぎ、影響の抑制・証拠保全・問題特定・復旧の手順を整理。
- [UltiCode Outbox と Redis Streams：判定タスクの配送を復旧可能な状態にする](https://davidhlp.github.io/blog/legacy/note/ja/ulticode-outbox-redis-streams/)：トランザクション Outbox、原子的な配送、再試行、デッドレターと未確認メッセージの回収を整理。
