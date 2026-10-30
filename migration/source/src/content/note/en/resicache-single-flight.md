---
title: "Why Cache Stampedes Need a Future, a Distributed Lock, and a Double-Check"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java Security, Concurrency, and Testing"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-business-patterns"]
tags: [ResiCache, Redis, SingleFlight, Concurrency, DistributedLock]
description: "What single-flight, distributed locking, double-checking, and failure-result modeling each solve in ResiCache's load path—and what they cannot guarantee."
toc: true
---

> This is not a retrospective of a historical incident. The repository does not provide a record of a particular production outage; the concurrent-miss scenario below is the smallest engineering problem reconstructed from the current source.

A direct cache-miss path usually looks like:

```text
read cache
  -> no value
  -> call loader
  -> write back to cache
  -> return result
```

If 100 requests for the same key enter this path at once, they may produce 100 database queries or remote calls. The real cache-stampede question is not “where should we add a lock?” but:

> Which request owns this load right now, and how do the other requests receive the same result?

## Why synchronized alone is not enough

An in-process lock serializes requests within one JVM, but it cannot constrain other instances.

Assume the service has three instances:

```text
instance A: request 1 ──┐
instance A: request 2 ──┤
instance B: request 3 ──┼── all observe a cache miss
instance C: request 4 ──┘
```

A JVM lock can merge only the requests inside instance A. B and C can still load from the source at the same time.

A distributed lock expands the mutual-exclusion scope, but it does not answer another question: how do waiters reuse the result that has already completed?

A naive implementation is:

```text
request 1 obtains the distributed lock, runs the loader, and releases the lock
request 2 waits for the lock, then double-checks the cache
request 3 waits for the lock, then double-checks the cache
```

This prevents duplicate loads, but every waiter still participates in lock contention and the system must correctly implement waiting, exception propagation, timeouts, and reentrancy.

Distributed locking and an in-process Future therefore solve different problems:

| Mechanism | Problem it solves |
|---|---|
| CompletableFuture | requests in one process share the leader's result or exception |
| distributed lock | only one request across instances enters the load critical section |
| double-check | before loading, confirm that another request did not write during the wait |

## ResiCache's actual call path

RedisProCache.get(key, loader) does not implement the whole flow itself; it delegates to LoaderOrchestrator.

The core branch can be summarized as:

```java
if (isBloomShortCircuited(...)) {
    return new BloomShortCircuited<>();
}

if (operation != null && operation.isSync() && syncSupport != null) {
    return executeSyncLoad(...);
}

try {
    T value = defaultLoadFn.load(key, loader);
    return new Loaded<>(value);
} catch (Throwable cause) {
    return new LoadFailed<>(cause);
}
```

Two details matter.

First, sync=true is not the default for every cache request. It is selected by method-level operation metadata.

Second, the load result is not just T or an exception. The current implementation distinguishes:

- BloomShortCircuited: it is known that the source must not be loaded;
- Loaded: loading and write-back both succeeded;
- LoadedWithWriteBackFailure: the business value loaded successfully, but cache write-back failed;
- LoadFailed: the loader itself failed.

See [LoaderOrchestrator.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestrator.java#L74-L105).

## Leader, follower, and reentrant

SyncSupport uses two in-process structures:

```java
ConcurrentMap<String, CompletableFuture<Object>> inFlight;
ThreadLocal<Set<String>> reentrantKeys;
```

The key election semantics are:

```java
if (reentrantKeys.get().contains(key)) {
    return new SyncRole.Reentrant<>(loader);
}

CompletableFuture<Object> mine = new CompletableFuture<>();
CompletableFuture<Object> existing = inFlight.putIfAbsent(key, mine);

if (existing == null) {
    return new SyncRole.Leader<>(...);
}

return new SyncRole.Follower<>(...);
```

The same key therefore enters one of three roles.

### Leader

The first request to publish a Future in inFlight becomes the leader. It:

1. obtains the distributed lock;
2. performs the double-check;
3. calls the loader;
4. writes back to the cache;
5. completes the Future with a result or exception;
6. clears inFlight and thread-local state.

When the leader finishes, it uses:

```java
inFlight.remove(key, mine);
```

rather than an unconditional remove(key). This prevents an old leader from deleting a newer Future that was published later.

### Follower

Later requests do not call the loader again; they wait for the leader's Future:

```text
leader succeeds -> every follower receives the same value
leader fails    -> every follower receives the same exception
wait times out  -> the current follower fails
```

Waiting is bounded. A timeout does not cancel the leader and does not mean the loader rolled back; it only means that this waiter stops waiting.

### Reentrant

A Future is not reentrant. If the leader's loader synchronously requests the same key on the same thread, waiting for its own Future would deadlock.

While the current thread owns the leader role for a key, a nested request for that key therefore enters a reentrant fast path and executes the nested loader directly.

This is not a second leader election. It explicitly bypasses the path that would wait for itself.

## Why the double-check must be inside the lock

After acquiring the lock, the leader does not immediately call the loader; it checks the cache first:

```java
Cache.ValueWrapper existingValue = doubleCheckFn.apply(key);
if (existingValue != null) {
    return (T) existingValue.get();
}
```

A typical sequence is:

```text
request A                request B

observes cache miss
obtains distributed lock
                         waits for distributed lock
A runs loader
A writes cache
releases lock
                         obtains distributed lock
                         double-check hits
                         does not run loader again
```

Without the in-lock double-check, B could run the loader again even after waiting for A to finish.

The check also covers another instance having written the cache. In a multi-instance system, an in-process Future merges only local requests; it cannot replace a second check of the shared cache.

## Why distinguish “loaded successfully but write-back failed”

Cache write-back failure and loader failure are not the same result for a caller.

For example:

```text
database query succeeds
Redis write fails
```

The business value has already been obtained. Treating the Redis failure as total request failure would widen “the cache is unavailable” into “the business data is unavailable.”

ResiCache keeps both pieces in LoadedWithWriteBackFailure:

```text
business value: return it
write-back exception: record diagnostic information
```

This is an availability-first trade-off. It does not claim that the cache recovered or that the next request will not load from the source again; it only prevents a cache failure from discarding a business result already obtained successfully.

If the loader itself fails, the result is LoadFailed and the upper layer handles it according to the Spring Cache exception contract.

## Why fail fast by default without a distributed-lock backend

SyncSupport can start without a distributed-lock backend because an application may never use sync=true.

When a synchronized load actually runs, however, it does not silently degrade to single-JVM synchronization:

```text
no LockManager
  + local-only=false
  -> the first sync=true miss fails immediately
```

Only explicit configuration permits a single-JVM single-flight:

```yaml
resi-cache:
  sync-lock:
    local-only: true
```

This boundary matters. Silent degradation looks more available, but in a multi-instance deployment it gives callers the false impression that synchronization is protected across instances when it is only local.

## What the tests actually verify

Current tests cover:

- ten concurrent requests call the loader only once;
- a leader exception propagates to all followers;
- same-key nested calls do not deadlock;
- follower timeout;
- double-checking;
- a write-back failure still returns the business value.

This round ran the relevant tests on JDK 21:

```bash
mise exec java@temurin-21.0.12+101.0.LTS -- \
  ./mvnw -Punit \
  -Dtest=SecureJacksonRedisSerializerTest,SecureJacksonSerializerFactoryTest,LoaderOrchestratorTest,SyncSupportSingleFlightTest \
  test
```

The focused unit suite contained 39 tests and all passed. This proves protocol behavior in the selected test scenarios, not cross-datacenter, process-crash, or production-failover behavior.

## Cost and failure boundaries

This design is not suitable for every cache scenario.

- inFlight exists only in the current JVM; cross-instance exclusion depends on a real distributed-lock backend;
- a follower may time out while the leader continues running; the system has not thereby acquired global exactly-once semantics;
- process crashes, expired lock leases, and retries of external side effects must be handled by the lock implementation and business loader;
- after a write-back failure the business value is still returned, but the cache may remain a miss and later requests may load again;
- when the loader is fast and the service has one instance, Spring Cache's default loading path may be enough.

## A reusable decision method

For a concurrent miss, answer:

1. Is the need mutual exclusion, or sharing one load result?
2. Is the sharing scope a thread, a JVM, or every instance?
3. Do waiters need a timeout?
4. Should a leader exception propagate to waiters?
5. If loading succeeds but cache write-back fails, may the business value still return?
6. Does the loader contain an external side effect that cannot be repeated?
7. Could a same-thread nested call wait for its own Future?

If these questions have no answers, adding one distributed lock is usually not enough.

