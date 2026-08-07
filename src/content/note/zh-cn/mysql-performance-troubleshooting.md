---
title: "MySQL 性能排查：现象→指标→定位层→安全缓解"
timestamp: 2026-07-01 00:00:00+08:00
series: "系统运维与基础设施"
kind: concept
status: active
sources: ["legacy-mysql-performance-troubleshooting"]
related: ["containerd-tls-troubleshooting", "intranet-penetration-ssh-guide"]
tags: [MySQL, Database, Troubleshooting, Performance, InnoDB, Operations]
description: "把 MySQL 慢、卡、连接堆积和复制告警映射为现象、指标、定位层与安全缓解，覆盖连接、锁、索引、事务、Buffer Pool 和 IO，但不替代现场 SOP。"
toc: true
---

本页回答一个排查问题：看到 MySQL 变慢或卡住时，先观察什么指标，应该把证据归到应用/连接、Server/SQL、InnoDB，还是 OS/硬件层，随后采取什么不会扩大事故的缓解。它保留可复用的因果模型，不把完整命令清单或单次事故过程当作知识本体。

## 核心机制

### 1. 现象到定位层

| 现象 | 第一眼指标/证据 | 定位层 | 优先缓解 |
| --- | --- | --- | --- |
| `Too many connections`、Sleep 堆积 | `Threads_connected`、`max_connections`、连接来源；Sleep 时间；`INNODB_TRX` | 应用/连接 | 限制可疑接口并发，修连接池；确认事务后再处理会话。 |
| 少量 SQL 卡住，大量 `Waiting` | `SHOW FULL PROCESSLIST`、`sys.innodb_lock_waits` | InnoDB 锁 / MDL | 找阻塞源，缩短事务；`KILL` 只对确认的非核心线程使用。 |
| 特定 SQL 变慢 | 慢查询或 digest、`rows_examined / rows_sent`、`EXPLAIN` | Server 优化器 / 索引 | 先核对统计信息、访问类型、数据选择性，再改 SQL/索引。 |
| 周期性卡顿或整体 IO 高 | `iostat -xm 1`、脏页、Buffer Pool 读/等待 | OS 磁盘 / InnoDB Buffer Pool | 限制大查询；按证据调整容量、刷盘或读写路径。 |
| 长事务、undo 膨胀 | 事务年龄、`History list length` | InnoDB MVCC / undo | 找到并结束不必要的长事务，避免先做破坏性清理。 |

**顺序原则**：先用 `SHOW PROCESSLIST` 看队列形态，再看 `top`/`iostat` 等资源，最后深入单条 SQL。不要看到慢查询就跳过现场范围直接 `EXPLAIN`。

### 2. 连接与锁：等待是因果线索

- 连接数耗尽时，比较 `Threads_connected` 与 `max_connections`，再按 `user, host` 聚合；`Threads_created` 持续增长提示连接池复用不足，`Aborted_clients` 高提示连接未正常关闭。
- `Sleep` 超过 60 秒不等于无害；若同时持有事务，会阻塞 DDL 并撑大 undo。必须和 `INNODB_TRX` 对照。
- 行锁在 MySQL 5.7 可从 `INNODB_LOCKS`/`INNODB_LOCK_WAITS` 看；MySQL 8.0 推荐 `performance_schema.data_locks`、`data_lock_waits` 或 `sys.innodb_lock_waits`。
- `Waiting for table metadata lock` 指向 MDL：常见链路是长事务未提交，另一个会话执行 `ALTER`/`DROP`，随后访问该表的语句排队。
- 死锁证据在 `SHOW ENGINE INNODB STATUS \G` 的 `LATEST DETECTED DEADLOCK`；来源给出的修复方向是统一加锁顺序、缩短事务，必要时评估 RR→RC 的隔离级别变化。

### 3. SQL、索引与事务

- 慢查询可用动态 `slow_query_log`，或用 `performance_schema.events_statements_summary_by_digest` 按指纹聚合；`rows_examined / rows_sent` 远大于 100 是来源给出的典型索引失效信号。
- `EXPLAIN` 重点看 `type`、`key`、`rows`、`filtered` 和 `Extra`。`ALL`、`key=NULL`、`Using filesort`、`Using temporary` 是进一步定位的信号，不是单独的修复结论。
- 来源列出的失效形状包括：函数包列、隐式类型转换、联合索引缺最左前缀、范围条件右侧列、左模糊 `LIKE`、`OR` 一侧无索引。MySQL 8.0 可用 `EXPLAIN FORMAT=JSON`、`EXPLAIN ANALYZE` 和临时 `INVISIBLE` 索引验证假设。
- 长事务链路是“undo 版本不能 purge → history list 增长 → 表/索引膨胀 → 回表扫描变慢”。运行超过 30 秒是来源示例的筛选条件，不是所有系统的通用 SLA。

### 4. Buffer Pool、IO 与反直觉的索引选择

重点证据来自 `SHOW ENGINE INNODB STATUS \G` 与三个全局计数：

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
```

- `Innodb_buffer_pool_wait_free` 增量大于 0、`Free buffers` 很低，说明线程在等待可用页；`Modified db pages` 高则要同时看刷盘压力。
- 命中率可按 `1 - reads / read_requests` 估算，来源给出的正常参考是 `> 99%`；但命中率高并不排除物理读短时激增，必须同时看绝对增量与 `wait_free`。
- 工作集约为“频繁访问的数据页数 × 16KB”。当热数据大于 Buffer Pool，物理 IO 可能比 CPU 过滤更贵；此时盲目 `FORCE INDEX` 可能选择冷页，反而增加读盘和 `buf0buf.cc` 等待。
- IO 层的最小证据是 `iostat -xm 1`，关注 `%util`、`await`、`r/s`、`w/s`。资源瓶颈未解除时，单纯新增大索引也可能进一步挤压内存。

### 5. CPU、临时表和安全缓解

CPU 高常见于无索引全表扫、排序/聚合临时表或真实 QPS 过高；`Created_tmp_disk_tables` 持续增长和 `Using temporary` 说明临时表落盘方向。复制告警则先看 `SHOW REPLICA STATUS \G`（MySQL 8.0；raw 说明 5.7 使用 `SHOW SLAVE STATUS`）。

安全缓解顺序是：应用层限流/降级 → 记录现场 → 确认阻塞源 → 对非核心长查询谨慎 `KILL`。当 `wait_free > 0` 且 Buffer Pool 近满时，来源更支持扩容、归档、缓存或读写分离，而不是先强制索引。

## 适用条件

1. 用这套模型处理连接、锁、索引、事务、Buffer Pool、磁盘 IO 和临时表/CPU 的初筛；每个结论都要回到同一时间窗口的指标差值。
2. 生产止血优先减少新增负载，保留 processlist、InnoDB status、资源指标和 SQL 样本，再做可回滚的配置/查询调整。
3. MySQL 5.7 与 8.0 的锁视图、复制命令和 `EXPLAIN ANALYZE` 能力不同；先确认版本，不能把 8.0 视图直接套到 5.7。
4. Buffer Pool 问题适合结合活跃工作集、物理读和等待计数判断；命中率单指标不足以证明内存健康。

## 不适用与风险

- `KILL <thread_id>` 不是通用加速按钮；误杀核心写事务可能引起应用错误或回滚，来源明确要求把它作为最后手段。
- 不要用 `FORCE INDEX` 掩盖 Buffer Pool/IO 饱和；“过滤性更好”不代表页仍在内存中。
- `Free buffers < 100`、`wait_free > 0`、命中率 `> 99%` 等是 raw 中的参考信号，受版本、工作负载和采样窗口影响，不能当作无条件阈值。
- 动态打开慢日志的 `SET GLOBAL` 在重启后失效；修改 `innodb_flush_log_at_trx_commit`、`sync_binlog` 或 Buffer Pool 会改变一致性/资源风险，必须先做环境评估。
- `EXPLAIN`、`ANALYZE TABLE` 或建索引只能解释/改变优化器路径，不能替代连接池、锁顺序、事务边界或磁盘容量修复。

## 最小验证

先获取跨层现场：

```sql
SHOW FULL PROCESSLIST;
SHOW ENGINE INNODB STATUS \G
SELECT trx_id, trx_started, trx_state
FROM information_schema.INNODB_TRX
ORDER BY trx_started;
```

再按症状补一项：

```bash
iostat -xm 1
```

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
SHOW STATUS LIKE 'Created_tmp%';
```

- 连接/锁：把 processlist 的 `Waiting`、Sleep 时间与事务年龄对上；8.0 优先看 `sys.innodb_lock_waits`。
- 索引：仅在范围已知后执行 `EXPLAIN SELECT ... \G`；MySQL 8.0 的真实成本可用 `EXPLAIN ANALYZE SELECT ...`，但这是版本敏感检查。
- Buffer Pool/IO：记录查询前后计数差值；`wait_free`、物理读、`await/%util` 同时恶化时，先按资源瓶颈缓解，不要先加 `FORCE INDEX`。

## 证据与不确定性

- **来源事实**：`legacy-mysql-performance-troubleshooting` 记录五层定位法、连接/锁/MDL、索引失效形状、长事务与 history list、Buffer Pool 指标和 16KB 工作集估算、`FORCE INDEX` 反例、IO/临时表信号及止血动作。
- **本页综合**：把原始维度压缩为“现象→指标→定位层→安全缓解”，并把资源证据放在 SQL 调整之前；这是模型化整理，不是新的监控阈值。
- **未确认项**：当前 MySQL 版本、硬件/磁盘、Buffer Pool 大小、真实工作集、事务隔离级别、连接池实现、SQL 样本和指标采样窗口，均需要现场确认。

## 相关页面

- [containerd TLS 信任链](/note/containerd-tls-troubleshooting)
- [SSH 内网访问方案](/note/intranet-penetration-ssh-guide)
