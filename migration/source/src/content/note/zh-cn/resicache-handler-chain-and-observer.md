---
title: "ResiCache 的缓存责任链：控制流、嵌套 fragment 与 observer 生命周期"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-observer-nested-execution-contract", "resicache-project-overview"]
related: ["resicache", "resicache-observer-nested-execution"]
tags: [ResiCache, Java, ChainOfResponsibility, Observer, ThreadLocal, Concurrency]
description: "从 ResiCache 当前主线分析 HandlerResult、handler snapshot、锁内 fragment 与 observer scope token 如何共同保持缓存责任链的控制流和生命周期边界。"
toc: true
---

> 本文基于 ResiCache 当前 `main@2954fff217257e9cf7c906450a75070d5e092637` 的源码。它不是项目历史事故复盘，也不把责任链抽象本身当作设计价值；重点是当前代码如何把控制流、嵌套执行和观测状态分开。

缓存保护通常不是一个 handler，而是多个有先后关系的步骤：布隆过滤器、同步锁、提前过期、TTL、空值处理和真正的 Redis 读写。问题很快会从“每个 handler 怎么写”变成：

> 一个节点决定跳过后续处理时，其他节点如何知道？锁内继续执行时，为什么不能重新执行整条链？observer 如何知道一次开始和结束属于同一个调用？

## 直接把 handler 串起来，为什么很快会失控

最直接的实现是让每个 handler 自己调用下一个 handler：

```text
handler A
  -> handler B
      -> handler C
```

这种写法在节点很少时可以工作，但控制流会逐渐藏在局部代码里：

- 某个 handler 返回了值，到底是终止还是继续？
- 跳过剩余节点和正常结束有什么区别？
- 新增 handler 后，原来的顺序是否仍然正确？
- 锁内执行剩余节点时，是否重复触发整条链的 around hook？
- 计时器、MDC 或 tracing 的开始状态由谁恢复？

如果这些语义由 `result != null`、共享字段或隐式异常表达，代码可以运行，但很难审查和测试。

ResiCache 当前实现把这些问题拆成四个独立协议：handler 的结果协议、固定执行顺序、不可变链快照，以及 observer 的 per-call token。

## `HandlerResult` 把结果和控制流分开

`HandlerResult` 是一个 record，包含两个字段：

```java
public record HandlerResult(FlowControl decision, CacheResult result) {
    public static HandlerResult continueChain() { ... }
    public static HandlerResult terminate(CacheResult result) { ... }
    public static HandlerResult skipAll() { ... }
}
```

当前实现有三种主要决策：

| 决策 | 含义 |
|---|---|
| `CONTINUE` | 当前节点完成，继续执行下一个节点 |
| `SKIP_ALL` | 物化当前结果并跳过剩余节点 |
| `TERMINATE` | 物化当前结果并结束责任链 |

`decision` 和 `result` 分开，避免通过“有没有结果”推断“是否继续”。例如 `CONTINUE` 可以没有中间结果，`SKIP_ALL` 也可以携带结果。

`ChainEngine` 的循环只根据 `decision` 推进：

```text
CONTINUE  -> 下一节点
SKIP_ALL  -> 标记 context，返回当前结果
TERMINATE -> 返回当前结果
```

当前实现还会拒绝返回 `null` 的 handler 结果，并指明违规 handler，而不是让错误以稍后出现的 `NullPointerException` 形式暴露。这是 SPI 边界的输入校验，不是额外的业务功能。

源码：[HandlerResult.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/HandlerResult.java#L14-L49)、[ChainEngine.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/ChainEngine.java#L214-L257)。

## 顺序是协议，不是实现细节

当前 handler 顺序是：

```text
BLOOM_FILTER(100)
  -> SYNC_LOCK(200)
  -> EARLY_EXPIRATION(250)
  -> TTL(300)
  -> NULL_VALUE(400)
  -> ACTUAL_CACHE(500)
```

顺序决定了控制流。例如：

- 确定不存在的 key 可以在真正回源前短路；
- 同步锁可以在实际缓存读取前建立临界区；
- 提前过期可以决定当前请求走 miss 还是继续使用缓存值；
- `ActualCacheHandler` 最后才执行真实读写。

`CacheHandlerChainFactory` 先按 `@HandlerPriority` 排序，再根据禁用配置过滤 handler。Bloom、SyncLock、EarlyExpiration 和 NullValue 进入统一的 protection toggle；TTL 被刻意排除，因为关闭 TTL 会让实际缓存写入失去过期边界。

这带来一个重要的可审查性：新增保护机制时，不仅要实现 handler，还要明确它在现有顺序中的位置、终止语义和开关语义。

代价是顺序本身形成了隐式耦合。改变一个优先级可能改变所有后续节点的输入，因此不能把 `HandlerOrder` 当作普通常量清理。

## snapshot 解决的是并发重建，不是业务状态

责任链实例由工厂缓存，构建时将 handler 列表排序并形成链。`ChainEngine.execute` 接收当前链快照，并把它放进当前线程的 `ThreadLocal`：

```java
CURRENT_SNAPSHOT.set(snapshot);
try {
    return new ChainLifecycle(observers, snapshot, context).run();
} finally {
    CURRENT_SNAPSHOT.remove();
}
```

当前执行使用的 snapshot 是不可变列表。之后如果工厂重新构造或替换链，已经开始的调用仍然读取自己的快照，不会在一次执行中途看到 handler 列表变化。

这里的 `ThreadLocal` 只保存“当前调用使用哪一份 handler 结构”。它不应该变成一个通用状态袋，不能把 MDC previous value、Timer start 或 observer token 都塞进去。结构快照和调用状态有不同的生命周期。

## 锁内继续执行，为什么要使用 fragment

同步锁 handler 的职责不是重新执行一条完整缓存链，而是在获得锁后推进自己之后的节点：

```java
CacheResult result = syncSupport.executeSync(
        lockKey,
        () -> engine.executeChainFragment(context, this),
        timeout);

return HandlerResult.terminate(result);
```

`executeChainFragment` 根据当前 snapshot 找到 `from`，然后只执行它后面的 handler。

完整执行和 fragment 的边界是：

```text
完整 execute
  -> chain around start
  -> 节点 before/handle/after
  -> post-process
  -> chain around end

锁内 fragment
  -> from 之后的节点 before/handle/after
  -> 不重新执行 chain around start/end
  -> 不执行 post-process
```

如果锁内再次调用完整 `execute`，会产生第二组 around 生命周期和第二次 post-process。对于 MDC、Timer、fired counter 或 tracing observer，这不是单纯的重复日志，而是错误地把一次外部调用记录成两次链调用。

因此 fragment 并不是另一条链，而是外层调用尚未结束时的内部续跑。

## observer 用 scope token 配对每一次调用

`ChainObserver.onChainStart` 可以返回一个 token，Engine 会把同一个引用传给对应的 `onChainEnd`：

```java
Object token = observer.onChainStart(context);
try {
    // execute chain
} finally {
    observer.onChainEnd(context, token, result);
}
```

Engine 为每个 observer 保存独立槽位，因此 observer A 的 token 不会传给 observer B。这个 token 可以保存：

- MDC 原始值；
- Timer 的起始时间；
- tracing span 或父上下文；
- 其他只属于本次调用的恢复状态。

节点级 hook 也遵循同一原则：`onNodeStart` 返回 token，`onNodeEnd` 在 `finally` 中接收它。handler 抛异常时，`afterNode` 不会被调用，但 `onNodeEnd` 仍会执行，且 result 为 `null`，只负责回收状态，不伪造成功 decision。

observer 自身的 hook 异常会被记录并隔离，不应覆盖业务 handler 的结果。这个选择牺牲了观测完整性，换取了观测组件不污染缓存主路径。

有一个需要保留的当前边界：`ChainLifecycle` 的 `onChainEnd` 传入 `CacheResult.success()`，而不是主链真实结果。当前 observer 不读取该参数，所以现有测试语义成立；如果未来 observer 需要区分命中、miss 和失败，就不能直接复用这个契约，必须先修改接口和测试。

## 测试真正验证了什么

当前测试覆盖了以下协议：

- `CONTINUE` 按顺序推进多个 handler；
- `TERMINATE` 不再调用后续节点；
- `SKIP_ALL` 标记 context 并跳过后续节点；
- `onChainStart` 与 `onChainEnd` 成对调用；
- scope token 按 observer 隔离并原样回传；
- handler 异常时仍执行 `onNodeEnd`；
- null `HandlerResult` 被显式拒绝；
- `executeChainFragment` 不重新触发完整 chain observer；
- MDC observer 能恢复调用方原值；
- Timer observer 不把动态 Redis key 作为高基数标签。

这些测试证明的是控制流和生命周期契约，不是 observer 在真实生产线程池、Tracing SDK 或长时间运行下的完整行为。

## 成本与失效边界

这套设计并不意味着责任链天然可扩展。

- handler 顺序决定上下游语义，增加一个节点需要检查所有相邻节点；
- `ThreadLocal` 只适合当前线程的同步 fragment，不能自动传播到异步线程；
- fragment 不包含 post-process，新增 handler 时必须确认它是否依赖 post-process；
- observer hook 异常被隔离后，观测可能缺失，必须依靠日志和指标发现；
- token 只能配对当前调用，不能解决跨线程传递或跨进程生命周期；
- 当前 chain-end observer 看不到真实主结果，未来扩展结果观测需要重新设计接口；
- 如果系统只有两三个固定步骤，显式方法调用可能比责任链更容易维护。

## 可迁移的判断方法

设计可组合的处理链时，先明确：

1. 控制流是否由显式状态表达，而不是由结果是否为空推断？
2. 节点顺序是否是稳定、可测试的协议？
3. 一次执行是否使用不可变 snapshot？
4. 嵌套执行是新的外部调用，还是当前调用的 fragment？
5. 每个 around hook 是否有 per-call token，并在 `finally` 中回收？
6. 观测组件失败时，应该阻断主路径还是被隔离？
7. post-process 的所有权属于完整执行，还是属于某个 fragment？

如果这些问题没有答案，继续增加 handler 数量只会把隐式耦合分散到更多文件。

相关专项：[ResiCache：observer 嵌套执行必须区分生命周期、fragment 与 scope token](/note/resicache-observer-nested-execution)。
