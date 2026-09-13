---
title: "Why Async Early Expiration Only Shortens TTL: Version CAS Makes Stale Jobs Harmless"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java Security, Concurrency, and Testing"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-business-patterns"]
tags: [ResiCache, Redis, EarlyExpiration, CAS, Concurrency]
description: "How ResiCache uses cache-value versions, Redis Lua CAS, and the normal miss path to prevent an old asynchronous job from modifying a newer cache value."
toc: true
---

> This article describes the early-expiration protocol in the current source. It does not call that protocol background data refresh, and it does not expand the tests into a performance or freshness SLA.

When a cache is close to expiry, a common goal is to keep a large number of requests from hitting a miss at the same time:

```text
cache is close to expiry
  -> deliberately create one miss
  -> let later requests trigger the normal load
  -> avoid sending every request back to the source at once
```

The difficulty is that early expiration is often completed by an asynchronous job, while the cached value may have changed before that job runs.

## How an old job can damage a new value

Assume that a job captured an old value while handling a request:

```text
T0: Redis = value-A, version=1
T1: a request decides to expire early, submits a job, and the job captures version=1
T2: business code writes value-B, version=2
T3: the old job starts
```

If the old job remembers only the key and executes:

`EXPIRE key 5`

it shortens the TTL of value-B. The new value did not participate in the early-expiration decision, but its lifetime was still changed by an old job.

This bug does not necessarily produce incorrect data immediately. It changes the cache lifetime of the new value and can cause an unnecessary source load.

## The current implementation is not a direct background refresh

ResiCache's EarlyExpirationHandler distinguishes two modes:

- SYNC: when the early-expiration condition is met, skip the actual cache node and let the normal load path handle the miss;
- ASYNC: submit a background job while the current request continues using the value it already read.

In ASYNC mode, the job does not call the business loader directly. It performs one smaller action:

> If the captured cached value is still the current value, shorten its TTL to a five-second grace period.

The actual miss later follows the normal loader, single-flight, and write-back path.

## Why the current request can still return the cached value

The early-expiration handler has already read Redis and placed the result in PrefetchDecision.

The final ActualCacheHandler prefers that prefetched value:

```java
CachedValue cachedValue = prefetchDecision != null
        && prefetchDecision.prefetchedValue() instanceof CachedValue cv
        ? cv
        : null;

if (cachedValue == null) {
    Object rawValue = valueOperations.get(context.getRedisKey());
    cachedValue = rawValue instanceof CachedValue cv ? cv : null;
}
```

Therefore, ASYNC means:

```text
current request: continue returning the current cached value
background job: try to shorten the current value's TTL
future request: enter the normal loader path after a miss
```

It also means that ASYNC allows the current request to return a value that is already close to expiry. It does not guarantee that the current request receives the newest data.

## The two versions are not the same

The implementation has two easily confused version numbers:

| Field | Identity |
|---|---|
| VersionEnvelope.version | serialization-format version, currently 2 |
| CachedValue.version | identity token for one cached value, used by CAS |

The format version answers:

`Which protocol should decode these Redis bytes?`

The cached-value version answers:

`Is the value captured by this asynchronous job still the same value currently in Redis?`

CachedValue.of uses the current process's System.nanoTime() to generate the value version. startNanoTime is not persisted and is used for monotonic time calculations inside the process. Neither should be interpreted as a global cross-process clock or an increasing sequence.

## Re-read the live value before running the job

The asynchronous job first reads Redis again:

```java
Object rawLiveValue = valueOperations.get(redisKey);

if (rawLiveValue == null) {
    return;
}

if (!(rawLiveValue instanceof CachedValue liveValue)) {
    return;
}

long remainingTtl = liveValue.getRemainingTtl();
if (remainingTtl > 0 && remainingTtl < REFRESH_GRACE_PERIOD_SECONDS) {
    return;
}

boolean shortened =
        atomicShortenTtlIfValueUnchanged(redisKey, capturedValue);
```

There are two layers of protection:

1. the job does not trust the state captured when it was submitted;
2. the TTL change still requires a value-version CAS inside Redis.

Reading the live value handles a deleted key or a value of an unexpected type. It cannot solve the race where the value is replaced immediately after the read, so the Redis-side atomic script is still needed.

## Lua CAS puts the check and change inside Redis

The key semantics of the source script can be shortened to:

```lua
local current = redis.call('get', KEYS[1])

local parsed = decode(current)
local payload = unwrap_payload(parsed)

if tostring(payload.version) == ARGV[1] then
    redis.call('expire', KEYS[1], ARGV[2])
    return 1
end

return 0
```

ARGV[1] is the captured CachedValue.version, not the version of the top-level envelope.

The script performs the following inside Redis:

```text
GET
  -> JSON decode
  -> unwrap envelope / wrapper array
  -> compare payload.version
  -> EXPIRE only on a match
```

Thus this sequence cannot damage the new value:

```text
old job captures version=1
new request writes version=2
old job runs Lua
version 1 != version 2
return 0, do not shorten the TTL
```

If JSON decoding fails, the script also returns 0. The current implementation treats “cannot prove that the value still matches” as “do not modify,” rather than writing optimistically.

See [EarlyExpirationHandler.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandler.java#L209-L260) and [EarlyExpirationScripts.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationScripts.java#L47-L66).

## Why not call the loader directly from the background job

Direct background refresh looks more proactive, but it introduces another loading protocol:

```text
background job
  -> call loader
  -> handle exceptions
  -> acquire the synchronization lock
  -> write the cache
  -> handle old/new value races
  -> handle cancellation and timeout
```

The current system already has a normal loading protocol with single-flight, distributed locking, double-checking, and write-back failure handling.

The implementation therefore chooses a smaller side effect:

```text
async job only shortens the TTL
  -> future requests naturally enter the normal miss path
  -> the existing loader protocol is reused
```

This is not “refresh faster.” It is avoiding a second loader semantics.

## The executor also has per-key protection

ThreadPoolEarlyExpirationExecutor uses:

```java
ConcurrentHashMap<String, CompletableFuture<Void>> inFlight;
```

If an unfinished job already exists for the same key, later submissions are skipped. When business code performs a PUT, ActualCacheHandler calls:

```java
earlyExpirationExecutor.cancel(context.getRedisKey());
```

This gives an explicit write a clearer priority over an old asynchronous early-expiration job.

Executor deduplication is not Redis-layer CAS. It only reduces duplicate jobs inside one JVM; it cannot replace value-identity checks across threads or instances.

## What the Redis race tests actually verify

The current tests cover:

- TTL shortening is allowed when the version has not changed;
- an old job does not recreate a deleted key;
- an old job does not shorten the TTL of a newly written value;
- after multiple submissions, the newest value remains unchanged.

This round used Testcontainers with a real Redis cluster to run 21 early-expiration nested tests and 5 Redis race tests; all passed.

See [EarlyExpirationHandlerRaceConditionIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandlerRaceConditionIntegrationTest.java#L125-L299).

## Cost and failure boundaries

This design solves “an old asynchronous job must not modify a new value,” not every refresh problem.

- ASYNC only shortens the TTL; it does not guarantee that a loader will run.
- It does not guarantee that fresh data will be available before a particular time.
- The current request may still return an old value close to expiry.
- The Lua script depends on the current JSON envelope, wrapper-array, and payload.version wire format.
- Redis must support the cjson capability used by the script; the script and serializer must evolve together.
- CachedValue.version is an equality token, not a globally increasing version or conflict-resolution algorithm.
- Background exceptions are logged and swallowed so they do not contaminate the outer request; logs and metrics must therefore reveal refresh failures.
- Shortening the TTL moves part of the cost to future requests, which may pay loader latency.

## A reusable decision method

For any delayed task, ask:

1. What state did the task capture when it was submitted?
2. Could the object have been replaced or deleted when the task actually runs?
3. Does the mutation carry an identity check for the object?
4. If the old task cannot prove that it is still valid, does it reject the mutation or keep writing?

If the task only needs to move the system toward a future state, prefer:

```text
old job only creates a controlled next action
  -> future requests enter the unified protocol
  -> identity is checked again at the actual write
```

