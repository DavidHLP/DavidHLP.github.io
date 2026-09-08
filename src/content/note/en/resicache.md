---
title: "ResiCache: An Orchestratable Responsibility Chain for Spring Cache Protection"
timestamp: 2026-08-21 00:00:00+08:00
series: "Java Security, Concurrency & Testing"
kind: entity
status: active
sources: ["resicache-project-overview", "resicache-observer-nested-execution-contract"]
related: ["resicache-observer-nested-execution", "java-null-value", "redis-business-patterns", "redis-jackson-java-time"]
tags: [ResiCache, SpringCache, Redis, BloomFilter, DistributedLock, ResponsibilityChain]
description: "Uses the fixed commit README as evidence to summarize ResiCache's positioning, handler order, protection defaults, and serializer-envelope migration cost, distinguishing declared from unverified capabilities."
toc: true
---

`ResiCache` is an enhancement ecosystem for Spring Cache protection. Beyond `@Cacheable`, the `@RedisCacheable` annotation adds cache-penetration, cache-breakdown, cache-avalanche, and hot-key early-refresh protection to Redis, using an orchestratable responsibility chain instead of rebuilding AOP. This page describes the declared state of the public repository's fixed main commit `75ed279a` (v0.0.2); the observer nested-execution contract is covered in [ResiCache observer nested execution](/note/resicache-observer-nested-execution).

## Core Mechanism

### Responsibility Chain and Handler Order

The write path is organized by `CacheHandlerChain`; the `HandlerOrder` enum defines the order and `@HandlerPriority` binds each handler:

1. BloomFilter (100) — blocks nonexistent keys to prevent penetration.
2. SyncLock (200) — Redisson distributed lock to prevent breakdown; `sync=true` fails fast when Redisson is unavailable instead of silently degrading.
3. EarlyExpiration (250) — asynchronously refreshes hot keys early.
4. TTL (300) — random TTL jitter (±20% by default) to prevent avalanches.
5. NullValue (400) — caches null values to prevent penetration (see [NullValue](/note/java-null-value)).
6. ActualCache (500) — performs the actual Redis write.

Any handler can short-circuit the chain with `output.skipRemaining=true`; third-party handlers can insert themselves through `HandlerOrder`. This differs from JetCache, whose main focus is multi-level caching: the scopes complement rather than replace each other.

### Coexistence and Integration Boundaries

- It extends `RedisCacheManager` / `CacheInterceptor` without replacing `@EnableCaching`; the auto-configuration entry point is `RedisCacheAutoConfiguration`.
- Plain `@Cacheable` uses native Spring behavior by default (`nativeAnnotationMode=SELECTIVE`) and is not intercepted; protection properties apply only to `@RedisCacheable`.
- The `resi-cache.*` prefix supports three override layers: global, annotation-level, and per-cache (`caches.<name>`).

## Applicability

- Spring Boot + Redis projects with read-heavy workloads that need declarative penetration/breakdown/avalanche protection.
- Projects willing to enable each protection explicitly through annotation attributes (all five protections default to `false`).
- A Java 21+, Spring Boot 4.0.0 parent, and Redisson 3.50.0 (optional) technology stack.

## Inapplicability and Risks

- **Serializer-envelope incompatibility**: the `{version, payload}` envelope is incompatible with Spring's default `GenericJackson2JsonRedisSerializer` / `JdkSerializer`; existing caches must be migrated or all cached values will become invalid.
- **The deserialization whitelist defaults to the author's package**: custom business types must explicitly configure `allowed-package-prefixes`, or deserialization throws an exception.
- **CLEAN is non-atomic**: `@CacheEvict(allEntries=true)` uses SCAN plus batch UNLINK/DEL and is best-effort; when BloomFilter is enabled, `rebuild-window-seconds` prevents silent nulls during the post-eviction rebuild window.
- **Reactive is unsupported**: the interceptor is blocking, so WebFlux methods do not trigger caching.
- Circuit breaking, rate limiting, and multi-level local caching are deliberately out of scope; use Resilience4j / Caffeine for those concerns.

## Minimal Verification

1. After adding `io.github.davidhlp:ResiCache:0.0.2`, enable one protection with `@RedisCacheable` (for example, `randomTtl`) and observe whether TTL jitter works.
2. Have two processes contend for the lock concurrently to verify the mutual exclusion and fail-fast behavior of `sync=true`.
3. Configure the whitelist prefix before reading and writing a custom type, then confirm that deserialization succeeds.

## Evidence and Uncertainty

- **Source facts**: Positioning, handler order, configuration boundaries, and known limitations come from the README at fixed commit `75ed279a` (`resicache-project-overview`); the observer/scope-token contract comes from source analysis at the same commit (`resicache-observer-nested-execution-contract`).
- **Synthesis in this page**: The README's feature matrix is condensed into “mechanism — boundary — verification”.
- **Unconfirmed**: Unpublished changes in the local workspace, which is 14 commits ahead of `origin/main`, are excluded; capacity parameters under load and Cluster/Sentinel behavior have not been independently reproduced.

## Related Pages

- [resicache-observer-nested-execution](/note/resicache-observer-nested-execution)
- [java-null-value](/note/java-null-value)
- [redis-business-patterns](/note/redis-business-patterns)
- [redis-jackson-java-time](/note/redis-jackson-java-time)
