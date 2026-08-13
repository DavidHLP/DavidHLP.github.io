---
title: "AtomicBoolean: Atomic Boolean State and CAS Boundaries"
timestamp: 2025-10-07 20:25:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["legacy-java-atomic-boolean"]
related: ["java-auto-closeable", "java-online-performance-debug", "java-internship-interview-blog-polished"]
tags: ["Java", "Concurrency", "AtomicBoolean", "CAS", "JUC"]
description: "Explains when an atomic boolean state is needed, how compareAndSet combines checking with transition, and where CAS stops helping with multi-field invariants, contention, and coordination."
toc: true
---

`AtomicBoolean` expresses a visible, atomically changeable two-state value shared by threads. This page answers when plain `boolean` or `volatile` is insufficient and what CAS can—and cannot—guarantee. It is not a rule that lock-free code should replace every lock.

## Core mechanism

### 1. Separate visibility from state transition

| Need | Suitable tool | Causal reason |
| --- | --- | --- |
| State local to one thread | `boolean` | No shared-concurrency semantics are required |
| Broadcast that a state changed | `volatile boolean` | Reads and writes are visible, but check and write can still race |
| Let only one thread complete `false → true` | `AtomicBoolean.compareAndSet` | Read, compare, and write happen as one atomic update |
| Keep several fields under one invariant | `synchronized` / `Lock` | A lock protects the whole critical section, not one flag |

`if (!flag) { flag = true; }` is check-then-act. Two threads can both read `false`; declaring the field `volatile` fixes visibility, not the compound operation.

### 2. The smallest CAS model

```java
private final AtomicBoolean running = new AtomicBoolean();

if (!running.compareAndSet(false, true)) {
    return;                 // another thread owns the attempt
}
try {
    doWork();
} finally {
    running.set(false);     // release even on failure
}
```

CAS writes `newValue` only when the current value equals `expectedValue`, and reports success. It fits one-shot work, cancellation notices, start/stop transitions, duplicate-submit guards, and other small state machines: the winner performs one action and losers fail fast or retry under an explicit policy.

Atomic reads and writes also carry the relevant memory-visibility semantics, but they do not make `data`, counters, collections, or other ordinary fields thread-safe. Those fields still need a correct publication and synchronization design.

## Applicability

- The shared state really has only two values, and its transition can be stated as a CAS precondition.
- Contention is normally bounded; a failed CAS may give up, report a conflict, or retry a limited number of times.
- The flag represents “run once,” “running,” “cancelled,” or a small lifecycle, rather than a long-held critical section.
- The `AtomicBoolean` object is a `final` field, not replaced, and callers can observe success or failure of the operation.

## Not applicable and risks

- A flag cannot keep balance, counters, and records consistent together; use a lock or a more suitable concurrent structure for multi-field invariants.
- Unbounded spinning under contention wastes CPU. CAS provides no fairness and does not put waiting threads to sleep.
- For waiting, notification, capacity coordination, or a complex state machine, evaluate `CountDownLatch`, `Semaphore`, `Condition`, queues, or locks first.
- `set(true)` is only a write. It does not replace `compareAndSet` when the old value must satisfy a precondition.
- “CAS is faster” is not a source fact. Throughput depends on contention, critical-section size, failure rate, hardware, and JDK; the API name alone proves nothing.

## Minimum verification

1. Run a `compareAndSet(false, true)` one-shot task from two concurrent threads; assert that the side effect occurs once.
2. Make `doWork()` throw, then call again. Correct `finally` cleanup should allow a second `false → true` transition.
3. Under contention, record CAS failures and CPU rather than measuring only an uncontended path; check for unbounded retries.
4. If the flag publishes data, test “write data, then `set(true)`” against “read data after `get()` is true.” Do not treat one atomic field as proof that every field is safe.

## Evidence and uncertainty

- **Source facts**: `legacy-java-atomic-boolean` records the visibility limit of volatile check-then-act, `compareAndSet`, `get/set`, cancellation/lifecycle examples, and the risks of multi-field invariants and contention.
- **Synthesis in this page**: The examples are reduced to a visibility/atomic-transition/critical-section selection model, with bounded contention and fail-fast behavior as CAS conditions.
- **Unconfirmed**: Exact CAS-versus-lock performance and VarHandle/Unsafe implementation details depend on JDK, hardware, and workload; this page does not present them as stable conclusions.

## Related pages

- [AutoCloseable: Resource Ownership and Close-Exception Semantics](/note/java-auto-closeable)
- [Java Production Performance Troubleshooting: A Minimal Symptom-to-Evidence Decision Tree](/note/java-online-performance-debug)
- [Java Backend Interview Retrospective: Project Truth, Engineering Mechanisms, and Production Evidence](/note/java-internship-interview-blog-polished)
