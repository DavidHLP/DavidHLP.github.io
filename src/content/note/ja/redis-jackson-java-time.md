---
title: "Redisson/Jackson による LocalDateTime のデフォルト直列化挙動と書き込み・読み出し非対称の境界"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java 基礎とバックエンドチューニング"
kind: concept
status: active
draft: true
sources: ["redis-jackson-java-time-contract"]
related: ["java-null-value", "java-online-performance-debug", "resicache-observer-nested-execution"]
tags: ["Redis", "Redisson", "Jackson", "JavaTime", "LocalDateTime", "Spring Data Redis", "Serialization"]
description: "デフォルトの JsonJacksonCodec と GenericJackson2JsonRedisSerializer が LocalDateTime に対して書き込み時に失敗する理由、Redisson のデフォルト codec が実は Kryo5Codec であること、そして三層の設定で書き込み・読み出し非対称を調べる判断経路を説明する。"
toc: true
---

**結論を先に**：Redisson 3.50.0 / Spring Data Redis 3.5.13 という固定バージョンの境界内では、デフォルトの Jackson 設定は `LocalDateTime` に対して**書き込み時に失敗する**（エンコード側が `InvalidDefinitionException` を投げる）のであって、「書き込み成功・読み出し失敗」ではない。真の書き込み・読み出し非対称は、書き込み側と読み出し側の Jackson 設定が一致しないときだけ現れる。

## 適用バージョンとシナリオ

| 項目              | バージョン境界                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Redisson          | `3.50.0`（git tag `redisson-3.50.0`、commit `f192ec15`）                                 |
| Jackson           | `jackson-databind` / `jackson-datatype-jsr310` `2.18.2`（redisson-parent 3.50.0 の BOM） |
| Spring Data Redis | `3.5.13`                                                                                 |
| 実験環境          | OpenJDK 21、Maven、純メモリでのエンコード/デコード、Redis server 不要                    |

適用シナリオ：Spring Data Redis の `RedisTemplate` や Redisson で、`LocalDateTime`/`LocalDate`/`LocalTime` フィールドを含む POJO を Jackson 直列化するときに、「直接 not supported by default を投げる」または本番での書き込み・読み出し不一致に遭遇したケース。以下の結論は固定タグのソースと最小実験による。**Redisson 2.x、Spring Data Redis 4.x、他の Jackson メジャーバージョンは未検証**であり、外挿できない。

## 根本原因：なぜ「書き込み時に失敗」か

### 1. デフォルト ObjectMapper は JavaTimeModule を登録しない

- `JsonJacksonCodec()` のデフォルトコンストラクタは `new ObjectMapper()`。`init()` は包含ポリシーとフィールド可視性の調整、`FAIL_ON_UNKNOWN_PROPERTIES`/`FAIL_ON_EMPTY_BEANS` の無効化、`WRITE_BIGDECIMAL_AS_PLAIN`/`SORT_PROPERTIES_ALPHABETICALLY` の有効化、Throwable mixin の追加だけを行う。`initTypeInclusion()` は `DefaultTyping.NON_FINAL` + `JsonTypeInfo.Id.CLASS` を設定する（出力に `@class` プロパティを含む）。**一連の処理で日付モジュールは一切登録されない**。
- `jackson-datatype-jsr310` は Redisson 3.50.0 の compile 依存だが、**jar が classpath にあること ≠ モジュールの登録**だ。`new ObjectMapper()` は ServiceLoader の自動検出をしない。`findAndRegisterModules()` または明示的な `registerModule(new JavaTimeModule())` が必要。
- バージョン抜き取り確認：3.9.0、3.12.5、3.17.7、3.25.0、3.30.0、3.40.0、3.44.0、3.46.0、3.50.0 の `JsonJacksonCodec` コンストラクタはすべて `new ObjectMapper()` で挙動も一致。2.x は未確認。
- `GenericJackson2JsonRedisSerializer`（3.5.13）のデフォルトコンストラクタチェーンも `new ObjectMapper()` + NullValueSerializer モジュール + default typing（`Id.CLASS`）であり、JavaTimeModule は同様に未登録。

したがって、`LocalDateTime` フィールドを含む POJO では、デフォルト設定で **encode/serialize 時**に次が投げられる：

```
com.fasterxml.jackson.databind.exc.InvalidDefinitionException:
Java 8 date/time type `java.time.LocalDateTime` not supported by default:
add Module "com.fasterxml.jackson.datatype:jackson-datatype-jsr310" to enable handling
```

失敗は書き込み側で起こり、「書き込み成功・読み出し失敗」には到達しない。plain な `new ObjectMapper()` は `LocalDateTime` に対して読み書き両側で同じ例外を投げる。

### 2. Redisson のデフォルト codec は JsonJacksonCodec ではない

`Config` は `getCodec() == null` のとき `new Kryo5Codec()` にフォールバックする。`JsonJacksonCodec` は明示的に `config.setCodec(...)` しないと効かない。デフォルト経路では LocalDateTime の直列化挙動は Kryo5 が決め、このページの Jackson 分析とは無関係だ。

## 最小の修正設定

### JsonJacksonCodec

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
config.setCodec(new JsonJacksonCodec(mapper));
```

### GenericJackson2JsonRedisSerializer

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
// 既存データが "@class" に依存している場合は同じ属性名を維持すること。本番ではデシリアライズ可能な型を制限する。
mapper.activateDefaultTypingAsProperty(
    mapper.getPolymorphicTypeValidator(),
    ObjectMapper.DefaultTyping.NON_FINAL,
    "@class");
RedisSerializer<Object> serializer = new GenericJackson2JsonRedisSerializer(mapper);
```

書き込み・読み出しの両側（異なる RedisTemplate インスタンス、key と value serializer）は**同じ設定**を使わなければならない。次節参照。

### 配列形式 vs ISO 形式

- デフォルトは `WRITE_DATES_AS_TIMESTAMPS=true`（ObjectMapper のデフォルト）→ `LocalDateTime` は配列 `[年,月,日,时,分,秒]` に直列化される。
- この feature を無効化すると ISO 文字列、例：`"2026-08-13T10:30:45"`。
- jsr310 のデシリアライザは**配列と ISO 文字列の両方の入力を受け付ける**。同じ codec 内の round-trip は等価で、保存形式自体は読み出し失敗を引き起こさない。
- ただし `WRITE_DATES_AS_TIMESTAMPS` は出力形式に影響する設定項目なので、書き込み側と読み出し側を揃え、暗黙の差異に依存しないようにする。

### default typing とモジュールの一貫性

- default typing は `@class` 型メタデータに依存する。default typing のない普通の ObjectMapper で書いた JSON を、default typing 付きの `GenericJackson2JsonRedisSerializer` で読むと、`SerializationException: Could not read JSON ... need JSON String that contains type id` が投げられる。
- モジュール集合（JavaTimeModule を含むか）と default typing は独立した二つの次元で、読み書き両側で**それぞれ一致**させなければならない。

## トラブルシューティングの判断経路（三層）

次の順で「書き込み例外」または「書き込み成功・読み出し失敗」を特定する：

1. **Jackson モジュール層**：エラーテキストは `Java 8 date/time type ... not supported by default: add Module ...jsr310` に固定される。これが出たら jsr310 が欠落または未登録。まず書き込み側と読み出し側**それぞれ**の ObjectMapper が `registerModule(new JavaTimeModule())` していることを確認する。実験 F1：jsr310 mapper が書いたバイトを plain ObjectMapper で読む → 書き込みは成功、読み出しは `InvalidDefinitionException`。「書き込み成功≠読み出し成功」の第一の由来。
2. **RedisTemplate serializer 層**：読み書き両側で異なる `RedisSerializer` を設定できる（異なる RedisTemplate インスタンス、key/hash serializer の違い、ロールバック後の設定不一致）。デフォルトの `GenericJackson2JsonRedisSerializer` は書き込み時に失敗する。両側とも `JavaTimeModule` 付きで default typing が一致したカスタム mapper を設定して初めて読み書き両成功になる。実験 F2：default typing なしで書き込み + デフォルト serializer で読み出し → タイプ id 欠落の例外。時間とは独立した第二の由来。
3. **Redisson codec 層**：同一の `JsonJacksonCodec` インスタンスはエンコード/デコードで同じ ObjectMapper を共有する（構築時に `copy()`）。天然に対称。非対称は、構築時に異なる ObjectMapper を渡したか、同一の key 空間を異なる codec/serializer で混用した場合だけ起こり得る。デフォルト codec は書き込み時に失敗するので、書き込み・読み出し非対称は存在しない。

**「書き込み成功≠読み出し成功」の厳密条件**：書き込み側と読み出し側の Jackson 設定が一致せず（モジュール集合、`WRITE_DATES_AS_TIMESTAMPS`、default typing、`@JsonFormat` など）、その差異が読み出し側で顕在化する場合に限り成立する。`LocalDateTime` の保存形式（配列 vs ISO）自体は読み出し失敗を引き起こさない。

## 失敗の境界

- 実 Redis server に未接続：検証したのは codec/serializer のローカルなエンコード/デコード挙動で、ネットワーク往復は未検証。
- `CborJacksonCodec`、`MsgPackJacksonCodec`、`TypedJsonJacksonCodec`、`JacksonCodec` など他の codec は未検証。
- モジュール/typing 不一致以外の書き込み・読み出し非対称の成因（`@JsonFormat` パターン不一致、アプリのアップグレード・ロールバック、複数 key 空間の混用）は raw で論理推論と明記され、一つずつ実験されていない。引用時は推論として扱う。
- ロールバック/クリーンアップ：本番で読み出し失敗が出たら、まず書き込み側と読み出し側の設定が同一出典か（同じ codec/serializer 設定クラスか）を確認する。ロールバックは両側同時に行い、読み出し側だけ戻して新たな非対称を作らないようにする。

## 最小検証

- Redis server 不要：codec/serializer のエンコード/デコードは純メモリ操作。使い捨て Maven プロジェクトが `org.redisson:redisson:3.50.0`、`jackson-databind:2.18.2`、`jackson-datatype-jsr310:2.18.2`、`spring-data-redis:3.5.13` に依存し、メインクラスが 8 グループを assert する：plain mapper の書き込み/読み出し失敗、jsr310 の配列/ISO 二形式 round-trip、デフォルト codec の失敗と時間なし POJO round-trip、明示モジュール codec の成功、デフォルト Spring serializer の失敗、設定横断の読み出し失敗。`RESULT: ALL PASS` を出力する。
- 純ソース再現：固定タグで `JsonJacksonCodec` コンストラクタ行を読むと、デフォルトの plain ObjectMapper が確認できる。

## 証拠と不確実性

- **情報源の事実**：`redis-jackson-java-time-contract`（固定タグソース + 最小実験）が、デフォルトコンストラクタ、失敗の例外テキスト、Kryo5Codec フォールバック、モジュール登録後の配列/ISO 二形式 round-trip、F1/F2 の二種の設定横断読み出し失敗を裏付ける。
- **本ページの総合**：問題を「書き込み時に失敗」と「書き込み・読み出し非対称」の二現象に整理し、三層の判断経路と厳密条件を示す。
- **未確認**：実 Redis のネットワーク往復、Redisson の他の codec、Spring Data Redis 4.x と Redisson 2.x の挙動、および `@JsonFormat`/ロールバック/複数 key 空間による読み出し失敗は未実験の推論であり、対象バージョンでの実測が必要。

## 関連ページ

- [NullValue：null をキャッシュするプレースホルダオブジェクトと直列化の境界](/ja/note/java-null-value)
- [Java 本番パフォーマンストラブルシューティング：症状から証拠への最小決定木](/ja/note/java-online-performance-debug)
