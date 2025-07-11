---
title: "LongAdder VS AtomicLong：高并发原子操作的王者对决"
published: 2025-07-11
description: "在Java并发编程中，AtomicLong曾是线程安全计数的首选。但自Java 8起，LongAdder以其卓越的高并发性能崭露头角。本文从核心原理、内部结构到性能表现，深入剖析两者的对决，并揭示LongAdder如何通过“化整为零，分散热点”的设计思想，成为高并发统计场景下的新王者。"
tags: [Java, JUC, Atomic, LongAdder, Performance]
category: JUC
draft: false
---

## 1. 背景：当`AtomicLong`遇到性能瓶颈

在 Java 并发编程中，当我们想实现一个线程安全的计数器时，`AtomicLong`（或`AtomicInteger`）通常是我们的第一反应。它基于 CAS（Compare-and-Swap）操作，提供了一种无锁的、比`synchronized`更高效的原子更新方案。

然而，**“高效”是相对的**。

`AtomicLong`的核心在于，它始终在对**同一个共享的`volatile long`值**进行 CAS 操作。在低到中等程度的并发下，这种方式简单有效。但当并发级别急剧升高，成百上千的线程同时尝试更新这**同一个**变量时，会发生什么？

大量的线程会同时执行 CAS 操作，但只有一个线程能成功，其余所有线程都会失败并陷入**自旋等待**，不断重试，直到成功为止。这导致了严重的**“热点竞争”**（Hotspot Contention）。CPU 资源被大量消耗在无效的自旋上，`AtomicLong`的性能急剧下降，无法随着线程数的增加而扩展。

正是在这种背景下，Java 8 引入了`LongAdder`，一个专为解决高并发下热点竞争问题而生的原子增强类。

## 2. 原理对决：集中一点 vs. 分而治之

正如主人您的图片所描绘的，`AtomicLong`和`LongAdder`的核心区别在于它们如何处理并发写入。

### `AtomicLong`：万军齐过独木桥

![AtomicLong Contention](https://your-image-host.com/atomiclong.png)
_(示意图：所有线程都在竞争同一个单一的 value)_

`AtomicLong`的内部只有一个核心变量`private volatile long value;`。所有的更新操作，如`incrementAndGet()`，最终都会归结为一个对`value`字段的 CAS 循环：

```java
// AtomicLong内部的CAS操作伪代码
public final long incrementAndGet() {
    for (;;) { // 自旋循环
        long current = get();
        long next = current + 1;
        if (compareAndSet(current, next))
            return next;
    }
}
```

在高并发下，`compareAndSet`的成功率极低，导致了性能瓶颈。

### `LongAdder`：化整为零，分散热点

![LongAdder Striped CAS](https://your-image-host.com/longadder.png)
_(示意图：线程被分散到不同的 Cell 中进行更新)_

`LongAdder`的策略是**空间换时间，分段 CAS**。它避免了对单一变量的死磕，其内部结构复杂得多：

- 一个基础值 `base`: `volatile long`类型，当没有竞争或竞争很低时，会优先尝试直接 CAS 更新这个值。
- 一个`Cell[]`数组: `Cell`是`AtomicLong`的一个内部封装（做了缓存行填充以避免伪共享），它是一个`volatile long`。

`LongAdder`的更新逻辑如下：

1.  **无竞争时**：线程首先尝试对`base`进行 CAS 更新。如果成功，流程结束，这与`AtomicLong`此时的行为几乎一致，开销很小。
2.  **竞争出现时**：如果对`base`的 CAS 失败，说明有其他线程在同时更新。此时，线程**不会继续在`base`上自旋**，而是会通过线程特定的哈希值映射到`Cell[]`数组的一个槽位（slot）上。
3.  **分散更新**：线程转而对它自己映射到的那个`Cell`元素进行 CAS 更新。由于不同线程被哈希到不同`Cell`的概率很高，这相当于将原来对一个变量的竞争，**分散到了多个变量上**。
4.  **动态扩容**：如果多个线程恰好被映射到同一个`Cell`并发生竞争，`LongAdder`还会尝试使用下一个`Cell`，甚至在必要时对`Cell[]`数组进行扩容，进一步降低冲突概率。

### 读取操作的区别

- **`AtomicLong.get()`**: 非常快，它只是一个`volatile`读操作。
- **`LongAdder.sum()`**: 相对较慢。它需要将`base`的值与`Cell[]`数组中所有`Cell`元素的值累加起来，才能得到全局的准确总和。在求和期间，允许并发的更新继续进行，因此`sum()`返回的结果可能不是“最新的”，但只要没有新的更新，最终会返回一个精确值。

## 3. 性能与选择：我该用哪个？

| 特性 / 场景        | `AtomicLong`                                                | `LongAdder`                                                                         |
| ------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **核心思想**       | 集中式 CAS，乐观锁                                          | 分段 CAS，空间换时间                                                                |
| **高并发写入性能** | 性能随线程数增加而下降                                      | 性能随线程数增加基本保持稳定，表现卓越                                              |
| **读取性能**       | **快** (`get()`是单次内存读取)                              | **慢** (`sum()`需要遍历和累加)                                                      |
| **内存占用**       | **低** (只有一个 long)                                      | **高** (一个 base + 一个 Cell 数组)                                                 |
| **数据一致性**     | 提供强一致性的快照值                                        | `sum()`在有并发更新时不是精确快照，但适用于最终一致性的统计场景                     |
| **最佳适用场景**   | 1. 并发度不高<br>2. 读多写少<br>3. 需要频繁获取精确的快照值 | 1. **极高并发的写入**<br>2. **写多读少**<br>3. 典型如 QPS、接口调用量等监控指标统计 |

**结论：**

- **用`AtomicLong`的理由**: 当你的并发竞争不激烈，或者你需要频繁地、低成本地读取计数器的瞬时精确值时，`AtomicLong`是简单、高效且正确的选择。
- **用`LongAdder`的理由**: 当你的系统处于高并发状态，有大量的线程同时更新一个计数值，并且你对该值的读取频率远低于写入频率时（例如，一个后台监控系统每秒更新几万次计数，但你可能几秒或几十秒才读取一次总和），`LongAdder`将带来数量级的性能提升。这是典型的用内存空间和读取性能换取极致写入吞吐量的思想。

**一言以蔽之：** `AtomicLong`是通用解决方案，而`LongAdder`是高并发统计场景下的“特种兵”。
