---
title: "Redisson/Jackson's Default Serialization Behavior for LocalDateTime and the Write-Read Asymmetry Boundary"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["redis-jackson-java-time-contract"]
related: ["java-null-value", "java-online-performance-debug", "resicache-observer-nested-execution"]
tags: ["Redis", "Redisson", "Jackson", "JavaTime", "LocalDateTime", "Spring Data Redis", "Serialization"]
description: "Explains why the default JsonJacksonCodec and GenericJackson2JsonRedisSerializer fail at write time for LocalDateTime, that the Redisson default codec is actually Kryo5Codec, and the three-layer decision path for troubleshooting write-read asymmetry."
toc: true
---

**Conclusion first**: Within the pinned version boundaries of Redisson 3.50.0 / Spring Data Redis 3.5.13, the default Jackson configuration **fails at write time** for `LocalDateTime` (the encoding side throws `InvalidDefinitionException`) rather than "write succeeds, read fails". A real write-read asymmetry only appears when the writer's and reader's Jackson configurations differ.

## Applicable versions and scenarios

| Item | Version boundary |
| --- | --- |
| Redisson | `3.50.0` (git tag `redisson-3.50.0`, commit `f192ec15`) |
| Jackson | `jackson-databind` / `jackson-datatype-jsr310` `2.18.2` (BOM of redisson-parent 3.50.0) |
| Spring Data Redis | `3.5.13` |
| Experiment environment | OpenJDK 21, Maven, pure in-memory encoding/decoding, no Redis server needed |

Applicable scenario: when using Jackson serialization in Spring Data Redis's `RedisTemplate` or in Redisson for POJOs containing `LocalDateTime`/`LocalDate`/`LocalTime` fields, and you hit "directly throws not supported by default" or write-read inconsistency in production. The conclusions below are based on the pinned-tag source and minimal experiments; **Redisson 2.x, Spring Data Redis 4.x, and other Jackson major versions are not verified** and cannot be extrapolated.

## Root cause: why "fail at write time"

### 1. The default ObjectMapper does not register JavaTimeModule

- The `JsonJacksonCodec()` default constructor is `new ObjectMapper()`; `init()` only adjusts the inclusion policy and field visibility, disables `FAIL_ON_UNKNOWN_PROPERTIES`/`FAIL_ON_EMPTY_BEANS`, enables `WRITE_BIGDECIMAL_AS_PLAIN`/`SORT_PROPERTIES_ALPHABETICALLY`, and appends the Throwable mixin; `initTypeInclusion()` sets `DefaultTyping.NON_FINAL` + `JsonTypeInfo.Id.CLASS` (the output contains the `@class` property). **No date module is registered anywhere in the flow**.
- `jackson-datatype-jsr310` is a compile dependency of Redisson 3.50.0, but **a jar on the classpath ≠ the module being registered**: `new ObjectMapper()` does no ServiceLoader auto-discovery; you must `findAndRegisterModules()` or explicitly `registerModule(new JavaTimeModule())`.
- Version spot checks: the `JsonJacksonCodec` constructors of 3.9.0, 3.12.5, 3.17.7, 3.25.0, 3.30.0, 3.40.0, 3.44.0, 3.46.0, and 3.50.0 are all `new ObjectMapper()`, with consistent behavior; 2.x was not checked.
- The `GenericJackson2JsonRedisSerializer` (3.5.13) default constructor chain is likewise `new ObjectMapper()` + NullValueSerializer module + default typing (`Id.CLASS`), again without registering JavaTimeModule.

Therefore, for a POJO with a `LocalDateTime` field, the default configuration throws at **encode/serialize time**:

```
com.fasterxml.jackson.databind.exc.InvalidDefinitionException:
Java 8 date/time type `java.time.LocalDateTime` not supported by default:
add Module "com.fasterxml.jackson.datatype:jackson-datatype-jsr310" to enable handling
```

The failure happens on the write side and never reaches "write succeeds, read fails"; a plain `new ObjectMapper()` throws the same exception on both read and write for `LocalDateTime`.

### 2. The Redisson default codec is not JsonJacksonCodec

`Config` falls back to `new Kryo5Codec()` when `getCodec() == null`. `JsonJacksonCodec` only takes effect with an explicit `config.setCodec(...)`; under the default path, `LocalDateTime` serialization behavior is decided by Kryo5 and is unrelated to this page's Jackson analysis.

## Minimal fix configuration

### JsonJacksonCodec

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
config.setCodec(new JsonJacksonCodec(mapper));
```

### GenericJackson2JsonRedisSerializer

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
// If existing data relies on "@class", you must keep the same property name; restrict deserializable types in production.
mapper.activateDefaultTypingAsProperty(
    mapper.getPolymorphicTypeValidator(),
    ObjectMapper.DefaultTyping.NON_FINAL,
    "@class");
RedisSerializer<Object> serializer = new GenericJackson2JsonRedisSerializer(mapper);
```

Both the write and read sides (different RedisTemplate instances, key and value serializers) must use **the same configuration**; see the next section.

### Array form vs ISO form

- The default `WRITE_DATES_AS_TIMESTAMPS=true` (ObjectMapper default) → `LocalDateTime` serializes to the array `[年,月,日,时,分,秒]`.
- Disabling that feature → ISO string, e.g. `"2026-08-13T10:30:45"`.
- The jsr310 deserializer **accepts both array and ISO string inputs**; round-trip within the same codec is equal; the stored form itself does not constitute a read failure.
- But `WRITE_DATES_AS_TIMESTAMPS` is a configuration item that affects the output form; the writer and reader should stay consistent to avoid relying on implicit differences.

### default typing and module consistency

- default typing relies on the `@class` type metadata: JSON written by a plain ObjectMapper without default typing, when read by a `GenericJackson2JsonRedisSerializer` with default typing, throws `SerializationException: Could not read JSON ... need JSON String that contains type id`.
- The module set (whether JavaTimeModule is included) and default typing are two independent dimensions; the write and read sides must be **individually consistent**.

## Troubleshooting decision path (three layers)

Locate "write exception" or "write succeeds, read fails" in this order:

1. **Jackson module layer**: the error text is fixed as `Java 8 date/time type ... not supported by default: add Module ...jsr310`. Its presence means jsr310 is missing or not registered; first confirm that the writer's and reader's **respective** ObjectMappers both `registerModule(new JavaTimeModule())`. Experiment F1: bytes written by a jsr310 mapper read by a plain ObjectMapper → write succeeds, read throws `InvalidDefinitionException`; this is the first source of "write success ≠ read success".
2. **RedisTemplate serializer layer**: the two sides can be configured with different `RedisSerializer` (different RedisTemplate instances, different key/hash serializers, inconsistent configuration after a rollback). The default `GenericJackson2JsonRedisSerializer` fails at write time; only when both sides use a custom mapper with `JavaTimeModule` and consistent default typing can both write and read succeed. Experiment F2: write without default typing + read with the default serializer → type-id-missing exception; this is a second source independent of time.
3. **Redisson codec layer**: one `JsonJacksonCodec` instance shares one ObjectMapper for encoding/decoding (a `copy()` at construction), naturally symmetric; asymmetry can only come from passing different ObjectMappers at construction, or the same key space being mixed across different codecs/serializers. The default codec fails at write time, so no write-read asymmetry exists.

**The strict condition for "write success ≠ read success"**: it holds if and only if the writer's and reader's Jackson configurations differ (module set, `WRITE_DATES_AS_TIMESTAMPS`, default typing, `@JsonFormat`, etc.) and that difference surfaces on the reader side. The stored form of `LocalDateTime` (array vs ISO) itself does not trigger read failure.

## Failure boundaries

- No real Redis server connected: what is asserted is the local encode/decode behavior of the codec/serializer; no network round-trip was verified.
- `CborJacksonCodec`, `MsgPackJacksonCodec`, `TypedJsonJacksonCodec`, `JacksonCodec` and other codecs were not verified.
- Causes of write-read asymmetry other than module/typing inconsistency (`@JsonFormat` pattern mismatch, application upgrade rollback, mixed multi-key-space use) are marked as logical inference in the raw source and were not tested one by one; treat them as inference when citing.
- Rollback/cleanup: if a read failure appears in production, first check whether the write and read configurations share a source (the same codec/serializer config class); roll back both sides at once to avoid creating a new asymmetry by rolling back only the reader.

## Minimal verification

- No Redis server needed: codec/serializer encode/decode is a pure in-memory operation. A throwaway Maven project depends on `org.redisson:redisson:3.50.0`, `jackson-databind:2.18.2`, `jackson-datatype-jsr310:2.18.2`, and `spring-data-redis:3.5.13`; the main class asserts 8 groups: plain mapper write/read failure, jsr310 array/ISO dual-form round-trip, default codec failure and time-free POJO round-trip, explicit-module codec success, default Spring serializer failure, and cross-config read failure, printing `RESULT: ALL PASS`.
- Pure source reproduction: read the `JsonJacksonCodec` constructor line at the pinned tag; the default plain ObjectMapper is visible.

## Evidence and uncertainty

- **Source facts**: `redis-jackson-java-time-contract` (pinned-tag source + minimal experiments) confirms the default constructor, the failure exception text, the Kryo5Codec fallback, the array/ISO dual-form round-trip after module registration, and the two cross-config read failures F1/F2.
- **This page's synthesis**: organizes the problem into two phenomena, "fail at write time" and "write-read asymmetry", and gives a three-layer decision path and strict conditions.
- **Unconfirmed**: real Redis network round-trips, other Redisson codecs, Spring Data Redis 4.x and Redisson 2.x behavior, and read failures caused by `@JsonFormat`/rollback/multi-key-space are unexperimented inferences that need to be measured on the target version.

## Related pages

- [NullValue: placeholder objects for caching null and the serialization boundary](/en/note/java-null-value)
- [Java online performance troubleshooting: the minimal decision tree from symptom to evidence](/en/note/java-online-performance-debug)
