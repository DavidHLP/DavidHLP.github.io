# ナレッジベース操作ログ

これはナレッジベース保守の追記専用ログです。過去の項目は書き換えず、修正は新しい項目で表現します。

## [2026-08-07] init | 個人 AI ナレッジベースの確立

Karpathy の LLM-Wiki パターンに沿って、変更しない `raw` ソース、LLM が保守する `note` ページ、`KB.md` と `knowledge-base` skill の Schema という三層に再構成しました。ホーム、履歴書、多言語の外側は保護しています。

## [2026-08-07] ingest | @karpathy-llm-wiki

Karpathy の gist を `src/content/raw/zh-cn/karpathy-llm-wiki.md` に保存し、最初の `llm-wiki-pattern` concept ページを作成して目次とログを同期しました。

## [2026-08-07] lint | 初期確認

raw ソース 1 件、出典付き wiki ページ 1 件、目次とインボックスの同期を確認しました。この時点では旧記事は安定した知識として取り込んでいませんでした。

## [2026-08-07] ingest | 旧記事を知識ページへ再配置

Git commit `6f3d114a6ef9eb08b730f5f4740afe5b7d22d426` から 14 件の旧記事テーマを読み取り、`legacy-*` の中国語 raw 証拠スナップショットを作成しました。内容は Java 基礎とバックエンド調整、運用とインフラ、OMP と Agent エンジニアリング、アーキテクチャ実践の三言語 `note` ページに再配置しました。旧 `jotting` の Java 3 ページは知識ページへ昇格し、バージョン依存の Headroom、UISA、面接振り返りは `provisional` の統合ページとして残しました。

## [2026-08-07] lint | 移行後の検証待ち

正典目次、三言語の表示用目次、取り込みインボックスを同期しました。次に raw manifest、sources、related、三言語 metadata、ビルド結果、リンク切れを確認します。

## [2026-08-07] lint | 旧記事移行の検証完了

`pnpm kb:lint` は raw 15 件、三言語 wiki 45 ページで成功し、sources、raw manifest、正典目次、操作ログが同期しています。`pnpm check` はエラーなし、`pnpm build` は 71 ページを生成し、`pnpm test:run` は 129 テスト成功（1 件 skip）でした。生成物の内部リンク 880 件を確認し、既存の 404/500 ページ自身への参照だけが残っています。

## [2026-08-07] rewrite | 移行内容を実際の知識ページへ再構成

前回は旧記事を raw-backed note に移しただけでした。今回は 14 件の raw ソースを読み直し、note 本文を定義、核心メカニズム、適用条件、境界とリスク、最小検証、証拠と不確実性、関連ページの構造に再構成しました。ブログの時系列、面接 Q&A、大量の設定ダンプを削除し、Java 面接、Headroom のルーティング/永続化、UISA は複数ソースの `provisional` synthesis、その他は再利用可能な concept として整理しました。
