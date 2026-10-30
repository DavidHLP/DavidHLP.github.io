---
{
  "archiveId": "X-1080",
  "title": "MySQL Storage Engines and Deadlock Detection",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "Distinguishes engine capabilities from deadlock log paths with minimal checks.",
  "findings": [
    "Original document: src/content/note/en/mysql-storage-and-deadlock.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/mysql-storage-and-deadlock.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "MySQL",
    "StorageEngine",
    "InnoDB",
    "Deadlock",
    "en",
    "note"
  ],
  "draft": true,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/mysql-storage-and-deadlock.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "MySQL Storage Engines and Deadlock Detection",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Big Data & Storage",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-mysql-storage"
      ],
      "related": [
        "mysql-performance-troubleshooting",
        "database-schema-drift",
        "multi-service-readiness"
      ],
      "tags": [
        "MySQL",
        "StorageEngine",
        "InnoDB",
        "Deadlock"
      ],
      "description": "Distinguishes engine capabilities from deadlock log paths with minimal checks.",
      "toc": true
    }
  }
}
---


Three MySQL notes focus on storage engines and deadlocks: `存储引擎.md` (Storage Engine), `基础面试题.md` (Basic Interview Questions), and `checkmysqldeadlock.md`. This page distinguishes engine capabilities from troubleshooting paths.

## Core Mechanism

- **Storage engines**: InnoDB (row locks, MVCC, crash recovery) vs MyISAM (table locks, no transactions); sources include comparison diagrams.
- **Deadlock detection**: `checkmysqldeadlock.md` gives troubleshooting steps via `SHOW ENGINE INNODB STATUS`, `information_schema`, and `performance_schema`.

## Applicability

- Use InnoDB for transactions and concurrent writes; consider MyISAM/Archive for read-only archives.

## Not Applicable and Risks

- MySQL versions (5.7 vs 8.0) differ greatly; deadlock log formats and parameters drift.

## Minimum Verification

1. Create tables with specific engines and compare locking and transactional behavior.
2. Create cross-locking deadlocks and review `INNODB STATUS`.

## Evidence and Uncertainty

- **Source facts**: `ingest-mysql-storage` contains 3 source notes.
- **Synthesis**: This page converges engine selection and deadlocks into minimal checks.
- **Unconfirmed**: MySQL versions, parameters, and production configs need rechecking.

## Related Pages

- [mysql-performance-troubleshooting](/blog/legacy/note/zh-cn/mysql-performance-troubleshooting/)
- [database-schema-drift](/blog/legacy/note/zh-cn/database-schema-drift/)
- [multi-service-readiness](/blog/legacy/note/zh-cn/multi-service-readiness/)


## Sources and related documents

- [MySQL 存储引擎与死锁检测聚合快照](/blog/legacy/raw/zh-cn/ingest-mysql-storage/)
- [MySQL Performance Triage: Symptom → Metric → Layer → Safe Mitigation](/blog/legacy/note/zh-cn/mysql-performance-troubleshooting/)
- [Database Schema Drift: Locating with the history, schema, and query Views](/blog/legacy/note/zh-cn/database-schema-drift/)
- [Multi-Service Startup Readiness: running, ready, and Dependency/Failure/Restart Propagation](/blog/legacy/note/zh-cn/multi-service-readiness/)
