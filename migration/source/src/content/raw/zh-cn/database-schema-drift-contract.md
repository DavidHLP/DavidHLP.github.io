---
title: "Flyway 13.2.0 × MySQL 8.4 schema drift 诊断契约"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-docs-and-minimal-experiment
sourceUrl: "https://documentation.red-gate.com/fd/validate-277578898.html"
immutable: true
tags: [Flyway, MySQL, SchemaDrift, Migration, Validate, Repair]
description: "以 Flyway 13.2.0（tag flyway-13.2.0）官方文档与固定源码、MySQL 8.4 官方参考手册及官方 mysql:8.4 镜像最小实验，固定 migration history、实际 schema 与应用查询三者漂移的诊断与修复边界。不含私有 schema、会话、凭证或本机路径。"
---

# Flyway 13.2.0 × MySQL 8.4 schema drift 诊断契约

本快照只收录可公开复现的字段级/行为级事实。实验部分在一次性临时容器中执行，未触碰任何私有环境。

## 版本与固定点

| 组件 | 固定点 |
| --- | --- |
| Flyway Engine | `13.2.0`；GitHub tag `flyway-13.2.0` = commit `5c5d90da337194f8bd2423e8e2e8e3df493d9c8c`；发布于 2026-08-06 |
| Flyway CLI（未执行） | `flyway-commandline-13.2.0-linux-x64.tar.gz`，发布页公布的 sha256 `5ec2535d200685d7af8e361e9eda9d71ce0080be9f36f655924d3da41daf5e97` |
| 文档时点 | validate / repair / migrate 页面均标注 "Page last updated 06 August 2026"，JSON 示例中 `flywayVersion: "13.2.0"` |
| MySQL Server | 官方镜像 `mysql:8.4` 实测 `SELECT VERSION()` = `8.4.11`（一次性容器） |
| MySQL 文档时点 | Error Reference "Document generated on: 2026-08-07 (revision: 84829)"；Refman 8.4 §15.1.1 |

## 来源列表（一手资料）

- Flyway 文档：https://documentation.red-gate.com/fd/validate-277578898.html 、/fd/repair-277578892.html 、/fd/migrate-277578887.html 、/fd/flyway-schema-history-table-273973417.html 、/fd/migrations-271585107.html 、/fd/reference/exit-codes-and-error-codes/validate-error-codes 、/fd/flyway-out-of-order-setting-277579015.html 、/fd/feature-summary-165740620.html 、/fd/drift-analysis-275218476.html
- Flyway 源码（tag `flyway-13.2.0`，即 commit `5c5d90da`）：
  - `flyway-core/src/main/java/org/flywaydb/core/internal/command/DbValidate.java`
  - `flyway-core/src/main/java/org/flywaydb/core/internal/command/DbRepair.java`
  - `flyway-core/src/main/java/org/flywaydb/core/internal/command/DbMigrate.java`
  - 发布元数据：https://api.github.com/repos/flyway/flyway/releases/tag/flyway-13.2.0
- MySQL 8.4：https://dev.mysql.com/doc/refman/8.4/en/atomic-ddl.html （§15.1.1）；https://dev.mysql.com/doc/mysql-errors/8.4/en/server-error-reference.html （错误号/SQLSTATE 由实验实测确认）

## 最小事实

### Flyway 校验与修复语义（文档 + 固定源码，未跑 CLI 实验）

- `validate`：把「已应用的迁移」与「本地可解析的迁移」做比对。官方原文：fails if "differences in migration names, types or checksums are found; versions have been applied that aren't resolved locally anymore; versions have been resolved that haven't been applied yet"。SQL 迁移执行时存 CRC32 checksum，validate 比对本地与库中记录。
- `DbValidate.validate()` 只经由 `MigrationInfoServiceImpl`（schema history vs resolved migrations）产出 `invalidMigrations` 列表；**不查询实际 schema 的用户表**。因此 validate 不是"实际 schema vs 期望 schema"比对。
- validate 失败错误码（官方 error codes 页）：`CHECKSUM_MISMATCH`（已应用与本地 checksum 不同）、`DESCRIPTION_MISMATCH`、`TYPE_MISMATCH`、`APPLIED_VERSIONED_MIGRATION_NOT_RESOLVED`（已应用但本地找不到）、`RESOLVED_VERSIONED_MIGRATION_NOT_APPLIED`（本地有但未应用；官方方案：需要时启用 `outOfOrder`）、`FAILED_VERSIONED_MIGRATION`、`SCHEMA_DOES_NOT_EXIST`、`VALIDATE_ERROR`（总入口，附 `invalidMigrations` 明细）。
- `repair`（文档）：删除失败迁移记录（"User objects left behind must still be cleaned up manually"）；把已应用迁移的 checksum/description/type 与本地重新对齐；把找不到的迁移标记为 `deleted`。`DbRepair.repair()` 源码顺序：`removeFailedMigrations` → `deleteMissingMigrations`（MISSING_SUCCESS/MISSING_FAILED/FUTURE_SUCCESS/FUTURE_FAILED 从历史表删除）→ `alignAppliedMigrationsWithResolvedMigrations`（`schemaHistory.update`）。数据库不支持 DDL 事务时（MySQL 属于此类）打印："Manual cleanup of the remaining effects of the failed migration may still be required."。**repair 只改 schema history 表，不回放、不撤销任何 DDL。**
- `outOfOrder`（官方设置页，默认 `false`）："If you already have versions 1.0 and 3.0 applied, and now a version 2.0 is found, it will be applied too instead of being ignored." 历史表状态机中乱序成功执行的迁移状态为 `Out of Order`："Rerunning the entire migration history might produce different results!"。
- 缺失/未来迁移状态：`Missing`（已成功但本地无法解析）、`Future`（成功但版本高于本地最高）、`Deleted`（repair 标记）。`migrate` 前默认会 validate（`validateOnMigrate` 默认 true，见配置命名空间页）。
- **漂移检测边界（官方）**：drift analysis 概念页——"Flyway can check a target environment for drift, validating that no unexpected changes have been made since Flyway was last used to deploy"；快照存于 Flyway snapshot history table。migrate 页面："Migration deployment will naturally ignore any drift since it's just running the versioned migration scripts." Feature Summary 表格中 **Drift detection 与 Save schema snapshots 均为 Flyway Enterprise 专属**；社区版 validate 不检测外部 schema 修改。

### MySQL 8.4 行为（官方镜像 8.4.11 实验实测）

| Probe | 结果 |
| --- | --- |
| `ALTER TABLE users ADD COLUMN email VARCHAR(100)` 第二次执行（列已存在） | `ERROR 1060 (42S21): Duplicate column name 'email'`（ER_DUP_FIELDNAME） |
| `SELECT no_such_col FROM users` | `ERROR 1054 (42S22): Unknown column 'no_such_col' in 'field list'`（ER_BAD_FIELD_ERROR） |
| `ALTER TABLE users DROP COLUMN no_such_col` | `ERROR 1091 (42000): Can't DROP 'no_such_col'; check that column/key exists`（未知列出现在 DROP 子句时是 1091，不是 1054） |
| `ALTER TABLE users ADD COLUMN c2 INT, ADD COLUMN email INT`（第二个子句重复列） | 报 1060；随后 `SHOW COLUMNS` 确认 `c2` 未被加入 → 单条 ALTER TABLE 语句级原子回滚 |
| 不经任何迁移直接 `ALTER TABLE users ADD COLUMN ext_drift INT` | 成功，无任何 Flyway 记录；外部漂移可静默发生 |

- 官方文档印证（Refman 8.4 §15.1.1 原子 DDL）："The operation is either committed ... or is rolled back, even if the server halts during the operation"；"Atomic DDL is not transactional DDL. DDL statements ... implicitly end any transaction"；仅 InnoDB 支持。因此**单条** ALTER 语句失败不留部分列，但同一迁移文件里**多条** DDL 语句之间没有事务（MySQL DDL 隐式提交），前句成功、后句失败时前句对象会残留——这正是 Flyway "rolls it back if possible"（官方 Migrations 页）在 MySQL 上的真实边界。

## 漂移诊断矩阵（history / schema / query 三视图）

| 漂移形态 | 表象 | 社区版 detect？ | 处置/边界 |
| --- | --- | --- | --- |
| 已应用迁移文件被本地修改 | 本地 CRC32 ≠ 历史表 checksum | `validate`/`migrate` 失败 `CHECKSUM_MISMATCH` | 改回原文件，或 `repair` 对齐历史记录（不重放） |
| 已应用迁移从 locations 消失 | 历史表记录本地无法解析 | `APPLIED_VERSIONED_MIGRATION_NOT_RESOLVED` | `repair` 标记 `deleted`；对象需自行处理 |
| 新迁移版本低于当前已应用版本 | 本地有、未应用 | `RESOLVED_VERSIONED_MIGRATION_NOT_APPLIED`（默认失败） | `outOfOrder=true` 才执行；成功后状态 `Out of Order` |
| 外部直改实际 schema（hotfix/手工 ALTER） | 实际 schema ≠ 迁移脚本产出 | **不检测**（validate 不比对实际 schema；文档：migration deployment 天然忽略 drift） | 企业版 snapshot + drift analysis；社区版需自建比对 |
| 应用查询引用已删/不存在的列 | 查询运行时失败 | 与 Flyway 无关 | MySQL `ERROR 1054 (42S22)`（引用场景）/ `1091`（DROP 场景） |
| 迁移重复加列 | 迁移执行失败 | 失败迁移记录 `success=0` | MySQL `ERROR 1060 (42S21)`；单条 ALTER 原子回滚；`repair` 删失败记录，对象残留手动清理 |
| 迁移中途失败（多语句） | 前句对象残留、后句报错 | 失败记录 `success=0`；MySQL 无 DDL 事务 | `repair` 只清历史记录，**不是回滚**；需人工补齐/清理残留 |

## 可重复验证

MySQL 侧（一次性容器，口令与端口仅为本地临时值）：

```sh
docker run -d --name fw-exp-mysql -e MYSQL_ROOT_PASSWORD=<临时容器口令> \
  -e MYSQL_DATABASE=driftdb -p 127.0.0.1:33061:3306 mysql:8.4
docker exec fw-exp-mysql env MYSQL_PWD=<临时容器口令> mysql -uroot driftdb \
  -e "CREATE TABLE users (id BIGINT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL);"
docker exec fw-exp-mysql env MYSQL_PWD=<临时容器口令> mysql -uroot driftdb \
  -e "ALTER TABLE users ADD COLUMN email VARCHAR(100); ALTER TABLE users ADD COLUMN email VARCHAR(100);"
docker exec fw-exp-mysql env MYSQL_PWD=<临时容器口令> mysql -uroot driftdb \
  -e "ALTER TABLE users ADD COLUMN c2 INT, ADD COLUMN email INT; SHOW COLUMNS FROM users;"
```

期望：第二次加列报 1060；多子句 ALTER 报 1060 且 `c2` 不在列清单中。

Flyway 侧（文档契约复核，未在本快照执行 CLI）：
1. 取 tag `flyway-13.2.0`（commit `5c5d90da`）源码读 `DbValidate.java`/`DbRepair.java`，核对上述语义与日志文案。
2. 对照官方页面 validate/repair/outOfOrder/validate-error-codes 的失败条件、错误码与修复动作。
3. CLI 二进制核验：发布页公布的 linux-x64 sha256 `5ec2535d200685d7af8e361e9eda9d71ce0080be9f36f655924d3da41daf5e97`。

## 边界与未证明

- **Flyway 行为为"文档 + 固定源码契约"，本次快照未跑 Flyway CLI 实验**（官方镜像拉取超时）。checksum 不匹配、repair 对齐、outOfOrder、缺失迁移等语句级输出文本未实测；语义以上述官方页面与固定 commit 源码为准。
- "同一版本存在多个迁移文件"（duplicate version）的具体报错文本与错误码**未固定**：validate 页面仅列出 name/type/checksum 差异、已应用未解析、已解析未应用三类失败条件，未单列重复版本条目；不声称其具体错误文本。
- `validateOnMigrate` 默认值：本文档按配置命名空间页存在该设置推断默认开启，未在快照内读取该页面原文，标为 [INFERENCE]。
- 未证明 Flyway 社区版能自动检测任何"外部直接修改实际 schema"的漂移；官方文档明确 drift detection/快照为 Enterprise 能力，且迁移部署天然忽略漂移。
- 实验仅覆盖 8.4.11（InnoDB、无 DDL 事务）单表场景；不涵盖分区、外键级联、复制拓扑或其它存储引擎。
