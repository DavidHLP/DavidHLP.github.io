---
title: "ResiCache：observer 嵌套执行必须区分生命周期、fragment 与 scope token"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: concept
status: active
sources: ["resicache-observer-nested-execution-contract"]
related: ["resicache", "redis-jackson-java-time"]
tags: ["Java", "Observer", "ThreadLocal", "Concurrency", "Redis", "Cache", "Reentrant"]
description: "从公开 ResiCache 固定提交提炼 observer 生命周期、锁内 fragment、per-call scope token 与 ThreadLocal 快照隔离的边界，避免嵌套执行重复 hook 或污染并发状态。"
toc: true
---

**结论优先**：在带缓存链、同步锁和 single-flight 的 Java 系统中，完整 `execute`、锁内 `executeChainFragment` 和 observer 的 per-call scope token 是三种不同概念。around hook 的状态必须由本次调用返回的 token 配对恢复；fragment 只推进节点，不重新打开外层生命周期；`ThreadLocal` 只适合隔离当前执行快照，不应成为 observer 状态机。

## 复盘导读：锁内续跑，为什么不能重新执行整条缓存链？

在 [ResiCache 项目](/note/resicache) 中，同步锁 handler 拿到执行权后，还需要继续执行后面的缓存节点。这个入口看起来可以复用完整的 `execute`，但外层请求的生命周期尚未结束：再次进入完整链，会多开一组计时与上下文恢复逻辑，也可能重复执行后处理。

这篇复盘讨论的是**固定提交中的设计选择与可复现反例**，不是一次声称已经发生的生产事故。阅读重点是三个判断：

- **问题归属**：拿锁后的续跑属于原调用，不是一次新的外部请求。
- **实现取舍**：复用节点执行能力，通过 fragment 跳过 around hook 和 post-process；调用级状态交给 token。
- **验证方式**：核对固定源码，再用下方最小模型观察正确续跑与错误嵌套的事件差异。模型不替代真实 Java、Redis 或并发集成测试。

### 可以直接核验的实现证据

以下链接全部固定在 `75ed279a71b17f227c3170d738eb93e50d876c8a`，不随仓库主分支变化：

| 要核验的问题 | 对应源码 |
| --- | --- |
| 锁内到底调用哪个入口？ | [SyncLockHandler.java](https://github.com/DavidHLP/ResiCache/blob/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/protection/breakdown/SyncLockHandler.java) |
| fragment 是否跳过完整生命周期与后处理？ | [ChainEngine.java](https://github.com/DavidHLP/ResiCache/blob/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/chain/ChainEngine.java) |
| start/end 如何传递本次调用状态？ | [ChainObserver.java](https://github.com/DavidHLP/ResiCache/blob/75ed279a71b17f227c3170d738eb93e50d876c8a/src/main/java/io/github/davidhlp/spring/cache/redis/chain/observer/ChainObserver.java) |
| 可以从哪里继续检查真实项目的测试？ | [ChainEngineTest.java](https://github.com/DavidHLP/ResiCache/blob/75ed279a71b17f227c3170d738eb93e50d876c8a/src/test/java/io/github/davidhlp/spring/cache/redis/chain/ChainEngineTest.java) |

### 最小可运行反例

将下面代码保存为 `lifecycle-check.mjs`，执行 `node lifecycle-check.mjs`。只依赖 Node.js 标准库，用 JavaScript 表达与语言无关的生命周期模型，便于先观察事件顺序。

```js
import assert from "node:assert/strict";

const events = [];
const started = [];
const ended = [];

async function execute(body) {
  const token = {};
  started.push(token);
  events.push("start");
  try {
    const result = await body();
    events.push("post");
    return result;
  } finally {
    ended.push(token);
    events.push("end");
  }
}

async function fragment() {
  events.push("node");
  return "value";
}

assert.equal(await execute(fragment), "value");
assert.deepEqual(events, ["start", "node", "post", "end"]);
assert.equal(ended[0], started[0]);

// 反例：把锁内续跑替换成完整 execute，会重复生命周期和后处理。
events.length = 0;
await execute(() => execute(fragment));
assert.deepEqual(events, ["start", "start", "node", "post", "end", "post", "end"]);

// 异常必须继续传播，同时执行收尾；成功后处理不应发生。
events.length = 0;
const failure = new Error("handler failed");
await assert.rejects(execute(() => { throw failure; }), (error) => error === failure);
assert.deepEqual(events, ["start", "end"]);
assert.equal(ended.at(-1), started.at(-1));

// 两个异步调用重叠，每次 end 都必须拿到各自的 token。
const offset = started.length;
await Promise.all([execute(fragment), execute(fragment)]);
assert.notEqual(started[offset], started[offset + 1]);
assert.notEqual(ended[offset], ended[offset + 1]);
assert.ok(ended.slice(offset).every((token) => started.slice(offset).includes(token)));
console.log("PASS: fragment boundary, duplicate lifecycle counterexample, cleanup, token pairing");
```

**预期结果**：输出一行 `PASS`。反例明确显示两次 `start/post/end`，正确 fragment 路径各一次；异常路径保留 `end` 并传播原异常。这验证的是模型中的契约，异步交错也不等于 JVM 多线程验证。真实工程仍需下文测试矩阵中的线程隔离、锁失效和同 key 重入检查；本文没有新增吞吐或生产稳定性承诺。

## 适用范围

本页基于公开 ResiCache `main` 的固定提交 `75ed279a71b17f227c3170d738eb93e50d876c8a`，适用于：

- 给缓存 handler chain 增加 MDC、Timer 或 tracing observer；
- 在分布式锁或单飞加载中重入同一条 handler chain；
- 排查嵌套执行导致的重复计时、MDC 泄漏和 future 自等待；
- 设计可并发复用的 observer API。

## 1. 先画出三个执行边界

公开 Engine 的完整执行顺序可简化为：

```text
execute(ctx)
  -> snapshot handlers
  -> observer.onChainStart(ctx)
  -> beforeNode(handler)
  -> handler.handle(ctx)
  -> afterNode(handler, result)
  -> decision: continue / skip / terminate
  -> post-process
  -> observer.onChainEnd(ctx, scopeTokens, result)
```

锁内 fragment 则是：

```text
executeChainFragment(context, fromHandler)
  -> 从当前 snapshot 找到 from
  -> 只推进后续节点
  -> 运行节点级 before/handle/after
  -> 不重新执行 around start/end
  -> 不执行 post-process
```

这两个入口不能互换。fragment 是外层 execute 的内部续跑，不是一次独立的完整链调用。

## 2. around hook 用 token 配对，不用共享字段

observer 接口让 `onChainStart` 返回 `scopeToken`，再把同一个 token 传给 `onChainEnd`：

```java
Object token = observer.onChainStart(context);
try {
    // chain execution
} finally {
    observer.onChainEnd(context, token, result);
}
```

真实实现中 token 应保存本次调用需要恢复的状态，例如：

- MDC 原来的 request id；
- Timer 的 start nanos；
- tracing span 或 parent context；
- 嵌套深度和恢复顺序。

不要把这些值写进共享 observer 字段，也不要把它们塞进无类型的 `CacheContext` 字符串属性。observer 通常被多个线程复用，字段状态会把请求 A 的收尾和请求 B 的开始串在一起。

## 3. fragment 为什么不能再次触发 around hook

同步锁 handler 在锁内继续执行后续节点时，外层 execute 仍然负责：

- 当前 snapshot 的生命周期；
- around hook 的 start/end 配对；
- 最终 post-process；
- 最终结果和异常边界。

如果 fragment 再调用完整 `execute`，常见后果是：

1. MDC stamp 被重复写入，内层结束时恢复到错误的 previous value；
2. Timer 和 tracing 产生一条虚假的嵌套调用；
3. post-process 执行两次，缓存写回或状态转换重复；
4. observer 以为发生了两次外部请求，但实际只有一次锁内续跑。

因此 fragment 应只暴露“从哪个 handler 之后继续”的最小入口，并明确不承担 around/post-process。

## 4. `ThreadLocal` 只放执行快照

Engine 使用 `ThreadLocal<List<CacheHandler>>` 保存当前线程的 handler snapshot，使 fragment 能看到与外层 execute 一致的不可变列表。这个用法解决的是并发调用之间的结构隔离：

```java
List<CacheHandler> snapshot = List.copyOf(handlers);
CURRENT_SNAPSHOT.set(snapshot);
try {
    // execute and possibly executeChainFragment
} finally {
    CURRENT_SNAPSHOT.remove();
}
```

不要把 observer 的 MDC previous value、Timer start 或 scope token 也放进同一个 ThreadLocal 槽位。快照是执行结构，token 是 per-call 状态，生命周期不同。

如果将来支持完整 execute 的任意深度嵌套，需要使用显式 execution context 或栈式 ThreadLocal，并为每一层恢复前一层；单个可覆盖槽位只能安全支持当前公开的 fragment 边界。

## 5. 和 single-flight 的 leader/follower 分开建模

同 key 的 single-flight 负责回答“哪个线程执行加载”：

- 首个线程成为 `Leader`；
- 同线程同 key 的嵌套调用走 `Reentrant` fast path；
- 其他线程成为 `Follower` 并等待 leader future；
- leader 在 finally 清理状态并完成 future。

observer 负责回答“这一次链执行经历了哪些生命周期事件”。两者不能互相替代：

- single-flight 不应决定 observer token 的开始和结束；
- observer 不应持有 leader/follower 的共享锁状态；
- reentrant fast path 不能等待自己创建的 future，否则会死锁。

## 最小测试矩阵

| 场景           | 应验证                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| 正常完整链     | `onChainStart -> beforeNode -> afterNode -> onChainEnd`，start/end token 相同 |
| 锁内 fragment  | 只有后续节点 hook；无第二次 around hook；无第二次 post-process                |
| handler 抛异常 | 异常继续传播；finally 触发 `onChainEnd`；失败 handler 不触发 `afterNode`      |
| 两线程并发     | token、MDC previous state、snapshot 互不污染                                  |
| 同 key 嵌套    | reentrant 路径不等待自身 future，不重复取得执行权                             |

这些是最小的可回归契约；生产系统还应补充取消、超时、锁失效和结果可见性测试。

## 常见错误

- **用共享字段存 start 时间或 MDC previous value**：并发调用互相覆盖。
- **fragment 调完整 execute**：重复 around hook 和 post-process。
- **把 ThreadLocal 当成万能上下文**：嵌套层覆盖，异常路径难恢复。
- **把 single-flight 和 observer 合成一层**：协调状态与观测状态相互污染。
- **默认 observer 收到主失败结果**：公开固定实现的 `onChainEnd` 传入的是成功结果占位；需要失败结果时必须先补充明确契约和测试。

## 证据边界

本页只承诺公开固定提交中的行为，不把本地未发布修改当作证据。源码事实与固定提交见 [ResiCache 公开固定提交](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a)；脱敏 raw 快照位于仓库 `src/content/raw/zh-cn/resicache-observer-nested-execution-contract.md`。
