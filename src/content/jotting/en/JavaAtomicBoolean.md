---
title: Notes on AtomicBoolean
timestamp: 2025-10-07 20:25:00+08:00
series: Java
contents: true
tags: [Java, Notes]
description: An in-depth exploration of the AtomicBoolean class in Java, its purpose, usage patterns, and best practices. Learn how to implement efficient state management through lock-free programming
---

In the world of multithreaded programming, state synchronization is an eternal theme. When we want to use a simple `boolean` flag to control certain logic (such as "is initialization complete" or "is the task canceled"), we often fall into concurrency traps. `java.util.concurrent.atomic.AtomicBoolean` is a lightweight, high-performance solution designed for exactly this purpose.

## 1. The Concurrency Trap: Why Isn't a Plain `boolean` Enough?

Imagine this scenario: we have an initialization task that should only be executed once.

```java
public class UnsafeInit {
    private boolean initialized = false;

    public void initialize() {
        if (!initialized) {
            // ... perform some time-consuming initialization work ...
            initialized = true; // Mark as completed
        }
    }
}
```

In a single-threaded environment, this is perfectly fine. But in a multithreaded environment, this will almost certainly go wrong:

1. **Thread A** executes `if (!initialized)`, and the result is `true` because it sees `initialized` is `false`.
2. At this point, the operating system switches to **Thread B**.
3. **Thread B** also executes `if (!initialized)`, and it also sees `initialized` is still `false`, so the result is also `true`.
4. Next, both Thread A and Thread B will enter the `if` block, causing the initialization work to be executed repeatedly.

This is a typical **"Check-Then-Act"** race condition. Our usual solution is to add a lock:

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

Using the `synchronized` keyword perfectly solves the problem, but it's a "heavyweight" operation. It involves OS-level locks, thread blocking and waking, which can become a performance bottleneck in high-concurrency scenarios. So, is there a lighter approach?

## 2. Advantages of `AtomicBoolean`: CAS and `VarHandle`

The implementation of `AtomicBoolean` reveals why a plain `boolean` isn't enough. Opening the source code, you'll find two key points:

1. **It's not a real `boolean`**: Its core member variable is `private volatile int value;`. It uses integer `1` to represent `true` and `0` to represent `false`.
2. **Foundation of atomic operations**: All its atomicity guarantees rely on a modern Java mechanism called `VarHandle` (before Java 9, it was `sun.misc.Unsafe`).

`VarHandle` can be thought of as a typed reference to a variable that allows us to perform atomic operations on the variable with different memory ordering modes (volatile, acquire/release, opaque, etc.).

The most core method of `AtomicBoolean` is `compareAndSet()`, which is backed by a magical instruction provided by modern CPUs: **CAS (Compare-And-Swap)**.

**CAS operation** can be colloquially understood as: "I want to change the value of variable `V` from `A` to `B`, but only if the current value of `V` is `A`. If it's not `A`, it means someone else has already changed it, so I'll do nothing and return failure." The entire "compare and swap" process is a single CPU instruction and is **atomic** - it cannot be interrupted.

So, we can use `AtomicBoolean` to refactor the initialization example above:

```java
public class AtomicInit {
    private final AtomicBoolean initialized = new AtomicBoolean(false);

    public void initialize() {
        // Try to change false to true
        if (initialized.compareAndSet(false, true)) {
            // ... perform some time-consuming initialization work ...
            // Only one thread can successfully enter here!
        }
    }
}
```

In this version, when multiple threads call `initialize()` simultaneously:

- The first thread to arrive calls `compareAndSet(false, true)`. At this time, the value of `initialized` is indeed `false`, the CAS operation succeeds, atomically updating it to `true`, and returns `true`. This thread enters the `if` block to perform initialization.
- When other threads later call `compareAndSet(false, true)`, they'll find that the value of `initialized` is already `true`, which doesn't match the expected value `false`, so the CAS operation fails and returns `false`. These threads will directly skip the `if` block.

The entire process uses no locks and no thread blocking, resulting in extremely high performance. This optimistic strategy based on CAS is called **Lock-Free Programming**.

## 3. Core Methods and Use Cases

- `public final boolean get()` / `public final void set(boolean newValue)`
    - The most basic read and write operations. Since the internal value is `volatile`, these two operations guarantee **visibility** across threads. A `set` by one thread is immediately visible to a `get` by another thread.

- `public final boolean compareAndSet(boolean expectedValue, boolean newValue)`
    - **The core of the core**. As described above, used to implement lock-free state transitions. Very suitable for implementing "one-time" operations, state machine transitions, etc.

- `public final boolean getAndSet(boolean newValue)`
    - Atomically sets the value to `newValue` and returns the **old** value. This is very useful in scenarios where you need to "swap" states and want to know the previous state. For example, a task processor wants to set an "idle" flag to "busy" and wants to know if it was really "idle" before.

- `public final void lazySet(boolean newValue)`
    - A performance optimization method. It will set the new value but doesn't guarantee that this new value will be **immediately** visible to other threads. It has less overhead than a regular `set` because it omits certain memory barriers. Suitable for "eventual consistency" scenarios, such as when you're just resetting a statistics flag and don't require absolute real-time visibility.

- `weakCompareAndSet...` series methods
    - This is a "weakened" version of `compareAndSet`. It also performs CAS, but even if the expected value matches the current value, it **may "spuriously fail"**, i.e., return `false`. Although it sounds strange, on certain CPU architectures, this weak guarantee can bring higher performance. It's usually used in loops where you retry if it fails. For most application scenarios, directly using `compareAndSet` is simpler and more reliable.

`AtomicBoolean` is a small but beautiful gem in the Java concurrency package. It shows us how to build efficient, lock-free concurrent components by leveraging atomic instructions (CAS) from the underlying hardware.

When you need a simple switch or flag bit shared between multiple threads, remember:

> Abandon the heavyweight `synchronized`, embrace the lightweight `AtomicBoolean`.

It not only guarantees program correctness but can also bring significant performance improvements to your application in fierce concurrent competition. It's an important milestone on the necessary path from concurrency novice to expert.
