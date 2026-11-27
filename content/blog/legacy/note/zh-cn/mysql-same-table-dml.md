---
{
  "archiveId": "X-1306",
  "title": "MySQL 同表读写的派生表物化、临时表与更新边界",
  "en": "ENGINEERING NOTES",
  "category": "系统运维",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "基于 MySQL 8.4 四表 DML 练习，拆解 UPDATE 同表派生表物化、INSERT...SELECT 临时表绕行、缺失记录与 NULL 分数的区分及并发快照边界。",
  "findings": [
    "原生知识页: content/blog/legacy/note/zh-cn/mysql-same-table-dml.md",
    "来源快照: database-written-test-review",
    "证据状态: 暂定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/database-written-test-review.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "MySQL",
    "DML",
    "Derived Table",
    "Temporary Table",
    "NULL",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "translationKey": "legacy/note/mysql-same-table-dml",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "database-written-test-review"
  ],
  "related": [
    "database-written-test-review"
  ]
}
---

在 MySQL 8.4 中，对同一张表既读取聚合值又执行 `UPDATE` 或 `INSERT`，不能把标准 SQL 子查询写法直接当成通用模板。本页收口四表教学模型中的第 3、4 题：同表更新的派生表物化条件、同表插入的临时表隔离，以及“缺少记录”与“已有记录但 `score IS NULL`”的语义边界。

## 前提约定与输入隔离

教学表沿用 [数据库笔试复盘](/blog/legacy/note/zh-cn/database-written-test-review/) 的四表定义：`student(sno, sname, sage, ssex)`、`course(cno, cname, tno)`、`sc(sno, cno, score)`（联合主键 `(sno, cno)`，可空 `DECIMAL(5, 2)`）、`teacher(tno, tname)`。两条数据修改练习各自从相同初始数据出发，不把前一道题的修改结果当作后一道题的默认输入。

## 1. 同表 `UPDATE`：用 `GROUP BY` 派生表阻止合并

需求：把教师 `T001` 所授课程的成绩改为**各课程自身的平均分**（先按 `cno` 分组，不把不同课程混算成同一平均值）。

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

关键边界：

- 使用 `t.tno = 'T001'` 而不是教师姓名，避免“姓名唯一”的隐含前提。
- 过滤 `a.avg_score IS NOT NULL`，避免为整门课均无有效成绩的课程臆造分数。
- MySQL 对修改目标表并在子查询中读同一张表有额外限制。上述派生表包含 `GROUP BY` 与聚合函数，会阻止优化器把派生表合并进外层更新，使其按物化方式参与连接更新；但这不是可无条件套用到任意同表更新子查询的通用模板。
- 按上述写法，只要课程存在有效平均分，原本为 `NULL` 的成绩也会被替换；若业务要求保留未录入状态，需显式加上 `s.score IS NOT NULL`。

## 2. 同表 `INSERT ... SELECT`：用临时表固定平均分

需求：为缺少 `C002` 记录的学生补插记录，成绩取该课程现有平均分。

首先区分两种不同业务状态：

| 当前 `sc` 状态 | 语义判断 | 对应动作 |
| --- | --- | --- |
| 不存在 `(sno, 'C002')` 行 | 缺少该课程记录 | `INSERT` 新行 |
| 已有 `(sno, 'C002')` 行但 `score IS NULL` | 成绩未录入 | 走 `UPDATE` 逻辑，不能再插入重复行 |

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

采用临时表是为了避开 MySQL `INSERT ... SELECT` 的限制：目标表可以出现在主查询的 `FROM` 中，但不能直接出现在该查询的子查询中；因此不宜未经核对就把“同表求平均值的子查询”和“同表 `NOT EXISTS`”写进同一条 `INSERT`。同时，若课程全无记录或全部记录均为 `NULL`（`a.avg_score IS NULL`），`INSERT` 不会写入零分。

## 并发与一致性边界

联合主键 `(sno, cno)` 可以阻止重复插入，但不能自动让多条语句共享同一一致性快照。生产环境必须单独设计事务边界、隔离级别、冲突重试策略，以及平均分取哪个时间点的数据。

## 证据边界与未验证项

- **来源事实**：本页拆自 [数据库笔试复盘](/blog/legacy/note/zh-cn/database-written-test-review/) 第六节第 3、4 题，依据 `database-written-test-review` 快照及其中引用的 MySQL 8.4 `UPDATE`、`derived-table-optimization` 与 `INSERT ... SELECT` 文档。
- **未验证项**：本轮未在固定 MySQL 8.4 小版本实例上运行上述语句，派生表物化执行计划、唯一键冲突、全 `NULL` 课程以及并发重跑结果均未实测。

## 毕业检查

- 在固定 MySQL 8.4 小版本上运行第 3、4 题，确认 `EXPLAIN` 中派生表按物化执行而非错误合并
- 覆盖全 `NULL` 课程、已有 `NULL` 成绩行、空表及唯一键冲突四类边界用例
- 设计并执行双会话并发重跑对照，明确事务隔离级别下的快照与冲突行为，并与父页保持双向链接
