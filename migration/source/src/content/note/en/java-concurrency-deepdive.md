---
title: "Java Concurrency Deep Dive: JUC, CAS, Atomics, Locks, and Threading"
timestamp: 2026-08-21 00:00:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["ingest-java-concurrency"]
related: [java-atomic-boolean, java-auto-closeable, java-online-performance-debug, jjwt-013-security-api]
tags: [Java, JUC, CAS, Concurrency, Lock, Thread]
description: "Centers on CAS to connect atomics, locks, thread coordination, and reference types with cost boundaries."
toc: true
---

The 15 JUC/Java notes in Fuwari are the most systematic concurrency series in this knowledge base, covering CAS, atomics, `synchronized`, `Monitor`, `ReentrantLock`, `ThreadLocal`, `LockSupport`, deadlocks, and reference types. This page strings them together centered on CAS.

## Core Mechanism

- **CAS**: `CASDeepDive.md` expands three layers from `Unsafe.compareAndSwap` to `cmpxchg`; ABA is solved with `AtomicStampedReference`.
- **Atomics**: `JavaAtomicClasses.md` distinguishes `AtomicInteger/Long/Reference` from `LongAdder` (striped accumulation, see `LongAdderVSAtomicLong.md`).
- **Locks**: `synchronized`/`Monitor.md` covers object headers and monitors; `ReentrantLock.md`/`Reentrancy.md` covers reentrancy and AQS; `LockSupport.md` covers `park/unpark`.
- **Coordination**: `CompletableFutureAction`/`FutureTaskAction` and `ThreadLocal.md` cover async and thread binding; `JavaInterruptMechanism` and deadlock diagnosis cover interruption and troubleshooting.
- **References**: Two articles on JDK8/17 cover strong/soft/weak/phantom reference reclamation semantics.

## Applicability

- Small lock-free critical sections and counters: use CAS/atomics; complex critical sections: use explicit locks.
- High-contention counters: use `LongAdder`; low contention: use `AtomicLong`.

## Not Applicable and Risks

- CAS spinning wastes CPU under high contention; ABA requires version stamps.
- `ThreadLocal` must be `remove`d promptly to avoid leaks in pooled threads.
- Reference semantics vary with GC implementations (G1/ZGC) and JDK versions.

## Minimum Verification

1. Verify two threads concurrently `compareAndSet` with only one success.
2. Compare `LongAdder` vs `AtomicLong` under contention.
3. Check `ThreadLocal` `set/remove` leaks in thread pools.

## Evidence and Uncertainty

- **Source facts**: `ingest-java-concurrency` contains 15 source notes, including a 40KB CAS deep dive.
- **Synthesis**: This page converges scattered chapters into CAS—locks—coordination.
- **Unconfirmed**: `Unsafe` is increasingly restricted after JDK17; `VarHandle` replacement was not verified in sources.

## Related Pages

- [java-atomic-boolean](/note/java-atomic-boolean)
- [java-auto-closeable](/note/java-auto-closeable)
- [java-online-performance-debug](/note/java-online-performance-debug)
- [jjwt-013-security-api](/note/jjwt-013-security-api)
