---
{
  "archiveId": "X-1008",
  "title": "DavidHLP",
  "en": "PROFILE",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLP",
  "clearance": "PUBLIC",
  "abstract": "プロフィール：技術分野、オープンソースプロジェクト、本サイトの内容。",
  "findings": [
    "本ページは公開されている技術的なプロフィールとプロジェクトのみを扱い、連絡先は含みません。"
  ],
  "source": "https://github.com/DavidHLP",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "ja",
    "information"
  ],
  "draft": false,
  "lang": "ja",
  "legacy": {
    "path": "src/content/information/ja/introduction.md",
    "revision": "scrubbed-2026-11-25",
    "metadata": {}
  },
  "resumeLabel": "プロフィール",
  "profile": {
    "role": "Java バックエンド開発",
    "summary": "キャッシュ整合性、分散タスク、保守しやすい設計に関心。ResiCache と UltiCode を運営。",
    "avatar": "/images/github-avatar.jpg",
    "contacts": [
      {
        "label": "GitHub · DavidHLP",
        "href": "https://github.com/DavidHLP"
      },
      {
        "label": "ナレッジベース",
        "href": "https://davidhlp.github.io/kb/"
      },
      {
        "label": "サイトのソース",
        "href": "https://github.com/DavidHLP/DavidHLP.github.io"
      }
    ]
  }
}
---

## プロフィール

主に Java と Spring でバックエンドを開発し、Redis のキャッシュ整合性、分散タスク、シリアライズにおける信頼境界に関心があります。並行処理や非同期処理では、各段階をどのコンポーネントが担当し、タイムアウトや失敗の後にどの状態を頼りにできるかを先に整理します。

たとえばキャッシュの再読み込みでは、待機側のタイムアウト、読み込み自体の失敗、読み込み成功後のキャッシュ書き込み失敗をそれぞれテストします。後からコードを読み返して結論を確かめられるように、テストで扱ったケースも書き残しています。

## オープンソース

- [**ResiCache**](https://github.com/DavidHLP/ResiCache) は、Redis を使う Spring Cache アプリケーションにキャッシュ保護を追加します。同じキーの再読み込みが重なったときに処理をまとめ、有効期限をずらして負荷を分散し、頻繁に使われるキーを期限前に更新できます。
- [**UltiCode**](https://github.com/DavidHLP/UltiCode) は、問題演習やコンテスト向けのオンラインジャッジです。配信に失敗しても再試行できるよう、判定タスクをデータベースの outbox に記録し、独立したワーカーが Redis Streams からタスクを受け取って Docker サンドボックスで提出コードを実行します。
- コードグラフを検索する MCP サーバー **codebase-memory-mcp** には、[Oh My Pi クライアント対応](https://github.com/DeusData/codebase-memory-mcp/pull/1229)、[Linux インストール時のエイリアス処理](https://github.com/DeusData/codebase-memory-mcp/pull/2203)、[Swift の宣言と呼び出し関係の解析](https://github.com/DeusData/codebase-memory-mcp/pull/2436)に関する変更を送りました。

## このサイト

ここでは Java の並行処理、Redis のキャッシュとストレージ、分散タスクの配信と障害復旧について書いています。コードの調査に MCP ツールをどう組み込めるかも試しており、コードグラフでシンボルと呼び出し関係を探した後、インデックスの対象範囲を確認し、ソースを読んで結果を確かめます。

サイトのテーマには、[RhineLabUI](https://github.com/LBEILC/RhineLabUI) を Astro と TypeScript に移植した [RhineLabUI-Astro](https://github.com/DavidHLP/RhineLabUI-Astro) を使っています。

- ナレッジベース：<https://davidhlp.github.io/kb/>
- サイトのソース：<https://github.com/DavidHLP/DavidHLP.github.io>
