---
title: "ResiCache: Observer Nested Execution Must Distinguish Lifecycle, Fragments, and Scope Tokens"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java Security, Concurrency & Testing"
kind: concept
status: active
draft: true
sources: ["resicache-observer-nested-execution-contract"]
related: ["redis-jackson-java-time"]
tags: ["Java", "Observer", "ThreadLocal", "Concurrency", "Redis", "Cache", "Reentrant"]
description: "Distills from a public ResiCache fixed commit the boundaries of the observer lifecycle, lock-held fragments, per-call scope tokens, and ThreadLocal snapshot isolation, to avoid nested execution re-firing hooks or polluting concurrent state."
toc: true
---

**Conclusion first**: in a Java system with a cache chain, a synchronization lock, and single-flight, the full `execute`, the lock-held `executeChainFragment`, and the observer's per-call scope token are three different concepts. The around hook's state must be paired and restored with the token returned by the current call; a fragment only advances nodes and does not reopen the outer lifecycle; `ThreadLocal` is only suitable for isolating the current execution snapshot and should not become the observer state machine.

## Scope

This page is based on the public ResiCache `main` fixed commit `75ed279a71b17f227c3170d738eb93e50d876c8a`, and applies to:

- Adding an MDC, Timer, or tracing observer to the cache handler chain;
- Re-entering the same handler chain inside a distributed lock or single-flight load;
- Troubleshooting duplicate timing, MDC leakage, and future self-wait caused by nested execution;
- Designing an observer API that is safe for concurrent reuse.

## 1. Draw the three execution boundaries first

The public Engine's full execution order can be simplified as:

```text
execute(ctx)
  -> snapshot handlers
  -> observer.onChainStart(ctx)
  -> beforeNode(handler)
  -> handler.handle(ctx)
  -> afterNode(handler, result)
  -> decision: continue / skip / terminate
  -> post-process
  -> observer.onChainEnd(ctx, scopeTokens, result)
```

The lock-held fragment is:

```text
executeChainFragment(context, fromHandler)
  -> find from in the current snapshot
  -> advance only subsequent nodes
  -> run node-level before/handle/after
  -> do not re-run around start/end
  -> do not run post-process
```

These two entry points are not interchangeable. A fragment is an internal continuation of the outer execute, not an independent full chain call.

## 2. Around hooks pair by token, not by shared fields

The observer interface makes `onChainStart` return a `scopeToken`, then passes that same token to `onChainEnd`:

```java
Object token = observer.onChainStart(context);
try {
    // chain execution
} finally {
    observer.onChainEnd(context, token, result);
}
```

In a real implementation, the token should hold the state this call needs to restore, for example:

- the MDC's original request id;
- the Timer's start nanos;
- a tracing span or parent context;
- nested depth and restoration order.

Do not write these values into shared observer fields, and do not stuff them into the untyped string attributes of `CacheContext`. An observer is usually reused by multiple threads; field state would string together request A's teardown with request B's start.

## 3. Why a fragment must not re-trigger the around hook

While the synchronized-lock handler continues subsequent nodes inside the lock, the outer `execute` remains responsible for:

- the lifetime of the current snapshot;
- the start/end pairing of the around hook;
- the final post-process;
- the final result and exception boundary.

If a fragment calls the full `execute` again, common consequences are:

1. the MDC stamp is written again, and the inner end restores the wrong previous value;
2. Timer and tracing produce a spurious nested call;
3. post-process runs twice, and cache write-back or state transitions repeat;
4. the observer thinks two external requests happened, when in fact there was only one lock-held continuation.

Therefore, a fragment should expose only the minimal entry point of "continue after which handler", and explicitly take no responsibility for around/post-process.

## 4. `ThreadLocal` only holds an execution snapshot

The Engine uses `ThreadLocal<List<CacheHandler>>` to hold the current thread's handler snapshot so that a fragment sees the same immutable list as the outer execute. This usage solves structural isolation between concurrent calls:

```java
List<CacheHandler> snapshot = List.copyOf(handlers);
CURRENT_SNAPSHOT.set(snapshot);
try {
    // execute and possibly executeChainFragment
} finally {
    CURRENT_SNAPSHOT.remove();
}
```

Do not also put the observer's MDC previous value, Timer start, or scope token into the same ThreadLocal slot. The snapshot is execution structure; the token is per-call state; their lifetimes differ.

If arbitrary-depth nesting of the full execute is supported in the future, you need an explicit execution context or a stack-based ThreadLocal that restores the previous layer for each layer; a single overwriteable slot can only safely support the currently public fragment boundary.

## 5. Model leader/follower of single-flight separately

Single-flight for the same key answers "which thread executes the load":

- the first thread becomes `Leader`;
- nested calls for the same key on the same thread take the `Reentrant` fast path;
- other threads become `Follower` and wait on the leader's future;
- the leader cleans up state in a finally block and completes the future.

The observer answers "which lifecycle events this chain execution went through". The two cannot replace each other:

- single-flight must not decide the start and end of the observer token;
- the observer must not hold the leader/follower shared lock state;
- the reentrant fast path must not wait on the future it created itself, or it will deadlock.

## Minimal test matrix

| Scenario               | Should verify                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Normal full chain      | `onChainStart -> beforeNode -> afterNode -> onChainEnd`, with identical start/end tokens                        |
| Lock-held fragment     | only subsequent-node hooks; no second around hook; no second post-process                                       |
| Handler throws         | the exception keeps propagating; finally triggers `onChainEnd`; the failed handler does not trigger `afterNode` |
| Two-thread concurrency | tokens, MDC previous state, and snapshots do not pollute each other                                             |
| Same-key nesting       | the reentrant path does not wait on its own future and does not re-acquire execution rights                     |

These are the minimal regression contract; production systems should also add cancellation, timeout, lock-invalidation, and result-visibility tests.

## Common mistakes

- **Storing start time or the MDC previous value in a shared field**: concurrent calls overwrite each other.
- **A fragment calling the full execute**: duplicate around hooks and post-process.
- **Treating ThreadLocal as a universal context**: nested layers overwrite, and the exception path is hard to restore.
- **Fusing single-flight and observer into one layer**: coordination state and observation state pollute each other.
- **The observer by default receiving the primary failure result**: the public fixed implementation passes a success-result placeholder to `onChainEnd`; if you need failure results, you must first add an explicit contract and tests.

## Evidence boundary

This page only promises behavior in the public fixed commit and does not treat unpublished local modifications as evidence. Source facts and the fixed commit: see the [public ResiCache fixed commit](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a); the redacted raw snapshot is at `src/content/raw/zh-cn/resicache-observer-nested-execution-contract.md` in the repository.
