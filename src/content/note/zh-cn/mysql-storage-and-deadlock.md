---
title: MySQL 存储引擎与死锁检测
timestamp: 2026-08-21 00:00:00+08:00
series: 大数据与存储
kind: concept
status: active
sources: ["ingest-mysql-storage"]
related: [mysql-performance-troubleshooting, database-schema-drift, multi-service-readiness]
tags: [MySQL, StorageEngine, InnoDB, Deadlock]
description: 区分存储引擎能力与死锁检测路径，提供存储选型与排障的最小判断。
toc: true
---

MySQL 3 篇原文以存储引擎与死锁为主：`存储引擎.md`、`基础面试题.md` 与 `checkmysqldeadlock.md`。本页区分引擎能力与排障路径。

## 核心机制

- **存储引擎**：InnoDB（行锁、MVCC、崩溃恢复）vs MyISAM（表锁、无事务）；原文含存储引擎对比图。
- **死锁检测**：`checkmysqldeadlock.md` 给出 `SHOW ENGINE INNODB STATUS`、`information_schema` 与 `performance_schema` 的排查步骤。

## 适用条件

- 事务与并发写用 InnoDB；只读归档可评估 MyISAM/Archive。

## 不适用与风险

- MySQL 版本（5.7 vs 8.0）差异大，死锁日志格式与参数有漂移。

## 最小验证

1. 建表指定引擎，对比锁与事务行为。
2. 造交叉加锁死锁，取 `INNODB STATUS` 复盘。

## 证据与不确定性

- **来源事实**：`ingest-mysql-storage` 收录 3 篇原文。
- **本页综合**：把引擎选型与死锁收敛为最小判断。
- **未确认项**：MySQL 版本、参数与线上配置需复核。

## 相关页面

- [mysql-performance-troubleshooting](/note/mysql-performance-troubleshooting)
- [database-schema-drift](/note/database-schema-drift)
- [multi-service-readiness](/note/multi-service-readiness)
