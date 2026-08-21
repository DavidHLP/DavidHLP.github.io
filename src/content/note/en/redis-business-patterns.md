---
title: "Redis Business Patterns: Caching, Distributed Locks, Message Queues, Feed Streams, and Seckill"
timestamp: 2026-08-21 00:00:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["ingest-redis-business"]
related: [redis-persistence-principle, redis-null-value, redis-jackson-java-time, resicache-observer-nested-execution]
tags: [Redis, Cache, DistributedLock, MessageQueue, Feed, Seckill]
description: "Anchors on consistency, mutual exclusion, and messaging semantics to distill reusable business patterns."
toc: true
---

The 20 Redis business notes across the two repositories mirror each other (each topic appears once in Personal and once in Fuwari, in Chinese and English). This page anchors on cache consistency, lock correctness, and messaging semantics, converging them into reusable patterns rather than course transcripts.

## Core Mechanism

### 1. Cache model and consistency

- `Redi缓存模型和思路.md` (Redis Cache Model) and `Redis-Caching-Models.md` distinguish Cache-Aside, Read/Write-Through, and invalidation strategies; TTL, proactive eviction, and delayed double-delete each have trade-offs.
- Cache nulls (see `java-null-value`) use placeholders to avoid penetration; `Spring Cache` annotations are covered separately in `CacheableAndCacheEvict`.

### 2. Distributed locks and concurrency control

- Optimistic locks (CAS/version) suit read-heavy, retryable conflicts; pessimistic/Redisson distributed locks suit mutual exclusion of critical sections.
- `分布式锁.md` (Distributed Lock) and `Distributed-Locks-with-Redis.md` use `SET NX EX` atomicity; the Redisson article introduces watchdog renewal, but holding time, renewal, and reentrancy boundaries must be checked against the version.

### 3. Message queues, Feed streams, and seckill

- `Redis消息队列.md` (Redis Message Queue) compares List/Stream/PubSub; only Stream consumer groups with ACK provide reliable semantics.
- Feed streams (push/pull/push-pull hybrid) and seckill (stock deduction, rate limiting, async queues) are dissected by scenario in `Feed流设计模型.md` (Feed Design) and `Seckill-System.md`, but capacity parameters were not measured.
- Helper classes and Session replacement in `Redis工具类实现.md` (Redis Helper) and `Replacing-Traditional-Sessions-with-Redis.md` give encapsulation examples.

## Applicability

- Cache: read-heavy, tolerates brief inconsistency, hotspots are predictable.
- Locks: short critical sections, controllable timeouts, clear lock granularity.
- Queues: at-least-once is acceptable, consumption is idempotent.

## Not Applicable and Risks

- Strong transactions, exactly-once semantics, and complex queries are not suited to pure Redis.
- If a distributed lock expires before business logic completes, it can cause dual activity; watchdog renewal, network partitions, and clock drift must be evaluated explicitly (see `resicache` related pages).
- Capacity designs for seckill and Feed were not load-tested; thresholds must not be copied verbatim.

## Minimum Verification

1. Cache: load-test hit/penetration/breakdown scenarios separately, recording TTL and fallback.
2. Locks: two processes contend for `SET NX`, verifying timeout release and `Lua` unlock atomicity.
3. Queues: Stream consumer-group ACK/NACK, verify replay after disconnect.

## Evidence and Uncertainty

- **Source facts**: `ingest-redis-business` contains 20 source notes with Chinese-English duplicates.
- **Synthesis**: This page converges business transcripts into consistency—mutual exclusion—semantics axes.
- **Unconfirmed**: Redisson version, Stream consumer-group parameters, and seckill thresholds were not pinned to a version; verify against the current environment.

## Related Pages

- [redis-persistence-principle](/note/redis-persistence-principle)
- [redis-null-value](/note/redis-null-value)
- [redis-jackson-java-time](/note/redis-jackson-java-time)
- [resicache-observer-nested-execution](/note/resicache-observer-nested-execution)
