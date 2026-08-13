---
title: "MySQL Performance Triage: Symptom → Metric → Layer → Safe Mitigation"
timestamp: 2026-07-01 00:00:00+08:00
series: "System Operations & Infrastructure"
kind: concept
status: active
draft: true
sources: ["legacy-mysql-performance-troubleshooting"]
related: ["containerd-tls-troubleshooting", "intranet-penetration-ssh-guide"]
tags: [MySQL, Database, Troubleshooting, Performance, InnoDB, Operations]
description: "Map MySQL slowness, stalls, connection piles, and replication alerts to symptoms, metrics, layers, and safe mitigations across connections, locks, indexes, transactions, Buffer Pool, and I/O—without copying a full SOP."
toc: true
---

This page answers a triage question: when MySQL becomes slow or stuck, which metric should be observed first, which evidence belongs to the application/connection, Server/SQL, InnoDB, or OS/hardware layer, and which mitigation is least likely to widen the incident? It preserves a reusable causal model rather than turning a command checklist or one incident into the knowledge itself.

## Core mechanism

### 1. From symptom to diagnostic layer

| Symptom | First evidence | Layer | Priority mitigation |
| --- | --- | --- | --- |
| `Too many connections`, piled-up Sleep sessions | `Threads_connected`, `max_connections`, connection sources, Sleep age, `INNODB_TRX` | Application / connection | Throttle the suspect endpoint and repair pooling; verify transactions before touching sessions. |
| A few SQL statements stall and many show `Waiting` | `SHOW FULL PROCESSLIST`, `sys.innodb_lock_waits` | InnoDB lock / MDL | Find the blocker and shorten the transaction; use `KILL` only for a confirmed non-critical thread. |
| One SQL shape becomes slow | Slow log or digest, `rows_examined / rows_sent`, `EXPLAIN` | Server optimizer / index | Check statistics, access type, and selectivity before changing SQL or indexes. |
| Periodic stalls or high overall I/O | `iostat -xm 1`, dirty pages, Buffer Pool reads/waits | OS disk / InnoDB Buffer Pool | Reduce large-query pressure; adjust capacity, flushing, or read/write routing only when evidence supports it. |
| Long transactions and undo growth | Transaction age, `History list length` | InnoDB MVCC / undo | Find and end unnecessary long transactions; avoid destructive cleanup as the first move. |

**Order matters**: use `SHOW PROCESSLIST` to see the queue shape, then inspect resources with `top`/`iostat`, and only then drill into one SQL statement. Do not jump straight to `EXPLAIN` before scoping the incident.

### 2. Connections and locks: waits are causal clues

- When connections are exhausted, compare `Threads_connected` with `max_connections`, then group by `user, host`. A continuously rising `Threads_created` points to poor pool reuse; high `Aborted_clients` points to connections not closing normally.
- A Sleep session over 60 seconds is not automatically harmless. If it owns a transaction, it can block DDL and grow undo; compare it with `INNODB_TRX`.
- On MySQL 5.7, row-lock evidence can come from `INNODB_LOCKS`/`INNODB_LOCK_WAITS`. On MySQL 8.0, the source recommends `performance_schema.data_locks`, `data_lock_waits`, or `sys.innodb_lock_waits`.
- `Waiting for table metadata lock` points to MDL. A common chain is an uncommitted long transaction, another session running `ALTER`/`DROP`, and then every access to that table queues.
- Deadlock evidence is the `LATEST DETECTED DEADLOCK` section of `SHOW ENGINE INNODB STATUS \G`. The source directions are consistent lock order, shorter transactions, and—when appropriate—evaluating RR→RC isolation changes.

### 3. SQL, indexes, and transactions

- Slow-query triage can use dynamic `slow_query_log`, or aggregate fingerprints with `performance_schema.events_statements_summary_by_digest`. A `rows_examined / rows_sent` ratio far above 100 is the source's typical index-failure signal.
- For `EXPLAIN`, inspect `type`, `key`, `rows`, `filtered`, and `Extra`. `ALL`, `key=NULL`, `Using filesort`, and `Using temporary` are investigation signals, not standalone fixes.
- The source lists these index-failure shapes: wrapping a column in a function, implicit type conversion, a missing leftmost prefix in a composite index, columns to the right of a range predicate, leading-wildcard `LIKE`, and an `OR` branch without an index. MySQL 8.0 can use `EXPLAIN FORMAT=JSON`, `EXPLAIN ANALYZE`, and a temporary `INVISIBLE` index to test a hypothesis.
- The long-transaction chain is “undo versions cannot purge → history list grows → table/index expands → row lookups slow.” More than 30 seconds is the source's example filter, not a universal SLA.

### 4. Buffer Pool, I/O, and the counter-intuitive index choice

The key evidence comes from `SHOW ENGINE INNODB STATUS \G` and three global counters:

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
```

- A positive increment in `Innodb_buffer_pool_wait_free` and very low `Free buffers` indicate threads waiting for pages; high `Modified db pages` also points to flush pressure.
- Estimate hit rate as `1 - reads / read_requests`; the source's normal reference is `> 99%`. A high ratio does not rule out a short physical-read spike, so inspect absolute deltas and `wait_free` together.
- Working set is approximately “frequently accessed pages × 16KB.” When hot data exceeds the Buffer Pool, physical I/O can cost more than CPU filtering; blindly using `FORCE INDEX` may select cold pages and increase reads and `buf0buf.cc` waits.
- The minimal OS evidence is `iostat -xm 1`, focusing on `%util`, `await`, `r/s`, and `w/s`. Adding a large index while resources are saturated can further crowd memory.

### 5. CPU, temporary tables, and safe mitigation

High CPU commonly comes from unindexed full scans, sort/aggregation temporary tables, or genuinely high QPS. Rising `Created_tmp_disk_tables` and `Using temporary` point toward on-disk temporary tables. For a replication alert, start with `SHOW REPLICA STATUS \G` (MySQL 8.0; the raw source notes `SHOW SLAVE STATUS` for 5.7).

A safer order is: throttle/degrade at the application layer → preserve evidence → identify the blocker → cautiously `KILL` only a non-critical long query. When `wait_free > 0` and the Buffer Pool is nearly full, the source favors capacity, archive, cache, or read/write separation before forcing an index.

## Applicable conditions

1. Use this model for first-pass connection, lock, index, transaction, Buffer Pool, disk-I/O, temporary-table, and CPU triage; tie each conclusion to metric deltas from the same time window.
2. During an incident, reduce new load first and preserve processlist, InnoDB status, resource metrics, and SQL samples before reversible configuration/query changes.
3. MySQL 5.7 and 8.0 differ in lock views, replication commands, and `EXPLAIN ANALYZE`; confirm the version before applying an 8.0 view to 5.7.
4. Evaluate Buffer Pool pressure with working set, physical reads, and wait counters together; hit rate alone does not prove memory health.

## Not applicable and risks

- `KILL <thread_id>` is not a generic accelerator. Killing a critical write transaction can produce application errors or a rollback; the source makes it a last resort.
- Do not use `FORCE INDEX` to hide Buffer Pool/I/O saturation. A more selective index is not necessarily resident in memory.
- `Free buffers < 100`, `wait_free > 0`, and hit rate `> 99%` are reference signals in the raw source. They depend on version, workload, and sampling window and are not unconditional thresholds.
- Dynamically enabling the slow log with `SET GLOBAL` is lost after restart. Changing `innodb_flush_log_at_trx_commit`, `sync_binlog`, or Buffer Pool size changes consistency/resource risk and requires an environment review.
- `EXPLAIN`, `ANALYZE TABLE`, or a new index can explain/change optimizer behavior, but cannot replace a connection-pool, lock-order, transaction-boundary, or disk-capacity fix.

## Minimal verification

Capture cross-layer evidence first:

```sql
SHOW FULL PROCESSLIST;
SHOW ENGINE INNODB STATUS \G
SELECT trx_id, trx_started, trx_state
FROM information_schema.INNODB_TRX
ORDER BY trx_started;
```

Then add one symptom-specific check:

```bash
iostat -xm 1
```

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
SHOW STATUS LIKE 'Created_tmp%';
```

- Connections/locks: correlate processlist `Waiting`, Sleep age, and transaction age; on 8.0 prefer `sys.innodb_lock_waits`.
- Indexes: run `EXPLAIN SELECT ... \G` only after the incident scope is known. MySQL 8.0's actual-cost check is `EXPLAIN ANALYZE SELECT ...`, which is version-sensitive.
- Buffer Pool/I/O: record before/after counter deltas. If `wait_free`, physical reads, and `await/%util` worsen together, mitigate the resource bottleneck before trying `FORCE INDEX`.

## Evidence and uncertainty

- **Source facts**: `legacy-mysql-performance-troubleshooting` records the five-layer method, connection/lock/MDL evidence, index-failure shapes, long transactions and history list, Buffer Pool counters and 16KB working-set estimate, the `FORCE INDEX` counterexample, I/O/temporary-table signals, and bleeding-control actions.
- **Synthesis in this page**: the original dimensions are compressed into “symptom → metric → layer → safe mitigation,” with resource evidence placed before SQL changes. This is a model, not a new monitoring threshold.
- **Unconfirmed**: the current MySQL version, hardware/disk, Buffer Pool size, real working set, isolation level, pool implementation, SQL sample, and metric sampling window require live confirmation.

## Related pages

- [containerd TLS trust chain](/note/containerd-tls-troubleshooting)
- [SSH intranet access options](/note/intranet-penetration-ssh-guide)
