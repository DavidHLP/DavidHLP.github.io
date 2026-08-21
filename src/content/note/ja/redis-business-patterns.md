---
title: Redis ビジネスパターン：キャッシュ、分散ロック、メッセージキュー、Feed と秒殺
timestamp: 2026-08-21 00:00:00+08:00
series: Java 基礎とバックエンドチューニング
kind: concept
status: active
draft: true
sources: ["ingest-redis-business"]
related: [redis-persistence-principle, redis-null-value, redis-jackson-java-time, resicache-observer-nested-execution]
tags: [Redis, Cache, DistributedLock, MessageQueue, Feed, Seckill]
description: 一貫性・排他・メッセージ意味を軸に再利用可能なビジネスパターンを蒸留。
toc: true
---

2 つのリポジトリの 20 の Redis ビジネスノートは互いに鏡像です（各トピックが Personal と Fuwari に中英で 1 回ずつ登場）。本ページはキャッシュ一貫性、ロックの正確性、メッセージ意味を軸に、再利用可能なパターンに収束させ、講義の書き起こしではありません。

## 核心メカニズム

### 1. キャッシュモデルと一貫性

- `Redi缓存模型和思路.md` と `Redis-Caching-Models.md` は Cache-Aside、Read/Write-Through、無効化戦略を区別します；TTL、能動的削除、遅延二重削除はそれぞれトレードオフがあります。
- キャッシュの null（`java-null-value` 参照）はプレースホルダで透過を防ぎます；`Spring Cache` アノテーションは `CacheableAndCacheEvict` で別途説明。

### 2. 分散ロックと並行制御

- 楽観ロック（CAS/バージョン）は読み取りが多く衝突を再試行できる場合に適し、悲観ロック/Redisson 分散ロックは臨界区間の相互排他に適します。
- `分布式锁.md` と `Distributed-Locks-with-Redis.md` は `SET NX EX` の原子性を使用し、Redisson の記事は watchdog による更新を導入しますが、保持時間、更新、再入可能性の境界はバージョンごとに確認が必要です。

### 3. メッセージキュー、Feed ストリーム、秒殺

- `Redis消息队列.md` は List/Stream/PubSub を比較します；信頼できる意味を持つのは ACK を伴う Stream のコンシューマグループのみです。
- Feed ストリーム（push/pull/push-pull ハイブリッド）と秒殺（在庫減算、レート制限、非同期キュー）は `Feed流设计模型.md` と `Seckill-System.md` でシナリオごとに分解されていますが、容量パラメータは未測定です。
- ヘルパークラスと Session 置換は `Redis工具类实现.md` と `Replacing-Traditional-Sessions-with-Redis.md` でカプセル化例を示します。

## 適用条件

- キャッシュ：読み取りが多く、短時間の不整合を許容し、ホットスポットが予測可能。
- ロック：臨界区間が短く、タイムアウトが制御可能で、ロック粒度が明確。
- キュー：at-least-once が許容され、消費が冪等。

## 不適用とリスク

- 強いトランザクション、厳密に 1 回の意味、複雑なクエリは純粋な Redis には不向き。
- 分散ロックがビジネスロジック完了前に失効すると二重実行を招きます；watchdog の更新、ネットワーク分断、時計のずれを明示的に評価する必要があります（`resicache` 関連ページ参照）。
- 秒殺と Feed の容量設計は負荷試験されておらず、閾値をそのままコピーすべきではありません。

## 最小検証

1. キャッシュ：ヒット/透過/ブレークダウンのシナリオをそれぞれ負荷試験し、TTL とフォールバックを記録。
2. ロック：2 プロセスで `SET NX` を競合させ、タイムアウト解放と `Lua` による解除の原子性を検証。
3. キュー：Stream のコンシューマグループ ACK/NACK、切断後のリプレイを検証。

## 証拠と不確実性

- **出典事実**：`ingest-redis-business` は中英の重複を含む 20 の出典ノートを含む。
- **本ページの統合**：ビジネスの書き起こしを一貫性—相互排他—意味の 3 軸に収束。
- **未確認**：Redisson バージョン、Stream コンシューマグループのパラメータ、秒殺の閾値はバージョン固定で検証されておらず、現行環境での再確認が必要。

## 関連ページ

- [redis-persistence-principle](/note/redis-persistence-principle)
- [redis-null-value](/note/redis-null-value)
- [redis-jackson-java-time](/note/redis-jackson-java-time)
- [resicache-observer-nested-execution](/note/resicache-observer-nested-execution)
