# DavidHLPL · ThoughtLite ナレッジベース

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

DavidHLPL は、Astro で構築された多言語対応の個人ブログ兼、根拠を追跡できる AI ナレッジベースです。[ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) のコンテンツワークフローを保ちながら、[RhineLabUI](https://github.com/LBEILC/RhineLabUI) のインタラクティブな 3D アーカイブ端末を Astro サイト向けに適応し、このリポジトリで独自のコンテンツ、翻訳、ナレッジベースのルールを管理しています。

公開済みの文記と随筆は、ロケール対応のページ、Feed、検索可能なアーカイブレコードとして生成されます。本プロジェクトは静的サイトであり、データベース、API Key、バックエンドサービスは必要ありません。

> 完全なアーカイブ画面には WebGL 2 対応のモダンブラウザが必要ですが、JavaScript または WebGL を利用できない場合も HTML の記事ディレクトリを利用できます。

## 特徴

- **インタラクティブな Archive OS** — Three.js の起動画面、アーカイブ閲覧、カテゴリ・キーワード検索、記事詳細、お気に入り、テキスト出力、復号と分解操作に対応した 360° モデルビューア。
- **根拠を追跡できるナレッジベース** — 安定した `note` ページ、軽量な `jotting`、不変の `raw` ソースがプロジェクトの編集ワークフローに従います。
- **コンテンツ駆動のアーカイブ** — 現在のロケールで公開されている `note` と `jotting` から、ビルド時にアーカイブレコードを生成します。下書き、アンダースコア付きファイル、raw ソースは公開アーカイブに含めません。
- **Astro コンテンツパイプライン** — Markdown/MDX、シンタックスハイライト、数式、Mermaid、表、画像、脚注、読了時間、自動見出しに対応。
- **多言語ルーティング** — 英語、簡体字中国語、日本語に対応し、ナレッジベースの正典言語は `zh-cn` です。
- **テーマとレスポンシブ対応** — ライト/ダークテーマ、レスポンシブレイアウト、タッチ操作に配慮したナビゲーション、動きを減らす設定。
- **静的公開** — Atom Feed、サイトマップ、Open Graph メタデータを自動生成し、`dist/` を GitHub Pages などの静的ホスティングへ配置できます。
- **フォールバック** — 空のアーカイブ、JavaScript 無効、WebGL の読み込み失敗時も、ビルド済み HTML の記事ディレクトリを利用できます。
- **コンテンツ保護ルール** — ソースとナレッジベースのログを公開コレクションから分離し、リポジトリに記録された不変条件に従います。

組み込まれた Rhine インターフェースは本ブログ向けに適応しています。上流プロジェクトの単独 PWA と Wallpaper Engine ホスト機能は、このリポジトリでは有効化していません。

## クイックスタート

### 必要な環境

- Node.js 22.12 以上。
- `package.json` が指定する pnpm 10.30.0。
- 完全な 3D アーカイブ体験には WebGL 2 対応のモダンブラウザ。

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
| `node scripts/editorial-smoke.mjs` | ビルド後に生成ルート、アーカイブ、リソース、ライセンスを検証 |

## プロジェクト構成

| パス | 役割 |
| --- | --- |
| `src/components/RhineArchive.astro` | Astro のコンテンツをアーカイブ画面へ接続し、HTML フォールバックを提供 |
| `src/rhine/` | 適応済み Three.js アーカイブ UI、起動画面、モデルビューア、音声、モーション、描画設定 |
| `src/content/note/{locale}/` | 根拠を持つ安定したナレッジページ |
| `src/content/jotting/{locale}/` | 軽量なメモとナレッジベースの取り込み待ち受信箱 |
| `src/content/information/{locale}/` | 自己紹介、ポリシー、リンク、年表、ナレッジベースのインデックスとログ |
| `src/content/preface/{locale}/` | サイトの序文コンテンツ |
| `src/content/raw/{locale}/` | ナレッジベースの不変ソース。公開コレクションには含めない |
| `src/i18n/` | `en`、`zh-cn`、`ja` の翻訳リソース |
| `src/components/` | 再利用可能な Astro と Svelte の UI コンポーネント |
| `src/pages/[...locale]/` | ホーム、アーカイブ、コンテンツ、Feed、情報ページの多言語ルート |
| `src/layouts/` | 共通ページ・ドキュメントレイアウト |
| `public/assets/` | 実行時モデルとアーカイブリソース |
| `public/audio/` | アーカイブ音声、出典説明、生成メタデータ |
| `public/fonts/` | MiSans Webfont と通知・ライセンス |
| `public/licenses/` | 統合 UI が使用する第三者ライセンス本文 |
| `docs/rhine-migration.md` | 移行範囲、コンテンツマッピング、フォールバック、検証記録 |
| `site.config.ts` | サイト情報、ロケール、コンテンツ、ページネーション、Feed の設定 |
| `astro.config.ts` | Astro 統合、Markdown/MDX 処理、ルーティング、サイトマップ、ビルド動作 |

## コンテンツとナレッジベース

公開コンテンツはロケールとコレクションごとに整理しています。

- `note`：構造化された技術・エンジニアリング知識。
- `jotting`：軽量な観察と、安定した知識ページへコンパイルする前の素材。
- `information`：自己紹介、ポリシー、リンク、年表、ナレッジベースのインデックス/ログ。
- `preface`：サイトの序文。
- `raw`：不変の証拠レイヤー。公開コンテンツとして列挙しません。

ナレッジベースの正典言語は `zh-cn` です。英語と日本語のページは、多言語出力が必要な場合に翻訳として管理します。公開コンテンツを追加すると、アーカイブ、ページ、Feed は次回のビルドで更新されます。

## 設定

主な設定入口は次のとおりです。

- [`site.config.ts`](site.config.ts) — サイト情報、作者、説明、ロケール、ページネーション、Feed、最新コンテンツ。
- [`astro.config.ts`](astro.config.ts) — Astro 統合、Markdown/MDX 処理、多言語ルーティング、エイリアス、サイトマップ、ビルド動作。
- [`src/i18n/`](src/i18n/) — UI 翻訳とラベル。

## デプロイと検証

このリポジトリは GitHub Pages 用に設定されています。`main` への push でデプロイワークフローが起動し、まず検証ワークフローを再利用します。検証に成功した後で、固定された pnpm 依存関係をインストールし、`dist/` をビルドし、`.nojekyll` を追加して GitHub Pages に公開します。

検証ワークフローでは、Biome チェック、型チェック、ユニットテスト、静的ビルド、アーカイブ/リソースの smoke チェック、コミット済み SVG のチェック、デスクトップとモバイル幅での about ページのブラウザ/印刷 smoke チェックを実行します。

ローカル検証：

```sh
pnpm check
pnpm test:run
pnpm build
node scripts/editorial-smoke.mjs
```

## 上流とライセンス

このリポジトリは、二つの上流レイヤーと本サイトのコンテンツ/統合コードで構成されています。

- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) が元の Astro コンテンツテーマ基盤を提供します。[上流 README](https://raw.githubusercontent.com/tuyuritio/astro-theme-thought-lite/refs/heads/main/README.md)も参照してください。本プロジェクトのライセンスは [GPLv3](LICENSE) です。
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI) が適応済み Three.js アーカイブ画面を提供します。統合ソースは `src/rhine/` にあり、レビュー済みコミット `8799b03179a9a0ebd2611843e644a5a0530b24bf` に固定しています。[上流 README](https://raw.githubusercontent.com/LBEILC/RhineLabUI/refs/heads/main/README.md) とローカルの [MIT ライセンス通知](public/licenses/RhineLabUI-MIT.txt)を参照してください。

RhineLabUI の MIT 通知は対象となる適応 UI コードにのみ適用され、このリポジトリ内のすべてのファイルやアセットを自動的に MIT へ再ライセンスするものではありません。MiSans、Rolling Number、音声、その他の依存関係、関連作品の名称・ロゴ・モデル・原資料には、それぞれの権利と通知が適用されます。詳細：[`public/fonts/NOTICE.txt`](public/fonts/NOTICE.txt)、[`public/audio/README.md`](public/audio/README.md)、[`public/licenses/rolling-number.txt`](public/licenses/rolling-number.txt)、[`docs/rhine-migration.md`](docs/rhine-migration.md)。

元の RhineLabUI は非公式のインターフェース再現であり、参照されるゲーム、キャラクター、ロゴ、映像の権利者とは提携していません。第三者作品の権利は各権利者に帰属します。

## 参考

- [DavidHLPL](https://github.com/DavidHLP)
- [DavidHLP.github.io](https://github.com/DavidHLP/DavidHLP.github.io)
- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite)
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI)
