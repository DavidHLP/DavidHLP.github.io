---
{
  "archiveId": "X-1065",
  "title": "ResiCache: Verifiable Concurrency and Consistency Boundaries for Cache Protection",
  "en": "ENGINEERING NOTES",
  "category": "项目实践",
  "department": "工程笔记",
  "date": "2026-09-08",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Examines five designs in pinned source and boundary tests: responsibility chains, single-flight, versioned early expiration, whitelist serialization, and observer lifecycles, while separating repository evidence from production performance claims.",
  "findings": [
    "Original document: src/content/note/en/resicache.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/resicache.md",
  "pubDate": "2026-09-08T16:00:00.000Z",
  "tags": [
    "ResiCache",
    "SpringCache",
    "Redis",
    "Concurrency",
    "SingleFlight",
    "Serialization",
    "CAS",
    "EarlyExpiration",
    "LLM",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/resicache.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "ResiCache: An Orchestratable Responsibility Chain for Spring Cache Protection",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Java Security, Concurrency & Testing",
      "kind": "entity",
      "status": "active",
      "sources": [
        "resicache-project-overview",
        "resicache-observer-nested-execution-contract"
      ],
      "related": [
        "resicache-observer-nested-execution",
        "java-null-value",
        "redis-business-patterns",
        "redis-jackson-java-time"
      ],
      "tags": [
        "ResiCache",
        "SpringCache",
        "Redis",
        "BloomFilter",
        "DistributedLock",
        "ResponsibilityChain"
      ],
      "description": "Uses the fixed commit README as evidence to summarize ResiCache's positioning, handler order, protection defaults, and serializer-envelope migration cost, distinguishing declared from unverified capabilities.",
      "toc": true
    }
  },
  "kind": "entity",
  "status": "provisional",
  "sources": [
    "resicache-engineering-highlights-2954fff",
    "resicache-project-overview",
    "resicache-observer-nested-execution-contract"
  ],
  "related": [
    "resicache-observer-nested-execution",
    "java-null-value",
    "redis-business-patterns",
    "redis-jackson-java-time"
  ]
}
---

> **Evidence status**: This article primarily uses the source and tests at `main@2954fff217257e9cf7c906450a75070d5e092637`, supplemented by a pinned README snapshot. “Implemented” means the source contains the structure; “repository test evidence” means the commit contains corresponding tests. Neither means they were rerun for this article or validated in production.
>
> **Scope**: ResiCache's current build line uses Java 21, Spring Boot 4.0.0, Spring Data Redis 4.0, and optional Redisson 3.50.0. The repository remains pre-1.0. This article makes no throughput, P99, HA, zero-loss, or comprehensive security-audit claims from its design.

A cache miss appears to mean “read nothing, load from the source, then write back.” In a real system, the same miss can encounter nonexistent keys, concurrent loads, a TTL avalanche, stale asynchronous tasks, and untrusted types. Implementing each policy in a separate aspect usually produces an implicit control flow that nobody can explain.

ResiCache is interesting because it puts these concerns into one readable chain:

```text
BloomFilter
  -> SyncLock
  -> EarlyExpiration
  -> TTL
  -> NullValue
  -> ActualCache
```

Each node has its own short-circuit, continuation, and failure semantics. Concurrent loading, asynchronous early expiration, serialization, and observers have smaller contracts of their own. The design makes the boundaries most likely to cause cache incidents explicit, beyond listing supported protections.

## Start with the public entry point

Callers declare the protections they want through `@RedisCacheable`:

```java
@RedisCacheable(
        cacheNames = "profile",
        key = "#userId",
        sync = true,
        useBloomFilter = true,
        cacheNullValues = true,
        randomTtl = true,
        enableEarlyExpiration = true,
        earlyExpirationMode = EarlyExpirationMode.ASYNC)
public Profile loadProfile(long userId) {
    return profileRepository.find(userId);
}
```

The switches for `sync`, Bloom, null caching, randomized TTL, and early expiration are off by default. The call site explicitly declares the additional costs and semantics that this cache operation accepts.

The entry point reuses Spring's AOP infrastructure. `RedisCacheInterceptor` extends Spring's `CacheInterceptor`, activates method metadata and executes the enhanced chain before continuing through Spring Cache's invocation. `RedisProCache` connects `LoaderOrchestrator` at the cache-loading point. Protections stay concentrated in extension points instead of being scattered around business methods.

## 1. The responsibility chain makes protection composition verifiable

### Order is part of the contract

`HandlerOrder` gives each handler a stable priority. The core order is:

```text
BLOOM_FILTER(100)
  -> SYNC_LOCK(200)
  -> EARLY_EXPIRATION(250)
  -> TTL(300)
  -> NULL_VALUE(400)
  -> ACTUAL_CACHE(500)
```

This order determines control flow: Bloom can reject a definitely nonexistent key before source loading; SyncLock coalesces concurrent loads; EarlyExpiration decides whether to enter the miss path or asynchronous TTL processing; TTL, NullValue, and ActualCache handle subsequent writes.

`ChainEngine` expresses node results as `CONTINUE`, `SKIP_ALL`, and `TERMINATE`, instead of making handlers infer each other's intentions from implicit exceptions or shared flags. A new protection must specify its place in the chain and whether write-back remains allowed after it short-circuits.

### The factory provides stability; switches provide selectivity

`CacheHandlerChainFactory` lazily initializes, double-checks, and caches chains, then sorts them by priority and filters disabled handlers. BloomFilter, SyncLock, EarlyExpiration, and NullValue belong to the unified protection-toggle list. TTL is deliberately excluded: disabling TTL could make cache entries live forever.

Turning off the global protection switch disables those four protections while retaining TTL and ActualCache. A per-mechanism switch filters only its handler. Disabling protection does not disable caching itself.

The chain turns feature composition into named, ordered, individually disableable, testable policies. Review can focus on the chain contract as well as each handler's local implementation.

## 2. Single-flight defines who owns a load

### The actual problem with concurrent misses

When a hot key expires, ten requests can enter the loader almost together. Independent loading sends ten identical queries to the database or remote service. A coarse lock instead risks unnecessary serialization and reentrant deadlock.

ResiCache splits `get(key, loader)` into these steps:

```text
Bloom short-circuit
  -> sync=true ? SyncSupport : Spring default load path
      -> double-check
      -> loader
      -> write-back
```

`SyncSupport` uses:

```java
ConcurrentMap<String, CompletableFuture<Object>> inFlight;
ThreadLocal<Set<String>> reentrantKeys;
```

Within one JVM, the first request to succeed at `putIfAbsent` becomes the leader: it loads the value and completes the future. Followers wait for and reuse the same future. The leader double-checks inside the lock in case another request wrote the value while it waited. A same-thread request for the same key takes a reentrant fast path rather than waiting for itself.

The roles are:

- **leader**: owns loading, write-back, and result publication.
- **follower**: waits for the leader's result or exception without loading again.
- **reentrant**: a nested same-thread, same-key call that bypasses waiting to avoid self-deadlock.

Cross-process exclusion still requires a distributed lock backend. With no lock manager, the default is fail-fast. Only explicit `resi-cache.sync-lock.local-only=true` permits fallback to JVM-local single-flight. The library does not silently imply cross-instance protection.

### Failures also need types

`LoaderOrchestrator.LoadOutcome` is a Java 21 sealed type that distinguishes at least:

- `BloomShortCircuited`: source loading must not happen.
- `Loaded`: loading and write-back succeeded.
- `LoadedWithWriteBackFailure`: the source returned a value, but cache write-back failed.
- `LoadFailed`: the loader failed and produced no usable result.

This supports an availability-first decision: a runtime exception while writing Redis does not erase a value already obtained from the source. The caller still receives that value. Only loader failure becomes Spring's `ValueRetrievalException`. Exception translation uses the cache name as the diagnostic boundary rather than putting the raw key into the exception message.

The upper layer can therefore decide separately whether to degrade, retry, alert, or continue responding when the cache cannot be written versus when business data cannot be read.

### Tests target boundaries

The pinned commit contains these scenarios:

- `SyncSupportSingleFlightTest`: followers share one loader result, leader exceptions propagate, same-key reentry avoids deadlock, and followers can time out.
- `SyncSingleFlightIntegrationTest`: a concurrent method with `sync=true` executes only once.
- `LoaderOrchestratorTest`: Bloom short-circuiting, sync routing, double-checking, write-back failure, and load-failure outcomes.

These names identify repository evidence, not tests rerun and passed when this article was produced. They show that load counts, failure propagation, and reentry are design contracts rather than implementation accidents.

## 3. Early expiration is a stale-task fence

### Distinguish the two versions

`CachedValue` stores the business value plus `ttl`, `createdTime`, `lastAccessTime`, `visitTimes`, `expired`, and `version`. `CachedValue.version` identifies the value so an asynchronous task can check whether it still targets that value.

The serialization envelope also has a top-level `version`, currently 2. It identifies the wire format:

| Field | Question | Use |
|---|---|---|
| `VersionEnvelope.version` | Which format do these bytes use? | Determines whether the current serialization protocol can read them |
| `CachedValue.version` | Does this delayed task still target the current value? | CAS token for shortening TTL |

Conflating these identities would couple serialization upgrades to concurrency races.

### ASYNC only shortens TTL

`EarlyExpirationHandler` computes its policy from creation time, TTL, and a threshold:

- In SYNC mode, meeting the condition skips the remaining chain so the actual-cache path loads as a miss.
- In ASYNC mode, it schedules a background task that does not directly invoke the loader.

The task rereads the live value, checks that it still exists and has not entered the five-second grace period, then passes the previously captured `CachedValue.version` to Redis Lua. A match only shortens TTL to five seconds. A later real miss invokes the loader through the normal path.

Lua reads, unwraps, compares versions, and calls `EXPIRE` atomically inside Redis:

```text
GET current value
  -> unwrap wrapper/envelope
  -> read payload.version
  -> compare with expected CachedValue.version
  -> match: EXPIRE(key, 5)
  -> mismatch or parse failure: return 0
```

If the key was replaced while the task waited, the version comparison fails and the new value's TTL remains unchanged. `EarlyExpirationHandlerRaceConditionIntegrationTest` separates unchanged-version and replaced-value cases: the former allows TTL in the 1–5 second range; the latter skips shortening.

Scheduling creates a controlled miss; the main load protocol continues to own loading, write-back, and error handling.

### Time semantics are separated too

`CachedValue` can use `startNanoTime` for monotonic time within the current process. That field is not serialized; deserialization falls back to wall-clock semantics. A process-local nanosecond origin is not treated as a persistent cross-process time fact.

The time reference must match the data's lifecycle for early expiration to be reliable.

## 4. Secure serialization checks before object construction

### Start with {version,payload}

`SecureJacksonRedisSerializer` writes non-null values in a versioned envelope:

```json
{
  "version": 2,
  "payload": "..."
}
```

The default allowed type prefix is `io.github.davidhlp`. A whitelist-constrained `PolymorphicTypeValidator` is always installed; Jackson default typing is not enabled by default. Business types outside the allowed range require explicit configuration or deserialization is rejected.

Streaming preflight checks the configured type property, `@class`, and wrapper-array type IDs, rejecting disallowed types before Jackson instantiates objects. The trust check happens before an object has a chance to be created.

The layer also handles a restricted compatibility path for Spring `NullValue`, failure on unknown envelope versions, and old `CachedValue` payloads without refresh metadata. Old payloads can fall back to wall-clock reads; this does not establish mutual compatibility with every historical serializer.

### Wire-format changes require migration

The internal `{version,payload}` envelope differs from Spring `GenericJackson2JsonRedisSerializer` and JDK serializer formats. Replacing serializers in an existing system is a state migration, not merely a configuration change. A safer sequence is shadow-read, dual-write, and cutover, separately observing old-value reads, source-load ratios, and failure types.

The explicit contracts cover format identity, type trust, and migration costs.

## 5. Observers preserve the lifecycle of nested chains

A cache handler can continue a chain fragment inside a lock. Treating every fragment as a new chain duplicates observer around-lifecycles; suppressing all fragment events loses node diagnostics.

`ChainEngine` keeps the current thread's immutable handler snapshot in `CURRENT_SNAPSHOT`. Fragments reuse that snapshot and resume after the specified node, without rebuilding a chain or pretending nested execution is a new top-level call.

`ChainObserver` start hooks return scope tokens; end hooks receive the same tokens:

```text
onChainStart -> chainToken -> onChainEnd
onNodeStart  -> nodeToken  -> onNodeEnd
```

Even when a handler throws, `onNodeEnd` and `onChainEnd` finish in `finally`. An exceptional node's result is `null`. Observer-hook exceptions are caught and logged so they should not contaminate the business handler's result.

Tokens identify scopes, snapshots identify execution context, and fragments identify the continuation point. See [ResiCache observer nesting: lifecycle, fragments, and scope tokens](/blog/legacy/note/en/resicache-observer-nested-execution/) for nested boundaries, duplicate-lifecycle counterexamples, and model validation.

## Read the mechanisms together

All five mechanisms share a principle: delayed actions must carry sufficient context and failure semantics rather than relying on what appears appropriate now.

| Scenario | Implicit risk | Explicit boundary in ResiCache |
|---|---|---|
| Protection composition | Handlers override each other or ordering drifts | `HandlerOrder` + `HandlerResult` |
| Concurrent miss | Duplicate loads, lock waits, self-deadlock | leader/follower/reentrant |
| Asynchronous early expiration | An old task damages a new value | `CachedValue.version` + Lua CAS |
| Deserialization | Untrusted types are instantiated first | whitelist + streaming preflight |
| Nested execution | Duplicate or missing lifecycles | snapshot + scope token |

The reusable design is that every side effect is bound to an inspectable identity, order, or outcome protocol. A list of BloomFilter, distributed locks, and TTL jitter alone misses that value.

## Lessons for LLM/Agent engineering

The following is a synthesis from the source above, not a claim that ResiCache implements LLM/Agent features.

### 1. Model degradation as outcomes

“A result was generated but persistence failed” differs from “generation failed.” LLM requests, tool calls, and retrieval pipelines can model `Success`, `SuccessButPersistFailed`, `Rejected`, and `Failed` explicitly so callers can choose display, retry, compensation, or human handoff.

### 2. Separate format identity from object identity

A prompt/schema format version cannot replace the object version of a session, task, or tool call. They answer different questions and need separate fields, validation, and upgrade policies.

### 3. Fence delayed tasks against stale state

Retries, index updates, cache refreshes, and Agent background tasks may run after an object changes. Read live state, then protect writes with a generation, attempt, or CAS instead of writing merely because a task was queued.

### 4. Check trust before instantiation and execution

Streaming type-whitelist preflight transfers to tool calls, plugin loading, template rendering, and code execution: validate schema, origin, and permissions before creating executable objects.

## Evidence levels and claims not made

| Level | What this article can establish | What it cannot establish |
|---|---|---|
| `Repository Implemented` | Source contains the chain, single-flight, sealed outcomes, value-version Lua CAS, secure serialization, and observer tokens | Production deployment |
| `Repository Test Evidence` | The pinned commit contains concurrency, race, serialization-rejection, and lifecycle test cases | Tests passing in this run |
| `Locally Validated` | The blog repository can run KB lint, Astro build, and diff checks for this article | Redis, Testcontainers, or Maven integration tests being run this time |
| `BLOCKED_EXTERNAL` | Production traffic, real capacity, cross-instance failover, and long-running data are outside the local evidence | Throughput, P99, HA, zero loss, or SLA |
| `OUT_OF_SCOPE` | Reactive `Mono`/`Flux`, `@Async` cache enhancement, and a full supply-chain security audit require separate validation | Generalizing synchronous blocking behavior to every Spring invocation model |

## Minimal source-reading route

1. Read [HandlerOrder.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/HandlerOrder.java) for ordering and priorities.
2. Read [LoaderOrchestrator.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestrator.java) and [SyncSupport.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SyncSupport.java) for load coalescing.
3. Read [EarlyExpirationScripts.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationScripts.java) and [SecureJacksonRedisSerializer.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java) for CAS and trust boundaries.
4. Compare [SyncSupportSingleFlightTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SyncSupportSingleFlightTest.java) and [EarlyExpirationHandlerRaceConditionIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandlerRaceConditionIntegrationTest.java) to see how design becomes race tests.

## Related pages

- [ResiCache observer nesting: lifecycle, fragments, and scope tokens](/blog/legacy/note/en/resicache-observer-nested-execution/)
- [Java NullValue: null caching prevents penetration but does not define business semantics](/blog/legacy/note/en/java-null-value/)
- [Redis business patterns: choose responsibilities before double deletion, TTL, or consistency policies](/blog/legacy/note/en/redis-business-patterns/)
- [Redis and Jackson Java time types: verify compatibility with serialization experiments](/blog/legacy/note/en/redis-jackson-java-time/)

## Sources and related documents

- [resicache-engineering-highlights-2954fff](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/resicache-engineering-highlights-2954fff.md)
- [resicache-project-overview](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/resicache-project-overview.md)
- [resicache-observer-nested-execution-contract](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/resicache-observer-nested-execution-contract.md)
- [ResiCache: Observer Nested Execution Must Distinguish Lifecycle, Fragments, and Scope Tokens](/blog/legacy/note/en/resicache-observer-nested-execution/)
- [NullValue: The Cache-Null Placeholder and Serialization Boundary](/blog/legacy/note/en/java-null-value/)
- [Redis Business Patterns: Caching, Distributed Locks, Message Queues, Feed Streams, and Seckill](/blog/legacy/note/en/redis-business-patterns/)
- [Redisson/Jackson's Default Serialization Behavior for LocalDateTime and the Write-Read Asymmetry Boundary](/blog/legacy/note/en/redis-jackson-java-time/)
