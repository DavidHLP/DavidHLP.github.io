---
{
  "archiveId": "X-1319",
  "translationKey": "legacy/note/java-cas-and-aba",
  "title": "Java CAS, ABA Problem, and LongAdder: Lock-Free Primitives and Contention Boundaries",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Distills JUC atomic source notes on CAS (cmpxchg / Unsafe) three-operand semantics, the ABA problem and AtomicStampedReference version stamps, plus AtomicLong hotspot spinning vs. LongAdder striped Cells with false-sharing isolation.",
  "findings": [
    "Raw source: src/content/raw/zh-cn/ingest-java-concurrency.md",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Java",
    "JUC",
    "CAS",
    "Atomic",
    "LongAdder",
    "ABA",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
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

Compare-And-Swap (CAS) replaces pessimistic blocking locks with optimistic non-blocking updates: contention is treated as uncommon, and a losing thread receives a failure signal rather than blocking immediately so the caller can retry or spin. Under real business invariants and heavy write contention, however, lock-free does not automatically mean safe or faster.

This page expands the `CASDeepDive.md`, `JavaAtomicClasses.md`, and `LongAdderVSAtomicLong.md` material split out from [Java Concurrency Deep Dive: JUC, CAS, Atomics, Locks, and Threading](/blog/legacy/note/en/java-concurrency-deepdive/); for the binary two-state `AtomicBoolean` pattern, see `java-atomic-boolean`.

## Core Mechanisms

### 1. CAS primitive and `Unsafe` foundations

CAS operates atomically across three operands: **memory address `V`, expected value `A`, and new value `B`**. `V` is updated to `B` only when its current value equals `A`, backed directly by CPU atomic instructions such as x86 `cmpxchg`.

```java
// V: memory value, A: expected value, B: new value
public boolean compareAndSwap(V, A, B) {
    if (V == A) {
        V = B;
        return true;
    } else {
        return false;
    }
}
```

JUC atomic classes (`AtomicInteger`, `AtomicLong`, `AtomicBoolean`) wrap a `volatile` field and expose these core primitives:

- `get()` / `set(newValue)`: provide `volatile` read and write semantics respectively.
- `lazySet(newValue)`: delayed store with lower barrier cost that does not guarantee immediate visibility to subsequent reads, useful for counter resets or metrics.
- `compareAndSet(expect, update)` / `weakCompareAndSet(expect, update)`: weak CAS may fail spuriously on some architectures even when the value matches, so it must stay inside a retry loop.

### 2. The ABA problem and `AtomicStampedReference`

Checking only whether `V == A` cannot detect intervening transitions such as `A -> B -> A`. In lock-free structures like stacks, the top pointer returning to `A` does not guarantee its internal links are unchanged, allowing a naive CAS to corrupt structure invariants.

`AtomicStampedReference` pairs the reference with an integer stamp `(reference, stamp)` so each CAS verifies both value equality and version identity:

```java
// Succeeds only when reference == expectedReference and stamp == expectedStamp
stampedRef.compareAndSet(expectedReference, newReference, stamp, stamp + 1);
```

When another thread executes an `A -> B -> A` round trip and advances the stamp, a stale thread holding the old stamp observes `compareAndSet` returning `false`.

### 3. High-contention counters: `AtomicLong` vs. `LongAdder`

| Dimension | `AtomicLong` | `LongAdder` (extends `Striped64`) |
| --- | --- | --- |
| Internal state | Single shared `volatile long value` | `base` + striped `volatile Cell[] cells` |
| Uncontended / low contention | Direct CAS against `value` | Fast-path CAS against `base` |
| High contention | Hotspot contention as threads spin on one cache line | Routes threads to distinct `Cell` slots via `ThreadLocalRandom` probe |
| False-sharing defense | Writes invalidate shared line | `Cell` uses `@sun.misc.Contended` to pad cache lines |
| Read/write tradeoff | `get()` reads a single exact value | `add()` spreads writes; `sum()` returns a non-atomic snapshot sum |

Use `AtomicLong` when contention is modest or strict point-in-time reads are needed; use `LongAdder` when many threads increment concurrently and `sum()` snapshot semantics suffice.

## Applicability and Unverified Boundaries

- **Applicable**: single-variable transitions, flags, counters, and tiny critical sections able to absorb retries.
- **Not applicable**: multi-variable invariants requiring mutual exclusion, condition waiting, or heavy hotspot spinning without striping.
- **Unverified boundaries preserved from raw sources**:
  - reflection access to `sun.misc.Unsafe` (`theUnsafe`) is restricted by module encapsulation on JDK 17+, and the source snapshot does not cover migrating custom callers to `VarHandle`;
  - the sources contrast `AtomicLong` and `LongAdder` conceptually without **pinned JDK/hardware JMH benchmarks, so no fixed speedup multiplier can be claimed**.

## Graduation Checks

1. Rerun the ABA stamp-rejection case on a pinned JDK 17/21 build without `--illegal-access` overrides (using `AtomicStampedReference` / `VarHandle`) and capture pass/fail logs.
2. Run JMH throughput benchmarks comparing `AtomicLong` and `LongAdder` across 1/4/16/64 threads on target hardware to establish real contention crossover points.
3. Verify whether `lazySet` visibility lag stays within acceptable sampling intervals for monitoring counters.

## Related Pages

- [Java Concurrency Deep Dive: JUC, CAS, Atomics, Locks, and Threading](/blog/legacy/note/en/java-concurrency-deepdive/)
- [AtomicBoolean: Atomic Boolean State and CAS Boundaries](/blog/legacy/note/en/java-atomic-boolean/)
- [ingest-java-concurrency (raw source)](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md)
