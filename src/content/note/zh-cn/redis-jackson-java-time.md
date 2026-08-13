---
title: "Redisson/Jackson 对 LocalDateTime 的默认序列化行为与写读不对称边界"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java 基础与后端调优"
kind: concept
status: active
sources: ["redis-jackson-java-time-contract"]
related: ["java-null-value", "java-online-performance-debug"]
tags: ["Redis", "Redisson", "Jackson", "JavaTime", "LocalDateTime", "Spring Data Redis", "Serialization"]
description: "说明默认 JsonJacksonCodec 与 GenericJackson2JsonRedisSerializer 为什么对 LocalDateTime 写入即失败、Redisson 默认 codec 实为 Kryo5Codec，以及按三层配置排查写读不对称的决策路径。"
toc: true
---

**结论优先**：在 Redisson 3.50.0 / Spring Data Redis 3.5.13 的固定版本边界内，默认 Jackson 配置对 `LocalDateTime` 是**写入即失败**（编码侧抛 `InvalidDefinitionException`），而不是"写成功读失败"。真正的写读不对称只出现在写入器与读取器 Jackson 配置不一致时。

## 适用版本与场景

| 项 | 版本边界 |
| --- | --- |
| Redisson | `3.50.0`（git tag `redisson-3.50.0`，commit `f192ec15`） |
| Jackson | `jackson-databind` / `jackson-datatype-jsr310` `2.18.2`（redisson-parent 3.50.0 的 BOM） |
| Spring Data Redis | `3.5.13` |
| 实验环境 | OpenJDK 21、Maven，纯内存编解码，无需 Redis server |

适用场景：在 Spring Data Redis 的 `RedisTemplate` 或 Redisson 中使用 Jackson 序列化含 `LocalDateTime`/`LocalDate`/`LocalTime` 字段的 POJO，遇到"直接抛 not supported by default"或线上写读不一致。以下结论以固定标签源码和最小实验为准；**Redisson 2.x、Spring Data Redis 4.x、其他 Jackson 大版本未验证**，不能外推。

## 根因：为什么"写入即失败"

### 1. 默认 ObjectMapper 不注册 JavaTimeModule

- `JsonJacksonCodec()` 默认构造器是 `new ObjectMapper()`；`init()` 只调整包含策略、字段可见性、关闭 `FAIL_ON_UNKNOWN_PROPERTIES`/`FAIL_ON_EMPTY_BEANS`、开启 `WRITE_BIGDECIMAL_AS_PLAIN`/`SORT_PROPERTIES_ALPHABETICALLY`，并追加 Throwable mixin；`initTypeInclusion()` 设置 `DefaultTyping.NON_FINAL` + `JsonTypeInfo.Id.CLASS`（输出含 `@class` 属性）。**全程不注册任何日期模块**。
- `jackson-datatype-jsr310` 虽是 Redisson 3.50.0 的 compile 依赖，但 **jar 在 classpath ≠ 模块已注册**：`new ObjectMapper()` 不做 ServiceLoader 自动发现，必须 `findAndRegisterModules()` 或显式 `registerModule(new JavaTimeModule())`。
- 版本抽查：3.9.0、3.12.5、3.17.7、3.25.0、3.30.0、3.40.0、3.44.0、3.46.0、3.50.0 的 `JsonJacksonCodec` 构造器均为 `new ObjectMapper()`，行为一致；2.x 未核对。
- `GenericJackson2JsonRedisSerializer`（3.5.13）默认构造器链同样是 `new ObjectMapper()` + NullValueSerializer 模块 + default typing（`Id.CLASS`），同样未注册 JavaTimeModule。

因此对含 `LocalDateTime` 字段的 POJO，默认配置下 **encode/serialize 时**就抛：

```
com.fasterxml.jackson.databind.exc.InvalidDefinitionException:
Java 8 date/time type `java.time.LocalDateTime` not supported by default:
add Module "com.fasterxml.jackson.datatype:jackson-datatype-jsr310" to enable handling
```

失败发生在写入侧，根本到不了"写成功读失败"；plain `new ObjectMapper()` 对 `LocalDateTime` 的读写两侧都会抛同样异常。

### 2. Redisson 默认 codec 不是 JsonJacksonCodec

`Config` 在 `getCodec() == null` 时回退为 `new Kryo5Codec()`。`JsonJacksonCodec` 必须显式 `config.setCodec(...)` 才生效；默认路径下 LocalDateTime 的序列化行为由 Kryo5 决定，与本文 Jackson 分析无关。

## 最小修复配置

### JsonJacksonCodec

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
config.setCodec(new JsonJacksonCodec(mapper));
```

### GenericJackson2JsonRedisSerializer

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
// 若既有数据依赖 "@class"，必须沿用相同属性名；生产中应限制可反序列化类型。
mapper.activateDefaultTypingAsProperty(
    mapper.getPolymorphicTypeValidator(),
    ObjectMapper.DefaultTyping.NON_FINAL,
    "@class");
RedisSerializer<Object> serializer = new GenericJackson2JsonRedisSerializer(mapper);
```

读写两侧（不同 RedisTemplate 实例、key 与 value serializer）必须使用**同一套配置**，见下节。

### 数组形态 vs ISO 形态

- 默认 `WRITE_DATES_AS_TIMESTAMPS=true`（ObjectMapper 默认）→ `LocalDateTime` 序列化为数组 `[年,月,日,时,分,秒]`。
- 关闭该 feature → ISO 字符串，如 `"2026-08-13T10:30:45"`。
- jsr310 反序列化器对**数组和 ISO 字符串两种输入都接受**，同一 codec 内 round-trip 相等；存储形态本身不构成读失败。
- 但 `WRITE_DATES_AS_TIMESTAMPS` 是会影响输出形态的配置项，写入器与读取器应保持一致，避免依赖隐性差异。

### default typing 与模块一致性

- default typing 依赖 `@class` 类型元数据：用无 default typing 的普通 ObjectMapper 写出的 JSON，交给带 default typing 的 `GenericJackson2JsonRedisSerializer` 读，会抛 `SerializationException: Could not read JSON ... need JSON String that contains type id`。
- 模块集合（是否含 JavaTimeModule）与 default typing 是两套独立维度，读写两侧必须**分别一致**。

## 排查决策路径（三层）

按下面顺序定位"写入异常"或"写成功读失败"：

1. **Jackson 模块层**：报错文本固定为 `Java 8 date/time type ... not supported by default: add Module ...jsr310`。出现即表示 jsr310 缺失或未注册；先确认写入器和读取器**各自的** ObjectMapper 都 `registerModule(new JavaTimeModule())`。实验 F1：jsr310 mapper 写出的字节交给 plain ObjectMapper 读 → 写入成功、读取抛 `InvalidDefinitionException`，这是"写成功≠读成功"的第一种来源。
2. **RedisTemplate serializer 层**：读写两侧可配置不同 `RedisSerializer`（不同 RedisTemplate 实例、key/hash serializer 不同、回滚后配置不一致）。默认 `GenericJackson2JsonRedisSerializer` 写即失败；只有两侧都配置带 `JavaTimeModule` 且 default typing 一致的自定义 mapper 才能写读双成功。实验 F2：无 default typing 写入 + 默认 serializer 读取 → 类型 id 缺失异常，是独立于时间的第二种来源。
3. **Redisson codec 层**：同一 `JsonJacksonCodec` 实例编码/解码共享同一 ObjectMapper（构造时 `copy()`），天然对称；不对称只可能来自构造时传入不同 ObjectMapper、或同一 key 空间被不同 codec/serializer 混用。默认 codec 写即失败，不存在读写不对称。

**"写成功≠读成功"的严格条件**：当且仅当写入器与读取器的 Jackson 配置不一致（模块集合、`WRITE_DATES_AS_TIMESTAMPS`、default typing、`@JsonFormat` 等），且该差异在读取器一侧暴露时成立。`LocalDateTime` 的存储形态（数组 vs ISO）本身不触发读失败。

## 失败边界

- 未连接真实 Redis server：断言的是 codec/serializer 的本地编解码行为，未做网络往返验证。
- 未验证 `CborJacksonCodec`、`MsgPackJacksonCodec`、`TypedJsonJacksonCodec`、`JacksonCodec` 等其他 codec。
- 写读不对称除模块/typing 不一致外的成因（`@JsonFormat` 模式不一致、应用升级回滚、多 key 空间混用）在 raw 中标注为逻辑推导，未逐一实验，引用时按推断对待。
- 回滚/清理：若线上出现读失败，先核对写入端与读取端配置是否同源（同一个 codec/serializer 配置类）；回滚应同时回滚两侧，避免只回滚读取端造成新不对称。

## 最小验证

- 无需 Redis server：codec/serializer 编解码是纯内存操作。临时 Maven 工程依赖 `org.redisson:redisson:3.50.0`、`jackson-databind:2.18.2`、`jackson-datatype-jsr310:2.18.2`、`spring-data-redis:3.5.13`，主类断言 8 组：plain mapper 写/读失败、jsr310 数组/ISO 双形态 round-trip、默认 codec 失败与无时间 POJO round-trip、显式模块 codec 成功、默认 Spring serializer 失败、跨配置读失败，输出 `RESULT: ALL PASS`。
- 纯源码复现：读固定标签下 `JsonJacksonCodec` 构造器行，可见默认 plain ObjectMapper。

## 证据与不确定性

- **来源事实**：`redis-jackson-java-time-contract`（固定标签源码 + 最小实验）证实默认构造器、失败异常文本、Kryo5Codec 回退、注册模块后的数组/ISO 双形态 round-trip，以及 F1/F2 两种跨配置读失败。
- **本页综合**：把问题组织为"写入即失败"与"写读不对称"两类现象，并给出三层决策路径与严格条件。
- **未确认项**：真实 Redis 网络往返、Redisson 其他 codec、Spring Data Redis 4.x 与 Redisson 2.x 行为，以及 `@JsonFormat`/回滚/多 key 空间导致的读失败为未实验推断，需在目标版本上实测。

## 相关页面

- [NullValue：缓存 null 的占位对象与序列化边界](/note/java-null-value)
- [Java 线上性能排障：从症状到证据的最小决策树](/note/java-online-performance-debug)
