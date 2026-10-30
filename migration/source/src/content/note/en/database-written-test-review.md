---
title: "Database Written-Test Review: From SQL Semantics to Batch Data Processing"
timestamp: 2026-09-13 00:00:00+08:00
series: "Databases and Data Engineering"
kind: synthesis
status: provisional
sources: ["database-written-test-review"]
related: ["mysql-performance-troubleshooting", "mysql-storage-and-deadlock", "database-schema-drift", "spark-bigdata-ecosystem"]
tags: [数据库, SQL, Oracle, MySQL, Spark SQL, Kettle, ETL, 笔试复盘]
description: "A database written-test review as a verifiable chain of judgments: separate SQL semantics from dialects, handle NULLs, duplicates, and empty results, then bring Kettle and very large table operations down to sharding, recovery, reconciliation, and risk control."
toc: true
---

When reviewing a database written test, the easiest thing to keep is a list of answers. The conditions that make those answers valid are easier to lose: which rows a join keeps, how NULL participates in expressions, which SQL dialect an expression belongs to, and how to control cost, verify results, and handle failure as the data grows.

This review does not copy answers by question number. It reorganizes them into one reasoning chain: **restore the semantics first, confirm the dialect next, cover null and boundary cases, and only then discuss execution cost, recovery, and reconciliation.** Oracle-specific syntax is called out separately; the four-table exercises and large-table operations use **MySQL 8.4 / InnoDB** as their context; date expressions cover Spark SQL, Oracle, and MySQL separately.

## Review framework: every question should answer four things

A SQL statement that looks correct should answer at least these questions:

1. **Semantics**: which rows should remain, and what exactly is being compared or changed?
2. **Dialect**: which database or tool version owns the function, date format, or update restriction?
3. **Boundaries**: what happens with NULL, empty results, duplicates, year boundaries, and concurrency?
4. **Execution**: when the data gets large or a task fails, how do we limit cost, resume, and prove completeness?

These four questions explain why basic written-test concepts naturally connect to batch processing and very large tables: the former tests semantics, while the latter tests whether those semantics can survive real constraints.

## 1. Fundamentals: put each concept back in its proper layer

### What objects can SELECT reference?

In Oracle, tables and views can provide query data, while sequences can participate in expressions through pseudocolumns such as NEXTVAL and CURRVAL. An index is an access structure that helps the database find data; it cannot be used like an ordinary table or view by placing its name directly after FROM.[^1][^2]

Therefore, for a multiple-choice question listing “table, sequence, index, view,” the usual answer is **index**. Distinguish between “the database may use an index to execute a query” and “the query treats an index as a business data source.” They are not the same thing.

### Why can ABS(-45) not return -45?

Absolute value and rounding are different operations. For the integer -45, ceiling, floor, and rounding to the integer place leave the value unchanged; absolute value removes the sign.[^3][^4][^5][^6]

| Expression | Result | Interpretation |
| --- | ---: | --- |
| ABS(-45) | 45 | absolute value |
| CEIL(-45) | -45 | round upward |
| FLOOR(-45) | -45 | round downward |
| ROUND(-45) | -45 | round to the integer place |

### Database, DBMS, and changing a table structure

A database is an organized collection of data. A database management system, or **DBMS**, manages data storage, organization, and access. When a question asks for the core software of a database system, the answer is DBMS, not a database file or client tool.[^7]

Use ALTER TABLE to change an existing table structure. For example, this MySQL statement adds a column; it does not update the value of an existing row:[^8]

    ALTER TABLE student
    ADD COLUMN email VARCHAR(254);

These questions appear to test vocabulary, but they actually test object boundaries: a data collection, management software, an access structure, and a DDL operation cannot substitute for one another.

## 2. Joins: decide which rows survive before deciding how they match

Join questions contain two separate decisions: **which rows must be retained, and what condition defines a match**. An inner join retains only combinations satisfying the join condition; a left outer join retains every row from the left table; a right outer join retains every row from the right table. When an outer join has no match on one side, it supplies NULL values.[^9]

“An outer join must be an equality join” is incorrect. Equality, comparison, and range matching describe the join condition; inner and outer joins describe the row-retention rule. An outer join can also use a non-equality condition.[^9]

For example, to show every student and that student's C002 score, including students without a C002 record:

    SELECT s.sno, r.score
    FROM student AS s
    LEFT JOIN sc AS r
      ON r.sno = s.sno
     AND r.cno = 'C002';

The course condition is in ON, so it only limits which score rows may match. If it is moved to WHERE r.cno = 'C002', students without a matching row are filtered out because the right-side value is NULL; the query no longer retains every student.[^10]

My check is simple: whenever I see an outer join, I construct a row that cannot match and trace whether a later filter deletes it. This counterexample is safer than memorizing the definition of LEFT JOIN.

## 3. Cursors, field types, and constraints: do not mix state, storage, and validity

### Oracle cursors: opening a result set is not fetching a row

Here is a self-contained PL/SQL example:

    DECLARE
        CURSOR c_demo IS
            SELECT 1 AS n FROM dual;
    BEGIN
        OPEN c_demo;
        DBMS_OUTPUT.PUT_LINE(c_demo%ROWCOUNT);
        CLOSE c_demo;
    END;
    /

By explicit-cursor semantics, the output is **0**, not 1. ROWCOUNT is the number of rows already fetched, not the total number of rows in the result set. Immediately after OPEN, before the first FETCH, it is 0; it increases after a successful fetch.[^11]

The point is not to infer a runtime result from the number of rows in the source table. Follow the actual OPEN → FETCH → CLOSE state transitions. The 0 here is a result derived from official semantics, not a production log.

### CHAR and VARCHAR

In MySQL, CHAR expresses fixed-length character semantics, while VARCHAR expresses variable-length character semantics. The declared length is primarily a character length, not a promise of a fixed number of bytes; character set, actual content, and storage implementation all affect space usage. Trailing-space behavior also differs.[^12]

Choose the type from the data shape. Fixed-length codes may suit CHAR, while names and titles with visibly changing length may suit VARCHAR; this does not justify saying that CHAR is always faster. For text that may keep growing, evaluate TEXT, MEDIUMTEXT, and related types against an explicit upper bound instead of treating VARCHAR as unlimited.[^12][^13]

### DEFAULT is not a complete integrity constraint

Common integrity rules include PRIMARY KEY for row identity, FOREIGN KEY for references, UNIQUE for duplicate prevention, NOT NULL for rejecting nulls, and CHECK for conditions. In MySQL table definitions, DEFAULT supplies a default value; it should not be mixed up with those rules.[^14]

For example, these two parts have different roles:

    status VARCHAR(16) NOT NULL DEFAULT 'PENDING'

DEFAULT 'PENDING' decides what value is supplied by default; NOT NULL rejects a stored null. The default does not restrict the status field to a fixed set of business states.[^14]

Nor is “SQL has exactly five constraint types” a precise statement for every database. Oracle also documents REF constraints for object-relational scenarios. The answer should name the database and the scope being discussed.[^15]

## 4. Indexes and set operations: performance claims need query conditions

### Which fields are good index candidates?

“Frequently used in WHERE, JOIN, ORDER BY, or GROUP BY” is only a starting observation. It does not imply that every such field deserves its own index. Usefulness also depends on query combinations, selectivity, returned rows, composite-index order, and write-maintenance cost.[^16][^2]

For example:

    SELECT order_id, created_at
    FROM orders
    WHERE user_id = 1001
      AND status = 'PAID'
    ORDER BY created_at DESC
    LIMIT 20;

(user_id, status, created_at) can be a candidate composite index, but it must be checked against other queries and execution plans. A composite index's leading columns determine which queries it can support; the order cannot be chosen independently of the workload.[^17]

A complete answer is therefore: **start from frequent SQL, propose candidate indexes, verify them with plans and measurements, and weigh read benefit against write cost.** Without plans, data distribution, and write load, an index recommendation should not be presented as universal.

### UNION and UNION ALL

UNION removes duplicate result rows by default; UNION ALL preserves them. Deduplication applies to the **entire projected row**, not one selected field. If the result is (sno, cno), two rows for the same student and different courses are not duplicates.[^18]

When deduplication is unnecessary, UNION ALL can avoid needless work, but it is not valid to promise a fixed speedup in every query. Neither operator replaces a final ORDER BY; add explicit ordering when a stable display order matters.[^18]

## 5. Date expressions: identify the dialect before evaluating the result

When an expression contains date_format, trunc, and add_months, do not conclude from the names alone that it mixes incompatible syntax. In Spark SQL, these functions can be combined legally:[^19]

    -- Spark SQL
    SELECT date_format(
        trunc(add_months(current_date(), -1), 'MM'),
        'yyyy'
    ) AS previous_month_year;

The steps are: get today's date, move back one month, truncate to the first day of that month, and format it as a four-digit year. The result is **the year containing the previous month**, not “always the current year.” In January it belongs to the previous year; in other months it will normally still be the current year.[^19][^20]

The same intent in Oracle can be written as:

    -- Oracle
    SELECT TO_CHAR(
        TRUNC(ADD_MONTHS(CURRENT_DATE, -1), 'MM'),
        'YYYY'
    ) AS previous_month_year
    FROM dual;

This uses Oracle's month arithmetic, date truncation, and formatting functions.[^21][^22][^23]

In MySQL, extracting the year does not require truncating to the first day of the month:

    -- MySQL
    SELECT DATE_FORMAT(
        DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH),
        '%Y'
    ) AS previous_month_year;

MySQL uses %Y for the date format; do not copy another engine's yyyy or YYYY unchanged.[^24]

The reliable order is: **confirm the engine → check functions and format tokens → analyze the return type → test the year boundary.** The smallest counterexample is a current date in January, which verifies whether the result crosses into the previous year.

## 6. Four-table SQL: correct selection still needs null and duplicate handling

The exercises use these teaching tables:

    student(sno, sname, sage, ssex)  students
    course(cno, cname, tno)         courses
    sc(sno, cno, score)             enrollments and scores
    teacher(tno, tname)             teachers

Assume sno, cno, and tno are the corresponding primary keys; sc has a composite primary key (sno, cno); and scores use nullable DECIMAL(5, 2). Example course numbers are C001 and C002, and the teacher number is T001.

The four exercises are **independent**. Each data-changing exercise should start from the same initial test data; do not treat the previous exercise's mutation as the next exercise's default input.

### 1. Find student numbers whose C001 score is higher than C002

The two scores are separate rows for one student. A self-join puts them on one row for comparison:

    SELECT a.sno
    FROM sc AS a
    JOIN sc AS b
      ON b.sno = a.sno
    WHERE a.cno = 'C001'
      AND b.cno = 'C002'
      AND a.score > b.score;

The conditions show exactly what qualifies: both course records must exist and the first score must be strictly greater. A missing record, equal scores, or a comparison involving NULL does not satisfy the condition. The inner join and filters determine the result.[^9][^10]

### 2. Find students whose average score is above 60

    SELECT sno, AVG(score) AS avg_score
    FROM sc
    GROUP BY sno
    HAVING AVG(score) > 60;

AVG(score) ignores NULL by default. It does not automatically treat an absence, an unentered score, or an unselected course as zero. If every score for a student is NULL, the average is also NULL and does not pass > 60. Whether an absence counts as zero is a business rule that must be decided before writing the expression.[^25]

### 3. Set scores for one teacher's courses to each course's own average

The key phrase is **each course's own**: calculate an average grouped by cno, then update the matching courses. Do not combine all courses taught by the teacher into one average.

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

Using the teacher number avoids assuming that a name is unique. Excluding null averages avoids inventing a score for a course with no valid scores.

MySQL imposes extra restrictions when the target table is also read inside a subquery. The derived table here contains GROUP BY and an aggregate; those structures prevent it from being merged and make it participate through materialization. This is not a template that can be applied unconditionally to every same-table update subquery.[^26][^27]

As written, any existing NULL score in a course with a valid average is replaced. If the business rule says to preserve unentered scores, add s.score IS NOT NULL.

### 4. Add C002 records for students who do not have one

First define “no score for this course” as **no row for the course in sc**. A row that exists but has score IS NULL is a different case and requires an update rather than an insert, otherwise a duplicate row would be attempted.

The following uses a temporary table to fix the course average before a left join finds missing rows:

    -- MySQL 8.4; assume no concurrent writes in this exercise
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

This also avoids a boundary of MySQL INSERT ... SELECT: the target table may appear in the main query's FROM, but it cannot be read directly in a subquery of that query. Do not insert an unverified same-table average subquery and same-table NOT EXISTS into one statement.[^28]

The code implies several results: no course rows means no insert; a course with no valid scores means no insert; and a student who already has the course row, even with a null score, is not inserted again. An unknown average is not silently changed to zero.

Production code needs separate consistency and concurrency design. A composite primary key prevents duplicate rows, but it does not give several statements one shared snapshot. Retry behavior, transaction boundaries, and the point in time represented by the average must be explicit.

## 7. Kettle: throughput tuning and bulk extraction are different problems

### Locate the bottleneck before increasing concurrency

For Kettle / Pentaho Data Integration performance issues, split the pipeline into input, transformation, and output. Observe row counts, throughput, waiting, and resource usage at each step, then optimize the measured bottleneck. This is easier to verify than immediately increasing thread counts or the JVM heap.

**Input: reduce unnecessary reads.** Select only needed fields and push filters down to the database when possible. Check whether a setting such as “execute query for each input row” is enabled, because it can turn one batch read into many small queries. Table Input supports SQL parameters and per-row execution settings; they should match the task semantics.[^29]

**Transformation: measure per-row cost.** Repeated database queries, unnecessary type conversion, complex scripts, and large sorts deserve separate measurement. Caches, lazy conversion, and step copies are candidates, but first ensure that extra copies do not break ordering, grouping, or deduplication.[^30]

**Output: distinguish batch commits from transaction commits.** Table Output's Commit size controls how many inserts accumulate before a transaction is committed; Use batch update for inserts controls batched insert statements. They are not the same switch. Batch behavior also depends on driver support and other step settings, so verify that it actually takes effect.[^31]

A larger commit batch is not automatically better. Compare throughput, memory, redo work after failure, and target-database pressure rather than recording only the fastest single run.

### For a one-off bulk extraction, prioritize recovery and reconciliation

“Make one transformation faster” does not replace “design a reliable extraction job.” For a very large extraction, use bounded partitions and record each partition's range, state, output count, and retry count instead of making one long-running query responsible for everything.

Partitions can use stable primary-key ranges or fixed time windows, but their endpoints must be explicit so ranges neither overlap nor leave gaps. After a restart, the job should continue from the last confirmed completion. The target should tolerate retries through unique keys, idempotent writes, or a staging-area merge.

If source data continues to change, define which point in time the extraction represents. Recording only the maximum primary key cannot capture updates or deletes to older rows and cannot substitute for a consistent snapshot. A robust design considers the snapshot-to-incremental handoff and validates partition counts, key aggregates, and sampled content.

The standard is not “it completed once,” but “it resumes after interruption, repeated execution does not corrupt the result, and the final data can be explained as complete.”

## 8. Inserts, updates, and deletes on very large tables: narrow the work before controlling cost

For a table with billions of rows, I would not jump straight to “shard it” or “disable indexes.” First ask how many rows are affected, whether an index or partition can narrow the work, whether offline processing is allowed, whether the source is still being written, and what rollback and recovery the business requires.

For MySQL / InnoDB, the focus differs by operation:

| Operation | Candidate approach | Risks to control |
| --- | --- | --- |
| Large delete | Bounded, batched range deletes; evaluate rebuilding retained data for a high deletion ratio | Locks, logs, disk space, and recovery |
| Large update | Validate through a staging table, then batch a bounded joined update | Unique matching, lock contention, and transaction size |
| Large insert | Batch writes or an appropriate bulk-loading method | Constraint correctness, index maintenance, and target pressure |

These approaches must be checked against the actual conditions. MySQL documents LIMIT for single-table deletes, joined updates, and transaction/import strategies for InnoDB bulk loading; none is a universal large-table optimization SQL.[^32][^26][^33]

When the deletion ratio is very high, copying retained data and switching tables can be a candidate. I would treat it as a data migration: handle concurrent writes during copying, object dependencies, indexes and constraints, the cutover window, checksums, and rollback. A copy-and-rename snippet without a consistency plan is not a complete solution. MySQL also lists copying retained rows and switching tables as an option for specific large-delete scenarios.[^32]

Do not treat TRUNCATE as a faster DELETE that can always be rolled back. In MySQL, TRUNCATE TABLE implicitly commits, cannot be restored through an ordinary transaction rollback, and does not support a WHERE condition. It is suitable only when clearing the whole table and meeting the relevant constraints; it is not a blind replacement for online business deletion.[^34]

The execution rule is: verify correctness on a controlled range, then adjust batch size using lock waits, throughput, logs, and replication pressure. On an anomaly, pause or narrow the range instead of forcing the work forward with a larger transaction.

## Boundary of the conclusions: what this review does and does not prove

### Conclusions established here

- Join type and join condition are separate dimensions; an outer join's retention rule can be silently changed by filtering the right table in WHERE.
- NULL, empty results, duplicates, and year boundaries change intuitive answers and must appear in the reasoning.
- SQL dialect determines functions, format tokens, and same-table read/write restrictions; Oracle, MySQL, and Spark SQL examples cannot be exchanged without qualification.
- A bulk task is judged not only by one successful run, but by non-overlapping boundaries, recoverability, controlled retries, and reconciliation.

### Not proven by this article

- Example SQL does not replace execution-plan, data-distribution, lock-wait, or transaction validation in a concrete environment.
- Kettle caches, concurrency, step copies, and commit sizes were not benchmarked on one fixed PDI version and real dataset, so no multiplier such as “N times faster” can be claimed.
- The large-table approaches do not prove zero-downtime replication, cutover, rollback, foreign-key or trigger handling, or continuous-write behavior.
- The cursor example's 0 is an expected result from official semantics, not a log produced by this article's live execution.

### Conditions that still need confirmation

- Does “missing a course score” mean no sc row, or an existing row with score IS NULL? They require insert and update logic respectively.
- Does the business treat NULL as excluded from the average, and does an absence count as zero? These are business rules, not decisions that should be delegated to AVG's default behavior.
- Is the question about Oracle, MySQL, Spark SQL, or Kettle, and what exact version is involved?
- Is the data changing continuously, which consistency snapshot is required, and what retry and rollback behavior is allowed?

## Reusable checklist: what to do first next time

1. **Lock down the engine and version**: put functions, date formats, and DDL/DML restrictions back into a specific dialect.
2. **Draw the result boundary**: mark rows that must survive a join before writing the match condition.
3. **Construct counterexamples**: test at least one non-match, NULL, empty result, duplicate row, and year boundary.
4. **Separate missing from unknown**: no row, an existing row with an empty field, and a missing average are not the same case.
5. **Verify reads, updates, and inserts separately**: confirm the target table, subquery, temporary table, transaction boundary, and idempotency.
6. **Require evidence for performance claims**: cover the corresponding layer with plans, selectivity, throughput, waits, memory, and write cost.
7. **Design bulk-operation boundaries first**: no overlaps or gaps, recorded progress, pause, retry, idempotency, and reconciliation.
8. **State the evidence level**: distinguish official semantics, example-derived results, live execution results, and assumptions still awaiting validation.

After this review, I find it more useful to see database questions as three layers: **correct semantics, explicit dialect, and controlled execution**. Explaining why an answer remains valid outside the happy-path example is more valuable than memorizing one query.

## References

[^1]: Oracle Database 19c SQL Language Reference — Sequence Pseudocolumns. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Sequence-Pseudocolumns.html
[^2]: Oracle Database 19c Concepts — Indexes and Index-Organized Tables. https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/indexes-and-index-organized-tables.html
[^3]: Oracle Database 19c SQL Language Reference — ABS. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ABS.html
[^4]: Oracle Database 19c SQL Language Reference — CEIL. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CEIL.html
[^5]: Oracle Database 19c SQL Language Reference — FLOOR. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/FLOOR.html
[^6]: Oracle Database 19c SQL Language Reference — ROUND (number). https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROUND-number.html
[^7]: Oracle Database 19c Concepts — Introduction to Oracle Database. https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/introduction-to-oracle-database.html
[^8]: MySQL 8.4 Reference Manual — ALTER TABLE Statement. https://dev.mysql.com/doc/refman/8.4/en/alter-table.html
[^9]: Oracle Database 19c SQL Language Reference — Joins. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html
[^10]: MySQL 8.4 Reference Manual — Outer Join Simplification. https://dev.mysql.com/doc/refman/8.4/en/outer-join-simplification.html
[^11]: Oracle AI Database PL/SQL Language Reference — Cursors Overview. https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/cursors-overview.html
[^12]: MySQL 8.4 Reference Manual — The CHAR and VARCHAR Types. https://dev.mysql.com/doc/refman/8.4/en/char.html
[^13]: MySQL 8.4 Reference Manual — The BLOB and TEXT Types. https://dev.mysql.com/doc/refman/8.4/en/blob.html
[^14]: MySQL 8.4 Reference Manual — CREATE TABLE Statement. https://dev.mysql.com/doc/refman/8.4/en/create-table.html
[^15]: Oracle Database 19c SQL Language Reference — constraint. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/constraint.html
[^16]: MySQL 8.4 Reference Manual — How MySQL Uses Indexes. https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html
[^17]: MySQL 8.4 Reference Manual — Multiple-Column Indexes. https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html
[^18]: MySQL 8.4 Reference Manual — Set Operations with UNION, INTERSECT, and EXCEPT. https://dev.mysql.com/doc/refman/8.4/en/set-operations.html
[^19]: Apache Spark 3.5.7 — Built-in Functions. https://spark.apache.org/docs/3.5.7/api/sql/index.html
[^20]: Apache Spark 3.5.7 — Datetime Patterns. https://spark.apache.org/docs/3.5.7/sql-ref-datetime-pattern.html
[^21]: Oracle Database 19c SQL Language Reference — ADD_MONTHS. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ADD_MONTHS.html
[^22]: Oracle Database 19c SQL Language Reference — TRUNC (date). https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TRUNC-date.html
[^23]: Oracle Database 19c SQL Language Reference — TO_CHAR (datetime). https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_CHAR-datetime.html
[^24]: MySQL 8.4 Reference Manual — Date and Time Functions. https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html
[^25]: MySQL 8.4 Reference Manual — Aggregate Function Descriptions. https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html
[^26]: MySQL 8.4 Reference Manual — UPDATE Statement. https://dev.mysql.com/doc/refman/8.4/en/update.html
[^27]: MySQL 8.4 Reference Manual — Optimizing Derived Tables, View References, and Common Table Expressions with Merging or Materialization. https://dev.mysql.com/doc/refman/8.4/en/derived-table-optimization.html
[^28]: MySQL 8.4 Reference Manual — INSERT ... SELECT Statement. https://dev.mysql.com/doc/refman/8.4/en/insert-select.html
[^29]: Pentaho Data Integration — Table Input. https://docs.pentaho.com/pdia-data-integration/pdi-transformation-steps-reference-overview/table-input
[^30]: Pentaho Data Integration — Performance Tips. https://docs.pentaho.com/pdia-admin/optimize-the-pentaho-system/performance-tuning/pentaho-data-integration-performance-tips
[^31]: Pentaho Data Integration — Table Output. https://docs.pentaho.com/pdia-data-integration/pdi-transformation-steps-reference-overview/table-output
[^32]: MySQL 8.4 Reference Manual — DELETE Statement. https://dev.mysql.com/doc/refman/8.4/en/delete.html
[^33]: MySQL 8.4 Reference Manual — Bulk Data Loading for InnoDB Tables. https://dev.mysql.com/doc/refman/8.4/en/optimizing-innodb-bulk-data-loading.html
[^34]: MySQL 8.4 Reference Manual — TRUNCATE TABLE Statement. https://dev.mysql.com/doc/refman/8.4/en/truncate-table.html
