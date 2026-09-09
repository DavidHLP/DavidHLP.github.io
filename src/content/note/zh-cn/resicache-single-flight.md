---
title: "缓存击穿时，为什么要同时有 Future、分布式锁和 double-check？"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-business-patterns"]
tags: [ResiCache, Redis, SingleFlight, Concurrency, DistributedLock]
description: "从 ResiCache 的加载路径分析 single-flight、分布式锁、double-check 和失败结果建模分别解决什么问题，以及它们不能保证什么。"
toc: true
---

> 本文不是项目历史事故复盘。仓库没有提供某次线上事故记录，下面的并发 miss 场景是根据当前源码还原出的最小工程问题。

一次缓存 miss 的直接写法通常是：

```text
读缓存
  -> 没有值
  -> 调用 loader
  -> 写回缓存
  -> 返回结果
```

如果同一个 key 同时有 100 个请求进入这条路径，就可能出现 100 次数据库查询或远程调用。缓存击穿真正要解决的不是“如何加一把锁”，而是：

> 同一时刻，究竟哪个请求拥有这次加载？其他请求如何取得同一个结果？

## 只加 `synchronized` 为什么不够

进程内锁可以让一个 JVM 中的请求串行执行，但它不能约束其他实例。

假设服务部署了三个实例：

```text
实例 A: 请求 1 ──┐
实例 A: 请求 2 ──┤
实例 B: 请求 3 ──┼── 同时发现缓存 miss
实例 C: 请求 4 ──┘
```

JVM 锁最多只能合并实例 A 内部的请求。实例 B、C 仍然可能同时回源。

分布式锁可以扩大互斥范围，但它仍然没有回答另一个问题：等待者如何复用已经完成的结果？

一种朴素实现是：

```text
请求 1 获取分布式锁，执行 loader，释放锁
请求 2 等待锁，拿到锁后重新检查缓存
请求 3 等待锁，拿到锁后重新检查缓存
```

这可以避免重复加载，但每个等待者仍然需要参与锁竞争，并且必须正确实现等待、异常传播、超时和重入。

因此，分布式锁和进程内 Future 解决的是两个不同问题：

| 机制 | 解决的问题 |
|---|---|
| `CompletableFuture` | 同一进程内的请求共享 leader 的结果或异常 |
| 分布式锁 | 多实例之间只有一个请求进入加载临界区 |
| double-check | 请求真正加载前，确认等待期间是否已经有人写入缓存 |

## ResiCache 的实际调用路径

当前 `RedisProCache.get(key, loader)` 不直接实现全部逻辑，而是委托给 `LoaderOrchestrator`。

源码的核心分支可以概括为：

```java
if (isBloomShortCircuited(...)) {
    return new BloomShortCircuited<>();
}

if (operation != null && operation.isSync() && syncSupport != null) {
    return executeSyncLoad(...);
}

try {
    T value = defaultLoadFn.load(key, loader);
    return new Loaded<>(value);
} catch (Throwable cause) {
    return new LoadFailed<>(cause);
}
```

这段代码有两个值得注意的地方。

第一，`sync=true` 并不是所有缓存请求的默认行为，而是方法级操作元数据选择出的路径。

第二，加载结果不是简单的 `T` 或异常，而是 `LoadOutcome`。当前实现明确区分：

- `BloomShortCircuited`：确定不应回源；
- `Loaded`：加载和写回都成功；
- `LoadedWithWriteBackFailure`：业务值加载成功，但缓存写回失败；
- `LoadFailed`：loader 本身失败。

相关实现见 [`LoaderOrchestrator.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestrator.java#L74-L105)。

## leader、follower 和 reentrant

`SyncSupport` 使用两个进程内结构：

```java
ConcurrentMap<String, CompletableFuture<Object>> inFlight;
ThreadLocal<Set<String>> reentrantKeys;
```

选举逻辑的关键语义是：

```java
if (reentrantKeys.get().contains(key)) {
    return new SyncRole.Reentrant<>(loader);
}

CompletableFuture<Object> mine = new CompletableFuture<>();
CompletableFuture<Object> existing = inFlight.putIfAbsent(key, mine);

if (existing == null) {
    return new SyncRole.Leader<>(...);
}

return new SyncRole.Follower<>(...);
```

于是，同一个 key 的请求会进入三种角色。

### Leader

第一个成功把 Future 放入 `inFlight` 的请求成为 leader。它负责：

1. 获取分布式锁；
2. double-check；
3. 调用 loader；
4. 写回缓存；
5. 完成 Future，发布结果或异常；
6. 清理 `inFlight` 和线程局部状态。

leader 结束时使用：

```java
inFlight.remove(key, mine);
```

而不是无条件 `remove(key)`。这避免了一个旧 leader 结束时误删掉后来已经发布的新 Future。

### Follower

后续请求不会再次调用 loader，而是等待 leader 的 Future：

```text
leader 成功  -> 所有 follower 得到同一个值
leader 失败  -> 所有 follower 得到同一个异常
等待超时    -> 当前 follower 失败
```

等待是有上限的。超时并不取消 leader，也不代表 loader 已经回滚；它只表示当前等待者不再继续等待。

### Reentrant

Future 本身不是可重入结构。如果 leader 的 loader 又在同一个线程中对相同 key 发起同步调用，直接等待自己的 Future 会死锁。

因此，当前线程持有某个 key 的 leader 身份时，同 key 的嵌套调用会进入 reentrant fast path，直接执行嵌套 loader。

这不是“再次选举一个 leader”，而是显式绕开“等待自己完成”的路径。

## double-check 为什么必须在锁内

leader 获取锁后，并不会立即执行 loader，而是先检查缓存：

```java
Cache.ValueWrapper existingValue = doubleCheckFn.apply(key);
if (existingValue != null) {
    return (T) existingValue.get();
}
```

典型时序如下：

```text
请求 A                请求 B

发现缓存 miss
获取分布式锁
                      等待分布式锁
A 执行 loader
A 写回缓存
释放锁
                      获取分布式锁
                      double-check 命中
                      不再执行 loader
```

如果没有锁内 double-check，请求 B 即使已经等待了 A 完成，也可能再次执行 loader。

这个检查还覆盖了另一种情况：其他实例可能已经写入了缓存。对于跨实例系统，进程内 Future 只能合并本地请求，不能代替共享缓存中的再次确认。

## 为什么要区分“加载成功但写回失败”

写回缓存失败和 loader 失败对调用方不是同一种结果。

例如：

```text
数据库查询成功
Redis 写入失败
```

此时业务数据已经拿到了。如果把 Redis 写回异常直接当作整个请求失败，就会把“缓存不可用”扩大成“业务数据不可用”。

ResiCache 使用 `LoadedWithWriteBackFailure` 保留两部分信息：

```text
业务值：继续返回
写回异常：记录诊断信息
```

这是一种 availability-first 的取舍。它没有声称缓存已经恢复，也没有保证下一次请求不会再次回源；它只是避免缓存故障抹掉已经成功取得的业务结果。

相反，如果 loader 本身失败，就返回 `LoadFailed`，由上层按 Spring Cache 的异常契约处理。

## 没有分布式锁后端时，为什么默认 fail-fast

`SyncSupport` 启动时允许没有分布式锁后端，因为应用可能根本没有使用 `sync=true`。

但真正执行同步加载时，默认不会悄悄退化成单 JVM 同步：

```text
没有 LockManager
  + local-only=false
  -> sync=true 首次 miss 直接失败
```

只有显式配置：

```yaml
resi-cache:
  sync-lock:
    local-only: true
```

才允许使用单 JVM single-flight。

这个边界很重要。静默降级看起来更“可用”，但在多实例部署下会给调用方一种错误印象：配置声明了同步保护，实际上只有单机范围有效。

## 测试真正验证了什么

当前测试覆盖了以下场景：

- 10 个并发请求只调用一次 loader；
- leader 异常传播给所有 follower；
- 同 key 嵌套调用不死锁；
- follower 超时；
- double-check；
- 写回失败仍保留业务值。

本轮使用 JDK 21 执行了相关测试：

```bash
mise exec java@temurin-21.0.12+101.0.LTS -- \
  ./mvnw -Punit \
  -Dtest=SecureJacksonRedisSerializerTest,SecureJacksonSerializerFactoryTest,LoaderOrchestratorTest,SyncSupportSingleFlightTest \
  test
```

聚焦单元测试共 39 个，全部通过。这个结果证明的是当前测试场景下的协议行为，不是跨机房、进程崩溃或生产故障转移证明。

## 成本和失效边界

这套设计并不适合所有缓存场景。

- `inFlight` 只存在于当前 JVM，跨实例互斥依赖真正可用的分布式锁后端。
- follower 超时后可以失败，而 leader 可能仍在运行；系统没有因此获得“全局 exactly-once”语义。
- 进程崩溃、锁租约失效和外部副作用重试，需要由锁实现和业务 loader 自己处理。
- 写回失败时业务值仍然返回，但缓存可能继续保持 miss，后续请求可能重复回源。
- 如果 loader 很快、服务只有单实例，直接使用 Spring Cache 的默认加载路径可能已经足够。

## 可迁移的判断方法

遇到并发 miss 时，先回答以下问题：

1. 需要的是互斥，还是需要共享一次加载的结果？
2. 共享范围是线程、JVM，还是所有实例？
3. 等待者是否需要超时？
4. leader 的异常是否要传播给等待者？
5. loader 成功但缓存写回失败时，业务值是否仍可返回？
6. loader 是否包含不能重复执行的外部副作用？
7. 同线程嵌套调用是否可能等待自己的 Future？

如果这些问题没有答案，单独增加一把分布式锁通常还不够。
