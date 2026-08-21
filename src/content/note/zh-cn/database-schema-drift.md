---
title: "数据库 Schema 漂移：用 history、schema 与 query 三视图定位"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java 基础与后端调优"
kind: concept
status: active
sources: ["database-schema-drift-contract"]
related: ["mysql-performance-troubleshooting", "multi-service-readiness", "microservice-data-ownership"]
tags: ["Flyway", "MySQL", "Schema Drift", "Migration", "Database", "Troubleshooting"]
description: "说明 Flyway validate 为什么不能替代实际 Schema 检查，并用 migration history、实际 schema 与应用 query 三个视图区分 checksum 漂移、外部 DDL、Unknown column 和失败迁移残留。"
toc: true
---

**结论优先**：Flyway Community 的 `validate` 比较的是“已应用 migration history”和“本地可解析 migration”，不是“实际数据库 schema”和“期望 schema”。遇到 `Unknown column`、重复加列或迁移失败时，必须同时检查 history、schema、query 三个视图；只运行 `repair` 可能让历史表恢复一致，却不会回放、撤销或清理 DDL。

## 适用版本与证据强度

本页固定在 Flyway `13.2.0`（tag `flyway-13.2.0`，commit `5c5d90da`）与官方 `mysql:8.4` 镜像中的 MySQL `8.4.11`：

- Flyway 语义来自官方文档和固定源码；本批未成功运行 Flyway CLI，因此具体 CLI 输出不作为已验证事实。
- MySQL `1060`、`1054`、`1091`、单条多子句 `ALTER TABLE` 原子回滚与外部 DDL 漂移，已用一次性容器实测。
- 其他 Flyway/MySQL 大版本、存储引擎和复制拓扑必须重新验证。

## 三个视图不能互相替代

| 视图              | 回答的问题                                 | 最小检查                                                  | 看不到什么             |
| ----------------- | ------------------------------------------ | --------------------------------------------------------- | ---------------------- |
| migration history | 哪些迁移被记录为已应用、失败、缺失或乱序？ | `flyway info`、`flyway validate`、schema history table    | 未经 Flyway 的外部 DDL |
| actual schema     | 当前表、列、索引究竟是什么？               | `SHOW CREATE TABLE`、`SHOW COLUMNS`、`information_schema` | 应用代码实际引用了什么 |
| application query | 失败 SQL 引用了哪个对象、在哪个子句？      | 最小复现 SQL、异常码与 SQLSTATE                           | 对象为何形成当前状态   |

因此：`validate` 通过不能证明没有 schema drift；schema 中有列也不能证明所有应用实例的查询和 serializer 已升级；查询报错更不能直接证明迁移未执行。

## Flyway 的真实边界

### `validate`

`validate` 比较已应用迁移与本地 resolved migrations：名称、类型、checksum 不同，已应用迁移在本地消失，或本地迁移尚未应用时会失败。SQL migration 的 checksum 使用 CRC32。

固定源码 `DbValidate` 经 `MigrationInfoService` 检查 history 与 resolved migrations，不读取用户表结构。因此外部执行：

```sql
ALTER TABLE users ADD COLUMN ext_drift INT;
```

可以改变实际 schema，却不生成 migration history；Community `validate` 不会据此自动报 drift。官方的 schema snapshot/drift analysis 是 Enterprise 能力。

### `repair`

`repair` 可删除失败记录、对齐 checksum/description/type、把缺失 migration 标为 deleted；它只修 history：

- 不重新执行 migration；
- 不撤销已执行 DDL；
- 不删除失败 migration 遗留的对象；
- MySQL 不提供 DDL transaction 时，仍需人工核对和清理。

因此不要把 `repair` 当回滚。先确认实际 schema 与目标状态，再决定恢复原 migration、写一条向前修复 migration，还是在受控窗口手工清理。

### `outOfOrder`

`outOfOrder` 默认 `false`。例如已应用 `1.0` 与 `3.0`，后来出现 `2.0`，只有启用后才会执行并记录为 `Out of Order`。它会让“从零重放”和“历史环境逐步升级”可能得到不同结果，应先在空库与升级库各验证一次。

## 错误码先按 SQL 上下文分流

MySQL 8.4.11 最小实验得到：

| 现象                                | 错误                                              | 含义                               |
| ----------------------------------- | ------------------------------------------------- | ---------------------------------- |
| 再次 `ADD COLUMN email`             | `1060 (42S21) Duplicate column name`              | 迁移重复执行，或列已由外部操作创建 |
| `SELECT no_such_col ...`            | `1054 (42S22) Unknown column ... in 'field list'` | 查询引用不存在的列                 |
| `DROP COLUMN no_such_col`           | `1091 (42000) Can't DROP ...`                     | DROP 的对象不存在；不是 1054       |
| 一个 `ALTER TABLE` 的后续子句重复列 | `1060`，整条语句回滚                              | 同一条 InnoDB DDL 语句原子         |

“单条 DDL 原子”不等于“migration 文件事务化”。MySQL DDL 隐式提交：同一 migration 文件中的第一条 DDL 成功、第二条失败时，第一条可能保留，而 Flyway history 记录失败。此时 `repair` 删除失败记录也不会清理第一条留下的对象。

## 最小诊断顺序

1. **固定失败 SQL 与错误码**：区分 SELECT、ADD、DROP，不要把所有“列问题”都归为 1054。
2. **看 history**：确认版本、success、checksum、description 与 state；运行 `validate` 只判断 migration history 一致性。
3. **看 actual schema**：用 `SHOW CREATE TABLE`/`SHOW COLUMNS` 核对列、索引和约束，找 history 之外的变化。
4. **对照 migration 文件**：确认同一版本是否被改写、缺失、乱序或包含多条非事务 DDL。
5. **选择向前修复**：生产环境优先新增 migration，把实际状态推进到唯一目标；只有确认历史记录本身错误时才运行 `repair`。
6. **双路径验证**：空库从零迁移一次，已有库从当前版本升级一次，再执行应用最小查询。

## 最小 MySQL 复现

以下只用于一次性本地容器，`TEMP_PASSWORD` 不得复用于真实环境：

```bash
docker run -d --name schema-drift-mysql \
  -e MYSQL_ROOT_PASSWORD=TEMP_PASSWORD \
  -e MYSQL_DATABASE=driftdb mysql:8.4

# 等待容器内 mysqld 真正接受连接；docker run -d 只证明容器已启动。
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

期望第二个命令中的重复列报 `1060`，且 `c2` 不在列清单中。这个实验只证明 MySQL 侧行为；Flyway 行为仍应在目标版本的隔离数据库上另跑 `info`、`validate`、`migrate`。

## 证据与不确定性

- **来源事实**：`database-schema-drift-contract` 固定 Flyway 文档/源码和 MySQL 8.4.11 实验，支持 validate/repair/outOfOrder 边界与错误码矩阵。
- **本页综合**：把 migration history、actual schema、application query 组织为三视图诊断法，并给出向前修复顺序。
- **未确认项**：本批没有 Flyway CLI 实跑；duplicate-version 的具体错误文本、分区/外键/复制场景、其他存储引擎与其他大版本均未验证。

## 相关页面

- [MySQL 性能排查：现象→指标→定位层→安全缓解](/note/mysql-performance-troubleshooting)
- [多服务启动就绪：running、ready 与依赖传播](/note/multi-service-readiness)
