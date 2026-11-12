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
