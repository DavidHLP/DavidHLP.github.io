---
title: MySQL Storage Engines and Deadlock Detection
timestamp: 2026-08-21 00:00:00+08:00
series: "Big Data & Storage"
kind: concept
status: active
draft: true
sources: ["ingest-mysql-storage"]
related: [mysql-performance-troubleshooting, database-schema-drift, multi-service-readiness]
tags: [MySQL, StorageEngine, InnoDB, Deadlock]
description: Distinguishes engine capabilities from deadlock log paths with minimal checks.
toc: true
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

- [mysql-performance-troubleshooting](/note/mysql-performance-troubleshooting)
- [database-schema-drift](/note/database-schema-drift)
- [multi-service-readiness](/note/multi-service-readiness)
