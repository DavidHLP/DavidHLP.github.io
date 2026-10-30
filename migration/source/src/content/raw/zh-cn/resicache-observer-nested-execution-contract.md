---
title: "ResiCache observer 嵌套执行与 scope token 契约"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-commit
sourceUrl: "https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a"
immutable: true
tags: [ResiCache, Observer, Chain, ThreadLocal, ScopeToken, Redis, Concurrency]
description: "以 ResiCache 公开 main 提交 75ed279a 固定 ChainObserver、ChainEngine 与 SyncLockHandler 的嵌套执行边界：around hook 用 per-call scope token 配对，锁内 fragment 只推进节点，ThreadLocal 仅承载当前快照而不承载 observer 状态。不含本地未发布修改。"
---

# ResiCache observer 嵌套执行与 scope token 契约

本快照只引用公开仓库 `main` 的固定提交 `75ed279a71b17f227c3170d738eb93e50d876c8a`。本地工作区存在未发布修改，不作为证据。

## 固定来源

- 仓库固定提交：https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a
- `ChainObserver.java`：https://raw.githubusercontent.com/DavidHLP/ResiCache/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/chain/observer/ChainObserver.java
- `ChainEngine.java`：https://raw.githubusercontent.com/DavidHLP/ResiCache/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/chain/ChainEngine.java
- `SyncLockHandler.java`：https://raw.githubusercontent.com/DavidHLP/ResiCache/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/protection/breakdown/SyncLockHandler.java
- `SyncSupport.java`：https://raw.githubusercontent.com/DavidHLP/ResiCache/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/protection/breakdown/SyncSupport.java
- `ChainEngineTest.java`：https://raw.githubusercontent.com/DavidHLP/ResiCache/75ed279a71b17f227c3170d738eb93e50d876c8a/src/test/java/io/github/davidhlp/spring/cache/redis/chain/ChainEngineTest.java

## 公开源码事实

### 1. 生命周期顺序是显式的

公开 `ChainEngine` 的完整执行路径是：

```text
ChainHandlerChain.execute(ctx)
  -> snapshot = List.copyOf(handlers)
  -> ChainEngine.execute(snapshot, ctx)
  -> observer.onChainStart(ctx)
  -> beforeNode(handler, ctx)
  -> handler.handle(ctx)
  -> afterNode(handler, ctx, result)
  -> decision 驱动继续/跳过/终止
  -> post-process
  -> observer.onChainEnd(ctx, scopeToken, result)
```

`onChainEnd` 位于 `finally` 中，因此主链抛异常时也会执行 observer 收尾。`beforeNode` 与 `afterNode` 只围绕实际 `handler.handle(ctx)` 调用；handler 抛异常时，Engine 不调用该节点的 `afterNode`。

### 2. around hook 不能用共享字段保存调用状态

`ChainObserver` 的 `onChainStart` 返回 `Object scopeToken`，`onChainEnd` 接收同一 observer 在本次调用返回的 token。`ChainLifecycle.run()` 先取得 observer 注册快照，按索引收集 token，再按相同索引调用 end：

```text
observer[i].onChainStart(ctx) -> scopeTokens[i]
...
observer[i].onChainEnd(ctx, scopeTokens[i], result)
```

因此 MDC 的 previous request id、Timer 的 start nanos 等 per-call 恢复信息，应放在 token 中，而不是放在 observer 单例字段或 `CacheContext` 的 stringly-typed attributes map 中。observer 实例由 Engine 多线程共享，observer 自身必须线程安全。

### 3. 嵌套执行要区分外层生命周期与锁内 fragment

`SyncLockHandler` 在同步锁内调用 `engine.executeChainFragment(context, this)`。公开 Engine 设计中，fragment：

- 从当前快照找到 `from` handler 后，只推进其后续节点；
- 只触发节点级 `beforeNode`/`afterNode`；
- 跳过外层 around-chain start/end，避免重复 MDC stamp 和 Timer 记录；
- 不执行 post-process，由外层 `execute` 完成；
- `from == null`、快照为空或已经到链尾时返回成功。

这使锁内重入不会再次打开一套完整 around 生命周期。若把 fragment 错当成完整 execute，可能产生重复计时、MDC 恢复顺序错误或重复 post-process。

### 4. ThreadLocal 的职责是快照隔离，不是 observer 状态机

公开 Engine 用 `ThreadLocal<List<CacheHandler>> CURRENT_SNAPSHOT` 在 `execute` entry 写入、`finally` 清除，供 `executeChainFragment` 获取当前线程的 handler 快照。它保证并发调用之间不共享快照。

但 ThreadLocal 快照本身不是嵌套 observer token：

- 快照是执行结构，token 是某个 observer 的调用状态；
- 快照可以通过显式参数传给 fragment，避免隐式依赖；
- observer 的 MDC/Timer 状态仍应由每次 execute 返回的 token 携带；
- 若未来支持任意嵌套完整 execute，应使用栈或显式 execution context 管理快照/ token，而不是覆盖单个 ThreadLocal 槽位。

### 5. reentrant loader 的 leader/follower 与 observer 是两层协议

公开 `SyncSupport` 的 single-flight 路径使用 `reentrantKeys` 判断同线程同 key 的重入：

- 首次调用通过 CAS 成为 `Leader`，持有分布式锁或本地执行权；
- 同线程同 key 的嵌套调用走 `Reentrant` fast path；
- 其他线程成为 `Follower`，等待 leader 的 future；
- leader finally 移除状态并完成 future。

这是加载协调协议，不应拿它替代 observer 的 around/per-node hook。前者管理“谁执行加载”，后者记录“本次链调用如何开始、推进和收尾”。

## 可验证场景

公开测试和源码支持以下最小场景：

1. **正常链**：断言 `onChainStart -> beforeNode -> afterNode -> onChainEnd`，且 token end 与 start 返回对象为同一引用。
2. **锁内 fragment**：断言 fragment 只触发后续节点 hook，不触发 around hook 和 post-process。
3. **异常链**：handler 抛异常时，异常继续冒泡；`onChainEnd` 仍由 finally 触发；该 handler 的 `afterNode` 不触发。
4. **并发调用**：两个线程分别执行链，断言 observer token、MDC previous state 和 snapshot 不互相污染。
5. **嵌套同 key**：断言 reentrant fast path 不等待自身 future，也不重复取得同一执行权。

## 边界与未证明内容

- 本快照只负责固定提交 `75ed279a` 的公开源码；仓库后续提交或本地未发布修改可能改变命名和实现。
- 本快照没有声称任意 observer 都已实现任意深度嵌套安全；源码明确保证的是当前 start/end 按 observer 索引配对，以及 fragment 不重复 around/post-process。
- `onChainEnd` 在公开实现中传入 `CacheResult.success()` 而非主路径 `mainResult`，这是源码注释记录的现状；需要真实结果的 observer 不能自行假定已收到失败结果，应先补充专门契约和测试。
- 本快照不把私有会话、未发布工作区 diff 或本机路径作为事实来源。
