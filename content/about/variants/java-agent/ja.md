---
{
  "variant": "java-agent",
  "title": "Java + Agent",
  "lang": "ja",
  "role": "Java バックエンド / Agent アプリケーション開発",
  "summary": "Java バックエンドを基盤に Python Agent と業務 API を連携し、ツール呼び出し、認証の隔離、永続化、復元可能な業務操作に取り組みます。"
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

<p class="resume-stack">Java 17 / Spring Boot 3 / Spring Security / MySQL / Redis Streams / Dubbo / Flyway / Docker</p>

個人開発の OSS 評価システム。Java サービスが認証・問題・提出・業務記録を保持し、独立した Judge Worker が判定を実行。Agent は既存 HTTP 契約から業務に接続する。

- **信頼性の高い配信**：提出と Outbox を同一トランザクションで記録し、Redis Streams へバックオフ再試行付きで配信。Lua で重複排除マーカーとキュー追加をまとめ、タイムアウト回収とデッドレターで障害区間に対応。
- **実行結果の競合制御**：`generation` + `attemptId`、リース、ハートビートで有効な実行を識別。SQL CAS が古い判定を拒否し、Docker が信頼できないコードの権限と資源を制限。
- **認証と検証**：リフレッシュトークンをハッシュで保存し、一度限りの消費とトランザクション内の更新に対応。実 MySQL 移行、ブラウザー・Judge のログイン、AC/WA、再判定、順位表を CI で検証。

### UltiCode Agent 業務連携（実験機能） [ソース](https://github.com/DavidHLP/UltiCode/tree/main/services/agent)

<p class="resume-stack">Python / FastAPI / httpx / LangGraph / SQLite / SSE / MCP / Java Auth & App API</p>

本人の通常練習提出を対象に、制御された分析、複数ターンの会話、任意の学習計画を提供。認証と業務データの権限は Java が保持し、Agent は私有会話とローカルワークフロー状態を管理する。

- **信頼できる認証とツール境界**：Java `/auth/me` で本人を確認し、リクエストごとに Cookie クライアントを分離。許可リスト内の読み取り専用ツールだけを公開し、引数と返却フィールドを検査・投影。モデルによる所有者の指定や書き換えを許可しない。
- **有界のモデル・ツールループ**：LangGraph でモデル、ツール、結果を編成し、ラウンド数と総時間を制限。ツール失敗、上限超過、キャンセルを区別し、ツール結果をデータとして扱って越権命令には従わない。
- **会話とチェックポイント**：SQLite で owner、conversation/turn、thread/run、草稿バージョンを管理。復元時に所有権を再検査し、キャンセルのフェンスで古い実行の保存を防ぐ。会話履歴と学習計画スレッドは分離。
- **明示確認と結果照合**：編集後は古い確認を無効化し、保存前に現行バージョンとダイジェストへ結び付けた確認を別途要求。Java の書き込み結果が不明なら未確定状態を保ち、同じ冪等キーで読み戻す。新しいキーで盲目的に再試行しない。
- **資料と MCP 投影**：出典の範囲・バージョン・位置を保持。許可済みソースコードはリクエスト内だけで利用し、会話・イベント・チェックポイントへ保存しない。任意の stdio MCP は認証済みクライアントと厳密な投影を再利用し、本人の提出一覧だけを公開。

<p class="resume-meta">ライブ分析と永続化は個別に明示的に有効化。再現可能な実装経験であり、本番配備や実ユーザーによる試行の完了を意味しない。</p>

## <span class="resume-section-number">[ SEC 03 ]</span> 専門スキル

### Java バックエンドと信頼性

- Java、Spring Boot、Spring Security、MyBatis-Plus に習熟。API 設計、認証・認可、MySQL 最適化、トランザクション境界の実践経験。
- Redis のキャッシュ保護、分散ロック、Streams、Outbox、Docker 隔離の実装経験。再試行、重複消費、結果整合性を理解。
- Arthas、SQL 実行計画、Linux、コンテナーログで調査し、並行テスト、Testcontainers、CI で障害条件を検証。

### Agent アプリケーションと業務連携

- Python、FastAPI、httpx、LangGraph の実装経験。既存 Java API を使い、ツール呼び出し、タイムアウト、キャンセル、ストリームイベントを構成。
- サーバー認証、許可ツール、フィールド投影、資料の同意とコンテキスト境界を実践。モデルの提案、利用者の確認、業務書き込みを区別。
- SQLite の会話・チェックポイント、所有権・バージョン検査、冪等保存、不明な結果の照合を実践。制御されたテスト、実サービス検証、本番提供を区別。

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
