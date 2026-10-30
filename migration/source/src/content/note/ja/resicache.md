---
title: "ResiCache：Spring Cache 保護のためのオーケストレーション可能な責任チェーン"
timestamp: 2026-08-21 00:00:00+08:00
series: "Java セキュリティ・並行処理とテスト"
kind: entity
status: active
sources: ["resicache-project-overview", "resicache-observer-nested-execution-contract"]
related: ["resicache-observer-nested-execution", "java-null-value", "redis-business-patterns", "redis-jackson-java-time"]
tags: [ResiCache, SpringCache, Redis, BloomFilter, DistributedLock, ResponsibilityChain]
description: "固定コミットの README を証拠として、ResiCache の位置付け、責任チェーンの handler 順序、保護機能のデフォルト設定、シリアライズエンベロープ移行コストを整理し、宣言された機能と未検証の機能を区別する。"
toc: true
---

`ResiCache` は Spring Cache の保護を強化するアノテーションエコシステムである。`@Cacheable` の外側で `@RedisCacheable` を一行追加するだけで、Redis キャッシュに対するキャッシュ貫通、キャッシュブレークダウン、キャッシュアバランシェ、ホットキー早期リフレッシュへの対策を補い、再度 AOP を作り直すことなくオーケストレーション可能な責任チェーンを注入する。本ページは公開リポジトリ main の固定コミット `75ed279a`（v0.0.2）の宣言状態を扱う。observer のネスト実行契約は [ResiCache observer のネスト実行](/note/resicache-observer-nested-execution) を参照。

## コアメカニズム

### 責任チェーンと handler の順序

書き込みパスは `CacheHandlerChain` が組織し、順序は `HandlerOrder` enum が統一的に定義し、`@HandlerPriority` がバインドする：

1. BloomFilter（100）— 存在しない key を Bloom filter で遮断し、キャッシュ貫通を防ぐ。
2. SyncLock（200）— Redisson 分散ロックでキャッシュブレークダウンを防ぐ。`sync=true` で Redisson がない場合は暗黙に降格せず fail-fast する。
3. EarlyExpiration（250）— ホットキーを非同期で早期リフレッシュする。
4. TTL（300）— TTL にランダムな揺らぎ（デフォルト ±20%）を加え、アバランシェを防ぐ。
5. NullValue（400）— null 値をキャッシュして貫通を防ぐ（概念は [NullValue](/note/java-null-value) を参照）。
6. ActualCache（500）— 実際に Redis へ書き込む。

任意の handler は `output.skipRemaining=true` でチェーンを短絡でき、第三者 handler は `HandlerOrder` を拡張して途中に挿入できる。これは多段キャッシュを主眼とする JetCache との差であり、両者は代替ではなくスコープを補完する。

### 共存と接続境界

- `RedisCacheManager` / `CacheInterceptor` を継承するが、`@EnableCaching` は置き換えない。自動構成の入口は `RedisCacheAutoConfiguration` である。
- 純粋な `@Cacheable` はデフォルトで Spring ネイティブ（`nativeAnnotationMode=SELECTIVE`）を通り、横取りされない。保護属性が適用されるのは `@RedisCacheable` だけである。
- `resi-cache.*` プレフィックスは、グローバル、アノテーション単位、キャッシュ単位（`caches.<name>`）の 3 層上書きをサポートする。

## 適用条件

- 読み取りが多く、貫通／ブレークダウン／アバランシェ対策を宣言的に補いたい Spring Boot + Redis プロジェクト。
- アノテーション属性で各保護機能を明示的に有効化する意思があること（5 つの保護機能はすべてデフォルト `false`）。
- Java 21+、Spring Boot 4.0.0 parent、Redisson 3.50.0（optional）の技術スタック。

## 非適用条件とリスク

- **シリアライズエンベロープの非互換**：`{version, payload}` エンベロープは Spring デフォルトの `GenericJackson2JsonRedisSerializer` / `JdkSerializer` と互換性がない。既存プロジェクトで導入する場合は移行が必要で、移行しないと既存キャッシュがすべて無効になる。
- **デシリアライズのホワイトリストが作者パッケージに固定される**：独自の業務型は `allowed-package-prefixes` を明示設定しないと例外になる。
- **CLEAN は非アトミック**：`@CacheEvict(allEntries=true)` は SCAN + バッチ UNLINK/DEL を使う best-effort 処理である。Bloom を有効にした場合は `rebuild-window-seconds` により、削除後の再構築期間に静かな null が返ることを防ぐ。
- **Reactive 非対応**：インターセプターはブロッキング式のため、WebFlux のメソッドはキャッシュを発火しない。
- サーキットブレーカー、レート制限、多段ローカルキャッシュは意図的に範囲外（Not in Scope）であり、必要なら Resilience4j / Caffeine と組み合わせる。

## 最小検証

1. `io.github.davidhlp:ResiCache:0.0.2` を導入し、`@RedisCacheable` で単一の保護機能（例えば `randomTtl`）を有効化して TTL の揺らぎを観察する。
2. 2 プロセスで同時にロックを取り合い、`sync=true` の相互排他と fail-fast 挙動を検証する。
3. 独自型の読み書き前にホワイトリストプレフィックスを設定し、デシリアライズが例外にならないことを確認する。

## 証拠と不確実性

- **ソース事実**：位置付け、handler 順序、設定境界、既知の制限は固定コミット `75ed279a` の README（`resicache-project-overview`）に基づく。observer/scope token 契約は同コミットのソース分析（`resicache-observer-nested-execution-contract`）に基づく。
- **本ページの統合**：README の機能マトリクスを「メカニズム—境界—検証」の 3 部に整理した。
- **未確認**：ローカルワークスペースは `origin/main` より 14 コミット先行しているが、その未公開変更は含めない。負荷時の容量パラメータと Cluster/Sentinel モードの挙動は再現実験で検証していない。

## 関連ページ

- [resicache-observer-nested-execution](/note/resicache-observer-nested-execution)
- [java-null-value](/note/java-null-value)
- [redis-business-patterns](/note/redis-business-patterns)
- [redis-jackson-java-time](/note/redis-jackson-java-time)
