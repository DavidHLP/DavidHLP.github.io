---
{
  "archiveId": "X-1117",
  "title": "Redis 永続化と原理：RDB/AOF、データ構造と高度な仕組み",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "スナップショットと追記ログの回復と性能境界を区別。",
  "findings": [
    "元の文書: src/content/note/ja/redis-persistence-principle.md",
    "出典リビジョン: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "証拠の状態: 有効"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/ja/redis-persistence-principle.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Redis",
    "Persistence",
    "RDB",
    "AOF",
    "DataStructure",
    "Principle",
    "ja",
    "note"
  ],
  "draft": false,
  "lang": "ja",
  "legacy": {
    "path": "src/content/note/ja/redis-persistence-principle.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Redis 永続化と原理：RDB/AOF、データ構造と高度な仕組み",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Java 基礎とバックエンドチューニング",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-redis-persistence"
      ],
      "related": [
        "redis-business-patterns",
        "redis-heima-practice",
        "database-schema-drift"
      ],
      "tags": [
        "Redis",
        "Persistence",
        "RDB",
        "AOF",
        "DataStructure",
        "Principle"
      ],
      "description": "スナップショットと追記ログの回復と性能境界を区別。",
      "toc": true
    }
  },
  "kind": "concept",
  "status": "active",
  "sources": [
    "ingest-redis-persistence"
  ],
  "related": [
    "redis-business-patterns",
    "redis-heima-practice",
    "database-schema-drift"
  ]
}
---

永続化と内部構造は `Redis持久化.md`、`原理篇.md`（56KB）、`RedisPersistence.md` で RDB/AOF、データ構造、期限切れ戦略を中心に扱われています。本ページは回復可能性と性能のトレードオフを強調します。

## 核心メカニズム

- **RDB**：定期的なスナップショット、回復が速い、大規模データでは fork コストが高く、最新の書き込みを失う可能性がある。
- **AOF**：コマンドの追記、3 つの `fsync` モード `everysec/always/no`、`rewrite` による圧縮；安全性は高いがリプレイは遅い。
- 内部構造の記事ではさらに SDS、Dict、ZipList/ListPack、QuickList などの基盤構造、期限切れ、キャッシュからの追い出し（LRU/LFU）、マスター・レプリカのレプリケーションを展開します。

## 適用条件

- 少量のデータ損失を許容し、高速な回復を求める → RDB。
- 最小の損失を求める → AOF（またはハイブリッド永続化）。

## 不適用とリスク

- AOF の `always` は書き込み集中時にレイテンシを増大させます；`rewrite` 期間の fork/IO は評価が必要です。
- 内部構造記事のバージョンは固定されておらず（黒馬コースのバージョン）、本番の Redis バージョンとずれる可能性があります。

## 最小検証

1. RDB と AOF をそれぞれ有効化し、kill 後に再起動して回復データと時間を比較。
2. `BGREWRITEAOF` 期間中に負荷試験し、レイテンシと fork を観察。

## 証拠と不確実性

- **出典事実**：`ingest-redis-persistence` は 3 つの出典ノートを verbatim で収録；内部構造記事はバージョン固定で検証されていない。
- **本ページの統合**：スナップショットと追記ログのトレードオフを選択表にしました。
- **未確認**：具体的な Redis バージョン、ハイブリッド永続化スイッチ、基盤構造はバージョンによって異なります。

## 関連ページ

- [redis-business-patterns](/blog/legacy/note/ja/redis-business-patterns/)
- [redis-heima-practice](/blog/legacy/note/ja/redis-heima-practice/)
- [database-schema-drift](/blog/legacy/note/ja/database-schema-drift/)


## 出典と関連文書

- [ingest-redis-persistence](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-redis-persistence.md)
- [Redis ビジネスパターン：キャッシュ、分散ロック、メッセージキュー、Feed と数量限定・時間限定販売](/blog/legacy/note/ja/redis-business-patterns/)
- [Redis 黒馬実践：分散キャッシュ、マルチレベルキャッシュとベストプラクティス](/blog/legacy/note/ja/redis-heima-practice/)
- [データベース Schema ドリフト：history、schema、query の三ビューで特定する](/blog/legacy/note/ja/database-schema-drift/)
