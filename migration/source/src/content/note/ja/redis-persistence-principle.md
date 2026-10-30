---
title: Redis 永続化と原理：RDB/AOF、データ構造と高度な仕組み
timestamp: 2026-08-21 00:00:00+08:00
series: Java 基礎とバックエンドチューニング
kind: concept
status: active
draft: true
sources: ["ingest-redis-persistence"]
related: [redis-business-patterns, redis-heima-practice, database-schema-drift]
tags: [Redis, Persistence, RDB, AOF, DataStructure, Principle]
description: スナップショットと追記ログの回復と性能境界を区別。
toc: true
---

永続化と内部構造は `Redis持久化.md`、`原理篇.md`（56KB）、`RedisPersistence.md` で RDB/AOF、データ構造、期限切れ戦略を中心に扱われています。本ページは回復可能性と性能のトレードオフを強調します。

## 核心メカニズム

- **RDB**：定期的なスナップショット、回復が速い、大規模データでは fork コストが高く、最新の書き込みを失う可能性がある。
- **AOF**：コマンドの追記、3 つの `fsync` モード `everysec/always/no`、`rewrite` による圧縮；安全性は高いがリプレイは遅い。
- 内部構造の記事ではさらに SDS、Dict、ZipList/ListPack、QuickList などの基盤構造、期限切れ、退避（LRU/LFU）、マスター・レプリカのレプリケーションを展開します。

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

- [redis-business-patterns](/note/redis-business-patterns)
- [redis-heima-practice](/note/redis-heima-practice)
- [database-schema-drift](/note/database-schema-drift)
