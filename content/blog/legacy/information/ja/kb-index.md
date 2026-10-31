---
{
  "archiveId": "X-1009",
  "title": "ナレッジベース目次",
  "en": "SITE INFORMATION",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "ナレッジベース目次 · src/content/information/ja/kb-index.md",
  "findings": [
    "元の文書: src/content/information/ja/kb-index.md",
    "出典リビジョン: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/information/ja/kb-index.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "ja",
    "information"
  ],
  "draft": false,
  "lang": "ja",
  "legacy": {
    "path": "src/content/information/ja/kb-index.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  }
}
---

# ナレッジベース目次

知識庫への入口であり、時系列ブログ一覧ではない。回答時はここから読み、各ページの `sources` と相互リンクをたどる。

正典の保守言語は `zh-cn`。[LLM-Wiki パターン：LLM で蓄積する個人 AI ナレッジベース](/blog/legacy/note/ja/llm-wiki-pattern/) に従い、契約はルートの [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) と [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md) を参照。

> **収束設計**：[KB 収束設計 v1](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/docs/kb-convergence-design.md) で六域の表示に統合。`series` 列挙は変えず、学習経路と provisional 昇格板を追加。詳細は `docs/kb-convergence-design.md`。

## 案内と学習経路

**六域**：[A 知識・AI](#a-知識庫と-ai-工学) · [B Java・並行](#b-java-と並行処理) · [C 保存・キャッシュ](#c-保存とキャッシュ) · [D 分散・マイクロサービス](#d-分散システムとマイクロサービス) · [E 基盤・運用](#e-基盤と運用) · [F 工学・構成](#f-工学とアーキテクチャ) · [昇格観察](#昇格観察provisional-12-件) · [アーカイブ](#g-アーカイブと廃止) · [原始出典](#原始出典raw)

### 目的別の学習経路

1. **経路 1 — 初学者のモデル**：`llm-wiki-pattern` → `kb-session-ingest-contract` → `java-concurrency-deepdive` / `redis-business-patterns` → `java-online-performance-debug` → `multi-service-readiness`。成果：小さなテーマを独力で ingest。
2. **経路 2 — 分散システム発展**：`microservice-data-ownership` → `database-schema-drift` → `dubbo-nacos-runtime` → `spring-cloud-and-boot` → `resicache-observer-nested-execution` → `plugin-lifecycle-management`。成果：DB 分割・登録・移行の境界を判断。
3. **経路 3 — Agent 全経路**：`omp-config-and-rules-guide` → `omp-hook-extension-guide` → `headroom-compress-retrieve-contract` → `mcp-codebase-memory-workflow` → `hindsight-local-deployment` / `hindsight-omp-codex-integration` → `omp-headroom-provider-proxy`。成果：OMP/Headroom/Codex の記憶・経路をローカル再現。

### 昇格観察（provisional 12 件）

| ページ | 昇格に必要な検証 |
|---|---|
| [Headroom 単一ポートの総合：入口、動的上流、検証の境界](/blog/legacy/note/ja/headroom-single-port-evolution/) | 固定 Headroom で `/v1/messages`・`/v1/responses` 明示経路の最小 contract test、`model_cache` 再構築、`BindPaths` rollback。 |
| [Headroom ルート永続化の総合：Named Profile、model_cache、復旧](/blog/legacy/note/ja/omp-headroom-persistence/) | Named Profile 隔離の独立再現、派生 `model_cache` 削除・再構築、旧 reconciler の移行時限定条件。 |
| [Headroom と cc-switch / Claude Code の共存：単一の整理責任とセキュリティ境界](/blog/legacy/note/ja/headroom-cc-switch-coexistence/) | `8787→15721` の機密情報を除去した capture/log、二重書き込み衝突の反例、`BindPaths` 安全境界の確定。 |
| [OMP Headroom Bridge：外部ルーティングコントローラとネイティブ Codex/OMP プロキシ境界](/blog/legacy/note/ja/omp-headroom-provider-proxy/) | loopback proxy・OMP route・Codex 共通 provider の共存 smoke test、atomic restore/mode、再現可能な rollback 順。 |
| [UltiCode：オンラインジャッジと Agent 工学の検証可能な境界](/blog/legacy/note/ja/ulticode/) | owner 境界、outbox/Streams 配送、generation/attempt fence、Docker sandbox、追跡可能な release gate。 |
| [Enhanced UISA：異種ノード同期の owner・boundary・復旧モデル](/blog/legacy/note/ja/uisa-architecture-design/) | 規模・閾値の暗黙保証を再現可能な retry/冪等制約に置換、owner → 境界 → 復旧の判断木、障害行列。 |
| [Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠](/blog/legacy/note/ja/java-internship-interview-blog-polished/) | 本番止血 → 特定 → 復旧の機密情報を除去した一例、cache/非同期の固定証拠、能力モデルと証拠の分離。 |
| [データベース筆記試験の復盤：SQL セマンティクスからバッチ処理まで](/blog/legacy/note/ja/database-written-test-review/) | 固定 Oracle/MySQL/Spark/PDI の再現、`NULL`・年越し・同表読み書き test、Kettle/巨大表分割の復旧・照合。 |
| [ResiCache の cache responsibility chain：control flow、nested fragment、observer lifecycle](/blog/legacy/note/ja/resicache-handler-chain-and-observer/) | 現主線 `HandlerResult`、snapshot/fragment 境界、token 対応、例外終了。 |
| [cache stampede に Future、distributed lock、double-check が同時に必要な理由](/blog/legacy/note/ja/resicache-single-flight/) | 十並行、leader/follower/reentrant、lock 内 double-check、書き戻し失敗、instance 間境界。 |
| [非同期の早期期限切れが TTL 短縮だけを行う理由：version CAS で古い task を無効化する](/blog/legacy/note/ja/resicache-early-expiration-cas/) | 実 Redis の version 競合、Lua TTL CAS、古いタスク拒否、直接ロードせず TTL のみ短縮。 |
| [Redis serializer の交換は一行の設定変更ではない：object trust から rollback 可能な migration へ](/blog/legacy/note/ja/resicache-serialization-migration/) | 型 whitelist、streaming preflight、shadow/dual/cutover/rollback、並行書き込み保護。 |

> 昇格前は provisional のまま中核概念の主表示から外す。四半期審査で未達なら `deprecated`。

---

## A. 知識庫と AI 工学

- [LLM-Wiki パターン：LLM で蓄積する個人 AI ナレッジベース](/blog/legacy/note/ja/llm-wiki-pattern/) — raw/wiki/schema の三層と ingest/query/lint の三操作。 出典：karpathy-llm-wiki`.
- [KB セッション摂取パイプライン契約：インクリメンタル再利用、redaction v19、不変 raw](/blog/legacy/note/ja/kb-session-ingest-contract/) — 出典 ID・内容 hash、失敗の再処理、制御面フィルター、中断台帳、機密情報を除去した監査。 出典：kb-ingest-pipeline-v19`.
- [MCP プロトコル時代の境界と codebase-memory-mcp v0.10.2 のグラフワークフロー](/blog/legacy/note/ja/mcp-codebase-memory-workflow/) — 固定した modern MCP 契約と、グラフ・ソース・coverage の証拠規律。 出典：mcp-codebase-memory-workflow`.
- [Hindsight のローカル計算資源分担と Docker コンテナ化デプロイ](/blog/legacy/note/ja/hindsight-local-deployment/) — v0.9.1 当時の GPU/CPU 分担、コンテナ網、UID 境界。モデル provenance と現在の再現は未確認。 出典：hindsight-local-deployment-and-agent-integration`.
- [Hindsight 統合メモリアクセス：FastMCP ブリッジと動的マルチプロジェクトルーティング](/blog/legacy/note/ja/hindsight-omp-codex-integration/) — 当時のブリッジ、Bank の論理分割・名前衝突、MCP の不足、単回検索記録。 出典：hindsight-local-deployment-and-agent-integration`.
- [Hindsight ランタイムトラブルシューティングマトリクスと失敗モード](/blog/legacy/note/ja/hindsight-troubleshooting/) — 七つの過去障害。モデル一覧、稼働状態、構文検査、E2E 検証を区別。 出典：hindsight-local-deployment-and-agent-integration`.

## B. Java と並行処理

- [AtomicBoolean：原子ブール状態と CAS の境界](/blog/legacy/note/ja/java-atomic-boolean/) — 可視性、原子性、CAS の最小遷移と強い同期への切り替え。 出典：legacy-java-atomic-boolean`.
- [AutoCloseable：リソース所有権と close 例外の意味](/blog/legacy/note/ja/java-auto-closeable/) — try-with-resources の所有権、close 順、例外伝播。 出典：legacy-java-auto-closeable`.
- [NullValue：キャッシュ null のプレースホルダーとシリアライズ境界](/blog/legacy/note/ja/java-null-value/) — null プレースホルダーと復元によるキャッシュ貫通防止。 出典：legacy-java-null-value`.
- [Java 並行処理の深掘り：JUC、CAS、アトミック、ロックとスレッド機構](/blog/legacy/note/ja/java-concurrency-deepdive/) — CAS を軸に atomics、lock、協調、参照型を整理し ABA を明記。 出典：ingest-java-concurrency`.
- [Redisson/Jackson による LocalDateTime のデフォルト直列化挙動と書き込み・読み出し非対称の境界](/blog/legacy/note/ja/redis-jackson-java-time/) — 書き込み失敗と mapper をまたぐ読み取り失敗。 出典：redis-jackson-java-time-contract`.
- [Java 本番性能トラブルシューティング：症状から証拠への最小判断木](/blog/legacy/note/ja/java-online-performance-debug/) — CPU・thread・GC の止血 → 特定 → 復旧。 出典：legacy-java-online-performance-debug`.
- [JJWT 0.13.0：署名アルゴリズムを明示固定し、key 型で検証する](/blog/legacy/note/ja/jjwt-013-security-api/) — `signWith(Key)`/`verifyWith` の key 型と audience builder。 出典：jjwt-013-security-api-contract`, `jjwt-013-security-api-contract-correction`.

## C. 保存とキャッシュ

- [Redis ビジネスパターン：キャッシュ、分散ロック、メッセージキュー、Feed と秒殺](/blog/legacy/note/ja/redis-business-patterns/) — 一貫性・排他・意味からキャッシュと業務を整理。 出典：ingest-redis-business`.
- [Redis 永続化と原理：RDB/AOF、データ構造と高度な仕組み](/blog/legacy/note/ja/redis-persistence-principle/) — snapshot と追記ログの復旧・性能。 出典：ingest-redis-persistence`.
- [Redis 黒馬実践：分散キャッシュ、マルチレベルキャッシュとベストプラクティス](/blog/legacy/note/ja/redis-heima-practice/) — 200 頁以上から抽出した一覧と版の不足。 出典：ingest-redis-heima`.
- [MySQL ストレージエンジンとデッドロック検出](/blog/legacy/note/ja/mysql-storage-and-deadlock/) — engine の能力と deadlock log の経路。 出典：ingest-mysql-storage`.
- [データベース筆記試験の復盤：SQL セマンティクスからバッチ処理まで](/blog/legacy/note/ja/database-written-test-review/) — join、`NULL`、index、日付方言、四表 SQL、Kettle、巨大表を意味 → 方言 → 実行境界で整理。 出典：database-written-test-review`.
- [HBase 基礎・アーキテクチャと運用：データモデル、テーブル設計、Shell と Java API](/blog/legacy/note/ja/hbase-foundation-and-ops/) — 論理・物理モデル、構成要素、表設計、RDBMS との取捨選択。 出典：ingest-hbase-foundation`.
- [Spark とビッグデータエコシステム：Hadoop、HBase、Spark 実行モードとクラスタ](/blog/legacy/note/ja/spark-bigdata-ecosystem/) — batch/stream engine と実行モード。 出典：ingest-spark-ecosystem`.
- [MySQL パフォーマンス切り分け：現象 → 指標 → 層 → 安全な緩和](/blog/legacy/note/ja/mysql-performance-troubleshooting/) — 接続、lock、index、transaction、IO、Buffer Pool。 出典：legacy-mysql-performance-troubleshooting`.

## D. 分散システムとマイクロサービス

- [Dubbo + Nacos：登録名と group/version を先に確認してから、本物の smoke test を実行する](/blog/legacy/note/ja/dubbo-nacos-runtime/) — interface/application 登録、metadata、起動検査。 出典：dubbo-nacos-runtime-registration`, `dubbo-nacos-runtime-registration-correction`.
- [Spring Boot と Spring Cloud：自動構成、トランザクション、サービス検出、ゲートウェイと可観測性](/blog/legacy/note/ja/spring-cloud-and-boot/) — 登録・発見を軸に呼び出し経路を確認。 出典：ingest-spring-cloud`.
- [マイクロサービスデータ所有権：領域 owner を先に決めてから、DB 分割と移行を考える](/blog/legacy/note/ja/microservice-data-ownership/) — bounded context、private schema、saga/outbox、`expand→migrate→contract`。 出典：microservice-domain-data-ownership`, `microservice-domain-data-ownership-correction`.
- [データベース Schema ドリフト：history、schema、query の三ビューで特定する](/blog/legacy/note/ja/database-schema-drift/) — Flyway history・実 schema・アプリ query。repair は DDL rollback ではない。 出典：database-schema-drift-contract`.
- [ResiCache：observer のネスト実行はライフサイクル、fragment、scope token を区別しなければならない](/blog/legacy/note/ja/resicache-observer-nested-execution/) — ロック内続行の固定ソース、実行可能な寿命モデル、反例。モデルと実並行テストを区別。 出典：resicache-observer-nested-execution-contract`.
- [マルチサービス起動レディネス：running、ready と依存/失敗/再起動の伝播](/blog/legacy/note/ja/multi-service-readiness/) — Compose/systemd の順序、依存、健康ゲート。 出典：multi-service-readiness-contract`, `multi-service-readiness-contract-correction`, `multi-service-readiness-safety-correction`.

## E. 基盤と運用

- [Docker 基礎：イメージレイヤー、コンテナ操作と Compose ネットワーク](/blog/legacy/note/ja/docker-fundamentals/) — 階層、volume、network、Compose の範囲。 出典：ingest-docker-fundamentals`.
- [containerd TLS：信頼チェーンと一時的な検証スキップの判断](/blog/legacy/note/ja/containerd-tls-troubleshooting/) — CA trust、runtime 設定、Kubernetes 認証、cache。 出典：legacy-containerd-tls-troubleshooting`.
- [SSH 内網アクセス：接続方向・公開面・障害復旧](/blog/legacy/note/ja/intranet-penetration-ssh-guide/) — Tunnel、Tailscale、FRP の比較。 出典：legacy-intranet-penetration-ssh-guide`.
- [Testcontainers 1.20.6：Docker API バージョンを先に切り分けてから、daemon の利用不可を判断する](/blog/legacy/note/ja/testcontainers-docker-api/) — 固定 `1.32` fallback、`api.version`、HTTP 400 の診断。 出典：testcontainers-docker-api-negotiation`, `testcontainers-docker-api-negotiation-correction`.
- [百万端末のプラグインライフサイクル管理：状態・ハートビート・制御されたリリース](/blog/legacy/note/ja/plugin-lifecycle-management/) — 状態、統合 heartbeat、冪等性、段階配信、遮断。 出典：legacy-plugin-lifecycle-management`.
- *運用障害調査は B 域の [Java 本番性能トラブルシューティング：症状から証拠への最小判断木](/blog/legacy/note/ja/java-online-performance-debug/) も参照。*

## F. 工学とアーキテクチャ

### エンティティ

- [OMP Headroom Bridge：外部ルーティングコントローラとネイティブ Codex/OMP プロキシ境界](/blog/legacy/note/ja/omp-headroom-provider-proxy/) — **provisional** loopback Headroom、provider route、Codex 共通 provider、transaction、rollback。 出典：omp-headroom-provider-proxy-codex-routing-runtime`.
- [ResiCache：キャッシュ保護を検証可能な並行性・一貫性の境界にする](/blog/legacy/note/ja/resicache/) — **provisional** 責任チェーン、single-flight、値 version CAS、安全なシリアライズ、observer 寿命。 出典：resicache-engineering-highlights-2954fff`, `resicache-project-overview`, `resicache-observer-nested-execution-contract`.
- [UltiCode：オンラインジャッジと Agent 工学の検証可能な境界](/blog/legacy/note/ja/ulticode/) — **provisional** owner・監査・配送・結果 fence・lease・sandbox・非同期・Core 寿命・リリースの九記事への入口。 出典：ulticode-engineering-highlights-f801a1076`, `ulticode-project-context`, `ulticode-reliability-core-f801a1076`.

### ResiCache の設計概念

- [ResiCache の cache responsibility chain：control flow、nested fragment、observer lifecycle](/blog/legacy/note/ja/resicache-handler-chain-and-observer/) — **provisional** `HandlerResult`、ThreadLocal snapshot、ロック内 fragment、token 対応、例外終了。
- [cache stampede に Future、distributed lock、double-check が同時に必要な理由](/blog/legacy/note/ja/resicache-single-flight/) — **provisional** プロセス内 single-flight、複数 instance lock、lock 内 double-check、役割遷移、書き戻し失敗。
- [非同期の早期期限切れが TTL 短縮だけを行う理由：version CAS で古い task を無効化する](/blog/legacy/note/ja/resicache-early-expiration-cas/) — **provisional** `CachedValue.version`、Lua TTL CAS、key ごとの取消、古いタスク無効化。
- [Redis serializer の交換は一行の設定変更ではない：object trust から rollback 可能な migration へ](/blog/legacy/note/ja/resicache-serialization-migration/) — **provisional** 型 whitelist、streaming preflight、shadow/dual/cutover/rollback、並行書き込み保護。

### UltiCode の設計概念

- [UltiCode の Data Owner と fact snapshot：サービス間 submit の境界を保つ](/blog/legacy/note/ja/ulticode-owner-and-facts/) — **provisional** owner、`SubmissionFactsSnapshot`、事実の出所、schema version。 出典：ulticode-engineering-highlights-f801a1076`.
- [Owner 間 audit を cross-database write にしない：UltiCode の Local Outbox と Consumer Inbox](/blog/legacy/note/ja/ulticode-owner-local-audit-inbox/) — **provisional** owner-local 監査 outbox、Redis Stream、Admin inbox、重複配送、lease 回復。 出典：ulticode-reliability-core-f801a1076`.
- [UltiCode Outbox と Redis Streams：判定タスクの配送を復旧可能な状態にする](/blog/legacy/note/ja/ulticode-outbox-redis-streams/) — **provisional** outbox 状態、原子重複排除、retry/dead-letter、PEL 回収。 出典：ulticode-engineering-highlights-f801a1076`.
- [UltiCode の generation と attemptId：条件付き更新で古い判定結果を遮断する](/blog/legacy/note/ja/ulticode-generation-attempt-fence/) — **provisional** 再判定、lease、generation epoch、古い結果の fence。 出典：ulticode-engineering-highlights-f801a1076`.
- [database lease だけでは足りない：UltiCode の fence token で期限切れ singleton task を止める](/blog/legacy/note/ja/ulticode-fenced-singleton-lease/) — **provisional** DB 時刻、単調増加 token、reconciliation 完了書き込み、古い完了の拒否。 出典：ulticode-reliability-core-f801a1076`.
- [UltiCode Docker sandbox：リソース隔離とインフラエラーの分類](/blog/legacy/note/ja/ulticode-docker-sandbox/) — **provisional** Docker/seccomp/resource limit とユーザー・基盤障害の分類。 出典：ulticode-engineering-highlights-f801a1076`.
- [UltiCode 非同期実行コントラクト：冪等性、フィンガープリント、上限付き receipt](/blog/legacy/note/ja/ulticode-async-execution-contract/) — **provisional** submit/poll/cancel、状態機械、冪等キー、プロセス内 metadata 上限。 出典：ulticode-engineering-highlights-f801a1076`.
- [modular monolith を実験場として扱う：UltiCode Core の allowlist、timeout、close-once lifecycle](/blog/legacy/note/ja/ulticode-core-bounded-testbed/) — **provisional** opt-in、owner allowlist、有界起動、close 引き継ぎ、fail-closed readiness。 出典：ulticode-reliability-core-f801a1076`.
- [UltiCode の検証とサプライチェーンゲート：static contract から検証可能なリリースへ](/blog/legacy/note/ja/ulticode-ci-supply-chain/) — **provisional** zero-infra/static、統合検証、Trivy、SBOM、provenance、Cosign。 出典：ulticode-engineering-highlights-f801a1076`.

### 統合と構成パターン

- [OMP 設定の階層：モデルロール、Agent オーバーライド、フォールバックチェーン](/blog/legacy/note/ja/omp-config-and-rules-guide/) — 設定の責任境界と優先順位。 出典：legacy-omp-config-and-rules-guide`.
- [OMP Hook 拡張の概念：意思決定ポイントのヒント、ハードブロック、ステータス橋渡し](/blog/legacy/note/ja/omp-hook-extension-guide/) — ソフトヒント、ハード阻止、状態イベント。 出典：legacy-omp-hook-extension-guide`.
- [Headroom 0.34 圧縮・取得契約：フィールド、モード、実エンドポイント検証](/blog/legacy/note/ja/headroom-compress-retrieve-contract/) — `/v1/compress`、`/v1/retrieve`、CCR、contract test。 出典：headroom-0-34-compress-retrieve-contract`.
- [Enhanced UISA：異種ノード同期の owner・boundary・復旧モデル](/blog/legacy/note/ja/uisa-architecture-design/) — **provisional** owner・信頼性・冪等性・異種性・復旧の取捨選択。 出典：legacy-uisa-architecture-design`.
- [Headroom 単一ポートの総合：入口、動的上流、検証の境界](/blog/legacy/note/ja/headroom-single-port-evolution/) — **provisional** 8787 入口、動的 upstream、過去の仮定。 出典：legacy-headroom-single-port-evolution`.
- [Headroom ルート永続化の総合：Named Profile、model_cache、復旧](/blog/legacy/note/ja/omp-headroom-persistence/) — **provisional** 隔離、reconciler、復旧検証。 出典：legacy-omp-headroom-persistence`.
- [Headroom と cc-switch / Claude Code の共存：単一の整理責任とセキュリティ境界](/blog/legacy/note/ja/headroom-cc-switch-coexistence/) — **provisional** 8787/15721/`/v1/messages`/`BindPaths`。 出典：headroom-cc-switch-coexistence-runtime`.
- [Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠](/blog/legacy/note/ja/java-internship-interview-blog-polished/) — **provisional** 問題集ではなく能力モデル。 出典：legacy-java-internship-interview-blog-polished`.

## G. アーカイブと廃止

- [Hindsight 完全ローカルデプロイと OMP / Codex 統一メモリ連携の実践（アーカイブ）](/blog/legacy/note/ja/hindsight-local-deployment-and-agent-integration/) — 445 行の歴史的ページを、一概念一ページ原則で配置・接続・障害調査へ分割。
- [フロントエンドと随筆集：Vue、MyBatis、UniApp、キャッシュ注釈と環境トラブルシューティング（アーカイブ）](/blog/legacy/note/ja/frontend-mybatis-essays/) — 十件の随筆を分解・アーカイブ。事実は不変 raw `ingest-frontend-essays` に保持。

---

## 原始出典（raw）

> raw 53 件中 10 件は読み取り専用 Personal/Fuwari `legacy-aggregate`。新規には集約型を使わない。

<details>
<summary>raw 全 53 件（単一 43 + legacy-aggregate 10）</summary>

| slug | 種類 | 出典 | 要約 | 集約 |
|---|---|---|---|---|
| `karpathy-llm-wiki` | gist | [元 URL](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md) | LLM で個人知識庫を増分構築するパターン。 | — |
| `legacy-java-atomic-boolean` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-atomic-boolean.md) | AtomicBoolean、volatile、CAS、並行状態管理の原文。 | — |
| `legacy-java-auto-closeable` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-auto-closeable.md) | AutoCloseable と try-with-resources の原文。 | — |
| `legacy-java-null-value` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-null-value.md) | Spring Cache NullValue と null cache の原文。 | — |
| `legacy-java-internship-interview-blog-polished` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-internship-interview-blog-polished.md) | Java バックエンド実習面接の原文。 | — |
| `legacy-java-online-performance-debug` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-online-performance-debug.md) | Java CPU、Arthas、復旧判断の原文。 | — |
| `legacy-containerd-tls-troubleshooting` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/containerd-tls-troubleshooting.md) | containerd 私有 registry TLS 障害調査の原文。 | — |
| `legacy-intranet-penetration-ssh-guide` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/intranet-penetration-ssh-guide.md) | Cloudflare Tunnel、Tailscale、FRP、SSH の原文。 | — |
| `legacy-mysql-performance-troubleshooting` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/mysql-performance-troubleshooting.md) | MySQL 性能 SOP・診断の原文。 | — |
| `legacy-headroom-single-port-evolution` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/headroom-single-port-evolution.md) | Headroom 単一 port 構成の変遷の原文。 | — |
| `legacy-omp-config-and-rules-guide` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-config-and-rules-guide.md) | OMP 設定、ルール、モデル経路の原文。 | — |
| `legacy-omp-headroom-persistence` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-headroom-persistence.md) | Headroom 永続化・経路復旧の原文。 | — |
| `legacy-omp-hook-extension-guide` | legacy-blog | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-hook-extension-guide.md) | OMP Hook、グラフ通知、状態行拡張の原文。 | — |
| `legacy-plugin-lifecycle-management` | legacy-note | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/plugin_lifecycle_management_blog.md) | 大規模端末プラグインの寿命管理原文。 | — |
| `legacy-uisa-architecture-design` | legacy-note | [過去のファイル](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/uisa-architecture-design.md) | UISA hybrid cloud・異種 node 構成の原文。 | — |
| `headroom-0-34-compress-retrieve-contract` | upstream-source-and-contract-test | [固定版ソース](https://github.com/headroomlabs-ai/headroom/tree/v0.34.0) | Headroom 0.34.0 圧縮・検索 API 契約、モード、実 endpoint 検証。 | — |
| `kb-ingest-pipeline-v19` | repository | [固定 commit](https://github.com/DavidHLP/DavidHLP.github.io/tree/c0ae74e72982910e13c46de0b92cf8fb9a8d1751) | 会話 ID・内容 hash、redaction v19、制御面除外、partial checkpoint、raw manifest。 | — |
| `mcp-codebase-memory-workflow` | upstream-spec-and-source | [固定版](https://github.com/DeusData/codebase-memory-mcp/tree/v0.10.2) | MCP 2026-07-28 と codebase-memory-mcp v0.10.2 の graph tool 契約。 | — |
| `multi-service-readiness-contract` | upstream-spec-and-manpage | [固定規格](https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md) | Compose/systemd 起動・健康・依存・伝播の初期 snapshot。 | — |
| `multi-service-readiness-contract-correction` | upstream-spec-source-and-minimal-experiment | [固定規格](https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md) | 固定 Docker 出典と一時 Redis/Alpine 起動実験を追加。元 raw は不変。 | — |
| `omp-17-2-15-runtime-contract` | upstream-source-fixed-tag | [固定 tag](https://github.com/can1357/oh-my-pi/tree/v17.2.15) | OMP 17.2.15 Hook、Compaction、statusline、Headroom 証拠境界の初期 snapshot。 | — |
| `omp-17-2-15-runtime-contract-correction` | upstream-source-fixed-commit | [固定 commit](https://github.com/can1357/oh-my-pi/tree/06aecdd51f07e689e970ceaa180abe2be0c14bbb) | ExtensionRunner、イベント戻り契約、限定した負の証拠を追加。元 raw は不変。 | — |
| `redis-jackson-java-time-contract` | upstream-source-and-minimal-experiment | [固定 tag](https://github.com/redisson/redisson/tree/redisson-3.50.0) | Redisson/Spring Data Redis の Jackson 既定設定と LocalDateTime 変換実験。 | — |
| `multi-service-readiness-safety-correction` | upstream-source-fixed-tag | [固定 tag](https://github.com/docker/compose/tree/v5.4.0) | readiness コマンドの `-f`/`-p` 隔離と `down` 削除境界を修正。 | — |
| `database-schema-drift-contract` | upstream-docs-and-minimal-experiment | [Flyway 文書](https://documentation.red-gate.com/fd/validate-277578898.html) | Flyway 13.2.0/MySQL 8.4 history/schema/query の drift 診断。 | — |
| `database-written-test-review` | user-provided-local-markdown | [プロジェクト](https://github.com/DavidHLP/DavidHLP.github.io) | 提供された DB 筆記復盤：SQL 意味・方言・四表演習・Kettle・巨大表の範囲。 | — |
| `jjwt-013-security-api-contract` | upstream-source-fixed-tag | [JJWT 0.13.0 ソース](https://github.com/jwtk/jjwt/tree/0.13.0) | `signWith`、`verifyWith`、audience builder、key 型の境界。 | — |
| `testcontainers-docker-api-negotiation` | upstream-source-fixed-commits | [Testcontainers 1.20.6](https://github.com/testcontainers/testcontainers-java/tree/1.20.6) | Docker API `1.32` fallback、`api.version`、daemon version gate。 | — |
| `dubbo-nacos-runtime-registration` | upstream-source-fixed-tag-and-docs | [Dubbo 3.3.6](https://github.com/apache/dubbo/tree/dubbo-3.3.6) | Nacos interface/application 登録、metadata、smoke test の境界。 | — |
| `resicache-observer-nested-execution-contract` | upstream-source-fixed-commit | [ResiCache 公開 commit](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a) | observer token、lock 内 fragment、ThreadLocal snapshot、再入。 | — |
| `microservice-domain-data-ownership` | upstream-patterns-and-fixed-doc-snapshots | [microservices.io database-per-service](https://microservices.io/patterns/data/database-per-service.html) | サービス私有データ、saga、outbox、段階移行の所有権。 | — |
| `jjwt-013-security-api-contract-correction` | upstream-source-fixed-tag-correction | [JJWT 0.13.0 ソース](https://github.com/jwtk/jjwt/tree/0.13.0) | 推奨 key 長、verifyWith overload、PrivateKey 例外を修正。元 raw は不変。 | — |
| `testcontainers-docker-api-negotiation-correction` | upstream-source-fixed-commits-correction | [Testcontainers 1.20.6](https://github.com/testcontainers/testcontainers-java/tree/1.20.6) | TestEnvironment パスと `999.999` daemon-too-new 行列を修正。元 raw は不変。 | — |
| `dubbo-nacos-runtime-registration-correction` | upstream-source-fixed-tag-correction | [Dubbo 3.3.6](https://github.com/apache/dubbo/tree/dubbo-3.3.6) | Nacos registry URL パラメーター読取範囲を修正。元 raw は不変。 | — |
| `microservice-domain-data-ownership-correction` | upstream-patterns-fixed-docs-correction | [Microsoft pinned data considerations](https://github.com/MicrosoftDocs/architecture-center/blob/02b64c27c3a9eb6f49054297ceb6cec0fa0c68ef/docs/microservices/design/data-considerations.md) | revision 固定 URL を補足。live パターン頁は取得時 snapshot として利用。 | — |
| `headroom-cc-switch-coexistence-runtime` | repository-and-runtime-observation | [出典](https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc) | Claude Code → Headroom → cc-switch、単一整理、`BindPaths` の取捨選択の機密情報を除去した証拠。 | — |
| `omp-headroom-provider-proxy-codex-routing-runtime` | repository-and-runtime-observation | [出典](https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc) | loopback proxy、OMP/Codex 経路制御、Claude Code 共存の機密情報を除去した CLI/Desktop 証拠。 | — |
| `ingest-docker-fundamentals` | personal-notes-and-fuwari | [Personal-markdown-notes bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) | Docker 七原文：階層、volume、network、Compose。 | legacy-aggregate |
| `ingest-hbase-foundation` | personal-notes-and-fuwari-overlap | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | HBase 十八原文：モデル、構成、表設計、Shell、Java API。 | legacy-aggregate |
| `ingest-redis-business` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Redis 業務二十原文：cache、分散 lock、queue、feed、秒殺。 | legacy-aggregate |
| `ingest-redis-persistence` | personal-notes-and-heima-course | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Redis 永続化・内部三原文：RDB/AOF と内部構造。 | legacy-aggregate |
| `ingest-redis-heima` | personal-notes-and-heima-course | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) | Heima Redis 六ファイル（三つ完全重複）：入門、実践、多段 cache。 | legacy-aggregate |
| `ingest-java-concurrency` | personal-notes-and-fuwari | [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | JUC/Java 十五原文：CAS、atomic、lock、thread。 | legacy-aggregate |
| `ingest-spring-cloud` | personal-notes-and-fuwari | [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Spring Boot/Cloud 十三原文：自動設定、transaction、gateway、可観測性。 | legacy-aggregate |
| `ingest-spark-ecosystem` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Spark/大規模データ七原文：engine、実行 mode、cluster script。 | legacy-aggregate |
| `ingest-mysql-storage` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | MySQL 三原文：storage engine と deadlock。 | legacy-aggregate |
| `ingest-frontend-essays` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Vue/MyBatis/UniApp/cache/環境の十随筆。分解して archive 済み。 | legacy-aggregate |
| `hindsight-local-deployment-and-agent-integration` | upstream-source-and-minimal-experiment | [固定版ソース](https://github.com/vectorize-io/hindsight/tree/v0.9.1) | Hindsight v0.9.1 配置、Ollama ROCm、CPU BGE-M3、FastMCP、OMP/Codex の機密情報を除去した証拠。 | — |
| `resicache-project-overview` | repository-readme-fixed-commit | [ResiCache 公開 commit](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a) | ResiCache v0.0.2 二言語 README：位置付け、順序、設定境界、制限。 | — |
| `resicache-engineering-highlights-2954fff` | repository-source-and-test-selected-excerpts-fixed-commit | [ResiCache main 固定 commit](https://github.com/DavidHLP/ResiCache/tree/2954fff217257e9cf7c906450a75070d5e092637) | 現在のソース、値 version CAS、single-flight、serializer、observer、境界 test の抜粋。 | — |
| `ulticode-project-context` | repository-readme-and-context-fixed-commit | [UltiCode 固定 commit](https://github.com/DavidHLP/UltiCode/tree/3f14ac8947ef0124739bf02259deb9f567eb092e) | UltiCode README + CONTEXT 用語：owner、port/projection、不変条件。 | — |
| `ulticode-engineering-highlights-f801a1076` | repository-source-and-document-selected-excerpts-fixed-commit | [UltiCode 主線固定 commit](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) | 固定 main の構成、判定・sandbox、境界 test、CI：owner、outbox、fence、隔離、gate。 | — |
| `ulticode-reliability-core-f801a1076` | repository-source-and-document-selected-excerpts-fixed-commit | [UltiCode 主線固定 commit](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) | 監査 outbox/consumer inbox、fenced lease、reconciliation、Core opt-in 寿命のソース・migration・ADR・test。 | — |

</details>

raw は `src/content/raw/zh-cn/` にあり LLM 用で公開ルートを作らない。取得後の snapshot は不変。

## 取り込み受信箱

- [知識庫 ingest 受信箱](/blog/legacy/jotting/ja/kb-ingest-todo/) — 次の個人案件と問い。過去記事、Personal-markdown-notes/Fuwari の 107 原文、ResiCache/UltiCode README/CONTEXT は取り込み済み。Phase 2 で Hindsight 分割・随筆分解。次は Phase 3 の provisional 12 件の四半期審査と新テーマ。

## 保守規則

- active/provisional は全て一文要約とともに登録する。
- 安定した結論は `sources` で raw へ追跡可能にする。
- 出典・ページ追加時は [ナレッジベース操作ログ](/blog/legacy/information/ja/kb-log/) を追記する。
- lint が孤立・重複・断線・矛盾を検出したら、文面より先に証拠連鎖を直す。
- 六域は表示の集約で `series` を変えない。昇格板は四半期審査し未達を `deprecated` にする。
