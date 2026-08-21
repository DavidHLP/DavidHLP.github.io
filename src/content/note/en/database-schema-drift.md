---
title: "Database Schema Drift: Locating with the history, schema, and query Views"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["database-schema-drift-contract"]
related: ["mysql-performance-troubleshooting", "multi-service-readiness", "microservice-data-ownership"]
tags: ["Flyway", "MySQL", "Schema Drift", "Migration", "Database", "Troubleshooting"]
description: "Explains why Flyway validate cannot replace an actual Schema check, and uses the three views of migration history, actual schema, and application query to distinguish checksum drift, external DDL, Unknown column, and residue from a failed migration."
toc: true
---

**Conclusion first**: Flyway Community's `validate` compares the "applied migration history" with "locally resolvable migrations", not the "actual database schema" with the "expected schema". When you hit `Unknown column`, a duplicate column addition, or a failed migration, you must check all three views — history, schema, and query — at the same time; running only `repair` may restore consistency to the history table but will not replay, undo, or clean up DDL.

## Applicable versions and evidence strength

This page is pinned to Flyway `13.2.0` (tag `flyway-13.2.0`, commit `5c5d90da`) and MySQL `8.4.11` in the official `mysql:8.4` image:

- Flyway semantics come from the official documentation and the pinned source; this batch did not successfully run the Flyway CLI, so specific CLI output is not treated as verified fact.
- MySQL `1060`, `1054`, `1091`, the atomic rollback of a single multi-clause `ALTER TABLE`, and external DDL drift were measured with one-off containers.
- Other Flyway/MySQL major versions, storage engines, and replication topologies must be re-verified.

## The three views cannot replace one another

| View              | Question answered                                                           | Minimal check                                             | What it cannot see                            |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| migration history | Which migrations are recorded as applied, failed, missing, or out of order? | `flyway info`, `flyway validate`, schema history table    | External DDL not run through Flyway           |
| actual schema     | What exactly are the current tables, columns, and indexes?                  | `SHOW CREATE TABLE`, `SHOW COLUMNS`, `information_schema` | What the application code actually references |
| application query | Which object does the failing SQL reference, and in which clause?           | Minimal repro SQL, error code and SQLSTATE                | Why the object reached its current state      |

Therefore: `validate` passing does not prove there is no schema drift; a column existing in the schema does not prove that every application instance's queries and serializers have been upgraded; and a query error certainly cannot by itself prove that a migration was never executed.

## Flyway's real boundaries

### `validate`

`validate` compares applied migrations with locally resolved migrations: it fails when names, types, or checksums differ, when an applied migration has disappeared locally, or when a local migration has not yet been applied. SQL migration checksums use CRC32.

In the pinned source, `DbValidate` checks history and resolved migrations through `MigrationInfoService` and does not read user table structures. So an external statement such as:

```sql
ALTER TABLE users ADD COLUMN ext_drift INT;
```

can change the actual schema without generating migration history; Community `validate` will not automatically report drift on that basis. Official schema snapshot/drift analysis is an Enterprise capability.

### `repair`

`repair` can delete failed records, align checksum/description/type, and mark missing migrations as deleted; it only fixes history:

- it does not re-run migrations;
- it does not undo executed DDL;
- it does not remove objects left behind by a failed migration;
- when MySQL provides no DDL transaction, manual review and cleanup are still needed.

So do not treat `repair` as a rollback. First confirm the actual schema and the target state, then decide whether to restore the original migration, write a forward-fix migration, or clean up manually in a controlled window.

### `outOfOrder`

`outOfOrder` defaults to `false`. For example, if `1.0` and `3.0` have been applied and `2.0` appears later, it is only executed and recorded as `Out of Order` once the flag is enabled. It can make "replay from scratch" and "progressive upgrade of a historical environment" produce different results, so verify against both an empty database and an upgraded database first.

## Route error codes by SQL context first

Minimal experiments on MySQL 8.4.11 give:

| Phenomenon                                           | Error                                             | Meaning                                                                             |
| ---------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ADD COLUMN email` again                             | `1060 (42S21) Duplicate column name`              | The migration ran twice, or the column was already created by an external operation |
| `SELECT no_such_col ...`                             | `1054 (42S22) Unknown column ... in 'field list'` | The query references a column that does not exist                                   |
| `DROP COLUMN no_such_col`                            | `1091 (42000) Can't DROP ...`                     | The DROP target does not exist; not 1054                                            |
| A later clause of one `ALTER TABLE` repeats a column | `1060`, the whole statement rolls back            | A single InnoDB DDL statement is atomic                                             |

"Single DDL is atomic" does not mean "migration file is transactional". MySQL DDL commits implicitly: when the first DDL in the same migration file succeeds and the second fails, the first may persist while Flyway history records a failure. In that case `repair` deleting the failed record will not clean up the object left by the first statement either.

## Minimal diagnostic sequence

1. **Pin the failing SQL and error code**: distinguish SELECT, ADD, and DROP; do not classify every "column problem" as 1054.
2. **Look at history**: confirm version, success, checksum, description, and state; running `validate` only judges migration history consistency.
3. **Look at the actual schema**: use `SHOW CREATE TABLE`/`SHOW COLUMNS` to verify columns, indexes, and constraints, and find changes outside history.
4. **Compare against the migration files**: confirm whether the same version was rewritten, is missing, is out of order, or contains multiple non-transactional DDL statements.
5. **Choose a forward fix**: in production, prefer adding a new migration that advances the actual state to a single target; only run `repair` when the history records themselves are confirmed wrong.
6. **Dual-path verification**: migrate an empty database from scratch once, upgrade an existing database from the current version once, then run the application's minimal query.

## Minimal MySQL reproduction

The following is only for a one-off local container; do not reuse `TEMP_PASSWORD` in a real environment:

```bash
docker run -d --name schema-drift-mysql \
  -e MYSQL_ROOT_PASSWORD=TEMP_PASSWORD \
  -e MYSQL_DATABASE=driftdb mysql:8.4

# Wait until mysqld inside the container truly accepts connections; docker run -d only proves the container started.
until docker exec -e MYSQL_PWD=TEMP_PASSWORD schema-drift-mysql \
  mysqladmin -uroot ping --silent; do sleep 1; done

docker exec -e MYSQL_PWD=TEMP_PASSWORD schema-drift-mysql \
  mysql -uroot driftdb -e \
  "CREATE TABLE users (id BIGINT PRIMARY KEY); ALTER TABLE users ADD COLUMN email VARCHAR(100);"

docker exec -e MYSQL_PWD=TEMP_PASSWORD schema-drift-mysql \
  mysql -uroot driftdb -e \
  "ALTER TABLE users ADD COLUMN c2 INT, ADD COLUMN email INT; SHOW COLUMNS FROM users;"

docker rm -f schema-drift-mysql
```

In the second command the duplicate column is expected to report `1060`, and `c2` is not in the column list. This experiment only proves MySQL-side behavior; Flyway behavior should still be exercised on an isolated database at the target version by running `info`, `validate`, and `migrate`.

## Evidence and uncertainty

- **Source facts**: `database-schema-drift-contract` pins the Flyway documentation/source and the MySQL 8.4.11 experiments, supporting the validate/repair/outOfOrder boundaries and the error code matrix.
- **This page's synthesis**: organizes migration history, actual schema, and application query into a three-view diagnostic method, and gives the forward-fix order.
- **Unconfirmed**: no Flyway CLI was actually run in this batch; the exact error text for a duplicate version, partitioning/foreign-key/replication scenarios, other storage engines, and other major versions are not verified.

## Related pages

- [MySQL performance troubleshooting: symptom → metric → layer → safe mitigation](/en/note/mysql-performance-troubleshooting)
- [Multi-service startup readiness: running, ready, and dependency propagation](/en/note/multi-service-readiness)
