---
{
  "archiveId": "X-1089",
  "title": "Redis Persistence and Internals: RDB/AOF, Data Structures, and Advanced Mechanisms",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "Distinguishes snapshot vs append-only recovery and performance boundaries.",
  "findings": [
    "Original document: src/content/note/en/redis-persistence-principle.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/redis-persistence-principle.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Redis",
    "Persistence",
    "RDB",
    "AOF",
    "DataStructure",
    "Principle",
    "en",
    "note"
  ],
  "draft": true,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/redis-persistence-principle.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Redis Persistence and Internals: RDB/AOF, Data Structures, and Advanced Mechanisms",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Java Fundamentals & Backend Tuning",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-redis-persistence"
      ],
      "related": [
        "redis-business-patterns",
        "redis-heima-practice",
        "database-schema-drift"
      ],
      "tags": [
        "Redis",
        "Persistence",
        "RDB",
        "AOF",
        "DataStructure",
        "Principle"
      ],
      "description": "Distinguishes snapshot vs append-only recovery and performance boundaries.",
      "toc": true
    }
  }
}
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

- [redis-business-patterns](/blog/legacy/note/zh-cn/redis-business-patterns/)
- [redis-heima-practice](/blog/legacy/note/zh-cn/redis-heima-practice/)
- [database-schema-drift](/blog/legacy/note/zh-cn/database-schema-drift/)


## Sources and related documents

- [Redis 持久化与原理聚合快照：RDB/AOF、数据结构与高级机制](/blog/legacy/raw/zh-cn/ingest-redis-persistence/)
- [Redis Business Patterns: Caching, Distributed Locks, Message Queues, Feed Streams, and Seckill](/blog/legacy/note/zh-cn/redis-business-patterns/)
- [Redis Heima Practice: Distributed Cache, Multi-Level Cache, and Best Practices](/blog/legacy/note/zh-cn/redis-heima-practice/)
- [Database Schema Drift: Locating with the history, schema, and query Views](/blog/legacy/note/zh-cn/database-schema-drift/)
