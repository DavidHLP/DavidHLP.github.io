---
title: "MySQL 性能与问题排查实战手册"
timestamp: 2026-07-01 00:00:00+08:00
series: Database
tags: [MySQL, Database, Troubleshooting, Performance, InnoDB, Operations]
description: "一份从线上紧急止血到根因深挖的 MySQL 性能排查全流程手册：覆盖连接会话、慢查询、索引、锁、事务 MVCC、Buffer Pool 内存瓶颈、IO/CPU、临时表排序、主从复制、统计信息等十大维度，并附带完整案例（内存饱和导致索引失效）、排查决策树、状态指标速查表与监控告警配置。"
toc: true
---

# MySQL 性能与问题排查实战手册

数据库变慢，永远只有三类根因：**资源瓶颈**（CPU/内存/IO/网络）、**锁竞争**、**SQL/索引低效**。本手册的目标是帮你用最短路径判断"属于哪一类"，再对症下药。

它由两部分融合而成：一套**通用全景排查流程**（十大维度），以及一个**真实案例深挖**——"内存瓶颈导致索引失效"，这个案例揭示了一条反直觉的工程经验：**在内存饱和时，物理 IO 成本远高于 CPU 过滤成本，盲目 `FORCE INDEX` 反而更慢。**

## 第一部分：线上紧急止血 SOP（黄金 10 分钟）

**目标**：快速恢复业务、降低数据库负载。诊断是手段，止血是目的。

### 1.1 看队列：当前活跃连接与堆积

确认是否有大量查询堆积或长事务卡住整条链路。

```sql
-- 查看当前正在运行的线程，重点关注 Time（已运行秒数）和 State 列
SHOW FULL PROCESSLIST;

-- 查看是否有未提交的事务（长事务是 MDL 锁、undo 膨胀的元凶）
SELECT trx_id, trx_state, trx_started,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_query
FROM information_schema.INNODB_TRX
WHERE trx_state != 'RUNNING'
   OR TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30
ORDER BY trx_started;
```

### 1.2 临时缓解三件套

- **限流**：在应用层对疑似元凶接口限制并发。
- **杀会话**：非核心业务的长查询，`KILL <thread_id>`。
- **降级**：暂时关闭非核心的统计任务、报表查询、批处理 job。

> ⚠️ 杀会话前确认目标线程：误杀核心写入事务会导致应用报错甚至数据回滚。`KILL` 仅作为最后手段。

---

## 第二部分：排查方法论——五层定位法

**黄金法则**：先 `SHOW PROCESSLIST` 看队列堆积形态，再看系统资源（`top` / `iostat`），最后才深入单条 SQL。**不要一上来就 `EXPLAIN`。**

```
应用层（连接泄漏 / 大事务 / N+1 查询）
   ↓
连接层（连接数耗尽 / 认证风暴）
   ↓
Server 层（解析 / 优化器选错索引 / 排序临时表）
   ↓
引擎层（InnoDB 锁 / Buffer Pool / MVCC / 刷脏页）
   ↓
OS / 硬件（CPU / 内存 / 磁盘 IO / 网络）
```

定位流程：自上而下排除。应用层问题（如连接池配置错误）即使把数据库 CPU 加到 100 根也解决不了。

### 根因快速分流

| 根因类别 | 典型症状 | 第一眼指标 |
|---|---|---|
| **资源瓶颈** | 整体变慢、间歇性卡顿、系统负载高 | `top` / `iostat` / `SHOW ENGINE INNODB STATUS` |
| **锁竞争** | 少量 SQL 卡住，其他 SQL 排队堆积 | `SHOW PROCESSLIST` 大量 `Waiting` 状态 |
| **SQL/索引低效** | 特定 SQL 慢，整体 CPU/内存正常 | 慢查询日志、`EXPLAIN` |

---

## 第三部分：分维度深度诊断

### 3.1 连接与会话问题

#### 连接数耗尽（`Too many connections`）

```sql
-- 当前连接数 vs 上限
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';

-- 各来源连接数分布（定位是谁在刷连接）
SELECT user, host, COUNT(*) AS cnt
FROM information_schema.processlist
GROUP BY user, host ORDER BY cnt DESC;

-- 连接复用情况：Threads_created 接近 Threads_cached 说明连接池没用好
SHOW STATUS LIKE 'Threads_%';
```

| 指标 | 含义 | 健康判断 |
|---|---|---|
| `Threads_created` 持续涨 | 不断新建连接（连接池失效） | 应用层排查连接池配置 |
| `Aborted_clients` 高 | 连接未正常关闭 | 应用没释放连接 |
| `Aborted_connects` 高 | 连接失败（认证/网络） | 查 error log |

#### 睡眠连接堆积（疑似泄漏）

```sql
-- 找出长时间 Sleep 的会话——很可能是泄漏的事务或忘记 close
SELECT id, user, host, db, command, time, state, info
FROM information_schema.processlist
WHERE command = 'Sleep' AND time > 60
ORDER BY time DESC;
```

> Sleep 但持有事务的会话最危险：它会阻塞 DDL、撑大 undo log。务必配合 `INNODB_TRX` 核对。

### 3.2 慢查询定位

#### 开启慢查询日志

```sql
-- 动态开启（重启失效，永久生效需写配置文件）
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;                    -- 超过 1 秒记录
SET GLOBAL log_queries_not_using_indexes = ON;      -- 没走索引的也记录
SET GLOBAL min_examined_row_limit = 100;            -- 扫描少于 100 行不记，过滤噪音
```

#### performance_schema：按指纹聚合（比日志更实用）

```sql
-- 慢查询 TOP 榜：按 SQL 指纹聚合，看汇总而非每条
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

-- 关键比值：rows_examined / rows_sent >> 100，即典型索引失效信号
```

#### pt-query-digest 分析慢日志

```bash
# 采样分析，输出按影响排序的 TOP SQL + 各时段分布
pt-query-digest --limit 100% /var/log/mysql/slow.log > report.txt
```

### 3.3 执行计划与索引问题

#### EXPLAIN 字段速判

```sql
EXPLAIN SELECT ... \G

-- MySQL 8.0：真实执行成本（含实际行数、循环次数、耗时），远比估算可信
EXPLAIN ANALYZE SELECT ...;
```

| 字段 | 关注点 | 危险信号 |
|---|---|---|
| `type` | 访问类型 | `ALL`（全表）、`index`（全索引扫） |
| `key` | 实际使用的索引 | `NULL`（没走索引） |
| `rows` | 预估扫描行数 | 远大于返回行数 |
| `filtered` | 过滤后剩余比例 | 越接近 100 越好 |
| `Extra` | 附加信息 | `Using filesort` / `Using temporary` / `Using join buffer` |

#### 索引失效的六大典型场景

```sql
-- ❌ 1. 函数包裹列，索引失效
WHERE DATE(create_time) = '2026-07-01'
-- ✅ 改为范围查询
WHERE create_time >= '2026-07-01' AND create_time < '2026-07-02'

-- ❌ 2. 隐式类型转换（列是 varchar，传了 int）
WHERE phone = 13800138000
-- ✅ 列加引号
WHERE phone = '13800138000'

-- ❌ 3. 最左前缀缺失（联合索引 (a,b,c)）
WHERE b = 1 AND c = 2  -- a 不参与，索引失效

-- ❌ 4. 范围查询右侧失效（联合索引 (a,b,c)）
WHERE a = 1 AND b > 10 AND c = 3  -- c 用不到索引

-- ❌ 5. LIKE 左模糊
WHERE name LIKE '%张'
-- ✅ 改用全文索引或右模糊 LIKE '张%'

-- ❌ 6. OR 两边不全有索引
WHERE indexed_col = 1 OR unindexed_col = 2  -- 退化为全表扫
```

#### 索引可见性诊断（MySQL 8.0）

```sql
-- 优化器没选你期望的索引？先看它考虑了哪些、成本多少
EXPLAIN FORMAT=JSON SELECT ...;

-- 临时隐藏索引测试（不删索引，仅对优化器不可见，验证后可决定真删）
ALTER TABLE t ALTER INDEX idx_name INVISIBLE;
ALTER TABLE t ALTER INDEX idx_name VISIBLE;
```

### 3.4 锁问题（最常见的线上事故源）

#### 行锁等待排查

```sql
-- MySQL 5.7
SELECT * FROM information_schema.INNODB_LOCKS;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;

-- MySQL 8.0（推荐，信息更全）
SELECT * FROM performance_schema.data_locks;       -- 谁持锁
SELECT * FROM performance_schema.data_lock_waits;  -- 谁等谁

-- 一句话找出"阻塞源"（8.0）：到底是谁堵住了别人
SELECT
  blocking_pid, blocking_query,
  waiting_pid,  waiting_query,  waiting_age
FROM sys.innodb_lock_waits;
```

#### 死锁

```sql
SHOW ENGINE INNODB STATUS \G
-- 找 LATEST DETECTED DEADLOCK 段，看两个事务各自持锁、等锁的资源
-- 永久开启死锁日志（写 error log）：
SET GLOBAL innodb_print_all_deadlocks = ON;
```

**死锁常见诱因**：事务内多表更新顺序不一致、唯一索引并发插入、间隙锁冲突。修复方向是**统一加锁顺序 + 缩短事务 + 降低隔离级别**（RR→RC 可消除大部分间隙锁）。

#### MDL 锁（元数据锁，极易被忽视）

**症状**：`SELECT` / `UPDATE` 全表卡住，`SHOW PROCESSLIST` 显示 `Waiting for table metadata lock`。

**常见场景**：某个长事务未提交时，另一会话执行 `ALTER` / `DROP`，之后所有访问该表的 SQL 全部排队。

```sql
-- 找出谁持有 MDL（8.0）
SELECT * FROM performance_schema.metadata_locks
WHERE OBJECT_SCHEMA = 'db' AND OBJECT_NAME = 'table';

-- 经典排查：谁堵住了 DDL？通常是某个未提交的长事务
SELECT * FROM information_schema.INNODB_TRX ORDER BY trx_started;
```

### 3.5 事务与 undo log / MVCC

#### 长事务（线上杀手）

长事务危害链：**长事务 → undo 版本不能 purge → history list 增长 → 表/索引膨胀 → 回表扫描变慢 → 全局变慢**。

```sql
-- 运行超过 30 秒的事务
SELECT trx_id, trx_started, trx_state,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_query
FROM information_schema.INNODB_TRX
WHERE TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30
ORDER BY trx_started;
```

#### undo 膨胀 / purge 滞后

```sql
SHOW ENGINE INNODB STATUS \G
-- 关注 TRANSACTIONS 段中的 History list length
-- 持续增长说明 purge 跟不上（通常是长事务挡着）
```

### 3.6 内存与 Buffer Pool（核心专章）

> 这是本手册最重要的部分。基于一个真实案例：业务表查询变慢、Buffer Pool 饱和、信号量等待飙升，最终定位为**"内存瓶颈导致索引失效"**。

#### 关键步骤：检查 Buffer Pool 是否"爆满"

```sql
SHOW ENGINE INNODB STATUS \G
```

重点关注：

- **`Free buffers`**：若 `< 100`，说明内存极度紧张，数据库陷入"换页—等待"死循环。
- **`Modified db pages`**：若很高，说明脏页堆积，刷盘压力大。
- **`OS WAIT ARRAY INFO`**：若 `reservation count` 高达百万级，说明线程在疯狂排队抢锁。

#### 内存与 IO 瓶颈的核心证据链

执行以下命令，对比查询**执行前**与**执行后**的差值。

```sql
-- 1. 缓冲池等待空闲页次数（核心指标）
--    正常应为 0；查询一次增加几十次 = 内存严重不足
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';

-- 2. 物理读次数（从磁盘读）
--    该值高 = 缓冲池命中率低，数据不在内存中
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';

-- 3. 逻辑读请求（从内存读，用于计算命中率）
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
```

**🔴 判决标准：**

- **命中率** = `1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)`，正常应 `> 99%`。
  - 注意：比例看似高不代表没问题——若物理读绝对值短时激增且伴随 `wait_free`，仍是**内存容量不足导致的频繁换页**。
- **Wait Free 增量**：单次查询增加 `> 0`，即为**内存硬瓶颈**。

#### 锁竞争与信号量分析

查看 `SHOW ENGINE INNODB STATUS \G` 中的 `SEMAPHORES` 部分：

- **关键词**：`buf0buf.cc`——线程在等待缓冲池的内存页锁（RW-latch）。
- **含义**：大量线程等待此锁，说明**并发访问热点数据页**或**内存页淘汰过于频繁**。本案例属于后者（内存满 → 频繁淘汰 → 频繁重载 → 频繁加锁）。

#### ⚠️ 特殊案例分析：为什么 FORCE INDEX 反而更慢？

- **现象**：强制使用过滤性好的索引，比优化器自选的索引更慢。
- **根因**：内存饱和时，**物理 IO 成本 > CPU 过滤成本**。
  - 优化器选择的索引页因被其他查询频繁使用，**残留在缓冲池中（热页）**。
  - 强制指定的索引页可能已被淘汰出内存（冷页）。
  - 强制走索引触发大量磁盘读和内存锁等待（`buf0buf.cc`），导致耗时增加。
- **启示**：内存瓶颈下，**不要盲目强制索引**，信任优化器对"热度"的判断，或优先解决内存问题。

#### 根因确认：工作集（Working Set）估算

```sql
-- 表总行数
SELECT COUNT(*) AS total_rows FROM biz_table;

-- 表物理大小（数据 + 索引）
SELECT TABLE_NAME,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'db_main' AND TABLE_NAME = 'biz_table';

-- 验证查询条件的数据选择性（过滤后行数依然很大 = 索引区分度不够）
SELECT COUNT(*) AS filtered_rows
FROM biz_table
WHERE user_id = 1008611 AND group_id = 'uuid_sample_001';
```

工作集 ≈ `频繁访问的数据页数 × 16KB`。本案例 Buffer Pool 约 1.8GB，而热数据远超此值——数据库在"小池子里捞大鱼"，不停换水（淘汰页）。

### 3.7 IO 瓶颈

```bash
# 系统层看磁盘负载
iostat -xm 1
# 关注：%util（接近 100% 打满）、await（等待时间）、r/s w/s
```

| 调优项 | 作用 |
|---|---|
| `innodb_io_capacity` / `innodb_io_capacity_max` | 刷脏页速率（SSD 建议 2000 / 4000+） |
| `innodb_flush_neighbors` | SSD 设 0（关邻居刷盘） |
| `innodb_flush_log_at_trx_commit` | `1`=最强一致；`2`/`0`=性能更好但有丢数风险 |
| `sync_binlog` | 配合上面做"双 1"权衡 |

### 3.8 CPU 瓶颈

CPU 飙高几乎总是这三类：

1. **大量无索引全表扫描** → 慢查询日志 + 上文索引章节。
2. **排序/聚合产生临时表** → 见下节。
3. **QPS 真的很高** → 考虑上缓存 / 读写分离。

```sql
-- 哪些 SQL 消耗 CPU 最多（扫描行数 + 排序）
SELECT digest_text, count_star, sum_rows_examined, sum_sort_rows
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_sort_rows DESC LIMIT 10;
```

### 3.9 临时表与排序

```sql
SHOW STATUS LIKE 'Created_tmp%';
-- Created_tmp_disk_tables 持续涨 = 大量临时表落盘（很慢）
```

| 场景 | EXPLAIN 信号 | 处理 |
|---|---|---|
| 排序落盘 | `Extra: Using filesort` | 建合适索引覆盖 ORDER BY；调 `sort_buffer_size` |
| 临时表落盘 | `Extra: Using temporary` | 优化 GROUP BY / DISTINCT；调 `tmp_table_size` |

```sql
SHOW VARIABLES LIKE 'tmp_table_size';
SHOW VARIABLES LIKE 'max_heap_table_size';
-- 两者取较小值才是内存临时表上限
```

### 3.10 复制问题（主从延迟）

```sql
SHOW REPLICA STATUS \G   -- MySQL 8.0（5.7 为 SHOW SLAVE STATUS）
-- 关键项：
--   Seconds_Behind_Master    —— 延迟秒数
--   Slave_IO_Running         —— 必须是 Yes
--   Slave_SQL_Running        —— 必须是 Yes
--   Last_Error / Executed_Gtid_Set
```

| 延迟原因 | 对策 |
|---|---|
| 主库大事务 / 大表 DDL | 拆事务；DDL 用 `pt-online-schema-change` |
| 单线程回放（5.7） | 升级或开并行复制 `slave_parallel_workers` |
| 从库硬件弱于主库 | 升配 / 减少从库负载 |
| 无索引导致回放慢 | 检查从库是否缺失索引 |
| 网络抖动 | 查带宽、`binlog_transaction_dependency` |

### 3.11 统计信息与优化器

统计信息过期会导致优化器选错索引（行数估算严重偏差）。

```sql
-- 手动刷新统计信息
ANALYZE TABLE biz_table;

-- 直方图（8.0）：对"列数据分布不均"特别有效
ANALYZE TABLE t UPDATE HISTOGRAM ON status WITH 100 BUCKETS;

-- 优化器为什么这么选？开 trace 看决策过程
SET optimizer_trace = 'enabled=on';
SELECT ...;
SELECT * FROM information_schema.OPTIMIZER_TRACE \G
```

---

## 第四部分：优化方案体系（对症下药）

### 4.1 架构与配置优化（治本）

针对 `Innodb_buffer_pool_wait_free > 0` 且 `Free buffers ≈ 0` 的内存硬瓶颈——**这是硬件资源瓶颈，非 SQL 能完全解决。**

1. **扩大 Buffer Pool（首选）**
   - 调整 `innodb_buffer_pool_size`，建议设为物理内存的 50%–70%。16G 内存服务器至少给 MySQL 8G–10G。
   - 预期：消除 `wait_free`、减少物理读、消除 `buf0buf.cc` 锁等待。
2. **调整脏页刷盘策略**（若 `Modified db pages` 很高）
   - `innodb_max_dirty_pages_pct_lwm`：设 10–20，让刷盘更平滑，避免瞬间 IO 打满。
   - `innodb_io_capacity`：按磁盘性能调整（SSD 可设 2000+）。
3. **读写分离**：将统计型、耗时 `COUNT` 查询路由到只读从库，避免阻塞主库事务提交。

### 4.2 SQL 与索引优化（治标）

内存无法立即扩容时的妥协方案：

1. **覆盖索引**：若查询只需 `count`，建覆盖索引减少回表。注意索引过大反而加重内存负担——内存已满时新增大索引可能适得其反。
2. **数据归档**：按时间（如 `create_time`）分区，或将历史冷数据迁移到 `biz_table_history`，减小主表体积，让热数据能完全放入 Buffer Pool。
3. **引入缓存层（Redis）**：对 `user_id + group_id` 这类固定维度的统计结果，查询库写入 Redis 并设过期（如 5 分钟），应用层先读缓存。可直接消除 90% 以上的数据库查询压力。

### 4.3 监控告警配置

将以下指标接入 Prometheus / Zabbix：

1. `Innodb_buffer_pool_wait_free > 0`（持续 1 分钟即告警）
2. `Innodb_buffer_pool_pages_free < 100`
3. `Semaphore waits`（来自 INNODB STATUS 解析）增长率过高
4. `Buffer Pool Hit Rate < 99%`

---

## 第五部分：按症状的快速决策树

出现以下症状时，直接跳到对应章节。

```
数据库整体卡顿，CPU/IO 飙高
  └─ 先 SHOW PROCESSLIST
       ├─ 大量 Query 卡住、状态各异          → 慢查询(3.2) / 索引(3.3)
       ├─ 大量 Waiting for lock              → 锁(3.4)
       ├─ 大量 Waiting for metadata lock     → MDL(3.4) + 长事务(3.5)
       └─ 大量 Sleep 堆积                    → 连接泄漏(3.1)

特定 SQL 突然变慢
  ├─ EXPLAIN 看执行计划有没有变              → 统计信息(3.11)
  ├─ 内存指标 wait_free > 0                 → 内存瓶颈(3.6)
  └─ 隔离级别 / 数据量变化                  → 事务/MVCC(3.5)

间歇性卡顿（周期性）
  ├─ 脏页刷盘 / checkpoint                  → IO(3.7)
  ├─ undo purge 滞后                        → 事务(3.5)
  └─ 某个定时大任务                         → 应用层排查

主从延迟告警
  └─ SHOW REPLICA STATUS                    → 复制(3.10)
```

---

## 附录 A：排查命令速查表（Cheat Sheet）

| 排查维度 | 命令 / 指标 | 正常参考值 | 异常含义 |
|---|---|---|---|
| 内存余量 | `SHOW ENGINE INNODB STATUS` → `Free buffers` | `> 1000` | 缓冲池已满，需扩容 |
| 内存等待 | `Innodb_buffer_pool_wait_free` | **0** | `> 0` 表示内存严重不足，线程挂起等待 |
| 磁盘压力 | `Innodb_buffer_pool_reads` | 低 | 高表示大量数据不在内存，需读盘 |
| 锁竞争 | `SHOW ENGINE INNODB STATUS` → `semaphore waits` | 低 | `buf0buf.cc` 高表示内存页锁竞争激烈 |
| 脏页堆积 | `SHOW ENGINE INNODB STATUS` → `Modified db pages` | 稳定 | 过高表示刷盘不及时，可能引发 IO 抖动 |
| 索引效率 | `EXPLAIN` → `type` | `ref` / `range` | `ALL` 表示全表扫描 |
| 索引效率 | `EXPLAIN` → `Extra` | `NULL` / `Using index` | `Using filesort` / `Using temporary` 需优化 |
| 行锁等待 | `Innodb_row_lock_waits` | 低 | 高表示锁竞争 |
| 临时表 | `Created_tmp_disk_tables` | 稳定 | 持续涨需优化排序/聚合 |

## 附录 B：排查工具箱

| 工具 | 用途 |
|---|---|
| `SHOW ENGINE INNODB STATUS \G` | InnoDB 一站式体检（锁/事务/IO/信号量） |
| `sys` schema | `sys.innodb_lock_waits` 等视图，把原始表翻译成人话 |
| `performance_schema` | 全链路等待事件、语句摘要、锁 |
| `EXPLAIN ANALYZE` (8.0) | 真实执行成本 |
| `pt-query-digest` | 慢日志聚合分析 |
| `pt-online-schema-change` | 在线 DDL |
| `pt-deadlock-logger` | 死锁持续采集 |
| `mysqldumpslow` | 慢日志轻量分析 |

---

## 💡 最终建议（按时间线）

**短期（1 小时内）：**

- **不要**再尝试 `FORCE INDEX`，这会加剧内存竞争。
- 在应用层对该接口增加 **Redis 缓存**，这是见效最快的方法。
- 检查是否有其他大查询抢占缓冲池，必要时限制其并发。

**中期（1 天内）：**

- **扩容内存**是根本解法：将 `innodb_buffer_pool_size` 提升至物理内存允许的最大安全值。
- **数据归档**：将业务表中的历史冷数据迁移，减小主表体积。

**长期：**

- 建立完善的慢查询与资源监控告警。
- 评估是否将统计类需求迁移到 Elasticsearch 或 ClickHouse 等 OLAP 引擎，避免在事务型数据库（MySQL）中做复杂聚合。

---

**总结结论**：数据库往往**不是 SQL 写得不好，而是"小马拉大车"**。内存（Buffer Pool）相对于活跃数据集（Working Set）太小，导致数据库时间都花在"搬运数据"和"排队抢锁"上，而非"计算数据"上。**扩容内存 + 引入缓存**是最佳解；调 SQL 只是抬高天花板前的有限手段。
