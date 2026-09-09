---
title: "换 Redis 序列化器不是改一行配置：从对象信任到可回滚迁移"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-jackson-java-time"]
tags: [ResiCache, Redis, Serialization, Security, Migration]
description: "从 ResiCache 的安全反序列化和迁移引擎分析，为什么 wire format、类型信任和存量数据迁移必须一起设计。"
toc: true
---

把 Redis serializer 换掉，表面上可能只需要修改一个 Bean。但 Redis 中保存的是字节，不是 Java 对象。

如果旧缓存使用 JDK serializer 或 `GenericJackson2JsonRedisSerializer`，新 serializer 使用另一种 envelope，那么直接切换会产生两个独立问题：

1. 新代码能否安全地解释 Redis 中的类型信息？
2. 已存在的旧字节如何迁移、回滚，以及如何避免覆盖并发写入？

## 反序列化的危险发生在对象创建之前

Jackson 多态类型数据通常会携带类型标识，例如：

```json
{
  "version": 2,
  "payload": {
    "@class": "com.example.User"
  }
}
```

如果类型标识来自 Redis，而 Redis 中的内容又可能被其他应用、旧程序或攻击者写入，那么“先让 Jackson 按类型创建对象，再在业务层检查”已经太晚了。

真正需要保证的是：

```text
读取字节
  -> 检查类型标识是否允许
  -> 通过后才让 Jackson 实例化对象
```

这是一条信任边界，不是普通的 DTO 转换。

## ResiCache 的 serializer 做了三层约束

当前 `SecureJacksonRedisSerializer` 有三个相关机制。

### 版本化 envelope

非空缓存值会被包在：

```json
{
  "version": 2,
  "payload": "..."
}
```

这里的 `version` 是序列化格式版本。它不是业务对象版本，也不是缓存值的 CAS token。

### 白名单策略

默认允许的业务包前缀是：

```text
io.github.davidhlp
```

同时，`java.lang`、部分 `java.time`、`java.math` 类型和明确枚举的集合类型可以通过。

白名单不是简单的“开启或关闭多态”。它必须回答：

```text
这个具体的全限定类名是否允许出现在缓存字节中？
```

当前实现有一个配置边界值得特别注意：

```text
com.example.*  -> 按包边界匹配
com.example    -> 按 startsWith 匹配
```

因此，`com.example` 可能匹配 `com.exampleX.SomeType`。如果需要严格的包边界，应使用带 `.*` 的形式，或者配置足够精确的前缀。

### streaming preflight

serializer 在真正读取 envelope 之前，会通过流式 parser 检查：

- 配置的 type property；
- `@class`；
- wrapper-array 形式的类型 id；
- 多态 payload 中出现的类型标识。

只有检查通过后，才进入 `EnvelopeCodec.read`。

当前源码的核心流程可以概括为：

```java
try (JsonParser parser = objectMapper.createParser(bytes)) {
    validateTypeIdsStreaming(parser);
}

Object envelope = EnvelopeCodec.read(objectMapper, bytes);

if (EnvelopeCodec.version(envelope)
        != EnvelopeCodec.currentVersion()) {
    // failOnUnknownType=true 时拒绝
}
```

这不是完整的反序列化安全审计，但它把最关键的类型检查放到了对象实例化之前。

源码见 [`SecureJacksonRedisSerializer.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java#L132-L205) 和 [`WhitelistPolicy.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/WhitelistPolicy.java#L89-L134)。

## 为什么还要支持旧缓存迁移

即使新的 serializer 已经安全，旧缓存仍然可能不是当前 envelope。

当前迁移配置明确区分四个阶段：

| 阶段 | 行为 | 是否修改源 key |
|---|---|---|
| `SHADOW_READ` | 解码并验证旧值 | 否 |
| `DUAL_WRITE` | 保留旧值，把新 envelope 写入 sidecar | 否 |
| `CUTOVER` | 备份旧值，再替换源值 | 是 |
| `ROLLBACK` | 从备份恢复旧值 | 是 |

默认阶段是 `SHADOW_READ`，迁移不会在应用启动时自动执行。

## SHADOW_READ：先知道存量数据是什么

`SHADOW_READ` 做的事情很保守：

```text
扫描候选 key
  -> 识别是否已经是当前 envelope
  -> 尝试按配置的 legacy serializer 解码
  -> 记录成功或失败
  -> 不写 Redis
```

它解决的是“迁移前的可见性”问题。

如果不先知道旧数据的格式和可解码比例，直接 cutover 很容易把兼容性问题伪装成普通缓存 miss。

## DUAL_WRITE：先写旁路数据

`DUAL_WRITE` 保留旧 source key，并将新 envelope 写入 sidecar：

```text
user:42
user:42:__resicache_envelope
```

sidecar 会沿用源 key 的 TTL。再次执行迁移时，如果 sidecar 内容已经相同，就不会重复写入。

这提供了两个好处：

- 旧消费者仍然可以读旧 source key；
- 新格式可以先被验证，而不需要立即替换主数据。

## CUTOVER：备份、比较、替换

cutover 的顺序是：

```text
读取旧 source
  -> 写入 legacy backup sidecar
  -> 原子比较 source 是否仍等于旧字节
  -> 相等才替换为新 envelope
  -> 使用 KEEPTTL 保留生命周期
```

替换逻辑的关键 Lua 语义是：

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
    redis.call('set', KEYS[1], ARGV[2], 'KEEPTTL')
    return 1
else
    return 0
end
```

如果迁移读取旧值后，业务线程已经写入了新值，比较就会失败：

```text
迁移读取 old
业务写入 new
迁移尝试替换 old -> envelope(old)
比较失败，拒绝覆盖 new
```

这不是为了保证迁移一定完成，而是为了避免迁移工具成为新的数据覆盖者。

## ROLLBACK 也不能盲目覆盖

回滚时，系统不会简单地把 backup 写回 source。

它会先判断当前 source 是否仍然是预期的 envelope：

```text
当前值仍是本次 cutover 产生的值
  -> 允许恢复旧值

当前值已经被业务重新写入
  -> 拒绝回滚，保护新写入
```

因此，rollback 也是一种带条件的恢复，而不是无条件覆盖。

## 为什么不直接清空 Redis 再切换

如果缓存完全可丢弃，并且业务能够接受一次全量回源，那么清空旧缓存后切换 serializer 可能是更简单的方案。

但这需要明确满足几个前提：

- 缓存确实只是缓存，不包含不能丢失的状态；
- 全量回源压力可接受；
- 所有实例能够同时切换；
- 没有旧消费者继续写入旧格式；
- 不需要灰度、旁路验证或回滚。

当前迁移引擎适合的是不能简单清空、需要观察存量格式、或需要保护并发写入的场景。它付出的代价是：

- 多个迁移阶段；
- sidecar 和 backup key；
- operator 控制；
- legacy decoder；
- 迁移报告和失败处理；
- 对 Redis wire format 的额外维护。

这不是“更高级”，而是用操作复杂度换取迁移期间的可控性。

## 类型安全和迁移安全必须同时成立

迁移旧数据时，legacy decoder 也不能绕过白名单。

测试中的恶意旧 JSON：

```json
{
  "@class": "com.attacker.Gadget"
}
```

在迁移阶段同样会被拒绝，而不是因为它来自旧格式就自动信任。

这说明迁移流程不能被视为安全边界之外的临时脚本。它读取的是同一批不可信或不确定来源的数据，因此必须复用类型约束。

## 测试验证了哪些边界

当前 serializer 测试覆盖了：

- `@class` 白名单外类型拒绝；
- wrapper-array 类型标识拒绝；
- 自定义 type property 拒绝；
- 白名单内类型 round-trip；
- serializer factory 正确传递配置；
- 旧 `CachedValue` 缺少刷新元数据时仍可读取。

真实 Redis 集成测试中，`SerializationMigrationIntegrationTest` 共 8 个测试全部通过，覆盖：

- `SHADOW_READ` 不写源 key；
- `DUAL_WRITE` 保留旧值并可幂等执行；
- sidecar 保留 TTL；
- `CUTOVER` 备份旧字节；
- `ROLLBACK` 恢复旧值；
- 并发业务写入后拒绝覆盖；
- 混合数据集中拒绝非白名单类型。

测试代码见 [`SerializationMigrationIntegrationTest.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SerializationMigrationIntegrationTest.java#L61-L169)。

## 成本和失效边界

这套设计的边界同样需要写清楚。

- envelope 的 `version` 只是格式版本，不会自动迁移任意历史格式。
- 当前 legacy decoder 明确支持的格式有限；其他 serializer 需要新增解码器。
- `VersionEnvelope.payload` 的 `@JsonTypeInfo` 使用固定的 `@class`，如果修改 type property，注解和配置必须同步。
- 默认白名单偏向项目自身包名，自定义业务类型必须显式配置。
- pre-flight 只扫描样本，不能证明整个 Redis 中没有旧格式。
- 迁移扫描受 `maxKeys`、pattern 和 batch size 限制，不是一次性全库事务。
- `dryRun` 可以降低风险，但不能替代真实 cutover 测试。
- 白名单和 streaming preflight 不能等同于完整供应链安全审计。
- 本轮没有测量序列化 CPU、GC、Redis 网络开销，因此不能推出性能提升比例。

## 可迁移的判断方法

更换持久化格式时，至少要先确认：

1. 新格式如何识别？
2. 旧格式有哪些，能否逐类解码？
3. 不可信类型在哪里被拒绝？
4. 是否需要保留旧消费者的读取能力？
5. cutover 如何避免覆盖并发写入？
6. TTL、过期时间和 sidecar 是否保持一致？
7. 回滚时如何判断当前值仍然属于本次迁移？
8. 迁移失败是停止全流程，还是按 key 隔离并继续？

如果这些问题没有答案，修改 serializer 配置并不等于完成迁移。
