---
title: "MySQL Performance & Troubleshooting Field Manual"
timestamp: 2026-07-01 00:00:00+08:00
series: Database
tags: [MySQL, Database, Troubleshooting, Performance, InnoDB, Operations]
description: "A full-lifecycle MySQL troubleshooting handbook, from on-call bleeding control to root-cause analysis. Covers ten dimensions — connections/sessions, slow queries, indexes, locks, MVCC/undo, Buffer Pool memory, I/O, CPU, temp tables/sort, replication, and optimizer statistics — plus a real-world case study (memory saturation breaking indexes), a symptom-based decision tree, status-indicator cheat sheet, and monitoring alerts."
toc: true
---

# MySQL Performance & Troubleshooting Field Manual

A database slowdown always comes down to one of three root causes: **resource bottlenecks** (CPU / memory / I/O / network), **lock contention**, or **inefficient SQL / indexes**. This manual helps you classify the symptom in the shortest possible time and prescribe the right remedy.

It fuses two parts together: a **universal ten-dimension investigation flow**, and a **real-world case deep-dive** — *"memory saturation breaking the index"*. That case exposes a counter-intuitive engineering truth: **when memory is saturated, physical I/O cost far exceeds CPU filtering cost, so blindly applying `FORCE INDEX` makes things slower, not faster.**

## Part 1: On-Call Bleeding-Control SOP (Golden 10 Minutes)

**Goal**: restore business quickly and shed database load. Diagnosis is the means; stopping the bleed is the end.

### 1.1 Inspect the Queue — Active Connections and Backlog

First, confirm whether a large pile-up of queries or long-running transactions is jamming the pipeline.

```sql
-- Inspect currently running threads; pay attention to the Time (seconds elapsed) and State columns
SHOW FULL PROCESSLIST;

-- Find uncommitted transactions (long transactions cause MDL lock issues and undo bloat)
SELECT trx_id, trx_state, trx_started,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_query
FROM information_schema.INNODB_TRX
WHERE trx_state != 'RUNNING'
   OR TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30
ORDER BY trx_started;
```

### 1.2 The Three Emergency Levers

- **Throttle**: cap concurrency on the suspected culprit API at the application layer.
- **Kill sessions**: `KILL <thread_id>` for non-critical long queries.
- **Degrade**: temporarily disable non-essential reporting, statistics jobs, and batch tasks.

> ⚠️ Before `KILL`, verify the target thread — killing a critical write transaction can crash the application or even roll back data. `KILL` is a last resort.

---

## Part 2: Methodology — The Five-Layer Localization Model

**Golden rule**: First `SHOW PROCESSLIST` to inspect queue shape, then look at system resources (`top` / `iostat`), and only *then* drill into a single SQL statement. **Do not start with `EXPLAIN`.**

```
Application layer (connection leak / oversized txn / N+1 queries)
   ↓
Connection layer (exhausted connections / auth storms)
   ↓
Server layer (parsing / optimizer choosing the wrong index / sort / temp tables)
   ↓
Engine layer (InnoDB locks / Buffer Pool / MVCC / dirty-page flushing)
   ↓
OS / hardware (CPU / memory / disk I/O / network)
```

Localization flows top-down. Application-layer problems (such as a broken connection pool) cannot be fixed even by doubling database CPU.

### Quick Root-Cause Triage

| Root cause | Typical symptom | First-glance indicator |
|---|---|---|
| **Resource bottleneck** | Globally slow, intermittent stalls, high system load | `top` / `iostat` / `SHOW ENGINE INNODB STATUS` |
| **Lock contention** | A few queries stuck; others queue behind them | Many `Waiting` states in `SHOW PROCESSLIST` |
| **Inefficient SQL / index** | Specific query is slow; CPU and memory overall look normal | Slow query log, `EXPLAIN` |

---

## Part 3: Deep Diagnostics by Dimension

### 3.1 Connections & Sessions

#### Connection Exhaustion (`Too many connections`)

```sql
-- Current connections vs. the upper limit
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';

-- Distribution by source (find who is hammering new connections)
SELECT user, host, COUNT(*) AS cnt
FROM information_schema.processlist
GROUP BY user, host ORDER BY cnt DESC;

-- Connection reuse: Threads_created approaching Threads_cached means the pool isn't reusing
SHOW STATUS LIKE 'Threads_%';
```

| Indicator | Meaning | Healthy judgment |
|---|---|---|
| `Threads_created` keeps rising | New connections keep being opened (pool ineffective) | Audit pool config at app layer |
| `Aborted_clients` high | Connections not closed properly | App not releasing connections |
| `Aborted_connects` high | Connection failures (auth/network) | Check error log |

#### Sleep Connection Pile-Up (Suspected Leak)

```sql
-- Find long-Sleep sessions — likely leaked transactions or forgotten close()
SELECT id, user, host, db, command, time, state, info
FROM information_schema.processlist
WHERE command = 'Sleep' AND time > 60
ORDER BY time DESC;
```

> Sleep sessions holding an open transaction are the most dangerous: they block DDL and inflate undo. Always cross-check with `INNODB_TRX`.

### 3.2 Slow Query Localization

#### Enable the Slow Query Log

```sql
-- Enable at runtime (lost on restart; persist via config file for permanence)
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;                    -- log queries > 1s
SET GLOBAL log_queries_not_using_indexes = ON;      -- also log unindexed queries
SET GLOBAL min_examined_row_limit = 100;            -- skip queries that scan < 100 rows (noise filter)
```

#### performance_schema — Aggregate by Fingerprint (more useful than raw log)

```sql
-- Top slow queries by SQL fingerprint, aggregated
SELECT
  digest_text,
  count_star                AS exec_count,
  round(avg_timer_wait/1e9) AS avg_ms,
  round(max_timer_wait/1e9) AS max_ms,
  sum_rows_examined         AS total_rows_read,
  sum_rows_sent             AS total_rows_sent
FROM performance_schema.events_statements_summary_by_digest
WHERE digest_text IS NOT NULL
ORDER BY sum_timer_wait DESC
LIMIT 10;

-- Key ratio: rows_examined / rows_sent >> 100 is a typical index-failure signal
```

#### pt-query-digest for Slow Logs

```bash
# Aggregate analysis; output top-impact queries and time-series breakdown
pt-query-digest --limit 100% /var/log/mysql/slow.log > report.txt
```

### 3.3 Execution Plan & Index Issues

#### EXPLAIN Fields at a Glance

```sql
EXPLAIN SELECT ... \G

-- MySQL 8.0: actual execution cost (real row counts, loop counts, elapsed time) — far more reliable than estimates
EXPLAIN ANALYZE SELECT ...;
```

| Field | What to check | Danger signal |
|---|---|---|
| `type` | Access type | `ALL` (full table), `index` (full index scan) |
| `key` | Index actually used | `NULL` (no index used) |
| `rows` | Estimated rows examined | Much larger than rows returned |
| `filtered` | Remaining rows after filtering | Closer to 100 is better |
| `Extra` | Extra info | `Using filesort` / `Using temporary` / `Using join buffer` |

#### Six Classic Index-Killer Patterns

```sql
-- ❌ 1. Function on a column kills the index
WHERE DATE(create_time) = '2026-07-01'
-- ✅ Rewrite as a range scan
WHERE create_time >= '2026-07-01' AND create_time < '2026-07-02'

-- ❌ 2. Implicit type conversion (column is VARCHAR, value is INT)
WHERE phone = 13800138000
-- ✅ Quote the literal
WHERE phone = '13800138000'

-- ❌ 3. Missing leftmost prefix (composite index on (a, b, c))
WHERE b = 1 AND c = 2   -- `a` not present → index unused

-- ❌ 4. Right side of a range dies (composite index on (a, b, c))
WHERE a = 1 AND b > 10 AND c = 3   -- `c` can't use the index

-- ❌ 5. Leading wildcard LIKE
WHERE name LIKE '%Zhang'
-- ✅ Use full-text index or right-anchored LIKE 'Zhang%'

-- ❌ 6. OR with at least one non-indexed side
WHERE indexed_col = 1 OR unindexed_col = 2   -- degrades to full table scan
```

#### Index Visibility Diagnostics (MySQL 8.0)

```sql
-- Optimizer didn't pick your expected index? Inspect what it considered and the cost
EXPLAIN FORMAT=JSON SELECT ...;

-- Make an index invisible to the optimizer (no physical drop; revert easily)
ALTER TABLE t ALTER INDEX idx_name INVISIBLE;
ALTER TABLE t ALTER INDEX idx_name VISIBLE;
```

### 3.4 Lock Problems (the Most Common Production Incident)

#### Row-Lock Wait Investigation

```sql
-- MySQL 5.7
SELECT * FROM information_schema.INNODB_LOCKS;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;

-- MySQL 8.0 (recommended, richer info)
SELECT * FROM performance_schema.data_locks;       -- who holds locks
SELECT * FROM performance_schema.data_lock_waits;  -- who waits on whom

-- One-shot query to find the blocker (8.0)
SELECT
  blocking_pid, blocking_query,
  waiting_pid,  waiting_query,  waiting_age
FROM sys.innodb_lock_waits;
```

#### Deadlocks

```sql
SHOW ENGINE INNODB STATUS \G
-- Look for LATEST DETECTED DEADLOCK — examine each transaction's held and waited resources
-- Persist deadlock logs to the error log:
SET GLOBAL innodb_print_all_deadlocks = ON;
```

**Common deadlock triggers**: inconsistent update ordering across tables in a transaction, concurrent inserts on a unique index, gap-lock contention. Fix directions: **unify lock ordering + shorten transactions + lower isolation level** (RR→RC removes most gap locks).

#### MDL (Metadata Locks — Often Overlooked)

**Symptom**: every `SELECT` / `UPDATE` on a table hangs; `SHOW PROCESSLIST` shows `Waiting for table metadata lock`.

**Classic scenario**: a long transaction is uncommitted, another session runs `ALTER` / `DROP`, then every subsequent access queues up.

```sql
-- Find who holds the MDL (8.0)
SELECT * FROM performance_schema.metadata_locks
WHERE OBJECT_SCHEMA = 'db' AND OBJECT_NAME = 'table';

-- Classic culprit: an uncommitted long transaction
SELECT * FROM information_schema.INNODB_TRX ORDER BY trx_started;
```

### 3.5 Transactions, undo log, and MVCC

#### Long Transactions (Production Killer)

The damage chain: **long txn → undo versions cannot be purged → history list grows → tables/indexes bloat → back-table scans slow down → global slowdown**.

```sql
-- Transactions running longer than 30s
SELECT trx_id, trx_started, trx_state,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_query
FROM information_schema.INNODB_TRX
WHERE TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30
ORDER BY trx_started;
```

#### undo Bloat / Purge Lag

```sql
SHOW ENGINE INNODB STATUS \G
-- Inspect TRANSACTIONS section: History list length
-- Continuously growing means purge can't keep up (usually a long transaction blocks it)
```

### 3.6 Memory and Buffer Pool (Core Case Chapter)

> This is the most important section. Based on a real incident: a business-table query became slow, Buffer Pool saturated, semaphore waits skyrocketed — the root cause was **"memory bottleneck breaking the index"**.

#### Critical Step — Is the Buffer Pool Full?

```sql
SHOW ENGINE INNODB STATUS \G
```

Focus on:

- **`Free buffers`** — if `< 100`, memory is severely tight; the database enters a "swap-and-wait" death loop.
- **`Modified db pages`** — if very high, dirty pages are piling up; flushing pressure is high.
- **`OS WAIT ARRAY INFO`** — if `reservation count` reaches the millions, threads are queuing wildly for locks.

#### The Memory / I/O Bottleneck Evidence Chain

Run the following before and after a suspect query, and compare the deltas.

```sql
-- 1. Buffer-pool wait-for-free-page counter (the key indicator)
--    Normally 0; if a single query bumps it by dozens, memory is severely insufficient
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';

-- 2. Physical reads (from disk)
--    High value = low buffer-pool hit rate; data isn't in memory
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';

-- 3. Logical read requests (from memory) — used to compute the hit rate
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
```

**🔴 Verdict rules:**

- **Hit rate** = `1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)`; should be `> 99%`.
  - Caveat: a high ratio alone isn't enough — if absolute physical reads spike and `wait_free` rises with them, you still face a **capacity-driven frequent-page-eviction problem**.
- **Wait Free delta**: a single query incrementing it by `> 0` is a **hard memory bottleneck**.

#### Lock Contention & Semaphore Analysis

Inspect the `SEMAPHORES` section of `SHOW ENGINE INNODB STATUS \G`:

- **Keyword**: `buf0buf.cc` — threads are waiting on a Buffer Pool page RW-latch.
- **Meaning**: many threads waiting here means **hot data pages are being concurrently accessed** OR **memory pages are being evicted too aggressively**. This case was the latter (memory full → frequent eviction → frequent reload → frequent latch).

#### ⚠️ Special Case: Why Does `FORCE INDEX` Run Slower?

- **Symptom**: forcing a more selective index is *slower* than the optimizer's choice.
- **Root cause**: with memory saturated, **physical I/O cost > CPU filtering cost**.
  - The optimizer's chosen index pages are kept "hot" in the Buffer Pool by frequent prior use.
  - The forced index's pages may have been evicted (cold).
  - Forcing the index triggers massive disk reads and memory-latch waits (`buf0buf.cc`), inflating elapsed time.
- **Takeaway**: under a memory bottleneck, **don't blindly force indexes**; trust the optimizer's notion of "hotness", or fix memory first.

#### Root-Cause Confirmation — Working Set Estimation

```sql
-- Total rows in the table
SELECT COUNT(*) AS total_rows FROM biz_table;

-- Physical size (data + index)
SELECT TABLE_NAME,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'db_main' AND TABLE_NAME = 'biz_table';

-- Verify selectivity of the WHERE clause (still-large filtered count = index not selective enough)
SELECT COUNT(*) AS filtered_rows
FROM biz_table
WHERE user_id = 1008611 AND group_id = 'uuid_sample_001';
```

Working set ≈ `hot data pages × 16 KB`. In this case the Buffer Pool was ~1.8 GB, but hot data far exceeded it — "fishing in a small pond with a big fish", constantly swapping water (pages).

### 3.7 I/O Bottleneck

```bash
# System-level disk inspection
iostat -xm 1
# Watch: %util (near 100% = saturated), await (wait time), r/s w/s
```

| Tunable | Effect |
|---|---|
| `innodb_io_capacity` / `innodb_io_capacity_max` | Dirty-page flushing rate (SSD: 2000 / 4000+) |
| `innodb_flush_neighbors` | SSD: set 0 (disable neighbor flush) |
| `innodb_flush_log_at_trx_commit` | `1` = strongest durability; `2` / `0` = better perf, some loss risk |
| `sync_binlog` | Pair with the above for the "double-1" trade-off |

### 3.8 CPU Bottleneck

CPU surges almost always fall into one of three buckets:

1. **Mass unindexed full scans** — slow log + index section above.
2. **Sort / aggregation spilling to temp tables** — see next section.
3. **Genuinely high QPS** — consider caching / read-write splitting.

```sql
-- Top CPU-burning SQL (rows examined + sorts)
SELECT digest_text, count_star, sum_rows_examined, sum_sort_rows
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_sort_rows DESC LIMIT 10;
```

### 3.9 Temp Tables & Sort

```sql
SHOW STATUS LIKE 'Created_tmp%';
-- Created_tmp_disk_tables steadily increasing = lots of temp tables spilling to disk (very slow)
```

| Scenario | EXPLAIN signal | Remedy |
|---|---|---|
| Sort on disk | `Extra: Using filesort` | Index covering ORDER BY; tune `sort_buffer_size` |
| Temp table on disk | `Extra: Using temporary` | Optimize GROUP BY / DISTINCT; tune `tmp_table_size` |

```sql
SHOW VARIABLES LIKE 'tmp_table_size';
SHOW VARIABLES LIKE 'max_heap_table_size';
-- The smaller of the two is the effective in-memory temp-table cap
```

### 3.10 Replication Issues (Replica Lag)

```sql
SHOW REPLICA STATUS \G   -- MySQL 8.0 (5.7: SHOW SLAVE STATUS)
-- Key fields:
--   Seconds_Behind_Master    -- lag in seconds
--   Slave_IO_Running         -- must be Yes
--   Slave_SQL_Running        -- must be Yes
--   Last_Error / Executed_Gtid_Set
```

| Cause | Countermeasure |
|---|---|
| Large txns / big-table DDL on master | Split txns; use `pt-online-schema-change` for DDL |
| Single-threaded apply (5.7) | Upgrade or enable `slave_parallel_workers` |
| Replica weaker than master | Upgrade / shed load from replica |
| Missing indexes on replica slow down apply | Audit missing indexes on replica |
| Network jitter | Check bandwidth, `binlog_transaction_dependency` |

### 3.11 Statistics & Optimizer

Stale statistics cause the optimizer to pick the wrong index (severely mis-estimated row counts).

```sql
-- Manually refresh statistics
ANALYZE TABLE biz_table;

-- Histograms (8.0): especially effective for skewed columns
ANALYZE TABLE t UPDATE HISTOGRAM ON status WITH 100 BUCKETS;

-- Why did the optimizer choose this plan? Capture the decision trace
SET optimizer_trace = 'enabled=on';
SELECT ...;
SELECT * FROM information_schema.OPTIMIZER_TRACE \G
```

---

## Part 4: Optimization Playbook (Treat the Right Symptom)

### 4.1 Architecture & Configuration (Cures the Cause)

Given `Innodb_buffer_pool_wait_free > 0` and `Free buffers ≈ 0`, this is a **hardware resource bottleneck — no amount of SQL tuning can fully resolve it.**

1. **Grow the Buffer Pool (top priority)**
   - Adjust `innodb_buffer_pool_size` to 50%–70% of physical memory. A 16 GB server should give MySQL at least 8–10 GB.
   - Expected effect: eliminate `wait_free`, reduce physical reads, eliminate `buf0buf.cc` waits.
2. **Tune dirty-page flushing** (if `Modified db pages` is high)
   - `innodb_max_dirty_pages_pct_lwm`: 10–20, smooths flushing and avoids I/O spikes.
   - `innodb_io_capacity`: align with disk performance (SSD: 2000+).
3. **Read-write splitting**: route statistical, long `COUNT` queries to read-only replicas; never block the master.

### 4.2 SQL & Index Tuning (Treats the Symptoms)

Compromise options while waiting for memory upgrade:

1. **Covering indexes**: if the query only needs `count`, build a covering index to avoid back-table lookups. Caveat: a large new index can worsen memory pressure; if memory is already full, prefer archiving first.
2. **Data archiving**: partition by `create_time` or migrate cold rows to `biz_table_history`, shrinking the hot set so it fits in the Buffer Pool.
3. **Introduce a cache (Redis)**: for fixed-dimension results such as `user_id + group_id`, write to Redis with a short TTL (e.g. 5 minutes); let the app read cache first. This can eliminate > 90% of database pressure.

### 4.3 Monitoring & Alerting

Wire these into Prometheus / Zabbix:

1. `Innodb_buffer_pool_wait_free > 0` (alert if sustained 1 minute)
2. `Innodb_buffer_pool_pages_free < 100`
3. `Semaphore waits` (parsed from `SHOW ENGINE INNODB STATUS`) growth rate too high
4. `Buffer Pool Hit Rate < 99%`

---

## Part 5: Symptom-Based Quick Decision Tree

Jump straight to the relevant section for each symptom:

```
Database-wide slowdown, CPU/IO spikes
  └─ First, SHOW PROCESSLIST
       ├─ Many queries stuck, varied states     → Slow query (3.2) / Index (3.3)
       ├─ Many Waiting for lock                  → Lock (3.4)
       ├─ Many Waiting for metadata lock         → MDL (3.4) + Long txn (3.5)
       └─ Many Sleep pile-up                     → Connection leak (3.1)

A specific SQL suddenly slows down
  ├─ EXPLAIN — did the plan change?             → Statistics (3.11)
  ├─ wait_free > 0                              → Memory bottleneck (3.6)
  └─ Isolation level / data volume change       → Txn / MVCC (3.5)

Intermittent (periodic) stalls
  ├─ Dirty-page flush / checkpoint              → I/O (3.7)
  ├─ undo purge lagging                         → Txn (3.5)
  └─ Some scheduled heavy job                   → Inspect at the application layer

Replica-lag alert
  └─ SHOW REPLICA STATUS                        → Replication (3.10)
```

---

## Appendix A: Cheat Sheet

| Dimension | Command / Indicator | Healthy reference | Anomaly meaning |
|---|---|---|---|
| Memory headroom | `SHOW ENGINE INNODB STATUS` → `Free buffers` | `> 1000` | Pool full — must grow |
| Memory wait | `Innodb_buffer_pool_wait_free` | **0** | `> 0` = memory exhausted, threads suspended |
| Disk pressure | `Innodb_buffer_pool_reads` | Low | High = most data not in memory, must read disk |
| Lock contention | `SHOW ENGINE INNODB STATUS` → `semaphore waits` | Low | `buf0buf.cc` high = page-latch contention |
| Dirty pages | `SHOW ENGINE INNODB STATUS` → `Modified db pages` | Stable | Too high = flushing behind, I/O jitter risk |
| Index efficiency | `EXPLAIN` → `type` | `ref` / `range` | `ALL` = full table scan |
| Index efficiency | `EXPLAIN` → `Extra` | `NULL` / `Using index` | `Using filesort` / `Using temporary` = needs tuning |
| Row-lock waits | `Innodb_row_lock_waits` | Low | High = lock contention |
| Temp tables | `Created_tmp_disk_tables` | Stable | Growing = sort / aggregation tuning needed |

## Appendix B: Toolbox

| Tool | Purpose |
|---|---|
| `SHOW ENGINE INNODB STATUS \G` | One-stop InnoDB health check (locks / txns / I/O / semaphores) |
| `sys` schema | Views like `sys.innodb_lock_waits` that translate raw tables into human language |
| `performance_schema` | Full-stack wait events, statement digests, locks |
| `EXPLAIN ANALYZE` (8.0) | Real execution cost |
| `pt-query-digest` | Slow-log aggregation |
| `pt-online-schema-change` | Online DDL |
| `pt-deadlock-logger` | Continuous deadlock capture |
| `mysqldumpslow` | Lightweight slow-log analysis |

---

## 💡 Final Recommendations (Timeline)

**Short term (within 1 hour):**

- **Do not** try `FORCE INDEX` — it worsens memory contention.
- Add **Redis caching** for that hot endpoint — fastest win.
- Check for other large queries grabbing Buffer Pool pages; throttle if needed.

**Medium term (within 1 day):**

- **Scale memory** — the real fix. Push `innodb_buffer_pool_size` to the largest safe value the host allows.
- **Archive cold data** — shrink the working set.

**Long term:**

- Build out comprehensive slow-query and resource monitoring & alerting.
- Evaluate moving analytical workloads to Elasticsearch or ClickHouse instead of OLTP MySQL.

---

**Bottom line**: the database is usually **not "bad SQL" but "a small horse pulling a big cart"**. Memory (Buffer Pool) is too small relative to the active working set, so the database spends its time "shuffling data" and "queuing for locks" rather than "computing". **Scaling memory + introducing a cache is the best remedy; SQL tuning is only a limited lever before you raise that ceiling.**