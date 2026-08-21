---
title: Java 并发深度：JUC、CAS、原子类、锁与线程机制
timestamp: 2026-08-21 00:00:00+08:00
series: Java 基础与后端调优
kind: concept
status: active
sources: ["ingest-java-concurrency"]
related: [java-atomic-boolean, java-auto-closeable, java-online-performance-debug, jjwt-013-security-api]
tags: [Java, JUC, CAS, Concurrency, Lock, Thread]
description: 以 CAS 为内核，串联原子类、锁、线程协作与引用类型，明确无锁与有锁的适用成本。
toc: true
---

Fuwari 15 篇 JUC/Java 原文是本知识库最系统的并发专题，覆盖 CAS、原子类、`synchronized`、`Monitor`、`ReentrantLock`、`ThreadLocal`、`LockSupport`、死锁与引用类型。本页以 CAS 为内核串联。

## 核心机制

- **CAS**：`CASDeepDive.md` 从 `Unsafe.compareAndSwap` 到 `cmpxchg` 三层展开，ABA 用 `AtomicStampedReference` 解决。
- **原子类**：`JavaAtomicClasses.md` 区分 `AtomicInteger/Long/Reference` 与 `LongAdder`（分段累加，见 `LongAdderVSAtomicLong.md`）。
- **锁**：`synchronized`/`Monitor.md` 讲对象头与监视器；`ReentrantLock.md`/`Reentrancy.md` 讲可重入与 AQS；`LockSupport.md` 讲 `park/unpark`。
- **协作**：`CompletableFutureAction`/`FutureTaskAction` 与 `ThreadLocal.md` 讲异步与线程绑定；`JavaInterruptMechanism` 与死锁诊断讲中断与排查。
- **引用**：JDK8/17 两篇讲强/软/弱/虚引用的回收语义。

## 适用条件

- 无锁小临界区、计数器用 CAS/原子类；复杂临界区用显式锁。
- 高竞争计数用 `LongAdder`，低竞争用 `AtomicLong`。

## 不适用与风险

- CAS 自旋在高竞争下空转；ABA 需版本戳。
- `ThreadLocal` 需及时 `remove`，避免池化线程泄漏。
- 引用类型语义随 GC 实现（G1/ZGC）与 JDK 版本变化。

## 最小验证

1. 双线程 `compareAndSet` 单次成功验证。
2. `LongAdder` vs `AtomicLong` 压测对比。
3. `ThreadLocal` 在线程池中 `set/remove` 泄漏检查。

## 证据与不确定性

- **来源事实**：`ingest-java-concurrency` 收录 15 篇原文，含 40KB CAS 深度文。
- **本页综合**：把分散篇章收敛为 CAS—锁—协作三问。
- **未确认项**：`Unsafe` 在 JDK17 后逐步受限，`VarHandle` 替代未在原文核对。

## 相关页面

- [java-atomic-boolean](/note/java-atomic-boolean)
- [java-auto-closeable](/note/java-auto-closeable)
- [java-online-performance-debug](/note/java-online-performance-debug)
- [jjwt-013-security-api](/note/jjwt-013-security-api)
