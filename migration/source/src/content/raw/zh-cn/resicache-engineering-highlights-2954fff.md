---
title: "ResiCache 当前主线工程化亮点：源码与测试选段固定快照"
capturedAt: 2026-09-09 00:00:00+08:00
sourceType: repository-source-and-test-selected-excerpts-fixed-commit
sourceUrl: "https://github.com/DavidHLP/ResiCache/tree/2954fff217257e9cf7c906450a75070d5e092637"
immutable: true
tags: [ResiCache, SpringCache, Redis, Concurrency, SingleFlight, Serialization, CAS, EarlyExpiration]
description: "以 ResiCache main 固定提交的核心实现与边界测试为证据，提炼可编排责任链、single-flight、版本 CAS、白名单序列化和 observer 生命周期。"
---

# 快照说明

这是面向知识页的文件级证据索引与选段快照，不是 ResiCache 仓库的完整镜像。源码和测试路径均固定到 `main@2954fff217257e9cf7c906450a75070d5e092637`；本快照只记录可直接从源代码、测试文件和 `pom.xml` 确认的实现边界。ResiCache 当前仍处于 pre-1.0 阶段；源码存在或测试名称存在，不等于本次快照生成时重新执行成功，更不等于生产吞吐、可用性或安全审计证明。

本地仓库在该提交上存在未提交的 README/文档工作区变化；这些变化没有作为本快照的依据。以下选段优先使用当前源码、测试和 `pom.xml`，历史 README 能力矩阵由既有 raw `resicache-project-overview` 单独承载。

## 来源清单

- [pom.xml](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/pom.xml)：Java 21、Spring Boot 4.0.0 parent、Spring Data Redis 4.0、Redisson 3.50.0 optional、Caffeine 3.1.8 与测试依赖。
- [RedisCacheAutoConfiguration.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/config/RedisCacheAutoConfiguration.java) 与 [RedisCacheable.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/annotation/RedisCacheable.java)：自动装配条件和声明式防护开关。
- [HandlerOrder.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/HandlerOrder.java)、[CacheHandlerChainFactory.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/CacheHandlerChainFactory.java) 与 [ChainEngine.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/ChainEngine.java)：责任链排序、缓存快照、开关解析和生命周期驱动。
- [RedisCacheInterceptor.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/RedisCacheInterceptor.java)、[RedisProCache.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/RedisProCache.java) 与 [LoaderOrchestrator.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestrator.java)：Spring Cache 入口、加载编排和写回失败语义。
- [SyncSupport.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SyncSupport.java) 与 [SyncRole.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SyncRole.java)：`inFlight` single-flight、分布式锁角色和同线程重入。
- [CachedValue.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/CachedValue.java)、[VersionEnvelope.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/serialization/VersionEnvelope.java) 与 [SerializationException.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/serialization/SerializationException.java)：缓存刷新元数据、格式版本信封和错误包装。
- [SecureJacksonRedisSerializer.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java)：类型白名单、Jackson 多态类型校验和反序列化前置检查。
- [EarlyExpirationHandler.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandler.java) 与 [EarlyExpirationScripts.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationScripts.java)：策略驱动的提前过期判断和 Redis Lua 版本 CAS。
- [ChainObserver.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/observer/ChainObserver.java)：链路/节点 observer 的 token 与收尾契约。

## 选段：责任链顺序与开关边界

`HandlerOrder` 把核心链路固定为：

```text
BLOOM_FILTER(100)
  -> SYNC_LOCK(200)
  -> EARLY_EXPIRATION(250)
  -> TTL(300)
  -> NULL_VALUE(400)
  -> ACTUAL_CACHE(500)
```

`CacheHandlerChainFactory` 对 chain 做延迟初始化、双重检查和缓存，并按优先级排序。Bloom、SyncLock、EarlyExpiration、NullValue 进入统一 protection toggle 列表；TTL 不进入该列表，因为关闭 TTL 会把缓存推向永久存活。全局 protection 开关关闭时，四类防护被关闭，但 TTL 和实际缓存节点仍保留；单机制开关只过滤对应 handler。

`RedisCacheable` 的 `sync`、`useBloomFilter`、`cacheNullValues`、`randomTtl` 和 `enableEarlyExpiration` 默认值都是关闭态；`ttl` 默认是 60 秒，早过期阈值和模式可以由注解设置。自动装配只在 `resi-cache.enabled` 未关闭且 Redis 操作类存在时启用。

## 选段：single-flight 与加载结果代数

`LoaderOrchestrator` 将一次 `get(key, loader)` 组织成以下路径：

```text
Bloom short-circuit
  -> sync=true: SyncSupport.executeSync
      -> 同线程重入 / leader / follower
      -> leader double-check
      -> loader
      -> write-back
  -> Loaded / LoadedWithWriteBackFailure / LoadFailed
```

`SyncSupport` 使用 `ConcurrentMap<String, CompletableFuture<Object>> inFlight` 选择同一 JVM 内的 leader 和 follower，并用 `ThreadLocal<Set<String>>` 处理同线程同 key 重入。leader 在完成后以 future 发布结果或异常，follower 复用该结果；没有分布式锁后端时默认 fail-fast，只有显式 `local-only` 才允许 JVM 内路径。

`LoaderOrchestrator.LoadOutcome` 是 Java 21 sealed 类型，至少区分：Bloom 短路、成功加载、加载成功但写回失败、加载失败。写回运行时异常被包装为携带已加载值的失败结果，调用方仍返回 loader 值；加载失败则转换为 Spring 的 `ValueRetrievalException`，诊断信息使用 cache name，不把原始 key 直接写入异常。

## 选段：CachedValue 与提前过期 CAS

`CachedValue` 持久化 `value`、`ttl`、`createdTime`、`lastAccessTime`、`visitTimes`、`expired` 和 `version`。`startNanoTime` 不序列化：当前进程内可以用单调时钟计算剩余 TTL，反序列化后回退到 wall-clock 语义。缓存值的 `version` 是值身份的 CAS token。

`EarlyExpirationHandler` 按缓存值的创建时间、TTL 和配置阈值计算策略。SYNC 模式在命中提前过期条件时跳过剩余链路，让实际缓存路径按 miss 回源；ASYNC 模式安排一个异步任务。该异步任务不会直接调用 loader，而是读取 live value，在 captured value 仍匹配时通过 Lua 把 TTL 缩短到 5 秒，让后续 miss 再触发正常加载。

Lua 脚本在 Redis 内完成 `GET`、JSON 解码、wrapper/envelope 解包、`payload.version` 精确比较和 `EXPIRE`：

```text
current payload.version == expected CachedValue.version
  ? EXPIRE(key, 5) and return 1
  : return 0
```

值在异步任务和 Lua 执行之间被替换时，版本比较失败，不会缩短新值 TTL。`EarlyExpirationHandlerRaceConditionIntegrationTest` 将“版本未变”和“值已替换”分成两个场景：前者允许 TTL 进入 1–5 秒范围，后者保持更长 TTL。

## 选段：安全序列化与迁移边界

`SecureJacksonRedisSerializer` 把非空值写成 `{version, payload}` 信封。默认允许的类型前缀是作者包 `io.github.davidhlp`，并始终安装白名单约束的 `PolymorphicTypeValidator`；默认不主动开启 Jackson default typing。反序列化前置检查同时关注配置的 type property、`@class` 和 wrapper-array 形态，在 Jackson 实例化对象前拒绝不允许的类型。

序列化器还覆盖 Spring `NullValue` 的受限兼容路径、未知 envelope version 的失败策略，以及缺失刷新元数据的旧 `CachedValue` 读取。由于内部信封不是 Spring `GenericJackson2JsonRedisSerializer` 或 JDK serializer 的同一 wire format，存量接入需要 shadow-read、dual-write、cutover 等迁移方案，不能把更换 serializer 当作无状态配置切换。

## 相关测试证据

以下测试文件和方法名是固定提交中的源码证据；它们没有被本次博客快照生成流程重新执行：

- [SyncSupportSingleFlightTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SyncSupportSingleFlightTest.java)：并发 follower 共享一次 loader 结果、leader 异常向 follower 传播、同 key 重入不死锁、follower 超时。
- [SyncSingleFlightIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SyncSingleFlightIntegrationTest.java)：`sync=true` 并发调用下方法只执行一次的集成场景。
- [LoaderOrchestratorTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestratorTest.java)：Bloom 短路、sync 路由、double-check、写回失败和加载失败结果。
- [EarlyExpirationHandlerRaceConditionIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandlerRaceConditionIntegrationTest.java)：版本未变时允许缩短 TTL，值替换后跳过缩短。
- [SecureJacksonRedisSerializerTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializerTest.java)：普通值、`CachedValue` 元数据、旧字段兼容和白名单拒绝。
- [ChainEngineTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/ChainEngineTest.java) 与 [ChainObserverTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/ChainObserverTest.java)：scope token 配对、异常节点收尾和 observer hook 隔离。

## 快照边界

- `pom.xml` 表明构建线使用 Java 21、Spring Boot 4.0.0、Spring Data Redis 4.0 和 Redisson 3.50.0；不据此证明已发布 artifact 或生产兼容性。
- 源码与测试能证明实现结构和被覆盖的场景；本文件不提供吞吐、P99、故障转移、跨机房、零丢失或完整反序列化安全审计结论。
- Reactive `Mono`/`Flux` 和 `@Async` 缓存方法不在当前增强路径的承诺范围；需要按兼容性文档和实际运行环境另行验证。
