---
{
  "archiveId": "X-1325",
  "translationKey": "legacy/note/java-reference-types",
  "title": "Java Reference Types and Lifecycle State Machine: Strong, Soft, Weak, Phantom, and Cleaner",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Distills JDK 8/17 reference notes covering the four-state Reference lifecycle, VarHandle adoption since JDK 9, reclamation semantics across all four reference strengths, why SoftReference caches act as jitter anti-patterns, and why off-heap cleanup should favor Cleaner.",
  "findings": [
    "Raw source: src/content/raw/zh-cn/ingest-java-concurrency.md",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Java",
    "GC",
    "Reference",
    "WeakReference",
    "Cleaner",
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

Java separates object reachability from off-heap cleanup through an asynchronous event-notification model: simply setting strong references to `null` cannot express weakly keyed metadata, post-mortem cleanup notifications, or cache eviction boundaries, whereas misusing `SoftReference` for latency-sensitive caches triggers unpredictable Full GC stalls.

This page extracts the JDK 8 and JDK 17 `JavaReferenceTypes` material split out from [Java Concurrency Deep Dive: JUC, CAS, Atomics, Locks, and Threading](/blog/legacy/note/en/java-concurrency-deepdive/).

## Core Mechanisms

### 1. Four-state lifecycle of `java.lang.ref.Reference`

Non-strong references coordinate with GC and a JVM daemon thread across four states:

1. **`Active`**: initial state where `get()` returns the `referent`.
2. **`Pending`**: once GC reachability analysis determines the referent no longer meets the reference's strength threshold, GC atomically appends it to the internal `discovered` list.
3. **`Enqueued`**: the JVM `Reference-Handler` daemon clears `referent` to `null` and places the `Reference` into its associated `ReferenceQueue`.
4. **`Inactive`**: final state reached once the application polls it from `ReferenceQueue` (or after collection when no queue is attached).

Since JDK 9, `Reference` accesses `referent` via `VarHandle REFERENT` (`getAcquire` / `setRelease`) to coordinate safely with concurrent collectors such as `G1GC` and `ZGC`.

```java
// Core Reference<T> read/clear semantics (JDK 9+ VarHandle pattern)
public T get() {
    return (T) REFERENT.getAcquire(this);
}

public void clear() {
    REFERENT.setRelease(this, null);
}
```

### 2. Comparing the four reference strengths and architectural tradeoffs

| Reference type | Collection rule | `ReferenceQueue` / typical use | Risks & alternatives |
| --- | --- | --- | --- |
| **Strong** | Never collected while reachable from GC roots | Default references; `OutOfMemoryError` if heap exhausts | Unbounded collection retention |
| **Soft (`SoftReference`)** | Collected when only softly reachable under memory pressure | Legacy memory-sensitive caches | Unpredictable collection timing causes jitter; prefer Caffeine deterministic eviction |
| **Weak (`WeakReference`)** | Collected on next GC cycle regardless of free heap | `WeakHashMap` keys, `ThreadLocalMap.Entry` keys | Stale value cleanup depends on subsequent map access |
| **Phantom (`PhantomReference`)** | `get()` returns `null`; tracks collection via queue | Post-reclamation cleanup; prefer `Cleaner` since Java 9 | Avoid deprecated `finalize()` |

### 3. `Cleaner` API replacing `finalize()`

For off-heap resources (JNI allocations, `DirectByteBuffer`, native file handles), Java 9+ recommends `java.lang.ref.Cleaner`, forcing the cleanup action (`Runnable` state object that must not capture a strong reference to the target object) to decouple from the target and pairing explicit `close()` with GC fallback cleanup.

## Applicability and Unverified Boundaries

- **Applicable**: weakly keyed metadata maps (`WeakHashMap`) and `Cleaner`-backed safety nets for native resources.
- **Not applicable**: relying on `SoftReference` as the primary eviction policy in low-latency caches.
- **Unverified boundaries preserved from raw sources**:
  - queue-enqueuing timing and pause impact vary across `G1GC` vs. `ZGC` and JDK versions;
  - source examples show expected output without **side-by-side latency measurements across pinned GCs and JDK builds**.

## Graduation Checks

1. Run `WeakHashMap` and `Cleaner` tests under pinned `-XX:+UseG1GC` vs. `-XX:+UseZGC` builds and log actual `ReferenceQueue` enqueuing latency.
2. Audit `Cleaner` action classes to verify no lambda/inner-class capture holds a strong reference to the cleaned target.
3. Audit any `SoftReference` cache usage and replace or document deterministic capacity bounds.

## Related Pages

- [Java Concurrency Deep Dive: JUC, CAS, Atomics, Locks, and Threading](/blog/legacy/note/en/java-concurrency-deepdive/)
- [AutoCloseable: Resource Ownership and Close-Exception Semantics](/blog/legacy/note/en/java-auto-closeable/)
- [ingest-java-concurrency (raw source)](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md)
