---
title: AtomicBoolean 随笔
timestamp: 2025-10-07 20:25:00+08:00
tags: [Java, 随笔]
description: 深入探讨 Java 中 AtomicBoolean 类的作用、使用方法及最佳实践，介绍如何通过无锁编程实现高效的状态管理
---

在多线程编程的世界里，状态同步是一个永恒的主题。当我们想用一个简单的 `boolean` 标志来控制某些逻辑（比如"初始化是否完成"、"任务是否已取消"）时，往往会掉入并发的陷阱。`java.util.concurrent.atomic.AtomicBoolean` 正是为此而生的一个轻量级、高性能的解决方案。

## 并发陷阱：一个普通的 `boolean` 为何不够？

想象一下这个场景：我们有一个只应执行一次的初始化任务。

```java
public class UnsafeInit {
    private boolean initialized = false;

    public void initialize() {
        if (!initialized) {
            // ... 执行一些耗时的初始化工作 ...
            initialized = true; // 标记为已完成
        }
    }
}
```

在单线程环境中，这毫无问题。但在多线程环境下，这几乎一定会出错：

1. **线程A** 执行 `if (!initialized)`，判断结果为 `true`，因为它看到 `initialized` 是 `false`。
2. 此时，操作系统切换到 **线程B**。
3. **线程B** 也执行 `if (!initialized)`，它看到的 `initialized` 仍然是 `false`，所以判断结果也为 `true`。
4. 接下来，线程A和线程B都会进入 `if` 代码块，导致初始化工作被重复执行。

这就是典型的 **"检查而后行动"（Check-Then-Act）** 竞态条件。我们通常的解决办法是加锁：

```java
public class SafeInit {
    private boolean initialized = false;

    public synchronized void initialize() {
        if (!initialized) {
            // ...
            initialized = true;
        }
    }
}
```

使用 `synchronized` 关键字可以完美解决问题，但它是一个"重量级"的操作。它涉及到操作系统的锁、线程的阻塞和唤醒，在高并发场景下可能会成为性能瓶颈。那么，有没有更轻巧的方式呢？

## `AtomicBoolean` 的优点：CAS 与 `VarHandle`

`AtomicBoolean` 的实现揭示了一个普通的 `boolean` 为何不够。打开源码，你会发现两个关键点：

1. **它不是一个真正的 `boolean`**：它的核心成员变量是 `private volatile int value;`。它用整数 `1` 代表 `true`，`0` 代表 `false`。
2. **原子操作的基石**：它的所有原子性保证都依赖于一个名为 `VarHandle` 的现代Java机制（在Java 9之前是 `sun.misc.Unsafe`）。

`VarHandle` 可以看作是一个指向变量的、类型化的引用，它允许我们以不同的内存排序模式（volatile、acquire/release、opaque等）对变量进行原子操作。

`AtomicBoolean` 最核心的方法是 `compareAndSet()`，它的背后是现代CPU提供的一条神奇指令：**CAS (Compare-And-Swap)**。

**CAS操作** 可以通俗地理解为："我想把变量 `V` 的值从 `A` 改为 `B`，但前提是 `V` 的当前值必须是 `A`。如果不是 `A`，说明别人已经改过了，那我就什么也不做，并返回失败。" 整个 "比较并交换" 的过程是一条CPU指令，是**原子**的，不会被中断。

所以，我们可以用 `AtomicBoolean` 来重构上面的初始化例子：

```java
public class AtomicInit {
    private final AtomicBoolean initialized = new AtomicBoolean(false);

    public void initialize() {
        // 尝试将 false 变为 true
        if (initialized.compareAndSet(false, true)) {
            // ... 执行一些耗时的初始化工作 ...
            // 只有一个线程能成功进入这里！
        }
    }
}
```

在这个版本中，多个线程同时调用 `initialize()`：

- 第一个到达的线程调用 `compareAndSet(false, true)`。此时 `initialized` 的值确实是 `false`，CAS操作成功，将其原子性地更新为 `true`，并返回 `true`。该线程进入 `if` 块执行初始化。
- 其他线程稍后调用 `compareAndSet(false, true)` 时，会发现 `initialized` 的值已经是 `true` 了，不满足期望值 `false`，因此CAS操作失败，返回 `false`。这些线程将直接跳过 `if` 块。

整个过程没有使用任何锁，没有线程阻塞，性能极高。这种基于CAS的乐观策略被称为**无锁编程 (Lock-Free Programming)**。

## 核心方法与使用场景

- `public final boolean get()` / `public final void set(boolean newValue)`
  - 最基础的读写操作。由于内部值是 `volatile` 的，这两个操作保证了跨线程的**可见性**。一个线程的 `set` 对另一个线程的 `get` 是立即可见的。

- `public final boolean compareAndSet(boolean expectedValue, boolean newValue)`
  - **核心中的核心**。如上所述，用于实现无锁的状态转换。非常适合实现"一次性"操作、状态机转换等。

- `public final boolean getAndSet(boolean newValue)`
  - 原子性地将值设置为 `newValue`，并返回**旧的**值。这在需要"交换"状态并想知道之前状态的场景中非常有用。例如，一个任务处理器想把"空闲"标志置为"忙碌"，并想知道它下手前是不是真的"空闲"。

- `public final void lazySet(boolean newValue)`
  - 一个性能优化方法。它会设置新值，但不保证这个新值能被其他线程**立即**看到。它比普通的 `set` 开销更小，因为它省略了某些内存屏障。适用于那些"最终一致即可"的场景，比如你只是在重置一个统计标志，不要求绝对的实时性。

- `weakCompareAndSet...` 系列方法
  - 这是 `compareAndSet` 的一个"弱化"版本。它也执行CAS，但即使期望值与当前值相同，它也**可能"伪失败" (Spuriously Fail)**，即返回 `false`。虽然听起来很奇怪，但在某些CPU架构上，这种弱保证能带来更高的性能。它通常被用在循环中，如果失败了就重试。对于大多数应用场景，直接使用 `compareAndSet` 更简单、更可靠。

`AtomicBoolean` 是Java并发包中的一颗小而美的珍珠。它向我们展示了如何通过利用底层硬件的原子指令（CAS）来构建高效、无锁的并发组件。

当你需要一个在多线程间共享的、简单的开关或标志位时，请记住：

> 放弃重量级的 `synchronized`，拥抱轻巧的 `AtomicBoolean`。

它不仅能保证程序的正确性，还能在激烈的并发竞争中为你的应用带来显著的性能提升。它是从并发新手走向专家的必经之路上的一个重要里程碑。
