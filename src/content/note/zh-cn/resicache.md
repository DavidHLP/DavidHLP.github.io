---
title: "ResiCache：Spring Cache 的可编排缓存防护责任链"
timestamp: 2026-08-21 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: entity
status: active
sources: ["resicache-project-overview", "resicache-observer-nested-execution-contract"]
related: ["resicache-observer-nested-execution", "java-null-value", "redis-business-patterns", "redis-jackson-java-time"]
tags: [ResiCache, SpringCache, Redis, BloomFilter, DistributedLock, ResponsibilityChain]
description: "以固定提交 README 为证据归纳 ResiCache 的定位、责任链 handler 顺序、防护默认关闭边界与序列化信封迁移成本，区分声明能力与未验证能力。"
toc: true
---

`ResiCache` 是一个 Spring Cache 防护增强注解生态：在 `@Cacheable` 之外用 `@RedisCacheable` 一行注解为 Redis 缓存补齐防穿透、防击穿、防雪崩和热 key 早刷新能力，通过可编排责任链注入防护，不重造 AOP。本页描述公开仓库 main 固定提交 `75ed279a`（v0.0.2）的声明状态；observer 嵌套执行契约见 [ResiCache observer 嵌套执行](/note/resicache-observer-nested-execution)。

## 核心机制

### 责任链与 handler 顺序

写入路径由 `CacheHandlerChain` 组织，顺序由 `HandlerOrder` 枚举统一定义、`@HandlerPriority` 绑定：

1. BloomFilter（100）——布隆过滤器拦截不存在的 key，防穿透。
2. SyncLock（200）——Redisson 分布式锁，防击穿；`sync=true` 缺 Redisson 时 fail-fast，不静默降级。
3. EarlyExpiration（250）——热 key 异步提前刷新。
4. TTL（300）——TTL 随机抖动（默认 ±20%），防雪崩。
5. NullValue（400）——空值缓存，防穿透（概念见 [NullValue](/note/java-null-value)）。
6. ActualCache（500）——实际 Redis 写入。

任一 handler 可用 `output.skipRemaining=true` 短路链路；第三方 handler 可扩展 `HandlerOrder` 插队。这是它与 JetCache（主打多级缓存）的定位差异：作用域互补而非替代。

### 共存与接入边界

- 继承 `RedisCacheManager` / `CacheInterceptor`，不替换 `@EnableCaching`；自动装配入口 `RedisCacheAutoConfiguration`。
- 纯 `@Cacheable` 默认走 Spring 原生（`nativeAnnotationMode=SELECTIVE`），不被接管；防护属性仅在 `@RedisCacheable` 上。
- 配置前缀 `resi-cache.*`，支持全局、注解级和每缓存（`caches.<name>`）三层覆盖。

## 适用条件

- 读多写少、需要声明式补齐穿透/击穿/雪崩防护的 Spring Boot + Redis 项目。
- 愿意为防护显式逐项开启注解属性（5 大防护默认全 `false`）。
- Java 21+、Spring Boot 4.0.0 parent、Redisson 3.50.0（optional）技术栈。

## 不适用与风险

- **序列化信封不兼容**：`{version, payload}` 信封与 Spring 默认 `GenericJackson2JsonRedisSerializer` / `JdkSerializer` 不兼容，存量项目接入需迁移，否则全量缓存失效。
- **反序列化白名单默认锁作者包名**：自定义业务类型必须显式配置 `allowed-package-prefixes`，否则抛异常。
- **CLEAN 非原子**：`@CacheEvict(allEntries=true)` 用 SCAN + 批量 UNLINK/DEL，best-effort；启用布隆时靠 `rebuild-window-seconds` 窗口防止擦除后重建期的静默 null。
- **不支持 Reactive**：拦截器阻塞式，WebFlux 方法不触发缓存。
- 熔断/限流/多级本地缓存刻意不在范围内（Not in Scope），需配 Resilience4j / Caffeine。

## 最小验证

1. 引入 `io.github.davidhlp:ResiCache:0.0.2` 后以 `@RedisCacheable` 开启单一防护（如 `randomTtl`），观察 TTL 抖动是否生效。
2. 两进程并发抢锁验证 `sync=true` 的互斥与 fail-fast 行为。
3. 自定义类型读写前先补白名单前缀，确认反序列化不抛异常。

## 证据与不确定性

- **来源事实**：定位、handler 顺序、配置边界、已知限制均来自固定提交 `75ed279a` 的 README（`resicache-project-overview`）；observer/scope token 契约来自同提交源码分析（`resicache-observer-nested-execution-contract`）。
- **本页综合**：把 README 的功能矩阵收敛为"机制—边界—验证"三段。
- **未确认项**：本地工作区领先 origin/main 14 个提交的未发布修改未纳入；压测容量参数、Cluster/Sentinel 模式行为未做可复现实验复核。

## 相关页面

- [resicache-observer-nested-execution](/note/resicache-observer-nested-execution)
- [java-null-value](/note/java-null-value)
- [redis-business-patterns](/note/redis-business-patterns)
- [redis-jackson-java-time](/note/redis-jackson-java-time)
