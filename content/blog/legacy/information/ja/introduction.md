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

Java バックエンド開発。キャッシュ整合性、分散タスク、保守しやすい設計に関心があります。日々向き合うのは同じ種類の問題です。同時リロードをどう畳むか、配信に失敗したタスクをどう補うか、シリアライズの境界が権限を広げないようにするにはどうするか。考えた内容を後から検証できる形で書き残すことが、このサイトの中心です。

## オープンソース

- **ResiCache** — Redis を使う Spring Cache アプリケーション向けのキャッシュ保護。同一キーの同時リロードの集約、一斉失効による負荷集中の平準化、ホットキーの先行更新を扱う。
- **UltiCode** — 問題演習からコンテスト判定までを担うオープンソースのオンラインジャッジ。独立した判定プロセスが Redis Streams から提出を受け取り、Docker サンドボックスで実行する。
- **codebase-memory-mcp**（上流への貢献）— コード知識グラフの MCP サーバー。[Oh My Pi クライアント対応](https://github.com/DeusData/codebase-memory-mcp/pull/1229)、[Linux インストール時のエイリアス処理](https://github.com/DeusData/codebase-memory-mcp/pull/2203)、[Swift の宣言とコールエッジ解析](https://github.com/DeusData/codebase-memory-mcp/pull/2436)。

## このサイト

記事は Java の並行処理、Redis のキャッシュとストレージ、分散タスクの配信と障害復旧、MCP と AI エンジニアリングツールを扱います。

画面テーマは [RhineLabUI](https://github.com/LBEILC/RhineLabUI) を元に、[RhineLabUI-Astro](https://github.com/DavidHLP/RhineLabUI-Astro) で Astro と TypeScript に移植したものです。

- ナレッジベース：<https://davidhlp.github.io/kb/>
- サイトのソース：<https://github.com/DavidHLP/DavidHLP.github.io>
