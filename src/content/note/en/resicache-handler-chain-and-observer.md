---
title: "ResiCache's Cache Responsibility Chain: Control Flow, Nested Fragments, and Observer Lifecycles"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java Security, Concurrency, and Testing"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-observer-nested-execution-contract", "resicache-project-overview"]
related: ["resicache", "resicache-observer-nested-execution"]
tags: [ResiCache, Java, ChainOfResponsibility, Observer, ThreadLocal, Concurrency]
description: "How ResiCache's current line uses HandlerResult, handler snapshots, in-lock fragments, and observer scope tokens to preserve control-flow and lifecycle boundaries in a cache responsibility chain."
toc: true
---

> This article is based on the current ResiCache source at main@2954fff217257e9cf7c906450a75070d5e092637. It is not a retrospective of a historical incident, and it does not treat the chain abstraction itself as a design virtue; the focus is how current code separates control flow, nested execution, and observation state.

Cache protection is usually not one handler but several ordered steps: a Bloom filter, a synchronization lock, early expiration, TTL, null-value handling, and actual Redis reads and writes. The question quickly changes from “how should each handler be written?” to:

> When one node decides to skip the remaining work, how do the other nodes know? When execution continues inside a lock, why must the whole chain not run again? How does an observer know that start and end belong to the same call?

## Why directly chaining handlers quickly becomes unmanageable

The most direct implementation lets each handler call the next:

```text
handler A
  -> handler B
      -> handler C
```

This works while there are few nodes, but control flow gradually hides inside local code:

- If a handler returns a value, does that terminate or continue?
- How is skipping the remaining nodes different from normal completion?
- Is the original order still correct after a new handler is added?
- Does continuing inside a lock trigger the whole chain's around hook again?
- Who restores the starting state of a timer, MDC, or tracing context?

If these semantics are expressed by result != null, shared fields, or implicit exceptions, the code may run but becomes difficult to review and test.

The current ResiCache implementation separates the problem into four protocols: a handler-result protocol, a fixed execution order, an immutable chain snapshot, and a per-call token for observers.

## HandlerResult separates result from control flow

HandlerResult is a record with two fields:

```java
public record HandlerResult(FlowControl decision, CacheResult result) {
    public static HandlerResult continueChain() { ... }
    public static HandlerResult terminate(CacheResult result) { ... }
    public static HandlerResult skipAll() { ... }
}
```

There are three main decisions:

| Decision | Meaning |
|---|---|
| CONTINUE | the current node finished; execute the next node |
| SKIP_ALL | materialize the current result and skip the remaining nodes |
| TERMINATE | materialize the current result and end the chain |

Keeping decision and result separate avoids inferring “continue?” from whether a result exists. CONTINUE may have no intermediate result, while SKIP_ALL may carry one.

The ChainEngine loop advances only by decision:

```text
CONTINUE  -> next node
SKIP_ALL  -> mark context and return the current result
TERMINATE -> return the current result
```

The implementation also rejects a null handler result and identifies the violating handler instead of exposing the error later as a NullPointerException. This is input validation at the SPI boundary, not extra business functionality.

Source: [HandlerResult.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/HandlerResult.java#L14-L49) and [ChainEngine.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/ChainEngine.java#L214-L257).

## Order is a protocol, not an implementation detail

The current handler order is:

```text
BLOOM_FILTER(100)
  -> SYNC_LOCK(200)
  -> EARLY_EXPIRATION(250)
  -> TTL(300)
  -> NULL_VALUE(400)
  -> ACTUAL_CACHE(500)
```

The order determines control flow:

- a definitely missing key can short-circuit before a source load;
- the synchronization lock can establish a critical section before the actual cache read;
- early expiration can decide whether the current request takes the miss path or keeps using its cached value;
- ActualCacheHandler performs real reads and writes last.

CacheHandlerChainFactory sorts by HandlerPriority and then filters disabled handlers. Bloom, SyncLock, EarlyExpiration, and NullValue share the protection toggle; TTL is deliberately excluded because disabling TTL would remove the expiration boundary from actual cache writes.

This makes a new protection mechanism reviewable: its place in the existing order, termination semantics, and toggle semantics must all be explicit.

The cost is implicit coupling through order. Changing one priority can change the input seen by every later node, so HandlerOrder is not an ordinary constant to clean up.

## A snapshot solves concurrent rebuilding, not business state

The factory caches chain instances, sorts handlers during construction, and forms a chain. ChainEngine.execute receives the current snapshot and places it in the current thread's ThreadLocal:

```java
CURRENT_SNAPSHOT.set(snapshot);
try {
    return new ChainLifecycle(observers, snapshot, context).run();
} finally {
    CURRENT_SNAPSHOT.remove();
}
```

The snapshot used by one execution is an immutable list. If the factory later rebuilds or replaces the chain, an already-started call keeps its own snapshot and does not see a handler-list change halfway through.

This ThreadLocal stores only which handler structure the current call uses. It should not become a general state bag containing an MDC previous value, timer start, or observer token. A structural snapshot and call state have different lifecycles.

## Why a fragment is used to continue inside the lock

The synchronization-lock handler does not re-run a complete cache chain. After acquiring the lock, it advances through the nodes after itself:

```java
CacheResult result = syncSupport.executeSync(
        lockKey,
        () -> engine.executeChainFragment(context, this),
        timeout);

return HandlerResult.terminate(result);
```

executeChainFragment finds from in the current snapshot and executes only the later handlers.

The boundary between a complete execution and a fragment is:

```text
complete execute
  -> chain around start
  -> node before/handle/after
  -> post-process
  -> chain around end

in-lock fragment
  -> before/handle/after for nodes after from
  -> does not re-run chain around start/end
  -> does not run post-process
```

If the lock path called complete execute again, it would create a second around lifecycle and a second post-process. For MDC, timer, fired-counter, or tracing observers, this is not merely duplicate logging; it records one external call as two chain calls.

A fragment is therefore not another chain. It is an internal continuation while the outer call is still active.

## Observers pair each call with a scope token

ChainObserver.onChainStart can return a token, and the Engine passes the same reference to the matching onChainEnd:

```java
Object token = observer.onChainStart(context);
try {
    // execute chain
} finally {
    observer.onChainEnd(context, token, result);
}
```

The Engine keeps a separate slot for each observer, so observer A's token is never passed to observer B. A token can preserve:

- the original MDC value;
- a timer start time;
- a tracing span or parent context;
- other recovery state belonging only to this call.

Node-level hooks follow the same rule: onNodeStart returns a token and onNodeEnd receives it in finally. If a handler throws, afterNode is not called, but onNodeEnd still runs with a null result. Its job is to release state, not to fabricate a successful decision.

Exceptions from observer hooks are recorded and isolated; they must not replace the business handler's result. This sacrifices some observation completeness so that an observation component cannot contaminate the cache's main path.

One current boundary must remain visible: ChainLifecycle passes CacheResult.success() to onChainEnd rather than the real main-chain result. Existing observers do not read that parameter, so current tests remain valid. If a future observer must distinguish hit, miss, and failure, this contract cannot simply be reused; the interface and tests must change first.

## What the tests actually verify

Current tests cover:

- CONTINUE advances multiple handlers in order;
- TERMINATE does not call later nodes;
- SKIP_ALL marks the context and skips later nodes;
- onChainStart and onChainEnd are paired;
- scope tokens are isolated per observer and returned unchanged;
- onNodeEnd still runs when a handler throws;
- a null HandlerResult is explicitly rejected;
- executeChainFragment does not trigger the complete chain observer again;
- the MDC observer restores the caller's original value;
- the timer observer does not use a dynamic Redis key as a high-cardinality label.

These tests prove control-flow and lifecycle contracts, not the complete behavior of observers in a real production thread pool, tracing SDK, or long-running process.

## Cost and failure boundaries

This design does not make a responsibility chain naturally extensible.

- handler order defines upstream/downstream semantics; adding a node requires checking its neighbors;
- ThreadLocal is suitable for a synchronous fragment on the current thread and does not automatically propagate to an asynchronous thread;
- a fragment omits post-process, so a new handler must be checked for post-process dependencies;
- isolated observer-hook failures can cause missing telemetry, which must be found through logs and metrics;
- a token pairs only the current call and cannot solve cross-thread or cross-process lifecycles;
- the current chain-end observer cannot see the real main result; richer result observation requires a new interface;
- with only two or three fixed steps, explicit method calls may be easier to maintain than a chain.

## A reusable decision method

When designing a composable processing chain, decide first:

1. Is control flow expressed by explicit state rather than by whether a result is empty?
2. Is node order a stable, testable protocol?
3. Does one execution use an immutable snapshot?
4. Is nested execution a new external call or a fragment of the current call?
5. Does every around hook have a per-call token that is released in finally?
6. Should an observation failure block the main path or be isolated?
7. Does post-process belong to the complete execution or to a particular fragment?

If these questions have no answers, adding more handlers only spreads implicit coupling across more files.

Related deep dive: [ResiCache: nested observer execution must distinguish lifecycle, fragments, and scope tokens](/note/resicache-observer-nested-execution).

