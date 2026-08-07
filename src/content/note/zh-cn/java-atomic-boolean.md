---
title: "AtomicBoolean：原子布尔状态与 CAS 边界"
timestamp: 2025-10-07 20:25:00+08:00
series: "Java 基础与后端调优"
kind: concept
status: active
sources: ["legacy-java-atomic-boolean"]
related: ["java-auto-closeable", "java-online-performance-debug", "java-internship-interview-blog-polished"]
tags: ["Java", "Concurrency", "AtomicBoolean", "CAS", "JUC"]
description: "说明何时需要原子布尔状态，compareAndSet 如何把检查与切换合并，以及 CAS 在多变量一致性、高竞争和复杂协作中的边界。"
toc: true
---

`AtomicBoolean` 用于在多个线程之间表达一个可见、可原子切换的二值状态。本页回答两个问题：普通 `boolean` 或 `volatile` 何时不够，以及 CAS 能解决什么、不能解决什么。它不是“无锁替代一切锁”的规则。

## 核心机制

### 1. 先区分状态可见性和状态转换

| 需求 | 合适工具 | 因果关系 |
| --- | --- | --- |
| 单线程状态 | `boolean` | 没有共享并发语义 |
| 只广播一个已改变的状态 | `volatile boolean` | 读写可见，但检查与写入仍可能被打断 |
| 只有一个线程能完成 `false → true` | `AtomicBoolean.compareAndSet` | 读、比较、写在一次原子更新中完成 |
| 多个字段必须一起满足不变量 | `synchronized` / `Lock` | 锁保护整个临界区，而不是一个标志 |

`if (!flag) { flag = true; }` 是 check-then-act。两个线程都可能读到 `false`；将字段改成 `volatile` 只修复可见性，不能修复这段复合操作。

### 2. CAS 的最小模型

```java
private final AtomicBoolean running = new AtomicBoolean();

if (!running.compareAndSet(false, true)) {
    return;                 // 已有线程占用
}
try {
    doWork();
} finally {
    running.set(false);     // 异常也必须释放状态
}
```

CAS 只在当前值等于 `expected` 时写入 `newValue`，并返回是否成功。它适合一次性执行、取消通知、启动/停止、重复提交保护等小状态机：成功者拥有一次动作，失败者快速返回或按业务重试。

原子读写还提供相应的内存可见性语义，但它不会自动保护 `data`、计数器、集合等其他普通字段。只有在发布关系和所有相关字段都经过正确同步时，读线程才能安全使用它们。

## 适用条件

- 共享状态确实只有 `true/false` 两个值，且转换规则可以明确写成 CAS。
- 竞争通常有限；CAS 失败可以放弃、返回冲突，或进行有限重试。
- 需要表达“只做一次”“正在运行”“已取消”或简单生命周期，而不是长时间持有的临界区。
- `AtomicBoolean` 对象本身作为 `final` 字段，不被替换；业务操作的成功与失败有明确观测结果。

## 不适用与风险

- 需要同时更新余额、计数和记录等多个变量时，一个 flag 不能保持整体一致性，应使用锁或更合适的并发数据结构。
- 高竞争下无界自旋会制造 CPU 空转；CAS 不保证公平，也不会让等待线程自动休眠。
- 需要等待、唤醒、容量协调或复杂状态机时，优先评估 `CountDownLatch`、`Semaphore`、`Condition`、队列或锁。
- `set(true)` 只是写状态，不能替代“期待旧值才允许切换”的 `compareAndSet`。
- CAS “更快”不是来源事实；真实性能取决于竞争、临界区、失败率和 JVM/JDK 版本，不能只凭 API 名称判断。

## 最小验证

1. 写一个 `compareAndSet(false, true)` 的一次性任务，使用两个线程并行调用；断言副作用计数只能增加一次。
2. 让 `doWork()` 抛异常，随后再次调用；若 `finally` 正确恢复，第二次仍能获得 `false → true`。
3. 在高竞争测试中记录 CAS 失败次数和 CPU，而不是只测无竞争吞吐；观察失败是否导致无界重试。
4. 若 flag 用来发布数据，分别验证“写数据后再 `set(true)`”和“读到 true 后读数据”的同步关系；不要把单个原子变量当成所有字段的证明。

## 证据与不确定性

- **来源事实**：`legacy-java-atomic-boolean` 记录了 `volatile` 的 check-then-act 限制、`compareAndSet`、`get/set`、取消/生命周期示例，以及多变量一致性和高竞争风险。
- **本页综合**：把上述示例压缩为“可见性—原子转换—临界区”的选择表，并以有限竞争、快速失败作为 CAS 的使用条件。
- **未确认项**：具体 CAS 与锁的性能差异、VarHandle/Unsafe 的实现细节依赖 JDK、硬件和负载；本页不把它们当作稳定结论。

## 相关页面

- [AutoCloseable：资源所有权与关闭异常语义](/note/java-auto-closeable)
- [Java 线上性能排障：从症状到证据的最小决策树](/note/java-online-performance-debug)
- [Java 后端面试复盘：项目真实性、工程机制与生产证据](/note/java-internship-interview-blog-polished)
