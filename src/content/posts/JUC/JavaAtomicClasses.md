---
title: Java原子类详解
published: 2025-07-11
description: 作为一位资深的Java开发者，我们知道在并发编程中，保证数据的一致性和线程安全是至关重要的。本文详细讲解了Java中的原子类，它们是如何通过CAS操作实现高性能的线程安全，并介绍了常用的API和实际应用场景。
tags: [Java, JUC, Atomic]
category: JUC
draft: false
---

## 1. 背景：并发编程的挑战与原子类的诞生

在 Java 并发编程中，保证共享变量的原子性是确保线程安全的核心。传统的`synchronized`和`Lock`机制虽能解决问题，但它们是**悲观锁**，在线程竞争激烈时，频繁的线程阻塞和唤醒会带来显著的性能开销和上下文切换成本。

为了应对这一挑战，Java 自 JDK 1.5 起在`java.util.concurrent.atomic`包中引入了一套原子类。这些类基于现代处理器提供的硬件级原子指令（如 CAS），实现了一种轻量级、高性能的线程安全变量更新方案。这套方案属于**乐观锁**的范畴，它假设并发冲突是小概率事件，从而避免了传统锁的开销。

## 2. 核心基石：CAS (Compare-and-Swap)

原子类实现高效并发的秘密武器是**CAS (Compare-and-Swap)** 操作。

CAS 操作包含三个核心操作数：

1.  **内存位置 V (Variable)**: 需要更新的变量。
2.  **预期原值 A (Expected)**: 线程认为该变量当前应该持有的值。
3.  **新值 B (New)**: 准备写入的新值。

操作流程如下：当一个线程要更新变量`V`时，它会原子性地执行一步操作——比较`V`的当前值是否与`A`相等。如果相等，证明在它准备更新的期间没有其他线程染指该变量，此时就安全地将`V`的值更新为`B`并返回成功。如果不相等，则说明`V`已被其他线程修改，本次更新失败，线程不会阻塞，而是会得到一个失败的反馈。

通常，开发者会基于 CAS 实现一个自旋循环，即一旦更新失败，就重新读取新值，再次尝试 CAS，直到成功为止。

### 2.1 潜在风险：ABA 问题

CAS 本身存在一个经典问题——**ABA 问题**。
**问题描述**：线程 T1 读取内存值 V 为 A，准备将其更新为 C。在 T1 执行更新前，线程 T2 介入，将 V 从 A 改为 B，然后又改回了 A。之后 T1 执行 CAS，发现内存值 V 仍然是 A，便认为“一切未变”，成功将值更新为 C。

在大多数数值增减场景下，ABA 问题无伤大雅。但在某些严谨的业务逻辑中（例如，账户资金的流转记录），这种“过程被忽略”的情况是致命的。解决方案我们将在`AtomicStampedReference`中详细探讨。

## 3. 原子类家族全景解析

### 3.1 基础类型原子类：`AtomicInteger`, `AtomicLong`, `AtomicBoolean`

这是最常用的一组原子类，用于对单个原始类型值进行原子操作。

**核心 API (以 `AtomicInteger` 为例):**

| 方法签名                                    | 描述                                                                                               | 返回值    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| `get()`                                     | 获取当前值（保证`volatile`读语义）。                                                               | 当前值    |
| `set(int newValue)`                         | 设置新值（保证`volatile`写语义）。                                                                 | `void`    |
| `lazySet(int newValue)`                     | 延迟设置，性能更高，但不保证后续读操作立即看到修改。适用于对实时性要求不高的场景，如重置监控数据。 | `void`    |
| `compareAndSet(int expect, int update)`     | 核心 CAS 操作。如果当前值等于`expect`，则原子地更新为`update`。                                    | `boolean` |
| `weakCompareAndSet(int expect, int update)` | 弱 CAS，可能出现“虚假失败”（值未变也返回`false`），在某些平台性能更好，但必须在循环中使用。        | `boolean` |
| `getAndSet(int newValue)`                   | 原子地设置为新值，并返回**修改前**的旧值。                                                         | 旧值      |
| `getAndIncrement()` / `getAndDecrement()`   | 原子地将值加 1 或减 1，并返回**修改前**的旧值。                                                    | 旧值      |
| `incrementAndGet()` / `decrementAndGet()`   | 原子地将值加 1 或减 1，并返回**修改后**的新值。                                                    | 新值      |
| `getAndAdd(int delta)`                      | 原子地加上`delta`，并返回**修改前**的旧值。                                                        | 旧值      |
| `addAndGet(int delta)`                      | 原子地加上`delta`，并返回**修改后**的新值。                                                        | 新值      |

**应用案例 1：线程安全的计数器 (`AtomicInteger`)**

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

class SafeCounter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet(); // 原子自增，无需加锁
    }

    public int getCount() {
        return count.get();
    }
}
// 使用示例
// ExecutorService executor = Executors.newFixedThreadPool(10);
// SafeCounter counter = new SafeCounter();
// IntStream.range(0, 1000).forEach(i -> executor.submit(counter::increment));
// ...
// System.out.println(counter.getCount()); // 输出1000
```

**应用案例 2：确保任务只执行一次 (`AtomicBoolean`)**
`AtomicBoolean`非常适合用作一次性状态的标记，例如“初始化”操作。

```java
import java.util.concurrent.atomic.AtomicBoolean;

class OneTimeInitializer {
    private final AtomicBoolean initialized = new AtomicBoolean(false);

    public void initialize() {
        // compareAndSet确保只有一个线程能将false变为true
        if (initialized.compareAndSet(false, true)) {
            System.out.println("Initialization logic runs here. Thread: " + Thread.currentThread().getName());
            // ... 执行重量级的初始化任务
        } else {
            System.out.println("Already initialized. Thread: " + Thread.currentThread().getName());
        }
    }
}
// 使用示例
// OneTimeInitializer initializer = new OneTimeInitializer();
// IntStream.range(0, 5).parallel().forEach(i -> initializer.initialize());
// // 控制台只会打印一次 "Initialization logic runs here."
```

### 3.2 数组类型原子类：`AtomicIntegerArray`, `AtomicLongArray`, `AtomicReferenceArray`

这类原子类允许你对数组中的**单个元素**进行原子操作，而无需锁定整个数组，实现了更细粒度的并发控制。当你需要一个线程安全的数组，并且更新操作集中在独立元素上时，它们是绝佳选择。

其 API 与基础类型原子类高度相似，只是每个方法都增加了一个`int i`参数来指定数组索引。

**应用案例 1：并发更新统计数组 (`AtomicIntegerArray`)**

```java
import java.util.concurrent.atomic.AtomicIntegerArray;

class ConcurrentMetrics {
    // 假设索引0代表点击数，索引1代表曝光数
    private final AtomicIntegerArray metrics;

    public ConcurrentMetrics(int size) {
        this.metrics = new AtomicIntegerArray(size);
    }

    public void incrementClicks() {
        metrics.getAndIncrement(0); // 原子地增加索引0的元素值
    }

    public void incrementImpressions() {
        metrics.getAndIncrement(1); // 原子地增加索引1的元素值
    }

    public int getClicks() {
        return metrics.get(0);
    }
}
```

**应用案例 2：原子地更新对象数组状态 (`AtomicReferenceArray`)**

```java
import java.util.concurrent.atomic.AtomicReferenceArray;

class TaskProcessor {
    enum Status { PENDING, RUNNING, COMPLETED }

    private final AtomicReferenceArray<Status> taskStatuses;

    public TaskProcessor(int taskCount) {
        this.taskStatuses = new AtomicReferenceArray<>(taskCount);
        for (int i = 0; i < taskCount; i++) {
            taskStatuses.set(i, Status.PENDING);
        }
    }

    // 尝试将一个任务从PENDING状态切换到RUNNING状态
    public boolean startTask(int taskIndex) {
        return taskStatuses.compareAndSet(taskIndex, Status.PENDING, Status.RUNNING);
    }

    public Status getTaskStatus(int taskIndex) {
        return taskStatuses.get(taskIndex);
    }
}
```

### 3.3 引用类型原子类：处理对象与 ABA 问题

这类原子类用于对对象引用进行原子更新，是解决复杂并发状态流转的关键。

#### `AtomicReference<V>`

提供对单个对象引用的原子操作。

**应用案例：安全地更新配置对象**

```java
import java.util.concurrent.atomic.AtomicReference;

class AppConfig {
    // 不可变配置对象
    private final String version;
    public AppConfig(String version) { this.version = version; }
    public String getVersion() { return version; }
}

class ConfigManager {
    private final AtomicReference<AppConfig> currentConfig = new AtomicReference<>(new AppConfig("1.0"));

    public void updateConfig(String newVersion) {
        AppConfig oldConfig, newConfig;
        do {
            oldConfig = currentConfig.get();
            newConfig = new AppConfig(newVersion);
            // 循环尝试，直到成功为止
        } while (!currentConfig.compareAndSet(oldConfig, newConfig));
        System.out.println("Config updated to " + newVersion);
    }
}
```

#### `AtomicStampedReference<V>`：ABA 问题的终极解决方案

它通过一个整型“标记”(stamp)，通常用作版本号，来解决 ABA 问题。CAS 操作现在不仅要检查引用是否匹配，还要检查版本号是否匹配。

**应用案例：带版本号的安全账户提款**

```java
import java.util.concurrent.atomic.AtomicStampedReference;

class Account {
    public final int balance;
    public Account(int balance) { this.balance = balance; }
}

class SafeAccount {
    private final AtomicStampedReference<Account> accRef;

    public SafeAccount(int initialBalance) {
        this.accRef = new AtomicStampedReference<>(new Account(initialBalance), 0); // 初始账户，初始版本号0
    }

    public boolean withdraw(int amount) {
        int[] stampHolder = new int[1]; // 用于获取当前版本号
        Account currentAcc, newAcc;
        int currentStamp;

        do {
            currentAcc = accRef.get(stampHolder);
            currentStamp = stampHolder[0];

            if (currentAcc.balance < amount) {
                System.out.println("余额不足");
                return false;
            }
            newAcc = new Account(currentAcc.balance - amount);
            // 核心：CAS时必须提供预期的引用和版本号。成功后，版本号加1。
        } while (!accRef.compareAndSet(currentAcc, newAcc, currentStamp, currentStamp + 1));

        System.out.println("成功取出: " + amount + "，新余额: " + newAcc.balance);
        return true;
    }
}
```

#### `AtomicMarkableReference<V>`：轻量级 ABA 解决方案

`AtomicStampedReference`的简化版，其“标记”是一个`boolean`值。适用于那些你只关心值“是否被修改过”，而不关心“被修改了多少次”的场景。

**应用案例：标记一个可回收的对象**

```java
import java.util.concurrent.atomic.AtomicMarkableReference;

class Node<T> {
    T item;
    // (item, marked_as_deleted)
    AtomicMarkableReference<Node<T>> next;
    Node(T item) { this.item = item; }
}

class LockFreeList {
    // 假设我们要逻辑删除一个节点
    public void logicalDelete(Node<String> node) {
        // 尝试将节点的next引用的mark位置为true，表示该节点已被删除
        // 只有当next引用未变且mark为false时，才能成功
        node.next.attemptMark(node.next.getReference(), true);
    }
}
```

### 3.4 字段更新器：`Atomic...FieldUpdater`

这是一类非常独特的、基于反射的原子工具，其核心价值在于**在不改变一个类结构的前提下，为其某个字段提供原子操作能力**，从而实现低侵入式的并发控制和内存优化。

**使用场景**:

1.  **第三方类**: 你需要对一个无法修改源码的库中的类的某个字段进行原子更新。
2.  **内存优化**: 类中某个字段在大多数情况下无需原子性，只有在少数高并发场景下需要。直接使用`AtomicInteger`会给每个实例带来额外的包装对象开销。字段更新器是共享的，不会增加实例的内存占用。

**使用前提**:

1.  目标字段**必须**是 `volatile` 类型，以保证 CAS 操作的可见性。
2.  目标字段的访问权限不能是 `private`。
3.  必须是实例变量，不能是静态变量。

> **面试亮点**: 当被问及`volatile`的用途时，除了回答“保证可见性”和“禁止指令重排”外，如果你能补充：“**在使用`AtomicIntegerFieldUpdater`等字段更新器时，目标字段必须声明为`volatile`，这是对普通对象字段实现 CAS 操作的前提。**” 这将极大展示你的实践深度。

**应用案例：安全地更新用户信息**

```java
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;
import java.util.concurrent.atomic.AtomicReferenceFieldUpdater;

class User {
    // 1. 字段必须是volatile且非private
    public volatile int age;
    public volatile String status;

    public User(int age, String status) {
        this.age = age;
        this.status = status;
    }

    // getters...
    public int getAge() { return age; }
    public String getStatus() { return status; }
}

public class FieldUpdaterDemo {
    // 2. 创建Updater实例，它是线程安全的，通常定义为静态常量
    private static final AtomicIntegerFieldUpdater<User> ageUpdater =
        AtomicIntegerFieldUpdater.newUpdater(User.class, "age");

    private static final AtomicReferenceFieldUpdater<User, String> statusUpdater =
        AtomicReferenceFieldUpdater.newUpdater(User.class, String.class, "status");

    public static void main(String[] args) {
        User user = new User(25, "Active");

        // 使用Updater对user实例的字段进行原子操作
        ageUpdater.compareAndSet(user, 25, 26);
        System.out.println("Updated age: " + user.getAge()); // Output: 26

        statusUpdater.compareAndSet(user, "Active", "Inactive");
        System.out.println("Updated status: " + user.getStatus()); // Output: Inactive
    }
}
```

### 3.5 高性能增强类：`LongAdder` & `LongAccumulator` (Java 8+)

`AtomicLong`虽然高效，但在**极高并发**下，所有线程都在竞争同一个 CAS 变量，会导致大量自旋重试，性能触顶甚至下降。`LongAdder`等类就是为了解决这个“热点竞争”问题而生。

**核心原理：空间换时间，分散热点**
`LongAdder`内部维护一个`base`基础值和一个`Cell[]`（Cell 是`AtomicLong`的内部封装）数组。

1.  **低并发**: 当没有竞争时，数据直接累加到`base`，此时与`AtomicLong`无异。
2.  **高并发**: 当对`base`的 CAS 失败时，线程会“不纠缠”，转而尝试将增量加到`Cell[]`数组中的某个`Cell`上。每个线程通过哈希映射到不同的`Cell`，从而将写操作的热点从一个点分散到多个点，极大减少了冲突。
3.  **最终求和**: 调用`sum()`方法时，会将`base`与所有`Cell`中的值相加返回。

**`Adder` vs `Accumulator`**

- `LongAdder` 是 `LongAccumulator` 的一个特例，专门用于**加法**。
- `LongAccumulator` 更为通用，允许在构造时提供一个自定义的二元运算函数（如求最大值、最小值、乘积等）。

**应用案例：高并发统计与聚合**

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.LongAccumulator;
import java.util.concurrent.atomic.LongAdder;
import java.util.stream.IntStream;

public class AdderAccumulatorDemo {
    public static void main(String[] args) throws InterruptedException {
        // --- LongAdder: 高并发计数 ---
        LongAdder counter = new LongAdder();
        ExecutorService executor = Executors.newFixedThreadPool(10);
        int tasks = 1_000_000;

        // 10个线程，每个执行10万次加法
        for (int i = 0; i < tasks; i++) {
            executor.submit(counter::increment);
        }

        // 等待任务执行完毕 (实际项目中应使用更健壮的同步方式)
        executor.shutdown();
        while (!executor.isTerminated()) { }
        System.out.println("LongAdder count: " + counter.sum()); // Output: 1000000

        // --- LongAccumulator: 并发求最大值 ---
        // 构造时传入 (当前值, 新值) -> Math.max(当前值, 新值) 函数，和初始值
        LongAccumulator maxTracker = new LongAccumulator(Math::max, Long.MIN_VALUE);
        IntStream.range(1, 1001).parallel().forEach(maxTracker::accumulate);
        System.out.println("Max value tracked by LongAccumulator: " + maxTracker.get()); // Output: 1000
    }
}
```

## 如何选择合适的原子类？

| 场景需求                                 | 推荐原子类                              | 理由                                                      |
| ---------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| **通用线程安全计数**                     | `AtomicInteger` / `AtomicLong`          | 简单、直接，足以应对绝大多数并发场景。                    |
| **极高并发、写密集的统计** (如 QPS 计数) | `LongAdder` / `DoubleAdder`             | 分段 CAS 设计，性能远超`AtomicLong`，专为高竞争场景优化。 |
| **需要对对象引用进行原子更新**           | `AtomicReference`                       | 实现对共享对象的安全替换。                                |
| **需要解决 CAS 的 ABA 问题**             | `AtomicStampedReference`                | 通过版本号机制，确保数据在“版本”上也符合预期，最为严谨。  |
| **只需关心引用是否被改过一次**           | `AtomicMarkableReference`               | `AtomicStampedReference`的轻量版，标记位开销更小。        |
| **对数组中某个元素进行原子操作**         | `Atomic...Array` 系列                   | 提供了数组元素级别的原子性，避免了对整个数组加锁。        |
| **需要一个通用的、可自定义运算的累加器** | `LongAccumulator` / `DoubleAccumulator` | 比`Adder`更灵活，可实现求最大/小值、乘积等复杂聚合。      |
| **在不修改类源码前提下增加原子性**       | `Atomic...FieldUpdater` 系列            | 低侵入性，节省内存，是为已有类“赋能”的利器。              |
