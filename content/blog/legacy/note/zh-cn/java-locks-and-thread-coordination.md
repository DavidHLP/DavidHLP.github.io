---
{
  "archiveId": "X-1321",
  "translationKey": "legacy/note/java-locks-and-thread-coordination",
  "title": "Java 锁机制、LockSupport 与 ThreadLocal：Monitor、AQS 与线程绑定",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "基于 JUC 锁与线程协作原文，梳理 synchronized / ObjectMonitor（_EntryList 与 _WaitSet）、ReentrantLock 基于 AQS 的非公平与公平权衡、LockSupport 许可原语，以及 ThreadLocal 弱引用 key 与线程池 remove 清理边界。",
  "findings": [
    "原始证据: src/content/raw/zh-cn/ingest-java-concurrency.md",
    "证据状态: 暂定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Java",
    "JUC",
    "Lock",
    "ReentrantLock",
    "LockSupport",
    "ThreadLocal",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-java-concurrency"
  ],
  "related": [
    "java-concurrency-deepdive"
  ]
}
---

当共享状态无法靠单变量无锁原语保持一致，或线程需要挂起等待条件信号时，必须进入互斥锁与线程协作层。选错锁策略、丢失唤醒时序，或在池化线程里遗漏上下文清理，都会直接演变成吞吐下降、线程饥饿或隐蔽内存泄漏。

本页承接 [Java 并发深度：JUC、CAS、原子类、锁与线程机制](/blog/legacy/note/zh-cn/java-concurrency-deepdive/) 中 `Monitor.md`、`ReentrantLock.md`、`LockSupport.md` 与 `ThreadLocal.md` 的细则。

## 核心机制

### 1. 内置管程：`ObjectMonitor` 的互斥与协作队列

`synchronized` 依赖 JVM 管程，并在竞争加剧时经历“偏向锁 -> 轻量级锁 -> 重量级锁（`ObjectMonitor`）”膨胀。HotSpot `ObjectMonitor` 用两组核心队列分离职责：

- **`_EntryList`**：存放竞争互斥锁失败并挂起等待的线程（`monitorenter` CAS `_owner` 失败后入队 `park()`；`monitorexit` 在 `_count` 归零、释放 `_owner` 后从中 `unpark` 唤醒竞争者）。
- **`_WaitSet`**：存放持锁后因条件不满足主动调用 `wait()` 的线程；被 `notify()` / `notifyAll()` 唤醒后从 `_WaitSet` 移回 `_EntryList` 重新竞争锁，而非直接持有锁。

### 2. `ReentrantLock` 与 AQS 公平性权衡

`ReentrantLock` 基于 `AbstractQueuedSynchronizer`（AQS）实现，支持可中断获取（`lockInterruptibly()`）、超时尝试（`tryLock(long, TimeUnit)`）和多 `Condition` 等待队列。两种策略在吞吐与饥饿之间取舍：

- **非公平锁（默认，`new ReentrantLock(false)`）**：释放锁后允许新到达线程直接 CAS “闯入（Barging）”抢锁，减少排队唤醒的上下文切换开销，总体吞吐通常更高，但可能使队列中线程饥饿。
- **公平锁（`new ReentrantLock(true)`）**：严格检查 AQS 队列 FIFO 顺序，有等待者时主动入队末尾避免饥饿，但更频繁的挂起与唤醒会增大切换开销。

### 3. `LockSupport` 许可机制 vs `Object.wait/notify`

| 维度 | `LockSupport`（`park`/`unpark`） | `Object`（`wait`/`notify`） |
| --- | --- | --- |
| 锁绑定要求 | 无需持有对象锁 | 必须在 `synchronized` 块内调用 |
| 唤醒精准度 | `unpark(thread)` 精准唤醒指定线程 | `notify` 随机唤醒一个，`notifyAll` 唤醒全部 |
| 时序耦合 | 基于单线程最多 `1` 个不可累加的许可（Permit），`unpark` 可先于 `park` | `notify` 必须后于 `wait`，否则信号丢失 |
| 底层实现 | 基于 `sun.misc.Unsafe` 本地方法（JUC 同步器基石） | 与 `ObjectMonitor` 深度耦合 |

### 4. `ThreadLocal`：空间换时间与 `remove()` 清理边界

`ThreadLocal` 通过让每个线程持有独立副本规避共享竞争：线程内部维护 `ThreadLocalMap`，其 `Entry` 对 `key`（`ThreadLocal` 实例）使用**弱引用**，避免外部强引用消失后 `key` 自身泄露；但 **`value` 仍是强引用**。当线程复用（如线程池）而未清理时，就会留下 `key == null` 的“脏条目”。虽然 `get()` / `set()` / `remove()` 会顺带触发 `expungeStaleEntry` 清理并 rehash，但最可靠的防护仍是在 `finally` 块中显式调用 `remove()`：

```java
try {
    userContext.set("User-A");
    // 业务逻辑
} finally {
    userContext.remove();
}
```

## 适用边界与未验证内容

- **适用**：复杂多变量临界区、可中断/超时抢锁、需要精确条件通知或线程隔离上下文传递。
- **不适用**：简单单变量计数（优先 CAS/原子类）或依赖未经测试的自旋等待队列。
- **未验证边界（来自 raw 既有限制）**：
  - 原料对比了公平与非公平锁及 `park`/`unpark` 模型，但**未在固定 JDK build 下采集真实竞争压测下的延迟分位数或吞吐曲线**；
  - 线程池 `ThreadLocal` 脏条目堆积及锁竞争与死锁诊断流程，未附带统一构建环境的可复现压测日志。

## 毕业检查

1. 在固定 JDK 构建中对比 `ReentrantLock(false)` 与 `ReentrantLock(true)` 在多核竞争下的吞吐与尾延迟。
2. 构造线程池场景验证未调用 `remove()` 导致上下文串联或堆驻留的行为，并确认 `finally { remove(); }` 修复效果。
3. 验证 `LockSupport.unpark` 先行调用后紧接 `park()` 不阻塞且连续两次 `unpark` 不累计许可的边界。

## 相关页面

- [Java 并发深度：JUC、CAS、原子类、锁与线程机制](/blog/legacy/note/zh-cn/java-concurrency-deepdive/)
- [ingest-java-concurrency（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md)
