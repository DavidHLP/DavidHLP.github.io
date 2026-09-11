# DavidHLPL · ThoughtLite ナレッジベース

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

DavidHLPL は、Astro で構築された多言語対応の個人ブログ兼、根拠を追跡できる AI ナレッジベースです。[ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) のコンテンツワークフローを保ちながら、このリポジトリで独自のコンテンツ、翻訳、ナレッジベースのルールを管理しています。

公開済みの文記と随筆は、ロケール対応のページと Feed として生成されます。本プロジェクトは静的サイトであり、データベース、API Key、バックエンドサービスは必要ありません。

## 特徴

- **根拠を追跡できるナレッジベース** — 安定した `note` ページ、軽量な `jotting`、不変の `raw` ソースがプロジェクトの編集ワークフローに従います。
- **Astro コンテンツパイプライン** — Markdown/MDX、シンタックスハイライト、数式、Mermaid、表、画像、脚注、読了時間、自動見出しに対応。
- **多言語ルーティング** — 英語、簡体字中国語、日本語に対応し、ナレッジベースの正典言語は `zh-cn` です。
- **テーマとレスポンシブ対応** — ライト/ダークテーマ、レスポンシブレイアウト、タッチ操作に配慮したナビゲーション、動きを減らす設定。
- **静的公開** — Atom Feed、サイトマップ、Open Graph メタデータを自動生成し、`dist/` を GitHub Pages などの静的ホスティングへ配置できます。
- **コンテンツ保護ルール** — ソースとナレッジベースのログを公開コレクションから分離し、リポジトリに記録された不変条件に従います。

## クイックスタート

### 必要な環境

- Node.js 22.12 以上。
- `package.json` が指定する pnpm 10.30.0。

### インストールと起動

```sh
git clone https://github.com/DavidHLP/DavidHLP.github.io.git
cd DavidHLP.github.io
pnpm install --frozen-lockfile
pnpm dev
```

Astro が表示するアドレス（通常は [`http://localhost:4321`](http://localhost:4321)）を開いてください。ローカル環境で `localhost` を正しく解決できない場合は、次を使用できます。

```sh
pnpm dev --host 127.0.0.1
```

### ビルドとプレビュー

```sh
pnpm build
pnpm preview
```

本番サイトは `dist/` に出力されます。HTTP サーバー経由でアクセスし、`dist/index.html` を直接開かないでください。

## コマンド

| コマンド | 用途 |
| --- | --- |
| `pnpm install --frozen-lockfile` | ロックファイルに従って依存関係をインストール |
| `pnpm new` | プロジェクトヘルパーで新しいコンテンツファイルを作成 |
| `pnpm dev` | 通常ポート 4321 で Astro 開発サーバーを起動 |
| `pnpm check` | Astro と TypeScript のチェックを実行 |
| `pnpm test:run` | Vitest テストを一度実行 |
| `pnpm build` | 静的な本番サイトをビルド |
| `pnpm preview` | ビルド結果をローカルでプレビュー |
| `pnpm format` | Biome で対応するソースファイルを整形 |
| `pnpm lint` | Biome の lint チェックを実行 |
| `pnpm kb:lint` | ナレッジベースの根拠とインデックス不変条件を検証 |
| `node scripts/editorial-smoke.mjs` | ビルド後に生成ルート、landmark、レイアウト、必要なアセットを検証 |

## プロジェクト構成

| パス | 役割 |
| --- | --- |
| `src/content/note/{locale}/` | 根拠を持つ安定したナレッジページ |
| `src/content/jotting/{locale}/` | 軽量なメモとナレッジベースの取り込み待ち受信箱 |
| `src/content/information/{locale}/` | 自己紹介、ポリシー、リンク、年表、ナレッジベースのインデックスとログ |
| `src/content/preface/{locale}/` | サイトの序文コンテンツ |
| `src/content/raw/{locale}/` | ナレッジベースの不変ソース。公開コレクションには含めない |
| `src/i18n/` | `en`、`zh-cn`、`ja` の翻訳リソース |
| `src/components/` | 再利用可能な Astro と Svelte の UI コンポーネント |
| `src/pages/[...locale]/` | ホーム、コンテンツ、Feed、情報ページの多言語ルート |
| `src/layouts/` | 共通ページ・ドキュメントレイアウト |
| `site.config.ts` | サイト情報、ロケール、コンテンツ、ページネーション、Feed の設定 |
| `astro.config.ts` | Astro 統合、Markdown/MDX 処理、ルーティング、サイトマップ、ビルド動作 |

## コンテンツとナレッジベース

公開コンテンツはロケールとコレクションごとに整理しています。

- `note`：構造化された技術・エンジニアリング知識。
- `jotting`：軽量な観察と、安定した知識ページへコンパイルする前の素材。
- `information`：自己紹介、ポリシー、リンク、年表、ナレッジベースのインデックス/ログ。
- `preface`：サイトの序文。
- `raw`：不変の証拠レイヤー。公開コンテンツとして列挙しません。

ナレッジベースの正典言語は `zh-cn` です。英語と日本語のページは、多言語出力が必要な場合に翻訳として管理します。公開コンテンツを追加すると、ページと Feed は次回のビルドで更新されます。

## 設定

主な設定入口は次のとおりです。

- [`site.config.ts`](site.config.ts) — サイト情報、作者、説明、ロケール、ページネーション、Feed、最新コンテンツ。
- [`astro.config.ts`](astro.config.ts) — Astro 統合、Markdown/MDX 処理、多言語ルーティング、エイリアス、サイトマップ、ビルド動作。
- [`src/i18n/`](src/i18n/) — UI 翻訳とラベル。

## デプロイと検証

このリポジトリは GitHub Pages 用に設定されています。`main` への push でデプロイワークフローが起動し、まず検証ワークフローを再利用します。検証に成功した後で、固定された pnpm 依存関係をインストールし、`dist/` をビルドし、`.nojekyll` を追加して GitHub Pages に公開します。

検証ワークフローでは、Biome チェック、型チェック、ユニットテスト、静的ビルド、編集内容の smoke チェック、コミット済み SVG のチェック、デスクトップとモバイル幅での about ページのブラウザ/印刷 smoke チェックを実行します。

ローカル検証：

```sh
pnpm check
pnpm test:run
pnpm build
node scripts/editorial-smoke.mjs
```

## 上流とライセンス

このリポジトリは [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) の Astro コンテンツテーマ基盤をもとに構築されています。[上流 README](https://raw.githubusercontent.com/tuyuritio/astro-theme-thought-lite/refs/heads/main/README.md)も参照してください。本プロジェクトのライセンスは [GPLv3](LICENSE) です。

[RhineLabUI](https://github.com/LBEILC/RhineLabUI) は、将来のアーカイブ機能に向けた外部参考資料として残しています。[上流 README](https://raw.githubusercontent.com/LBEILC/RhineLabUI/refs/heads/main/README.md)を参照してください。このリポジトリには現在、RhineLabUI の UI、アセット、ライセンス本文は含まれていません。

## 参考

- [DavidHLPL](https://github.com/DavidHLP)
- [DavidHLP.github.io](https://github.com/DavidHLP/DavidHLP.github.io)
- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite)
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI)
