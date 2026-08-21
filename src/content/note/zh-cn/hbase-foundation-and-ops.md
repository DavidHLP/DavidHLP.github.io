---
title: HBase 基础、架构与运维：数据模型、表设计、Shell 与 Java API
timestamp: 2026-08-21 00:00:00+08:00
series: 大数据与存储
kind: concept
status: active
sources: ["ingest-hbase-foundation"]
related: [spark-bigdata-ecosystem, database-schema-drift, mysql-storage-and-deadlock]
tags: [HBase, BigData, DataModel, Architecture, Shell, JavaAPI]
description: 收敛 HBase 数据模型（逻辑/物理）、架构组件、表设计与运维操作，明确与 Redis/传统 RDBMS 的取舍。
toc: true
---

两仓库 18 篇 HBase 原文高度同源（Personal 与 Fuwari 的 9+9 内容基本一一对应，只是中英文与篇幅差异）。本页收敛为数据模型—架构—表设计—运维四段，删除重复章节，保留可复用概念。

## 核心机制

### 1. 数据模型：逻辑与物理分离

- 逻辑：`Table → RowKey → ColumnFamily:ColumnQualifier → Timestamp → Value`，稀疏、版本化。
- 物理：按 ColumnFamily 垂直切 Region，Region 按 RowKey 区间分布在 RegionServer；`HStore` 对应 Family，`StoreFile/HFile` 落盘，`MemStore` 内存缓冲，`WAL` 预写。
- 原文 `Hbase逻辑模型与物理模型详解.md` 与 `HBase-Logical-vs-Physical` 解释了同一行在物理上按 Family 分散存储。

### 2. 架构组件

| 组件         | 职责              | 边界                   |
| ------------ | ----------------- | ---------------------- |
| HMaster      | Region 分配、DDL  | 不在写读路径           |
| RegionServer | Region 托管、读写 | 热点取决于 RowKey 设计 |
| ZooKeeper    | 选主、元数据      | 新版本逐步弱化         |
| HDFS         | HFile/WAL 存储    | 依赖 HDFS 可用性       |

### 3. 表设计与运维

- RowKey：均匀散列、避免单调递增热点；Family 数宜少（1-2），Qualifier 可多。
- 运维：HBase Shell（`create/put/get/scan/disable/drop`）、Java API（`Admin/Table/Connection`）与 `HBase-Shell-Administration-Guide` 对应。

## 适用条件

- 宽表、稀疏、写多读少、需按 RowKey 前缀扫描与版本保留。
- 已有 HDFS/ZK 运维能力，或使用云托管 HBase。

## 不适用与风险

- 强事务、JOIN、二级索引、全文检索不是 HBase 强项。
- RowKey 设计不当导致 Region 热点，Family 过多放大 Flush/Compaction。
- 个人笔记的集群脚本（hadoop-hbase-spark）仅作本地验证，未在生产核验。

## 最小验证

1. 用 Shell 创建表、写入多版本，`scan` 验证时间戳与 Family 切分。
2. Java API 建/删表、批量 Put/Get，确认连接关闭与异常。
3. 调整 RowKey 前缀，观察 Region 分裂与热点。

## 证据与不确定性

- **来源事实**：`ingest-hbase-foundation` 收录 18 篇原文，含重复只是语言差异。
- **本页综合**：把分散章节收敛为模型—架构—设计三问。
- **未确认项**：HBase 版本（原文未固定）、ZK 依赖演进、与 Phoenix/二级索引集成未验证。

## 相关页面

- [spark-bigdata-ecosystem](/note/spark-bigdata-ecosystem)
- [database-schema-drift](/note/database-schema-drift)
- [mysql-storage-and-deadlock](/note/mysql-storage-and-deadlock)
