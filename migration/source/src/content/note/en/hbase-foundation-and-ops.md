---
title: "HBase Fundamentals, Architecture, and Operations: Data Model, Table Design, Shell, and Java API"
timestamp: 2026-08-21 00:00:00+08:00
series: "Big Data & Storage"
kind: concept
status: active
draft: true
sources: ["ingest-hbase-foundation"]
related: [spark-bigdata-ecosystem, database-schema-drift, mysql-storage-and-deadlock]
tags: [HBase, BigData, DataModel, Architecture, Shell, JavaAPI]
description: "Converges logical/physical models, architecture, table design, and operational tooling; clarifies trade-offs vs RDBMS."
toc: true
---

The 18 HBase notes across the two repositories are highly homologous (9 in Personal + 9 in Fuwari, essentially one-to-one counterparts differing only in language and length). This page converges them into four parts — data model, architecture, table design, and operations — removing duplicated chapters and keeping reusable concepts.

## Core Mechanism

### 1. Data model: logical vs physical separation

- Logical: `Table → RowKey → ColumnFamily:ColumnQualifier → Timestamp → Value`, sparse and versioned.
- Physical: split `Region` vertically by `ColumnFamily`; regions are distributed across RegionServers by `RowKey` ranges; `HStore` corresponds to a family, `StoreFile/HFile` is persisted, `MemStore` buffers in memory, `WAL` is write-ahead.
- The sources `Hbase逻辑模型与物理模型详解.md` (HBase Logical vs Physical Deep Dive) and `HBase-Logical-vs-Physical` explain how the same row is physically scattered by family.

### 2. Architecture components

| Component    | Responsibility               | Boundary                             |
| ------------ | ---------------------------- | ------------------------------------ |
| HMaster      | Region assignment, DDL       | Not on the write/read path           |
| RegionServer | Region hosting, reads/writes | Hotspots depend on RowKey design     |
| ZooKeeper    | Leader election, metadata    | Gradually weakened in newer versions |
| HDFS         | HFile/WAL storage            | Depends on HDFS availability         |

### 3. Table design and operations

- RowKey: uniform hashing, avoid monotonic incremental hotspots; keep family count small (1–2), qualifiers can be many.
- Operations: HBase Shell (`create/put/get/scan/disable/drop`), Java API (`Admin/Table/Connection`) corresponding to `HBase-Shell-Administration-Guide`.

## Applicability

- Wide, sparse tables, write-heavy, need prefix scans by RowKey and version retention.
- You already operate HDFS/ZK, or use managed HBase in the cloud.

## Not Applicable and Risks

- Strong transactions, JOINs, secondary indexes, and full-text search are not HBase strengths.
- Poor RowKey design causes Region hotspots; too many families amplify Flush/Compaction.
- Cluster scripts in personal notes (`hadoop-hbase-spark`) were only validated locally, not in production.

## Minimum Verification

1. Create a table via Shell, write multiple versions, verify timestamps and family splitting via `scan`.
2. Create/delete tables and batch Put/Get via Java API, confirming connection close and error handling.
3. Adjust RowKey prefixes and observe Region splits and hotspots.

## Evidence and Uncertainty

- **Source facts**: `ingest-hbase-foundation` contains 18 source notes; duplicates differ only in language.
- **Synthesis**: This page converges scattered chapters into model—architecture—design.
- **Unconfirmed**: HBase version (not pinned in sources), ZK dependency evolution, and integration with Phoenix/secondary indexes are unverified.

## Related Pages

- [spark-bigdata-ecosystem](/note/spark-bigdata-ecosystem)
- [database-schema-drift](/note/database-schema-drift)
- [mysql-storage-and-deadlock](/note/mysql-storage-and-deadlock)
