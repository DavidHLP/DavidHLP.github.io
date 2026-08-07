---
title: "NullValue：キャッシュ null のプレースホルダーとシリアライズ境界"
timestamp: 2025-10-07 21:43:00+08:00
series: "Java 基礎とバックエンドチューニング"
kind: concept
status: active
sources: ["legacy-java-null-value"]
related: ["java-online-performance-debug", "java-auto-closeable", "java-internship-interview-blog-polished"]
tags: ["Java", "Spring Cache", "Caching", "Null Object", "Design Patterns"]
description: "キャッシュで key 不在と業務上の null を区別する理由、NullValue が負の結果を保持してキャッシュ穿透を抑える仕組み、singleton とシリアライズの境界を整理します。"
toc: true
---

`NullValue` は「key は存在するが業務結果は null」という状態をキャッシュ層で表すプレースホルダーです。本ページでは、不在データへの繰り返しアクセスを防ぐ方法と、プレースホルダーの singleton/シリアライズ意味論をキャッシュ境界内に閉じ込める理由を説明します。

## 核心メカニズム

### 1. miss と negative hit を分ける

負の結果を保存しない場合、不在オブジェクトへの要求は毎回「cache miss → DB → null」を繰り返します。存在しない hot key がこの経路を繰り返さないよう、キャッシュは三つの状態を表します。

| キャッシュの観測 | 業務上の意味 | 次の動作 |
| --- | --- | --- |
| key がない | 未検索、または期限切れ | 回源して保存可否を決める |
| key があり値が `NullValue` | 不在を確認済み | 回源せず業務上の `null` を返す |
| key がありオブジェクト | 実値の hit | オブジェクトを返す |

Spring Cache の抽象は次のように縮約できます。

```java
store = value == null ? NullValue.INSTANCE : value;
value = store == NullValue.INSTANCE ? null : store;
```

業務メソッドは `null` を返し続け、バックエンドには識別可能な non-null オブジェクトが保存されます。`ConcurrentHashMap` のように null を受け付けないコンテナでも負の結果を保持できます。

### 2. プレースホルダーの三つの制約

- `final` と private constructor で拡張や余分な instance を制限する。
- `static final INSTANCE` で JVM 内の一つの標識を再利用し、adapter は identity で認識できる。
- `Serializable` と `readResolve()` で Java シリアライズ後に canonical instance を返し、デシリアライズしたオブジェクトが `INSTANCE` と別 identity になるのを防ぐ。

`equals(null)`、安定した `hashCode()`、`toString()` は表示上の意味を補助します。業務コードは `NullValue` をユーザーオブジェクトとして扱いません。

### 3. プレースホルダーは整合性戦略ではない

負のキャッシュが遮断できるのは、すでに観測した不在 key だけです。短い TTL、作成/更新時の明示的な invalidation が必要です。パラメータ検証、Bloom filter、rate limit、single-flight は別の段階を守るため、トラフィックとデータ特性に応じて組み合わせます。

## 適用条件

- 「不在」がキャッシュ可能な業務結果で、繰り返しの回源が DB や下流に負荷を与える。
- adapter が保存前に `null` を marker へ変換し、読み出し後に戻し、業務層へ marker を漏らさない。
- 負キャッシュの TTL、invalidation、シリアライザの挙動を定義し、作成直後の短い stale を許容できる。
- cache miss、negative hit、実オブジェクトを区別する必要があり、空文字を null の代用にしない。

## 不適用とリスク

- `NullValue` は万能の穿透対策ではありません。ランダム/不正 key には検証、Bloom filter、rate limit などの入口制御が必要です。
- TTL が長いと新規作成データを隠します。強整合の経路では負キャッシュを無効にするか同期 invalidation を行います。
- シリアライズは実装境界です。プロセス、言語、Spring、cache serializer が異なると `NullValue` を認識できない可能性があります。`readResolve()` だけで遠隔互換性は証明できません。
- null、空文字、空コレクション、key 不在は別の意味です。文字列 marker は業務データを汚染します。
- 業務層が `NullValue.INSTANCE` を判定し始めたら抽象が漏れています。変換を adapter に戻します。

## 最小検証

1. 実際に不在の key を選び、初回だけ回源して負 marker を保存し、二回目は DB にアクセスせず marker hit になることを確認する。
2. メモリキャッシュと実際のシリアライズキャッシュで同じテストを行い、adapter の業務結果が `null` のまま、miss とは区別できることを確認する。
3. marker をシリアライズ/反シリアライズする。Java 標準シリアライズでは `INSTANCE` と identity を比較し、本番 serializer は別途互換性を検証する。
4. 実オブジェクトを保存した後、invalidation または TTL 期限切れで見えることを確認し、回源回数、負 hit 率、stale 窓を記録する。

## 証拠と不確実性

- **出典事実**：`legacy-java-null-value` は Spring `NullValue` の marker、singleton、`readResolve`、`toStoreValue/fromStoreValue`、短い TTL、Bloom filter との関係を示しています。
- **本ページの統合**：問題を miss/negative hit/positive hit の三状態として表し、serializer 互換性と invalidation を配備境界に置きました。
- **未確認**：特定の Spring 版、Redis serializer、異言語クライアントの互換性は実構成と実験が必要です。出典は一つの遠隔動作を保証しません。

## 関連ページ

- [Java 本番性能トラブルシューティング：症状から証拠への最小判断木](/note/java-online-performance-debug)
- [AutoCloseable：リソース所有権と close 例外の意味](/note/java-auto-closeable)
- [Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠](/note/java-internship-interview-blog-polished)
