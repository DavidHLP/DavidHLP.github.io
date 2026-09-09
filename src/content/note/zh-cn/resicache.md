---
title: "ResiCache：把缓存防护写成可验证的并发与一致性边界"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: entity
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview", "resicache-observer-nested-execution-contract"]
related: ["resicache-observer-nested-execution", "java-null-value", "redis-business-patterns", "redis-jackson-java-time"]
tags: [ResiCache, SpringCache, Redis, Concurrency, SingleFlight, Serialization, CAS, EarlyExpiration, LLM]
description: "以 ResiCache 当前 main 的源码与边界测试为证据，提炼责任链、single-flight、版本化提前过期、白名单序列化和 observer 生命周期五个工程亮点，并明确与生产性能结论的距离。"
toc: true
---

> **证据状态**：本文以 `main@2954fff217257e9cf7c906450a75070d5e092637` 的源码与测试为主要依据，辅以固定 README 快照。文中“已实现”表示源代码具备该结构，“仓库测试证据”表示提交中存在对应测试，不表示本次重新执行或生产验证。
>
> **范围边界**：ResiCache 当前构建线是 Java 21、Spring Boot 4.0.0、Spring Data Redis 4.0、Redisson 3.50.0 optional，仓库仍处于 pre-1.0。本文不把设计结构写成吞吐、P99、HA、零丢失或完整安全审计结论。

一次缓存 miss 看起来只是“读不到，然后回源，再写回”。但在真实系统里，同一个 miss 可能同时遇到不存在 key、并发回源、TTL 雪崩、旧异步任务和不可信类型。只要这些策略各写一个切面，最后得到的通常不是防护，而是一条没人能解释的隐式控制流。

ResiCache 值得研究的地方，正是它把这些问题放到同一条可阅读的链路里：

```text
BloomFilter
  -> SyncLock
  -> EarlyExpiration
  -> TTL
  -> NullValue
  -> ActualCache
```

链上的每个节点都有自己的短路、继续和失败语义；并发加载、异步提前过期、序列化和 observer 又各自有更小的契约。它的设计亮点不只是“支持哪些缓存防护”，而是把缓存系统里最容易出事故的边界显式化。

## 先从使用入口看设计意图

调用方通过 `@RedisCacheable` 声明想要的防护：

```java
@RedisCacheable(
        cacheNames = "profile",
        key = "#userId",
        sync = true,
        useBloomFilter = true,
        cacheNullValues = true,
        randomTtl = true,
        enableEarlyExpiration = true,
        earlyExpirationMode = EarlyExpirationMode.ASYNC)
public Profile loadProfile(long userId) {
    return profileRepository.find(userId);
}
```

`sync`、Bloom、空值缓存、随机 TTL 和提前过期等开关默认是关闭态。调用点因此承担一个重要职责：它明确声明这次缓存操作要承担哪些额外成本和语义。

入口本身没有重造一套 AOP。`RedisCacheInterceptor` 继承 Spring 的 `CacheInterceptor`，在调用前激活方法元数据并执行增强链，随后继续走 Spring Cache 的 invocation；`RedisProCache` 则在缓存加载处接入 `LoaderOrchestrator`。这使防护集中在扩展点里，而不是散落在业务方法周围。

## 一、责任链把“防护组合”变成可验证结构

### 顺序不是实现细节

`HandlerOrder` 给每个 handler 一个稳定优先级，当前核心顺序是：

```text
BLOOM_FILTER(100)
  -> SYNC_LOCK(200)
  -> EARLY_EXPIRATION(250)
  -> TTL(300)
  -> NULL_VALUE(400)
  -> ACTUAL_CACHE(500)
```

这个顺序决定了控制流：Bloom 可以在真正回源前拦截确定不存在的 key；SyncLock 负责将并发加载合并；EarlyExpiration 判断缓存是否应进入 miss 或异步 TTL 处理；TTL、NullValue 和 ActualCache 负责后续写入。

`ChainEngine` 用 `CONTINUE`、`SKIP_ALL` 和 `TERMINATE` 表达节点结果，而不是让每个 handler 通过隐式异常或共享标志互相猜测。对于一个缓存库来说，这种结果协议比“多几个 if”更重要，因为新增防护时必须先回答它在链上的位置，以及它短路后是否仍然允许写回。

### 工厂负责稳定性，开关负责选择性

`CacheHandlerChainFactory` 对 chain 做延迟初始化、双重检查和缓存，随后按优先级排序并过滤禁用项。BloomFilter、SyncLock、EarlyExpiration、NullValue 被放入统一 protection toggle 列表；TTL 被刻意排除，因为把 TTL 一起关掉可能让缓存永久存活。

全局 protection 开关关闭时，四类防护被关闭，但 TTL 和 ActualCache 仍然保留；单机制开关只过滤对应 handler。这是一个很容易被忽略的设计决定：关闭防护不等于关闭缓存本身。

因此，责任链的核心价值不是“以后可以随意插插件”，而是把功能组合收敛为一组可以命名、排序、禁用和测试的 policy。它让代码审查可以针对链路契约，而不是只看每个 handler 的局部实现。

## 二、single-flight 解决的不是“加锁”，而是“谁拥有这次加载”

### 并发 miss 的真实问题

假设一个热门 key 同时失效，十个请求几乎一起进入 loader。如果每个请求都独立回源，数据库和远程服务会收到十次相同查询；如果只加一把粗粒度锁，又会引入不必要的串行化和重入死锁。

ResiCache 把一次 `get(key, loader)` 拆成几步：

```text
Bloom short-circuit
  -> sync=true ? SyncSupport : Spring 默认加载路径
      -> double-check
      -> loader
      -> write-back
```

`SyncSupport` 使用：

```java
ConcurrentMap<String, CompletableFuture<Object>> inFlight;
ThreadLocal<Set<String>> reentrantKeys;
```

同一 JVM 内，第一个通过 `putIfAbsent` 的请求成为 leader，负责执行加载并完成 future；后续请求成为 follower，等待并复用同一个 future。leader 在锁内再次 double-check，避免等待期间值已经被其他请求写入。相同线程再次请求同一个 key 时进入 reentrant fast path，不会等待自己完成。

这个模型区分了三种角色：

- **leader**：拥有本次加载，负责 loader、写回和发布结果。
- **follower**：不重复回源，只等待 leader 的结果或异常。
- **reentrant**：同线程同 key 的嵌套调用，绕过等待路径避免自锁。

跨进程互斥还需要分布式锁后端。没有锁管理器时默认 fail-fast，只有显式 `resi-cache.sync-lock.local-only=true` 才允许退化为 JVM 内 single-flight。它不静默假装自己拥有跨实例能力，这个失败方式对调用方更诚实。

### 失败也需要有类型

`LoaderOrchestrator.LoadOutcome` 是 Java 21 sealed 类型，至少把结果分成：

- `BloomShortCircuited`：确定不应回源。
- `Loaded`：加载和写回都成功。
- `LoadedWithWriteBackFailure`：数据源返回了值，但缓存写回失败。
- `LoadFailed`：loader 本身失败，无法得到可用结果。

这带来一个重要的 availability-first 决策：写回 Redis 的运行时异常，不会抹掉已经从数据源得到的值；调用方仍然收到这个值。只有 loader 失败才转换为 Spring 的 `ValueRetrievalException`。异常翻译同时使用 cache name 作为诊断边界，避免把原始 key 直接写进异常信息。

换句话说，ResiCache 没有把“缓存不可写”和“业务数据不可读”混成一种失败。对于上层系统，这意味着可以分别决定是否降级、重试、报警或继续响应。

### 测试矩阵验证的是边界

固定提交中可以找到这些场景：

- `SyncSupportSingleFlightTest` 验证并发 follower 共享一次 loader 结果、leader 异常传播、同 key 重入不死锁和 follower 超时。
- `SyncSingleFlightIntegrationTest` 验证 `sync=true` 并发方法只执行一次。
- `LoaderOrchestratorTest` 验证 Bloom 短路、sync 路由、double-check、写回失败和加载失败结果。

这些测试名称是仓库证据，不等于本文生成时重新执行并通过；但它们说明作者把“并发加载次数、失败传播和重入”当成设计契约，而不是实现偶然性。

## 三、提前过期的核心是 stale-task fence，而不是后台刷新

### 先区分两个 version

`CachedValue` 不只保存业务值，还保存 `ttl`、`createdTime`、`lastAccessTime`、`visitTimes`、`expired` 和 `version`。其中 `CachedValue.version` 是值身份，用于判断异步任务针对的是否还是同一个缓存值。

序列化信封也有一个顶层 `version`，当前格式为 2。它是 wire format 身份，不是值身份：

| 字段 | 回答的问题 | 用途 |
|---|---|---|
| `VersionEnvelope.version` | 这段字节属于哪个格式？ | 判断能否按当前序列化协议读取 |
| `CachedValue.version` | 这个延迟任务还针对当前值吗？ | 作为 TTL 缩短的 CAS token |

格式版本和业务值版本分别回答两个问题。把它们共用成一个模糊的 `version`，会让序列化升级和并发竞态互相污染。

### ASYNC 只缩短 TTL

`EarlyExpirationHandler` 根据缓存创建时间、TTL 和阈值计算提前过期策略：

- SYNC 模式满足条件时跳过剩余链路，让实际缓存路径按 miss 回源。
- ASYNC 模式调度一个后台任务，但这个任务不直接调用 loader。

后台任务重新读取 live value，确认值仍存在且未进入 5 秒 grace period，再把之前捕获的 `CachedValue.version` 交给 Redis Lua。匹配成功后仅将 TTL 缩短到 5 秒；后续真正的 miss 才会沿正常路径调用 loader。

Lua 在 Redis 内完成读取、解包、版本比较和 `EXPIRE`：

```text
GET current value
  -> unwrap wrapper/envelope
  -> read payload.version
  -> compare with expected CachedValue.version
  -> match: EXPIRE(key, 5)
  -> mismatch or parse failure: return 0
```

因此，如果异步任务排队期间 key 已经被新值替换，旧版本比较失败，新值的 TTL 不会被误缩短。`EarlyExpirationHandlerRaceConditionIntegrationTest` 将“版本未变”和“值已替换”分为两个场景：前者允许 TTL 进入 1–5 秒范围，后者跳过 TTL 缩短。

这是一种比“后台线程直接刷新”更小的设计：刷新调度只负责制造一次受控 miss，回源、写回和错误处理仍由主加载协议统一负责。

### 时间语义也被分开处理

`CachedValue` 在当前进程内可以用 `startNanoTime` 计算单调时间；该字段不序列化，反序列化后回退到 wall-clock 语义。进程本地的纳秒基准没有被错误地当成跨进程、可持久化的时间事实。

这个处理看起来不像缓存功能，但它是提前过期可靠性的基础：时间计算的参照系必须和数据的生命周期一致。

## 四、安全序列化把检查放在对象实例化之前

### 从 `{version,payload}` 开始

`SecureJacksonRedisSerializer` 将非空值写成版本化信封：

```json
{
  "version": 2,
  "payload": "..."
}
```

默认允许的类型前缀是 `io.github.davidhlp`，并始终安装白名单约束的 `PolymorphicTypeValidator`；默认不主动开启 Jackson default typing。业务类型如果不在允许范围内，需要显式配置，否则反序列化被拒绝。

更值得注意的是 streaming preflight。它会检查配置的 type property、`@class` 以及 wrapper-array 形式的类型 id，在 Jackson 真正实例化对象之前拒绝不允许的类型。安全检查的位置从“对象已经创建后再判断”提前到了“对象还没有机会被创建”。

序列化层还处理了几个现实边界：Spring `NullValue` 的受限兼容路径、未知 envelope version 的失败策略，以及缺少刷新元数据的旧 `CachedValue`。旧 payload 可以回退到 wall-clock 读取，但这不等于所有历史 serializer 都能互读。

### wire format 变化必须按迁移处理

内部 `{version,payload}` 信封不是 Spring `GenericJackson2JsonRedisSerializer` 或 JDK serializer 的同一 wire format。存量系统不能把 serializer 替换理解为一个无状态配置改动；更稳妥的路径是 shadow-read、dual-write、cutover，并单独观察旧值读取、回源比例和失败类型。

这里的设计亮点不是“用了 Jackson”，而是把格式身份、类型信任和存量迁移成本都放到了显式契约里。

## 五、observer 让嵌套 chain 仍然有正确的生命周期

缓存 handler 可能在锁内继续执行 chain fragment。如果每一次 fragment 都被当成一条新 chain，observer 会收到重复的 around 生命周期；如果 fragment 完全不发事件，节点级诊断又会消失。

`ChainEngine` 用 `CURRENT_SNAPSHOT` 保存当前线程的不可变 handler 快照，fragment 复用这份 snapshot，并从指定节点之后继续跑。它不需要重新构造一条链，也不把嵌套执行伪装成新的顶层调用。

`ChainObserver` 的 start hook 返回 scope token，end hook 收到同一个 token：

```text
onChainStart -> chainToken -> onChainEnd
onNodeStart  -> nodeToken  -> onNodeEnd
```

即使 handler 抛异常，`onNodeEnd` 和 `onChainEnd` 也会在 `finally` 中收尾；异常节点的 result 以 `null` 表示。observer 自己的 hook 异常会被捕获并记录，不应污染业务 handler 的结果。

这让可观测性也成为一种数据结构：token 表示哪一次 scope，snapshot 表示哪一份执行上下文，fragment 表示从哪里续跑。相关的嵌套边界、重复生命周期反例和模型验证见 [ResiCache：observer 嵌套执行必须区分生命周期、fragment 与 scope token](/note/resicache-observer-nested-execution)。

## 把这些设计放在一起看

五个机制其实共享同一条设计原则：延迟动作不能只依赖“现在看起来应该这样”，必须带着足够的上下文和失败语义。

| 场景 | 隐含风险 | ResiCache 的显式边界 |
|---|---|---|
| 防护组合 | handler 互相覆盖、顺序漂移 | `HandlerOrder` + `HandlerResult` |
| 并发 miss | 重复回源、锁等待、自锁 | leader/follower/reentrant |
| 异步提前过期 | 旧任务误伤新值 | `CachedValue.version` + Lua CAS |
| 反序列化 | 不可信类型先被实例化 | whitelist + streaming preflight |
| 嵌套执行 | 生命周期重复或缺失 | snapshot + scope token |

这也是为什么 ResiCache 的设计价值不能只用“支持 BloomFilter、分布式锁、TTL 抖动”概括。真正可复用的部分，是它把每个副作用都绑定到了一个可检查的身份、顺序或结果协议上。

## 对 LLM/Agent 工程的迁移启示

下面是基于上述源码的综合，不是 ResiCache 项目对 LLM/Agent 的功能声明。

### 1. 把降级写成 outcome，而不是异常字符串

“结果已经生成，但持久化失败”和“生成本身失败”对用户完全不同。LLM 请求、工具调用和检索流水线也可以把 `Success`、`SuccessButPersistFailed`、`Rejected`、`Failed` 建模成显式 outcome，让上层决定展示、重试、补偿还是转人工。

### 2. 把格式身份和对象身份分开

prompt/schema 的格式版本，不能代替某个会话、任务或工具调用的对象版本。它们回答的问题不同，应该拥有不同字段、不同校验和不同升级策略。

### 3. 延迟动作要有 stale-task fence

重试、索引更新、缓存刷新和 Agent 后台任务都可能在对象变化以后才执行。先读取 live state，再用 generation、attempt 或 CAS 保护写入，是比“任务排队成功就直接写入”更小而有效的护栏。

### 4. 信任检查要先于实例化和执行

类型白名单的 streaming preflight 可以迁移到工具调用、插件加载、模板渲染和代码执行：先验证 schema、来源和权限，再创建可执行对象；不要先物化不可信输入，再期待业务层补救。

## 证据分层与尚未声称的事项

| 层级 | 本文可以确认 | 本文不能推出 |
|---|---|---|
| `Repository Implemented` | 当前源码包含责任链、single-flight、sealed outcome、值版本 Lua CAS、安全序列化和 observer token | 不能推出已经部署到生产 |
| `Repository Test Evidence` | 固定提交包含并发、竞态、序列化拒绝和生命周期测试场景 | 测试存在不等于本轮执行通过 |
| `Locally Validated` | 博客仓库可对本文执行 KB lint、Astro 构建和 diff 检查 | 不等于本轮启动 Redis、Testcontainers 或 Maven 集成测试 |
| `BLOCKED_EXTERNAL` | 生产流量、真实容量、跨实例故障转移和长时间运行数据不在本地证据中 | 不声称吞吐、P99、HA、零丢失或 SLA |
| `OUT_OF_SCOPE` | Reactive `Mono`/`Flux`、`@Async` 缓存增强和完整供应链安全审计需另行验证 | 不把当前同步阻塞式实现泛化到所有 Spring 调用模型 |

## 最小源码阅读路径

1. 先读 [HandlerOrder.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/HandlerOrder.java)，确认顺序和优先级。
2. 再读 [LoaderOrchestrator.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestrator.java) 与 [SyncSupport.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SyncSupport.java)，看并发加载如何合并。
3. 然后读 [EarlyExpirationScripts.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationScripts.java) 与 [SecureJacksonRedisSerializer.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java)，看 CAS 和信任边界。
4. 最后对照 [SyncSupportSingleFlightTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SyncSupportSingleFlightTest.java) 与 [EarlyExpirationHandlerRaceConditionIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandlerRaceConditionIntegrationTest.java)，看设计如何落到竞态测试。

## 相关页面

- [ResiCache：observer 嵌套执行必须区分生命周期、fragment 与 scope token](/note/resicache-observer-nested-execution)
- [Java NullValue：缓存空值是防穿透策略，不是业务语义](/note/java-null-value)
- [Redis 业务模式：先区分缓存职责，再选择双删、TTL 或一致性策略](/note/redis-business-patterns)
- [Redis 与 Jackson Java 时间类型：配置兼容要落到序列化实验](/note/redis-jackson-java-time)
