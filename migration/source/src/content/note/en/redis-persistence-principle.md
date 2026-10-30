---
title: "Redis Persistence and Internals: RDB/AOF, Data Structures, and Advanced Mechanisms"
timestamp: 2026-08-21 00:00:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["ingest-redis-persistence"]
related: [redis-business-patterns, redis-heima-practice, database-schema-drift]
tags: [Redis, Persistence, RDB, AOF, DataStructure, Principle]
description: Distinguishes snapshot vs append-only recovery and performance boundaries.
toc: true
---

Persistence and internals are centered on RDB/AOF, data structures, and expiration strategies in `Redis持久化.md` (Redis Persistence), `原理篇.md` (Internals) (56KB), and `RedisPersistence.md`. This page emphasizes recoverability and performance trade-offs.

## Core Mechanism

- **RDB**: periodic snapshots, fast recovery, high fork cost with large datasets, may lose recent writes.
- **AOF**: appends commands, three `fsync` modes `everysec/always/no`, `rewrite` compaction; safer but slower replay.
- The internals article further covers SDS, Dict, ZipList/ListPack, QuickList and other underlying structures, plus expiration, eviction (LRU/LFU), and master-replica replication.

## Applicability

- Tolerate small data loss and want fast recovery → RDB.
- Want minimal loss → AOF (or hybrid persistence).

## Not Applicable and Risks

- AOF `always` amplifies latency under write-heavy workloads; `rewrite` fork/IO during the period must be evaluated.
- The internals article version is not pinned (Heima course version) and may drift from the production Redis version.

## Minimum Verification

1. Enable RDB and AOF separately, kill and restart, compare recovered data and time.
2. Load-test during `BGREWRITEAOF` and observe latency and fork.

## Evidence and Uncertainty

- **Source facts**: `ingest-redis-persistence` captures 3 source notes verbatim; the internals article has not been version-pinned.
- **Synthesis**: This page turns the snapshot vs append-log trade-off into a selection table.
- **Unconfirmed**: Specific Redis versions, hybrid persistence switches, and underlying structures differ across versions.

## Related Pages

- [redis-business-patterns](/note/redis-business-patterns)
- [redis-heima-practice](/note/redis-heima-practice)
- [database-schema-drift](/note/database-schema-drift)
