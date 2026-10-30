---
title: "数据库笔试复盘：从 SQL 语义到批量数据处理"
timestamp: 2026-09-13 00:00:00+08:00
series: "数据库与数据工程"
kind: synthesis
status: provisional
sources: ["database-written-test-review"]
related: ["mysql-performance-troubleshooting", "mysql-storage-and-deadlock", "database-schema-drift", "spark-bigdata-ecosystem"]
tags: [数据库, SQL, Oracle, MySQL, Spark SQL, Kettle, ETL, 笔试复盘]
description: "把一套数据库笔试题复盘为可验证的判断链：先分清 SQL 语义与方言，再处理 NULL、重复与空结果，最后把 Kettle 和超大表操作落到分片、恢复、对账与风险控制。"
toc: true
---

复盘一套数据库笔试题时，最容易留下的是一串答案，最容易丢掉的却是答案成立的条件：连接究竟保留哪些行，`NULL` 怎样参与计算，同一段表达式属于哪种 SQL 方言，以及数据量变大后如何控制成本、验证结果和处理失败。

这次我不再按题号抄答案，而是把题目重组为一条判断链：**先还原语义，再确认方言，接着补齐空值和边界，最后讨论执行代价、恢复和对账。** Oracle 专属语法单独说明；四表练习与大表操作以 **MySQL 8.4 / InnoDB** 为背景；日期表达式分别讨论 Spark SQL、Oracle 和 MySQL。

## 复盘框架：一道题至少回答四件事

一条看起来正确的 SQL，至少要回答以下问题：

1. **语义**：结果要保留哪些行，比较或修改的对象是什么？
2. **方言**：函数、日期格式、更新限制属于哪个数据库或工具版本？
3. **边界**：`NULL`、空结果、重复记录、跨年和并发会怎样？
4. **执行**：数据量变大或任务失败后，如何限制代价、继续执行并证明结果完整？

这四个问题也解释了为什么笔试中的基础概念，最后会自然连接到批处理和超大表：前者考语义，后者考语义在真实约束下能不能落地。

## 一、基础题：先把概念放回正确的层次

### SELECT 可以引用什么对象？

在 Oracle 中，表和视图可以作为查询的数据来源，序列可以通过 `NEXTVAL`、`CURRVAL` 这样的伪列参与表达式。索引则是帮助数据库访问数据的结构，不能像普通表或视图一样，把索引名直接当作 `FROM` 后面的数据源。[^1][^2]

因此，在“表、序列、索引、视图”这类选择题中，按上述常见语义，应选**索引**。需要区分“数据库可能使用索引执行查询”和“查询把索引当作业务数据源”，两者不是一回事。

### 为什么 `ABS(-45)` 不能得到 `-45`？

绝对值与取整不是同一种操作。对已经是整数的 `-45`，向上取整、向下取整和默认按整数位四舍五入都不会改变数值，绝对值则会去掉负号。[^3][^4][^5][^6]

| 表达式 | 结果 | 理解方式 |
| --- | ---: | --- |
| `ABS(-45)` | `45` | 取绝对值 |
| `CEIL(-45)` | `-45` | 向上取整 |
| `FLOOR(-45)` | `-45` | 向下取整 |
| `ROUND(-45)` | `-45` | 默认按整数位四舍五入 |

### 数据库、DBMS 与修改表结构

数据库是被组织起来的数据集合；数据库管理系统，即 **DBMS**，负责管理数据的存储、组织与访问。问“数据库系统的核心软件”时，应回答 DBMS，而不是数据库文件或某个客户端工具。[^7]

修改已有表结构使用 `ALTER TABLE`。例如，下面是 MySQL 中增加字段的写法，不是更新已有记录的字段值：[^8]

```sql
ALTER TABLE student
ADD COLUMN email VARCHAR(254);
```

这些题看似只考名词，实际考的是对象边界：数据集合、管理软件、访问结构和 DDL 操作不能互相替代。

## 二、连接题：先判断保留哪些行，再判断怎样匹配

连接题中，要把两个问题分开：**哪些行必须保留，以及用什么条件判断匹配**。内连接只保留满足连接条件的组合；左外连接保留左表所有行；右外连接保留右表所有行。外连接中没有匹配的一侧，会补出 `NULL`。[^9]

“外连接必须是等值连接”是不正确的理解。等值、大小比较、区间匹配讨论的是连接条件；内连接、外连接讨论的是结果保留规则。外连接同样可以使用非等值条件。[^9]

例如，查询所有学生及其课程 `C002` 的成绩，没有该课程记录的学生也要出现：

```sql
SELECT s.sno, r.score
FROM student AS s
LEFT JOIN sc AS r
  ON r.sno = s.sno
 AND r.cno = 'C002';
```

这里课程条件放在 `ON` 中，只限制哪些成绩记录可以匹配。如果把它移到 `WHERE r.cno = 'C002'`，没有匹配记录的学生会因为右侧字段为 `NULL` 而被过滤掉，达不到“保留所有学生”的目的。[^10]

我的检查习惯是：看到外连接，先在纸上构造一条“完全匹配不到”的记录，再追踪它是否会被后面的过滤条件删除。这个反例比背诵 `LEFT JOIN` 的定义更能防止条件放错位置。

## 三、游标、字段类型与约束：不要把状态、存储和合法性混在一起

### Oracle 游标：打开结果集不等于取出记录

下面是一段自包含的 PL/SQL 示例：

```sql
DECLARE
    CURSOR c_demo IS
        SELECT 1 AS n FROM dual;
BEGIN
    OPEN c_demo;
    DBMS_OUTPUT.PUT_LINE(c_demo%ROWCOUNT);
    CLOSE c_demo;
END;
/
```

按显式游标的语义，输出是 **`0`**，不是 `1`。`%ROWCOUNT` 表示已经提取的记录数，而不是查询结果集的总行数。刚执行 `OPEN`、尚未执行第一次 `FETCH` 时，该值为 `0`；成功提取记录后才会增加。[^11]

这道题提醒我不要仅凭“原表有多少条记录”推断运行结果，而要沿着 `OPEN → FETCH → CLOSE` 的实际执行过程分析状态。这里的 `0` 是由官方语义推导出的预期结果，不应冒充为某次生产环境运行日志。

### `CHAR` 与 `VARCHAR`

以 MySQL 为例，`CHAR` 表示定长字符语义，`VARCHAR` 表示变长字符语义。声明中的长度主要是字符长度，不应简单理解为固定占用多少字节；字符集、实际内容与存储实现都会影响空间占用。两种类型的尾随空格处理也存在差异。[^12]

字段选型应从数据特征出发。固定长度编码可以考虑 `CHAR`，长度变化明显的名称、标题可以考虑 `VARCHAR`，但不能据此断言“CHAR 总是更快”。对于长度可能持续增长的正文，应结合上限评估 `TEXT`、`MEDIUMTEXT` 等类型，而不是把 `VARCHAR` 当作无限长字符串。[^12][^13]

### `DEFAULT` 不等于完整性约束

常见的数据完整性规则包括：`PRIMARY KEY` 标识记录，`FOREIGN KEY` 表达引用关系，`UNIQUE` 限制重复，`NOT NULL` 禁止空值，`CHECK` 检查条件。在 MySQL 的建表语法中，`DEFAULT` 用来定义默认值，不应与这些规则混为一谈。[^14]

例如，下面这段列定义包含两个不同作用：

```sql
status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
```

`DEFAULT 'PENDING'` 决定使用默认值时填什么；`NOT NULL` 才负责禁止存储空值。默认值本身不会把状态字段限制在某几个业务状态中。[^14]

另外，“SQL 约束一共只有五种”也不是适用于所有数据库的严谨说法。Oracle 官方还列出了对象关系场景中的 `REF` 约束。因此，回答约束类型时，需要说明具体数据库和讨论范围。[^15]

## 四、索引与集合运算：性能结论必须带上查询条件

### 什么字段适合建立索引？

“经常出现在 `WHERE`、`JOIN`、`ORDER BY`、`GROUP BY` 中”只能作为观察起点，不能直接推导出“每个这样的字段都应该单独建索引”。索引是否有用，还取决于查询组合、选择性、返回行数、联合索引顺序，以及额外的写入维护成本。[^16][^2]

例如，经常出现这样的查询：

```sql
SELECT order_id, created_at
FROM orders
WHERE user_id = 1001
  AND status = 'PAID'
ORDER BY created_at DESC
LIMIT 20;
```

`(user_id, status, created_at)` 可以作为候选联合索引，再结合其他查询与执行计划验证，而不是先给三个字段各建一个索引。联合索引的前导列会影响它能够支持哪些查询，字段顺序不能脱离实际负载决定。[^17]

对这类题，更完整的回答是：**从高频 SQL 出发，提出候选索引，通过执行计划和实际耗时验证，同时衡量读收益与写成本。**没有执行计划、数据分布和写入负载，就不能把索引建议写成普遍结论。

### `UNION` 和 `UNION ALL`

`UNION` 默认对合并结果去重，`UNION ALL` 保留重复行。去重针对的是**整个投影结果行**，不是只看某一个字段。例如，查询结果为 `(sno, cno)` 时，同一个学生对应不同课程的两行，不属于重复行。[^18]

不需要去重时，可以优先考虑 `UNION ALL`，避免无意义的去重工作，但不能承诺它在所有查询里都快多少倍。两者也都不能代替最终的 `ORDER BY`；需要稳定展示顺序时，应显式排序。[^18]

## 五、日期表达式：先认方言，再计算结果

遇到同时出现 `date_format`、`trunc` 和 `add_months` 的表达式，不能仅凭函数名就断定它“混用了数据库语法”。在 Spark SQL 中，这些函数可以合法组合，例如：[^19]

```sql
-- Spark SQL
SELECT date_format(
    trunc(add_months(current_date(), -1), 'MM'),
    'yyyy'
) AS previous_month_year;
```

按这些函数的定义，执行过程是：取得当前日期，向前移动一个月，截断到该月第一天，再格式化为四位年份字符串。结果是**上一个月所属的年份**，而不是“永远等于今年”。按公历月份理解，当前处于一月时会得到上一年的年份，其余月份通常仍属于当年。[^19][^20]

同一意图在 Oracle 中可以写成：

```sql
-- Oracle
SELECT TO_CHAR(
    TRUNC(ADD_MONTHS(CURRENT_DATE, -1), 'MM'),
    'YYYY'
) AS previous_month_year
FROM dual;
```

这里分别使用 Oracle 的月份运算、日期截断与格式化函数。[^21][^22][^23]

在 MySQL 中，只提取年份时不必先截断到月初：

```sql
-- MySQL
SELECT DATE_FORMAT(
    DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH),
    '%Y'
) AS previous_month_year;
```

MySQL 的日期格式符使用 `%Y`，不能把其他引擎的 `yyyy` 或 `YYYY` 原样搬过来。[^24]

这类题的检查顺序应该是：**确认引擎 → 检查函数和格式符 → 分析返回类型 → 验证跨年边界。**日期题最小的反例就是把当前日期设为一月，确认结果是否跨到上一年。

## 六、四表 SQL：查询写对之后，还要处理空值和重复记录

以下练习使用一组教学表：

```text
student(sno, sname, sage, ssex)  学生
course(cno, cname, tno)         课程
sc(sno, cno, score)             选课与成绩
teacher(tno, tname)             教师
```

约定 `sno`、`cno`、`tno` 分别是对应实体的主键，`sc` 以 `(sno, cno)` 为联合主键，成绩使用可空的 `DECIMAL(5, 2)`。示例课程编号为 `C001`、`C002`，教师编号为 `T001`。

下面四题是**独立练习**。涉及修改数据的题目，应各自从相同的初始测试数据开始，不要把上一题的修改结果当作下一题的默认输入。

### 1. 查询 C001 成绩高于 C002 的学生学号

同一名学生的两门成绩分别是一行，可以通过自连接放到同一行比较：

```sql
SELECT a.sno
FROM sc AS a
JOIN sc AS b
  ON b.sno = a.sno
WHERE a.cno = 'C001'
  AND b.cno = 'C002'
  AND a.score > b.score;
```

从这段查询的条件可以直接看出：两门课程都存在记录、成绩满足严格大于关系的学生才会被选中；缺少任意一条课程记录、成绩相同，或比较涉及 `NULL` 的情况，都不满足本题条件。内连接与过滤条件共同决定结果。[^9][^10]

### 2. 查询平均成绩大于 60 的学生及其平均成绩

```sql
SELECT sno, AVG(score) AS avg_score
FROM sc
GROUP BY sno
HAVING AVG(score) > 60;
```

`AVG(score)` 默认忽略 `NULL`，因此它不是自动把缺考、未录入成绩或未选课程记为零分。某个学生全部成绩都是 `NULL` 时，平均值也为 `NULL`，不会通过大于 `60` 的条件。是否把缺考视为零分，应先由业务规则确定，再设计表达式。[^25]

### 3. 把某教师所授课程的成绩改为各课程自身的平均分

这里的关键是“**各课程自身**”：先按 `cno` 分组计算平均分，再更新对应课程，不能把该教师全部课程混算成一个平均值。

```sql
-- MySQL 8.4
UPDATE sc AS s
JOIN course AS c
  ON c.cno = s.cno
JOIN teacher AS t
  ON t.tno = c.tno
JOIN (
    SELECT cno, AVG(score) AS avg_score
    FROM sc
    GROUP BY cno
) AS a
  ON a.cno = s.cno
SET s.score = ROUND(a.avg_score, 2)
WHERE t.tno = 'T001'
  AND a.avg_score IS NOT NULL;
```

使用教师编号，是为了避免把“姓名一定唯一”当作前提。过滤空平均值，则是为了不为整门课都没有有效成绩的情况臆造分数。

MySQL 对修改目标表并在子查询中读取同表有额外限制。这里使用带 `GROUP BY` 和聚合函数的派生表；这些结构会阻止派生表被合并，使其按物化方式参与更新。这不是可以无条件套用到任意同表更新子查询的模板。[^26][^27]

按本题写法，只要该课程存在有效平均分，课程中原本为 `NULL` 的成绩也会被替换。若业务要求保留未录入状态，需要额外加入 `s.score IS NOT NULL`。

### 4. 为缺少 C002 记录的学生补记录，成绩取该课程现有平均分

先明确题意：这里把“尚没有该课程成绩”解释为 **`sc` 中不存在该课程记录**。已经有记录、只是 `score IS NULL`，属于另一种情况，应使用更新逻辑，不能再插入重复记录。

下面用临时表先固定课程平均分，再通过左连接寻找缺失记录：

```sql
-- MySQL 8.4；假设在无并发写入的练习环境中执行
CREATE TEMPORARY TABLE tmp_review_course_avg AS
SELECT cno, AVG(score) AS avg_score
FROM sc
WHERE cno = 'C002'
GROUP BY cno;

INSERT INTO sc (sno, cno, score)
SELECT stu.sno, a.cno, ROUND(a.avg_score, 2)
FROM student AS stu
CROSS JOIN tmp_review_course_avg AS a
LEFT JOIN sc AS existing
  ON existing.sno = stu.sno
 AND existing.cno = a.cno
WHERE existing.sno IS NULL
  AND a.avg_score IS NOT NULL;

DROP TEMPORARY TABLE tmp_review_course_avg;
```

采用这种写法，也是为了避开 MySQL `INSERT ... SELECT` 的一个边界：目标表可以出现在主查询的 `FROM` 中，但不能直接出现在该查询的子查询中。因此，不宜未经确认就把“同表求平均值的子查询”和“同表 `NOT EXISTS`”塞进一次插入。[^28]

从代码还能推导出几个结果：课程完全没有记录时不插入；已有记录全部没有有效分数时也不插入；已有课程记录但分数为空的学生不会被重复插入。这里没有把“未知平均分”擅自替换为零分。

生产环境还要单独设计一致性与并发处理。联合主键可以防止重复记录，却不能让多条语句自动获得统一快照；冲突后的重试、事务边界和平均分采用哪个时间点的数据，都需要明确。

## 七、Kettle：吞吐调优与海量抽取是两个层面的问题

### 先定位瓶颈，而不是直接增加并发

面对 Kettle / Pentaho Data Integration 的性能问题，我会先把链路分成输入、转换和输出三个阶段，观察每个步骤的行数、吞吐、等待与资源占用，再决定优化哪一段。这比一开始就放大线程数或 JVM 堆更容易形成可验证的判断。

**输入阶段，尽量减少不必要的数据读取。** 只查询必要字段，能在数据库完成的过滤尽量下推。还要留意是否开启了“对每个输入行执行查询”之类的行为，避免在不需要时把一次批量读取变成大量小查询。Table Input 支持 SQL 参数与逐行执行配置，这些配置应与任务语义一致。[^29]

**转换阶段，检查逐行成本。** 重复数据库查询、不必要的字段类型转换、复杂脚本和大量排序，都值得单独测量。缓存、延迟转换和步骤多副本可以作为候选方案，但增加副本之前，应确认不会破坏顺序、分组或去重要求。[^30]

**输出阶段，区分批量提交和事务提交。** Table Output 的 `Commit size` 控制累计多少条插入后提交事务；`Use batch update for inserts` 用于批量发送插入语句，两者不是同一个开关。批处理还受驱动能力及其他步骤配置限制，应确认确实生效，而不只是勾选选项。[^31]

提交批次也不是越大越好。我的验证标准是同时比较吞吐、内存占用、失败后的重做成本与目标库压力，而不是只记录一次任务的最快耗时。

### 一次性抽取海量数据，重点是可恢复和可对账

“调快一个转换”并不能替代“设计一个可靠的抽取任务”。对海量抽取，我会采用有明确边界的分片，为每一片记录起止范围、完成状态、输出数量与重试次数，而不是让一个长期运行的查询承担全部工作。

分片可以按稳定主键范围或固定时间窗口设计，但必须明确端点，保证范围不重叠、不遗漏。任务重启后，应能从已确认完成的位置继续；目标端则通过唯一键、幂等写入或暂存区合并，承受必要的重试。

如果源数据仍在持续变化，还必须定义抽取对应哪个时间点。仅记录最大主键，不能捕获旧记录的更新或删除，也不能自动替代一致性快照。我的设计会进一步考虑快照与增量衔接，并对分片行数、关键汇总值和抽样内容做校验。

这里评价方案的标准，不是“成功跑完一次”，而是“中断后能继续，重复执行不会污染结果，最终能够说明数据为什么完整”。

## 八、超大表增删改：先缩小工作范围，再控制执行代价

面对数十亿行级别的表，我不会直接回答“分库分表”或“关闭索引”。先要问清楚：本次影响多少行，能否命中索引或分区，是否允许离线处理，源数据是否仍在写入，以及业务需要怎样的回滚与恢复能力。

以 MySQL / InnoDB 为例，三类操作的关注点并不完全相同：

| 操作 | 可以评估的处理方式 | 需要重点控制的风险 |
| --- | --- | --- |
| 大量删除 | 有界范围分批删除；大比例删除时评估重建保留数据 | 锁、日志、磁盘空间与失败恢复 |
| 大量更新 | 暂存表校验后分批关联更新；限制目标范围 | 更新匹配是否唯一、锁竞争与事务大小 |
| 大量插入 | 批量写入或适用的批量装载方式 | 约束正确性、索引维护与目标库压力 |

这些方式应结合实际条件验证。MySQL 文档分别讨论了单表删除的 `LIMIT`、关联更新，以及 InnoDB 批量装载中的事务与导入策略；它们不是一个可以脱离场景套用的“万能大表优化 SQL”。[^32][^26][^33]

如果删除比例非常高，“复制保留数据，再切换表”可以成为候选方案。但我会把它视为一次数据迁移：需要处理复制期间的增量写入、对象依赖、索引与约束、切换窗口以及校验和回退。只有拷贝与改名语句，而没有一致性方案，不能称为完整方案。MySQL 文档也将保留数据复制与表切换列为特定大批量删除场景的可选做法。[^32]

尤其不能把 `TRUNCATE` 当成“更快且随时能回滚的 DELETE”。在 MySQL 中，`TRUNCATE TABLE` 会隐式提交，不能通过普通事务回滚恢复，也不支持按 `WHERE` 条件删除。它适合允许清空整表且满足相关限制的场景，不适合盲目替代线上业务删除。[^34]

我的执行原则是：先在可控范围验证正确性，再根据锁等待、吞吐、日志和复制压力调整批次；异常时暂停或缩小范围，而不是用更大的事务强行推进。

## 结论边界：这次复盘能证明什么，不能证明什么

### 已经明确的结论

- 连接类型与连接条件是两个维度；外连接的保留规则不能被 `WHERE` 中的右表过滤悄悄改写。
- `NULL`、空结果、重复记录和跨年日期会改变看似直观的答案，必须写进推理过程。
- SQL 方言决定函数、格式符和同表读写限制；Oracle、MySQL 与 Spark SQL 的示例不能不加说明地互换。
- 大批量任务的评价标准不只是一次跑完，而是边界不重叠、失败可恢复、重复可控、结果可对账。

### 尚未由本文证明的内容

- 示例 SQL 没有替代具体环境中的执行计划、数据分布、锁等待和事务验证。
- Kettle 的缓存、并发、副本与提交批次没有在某个固定 PDI 版本和真实数据集上给出吞吐或内存基准，因此不能推出“快多少倍”。
- 超大表方案没有证明线上复制、切换、回退、外键/触发器依赖或持续写入条件下的零停机能力。
- 游标示例中的 `0` 是按官方语义得到的预期结果，不是本文现场运行产生的日志。

### 仍需先确认的题目条件

- “缺少课程成绩”是没有 `sc` 记录，还是已有记录但 `score` 为 `NULL`；两者分别对应插入与更新。
- “平均分”是否忽略 `NULL`，以及缺考是否按零分处理；这属于业务规则，不应由 `AVG` 的默认行为替代决定。
- 题目使用的是 Oracle、MySQL、Spark SQL 还是 Kettle，以及对应的精确版本。
- 数据是否持续变化，任务需要哪一个时间点的一致性快照，以及失败后允许怎样重试和回退。

## 可复用清单：下一次遇到数据库题先做什么

1. **先锁定引擎和版本**：把函数、日期格式、DDL/DML 限制放回具体方言。
2. **先画结果边界**：对连接题标出必须保留的行，再写匹配条件。
3. **主动构造反例**：至少测试一次无匹配、`NULL`、空结果、重复行和跨年日期。
4. **区分缺失与未知**：没有记录、已有记录但字段为空、平均值不存在，不要用一个 `WHERE` 混成同一种情况。
5. **把读、改、插分开验证**：目标表、子查询、临时表、事务边界和幂等性都要单独确认。
6. **性能结论必须有证据**：执行计划、数据选择性、吞吐、等待、内存和写入成本至少要覆盖与结论对应的那一层。
7. **大批量操作先做边界设计**：范围不重叠、不遗漏，记录进度，支持暂停、重试、幂等和对账。
8. **最后写清证据等级**：区分官方语义、示例推导、实际运行结果和仍待验证的假设。

这次复盘后，我更愿意把数据库题目看成三层问题：**语义是否正确、方言是否明确、执行是否可控**。能在正常样例之外说明答案为什么仍然成立，比只记住一段查询更有价值。

## 参考资料

[^1]: Oracle Database 19c SQL Language Reference — Sequence Pseudocolumns。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Sequence-Pseudocolumns.html`

[^2]: Oracle Database 19c Concepts — Indexes and Index-Organized Tables。`https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/indexes-and-index-organized-tables.html`

[^3]: Oracle Database 19c SQL Language Reference — ABS。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ABS.html`

[^4]: Oracle Database 19c SQL Language Reference — CEIL。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CEIL.html`

[^5]: Oracle Database 19c SQL Language Reference — FLOOR。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/FLOOR.html`

[^6]: Oracle Database 19c SQL Language Reference — ROUND (number)。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROUND-number.html`

[^7]: Oracle Database 19c Concepts — Introduction to Oracle Database。`https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/introduction-to-oracle-database.html`

[^8]: MySQL 8.4 Reference Manual — ALTER TABLE Statement。`https://dev.mysql.com/doc/refman/8.4/en/alter-table.html`

[^9]: Oracle Database 19c SQL Language Reference — Joins。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html`

[^10]: MySQL 8.4 Reference Manual — Outer Join Simplification。`https://dev.mysql.com/doc/refman/8.4/en/outer-join-simplification.html`

[^11]: Oracle AI Database PL/SQL Language Reference — Cursors Overview。`https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/cursors-overview.html`

[^12]: MySQL 8.4 Reference Manual — The CHAR and VARCHAR Types。`https://dev.mysql.com/doc/refman/8.4/en/char.html`

[^13]: MySQL 8.4 Reference Manual — The BLOB and TEXT Types。`https://dev.mysql.com/doc/refman/8.4/en/blob.html`

[^14]: MySQL 8.4 Reference Manual — CREATE TABLE Statement。`https://dev.mysql.com/doc/refman/8.4/en/create-table.html`

[^15]: Oracle Database 19c SQL Language Reference — constraint。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/constraint.html`

[^16]: MySQL 8.4 Reference Manual — How MySQL Uses Indexes。`https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html`

[^17]: MySQL 8.4 Reference Manual — Multiple-Column Indexes。`https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html`

[^18]: MySQL 8.4 Reference Manual — Set Operations with UNION, INTERSECT, and EXCEPT。`https://dev.mysql.com/doc/refman/8.4/en/set-operations.html`

[^19]: Apache Spark 3.5.7 — Built-in Functions。`https://spark.apache.org/docs/3.5.7/api/sql/index.html`

[^20]: Apache Spark 3.5.7 — Datetime Patterns。`https://spark.apache.org/docs/3.5.7/sql-ref-datetime-pattern.html`

[^21]: Oracle Database 19c SQL Language Reference — ADD_MONTHS。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ADD_MONTHS.html`

[^22]: Oracle Database 19c SQL Language Reference — TRUNC (date)。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TRUNC-date.html`

[^23]: Oracle Database 19c SQL Language Reference — TO_CHAR (datetime)。`https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_CHAR-datetime.html`

[^24]: MySQL 8.4 Reference Manual — Date and Time Functions。`https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html`

[^25]: MySQL 8.4 Reference Manual — Aggregate Function Descriptions。`https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html`

[^26]: MySQL 8.4 Reference Manual — UPDATE Statement。`https://dev.mysql.com/doc/refman/8.4/en/update.html`

[^27]: MySQL 8.4 Reference Manual — Optimizing Derived Tables, View References, and Common Table Expressions with Merging or Materialization。`https://dev.mysql.com/doc/refman/8.4/en/derived-table-optimization.html`

[^28]: MySQL 8.4 Reference Manual — INSERT ... SELECT Statement。`https://dev.mysql.com/doc/refman/8.4/en/insert-select.html`

[^29]: Pentaho Data Integration — Table Input。`https://docs.pentaho.com/pdia-data-integration/pdi-transformation-steps-reference-overview/table-input`

[^30]: Pentaho Data Integration — Performance Tips。`https://docs.pentaho.com/pdia-admin/optimize-the-pentaho-system/performance-tuning/pentaho-data-integration-performance-tips`

[^31]: Pentaho Data Integration — Table Output。`https://docs.pentaho.com/pdia-data-integration/pdi-transformation-steps-reference-overview/table-output`

[^32]: MySQL 8.4 Reference Manual — DELETE Statement。`https://dev.mysql.com/doc/refman/8.4/en/delete.html`

[^33]: MySQL 8.4 Reference Manual — Bulk Data Loading for InnoDB Tables。`https://dev.mysql.com/doc/refman/8.4/en/optimizing-innodb-bulk-data-loading.html`

[^34]: MySQL 8.4 Reference Manual — TRUNCATE TABLE Statement。`https://dev.mysql.com/doc/refman/8.4/en/truncate-table.html`
