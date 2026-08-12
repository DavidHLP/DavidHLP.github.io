# ナレッジベース目次

これはナレッジベースの内容指向の入口です。wiki ページと `sources` を読む前に確認します。

正典の wiki と raw ソースは、LLM の保守コストを一つの言語に保つため `zh-cn` で管理しています。[正典の目次](/kb)、[LLM-Wiki パターン](/note/llm-wiki-pattern)、[取り込みインボックス](/jotting/kb-ingest-todo) を参照してください。

保守契約は [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) と [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md) にあります。

## 概念ページ（concept）

### ナレッジベース

- [LLM-Wiki パターン](/note/llm-wiki-pattern) — raw、wiki、Schema、ingest、query、lint の運用モデル。

### Java 基礎とバックエンド調整

- [AtomicBoolean と CAS による状態管理](/note/java-atomic-boolean)
- [AutoCloseable と try-with-resources](/note/java-auto-closeable)
- [Spring Cache の NullValue](/note/java-null-value)
- [Java 本番性能トラブルシューティング](/note/java-online-performance-debug)

### 運用とインフラ

- [containerd TLS 証明書トラブルシューティング](/note/containerd-tls-troubleshooting)
- [複雑なネットワークを越える SSH](/note/intranet-penetration-ssh-guide)
- [MySQL パフォーマンス調査](/note/mysql-performance-troubleshooting)

### OMP と Agent エンジニアリング

- [OMP 設定とルール体系](/note/omp-config-and-rules-guide)
- [OMP Hook 拡張](/note/omp-hook-extension-guide)
- [Headroom 0.34 圧縮・取得契約](/ja/note/headroom-compress-retrieve-contract) — `/v1/compress`、`/v1/retrieve` のフィールド、CCR mode、実 endpoint 検証の境界を固定する。

### アーキテクチャとエンジニアリング実践

- [大規模端末プラグインのライフサイクル管理](/note/plugin-lifecycle-management)

## エンティティページ（entity）

現在はありません。個人プロジェクト、ツール、フレームワーク、実行環境は、出典と所有範囲を確認してから追加します。

## 統合ページ（synthesis）

- [Java バックエンド実習面接の振り返り](/note/java-internship-interview-blog-polished)
- [Headroom 単一ポート構成の進化](/note/headroom-single-port-evolution)
- [OMP Headroom の永続化とルート復旧](/note/omp-headroom-persistence)
- [UISA 高信頼情報同期アーキテクチャ](/note/uisa-architecture-design)

## Raw ソース

正典の raw 証拠は `src/content/raw/zh-cn/` で管理し、公開ルートにはしません。

- `karpathy-llm-wiki`
- `legacy-java-atomic-boolean`
- `legacy-java-auto-closeable`
- `legacy-java-null-value`
- `legacy-java-internship-interview-blog-polished`
- `legacy-java-online-performance-debug`
- `legacy-containerd-tls-troubleshooting`
- `legacy-intranet-penetration-ssh-guide`
- `legacy-mysql-performance-troubleshooting`
- `legacy-headroom-single-port-evolution`
- `legacy-omp-config-and-rules-guide`
- `legacy-omp-headroom-persistence`
- `legacy-omp-hook-extension-guide`
- `legacy-plugin-lifecycle-management`
- `legacy-uisa-architecture-design`
- `headroom-0-34-compress-retrieve-contract`

## 取り込みインボックス

- [ナレッジベース取り込みインボックス](/jotting/kb-ingest-todo) — 残っている個人プロジェクトの出典と未回答の質問。旧記事の取り込みは完了しました。

正典の目次と追記専用ログは `zh-cn` で管理します。翻訳は表示用のコピーであり、独立した事実源ではありません。
