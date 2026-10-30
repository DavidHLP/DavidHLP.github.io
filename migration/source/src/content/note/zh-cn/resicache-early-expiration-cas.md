---
title: "异步提前过期为什么只缩短 TTL：用版本 CAS 让旧任务自动失效"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-business-patterns"]
tags: [ResiCache, Redis, EarlyExpiration, CAS, Concurrency]
description: "分析 ResiCache 如何用缓存值版本、Redis Lua CAS 和正常 miss 路径，避免旧异步任务误修改新缓存值。"
toc: true
---

> 本文描述的是当前源码中的提前过期协议，不把它称为后台数据刷新，也不把测试结果扩展成性能或新鲜度 SLA。

缓存快到期时，常见目标是避免大量请求同时遇到 miss：

```text
缓存快过期
  -> 提前制造一次 miss
  -> 让后续请求触发正常加载
  -> 尽量避免所有请求同时回源
```

问题在于，提前过期通常通过异步任务完成，而异步任务执行时，缓存值可能已经发生变化。

## 一个旧任务如何误伤新值

假设任务在请求时捕获了旧值：

```text
T0: Redis = value-A, version=1
T1: 请求发现需要提前过期，提交任务，任务捕获 version=1
T2: 业务写入 value-B, version=2
T3: 旧任务开始执行
```

如果旧任务只记得 key，然后直接执行：

```text
EXPIRE key 5
```

那么它会缩短 `value-B` 的 TTL。新值并没有参与这次提前过期判断，却被旧任务修改了生命周期。

这类 bug 不一定会立即表现为错误数据，但会改变新值的缓存寿命，增加不必要的回源。

## 当前实现不是“后台直接刷新”

ResiCache 的 `EarlyExpirationHandler` 区分两种模式：

- `SYNC`：满足提前过期条件时跳过实际缓存节点，让正常加载路径处理 miss；
- `ASYNC`：提交后台任务，当前请求继续使用已经读到的缓存值。

在异步模式下，任务不会直接调用业务 loader。它只做一件较小的事情：

> 如果捕获的缓存值仍然是当前值，就把 TTL 缩短到一个 5 秒的宽限期。

后续真正的 miss 仍然沿正常的 loader、single-flight、写回路径执行。

## 当前请求为什么还能继续返回缓存值

提前过期 handler 已经读取过 Redis，并把结果写入 `PrefetchDecision`。

最后的 `ActualCacheHandler` 会优先使用这份预取值：

```java
CachedValue cachedValue = prefetchDecision != null
        && prefetchDecision.prefetchedValue() instanceof CachedValue cv
        ? cv
        : null;

if (cachedValue == null) {
    Object rawValue = valueOperations.get(context.getRedisKey());
    cachedValue = rawValue instanceof CachedValue cv ? cv : null;
}
```

因此，ASYNC 模式的语义是：

```text
本次请求：继续返回当前缓存值
后台任务：尝试缩短当前值的 TTL
未来请求：在 miss 后走正常 loader
```

这也意味着异步模式允许当前请求继续读取可能已经接近过期的值。它并不提供“当前请求一定拿到最新数据”的保证。

## 两个 version 不是一回事

这个实现里有两个容易混淆的版本号：

| 字段 | 身份 |
|---|---|
| `VersionEnvelope.version` | 序列化格式版本，当前为 2 |
| `CachedValue.version` | 某个缓存值的身份 token，用于 CAS |

格式版本回答的是：

```text
这段 Redis 字节应该按哪种协议读取？
```

缓存值版本回答的是：

```text
这个异步任务捕获的值，还是当前 Redis 中的那个值吗？
```

`CachedValue.of` 使用当前进程的 `System.nanoTime()` 生成值版本；`startNanoTime` 则不被持久化，用于本进程内的单调时间计算。两者都不能被误解为跨进程的全局时钟或递增序列。

## 任务执行前重新读取 live value

异步任务首先重新读取 Redis：

```java
Object rawLiveValue = valueOperations.get(redisKey);

if (rawLiveValue == null) {
    return;
}

if (!(rawLiveValue instanceof CachedValue liveValue)) {
    return;
}

long remainingTtl = liveValue.getRemainingTtl();
if (remainingTtl > 0 && remainingTtl < REFRESH_GRACE_PERIOD_SECONDS) {
    return;
}

boolean shortened =
        atomicShortenTtlIfValueUnchanged(redisKey, capturedValue);
```

这里有两层保护：

1. 任务不盲信提交时捕获的状态；
2. 真正修改 TTL 时还要执行版本 CAS。

读取 live value 可以处理 key 已被删除、类型已经不符合预期等情况。它本身不能解决“读取之后又被替换”的竞态，所以还需要 Redis 内的原子脚本。

## Lua CAS 把检查和修改放在 Redis 内部

源码脚本的关键语义可以缩写为：

```lua
local current = redis.call('get', KEYS[1])

local parsed = decode(current)
local payload = unwrap_payload(parsed)

if tostring(payload.version) == ARGV[1] then
    redis.call('expire', KEYS[1], ARGV[2])
    return 1
end

return 0
```

这里的 `ARGV[1]` 是捕获值的 `CachedValue.version`，不是顶层 envelope 的版本。

脚本在 Redis 内完成：

```text
GET
  -> JSON 解码
  -> 解包 envelope / wrapper array
  -> 比较 payload.version
  -> 匹配才 EXPIRE
```

因此，下面的时序不会误伤新值：

```text
旧任务捕获 version=1
新请求写入 version=2
旧任务执行 Lua
version 1 != version 2
返回 0，不缩短 TTL
```

如果 JSON 解码失败，脚本也返回 0。当前实现把“无法证明值仍然匹配”处理成“不修改”，而不是冒险写入。

源码见 [`EarlyExpirationHandler.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandler.java#L209-L260) 和 [`EarlyExpirationScripts.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationScripts.java#L47-L66)。

## 为什么不在后台任务里直接调用 loader

直接后台刷新看起来更积极，但会引入一条新的加载协议：

```text
后台任务
  -> 调 loader
  -> 处理异常
  -> 获取同步锁
  -> 写回缓存
  -> 处理新旧值竞态
  -> 处理取消和超时
```

而当前系统已经有一条正常的加载协议，包含 single-flight、分布式锁、double-check 和写回失败处理。

因此，当前实现选择较小的副作用：

```text
异步任务只缩短 TTL
  -> 让未来请求自然进入正常 miss 路径
  -> 复用现有 loader 协议
```

这不是“刷新更快”，而是减少第二套 loader 语义。

## executor 也有一层 per-key 保护

`ThreadPoolEarlyExpirationExecutor` 使用：

```java
ConcurrentHashMap<String, CompletableFuture<Void>> inFlight;
```

同一个 key 已经有未完成任务时，后续提交会被跳过。业务 PUT 时，`ActualCacheHandler` 会调用：

```java
earlyExpirationExecutor.cancel(context.getRedisKey());
```

这让显式写入和旧的异步提前过期任务之间形成更清晰的优先关系。

不过，executor 的去重不等于 Redis 层的 CAS。它只能减少同一 JVM 内的重复任务，不能替代跨线程、跨实例的值身份检查。

## Redis 竞态测试验证了什么

当前测试覆盖了以下竞态：

- 版本未变化时允许 TTL 缩短；
- key 被删除后旧任务不恢复它；
- 新值写入后旧任务不缩短新值 TTL；
- 多次提交后最新值保持不变。

本轮使用 Testcontainers 启动真实 Redis 集群，执行提前过期嵌套测试 21 个、Redis 竞态测试 5 个，全部通过。

测试代码见 [`EarlyExpirationHandlerRaceConditionIntegrationTest.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandlerRaceConditionIntegrationTest.java#L125-L299)。

## 成本和失效边界

这个设计解决的是“旧异步任务误修改新值”，不是所有刷新问题。

- ASYNC 模式只缩短 TTL，不保证一定会执行 loader。
- 它不保证某个时间点之前一定得到新数据。
- 当前请求仍可能返回接近过期的旧值。
- Lua 脚本依赖当前 JSON envelope、wrapper array 和 `payload.version` 的 wire format。
- Redis 实例需要支持脚本使用的 `cjson` 能力；脚本语义与序列化器必须一起演进。
- `CachedValue.version` 是相等比较 token，不是全局递增版本，也不是冲突解决算法。
- 后台异常会被记录并吞掉，不会污染外层请求；这意味着系统需要依赖日志和指标发现刷新失败。
- 缩短 TTL 会把部分成本转移给未来请求，未来请求可能承担 loader 延迟。

## 可迁移的判断方法

任何延迟执行的任务都可以问四个问题：

1. 任务提交时捕获了什么状态？
2. 任务真正执行时，对象是否可能已经被替换或删除？
3. 修改动作是否带有对象身份校验？
4. 旧任务无法证明自己仍然有效时，是拒绝修改还是继续写入？

如果任务只需要推动未来状态变化，优先考虑：

```text
旧任务只制造受控的下一步动作
  -> 未来请求进入统一协议
  -> 真正写入时再校验当前身份
```
