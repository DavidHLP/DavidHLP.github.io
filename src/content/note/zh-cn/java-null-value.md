---
title: "NullValue：缓存 null 的占位对象与序列化边界"
timestamp: 2025-10-07 21:43:00+08:00
series: "Java 基础与后端调优"
kind: concept
status: active
sources: ["legacy-java-null-value"]
related: ["java-online-performance-debug", "java-auto-closeable", "java-internship-interview-blog-polished"]
tags: ["Java", "Spring Cache", "Caching", "Null Object", "Design Patterns"]
description: "说明缓存层为什么需要区分 key 不存在与业务 null，NullValue 如何作为占位对象防御缓存穿透，以及单例和序列化在边界上的限制。"
toc: true
---

`NullValue` 是缓存抽象层用来表示“key 存在、业务结果却是 null”的占位对象。本页回答如何避免不存在数据反复回源造成缓存穿透，以及为什么占位对象的单例与序列化语义必须停留在缓存边界内。

## 核心机制

### 1. 先区分 miss 与 negative hit

不缓存空结果时，请求路径是“缓存 miss → 查询数据库 → null”；热点不存在的 key 会不断重复这条路径。缓存层需要表达两种不同状态：

| 缓存观察 | 业务含义 | 后续动作 |
| --- | --- | --- |
| key 不存在 | 尚未查询或已过期 | 允许回源并决定是否写入 |
| key 存在且值为 `NullValue` | 已确认业务对象不存在 | 直接返回业务 `null` |
| key 存在且为对象 | 命中真实数据 | 返回对象 |

Spring Cache 的抽象可概括为：

```java
store = value == null ? NullValue.INSTANCE : value;
value = store == NullValue.INSTANCE ? null : store;
```

业务方法仍返回 `null`，底层缓存保存可识别的非 null 对象；因此 `ConcurrentHashMap` 等不接受 null 的容器也能承载负结果。

### 2. 占位对象的三个约束

- `final` + 私有构造器：限制扩展和额外实例。
- `static final INSTANCE`：同一 JVM 内复用一个标记，缓存层可用引用比较识别它。
- 实现 `Serializable` 并提供 `readResolve()`：Java 序列化后返回规范实例，避免反序列化对象与 `INSTANCE` 失去身份一致性。

`equals(null)`、稳定 `hashCode()` 和 `toString()` 是辅助语义；业务代码不应把 `NullValue` 当成用户对象处理。

### 3. 占位值不是一致性方案

负结果缓存只能阻断已经观察过的不存在 key。它仍需要短 TTL，或在创建/更新数据时主动失效；否则新对象出现前，旧的占位值会继续返回 null。参数校验、布隆过滤器、限流和单飞回源是不同层次的保护，可按流量和数据特征组合。

## 适用条件

- “不存在”是稳定、可缓存的业务结果，且重复回源确实会压垮数据库或下游。
- 缓存适配器能在写入前把 `null` 转换为占位值，在读取后还原为 `null`，不泄漏到业务层。
- 已定义负缓存 TTL、主动失效和缓存序列化器；数据创建后允许可接受的短暂陈旧。
- 需要区分 cache miss、negative hit 和真实对象，不能用空字符串等业务值替代 null。

## 不适用与风险

- 不能把 `NullValue` 当作万能的穿透防御；恶意随机 key、非法参数仍应由校验、布隆过滤器或限流处理。
- TTL 过长会把新建数据遮蔽；强一致场景可能应禁用负缓存或采用写入时失效。
- 序列化边界是实现细节：跨进程、跨语言、不同 Spring/缓存序列化器未必认识 `NullValue`，不能仅凭 `readResolve()` 推断远端兼容。
- `null` 与空字符串、空集合、key 不存在不是同一语义；替换成字符串标记可能污染业务数据。
- 若业务层开始判断 `NullValue.INSTANCE`，说明缓存抽象泄漏，应把转换收回适配器。

## 最小验证

1. 选一个确实不存在的 key，第一次请求确认只回源一次并写入负缓存；第二次请求确认命中占位值且不访问数据库。
2. 在内存缓存和实际序列化缓存各测一次，断言适配器读出的业务结果仍为 `null`，而 miss 仍可区分。
3. 序列化再反序列化占位对象，若使用 Java 原生序列化，检查身份是否回到 `INSTANCE`；对生产序列化器单独做兼容测试。
4. 写入真实对象后验证负缓存失效或 TTL 到期；记录数据库回源次数、负缓存命中率和陈旧窗口。

## 证据与不确定性

- **来源事实**：`legacy-java-null-value` 给出了 Spring `NullValue` 的占位、单例、`readResolve`、`toStoreValue/fromStoreValue`、短 TTL 和与布隆过滤器的组合语义。
- **本页综合**：将问题重述为 miss/negative hit/positive hit 三态，并把序列化器兼容、失效策略列为部署边界。
- **未确认项**：具体 Spring Cache 版本、Redis 序列化器和跨语言客户端是否能重建该占位对象，需要查运行配置与实测；来源不能推出统一远端行为。

## 相关页面

- [Java 线上性能排障：从症状到证据的最小决策树](/note/java-online-performance-debug)
- [AutoCloseable：资源所有权与关闭异常语义](/note/java-auto-closeable)
- [Java 后端面试复盘：项目真实性、工程机制与生产证据](/note/java-internship-interview-blog-polished)
