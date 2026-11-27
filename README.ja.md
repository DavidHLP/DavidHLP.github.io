# DavidHLPL ブログ

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

[davidhlp.github.io](https://davidhlp.github.io) で公開している個人ブログ兼エンジニアリング・ナレッジベースです。[RhineLabUI-Astro 上流テンプレート](https://github.com/DavidHLP/RhineLabUI-Astro)を基に構築しています。

リポジトリはブログの原資料、ライセンス、Git 履歴を保持しています。既存の英語・日本語訳 74 件の公開は所有者が承認済みで、具体的な変更は [publication overrides](migration/publication-overrides.json) に記録しています。ソースのスナップショットと元の下書きメタデータは変更しません。既存の 67 記事グループはすべて 3 言語版を公開済みです。テンプレートのサンプル記事は引き続き対象外です。詳細は[移行メモと一覧](migration/README.md)を参照してください。

言語ルーティング、カタログ、ダウンロード、検証については[全コンテンツの言語切り替え](docs/I18N.md)を参照してください。

## 開発

Node.js 22.12 以上が必要です。依存関係のインストール、ビルド、チェックは `remote-dev` で実行します。

```sh
npm ci
npm run dev
npm run build
npm run check:content
npm run check:viewport
```

`content/site.json` がブログの識別情報と 5 つのアーカイブ列を設定します。編集可能な記事は `content/blog/legacy/` にあります。元の `src/content/` 文書と `migration/source/` スナップショットは読み取り専用のままです。ビルドには RSS、検索、オフライン閲覧、TXT ダウンロードが含まれます。GitHub Pages ワークフローは検証後に `main` から `dist/` を配信します。

## プロジェクト構成

| パス | 役割 |
|---|---|
| `content/blog/legacy/` | 編集・公開する記事（note、jotting、information、preface） |
| `src/content/` | 凍結された移行スナップショット（読み取り専用） |
| `src/content/raw/` | 不変の原資料（読み取り専用） |
| `src/pages/` | ルート（`/blog/[...slug]`、`/about`、`/kb`、`/rss.xml`） |
| `content/site.json` | サイト名、5 列の分類、About の入口 |
| `docs/` | リポジトリ保守文書（記事としては公開しない） |

## 上流テンプレート

```sh
git remote add upstream git@github.com:DavidHLP/RhineLabUI-Astro.git
git fetch upstream
```

テンプレートの履歴は本リポジトリに含まれており、今後の上流変更はタスクブランチでマージし、ブログ固有の設定と合わせてレビューします。GitHub リポジトリ自体は削除・再作成せず保持します。

元のブログの GPL ライセンス、コンテンツポリシー、第三者素材の帰属は引き続き適用されます。上流テンプレートの MIT 通知は `public/licenses/` に収録しています。

## About とプロフィール

`/about/`、`/en/about/`、`/ja/about/` を参照してください。既存の `content/blog/legacy/information/{zh-cn,en,ja}/introduction.md` を編集します。身元情報は `profile` frontmatter にあり、履歴は同じ本文内に保持されるため、2 つ目のコピーは管理しません。[About 設定](docs/ABOUT.md)と[受け入れチェックリスト](docs/ABOUT-ACCEPTANCE.md)も参照してください。
