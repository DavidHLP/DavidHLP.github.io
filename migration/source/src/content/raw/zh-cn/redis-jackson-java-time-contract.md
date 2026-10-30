---
title: "Redisson/Jackson 对 LocalDateTime 的默认行为与写读不对称边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-and-minimal-experiment
sourceUrl: "https://github.com/redisson/redisson/tree/redisson-3.50.0"
immutable: true
tags: [Redisson, Jackson, JavaTime, LocalDateTime, Redis, Spring Data Redis]
description: "以 Redisson 3.50.0 与 Spring Data Redis 3.5.13 固定标签源码和临时 Maven 最小实验（Java 21，无 Redis server）核实 JsonJacksonCodec 与 GenericJackson2JsonRedisSerializer 对 java.time.LocalDateTime 的真实默认行为，并界定“写成功不等于读成功”的三层适用条件。"
---

# Redisson/Jackson 对 LocalDateTime 的默认行为

版本边界：Redisson `3.50.0`（2026-08-13 时 Maven Central 最新）、Jackson BOM `2.18.2`（redisson-parent 3.50.0 导入）、Spring Data Redis `3.5.13`。后续版本需用固定标签源码和真实实验重新核对。

## 固定点

| 项 | 值 |
| --- | --- |
| Redisson | `org.redisson:redisson:3.50.0`，git tag `redisson-3.50.0`（commit `f192ec15`） |
| Jackson | `jackson-databind`/`jackson-datatype-jsr310` `2.18.2`（redisson-parent 3.50.0 以 jackson-bom 2.18.2 管理） |
| Spring Data Redis | `org.springframework.data:spring-data-redis:3.5.13` |
| 实验环境 | OpenJDK 21.0.2、Maven 3.9.16 |

## 来源（稳定 URL）

- Redisson `JsonJacksonCodec.java` @ redisson-3.50.0：`https://github.com/redisson/redisson/blob/redisson-3.50.0/redisson/src/main/java/org/redisson/codec/JsonJacksonCodec.java`
- Redisson `Config.java` @ redisson-3.50.0：`https://github.com/redisson/redisson/blob/redisson-3.50.0/redisson/src/main/java/org/redisson/config/Config.java`
- `redisson-3.50.0.pom`：`https://repo1.maven.org/maven2/org/redisson/redisson/3.50.0/redisson-3.50.0.pom`
- `redisson-parent-3.50.0.pom`：`https://repo1.maven.org/maven2/org/redisson/redisson-parent/3.50.0/redisson-parent-3.50.0.pom`
- Spring Data Redis `GenericJackson2JsonRedisSerializer.java` @ 3.5.13：`https://github.com/spring-projects/spring-data-redis/blob/3.5.13/src/main/java/org/springframework/data/redis/serializer/GenericJackson2JsonRedisSerializer.java`
- `spring-data-redis-3.5.13.pom`：`https://repo1.maven.org/maven2/org/springframework/data/spring-data-redis/3.5.13/spring-data-redis-3.5.13.pom`
- Maven Central 版本索引：`https://search.maven.org/solrsearch/select?q=g:org.redisson+AND+a:redisson`

## 最小事实

### 1. JsonJacksonCodec 默认是 plain ObjectMapper，不注册 JavaTimeModule

`JsonJacksonCodec()` 默认构造器为 `this(new ObjectMapper())`（固定标签源码）。`init()` 只调整 NON_NULL 包含策略、字段可见性、关闭 FAIL_ON_UNKNOWN_PROPERTIES/FAIL_ON_EMPTY_BEANS、开启 WRITE_BIGDECIMAL_AS_PLAIN/SORT_PROPERTIES_ALPHABETICALLY 并加 Throwable mixin；`initTypeInclusion()` 设置 DefaultTyping.NON_FINAL + `JsonTypeInfo.Id.CLASS`（序列化结果含 `@class` 属性）。两者都不注册任何日期模块。

- `jackson-datatype-jsr310` 在 Redisson 3.50.0 的 classpath 上是 compile 依赖（pom 声明），但 **jar 在 classpath ≠ 模块已注册**；`new ObjectMapper()` 不做 ServiceLoader 模块发现（需 `findAndRegisterModules()` 或显式 `registerModule`）。
- 版本边界：3.9.0、3.12.5、3.17.7、3.25.0、3.30.0、3.40.0、3.44.0、3.46.0、3.50.0 的 `JsonJacksonCodec` 构造器均为 `new ObjectMapper()`，行为一致；2.x 未核对。

### 2. 默认 JsonJacksonCodec 对含 LocalDateTime 的 POJO：写入即抛异常

实验（内存 encode/decode，无 Redis server）结果：`new JsonJacksonCodec()` 对含 `LocalDateTime` 字段的 POJO 调用 `getValueEncoder().encode(...)` 抛：

```
com.fasterxml.jackson.databind.exc.InvalidDefinitionException:
Java 8 date/time type `java.time.LocalDateTime` not supported by default:
add Module "com.fasterxml.jackson.datatype:jackson-datatype-jsr310" to enable handling
```

即默认配置下 **写失败发生在编码侧**，根本到不了"写成功读失败"。

### 3. 显式注册 JavaTimeModule 后：写入成功且可回读

`new JsonJacksonCodec(new ObjectMapper().registerModule(new JavaTimeModule()))` 对同一 POJO 编码成功，JSON 为：

```json
{"@class":"exp.Exp$Ev","created":[2026,8,13,10,30,45],"name":"demo"}
```

- 默认 `WRITE_DATES_AS_TIMESTAMPS=true`（ObjectMapper 默认值）→ `LocalDateTime` 序列化为数组 `[年,月,日,时,分,秒]`。
- 关闭该 feature → ISO 字符串 `"2026-08-13T10:30:45"`。
- jsr310 反序列化器对数组与 ISO 字符串两种输入都接受；同一 codec 内 round-trip 相等。
- 对比：无模块的 plain `new ObjectMapper()` 序列化/反序列化 `LocalDateTime` 均抛同样 `InvalidDefinitionException`。

### 4. Redisson 默认 codec 不是 JsonJacksonCodec

`Config` 在 `getCodec() == null` 时回退为 `new Kryo5Codec()`（Config.java 固定标签源码）。`JsonJacksonCodec` 需显式 `config.setCodec(...)` 才会生效。

### 5. Spring Data Redis GenericJackson2JsonRedisSerializer 默认也不注册 JavaTimeModule

3.5.13 固定标签源码：默认构造器链最终是 `new ObjectMapper()` + NullValueSerializer 的 SimpleModule + default typing（`Id.CLASS` 属性）。实验：对含 `LocalDateTime` 的 POJO `serialize(...)` 抛 `SerializationException`（包装 InvalidDefinitionException，消息同第 2 节"not supported by default"）——同样是**写入失败**。

## “写成功不等于读成功”的适用条件

失败是否发生在读取侧，取决于三层配置是否两侧一致：

1. **Jackson 模块层**：报错文本固定为 `Java 8 date/time type ... not supported by default: add Module "com.fasterxml.jackson.datatype:jackson-datatype-jsr310"`，仅在 jsr310 缺失或未注册时出现。写入器有模块、读取器无模块（或反之）时，写入成功而读取抛异常。实验 F1：jsr310 mapper 写出的字节交给 plain ObjectMapper 读 → `InvalidDefinitionException`。
2. **RedisTemplate serializer 层**：读写两侧可配置不同 `RedisSerializer`（不同 RedisTemplate 实例、key/hash 序列化器不同、或线上回滚后配置不一致）。默认 `GenericJackson2JsonRedisSerializer` 写即失败；只有两侧都配置带 `JavaTimeModule` 的自定义 mapper 才能写读双成功。另有独立于时间的失败模式：默认 typing 依赖 `@class` 类型元数据，用无 default typing 的普通 ObjectMapper 写出的 JSON 交给 `GenericJackson2JsonRedisSerializer` 读 → `SerializationException: Could not read JSON ... need JSON String that contains type id`（实验 F2）。
3. **Redisson codec 层**：同一 `JsonJacksonCodec` 实例编码/解码共享同一 ObjectMapper（构造时 `copy()` 后使用），对称；不对称只可能来自：构造时传入不同的 ObjectMapper、或同一 key 空间被不同 codec/serializer 混用。默认 codec 写即失败，不存在读写不对称。

**边界结论**：写成功≠读成功，当且仅当写入器与读取器的 Jackson 配置不一致（模块集合、WRITE_DATES_AS_TIMESTAMPS、default typing、@JsonFormat 等），且差异在读取器一侧暴露；`LocalDateTime` 的存储形态本身（数组 vs ISO 字符串）不构成读失败，因为 jsr310 反序列化器对两种输入都宽容。

## 可重复验证

实验工程建在仓库外临时目录（已删除，未留任何文件），pom 依赖 `org.redisson:redisson:3.50.0`、`jackson-databind:2.18.2`、`jackson-datatype-jsr310:2.18.2`、`spring-data-redis:3.5.13`，Java 21，无需 Redis server（codec/serializer 编解码为纯内存操作）。

最小命令：`mvn -q -B compile exec:java`（exec-maven-plugin，主类 `exp.Exp`）。

主类断言 8 组（A1/A2 plain mapper 写/读失败、B1–B4 jsr310 数组/ISO 双形态 round-trip、C1/C2 默认 codec 失败与无时间 POJO round-trip、D1/D2 显式模块 codec 成功、E1/E2 默认 Spring serializer 失败与无时间 round-trip、F1/F2 跨配置读失败），输出 `RESULT: ALL PASS`。纯源码复现：读第 1 节固定 URL 中 `JsonJacksonCodec` 构造器行即可见默认 plain ObjectMapper。

## 边界与未证明内容

- 未连接真实 Redis server：未做网络往返验证；本快照只断言 codec/serializer 的本地编解码行为。
- 版本边界：Redisson 2.x、Spring Data Redis 4.x（最新 GA 4.1.0）、Jackson 其他大版本未验证。
- 未验证 `CborJacksonCodec`、`MsgPackJacksonCodec`、`TypedJsonJacksonCodec`、`JacksonCodec` 等其他 codec。
- “写成功≠读成功”除模块/typing 不一致外的成因（`@JsonFormat` 模式不一致、应用升级回滚、多 key 空间混用）为逻辑推导，未逐一实验。
