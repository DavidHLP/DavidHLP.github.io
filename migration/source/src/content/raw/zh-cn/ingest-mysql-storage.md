---
title: MySQL 存储引擎与死锁检测聚合快照
capturedAt: 2026-08-21 00:00:00+08:00
sourceType: personal-notes-and-fuwari
sourceUrl: "https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9"
immutable: true
tags: [MySQL, StorageEngine, InnoDB, Deadlock]
description: 聚合 Personal 2 篇 + Fuwari 1 篇 MySQL 原文（personal bbb2126 / fuwari 07cee2b），涵盖存储引擎与死锁排查。
---

# MySQL 存储引擎与死锁检测聚合快照

本文件为聚合证据快照（immutable raw），按 LLM-Wiki 规范原样收录多篇来源原文，不改动正文，仅增加 provenance 头部与分隔。后续 wiki 页通过 `sources: ["{slug}"]` 引用本快照。

- raw slug: `ingest-mysql-storage`
- 对应 wiki: `mysql-storage-and-deadlock`
- Personal-markdown-notes 固定提交: `bbb2126`（`https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9`）
- Fuwari 固定提交: `07cee2b`（`https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52`）
- 捕获方式: `gh repo clone --depth 1` 后按路径分组，原样拼接，空文件与完全重复文件已标注但未删改内容

## 来源清单

| 序号 | 仓库 | 相对路径 | 大小 | 去重标注 |
| --- | --- | --- | --- | --- |
| 1 | Personal-markdown-notes | `mysql/知识/存储引擎.md` | 6526 |  |
| 2 | Personal-markdown-notes | `mysql/面试/基础面试题.md` | 532 |  |
| 3 | Fuwari | `mysql/checkmysqldeadlock.md` | 8828 |  |

## 免责与边界

- 黑马课程、实战 156KB、Feed 流等笔记含课程截图、本地路径、未验证配置，未作可复现实验复核，仅作证据保存。
- Fuwari 部分文章含零宽度字符（如 `OptimisticvsPessimisticLocking​.md` 路径含 `\u200b`），已按原样保留文件名。
- 个人笔记中的 `redis/业务/事务的作用域.md` 为空文件（仅 1 字节换行），已保留记录。
- 本快照不改写任何原文；冲突或过时结论由 wiki 层显式标注。

---

## 来源 1: Personal-markdown-notes / `mysql/知识/存储引擎.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/mysql/知识/存储引擎.md>
- 本地路径: `mysql/知识/存储引擎.md`

```markdown
# Mysql 存储引擎

## InnoDB

> [!NOTE]
> InnoDB 是一种兼顾高可靠性和高性能的通用存储引擎，在 MySQL 5.5 之后，InnoDB 是默认的 MySQL 存储引擎。

### 特点

- DML 操作遵循 ACID 模型，支持事务；
- 行级锁，提高并发访问性能；
- 支持外键 FOREIGN KEY 约束，保证数据的完整性和正确性；

### 逻辑存储结构

[image: 1749367988200](image/存储引擎/1749367988200.png)

1. **表空间 (Tablespace)**

   - InnoDB 存储引擎逻辑结构的最高层
   - 每个表空间对应一个.ibd 文件
   - 一个表空间可以包含多个段(Segment)

2. **段 (Segment)**

   - 表空间由多个段组成
   - 主要包含数据段、索引段、回滚段等
   - 段的管理完全由 InnoDB 引擎自动完成，无需人工干预
   - 一个段由多个区(Extent)组成

3. **区 (Extent)**

   - 表空间的基本分配单元
   - 每个区固定大小为 1MB
   - 默认情况下，InnoDB 页大小为 16KB，因此一个区包含 64 个连续的页

4. **页 (Page)**

   - InnoDB 磁盘管理的最小单位
   - 默认大小为 16KB
   - 为了保持页的连续性，InnoDB 在分配空间时，每次会申请 4-5 个区(即 4-5MB)

5. **行 (Row)**
   - InnoDB 采用行式存储结构
   - 每行数据除了包含用户定义的列外，还包含两个隐藏字段(将在后续详细介绍)
   - 行数据以行为单位进行存储和检索

### 物理存储结构

#### 表空间文件说明

- 文件命名格式：`表名.ibd`
- 每个 InnoDB 表都会对应一个表空间文件
- 存储内容包括：
  - 表结构信息（早期版本使用.frm 文件，8.0+版本使用 SDI 数据字典）
  - 表数据
  - 索引数据

#### 配置参数：innodb_file_per_table

```sql
-- 查看参数设置
SHOW VARIABLES LIKE 'innodb_file_per_table';
```

- 当 `innodb_file_per_table=ON` 时（默认值）：

  - 每个 InnoDB 表都会创建独立的.ibd 文件
  - 文件默认存储在数据库目录下
  - 例如：`/var/lib/mysql/数据库名/表名.ibd`

- 当 `innodb_file_per_table=OFF` 时：
  - 所有表数据存储在系统表空间文件(ibdata1)中
  - 不推荐使用，因为会导致系统表空间过大且难以管理

#### 查看表结构信息

.ibd 文件是二进制格式，不能直接用文本编辑器查看。可以使用 MySQL 提供的工具提取表结构信息：

```bash
# 从.ibd文件中提取SDI信息
ibd2sdi 表名.ibd
```

SDI (Serialized Dictionary Information) 是 MySQL 8.0 引入的序列化数据字典信息，包含了完整的表结构定义。

## MyISAM

MyISAM 是 MySQL 5.5 版本之前的默认存储引擎，具有以下特点：

#### 主要特点
- **非事务安全**：不支持事务和崩溃恢复
- **表级锁定**：并发性能较差，不适合高并发写入场景
- **不支持外键**：无法保证参照完整性
- **全文索引**：支持全文索引功能
- **高速读取**：适合读多写少的应用场景

#### 物理存储结构
MyISAM 将每个表存储为三个文件：

| 文件扩展名 | 用途 | 说明 |
|-----------|------|------|
| `.sdi` | 表结构 | 存储表的元数据信息（MySQL 8.0+） |
| `.MYD` | 数据文件 | 存储表的数据内容 |
| `.MYI` | 索引文件 | 存储表的索引信息 |

#### 适用场景
- 只读或读多写少的应用
- 对事务完整性要求不高的应用
- 需要全文索引的功能
- 数据仓库等分析型应用

> [!WARNING]
> 由于 MyISAM 不支持事务和行级锁，在需要数据一致性和高并发写入的场景下，建议使用 InnoDB 存储引擎。

> [!NOTE]
> MyISAM 的性能在高并发写入场景下较差，因此在 MySQL 5.5 之后，MyISAM 已经被标记为过时，不推荐使用。

> [!TIP]
> 如果需要使用 MyISAM，可以考虑使用 MyISAM 的替代方案，如 InnoDB 的 MyISAM 模式。

## Memory

Memory 存储引擎（也称为 HEAP）将表数据完全存储在内存中，提供极快的访问速度。由于数据存储在内存中，在服务器重启或崩溃时，所有数据都会丢失。

### 主要特点
- **内存存储**：所有数据都保存在 RAM 中，读写速度极快
- **表级锁定**：并发写入时会有锁竞争
- **不支持 BLOB/TEXT 类型**：仅支持固定长度的数据类型
- **默认使用 HASH 索引**：支持 BTREE 索引
- **临时表**：适合用作临时表或查询缓存

### 物理存储结构
Memory 表在磁盘上只存储表结构定义文件：
- `.sdi`：存储表的元数据信息（MySQL 8.0+）

### 适用场景
- 临时数据处理
- 只读或读多写少的缓存表
- 中间结果集处理
- 会话级别的数据存储

> [!WARNING]
> 由于数据完全存储在内存中，服务器重启或崩溃会导致数据丢失，不应用于存储关键业务数据。

> [!TIP]
> 对于需要持久化的内存表，可以考虑使用 InnoDB 的内存优化表或 Redis 等内存数据库。

## 存储引擎对比

| 特性 | InnoDB | MyISAM | Memory |
|------|--------|--------|---------|
| **存储限制** | 64TB | 256TB | RAM大小 |
| **事务支持** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **锁机制** | 行级锁 | 表级锁 | 表级锁 |
| **外键支持** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **MVCC** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **全文索引** | ✅ 5.6+ | ✅ 支持 | ❌ 不支持 |
| **哈希索引** | ❌ 不支持 | ❌ 不支持 | ✅ 默认 |
| **B树索引** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **数据缓存** | ✅ 支持 | ❌ 不支持 | N/A |
| **索引缓存** | ✅ 支持 | ✅ 支持 | N/A |
| **数据压缩** | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| **崩溃恢复** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **空间使用** | 高 | 低 | N/A |
| **内存使用** | 高 | 低 | 高 |
| **批量插入速度** | 慢 | 快 | 最快 |
| **适用场景** | 事务处理、高并发 | 读密集型、数据仓库 | 临时表、缓存 |

### 主要特点总结

1. **InnoDB**
   - 适合需要事务、外键约束的应用
   - 提供提交、回滚和崩溃恢复能力
   - 支持行级锁定，提高多用户并发性能

2. **MyISAM**
   - 适合读多写少的应用
   - 占用空间小，查询速度快
   - 不支持事务和行级锁

3. **Memory**
   - 数据存储在内存中，读写速度快
   - 服务器重启后数据丢失
   - 适合临时数据存储和缓存

> [!TIP]
> 在 MySQL 5.5 及以后版本中，推荐使用 InnoDB 作为默认存储引擎，除非有特殊需求。
```

## 来源 2: Personal-markdown-notes / `mysql/面试/基础面试题.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/mysql/面试/基础面试题.md>
- 本地路径: `mysql/面试/基础面试题.md`

```markdown
# InnoDB引擎与MyISAM引擎的区别

1. InnoDB引擎, 支持事务, 而MyISAM不支持。
2. InnoDB引擎, 支持行锁和表锁, 而MyISAM仅支持表锁, 不支持行锁。
3. InnoDB引擎, 支持外键, 而MyISAM是不支持的。

> [!TIP]
> 主要是上述三点区别，当然也可以从索引结构、存储限制等方面，更加深入的回答，具体参
> 考如下官方文档：
> https://dev.mysql.com/doc/refman/8.0/en/innodb-introduction.html
> https://dev.mysql.com/doc/refman/8.0/en/myisam-storage-engine.html
```

## 来源 3: Fuwari / `mysql/checkmysqldeadlock.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/mysql/checkmysqldeadlock.md>
- 本地路径: `mysql/checkmysqldeadlock.md`

```markdown
---
title: Mysql 死锁检查
published: 2025-06-24
description: Mysql 死锁检查
tags: [Mysql, Deadlock]
category: Mysql
draft: false
---

# Mysql 死锁检查

在 MySQL 8.0 中，排查锁问题的核心工具已经从旧版的 `information_schema.innodb_locks` 等表全面转向了 `Performance Schema` 和 `sys` schema。这提供了更强大、更详细的诊断能力。

---

### 第 1 部分：死锁的排查与诊断 (MySQL 8.0)

当你的应用程序出现超时、卡顿或直接报告死锁错误（如 `Error Code: 1213. Deadlock found when trying to get lock; try restarting transaction`）时，你需要立刻排查。

#### 方法一：查看最新的死锁日志 (首选方法)

这是定位死锁原因最直接、最有效的方法。它会告诉你死锁发生时，哪两个（或多个）事务在相互等待，它们分别持有什么锁，正在请求什么锁，以及它们正在执行的 SQL 语句。

**操作代码：**

```sql
SHOW ENGINE INNODB STATUS;
```

**如何解读输出：**

执行命令后，你会得到一大段文本。你需要找到名为 `LATEST DETECTED DEADLOCK` 的部分。下面是一个典型的死锁日志示例及解读：

```text
------------------------
LATEST DETECTED DEADLOCK
------------------------
2025-06-23 22:10:00 0x70000a9a1000
*** (1) TRANSACTION:
TRANSACTION 12345, ACTIVE 5 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 8 lock struct(s), heap size 1136, 2 row lock(s)
MySQL thread id 50, OS thread handle 0x70000a89b000, query id 987 localhost user1 updating
-- [事务1正在执行的SQL]
UPDATE products SET stock = stock - 1 WHERE product_id = 101;

*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
-- [事务1正在等待的锁]
RECORD LOCKS space id 58 page no 4 n bits 72 index PRIMARY of table `testdb`.`products` trx id 12345 lock_mode X locks rec but not gap waiting

*** (2) TRANSACTION:
TRANSACTION 12346, ACTIVE 10 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 5 lock struct(s), heap size 1136, 3 row lock(s)
MySQL thread id 52, OS thread handle 0x70000a9a1000, query id 992 localhost user1 updating
-- [事务2正在执行的SQL]
UPDATE products SET stock = stock + 1 WHERE product_id = 102;

*** (2) HOLDS THIS LOCK(S):
-- [事务2持有的锁，正是事务1想要的]
RECORD LOCKS space id 58 page no 4 n bits 72 index PRIMARY of table `testdb`.`products` trx id 12346 lock_mode X locks rec but not gap

*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
-- [事务2正在等待的锁，正是事务1持有的]
RECORD LOCKS space id 58 page no 3 n bits 72 index PRIMARY of table `testdb`.`products` trx id 12346 lock_mode X locks rec but not gap waiting

*** WE ROLL BACK TRANSACTION (1)
-- InnoDB决定回滚事务1来解决死锁
```

**分析要点：**

1.  **找到事务 (1) 和 (2)**：它们是死锁的参与者。
2.  **查看各自的 SQL 语句**：`UPDATE products ...`。
3.  **分析锁等待链**：
    - 事务 1 正在等待事务 2 持有的 `products` 表中 `product_id = 102` 的行锁。
    - 事务 2 正在等待事务 1 持有的 `products` 表中 `product_id = 101` 的行锁。
4.  **结论**：两个事务以相反的顺序锁定了 `products` 表中的不同行，形成了循环等待，导致死锁。

#### 方法二：实时查看锁等待关系 (sys Schema)

如果 `SHOW ENGINE INNODB STATUS` 信息不够，或者你想实时查看当前系统中的锁等待情况，可以使用 `sys` schema 提供的视图。这是 MySQL 8.0 中最方便的实时诊断工具。

**操作代码：**

```sql
-- 这个视图非常直观，直接显示了谁在等谁
SELECT * FROM sys.innodb_lock_waits;
```

**输出结果解读：**

| wait_started | wait_age | locked_table        | locked_index | locked_type | waiting_trx_id | waiting_pid | waiting_query      | blocking_trx_id | blocking_pid | blocking_query     |
| :----------- | :------- | :------------------ | :----------- | :---------- | :------------- | :---------- | :----------------- | :-------------- | :----------- | :----------------- |
| 22:10:00     | 00:00:05 | `testdb`.`products` | PRIMARY      | RECORD      | 12345          | 50          | UPDATE products... | 12346           | 52           | UPDATE products... |
| 22:10:02     | 00:00:03 | `testdb`.`products` | PRIMARY      | RECORD      | 12346          | 52          | UPDATE products... | 12345           | 50           | UPDATE products... |

这个表格一目了然：

- `waiting_pid` (进程 ID) `50` 正在执行 `waiting_query`。
- 它正在等待 `blocking_pid` `52` 释放锁。
- 同时，`blocking_pid` `52` 也在等待 `waiting_pid` `50` 释放另一个锁。
- 这就构成了一个清晰的死锁循环。

#### 方法三：将所有死锁记录到错误日志

对于偶发性、难以复现的死锁，可以开启配置，让 MySQL 自动将每一次死锁的详细信息都记录到错误日志（error log）中，以便事后分析。

**操作代码：**

```sql
-- 开启记录
SET GLOBAL innodb_print_all_deadlocks = ON;
```

**如何使用：**
开启后，每当发生死锁，其详细信息（与 `SHOW ENGINE INNODB STATUS` 格式相同）都会被写入 MySQL 的 error log 文件。你只需要在服务器上找到并查看这个文件即可。

**注意**：排查结束后建议关闭此选项，以避免日志文件过大。

```sql
-- 关闭记录
SET GLOBAL innodb_print_all_deadlocks = OFF;
```

---

### 第 2 部分：死锁的修复与预防

修复死锁分为两个层面：**即时处理** 和 **根本预防**。

#### 即时处理方法

InnoDB 存储引擎有自动的死锁检测机制。一旦发现死锁，它会立即选择一个“代价”最小的事务（通常是修改行数最少的）进行**回滚（ROLLBACK）**，从而打破僵局，让另一个事务继续执行。

所以，从数据库层面看，死锁是“自动修复”的。你的修复工作应该在**应用程序层面**进行。

**应用程序修复代码（逻辑示例）：**

你需要为业务代码增加**事务重试机制**。

```Java

```

**核心思想**：捕获死锁异常，执行回滚，然后等待一个短暂的随机时间，重新尝试执行整个事务。

#### 根本预防方法 (长期策略)

预防是解决死锁问题的最佳途径。结合第一部分排查出的 SQL 和锁类型，进行以下优化：

1.  **统一资源访问顺序**：

    - **问题**：这是最常见的死锁原因。事务 A 先锁了行 1 再想锁行 2，而事务 B 先锁了行 2 再想锁行 1。
    - **修复**：在你的应用程序代码中，强制规定所有需要同时锁定多行或多表的业务，都必须**以相同的、固定的顺序**来访问这些资源。例如，总是先操作 `product_id` 小的行，再操作 `product_id` 大的行。

2.  **保持事务简短，尽早提交**：

    - **问题**：一个“大事务”持有锁的时间过长，会极大地增加与其他事务冲突的概率。
    - **修复**：将复杂的业务逻辑拆分成多个更小的事务。不要在事务中包含用户等待、外部 API 调用等耗时操作。尽快完成数据库操作并 `COMMIT` 或 `ROLLBACK`。

3.  **优化索引，避免全表扫描**：

    - **问题**：如果 `UPDATE` 或 `DELETE` 语句的 `WHERE` 条件没有命中索引，MySQL 会进行全表扫描，锁定大量不必要的行，甚至整个表，极易引发死锁。
    - **修复**：使用 `EXPLAIN` 分析你的更新/删除语句，确保 `WHERE` 子句中的列都有合适的索引。
      ```sql
      EXPLAIN UPDATE products SET stock = stock - 1 WHERE product_id = 101;
      ```
      检查 `type`列是否为 `range` 或 `ref`，避免出现 `ALL`（全表扫描）。

4.  **使用较低的事务隔离级别**：

    - **问题**：MySQL 默认的 `REPEATABLE READ` 隔离级别会使用间隙锁（Gap Lock）来防止幻读，但这也会增加锁冲突和死锁的概率。
    - **修复**：如果你的业务逻辑能够接受“不可重复读”（即一个事务内两次读取同一数据，结果可能不同），可以考虑将隔离级别设置为 `READ COMMITTED`。在此级别下，间隙锁会被禁用。
      ```sql
      SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
      -- 在这里开始你的事务
      START TRANSACTION;
      -- ...
      COMMIT;
      ```

5.  **为热点数据使用行锁**：

    - **问题**：在高并发下对同一行进行更新，很容易产生锁等待。
    - **修复**：确保你的更新语句精确地只锁定需要的行。例如，`UPDATE ... WHERE id = ?`。同时，可以考虑使用乐观锁（如增加 `version` 字段）来替代悲观锁，减少锁竞争。

通过以上方法，你就可以在 MySQL 8.0 环境下系统地排查、修复并最终预防数据库死锁问题。
```
