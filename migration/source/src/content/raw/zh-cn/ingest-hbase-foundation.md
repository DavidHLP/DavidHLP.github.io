---
title: HBase 基础、架构与运维聚合快照：数据模型、表设计、Shell 与 Java API
capturedAt: 2026-08-21 00:00:00+08:00
sourceType: personal-notes-and-fuwari-overlap
sourceUrl: "https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9"
immutable: true
tags: [HBase, BigData, DataModel, Architecture, Shell, JavaAPI]
description: 聚合 Personal-markdown-notes 9 篇与 Fuwari 9 篇 HBase 原文（personal bbb2126 / fuwari 07cee2b），内容高度同源但互补，涵盖数据模型、架构、表设计、Shell 与 Java API。
---

# HBase 基础、架构与运维聚合快照：数据模型、表设计、Shell 与 Java API

本文件为聚合证据快照（immutable raw），按 LLM-Wiki 规范原样收录多篇来源原文，不改动正文，仅增加 provenance 头部与分隔。后续 wiki 页通过 `sources: ["{slug}"]` 引用本快照。

- raw slug: `ingest-hbase-foundation`
- 对应 wiki: `hbase-foundation-and-ops`
- Personal-markdown-notes 固定提交: `bbb2126`（`https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9`）
- Fuwari 固定提交: `07cee2b`（`https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52`）
- 捕获方式: `gh repo clone --depth 1` 后按路径分组，原样拼接，空文件与完全重复文件已标注但未删改内容

## 来源清单

| 序号 | 仓库 | 相对路径 | 大小 | 去重标注 |
| --- | --- | --- | --- | --- |
| 1 | Personal-markdown-notes | `hbase/Hbase基础知识/Hbase数据模型.md` | 8295 |  |
| 2 | Personal-markdown-notes | `hbase/Hbase基础知识/Hbase概述.md` | 7474 |  |
| 3 | Personal-markdown-notes | `hbase/Hbase基础知识/Hbase逻辑模型与物理模型详解.md` | 8878 |  |
| 4 | Personal-markdown-notes | `hbase/Hbase架构/系统架构.md` | 3102 |  |
| 5 | Personal-markdown-notes | `hbase/Hbase架构/逻辑结构模型.md` | 2790 |  |
| 6 | Personal-markdown-notes | `hbase/Hbase表设计以及调优/Hbase表结构设计.md` | 10268 |  |
| 7 | Personal-markdown-notes | `hbase/Java-API/HBase-Java-API:表管理综合指南.md` | 27670 |  |
| 8 | Personal-markdown-notes | `hbase/Shell操作/HbaseShell管理操作.md` | 24770 |  |
| 9 | Personal-markdown-notes | `hbase/Shell操作/Hbase常见的Shell操作.md` | 16435 |  |
| 10 | Fuwari | `hbase/HBase-Data-Model-Explained.md` | 8785 |  |
| 11 | Fuwari | `hbase/HBase-Java-API-Comprehensive-Guide-to-Table-Management.md` | 28006 |  |
| 12 | Fuwari | `hbase/HBase-Logical-Data-Model.md` | 2994 |  |
| 13 | Fuwari | `hbase/HBase-Logical-vs-Physical-Data-Models-Deep-Dive.md` | 9301 |  |
| 14 | Fuwari | `hbase/HBase-Overview-and-Core-Concepts.md` | 7401 |  |
| 15 | Fuwari | `hbase/HBase-Shell-Administration-Guide.md` | 13363 |  |
| 16 | Fuwari | `hbase/HBase-Shell-Commands-Quick-Reference.md` | 14383 |  |
| 17 | Fuwari | `hbase/HBase-System-Architecture-Deep-Dive.md` | 3260 |  |
| 18 | Fuwari | `hbase/HBase-Table-Schema-Design-Best-Practices.md` | 9897 |  |

## 免责与边界

- 黑马课程、实战 156KB、Feed 流等笔记含课程截图、本地路径、未验证配置，未作可复现实验复核，仅作证据保存。
- Fuwari 部分文章含零宽度字符（如 `OptimisticvsPessimisticLocking​.md` 路径含 `\u200b`），已按原样保留文件名。
- 个人笔记中的 `redis/业务/事务的作用域.md` 为空文件（仅 1 字节换行），已保留记录。
- 本快照不改写任何原文；冲突或过时结论由 wiki 层显式标注。

---

## 来源 1: Personal-markdown-notes / `hbase/Hbase基础知识/Hbase数据模型.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Hbase基础知识/Hbase数据模型.md>
- 本地路径: `hbase/Hbase基础知识/Hbase数据模型.md`

```markdown
# HBase数据模型

HBase是Apache Hadoop生态系统中的一个重要组件，是一个分布式、可扩展的NoSQL数据库，专为大数据存储和处理而设计。理解HBase的数据模型是掌握HBase的关键。

## 一、HBase与关系型数据库的对比

### 1. 存储模型差异
- **关系型数据库**：基于表格模型，具有固定的行和列结构，强调数据关系
- **HBase**：基于面向列的存储架构，采用稀疏矩阵结构，灵活性更高

### 2. 数据组织方式
- **关系型数据库**：表、行、列结构严格定义
- **HBase**：可视为多维Map结构，`{RowKey, Column Family:Column Qualifier, Timestamp} -> Value`

### 3. 适用场景
- **关系型数据库**：适合事务处理和复杂查询
- **HBase**：适合海量数据存储和高并发读写场景

## 二、HBase基本数据结构

HBase的数据模型由以下核心组件构成，它们以层级结构组织：

### 1. 表（Table）
- HBase中的数据以表的形式组织
- 表可以包含多个列族，但所有行共享相同的列族结构
- 表在物理上按照Region进行分区存储

### 2. 行（Row）
- 每一行由唯一的行键（RowKey）标识
- 行按照RowKey的字典顺序进行存储
- 行中的数据按列族进行分组

### 3. 行键（RowKey）
- 唯一标识表中的一行数据
- 类似于关系数据库中的主键，但在HBase中更为重要
- 每行数据必须包含一个RowKey
- RowKey设计直接影响数据的分布和访问性能

### 4. 列族（Column Family）
- 将表中的数据列进行逻辑分组
- 列族在创建表时定义，不能轻易更改
- 每个列族有独立的存储属性（如压缩算法、块大小等）
- 建议保持列族数量少（通常1-3个），以优化性能

### 5. 列限定符（Column Qualifier）
- 每个列族包含多个列限定符
- 可以动态添加，不需要预先定义
- 列的完整表示形式为`列族名:列限定符名`
- 不同行可以有不同的列限定符集合

### 6. 单元格（Cell）
- 由行键、列族和列限定符共同确定的最小存储单元
- 包含具体的数据值和时间戳
- 内容以二进制形式存储

### 7. 时间戳（Timestamp）
- 每个单元格可以包含同一数据的多个版本
- 版本通过时间戳来区分
- 默认返回最新版本的数据
- 可以指定时间戳或时间范围查询历史版本

## 三、数据模型图解

### 1. 逻辑视图

HBase表的逻辑结构可以表示为：

| RowKey  | Column Family: personal | Column Family: contact |
| ------- | ----------------------- | ---------------------- |
|         | name                    | age                    | email           | phone        |
| user123 | John Doe                | 30                     | john@abc.com    | 123-456-7890 |
| user456 | Jane Doe                | 25                     | jane@xyz.com    | 098-765-4321 |

说明：
- **RowKey**：唯一标识每一行用户数据
- **Column Family**：`personal`和`contact`是两个不同的列族
- **列限定符**：`name`、`age`、`email`、`phone`是具体的列
- **单元格**：例如，行键为`user123`、列族为`personal`、列限定符为`name`的单元格存储值`John Doe`

### 2. 多维映射结构

在逻辑上，HBase的数据可以表示为多维映射结构：

```
RowKey: user123
  Column Family: personal
    name: John Doe (Timestamp: 1696886600)
    age: 30 (Timestamp: 1696886600)
  Column Family: contact
    email: john@abc.com (Timestamp: 1696886600)
    phone: 123-456-7890 (Timestamp: 1696886600)

RowKey: user456
  Column Family: personal
    name: Jane Doe (Timestamp: 1696886600)
    age: 25 (Timestamp: 1696886600)
  Column Family: contact
    email: jane@xyz.com (Timestamp: 1696886600)
    phone: 098-765-4321 (Timestamp: 1696886600)
```

### 3. 版本控制示例

HBase支持数据多版本存储，以下是数据版本示例：

| Row Key        | Time Stamp | Column Family: contents       | Column Family: anchor                | Column Family: people |
| -------------- | ---------- | ---------------------------- | ------------------------------------ | --------------------- |
| "com.cnn.www"  | t9         |                              | anchor:cssnsi.com = "CNN"           |                       |
| "com.cnn.www"  | t8         |                              | anchor:my.look.ca = "CNN.com"       |                       |
| "com.cnn.www"  | t6         | contents:html = "<html>..."  |                                      |                       |
| "com.cnn.www"  | t5         | contents:html = "<html>..."  | anchor:cnn.com = "CNN"              |                       |
| "com.cnn.www"  | t3         | contents:html = "<html>..."  |                                      | people:author = "John"|

从这个例子可以看出：
- 同一RowKey（`com.cnn.www`）在不同时间点（t3、t5、t6、t8、t9）有不同版本的数据
- 每个版本可能更新不同的列族和列
- 查询时可以获取最新版本或指定时间戳的数据

## 四、HBase数据模型设计最佳实践

### 1. RowKey设计原则
- **唯一性**：确保RowKey在表中唯一
- **长度控制**：通常保持在10-100字节之间
- **避免热点**：防止数据集中在少数Region
- **反转域名**：如存储网站域名时，可将域名反转（如org.apache.www），确保相关数据聚集
- **加盐**：在RowKey前添加随机前缀，分散写入压力

### 2. 列族设计原则
- **数量控制**：通常保持在1-3个
- **命名简洁**：使用短小的名称减少存储开销
- **数据聚集**：将经常一起访问的列放在同一列族
- **访问频率**：根据访问模式分组，将热数据和冷数据分开

### 3. 时间戳管理
- **版本数控制**：设置合理的最大版本数
- **过期时间**：根据业务需求设置数据过期时间
- **自定义时间戳**：根据业务语义使用自定义时间戳

### 4. 二级索引策略
- HBase不直接支持二级索引，但可以通过以下方式实现：
  - 创建索引表
  - 使用复合RowKey
  - 利用Phoenix等工具提供的索引功能

## 五、HBase物理存储模型

### 1. Region
- 表按RowKey范围水平分割为多个Region
- 每个Region由一个RegionServer管理
- Region是HBase分布式存储和负载均衡的基本单位

### 2. Store
- 每个Region中的每个列族对应一个Store
- Store是存储和访问的基本单位

### 3. StoreFile/HFile
- Store中的数据存储在HDFS上的HFile文件中
- HFile是HBase的底层存储格式，基于LSM树实现

### 4. MemStore
- 写入数据首先进入内存中的MemStore
- 当MemStore达到阈值时，数据刷新到磁盘形成StoreFile

### 5. WAL（Write Ahead Log）
- 用于数据恢复的日志文件
- 确保数据写入的持久性和一致性

## 六、HBase与传统数据库的使用场景对比

### 1. 适合HBase的场景
- 超大规模数据存储（PB级别）
- 高并发读写需求
- 非结构化/半结构化数据
- 时序数据存储
- 实时分析和批处理混合场景

### 2. 不适合HBase的场景
- 复杂事务处理
- 需要JOIN操作的关系型查询
- 小规模数据存储
- 高一致性要求的应用

## 七、HBase数据操作

### 1. 基本操作
- **Put**：添加或更新数据
- **Get**：根据RowKey获取单行数据
- **Scan**：批量扫描数据
- **Delete**：删除数据

### 2. 批量操作
- **BatchPut**：批量写入数据
- **BatchGet**：批量获取数据

### 3. 原子操作
- **CheckAndPut**：根据条件执行Put操作
- **CheckAndDelete**：根据条件执行Delete操作
- **Increment**：原子递增操作

## 八、HBase架构组件

### 1. 主要组件
- **HMaster**：管理RegionServer和元数据操作
- **RegionServer**：数据存取的服务器节点
- **Zookeeper**：协调各组件，进行节点管理和选举
- **HDFS**：底层数据存储系统

### 2. 工作流程
- 客户端首先与Zookeeper通信，获取元数据位置
- 获取表元数据，确定数据所在的RegionServer
- 直接与RegionServer通信进行数据读写
- 数据写入经过WAL和MemStore，最终存储到HFile

通过理解HBase的数据模型及其设计原则，可以有效地利用HBase的优势，为大数据应用提供可靠、高效的存储解决方案。
```

## 来源 2: Personal-markdown-notes / `hbase/Hbase基础知识/Hbase概述.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Hbase基础知识/Hbase概述.md>
- 本地路径: `hbase/Hbase基础知识/Hbase概述.md`

```markdown
# HBase概述

## 1. 大数据背景

从1970年开始，大多数公司使用关系型数据库来存储和维护数据。随着大数据技术的出现，许多公司开始选择像Hadoop这样的分布式系统来存储和处理海量数据。

## 2. Hadoop生态体系

### 2.1 Hadoop简介

Hadoop使用分布式文件系统HDFS来存储数据，并使用MapReduce来处理数据。它擅长存储各种格式的大数据，支持任意格式，甚至非结构化的数据。此外，Hadoop生态系统中包含许多组件，例如Hive、Pig和Spark，这些组件进一步增强了数据处理的灵活性和效率。

### 2.2 Hadoop的局限性

Hadoop主要用于批量数据处理，通过顺序访问数据来实现。查找数据时必须遍历整个数据集，随机读取数据的效率较低。此外，Hadoop的MapReduce编程模型相对复杂，开发效率低，延迟高，不适合需要低延迟的数据处理任务。

## 3. NoSQL数据库

### 3.1 NoSQL概述

NoSQL是指代非关系型数据库的通用术语，通常不使用SQL作为主要语言。NoSQL数据库设计用于克服关系型数据库在处理大规模数据时的局限性。

### 3.2 HBase简介

HBase是BigTable的开源Java实现，建立在HDFS之上，提供高可靠性、高性能、列存储、可伸缩、实时读写的NoSQL数据库系统。它弥补了Hadoop在随机访问方面的不足。

## 4. HBase核心特性

### 4.1 基本特点

- **强一致性读/写**：适用于需要强一致性的场景。
- **高速计数器聚合**：适合高速计数器聚合任务。
- **自动分块**：表通过Region分布在集群上，随着数据增长，区域自动拆分和重新分布。
- **自动RegionServer故障转移**：在RegionServer故障时自动转移。

### 4.2 表的特点

- **大规模**：单个表可以有上十亿行和上百万列。
- **面向列**：列族的存储和权限控制，支持独立检索。
- **稀疏性**：为空的列不占用存储空间，因此表可以设计得非常稀疏。

### 4.3 技术集成

- **Hadoop/HDFS集成**：HBase支持HDFS作为其分布式文件系统。
- **MapReduce支持**：通过MapReduce支持大规模并行处理。
- **Java Client API**：支持Java API编程访问。
- **Thrift/REST API**：提供Thrift和REST API接口，支持多语言访问。

### 4.4 性能优化

- **块缓存和布隆过滤器**：用于查询优化。
- **运行管理**：提供内置网页进行业务监控和管理。

### 4.5 局限性

HBase的查询功能简单，不支持join操作和复杂事务（只支持行级事务）。HBase更像是一个"数据存储"而不是"数据库"，因为它缺少关系型数据库中的特性，例如带类型的列、二级索引和高级查询语言。HBase中的数据类型为byte[]。

HBase只支持通过主键（rowkey）或主键范围检索数据，仅支持单行事务。它适用于存储结构化和半结构化的松散数据。

## 5. HBase的扩展性

HBase的扩展主要依赖于横向扩展，通过增加廉价的服务器来提高存储和处理能力。例如，将集群从10个节点扩展到20个节点，存储能力和处理能力都会加倍。

## 6. HBase应用场景

HBase适用于以下场景：

- **对象存储**：例如网页、图片、新闻、病毒库。
- **时序数据**：例如物联网设备的传感器数据（基于OpenTSDB模块）。
- **推荐系统**：例如个性化内容推荐。
- **时空数据存储**：例如地理位置信息和时间序列数据。
- **日志和事件数据处理**：存储和分析服务器日志和用户行为事件。
- **数据立方体（Cube）**：存储和管理多维数据立方体，支持OLAP场景中的复杂查询与分析。
- **消息和订单处理**：用于处理电商系统中的订单信息和消息流，提供高效的数据分析和实时响应。
- **Feeds流**：管理社交媒体等实时数据流，支持用户活动和内容更新的高效处理。
- **NewSQL**：与NewSQL数据库结合使用，获得传统关系型数据库的特性与NoSQL的扩展性。
- **其他**：适用于需要大规模存储和快速随机访问的场景，如用户画像、内容管理等。

## 7. 技术对比

### 7.1 HBase与Hadoop的关系

HBase基于Hadoop集群搭建，弥补了Hadoop的一些局限性，例如高吞吐量的批量数据处理，但在随机查询和实时操作方面不如传统关系型数据库。HBase不支持join操作，仅有一种数据类型：byte[]，写入速度非常快。

HBase适用于存储非常大的表，支持上亿行和上百万列，常用于实时数据处理中。HBase与Hadoop集成，能够结合MapReduce、Hive和Spark等工具，支持复杂的数据分析和处理任务。

### 7.2 RDBMS与HBase的对比

#### 7.2.1 RDBMS结构与功能

**结构**：
- 数据库以表的形式存在。
- 支持多种文件系统，如FAT、NTFS、EXT等。
- 使用主键（PK）进行唯一标识。
- 通过外部中间件支持分库分表。
- 数据组织为行、列、单元格。

**功能**：
- 支持向上扩展（通过更好的服务器提升性能）。
- 使用SQL进行查询。
- 面向行，每一行都是一个连续单元。
- 数据量受限于服务器配置。
- 支持ACID特性。
- 适合结构化数据。
- 支持事务和Join操作。

#### 7.2.2 HBase结构与功能

**结构**：
- 数据以表的形式存在。
- 支持HDFS文件系统。
- 使用行键（row key）进行数据定位。
- 原生支持分布式存储和计算。
- 使用行、列、列族和单元格的层次结构。

**功能**：
- 支持向外扩展（通过增加服务器数量提升性能）。
- 使用API和MapReduce、Spark、Flink等工具来访问数据。
- 面向列，每个列都是独立的单元。
- 数据总量不依赖某台机器，而取决于机器数量。
- 不支持ACID特性。
- 支持结构化和非结构化数据。
- 数据存储和访问方式是分布式的。
- 仅支持单行事务操作，不支持Join操作。

### 7.3 HDFS对比HBase

#### 7.3.1 HDFS

- 适合存储大型文件的分布式文件系统。
- 不适合在文件中快速查询特定数据。

#### 7.3.2 HBase

- 构建在HDFS之上，为大型表提供快速查找和更新。
- 数据存储在HDFS中名为「StoreFiles」的索引中，以便高速查找。
- 适合快速查询场景，但不适合大规模OLAP应用。

### 7.4 Hive对比HBase

#### 7.4.1 Hive

- 数据仓库工具，基于HDFS，适用于离线数据分析。
- 使用HQL来管理和查询数据，具有较高的延迟。
- 编写的HQL语句最终会被转换为MapReduce代码执行。

#### 7.4.2 HBase

- NoSQL数据库，采用面向列存储的非关系型数据结构。
- 适用于单表数据存储，不适合JOIN操作。
- 基于HDFS，数据以HFile形式存放，RegionServer管理数据。
- 延迟低，适合在线业务，提供高效的数据访问速度。

## 8. 总结

Hive和HBase是两种基于Hadoop的不同技术。

- **Hive**：Hive是一种类SQL的数据仓库工具，使用HQL（Hive Query Language）进行查询，依赖于MapReduce任务运行，适用于批量数据分析和处理。
- **HBase**：HBase是构建在Hadoop之上的NoSQL数据库，采用键值（Key/Value）存储，擅长实时随机读写操作。

这两种工具可以结合使用。例如，Hive适合统计查询，HBase适合实时查询。数据可以从Hive写入HBase，也可以从HBase写回Hive。
```

## 来源 3: Personal-markdown-notes / `hbase/Hbase基础知识/Hbase逻辑模型与物理模型详解.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Hbase基础知识/Hbase逻辑模型与物理模型详解.md>
- 本地路径: `hbase/Hbase基础知识/Hbase逻辑模型与物理模型详解.md`

```markdown
# HBase逻辑模型与物理模型详解

## 一、HBase逻辑模型

> 逻辑模型顺序：表（Table） -> 行（Row） -> 行键(Row Key) -> 列族 (Column Family) -> 列 (Column) -> 单元格 (Cell) <- 时间戳 (Timestamp)

### 1. 表（Table）

- HBase 中的数据以表的形式存储。每个表由多个行组成 ，即数据行的集合，但表结构简单，仅需定义表名和列族。
- 表（Table）特点：
    1. 稀疏性：未使用的列不会占用存储空间
    2. 可伸缩性：通过分区的方式存储和管理数据，可以水平扩展来支持数十亿行和数百列的数据。
    3. 高效的随机访问：行键索引和分布式存储机制使得 HBase 在大规模数据中仍然能支持高效的随机访问。
        -  高效的随机访问并不是一直有效的,这个和RowKey的设计有关，如果RowKey是无序且没有意义的，这会导致Get无法通过RowKey去获取到对应的数据，高效的随机访问在此时便不成立了
    4. 列式存储：在物理模型中Table最终会被列切分为Store存储

### 2. 行（Row）

- 行是 HBase 中的一个逻辑数据单元，它由一个行键和多个列族组成。
- 行特点：
    - **稀疏性**：行之间可以没有固定的列，即不同行可以拥有不同的列，HBase 会自动忽略空的单元格。
    - **多版本控制**：行中的每个列都可以存储多个版本的数据，通过时间戳来标识。默认情况下，HBase 会保留最新的 3 个版本。
    - **高效随机访问**：由于行键的排序和唯一性，HBase 可以高效地定位到特定的行，从而实现快速的随机读取和写入。
- 行结构：
    - 表达一：行键 + 列族（Column Family） + 列限定符（Column Qualifier） + 时间戳（Timestamp） + 类型
    - 表达二：多个Cell（单元格）组成的集合

### 3. 行键(Row Key)

- 行键是 HBase 中每行数据的唯一标识符，相当于关系数据库中的主键。
    - 在物理底层Row Key无法唯一标识一行数据 ， 列限定符有一个version ， 即一个Row Key下的数据其实是有多个版本的 ，Hbase默认获取时间戳最大的 ， 真正能唯一标识的应该是Row Key + Timestamp

- 行键特点：
    - **唯一性**：每个行键在一个表中是唯一的。通过行键可以唯一标识和定位行数据。
    - **排序性**：HBase 表的行按行键的字典顺序排序存储，这意味着行键的设计会直接影响数据的物理存储位置。可以利用这一特性，通过行键的设计来提高查询性能。
    - **不可更改**：在 HBase 中，一旦行键设置好，就不能更改或删除它。HBase 是追加写入的系统，因此删除行键只能通过标记删除来实现，数据仍然保留在底层，直到系统进行垃圾回收。

### 4. 列族 (Column Family)

- 列族是HBase表中的列的逻辑分组，是物理存储的基本单位。每个表至少有一个列族，列族必须在表创建时定义。
- 列族特点：
    - **物理隔离**：不同列族的数据在物理上分开存储，每个列族对应一个HFile文件集合。
    - **共同属性**：同一列族内的所有列共享相同的配置属性，如压缩方式、数据存储时长等。
    - **数量限制**：一般建议每个表的列族数量保持在3个以内，过多的列族会影响性能。
    - **命名规范**：列族名通常使用可打印字符组成，避免使用过长名称，因为列族名会被频繁写入HFile。

### 5. 列 (Column)

- 列是HBase中存储数据的最小逻辑单位，由列族和列限定符(Column Qualifier)组成。
- 列特点：
    - **动态性**：HBase的列是动态的，可以在任何时候添加新列，不需要预先定义表结构。
    - **格式表示**：列的完整表示为"列族:列限定符"，例如"family:qualifier"。
    - **灵活性**：每一行可以有不同的列，同一表中不同行的列数量可以不同。
    - **无类型**：HBase的列没有数据类型的概念，所有值都以字节数组形式存储。

### 6. 单元格 (Cell)

- 单元格是HBase数据存储的最小单位，由{行键, 列族, 列限定符, 时间戳, 类型}五元组唯一确定。
- 单元格特点：
    - **版本化**：每个单元格可以包含同一数据的多个版本，通过时间戳区分。
    - **原子性**：HBase操作的原子性以单元格为单位，确保数据一致性。
    - **存储结构**：单元格中存储的值(Value)是未解释的字节数组，由应用层负责解释。
    - **TTL(Time To Live)**：可以为单元格设置生存时间，超过时间后将被自动清除。

### 7. 时间戳 (Timestamp)

- 时间戳是HBase实现数据多版本的关键机制，用于标识数据的不同版本。
- 时间戳特点：
    - **自动生成**：默认情况下，时间戳由HBase自动生成，使用写入时的系统时间。
    - **用户自定义**：客户端也可以在写入数据时指定时间戳。
    - **版本控制**：通过时间戳，HBase可以保存数据的多个版本，默认保留最新的3个版本。
    - **查询机制**：查询时可以指定时间戳或时间范围，获取特定版本的数据。

## 二、HBase物理模型

> 物理模型顺序：Region -> Store -> MemStore/StoreFile(HFile) -> Block -> KeyValue

### 1. Region

- Region是HBase表数据的物理分片，每个Region包含表中某个行键范围内的所有数据。
- Region特点：
    - **分布式存储**：每个Region被分配到一个RegionServer上进行管理和服务。
    - **自动分裂**：当Region大小超过配置阈值时，会自动分裂为两个子Region。
    - **负载均衡**：通过Region的分裂和迁移，HBase能够实现集群的负载均衡。
    - **结构组成**：每个Region包含表中一个或多个列族的数据，每个列族对应一个Store。

### 2. Store

- Store是Region的物理存储单元，每个Region中的每个列族对应一个Store。
- Store特点：
    - **对应关系**：一个Store对应一个列族的数据。
    - **结构组成**：每个Store包含一个MemStore和零到多个StoreFile(HFile)。
    - **写入路径**：数据先写入MemStore，当MemStore满后，数据被刷新到StoreFile中。

### 3. MemStore

- MemStore是内存中的写缓冲区，新写入的数据首先存储在这里。
- MemStore特点：
    - **排序存储**：MemStore中的数据按照行键有序存储。
    - **刷新机制**：当MemStore达到配置的阈值时，会触发刷新操作，将数据写入新的StoreFile。
    - **性能优化**：MemStore提高了写入性能，避免每次写操作都直接写入磁盘。

### 4. StoreFile(HFile)

- StoreFile是HBase数据在HDFS上的物理存储文件，是对HFile的封装。
- StoreFile特点：
    - **不可变性**：一旦创建，StoreFile内容不可修改，新的更新会创建新的StoreFile。
    - **合并机制**：通过Major和Minor Compaction合并小文件，提高读取效率。
    - **文件结构**：包含数据块、索引块、元数据块等多种块结构。

### 5. Block

- Block是HFile的基本存储单位，HFile由多个Block组成。
- Block特点：
    - **大小可配置**：Block大小默认为64KB，可以根据需要调整。
    - **类型多样**：包括数据Block、索引Block、元数据Block、布隆过滤器Block等。
    - **缓存机制**：Block是HBase缓存的基本单位，频繁访问的Block会被缓存在BlockCache中。

### 6. KeyValue

- KeyValue是HBase存储的最小物理单元，对应于逻辑模型中的一个单元格。
- KeyValue结构：
    - **行键(RowKey)**：标识这个KeyValue属于哪一行。
    - **列族(Family)**：标识列族名称。
    - **列限定符(Qualifier)**：标识具体的列。
    - **时间戳(Timestamp)**：标识数据版本。
    - **类型(Type)**：标识操作类型，如Put、Delete等。
    - **值(Value)**：实际存储的数据内容。

## 三、逻辑模型与物理模型的映射关系

1. **表(Table)到Region的映射**：
   - 一个表被水平划分为多个Region，每个Region负责表中一段连续的行键范围。

2. **列族(Column Family)到Store的映射**：
   - 每个列族在物理上对应一个Store，Store是Region中的物理存储单元。

3. **行(Row)到KeyValue序列的映射**：
   - 一行数据在物理上被拆分为多个KeyValue，每个KeyValue对应逻辑模型中的一个单元格。

4. **单元格(Cell)到KeyValue的映射**：
   - 逻辑模型中的单元格在物理模型中对应一个KeyValue结构。

5. **存储过程映射**：
   - 数据写入时：Client → Region → Store → MemStore → (Flush) → StoreFile → HFile
   - 数据读取时：HFile → StoreFile → BlockCache(可选) → Client
```

## 来源 4: Personal-markdown-notes / `hbase/Hbase架构/系统架构.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Hbase架构/系统架构.md>
- 本地路径: `hbase/Hbase架构/系统架构.md`

```markdown
# HBase系统架构

## 架构概述

HBase是一个分布式、可扩展的NoSQL数据库，建立在HDFS之上，提供面向列的实时读写能力。

<div align="center">
  <img src="../image/hbase.png" />
   <p style="margin-top: 2px;">HBase系统架构图</p>
</div>

HBase系统主要由以下几个核心组件构成：
- Client：客户端，负责发送请求
- ZooKeeper：协调服务，管理集群状态
- Master：主服务器，负责管理和协调整个集群
- RegionServer：区域服务器，负责数据存储和处理

## 核心组件详解

### Client

客户端是发出HBase操作请求的对象，包括但不限于：
- Java API代码
- HBase Shell命令行工具
- REST/Thrift API等接口

客户端主要职责：
- 通过ZooKeeper定位Region位置
- 直接与RegionServer通信进行数据读写
- 与Master通信进行DDL操作（创建、删除、修改表等）

### ZooKeeper

ZooKeeper在HBase中扮演协调服务的角色，主要职责：
- 存储HBase集群的元数据信息
- 监控RegionServer的状态
- 提供Master选举机制
- 存储Region寻址信息
- 协调集群配置信息

### Master

Master是HBase集群的管理者，负责管理和协调整个系统。

<div align="center">
  <img src="../image/Master-Web-UI.png" />
  <p style="margin-top: 2px;">Master Web UI</p>
</div>

Master主要职责：
- 监控所有RegionServer的状态
- 处理RegionServer故障转移
- 管理元数据的变更（表的创建、删除、修改等）
- 处理Region的分配或移除
- 在空闲时进行数据的负载均衡
- 通过ZooKeeper发布自己的位置给客户端

> Master专注于管理功能，不直接参与数据读写操作，主要负责元数据管理和资源分配。

### RegionServer

RegionServer是实际存储HBase数据并处理客户端读写请求的服务器。

<div align="center">
  <img src="../image/RegionServer.png" />
  <p style="margin-top: 2px;">RegionServer结构图</p>
</div>

RegionServer主要职责：
- 处理分配给它的Region
- 负责存储和管理HBase的实际数据
- 刷新内存缓存(MemStore)到HDFS(HFile)
- 维护预写日志(Write-Ahead Log)
- 执行数据压缩
- 处理Region分裂和合并

#### RegionServer内部组件

RegionServer内部包含多个关键组件：

1. **Region**：数据的基本存储单元，对应表的一个数据分片
2. **Store**：对应一个列族的存储，每个Region包含多个Store
3. **MemStore**：内存存储，数据写入时首先进入MemStore
4. **HFile(StoreFile)**：磁盘存储格式，当MemStore满时数据刷新到HFile
5. **Write-Ahead Log(WAL)**：预写日志，保证数据写入的可靠性

## HBase读写流程

### 写入流程

1. Client通过ZooKeeper找到数据对应的RegionServer
2. 数据首先写入WAL日志
3. 数据写入对应的MemStore
4. 当MemStore达到阈值时，数据刷写到HFile

### 读取流程

1. Client通过ZooKeeper找到数据对应的RegionServer
2. 客户端发送读请求到RegionServer
3. RegionServer先查找MemStore，再查找BlockCache，最后查找HFile
4. 返回结果给客户端
```

## 来源 5: Personal-markdown-notes / `hbase/Hbase架构/逻辑结构模型.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Hbase架构/逻辑结构模型.md>
- 本地路径: `hbase/Hbase架构/逻辑结构模型.md`

```markdown
# HBase逻辑结构模型

## 整体架构概述

HBase是建立在Hadoop之上的分布式、面向列的数据库系统，提供了可靠的数据存储和快速随机访问能力。

### 进程角色

HBase系统由以下几个关键进程组成：

- **Client**：客户端，包括Java应用程序、HBase Shell等（也可通过Flink、MapReduce、Spark等访问）
- **HMaster**：主要负责表的管理操作（创建表、删除表、Region分配），不负责具体的数据操作
- **HRegionServer**：负责数据的管理、操作（增删改查）及接收客户端请求

### 数据模型层次结构

HBase的数据模型是层层递进的结构，从宏观到微观依次为：

<div align="center">
  <img src="../image/RegionServer-structure.png" />
   <p style="margin-top: 2px;">RegionServer结构</p>
</div>

#### Region

- Region是HBase中数据分布的基本单位
- 一张表被分为多个Region，每个Region保存一定rowkey范围的数据
- Region中的数据按照rowkey的字典序排列
- Region根据rowkey进行横向切割

<div align="center">
  <img src="../image/Region1.png" />
</div>

- 每张表的Region数量：

<div align="center">
  <img src="../image/Region2.png" />
</div>

#### Store

- 每个Region按列族垂直切分为多个Store
- 每个列族对应一个Store
- Store负责存储列族的数据

<div align="center">
  <img src="../image/Region-is-split-vertically-by-column-family.png" />
  <p style="margin-top: 2px;">Region按列族垂直切分</p>
</div>

#### MemStore

- MemStore是Store的内存缓冲组件
- 每个列族(Store)有一个MemStore
- 所有写入HBase的数据首先写入MemStore
- 当MemStore接近满时，数据会被刷写(flush)到磁盘上的StoreFile中

#### StoreFile与HFile

- StoreFile是物理存储层面的概念，底层实现是HFile
- HFile是HBase存储在HDFS上的文件格式
- HFile具有丰富的结构，包括数据块(DataBlock)、索引和布隆过滤器(BloomFilter)
- 写入HFile的操作是连续的，速度非常快（flush操作）

#### WAL(Write Ahead Log)

- WAL全称为Write Ahead Log，主要用于故障恢复
- 每个写入操作(PUT/DELETE/INCR)先记录到WAL，再写入MemStore
- 服务器崩溃时，可通过回放WAL恢复MemStore中的数据
- 物理上存储是Hadoop的Sequence File

## 数据读写流程

### 写入流程
1. 客户端发送写请求至RegionServer
2. 数据首先写入WAL日志
3. 然后数据写入对应列族的MemStore
4. 当MemStore达到阈值时，触发flush操作，将数据写入新的HFile
5. 定期进行文件合并(Compaction)，优化读取性能

### 读取流程
1. 客户端发送读请求至RegionServer
2. 先检查Block Cache（读缓存）
3. 再检查MemStore
4. 最后检查HFile
5. 返回合并后的结果
```

## 来源 6: Personal-markdown-notes / `hbase/Hbase表设计以及调优/Hbase表结构设计.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Hbase表设计以及调优/Hbase表结构设计.md>
- 本地路径: `hbase/Hbase表设计以及调优/Hbase表结构设计.md`

```markdown
# HBase表结构设计与调优

## 一、HBase基础架构

### 1. 名称空间（namespace）概念

- 名称空间用于对一个项目中的多张表按业务域进行划分，便于管理
- 类似于Hive中的数据库，不同数据库下可放不同类型的表
- HBase默认名称空间是「default」，创建表时默认使用此名称空间
- HBase系统内建名称空间「hbase」，用于存放系统内建表（namespace、meta）

<div align="center">
  <img src="../image/namespace-default.png " />
   <p style="margin-top: 2px;">namespace default</p>
</div>

<div align="center">
  <img src="../image/namespace-hbase.png" />
   <p style="margin-top: 2px;">namespace hbase</p>
</div>

### 2. 名称空间操作语法

#### 创建命名空间
```shell
create_namespace 'MOMO_CHAT'
```

#### 列出命名空间
```shell
list_namespace
```

#### 删除命名空间
```shell
drop_namespace 'MOMO_CHAT'  # 注意：删除命名空间时，必须确保命名空间内没有表
```

#### 查看命名空间
```shell
describe_namespace 'MOMO_CHAT'
```

#### 创建带命名空间的表
```shell
create 'MOMO_CHAT:MSG', 'C1'  # 表名必须带上命名空间，否则默认为default命名空间
```

## 二、HBase表设计核心要点

### 1. 表设计基本原则
- 列族：推荐1-2个，能使用1个就不使用2个
- 版本设计：如无需保存历史版本，使用默认配置VERSIONS=1；如需保存历史变更，可设置VERSIONS>1（注意会占用更多空间）

### 2. 列族设计
- HBase列的数量应该越少越好
  - 两个及以上的列族会影响HBase性能
  - 当一个列所存储的数据达到flush阈值时，表中所有列族将同时进行flush操作
  - 这将带来不必要的I/O开销，列族越多，对性能影响越大

### 3. 版本设计
- 对于不会更新的历史记录数据：
  - 只保留一个版本即可，节省空间
  - HBase默认版本为1，保持默认配置
- 对于HBase版本特性：
  - 版本是相对于列族而言
  - 可通过describe命令查看版本设置：
  ```shell
  hbase:005:0> describe 'MOMO_CHAT:MSG'
  Table MOMO_CHAT:MSG is ENABLED                                                                                                                                                                                
  MOMO_CHAT:MSG, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}                                                                                                             
  COLUMN FAMILIES DESCRIPTION                                                                                                                                                                                   
  {NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 
  'ROW', IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                      
  ```
 
### 4. 数据压缩策略

#### 压缩算法对比
在HBase可以使用多种压缩编码，包括LZO、SNAPPY、GZIP。只在硬盘压缩，内存中或者网络传输中没有压缩。

| 压缩算法       | 压缩后占比 | 压缩速度   | 解压缩速度   | 适用场景 |
| ------------- | ---------- | ---------- | ------------ | ------- |
| GZIP          | 13.4%      | 21 MB/s    | 118 MB/s     | 高压缩率场景，但需考虑CPU消耗 |
| LZO           | 20.5%      | 135 MB/s   | 410 MB/s     | 需要快速压缩和极快解压的场景，适合高吞吐量应用 |
| Zippy/Snappy  | 22.2%      | 172 MB/s   | 409 MB/s     | 对压缩率要求不高但追求速度的场景，适合实时性高的系统 |

#### 数据压缩配置
创建新表时指定压缩算法：
  ```shell
  create 'MOMO_CHAT:MSG',{NAME => 'C1',COMPRESSION => 'GZ'}
  ```

修改已有表的压缩算法：
  ```shell
disable 'MOMO_CHAT:MSG'  # 上线使用的表需谨慎操作，防止数据丢失
  alter 'MOMO_CHAT:MSG', {NAME => 'C1', COMPRESSION => 'GZ'}
  enable 'MOMO_CHAT:MSG'
  ```

## 三、ROWKEY设计策略

### 1. HBase官方设计原则

1. **避免使用递增行键/时序数据**
   - 递增ROWKEY（如时间戳）会导致写入压力集中在单一机器上
   - 应尽量将写入压力均衡分布到各个RegionServer

2. **避免ROWKEY和列名过长**
    - 访问Cell需要ROWKEY、列名，过大会占用较多内存
    - ROWKEY最大长度为64KB，建议尽量短小

3. **使用数值类型比字符串更省空间**
    - long类型（8字节）可存储非常大的无符号整数
    - 字符串按一个字节一个字符存储，需要约3倍空间

4. **确保ROWKEY唯一性**
    - 相同ROWKEY的数据会被新数据覆盖
    - HBase数据以key-value形式存储，必须保证RowKey唯一

### 2. 热点问题及解决方案

热点问题说明：
- 热点指大量客户端直接访问集群的一个或几个节点
- 过大访问量可能使某节点超出承受能力，影响整个RegionServer性能

#### 解决方案A：预分区

- 默认情况下一个HBase表只有一个Region，被托管在一个RegionServer中
- 每个Region有两个重要属性：Start Key、End Key，表示维护的ROWKEY范围
- 单一Region在数据量大时会分裂，但初始阶段负载不均衡
- 预分区数量建议为节点数的倍数，根据预估数据量和默认Region大小计算

<div align="center">
  <img src="../image/StartKey-EndKey.png" />
   <p style="margin-top: 2px;">Start Key - End Key</p>
</div>

#### 解决方案B：ROWKEY设计优化

1. **反转策略**
    - 将ROWKEY尾部随机性好的部分提前到前面
    - 可以使ROWKEY随机分布，但牺牲了有序性
    - 利于Get操作，但不利于Scan操作

2. **加盐策略**
    - 在原ROWKEY前添加固定长度随机数
    - 保障数据在所有Regions的负载均衡
    - 但查询时需要查找多个可能的Regions，降低查询效率

3. **哈希策略**
    - 基于ROWKEY完整或部分数据进行Hash
    - 可使用MD5、sha1、sha256等算法
    - 同样不利于Scan操作，打乱了自然顺序

### 3. 实践推荐策略

1. **预分区**：创建表时配置多个region，分布在不同HRegionServer
2. **ROWKEY设计**：
   - 反转：对手机号码、时间戳等进行反转
   - 加盐：在rowkey前加随机数（注意会影响查询）
   - hash：对rowkey部分取hash，计算结果固定便于获取

## 四、预分区与ROWKEY设计实例

### 1. 预分区方法

HBase预分区可通过多种方式实现：

1. **指定分区数量**
      ```shell
      create 'namespace:t1', 'f1', SPLITS_NUM => 5
      ```
  
2. **手动指定分区点**
      ```shell
      create 'namespace:t1', 'f1', SPLITS => ['10', '20', '30', '40', '50']
      ```
  
3. **通过文件指定分区点**
      ```shell
      create 'namespace:t1', 'f1', SPLITS_FILE => 'hdfs://path/to/splits_file', OWNER => 'Johndoe'
      ```

4. **指定分区数量和策略**
    ```shell
    create 't1', 'f1', {NUMREGIONS => 15, SPLITALGO => 'HexStringSplit'}
    ```

分区策略选择：
- HexStringSplit：ROWKEY是十六进制字符串前缀
- DecimalStringSplit：ROWKEY是10进制数字字符串前缀
- UniformSplit：ROWKEY前缀完全随机

### 2. 实际业务中的分区示例

业务需求分析：
- 需确保数据均匀分布到每个Region
- 决策：使用MD5Hash作为前缀
- ROWKEY设计：MD5Hash_账号id_收件人id_时间戳

创建表脚本：
```shell
create 'MOMO_CHAT:MSG', {NAME => 'C1', COMPRESSION => 'GZ'}, {NUMREGIONS => 6, SPLITALGO => 'HexStringSplit'}
```

<div align="center">
  <img src="../image/p1.png" />
   <p style="margin-top: 2px;">观察Hadoop HDFS中的内容 和 Hbase Web UI 中显示的内容</p>
   <p style="margin-top: 2px;">Region其实对应着HDFS中的文件</p>
  <img src="../image/p2.png" />
</div>

### 3. RowKey设计示例

模拟场景分析：
1. RowKey构成：MD5Hash_发件人id_收件人id_消息时间戳
2. MD5Hash计算：将发送人账号+"_"+收件人账号+"_"+消息时间戳取MD5值前8位
3. 实现目的：确保数据均匀分布，避免热点问题

关键实现代码：
```java
    // 根据Msg实体对象生成rowkey
    public static byte[] getRowkey(Msg msg) throws ParseException {
        // ROWKEY = MD5Hash_发件人账号_收件人账号_消息时间戳
    
    // 将发件人账号、收件人账号、消息时间戳拼接
        StringBuilder builder = new StringBuilder();
        builder.append(msg.getSender_account());
        builder.append("_");
        builder.append(msg.getReceiver_account());
        builder.append("_");
        // 获取消息的时间戳
        String msgDateTime = msg.getMsg_time();
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date msgDate = simpleDateFormat.parse(msgDateTime);
        long timestamp = msgDate.getTime();
        builder.append(timestamp);

    // 生成MD5值并取前8位
        String md5AsHex = MD5Hash.getMD5AsHex(builder.toString().getBytes());
        String md5Hex8bit = md5AsHex.substring(0, 8);

    // 拼接最终的rowkey
        String rowkeyString = md5Hex8bit + "_" + builder.toString();

        return Bytes.toBytes(rowkeyString);
    }
```

## 五、HBase性能优化与二级索引

### 1. 性能瓶颈分析

- HBase默认只支持行键索引，针对其他列查询只能全表扫描
- 使用scan+filter组合查询效率不高，特别是数据量大时
- 存在的问题：
  - 网络传输压力大
  - 客户端处理压力大
  - 大数据量查询效率极低

### 2. 二级索引解决方案

- 需要在ROWKEY索引外添加其他索引便于查询
- 原生HBase开发二级索引较为复杂
- 使用SQL引擎可以简化查询操作，提高开发效率

> 如果每次需要我们开发二级索引来查询数据，这样使用起来很麻烦。再者，查询数据都是HBase Java API，使用起来不是很方便。为了让其他开发人员更容易使用该接口，使用SQL引擎通过SQL语句来查询数据会更加方便。
```

## 来源 7: Personal-markdown-notes / `hbase/Java-API/HBase-Java-API:表管理综合指南.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Java-API/HBase-Java-API:表管理综合指南.md>
- 本地路径: `hbase/Java-API/HBase-Java-API:表管理综合指南.md`

```markdown
# HBase Java API：表管理综合指南

HBase 是一个开源的、分布式的、可扩展的多维数据存储系统，构建于 Hadoop 之上。它因处理大量稀疏数据而闻名，而 HBase Java API 允许开发人员有效地管理 HBase 表。本指南将从基础到高级，系统地介绍如何使用 HBase Java API 进行表管理及数据操作。

## 一、连接管理基础

### 1.1 获取HBase Connection

HBase的connection对象是一个重量级对象，它是线程安全的，应避免频繁创建。在编写Spark、Flink等应用时，一个connection对象就足够了。

```java
/**
 * @throws IOException 如果创建连接失败，抛出异常
 * @Description 初始化HBase配置并建立连接
 */
@BeforeTest
public void initHbaseConf() throws IOException {
    // 创建默认的HBase配置对象
    Configuration conf = HBaseConfiguration.create();
    // 建立HBase连接
    connection = ConnectionFactory.createConnection(conf);
    // 获取Admin对象，用于表管理操作
    admin = connection.getAdmin();
}
```

### 1.2 获取HBase Admin对象和关闭连接

```java
/**
 * @throws IOException 如果关闭时发生错误，抛出异常
 * @Description 关闭HBase连接和Admin对象
 */
@AfterTest
public void closeHbaseConnection() throws IOException {
    // 关闭Admin对象
    admin.close();
    // 关闭HBase连接
    connection.close();
}
```

注意：Table对象是轻量级的，非线程安全，使用完毕需要close。

## 二、表管理基础操作

### 2.1 列出所有表

```java
/**
 * @Description 列出所有表的详细信息，包括表名和列族信息
 * @throws IOException 如果操作失败，抛出异常
 */
@Test
public void listAllTables() throws IOException {
    // 获取Admin对象
    Admin admin = connection.getAdmin();
    try {
        // 列出所有的表
        TableName[] tableNames = admin.listTableNames();
        for (TableName tableName : tableNames) {
            System.out.println("Table: " + tableName.getNameAsString());
            // 获取表的描述信息
            TableDescriptor tableDescriptor = admin.getDescriptor(tableName);
            for (ColumnFamilyDescriptor cfd : tableDescriptor.getColumnFamilies()) {
                System.out.println("  Column Family: " + cfd.getNameAsString());
                System.out.println("    Max Versions: " + cfd.getMaxVersions());
                System.out.println("    Min Versions: " + cfd.getMinVersions());
                System.out.println("    Time to Live: " + cfd.getTimeToLive());
            }
        }
    } finally {
        // 关闭Admin
        admin.close();
    }
}
```

### 2.2 获取表的描述信息

```java
/**
 * @Description 获取表的描述信息
 * @throws IOException 如果操作失败，抛出异常
 */
@Test
public void describeTable() throws IOException {
    String tableName = "CLIENT_TABLE"; // 可以根据需求修改具体表名
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (admin.tableExists(tn)) {
            TableDescriptor tableDescriptor = admin.getDescriptor(tn);
            System.out.println("Table Name: " + tableDescriptor.getTableName().getNameAsString());
            System.out.println("Table is Enabled: " + admin.isTableEnabled(tn));
            System.out.println("Table Region Replication: " + tableDescriptor.getRegionReplication());
            for (ColumnFamilyDescriptor cfd : tableDescriptor.getColumnFamilies()) {
                System.out.println("Column Family: " + cfd.getNameAsString());
                System.out.println("Max Versions: " + cfd.getMaxVersions());
                System.out.println("Min Versions: " + cfd.getMinVersions());
                System.out.println("Time to Live: " + cfd.getTimeToLive());
                System.out.println("Block Size: " + cfd.getBlocksize());
                System.out.println("Compression Type: " + cfd.getCompressionType());
                System.out.println("Bloom Filter Type: " + cfd.getBloomFilterType());
                System.out.println("Replication Scope: " + cfd.getScope());
            }
        } else {
            System.out.println("Table " + tableName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.3 启用表

```java
/**
 * @Description 启用指定的表，并等待启用完成
 * @throws IOException 如果操作失败，抛出异常
 * @throws InterruptedException 如果等待过程中被中断，抛出异常
 */
public void enableTable() throws IOException, InterruptedException {
    String tableName = "CLIENT_TABLE";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (!admin.isTableEnabled(tn)) {
            admin.enableTable(tn);
            System.out.println("Table " + tableName + " enable operation initiated.");
            // 等待直到表被启用
            while (!admin.isTableEnabled(tn)) {
                Thread.sleep(100);
            }
            System.out.println("Table " + tableName + " enabled successfully.");
        } else {
            System.out.println("Table " + tableName + " is already enabled.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.4 禁用表

```java
/**
 * @Description 禁用指定的表，并等待禁用完成
 * @throws InterruptedException 如果等待过程中被中断，抛出异常
 */
@Test
public void disableTable() throws IOException, InterruptedException {
    String tableName = "CLIENT_TABLE";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (!admin.isTableDisabled(tn)) {
            admin.disableTable(tn);
            System.out.println("Table " + tableName + " disable operation initiated.");
            // 等待直到表被禁用
            while (!admin.isTableDisabled(tn)) {
                Thread.sleep(100);
            }
            System.out.println("Table " + tableName + " disabled successfully.");
        } else {
            System.out.println("Table " + tableName + " is already disabled.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.5 修改表结构

```java
/**
 * @Description 修改表的结构，例如添加或修改列族
 * @throws IOException 如果操作失败，抛出异常
 * @throws InterruptedException 如果等待过程中被中断，抛出异常
 */
@Test
public void alterTable() throws IOException, InterruptedException {
    String tableName = "CLIENT_TABLE";
    String columnFamilyName = "C1";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (admin.tableExists(tn)) {
            // 获取现有的表描述符
            TableDescriptor tableDescriptor = admin.getDescriptor(tn);
            TableDescriptorBuilder builder = TableDescriptorBuilder.newBuilder(tableDescriptor);

            // 如果列族不存在，则添加新的列族
            if (tableDescriptor.getColumnFamily(Bytes.toBytes(columnFamilyName)) == null) {
                ColumnFamilyDescriptor columnFamilyDescriptor = ColumnFamilyDescriptorBuilder.newBuilder(Bytes.toBytes(columnFamilyName)).build();
                builder.setColumnFamily(columnFamilyDescriptor);
                System.out.println("Column family " + columnFamilyName + " added.");
            } else {
                System.out.println("Column family " + columnFamilyName + " already exists, altering properties if needed.");
            }

            // 修改表结构
            admin.modifyTable(builder.build());
            System.out.println("Table " + tableName + " altered successfully.");

            // 等待直到表修改完成
            while (admin.getDescriptor(tn).equals(tableDescriptor)) {
                Thread.sleep(100);
            }
            System.out.println("Confirmed: Table " + tableName + " has been altered.");
        } else {
            System.out.println("Table " + tableName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.6 删除表

```java
/**
 * @Description 删除指定的表
 * @throws IOException 如果操作失败，抛出异常
 */
@Test
public void dropTable() throws IOException {
    String tableName = "CLIENT_TABLE";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (admin.tableExists(tn)) {
            if (!admin.isTableDisabled(tn)) {
                admin.disableTable(tn);
            }
            // 删除表前清除表中的所有快照
            for (SnapshotDescription snapshot : admin.listSnapshots(tableName + "-*")) {
                admin.deleteSnapshot(snapshot.getName());
                System.out.println("Snapshot " + snapshot.getName() + " deleted successfully.");
            }
            admin.deleteTable(tn);
            System.out.println("Table " + tableName + " deleted successfully.");
        } else {
            System.out.println("Table " + tableName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

## 三、数据操作基础

### 3.1 数据插入操作

#### 3.1.1 单行数据插入

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 插入或更新数据
 */
@Test
public void putDataByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Put对象，指定行键
    Put put = new Put(Bytes.toBytes("row1"));

    // 添加单个列族和列的数据
    put.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("David"));
    // 添加带有时间戳的数据
    put.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), System.currentTimeMillis(), Bytes.toBytes("30"));
    // 设置写前不覆盖
    put.setDurability(Durability.SKIP_WAL);
    // 添加其他属性
    put.setTTL(86400000); // 设置存活时间为一天 (以毫秒为单位)

    // 执行插入操作
    table.put(put);
    // 关闭表
    table.close();
}
```

#### 3.1.2 批量数据插入

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 批量插入数据
 */
@Test
public void batchPutByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Put对象列表
    List<Put> putList = new ArrayList<>();
    // 创建并添加多行数据
    Put put1 = new Put(Bytes.toBytes("row2"));
    put1.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("Alice"));
    put1.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), Bytes.toBytes("28"));
    putList.add(put1);

    Put put2 = new Put(Bytes.toBytes("row3"));
    put2.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("Bob"));
    put2.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), Bytes.toBytes("32"));
    putList.add(put2);

    // 添加更多行的数据
    Put put3 = new Put(Bytes.toBytes("row4"));
    put3.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("Charlie"));
    put3.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), Bytes.toBytes("25"));
    put3.setTTL(604800000); // 设置存活时间为七天
    putList.add(put3);

    // 执行批量插入操作
    table.put(putList);
    // 关闭表
    table.close();
}
```

### 3.2 数据查询操作

#### 3.2.1 单行数据查询

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 获取指定行的数据
 */
@Test
public void getRowByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Get对象，指定行键
    Get get = new Get(Bytes.toBytes("row1"));

    // 获取特定列族的数据
    get.addFamily(Bytes.toBytes("C1"));
    // 获取特定列的数据
    get.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"));
    // 设置时间戳范围
    get.setTimeRange(0, System.currentTimeMillis());
    // 设置最大版本数
    get.readVersions(3);
    // 设置缓存以优化性能
    get.setCacheBlocks(true);
    // 检查是否存在指定行
    if (!table.exists(get)) {
        System.out.println("Row 'row1' does not exist.");
        table.close();
        return;
    }

    // 获取数据
    Result result = table.get(get);
    for (Cell cell : result.rawCells()) {
        String family = Bytes.toString(CellUtil.cloneFamily(cell));  // 获取列族
        String qualifier = Bytes.toString(CellUtil.cloneQualifier(cell));  // 获取列名
        String value = Bytes.toString(CellUtil.cloneValue(cell));  // 获取列值
        System.out.println("Row: " + Bytes.toString(result.getRow()) + ", Column Family: " + family + ", Qualifier: " + qualifier + ", Value: " + value);
    }
    // 关闭表
    table.close();
}
```

#### 3.2.2 表数据扫描

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 扫描表数据并展示更多操作
 */
@Test
public void scanTableByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Scan对象
    Scan scan = new Scan();

    // 设置扫描的开始和结束行键
    scan.withStartRow(Bytes.toBytes("row1"));
    scan.withStopRow(Bytes.toBytes("row4"));
    // 设置要扫描的列族和列
    scan.addFamily(Bytes.toBytes("C1"));
    scan.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"));
    // 设置时间戳范围
    scan.setTimeRange(0, System.currentTimeMillis());
    // 设置最大版本数
    scan.readVersions(2);
    // 设置缓存行数以优化性能
    scan.setCaching(100);
    // 设置批量返回的单元格数量
    scan.setBatch(10);

    // 添加过滤器以筛选数据
    FilterList filterList = new FilterList(FilterList.Operator.MUST_PASS_ALL);
    // 添加列值过滤器
    filterList.addFilter(new SingleColumnValueFilter(Bytes.toBytes("C1"), Bytes.toBytes("name"), CompareOperator.EQUAL, Bytes.toBytes("David")));
    // 添加行键过滤器
    filterList.addFilter(new RowFilter(CompareOperator.LESS, new BinaryComparator(Bytes.toBytes("row5"))));
    // 添加前缀过滤器
    filterList.addFilter(new PrefixFilter(Bytes.toBytes("row")));
    // 设置过滤器
    scan.setFilter(filterList);

    // 执行扫描操作
    ResultScanner scanner = table.getScanner(scan);
    try {
        for (Result result : scanner) {
            // 输出每个行的数据
            System.out.println("Found row: " + result);
            // 可以对数据进行更多的操作
            byte[] value = result.getValue(Bytes.toBytes("C1"), Bytes.toBytes("name"));
            if (value != null) {
                System.out.println("Name: " + Bytes.toString(value));
            }
        }
    } finally {
        // 关闭扫描器
        scanner.close();
        // 关闭表
        table.close();
    }
}
```

#### 3.2.3 行数统计

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 统计表中行的数量
 */
@Test
public void countRowsByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Scan对象
    Scan scan = new Scan();

    // 设置扫描的缓存和批量大小以提高性能
    scan.setCaching(500);
    scan.setBatch(100);

    // 执行扫描操作
    ResultScanner scanner = table.getScanner(scan);
    int rowCount = 0;
    try {
        for (Result result : scanner) {
            rowCount++;
        }
        System.out.println("Total number of rows: " + rowCount);
    } finally {
        // 关闭扫描器
        scanner.close();
        // 关闭表
        table.close();
    }
}
```

### 3.3 数据删除操作

#### 3.3.1 单行数据删除

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除指定行的数据
 */
@Test
public void deleteRowByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Delete对象，指定行键
    Delete delete = new Delete(Bytes.toBytes("row1"));

    // 删除特定列族的数据
    delete.addFamily(Bytes.toBytes("C1"));
    // 删除特定列的数据
    delete.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"));
    // 设置时间戳以删除特定时间的数据
    delete.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("age"), System.currentTimeMillis());

    // 删除指定行的所有版本
    delete.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("address"));

    // 执行删除操作
    table.delete(delete);
    System.out.println("Row 'row1' deleted successfully.");
    // 关闭表
    table.close();
}
```

#### 3.3.2 删除所有版本数据

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除指定行的所有版本的数据
 */
@Test
public void deleteAllVersionsByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Delete对象，指定行键
    Delete delete = new Delete(Bytes.toBytes("row1"));

    // 删除指定列族中所有版本的数据
    delete.addFamily(Bytes.toBytes("C1"));
    // 删除指定列的所有版本的数据
    delete.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("name"));

    // 执行删除操作
    table.delete(delete);
    System.out.println("All versions of row 'row1' deleted successfully.");
    // 关闭表
    table.close();
}
```

#### 3.3.3 批量数据删除

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 批量删除数据
 */
@Test
public void batchDeleteByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Delete对象列表
    List<Delete> deleteList = new ArrayList<>();

    // 创建并添加删除操作
    Delete delete1 = new Delete(Bytes.toBytes("row2"));
    delete1.addFamily(Bytes.toBytes("C1"));
    deleteList.add(delete1);

    Delete delete2 = new Delete(Bytes.toBytes("row3"));
    delete2.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("age"));
    deleteList.add(delete2);

    // 执行批量删除操作
    table.delete(deleteList);
    System.out.println("Batch delete operation completed successfully.");
    // 关闭表
    table.close();
}
```

### 3.4 计数器操作

#### 3.4.1 列值增量操作

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 对指定列的值进行增量操作，类似于HBase Shell中的incr命令
 */
@Test
public void incrementColumnValue() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Increment对象，指定行键
    Increment increment = new Increment(Bytes.toBytes("row1"));

    // 对特定列族和列进行增量操作
    increment.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("counter"), 1); // 将"counter"列的值增加1

    // 执行增量操作
    Result result = table.increment(increment);
    // 输出增量后的值
    long newValue = Bytes.toLong(result.getValue(Bytes.toBytes("C1"), Bytes.toBytes("counter")));
    System.out.println("New value of 'counter': " + newValue);

    // 关闭表
    table.close();
}
```

#### 3.4.2 单列增量操作

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 使用单个API对列进行增量操作，类似于HBase Shell中的incr命令
 */
@Test
public void incrementSingleColumnValue() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);

    // 使用incrementColumnValue方法对列进行增量操作
    long newValue = table.incrementColumnValue(Bytes.toBytes("row1"), Bytes.toBytes("C1"), Bytes.toBytes("counter"), 5); // 将"counter"列的值增加5
    System.out.println("New value of 'counter' after increment: " + newValue);

    // 关闭表
    table.close();
}
```

#### 3.4.3 获取计数器值

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 获取指定列族和列的计数器值
 */
@Test
public void getCounterByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Get对象，指定行键
    Get get = new Get(Bytes.toBytes("row1"));

    // 获取特定列族和列的计数器值
    get.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("counter"));
    // 获取数据
    Result result = table.get(get);
    byte[] value = result.getValue(Bytes.toBytes("C1"), Bytes.toBytes("counter"));
    if (value != null) {
        long counterValue = Bytes.toLong(value);
        System.out.println("Counter value for row 'row1', column 'C1:counter': " + counterValue);
    } else {
        System.out.println("Counter for row 'row1' does not exist.");
    }

    // 使用增量计数器获取最新的值
    Increment increment = new Increment(Bytes.toBytes("row1"));
    increment.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("counter"), 0);
    Result incrementResult = table.increment(increment);
    long updatedCounterValue = Bytes.toLong(incrementResult.getValue(Bytes.toBytes("C1"), Bytes.toBytes("counter")));
    System.out.println("Updated counter value for row 'row1', column 'C1:counter': " + updatedCounterValue);

    // 关闭表
    table.close();
}
```

## 四、快照管理高级操作

### 4.1 创建表快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 创建指定表的快照
 */
@Test
public void createSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        TableName tableName = TableName.valueOf("CLIENT_TABLE");
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";
        SnapshotType snapshotType = SnapshotType.FLUSH; // 设置快照类型，支持 FLUSH, SKIPFLUSH, 等

        // 创建快照
        admin.snapshot(snapshotName, tableName, snapshotType);
        System.out.println("Snapshot " + snapshotName + " created successfully for table " + tableName.getNameAsString() + " with type " + snapshotType + ".");
    } finally {
        admin.close();
    }
}
```

### 4.2 从快照恢复表

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 使用快照恢复表，并验证恢复是否成功
 */
@Test
public void restoreSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";
        TableName tableName = TableName.valueOf("CLIENT_TABLE");

        // 禁用表
        if (admin.isTableEnabled(tableName)) {
            admin.disableTable(tableName);
        }

        // 使用快照恢复表
        admin.restoreSnapshot(snapshotName);
        System.out.println("Table " + tableName.getNameAsString() + " restored successfully from snapshot " + snapshotName + ".");

        // 启用表
        admin.enableTable(tableName);

        // 验证表是否已启用
        if (admin.isTableEnabled(tableName)) {
            System.out.println("Confirmed: Table " + tableName.getNameAsString() + " is enabled after restore.");
        } else {
            System.out.println("Warning: Table " + tableName.getNameAsString() + " could not be enabled after restore.");
        }
    } finally {
        admin.close();
    }
}
```

### 4.3 克隆快照创建新表

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 克隆快照创建新表，并验证新表是否成功创建
 */
@Test
public void cloneSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";
        TableName newTableName = TableName.valueOf("CLIENT_TABLE_CLONE");

        // 克隆快照创建新表
        admin.cloneSnapshot(snapshotName, newTableName);
        System.out.println("Table " + newTableName.getNameAsString() + " cloned successfully from snapshot " + snapshotName + ".");

        // 验证新表是否已创建
        if (admin.tableExists(newTableName)) {
            System.out.println("Confirmed: Table " + newTableName.getNameAsString() + " exists after cloning.");
        } else {
            System.out.println("Warning: Table " + newTableName.getNameAsString() + " could not be found after cloning.");
        }
    } finally {
        admin.close();
    }
}
```

### 4.4 列出所有快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 列出所有快照以及快照的详细信息
 */
@Test
public void listSnapshotsByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        // 列出所有快照
        List<SnapshotDescription> snapshots = admin.listSnapshots();
        if (snapshots.isEmpty()) {
            System.out.println("No snapshots available.");
        } else {
            for (SnapshotDescription snapshot : snapshots) {
                System.out.println("Snapshot Name: " + snapshot.getName() + ", Table: " + snapshot.getTableName() + ", Creation Time: " + snapshot.getCreationTime() + ", Snapshot Type: " + snapshot.getType());
            }
        }
    } finally {
        admin.close();
    }
}
```

### 4.5 删除快照

#### 4.5.1 删除指定快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除指定的快照
 */
@Test
public void deleteSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";

        // 检查快照是否存在
        List<SnapshotDescription> snapshots = admin.listSnapshots();
        boolean snapshotExists = snapshots.stream().anyMatch(snapshot -> snapshot.getName().equals(snapshotName));
        if (snapshotExists) {
            // 删除快照
            admin.deleteSnapshot(snapshotName);
            System.out.println("Snapshot " + snapshotName + " deleted successfully.");
        } else {
            System.out.println("Snapshot " + snapshotName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

#### 4.5.2 删除所有快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除所有快照
 */
@Test
public void deleteAllSnapshotsByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        // 删除所有快照
        Pattern pattern = Pattern.compile(".*");
        admin.deleteSnapshots(pattern);
        System.out.println("All snapshots deleted successfully.");
    } finally {
        admin.close();
    }
}
```
```

## 来源 8: Personal-markdown-notes / `hbase/Shell操作/HbaseShell管理操作.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Shell操作/HbaseShell管理操作.md>
- 本地路径: `hbase/Shell操作/HbaseShell管理操作.md`

```markdown
# HBase Shell 管理操作

## 简介

HBase Shell是Apache HBase的命令行工具，提供与HBase数据库交互的接口。通过Shell命令，用户可以执行数据库管理操作、表管理和数据操作等功能。本文档主要介绍HBase Shell的管理操作命令。

## 集群信息操作

这些命令用于查看和管理HBase集群的基本信息。

### status

- 显示服务器集群状态，包括活跃的master数量、备份的master数量、RegionServer数量和集群负载

**示例：**
```shell
hbase:001:0> status
1 active master, 2 backup masters, 3 servers, 0 dead, 1.0000 average load
Took 0.3839 seconds  
```

### whoami

- 显示当前连接HBase的用户身份和权限信息

**示例：**
```shell
hbase:002:0> whoami
root (auth:SIMPLE)
    groups: root
Took 0.0472 seconds
```

## 表信息查询

这些命令用于查询HBase中表的基本信息。

### list

- 列出HBase中所有表的名称

**示例：**
```shell
hbase:003:0> list
TABLE                                                                                                                                                                                                                
CLONE_ORDER_INFO                                                                                                                                                                                                     
ORDER_INFO                                                                                                                                                                                                           
2 row(s)
Took 0.0294 seconds                                                                                                                                                                                                  
=> ["CLONE_ORDER_INFO", "ORDER_INFO"]
```

### count

- 统计指定表的总行数
- 注意：不建议在大数据量表上使用此命令，会占用大量资源和时间

**示例：**
```shell
hbase:006:0> count 'ORDER_INFO'
5 row(s)
Took 0.0544 seconds                                                                                                                                                                                                  
=> 5
```

### describe

- 详细展示表的结构信息，包括表状态、列族详情和设置参数

**示例：**
```shell
hbase:007:0> describe 'ORDER_INFO'
Table ORDER_INFO is ENABLED                                                                                                                                                                                          
ORDER_INFO, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}                                                                                                                       
COLUMN FAMILIES DESCRIPTION                                                                                                                                                                                          
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '5', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

2 row(s)
Quota is disabled
Took 0.1130 seconds 
```

### exists

- 检查指定表是否存在
- 相比list命令，更适用于快速检查特定表，尤其在表数量很大的情况下

**示例：**
```shell
hbase:008:0> exists 'ORDER_INFO'
Table ORDER_INFO does exist                                                                                                                                                                                          
Took 0.0150 seconds                                                                                                                                                                                                  
=> true
hbase:009:0> exists 'ORDER_INFO1'
Table ORDER_INFO1 does not exist                                                                                                                                                                                     
Took 0.0066 seconds                                                                                                                                                                                                  
=> false
```

### is_enabled / is_disabled

- 检查指定表是否处于启用或禁用状态
- 在执行某些操作（如drop）前，需要先确认表的状态

**示例：**
```shell
hbase:010:0> is_enabled 'ORDER_INFO'
true                                                                                                                                                                                                                 
Took 0.0312 seconds                                                                                                                                                                                                  
=> true
hbase:011:0> is_disabled 'ORDER_INFO'
false                                                                                                                                                                                                                
Took 0.0099 seconds                                                                                                                                                                                                  
=> false
```

## 表管理操作

这些命令用于创建、修改和管理HBase表。

### create

- 创建新表，指定表名和一个或多个列族

**示例：**
```shell
hbase:013:0> create 'NEW_TABLE', 'CF1', 'CF2'
Created table NEW_TABLE
Took 0.8123 seconds                                                                                                                                                                                                  
=> Hbase::Table - NEW_TABLE
```

### alter

- 修改表的结构，包括添加、删除列族或更改列族属性
- 修改表的结构不会影响表中现有数据

**示例：**
```shell
hbase:014:0> create 'ALTER_TEST','C1','C2'
Created table ALTER_TEST
Took 0.6650 seconds                                                                                                                                                                                                  
=> Hbase::Table - ALTER_TEST
hbase:015:0> describe 'ALTER_TEST'
Table ALTER_TEST is ENABLED                                                                                                                                                                                          
ALTER_TEST, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}                                                                                                                       
COLUMN FAMILIES DESCRIPTION                                                                                                                                                                                          
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

2 row(s)
Quota is disabled
Took 0.0575 seconds                                                                                                                                                                                                  
hbase:016:0> alter 'ALTER_TEST','C3'
Updating all regions with the new schema...
1/1 regions updated.
Done.
Took 1.8192 seconds                                                                                                                                                                                                  
hbase:017:0> describe 'ALTER_TEST'
Table ALTER_TEST is ENABLED                                                                                                                                                                                          
ALTER_TEST, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}                                                                                                                       
COLUMN FAMILIES DESCRIPTION                                                                                                                                                                                          
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

{NAME => 'C3', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

3 row(s)
Quota is disabled
Took 0.0927 seconds                                                                                                                                                                                                  
hbase:018:0> alter 'ALTER_TEST','delete' => 'C3'
Updating all regions with the new schema...
1/1 regions updated.
Done.
Took 1.7897 seconds                                                                                                                                                                                                  
hbase:019:0> describe 'ALTER_TEST'
Table ALTER_TEST is ENABLED                                                                                                                                                                                          
ALTER_TEST, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}                                                                                                                       
COLUMN FAMILIES DESCRIPTION                                                                                                                                                                                          
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

2 row(s)
Quota is disabled
Took 0.0699 seconds
```

### disable / enable

- 禁用和启用表
- 许多管理操作（如drop、alter）要求表先被禁用
- 禁用表期间，表不可访问

**示例：**
```shell
hbase:020:0> disable 'ALTER_TEST'
Took 0.3761 seconds                                                                                                                                                                                                  
hbase:021:0> enable 'ALTER_TEST'
Took 0.6413 seconds
```

### drop

- 永久删除一张表及其所有数据
- 注意：只能删除已经被禁用的表，且操作不可恢复

**示例：**
```shell
hbase:022:0> disable 'ALTER_TEST'
Took 0.3607 seconds                                                                                                                                                                                                  
hbase:023:0> drop 'ALTER_TEST'
Took 0.3635 seconds  
```

### truncate

- 清空表中所有数据，但保留表结构
- 实际操作为：禁用表->删除表->以相同结构重新创建表
- 重要：在执行此操作前应考虑备份或快照

**示例：**
```shell
hbase:003:0> scan 'CLONE_ORDER_INFO'
ROW                                                    COLUMN+CELL                                                                                                                                                   
 row1                                                  column=C1:order_count, timestamp=2024-10-15T13:25:40.085, value=\x00\x00\x00\x00\x00\x00\x00(                                                                 
 row1                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.435, value=2024-10-01                                                                                     
 row1                                                  column=C1:order_id, timestamp=2024-10-15T13:20:09.379, value=11111                                                                                            
 row1                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.460, value=Alice                                                                                       
 row1                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.486, value=123-456-7890                                                                               
 row2                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.531, value=2024-10-02                                                                                     
 row2                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.518, value=67890                                                                                            
 row2                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.546, value=Bob                                                                                         
 row2                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.573, value=234-567-8901                                                                               
 row3                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.615, value=2024-10-03                                                                                     
 row3                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.594, value=13579                                                                                            
 row3                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.632, value=Charlie                                                                                     
 row3                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.661, value=345-678-9012                                                                               
 row4                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.726, value=2024-10-04                                                                                     
 row4                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.701, value=24680                                                                                            
 row4                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.744, value=David                                                                                       
 row4                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.768, value=456-789-0123                                                                               
 row5                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.810, value=2024-10-05                                                                                     
 row5                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.798, value=11223                                                                                            
 row5                                                  column=C2:customer_name, timestamp=2024-10-15T12:53:27.341, value=Eva                                                                                         
 row5                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.842, value=567-890-1234                                                                               
5 row(s)
Took 0.2718 seconds                                                                                                                                                                                                  
hbase:004:0> truncate 'CLONE_ORDER_INFO'
Truncating 'CLONE_ORDER_INFO' table (it may take a while):
Disabling table...
Truncating table...
Took 1.6162 seconds                                                                                                                                                                                                  
hbase:005:0> scan 'CLONE_ORDER_INFO'
ROW                                                    COLUMN+CELL                                                                                                                                                   
0 row(s)
Took 0.6254 seconds     
```

## 数据操作命令

除了上述管理操作外，HBase Shell还提供了一系列数据操作命令，如：

### put

- 向表中插入或更新单元格数据

### get

- 获取表中特定行的数据
- 支持获取整行数据或指定列族、列的数据
- 可以指定时间戳版本或获取多版本数据

**语法：**
```shell
get '<表名>', '<行键>', {COLUMN => '<列族:列名>', VERSIONS => <版本数>, TIMESTAMP => <时间戳>}
```

**示例：**
```shell
# 获取行数据
hbase:001:0> get 'ORDER_INFO', 'row1'
COLUMN                        CELL                                                                                                                                                                            
 C1:order_count               timestamp=2024-10-15T13:25:40.085, value=\x00\x00\x00\x00\x00\x00\x00(                                                                                          
 C1:order_date                timestamp=2024-10-15T12:52:37.435, value=2024-10-01                                                                                                              
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111                                                                                                                   
 C2:customer_name             timestamp=2024-10-15T12:52:37.460, value=Alice                                                                                                                  
 C2:customer_phone            timestamp=2024-10-15T12:52:37.486, value=123-456-7890                                                                                                          
5 row(s)
Took 0.0351 seconds

# 获取指定列族数据
hbase:002:0> get 'ORDER_INFO', 'row1', {COLUMN => 'C1'}
COLUMN                        CELL                                                                                                                                                                            
 C1:order_count               timestamp=2024-10-15T13:25:40.085, value=\x00\x00\x00\x00\x00\x00\x00(                                                                                          
 C1:order_date                timestamp=2024-10-15T12:52:37.435, value=2024-10-01                                                                                                              
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111                                                                                                                   
3 row(s)
Took 0.0284 seconds

# 获取指定列的数据
hbase:003:0> get 'ORDER_INFO', 'row1', {COLUMN => 'C1:order_id'}
COLUMN                        CELL                                                                                                                                                                            
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111                                                                                                                   
1 row(s)
Took 0.0241 seconds

# 获取多个版本的数据
hbase:004:0> get 'ORDER_INFO', 'row1', {COLUMN => 'C1:order_id', VERSIONS => 3}
COLUMN                        CELL                                                                                                                                                                            
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111                                                                                                                   
 C1:order_id                  timestamp=2024-10-15T12:52:37.379, value=12345                                                                                                                   
2 row(s)
Took 0.0289 seconds
```

### scan

- 扫描表中的数据，可设定开始和结束行、过滤条件等

### delete

- 删除表中的数据（单元格、列、列族或整行）

## 高级命令

HBase Shell还提供了一些高级管理命令：

### snapshot

- 创建表的快照，用于备份或迁移

### clone_snapshot

- 从现有快照创建新表

### restore_snapshot

- 从快照恢复表数据

### balance_switch

- 启用或禁用自动负载均衡

## 总结

HBase Shell提供了全面的命令集用于管理HBase集群、表和数据。正确使用这些命令可以高效地管理和维护HBase数据库。对于大型集群或生产环境，建议在执行可能影响性能的操作前先测试并评估影响。
```

## 来源 9: Personal-markdown-notes / `hbase/Shell操作/Hbase常见的Shell操作.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/hbase/Shell操作/Hbase常见的Shell操作.md>
- 本地路径: `hbase/Shell操作/Hbase常见的Shell操作.md`

```markdown
# HBase常见的Shell操作

## 基本表操作

### 创建表

**语法：** `create '表名', '列族名', ...`

```shell
create 'ORDER_INFO', 'C1', 'C2'
```

- 创建一个表，表名为 `ORDER_INFO`，列族为 `C1` 和 `C2`。
- 表可以有多个列族（Column Family）。

### 查看所有表

**命令：**

```shell
list
```

- 列出所有当前存在的表。

### 显示表描述

**语法：** `describe '表名'`

```shell
describe 'ORDER_INFO'
```

**示例：**
```shell
hbase:031:0> describe 'ORDER_INFO'
Table ORDER_INFO is ENABLED                                                                                                                                                                                          
ORDER_INFO, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}                                                                                                                       
COLUMN FAMILIES DESCRIPTION                                                                                                                                                                                          
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', 
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}                                                                                                                    

2 row(s)
Quota is disabled
Took 0.1003 seconds   
```

- 显示指定表的详细结构信息。

### 修改表结构

**语法：** `alter '表名', { NAME => '列族名', VERSIONS => 版本数 }`

```shell
alter 'ORDER_INFO', { NAME => 'C1', VERSIONS => 5 }
```

**示例：**
```shell
hbase:032:0> alter 'ORDER_INFO',{NAME => 'C1' , VERSIONS => '5'} 
Updating all regions with the new schema...
1/1 regions updated.
Done.
Took 1.8954 seconds           
```

- 修改表的结构，例如调整列族的版本数。

### 启用表

**语法：** `enable '表名'`

```shell
enable 'ORDER_INFO'
```

- 启用一个已禁用的表。

### 禁用表

**语法：** `disable '表名'`

```shell
disable 'ORDER_INFO'
```

- 禁用一个表，必须在删除前进行禁用。

### 删除表

**语法：** `drop '表名'`

```shell
drop 'ORDER_INFO'
```

- 删除一个已禁用的表。

## 数据操作

### 插入数据

**语法：** `put '表名', '行键', '列族:列', '值'`

```shell
put 'ORDER_INFO', 'row1', 'C1:order_id', '12345'
```

**示例：**
```shell
hbase:002:0> put 'ORDER_INFO', 'row1', 'C1:order_id', '12345'
Took 0.1551 seconds  
```

- 插入一行数据到表中，`order_id` 列的值为 `'12345'`。

### 获取数据

**语法：** `get '表名', '行键'`

```shell
get 'ORDER_INFO', 'row1'
```

- 获取指定行键的数据。
- 显示中文数据可用 `{FORMATTER => 'toString'}`。

```shell
get 'ORDER_INFO', 'row1', {FORMATTER => 'toString'}
```

**示例：**
```shell
hbase:039:0> get 'ORDER_INFO', 'row1', {FORMATTER => 'toString'}
COLUMN                                                 CELL                                                                                                                                                          
 C1:order_date                                         timestamp=2024-10-15T12:52:37.435, value=2024-10-01                                                                                                           
 C1:order_id                                           timestamp=2024-10-15T12:52:37.409, value=12345                                                                                                                
 C2:customer_name                                      timestamp=2024-10-15T12:52:37.460, value=Alice                                                                                                                
 C2:customer_phone                                     timestamp=2024-10-15T12:52:37.486, value=123-456-7890                                                                                                         
1 row(s)
Took 0.0159 seconds   
```

### 更新数据

- 直接使用 `put` 命令来覆盖已有值，达到更新的效果。

```shell
put 'ORDER_INFO', 'row1', 'C1:order_id', '67890'
```

### 删除数据

**语法：** `delete '表名', '行键', '列族:列'`

```shell
delete 'ORDER_INFO', 'row1', 'C1:order_id'
```

**示例：**
```shell
hbase:052:0> delete 'ORDER_INFO','row1','C1:order_id'
Took 0.0210 seconds                                                                                                                                                                                                  
hbase:053:0> scan 'ORDER_INFO', {ROWPREFIXFILTER => 'row1'}
ROW                                                    COLUMN+CELL                                                                                                                                                   
 row1                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.435, value=2024-10-01                                                                                     
 row1                                                  column=C1:order_id, timestamp=2024-10-15T13:20:09.379, value=11111                                                                                            
 row1                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.460, value=Alice                                                                                       
 row1                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.486, value=123-456-7890                                                                               
1 row(s)
```

> **注意：**
>
> - 执行 `delete` 时，如果当前行有多个版本的数据，它会删除最近的一个版本。
> - HBase 默认保留每列三个最近的版本。
> - 可以通过设置 `VERSIONS` 属性来控制保留的版本数量。

### 删除整行

**语法：** `deleteall '表名', '行键'`

```shell
deleteall 'ORDER_INFO', 'row1'
```

- 删除指定行的所有数据。

### 计数行数

**语法：** `count '表名'`

```shell
count 'ORDER_INFO'
```

**示例：**
```shell
hbase:054:0> count 'ORDER_INFO'
5 row(s)
Took 0.0174 seconds                                                                                                                                                                                                  
=> 5
```

- 统计表中的行数。

### 增量计数操作

在 HBase 中，可以使用 `INCR` 操作来创建并累加列值，适用于计数器等场景。

**语法格式：**

```shell
incr '表名', '行键', '列族:列限定符', 增量值
```

- `表名`：操作的表名称。
- `行键`：指定要操作的行键。
- `列族:列限定符`：指定要操作的列。
- `增量值`：递增的数值，正数表示增加，负数表示减少。

**创建与累加操作：**

- **创建操作**：如果指定的列不存在，`INCR` 操作会首先创建该列，并将其初始值设置为指定的值（默认是 `0`），然后执行递增操作。

  ```shell
  incr 'ORDER_INFO', 'row1', 'C1:order_count', 20
  ```

- **累加操作**：当列已经存在时，`INCR` 会对现有的值进行累加，增量可以是正数或负数。

  ```shell
  incr 'ORDER_INFO', 'row1', 'C1:order_count', 1
  ```

- 该操作是原子的，适用于高并发环境下的计数需求。
- 如果某一列需要实现累加功能，必须使用 `INCR` 来创建对应的列。使用 `PUT` 创建的列无法实现累加。

**获取计数器的值：**

```shell
get_counter 'ORDER_INFO', 'row1', 'C1:order_count'
```

**示例：**
```shell
hbase:060:0> incr 'ORDER_INFO', 'row1', 'C1:order_count', 20
COUNTER VALUE = 20
Took 0.0053 seconds

hbase:063:0> get_counter 'ORDER_INFO' , 'row1','C1:order_count'
COUNTER VALUE = 20
Took 0.0043 seconds                                                                                                                                                                                               
```

## 扫描表操作

避免扫描大表，以免程序运行时间过长、内存不足，甚至导致节点死机。

### 全表扫描

**语法：** `scan '表名'`

```shell
scan 'ORDER_INFO'
```

- 扫描整个表的数据，慎用，效率较低。

### 限定显示条数

**语法：** `scan '表名', {LIMIT => N}`

> LIMIT => N，N不是表示示例的行数而是rowkey的个数

```shell
scan 'ORDER_INFO', {LIMIT => 3}
```

- 限定返回的记录条数。

### 指定查询某些列

**语法：** `scan '表名', {COLUMNS => ['列族:列', ...]}`

```shell
scan 'ORDER_INFO', {COLUMNS => ['C1:order_id', 'C2:customer_name']}
```

- 只扫描指定的列。

### 根据 RowKey 前缀扫描

**语法：** `scan '表名', {ROWPREFIXFILTER => '前缀'}`

```shell
scan 'ORDER_INFO', {ROWPREFIXFILTER => 'row1'}
```

- 根据 RowKey 的前缀来扫描表。

## 过滤器

在 HBase 中，过滤器用于限制扫描或获取数据时返回的结果集，帮助提高查询效率，减少不必要的数据传输。

**语法：**
- 在HBase Shell中执行的是Ruby脚本，背后调用HBase的Java API
- 过滤器在Shell中使用表达式描述，对应Java中的对象实例化

**解释：**
```shell
scan "ORDER_INFO" , {FILTER => "RowFilter(=,'binary:02602f66-adc7-40d4-8485-76b5632b5b53')", COLUMNS => ['C1:STATUS', 'C1:PAYWAY'], FORMATTER =>'toString'}
```

- RowFilter是Java API中Filter的构造器名称
- =是比较运算符，可以是>、<、>=等
- binary:xxx是比较器表达式，用于值比较

### 按行键过滤器

1. **PrefixFilter**：根据行键的前缀进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "PrefixFilter('row1')"}
   ```

2. **RowFilter**：基于行键的比较进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "RowFilter(=, 'binary:row1')"}
   ```

3. **InclusiveStopFilter**：扫描到指定的行键时停止。
   ```shell
   scan 'ORDER_INFO', {FILTER => "InclusiveStopFilter('row3')"}
   ```

4. **RandomRowFilter**：随机返回部分行数据。
   ```shell
   scan 'ORDER_INFO', {FILTER => "RandomRowFilter(0.5)"}
   ```

### 列过滤器

1. **SingleColumnValueFilter**：根据指定列的值进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "SingleColumnValueFilter('C1', 'order_id', =, 'binary:12345')"}
   ```

2. **ColumnPrefixFilter**：根据列名前缀进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "ColumnPrefixFilter('order')"}
   ```

3. **QualifierFilter**：基于列限定符的比较进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "QualifierFilter(=, 'binary:order_id')"}
   ```

4. **FamilyFilter**：基于列族的比较进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "FamilyFilter(=, 'binary:C1')"}
   ```

5. **DependentColumnFilter**：当指定列存在时，才返回整行数据。
   ```shell
   scan 'ORDER_INFO', {FILTER => "DependentColumnFilter('C1', 'order_id')"}
   ```

### 其他类型过滤器

1. **PageFilter**：用于分页查询，限制返回的行数。
   ```shell
   scan 'ORDER_INFO', {FILTER => "PageFilter(10)"}
   ```

2. **ValueFilter**：根据列值进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "ValueFilter(=, 'binary:12345')"}
   ```

3. **TimestampsFilter**：根据时间戳进行过滤。
   ```shell
   scan 'ORDER_INFO', {FILTER => "TimestampsFilter([1631022245123, 1631022245124])"}
   ```

4. **KeyOnlyFilter**：只返回行键，不返回列值。
   ```shell
   scan 'ORDER_INFO', {FILTER => "KeyOnlyFilter()"}
   ```

5. **SkipFilter**：跳过包含特定条件的行。
   ```shell
   scan 'ORDER_INFO', {FILTER => "SkipFilter(SingleColumnValueFilter('C1', 'order_id', =, 'binary:12345'))"}
   ```

6. **FirstKeyOnlyFilter**：每行只返回第一个键值对。
   ```shell
   scan 'ORDER_INFO', {FILTER => "FirstKeyOnlyFilter()"}
   ```

### 组合过滤器

可以使用 `FilterList` 组合多个过滤器。

```shell
scan 'ORDER_INFO', {FILTER => "FilterList(AND, SingleColumnValueFilter('C1', 'order_id', =, 'binary:12345'), PrefixFilter('row1'))"}
```

- 组合使用多个过滤条件，返回符合所有条件的行。
- 可以使用 `AND` 或 `OR` 逻辑操作符来控制组合过滤器的行为。

## 快照管理

### 查看表的所有快照

**语法：** `list_snapshots`

```shell
list_snapshots
```

- 列出所有的 HBase 表快照。

### 创建快照

**语法：** `snapshot '表名', '快照名'`

```shell
snapshot 'ORDER_INFO', 'ORDER_INFO_SNAPSHOT'
# 或使用 create_snapshot 'ORDER_INFO', 'ORDER_INFO_SNAPSHOT'
```

- 创建表的快照，作为表当前状态的备份。

### 使用快照

**语法：** `clone_snapshot '快照名', '表名'`

```shell
clone_snapshot 'ORDER_INFO_SNAPSHOT', 'CLONE_ORDER_INFO'
```

- 从快照创建新表。

### 通过快照恢复数据

**语法：** `restore_snapshot '快照名'`

```shell
disable 'ORDER_INFO'
restore_snapshot 'ORDER_INFO_SNAPSHOT'
```

> 注意：恢复时，表需要先被禁用，恢复后会直接作用在所拍快照的表中。

### 删除快照

**语法：** `delete_snapshot '快照名'`

```shell
delete_snapshot 'ORDER_INFO_SNAPSHOT'
```

- 删除指定的快照。

### 快照导出

将快照从一个集群导出到另一个集群：

```shell
hbase org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot ORDER_INFO_SNAPSHOT -copy-to hdfs://mycluster/hbaseSnapshot -mappers 4
```

- `-snapshot`：要导出的快照名称。
- `-copy-to`：目标集群的 HDFS 路径。
- `-mappers`：指定并行执行的 mapper 数量。

## 集群管理操作

### 合并区域

**语法：** `merge_region 'region1', 'region2'`

- 合并两个指定的 Region。
- 需先通过 `list_regions '表名'` 找到具体的 Region 名称。

### 分裂区域

**语法：** `split '表名', '分裂键'`

```shell
split 'ORDER_INFO', 'row3'
```

- 将表按照指定的行键进行分裂，用于数据均衡。

### 压缩操作

#### Major 压缩

**语法：** `major_compact '表名'`

- 对指定表进行 major compaction，合并所有存储文件。

#### Minor 压缩

**语法：** `compact '表名'`

- 对指定表进行 minor compaction，合并部分存储文件，释放 HFile。

### 权限管理

**赋予权限：**

```shell
grant 'admin', 'RWXCA', 'ORDER_INFO'
```

- 给用户赋予读(R)、写(W)、执行(X)、创建(C)、管理(A)权限。

**收回权限：**

```shell
revoke 'admin', 'ORDER_INFO'
```

## 高级操作

### 执行命令文件

使用 HBase Shell 运行上传的 command 文件：

```shell
hbase shell /path/to/command-file.txt
```

- 确保文件中包含合法的 HBase Shell 命令。

### 数据导入导出

**导入数据：**

```shell
hbase org.apache.hadoop.hbase.mapreduce.ImportTsv -Dimporttsv.columns=HBASE_ROW_KEY,C1:order_id,C2:customer_name 'ORDER_INFO' /path/to/data.tsv
```

**大规模数据导入示例：**

```shell
./hbase org.apache.hadoop.hbase.mapreduce.ImportTsv \
-Dimporttsv.separator=',' \
-Dimporttsv.columns=HBASE_ROW_KEY,cf1:name,cf1:age,cf1:city,cf1:phone,cf1:email,cf2:occupation,cf2:company,cf2:salary,cf2:experience,cf2:department,cf3:hobby,cf3:favorite_color,cf3:sport,cf3:pet,cf3:music,cf4:address,cf4:zipcode,cf4:state,cf4:country,cf4:continent,cf5:social_media,cf5:website,cf5:blog,cf5:subscribed,cf5:membership \
USER_INFO /hbasedata/hbase_large_million_dataset.csv
```

### 大量数据的计数统计

对于大规模数据集，使用 MapReduce 任务来进行行数统计：

```shell
hbase org.apache.hadoop.hbase.mapreduce.RowCounter 'ORDER_INFO'
```

- 使用 MapReduce 框架来提高统计效率。
```

## 来源 10: Fuwari / `hbase/HBase-Data-Model-Explained.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Data-Model-Explained.md>
- 本地路径: `hbase/HBase-Data-Model-Explained.md`

```markdown
---
title: HBase数据模型
published: 2025-06-11
tags: [HBase, 大数据]
category: HBase
description: 深入解析HBase数据模型，详细讲解表、行、行键、列族等核心概念，以及与关系型数据库的对比分析，帮助开发者理解HBase的存储结构和数据组织方式。
draft: false
---

# HBase 数据模型

HBase 是 Apache Hadoop 生态系统中的一个重要组件，是一个分布式、可扩展的 NoSQL 数据库，专为大数据存储和处理而设计。理解 HBase 的数据模型是掌握 HBase 的关键。

## 一、HBase 与关系型数据库的对比

### 1. 存储模型差异

- **关系型数据库**：基于表格模型，具有固定的行和列结构，强调数据关系
- **HBase**：基于面向列的存储架构，采用稀疏矩阵结构，灵活性更高

### 2. 数据组织方式

- **关系型数据库**：表、行、列结构严格定义
- **HBase**：可视为多维 Map 结构，`{RowKey, Column Family:Column Qualifier, Timestamp} -> Value`

### 3. 适用场景

- **关系型数据库**：适合事务处理和复杂查询
- **HBase**：适合海量数据存储和高并发读写场景

## 二、HBase 基本数据结构

HBase 的数据模型由以下核心组件构成，它们以层级结构组织：

### 1. 表（Table）

- HBase 中的数据以表的形式组织
- 表可以包含多个列族，但所有行共享相同的列族结构
- 表在物理上按照 Region 进行分区存储

### 2. 行（Row）

- 每一行由唯一的行键（RowKey）标识
- 行按照 RowKey 的字典顺序进行存储
- 行中的数据按列族进行分组

### 3. 行键（RowKey）

- 唯一标识表中的一行数据
- 类似于关系数据库中的主键，但在 HBase 中更为重要
- 每行数据必须包含一个 RowKey
- RowKey 设计直接影响数据的分布和访问性能

### 4. 列族（Column Family）

- 将表中的数据列进行逻辑分组
- 列族在创建表时定义，不能轻易更改
- 每个列族有独立的存储属性（如压缩算法、块大小等）
- 建议保持列族数量少（通常 1-3 个），以优化性能

### 5. 列限定符（Column Qualifier）

- 每个列族包含多个列限定符
- 可以动态添加，不需要预先定义
- 列的完整表示形式为`列族名:列限定符名`
- 不同行可以有不同的列限定符集合

### 6. 单元格（Cell）

- 由行键、列族和列限定符共同确定的最小存储单元
- 包含具体的数据值和时间戳
- 内容以二进制形式存储

### 7. 时间戳（Timestamp）

- 每个单元格可以包含同一数据的多个版本
- 版本通过时间戳来区分
- 默认返回最新版本的数据
- 可以指定时间戳或时间范围查询历史版本

## 三、数据模型图解

### 1. 逻辑视图

HBase 表的逻辑结构可以表示为：

| RowKey  | Column Family: personal | Column Family: contact | Column Family: address |
| ------- | ----------------------- | ---------------------- | ---------------------- | ------------ |
|         | name                    | age                    | email                  | phone        |
| user123 | John Doe                | 30                     | john@abc.com           | 123-456-7890 |
| user456 | Jane Doe                | 25                     | jane@xyz.com           | 098-765-4321 |

说明：

- **RowKey**：唯一标识每一行用户数据
- **Column Family**：`personal`和`contact`是两个不同的列族
- **列限定符**：`name`、`age`、`email`、`phone`是具体的列
- **单元格**：例如，行键为`user123`、列族为`personal`、列限定符为`name`的单元格存储值`John Doe`

### 2. 多维映射结构

在逻辑上，HBase 的数据可以表示为多维映射结构：

```
RowKey: user123
  Column Family: personal
    name: John Doe (Timestamp: 1696886600)
    age: 30 (Timestamp: 1696886600)
  Column Family: contact
    email: john@abc.com (Timestamp: 1696886600)
    phone: 123-456-7890 (Timestamp: 1696886600)

RowKey: user456
  Column Family: personal
    name: Jane Doe (Timestamp: 1696886600)
    age: 25 (Timestamp: 1696886600)
  Column Family: contact
    email: jane@xyz.com (Timestamp: 1696886600)
    phone: 098-765-4321 (Timestamp: 1696886600)
```

### 3. 版本控制示例

HBase 支持数据多版本存储，以下是数据版本示例：

| Row Key       | Time Stamp | Column Family: contents     | Column Family: anchor         | Column Family: people  |
| ------------- | ---------- | --------------------------- | ----------------------------- | ---------------------- |
| "com.cnn.www" | t9         |                             | anchor:cssnsi.com = "CNN"     |                        |
| "com.cnn.www" | t8         |                             | anchor:my.look.ca = "CNN.com" |                        |
| "com.cnn.www" | t6         | contents:html = "<html>..." |                               |                        |
| "com.cnn.www" | t5         | contents:html = "<html>..." | anchor:cnn.com = "CNN"        |                        |
| "com.cnn.www" | t3         | contents:html = "<html>..." |                               | people:author = "John" |

从这个例子可以看出：

- 同一 RowKey（`com.cnn.www`）在不同时间点（t3、t5、t6、t8、t9）有不同版本的数据
- 每个版本可能更新不同的列族和列
- 查询时可以获取最新版本或指定时间戳的数据

## 四、HBase 数据模型设计最佳实践

### 1. RowKey 设计原则

- **唯一性**：确保 RowKey 在表中唯一
- **长度控制**：通常保持在 10-100 字节之间
- **避免热点**：防止数据集中在少数 Region
- **反转域名**：如存储网站域名时，可将域名反转（如 org.apache.www），确保相关数据聚集
- **加盐**：在 RowKey 前添加随机前缀，分散写入压力

### 2. 列族设计原则

- **数量控制**：通常保持在 1-3 个
- **命名简洁**：使用短小的名称减少存储开销
- **数据聚集**：将经常一起访问的列放在同一列族
- **访问频率**：根据访问模式分组，将热数据和冷数据分开

### 3. 时间戳管理

- **版本数控制**：设置合理的最大版本数
- **过期时间**：根据业务需求设置数据过期时间
- **自定义时间戳**：根据业务语义使用自定义时间戳

### 4. 二级索引策略

- HBase 不直接支持二级索引，但可以通过以下方式实现：
  - 创建索引表
  - 使用复合 RowKey
  - 利用 Phoenix 等工具提供的索引功能

## 五、HBase 物理存储模型

### 1. Region

- 表按 RowKey 范围水平分割为多个 Region
- 每个 Region 由一个 RegionServer 管理
- Region 是 HBase 分布式存储和负载均衡的基本单位

### 2. Store

- 每个 Region 中的每个列族对应一个 Store
- Store 是存储和访问的基本单位

### 3. StoreFile/HFile

- Store 中的数据存储在 HDFS 上的 HFile 文件中
- HFile 是 HBase 的底层存储格式，基于 LSM 树实现

### 4. MemStore

- 写入数据首先进入内存中的 MemStore
- 当 MemStore 达到阈值时，数据刷新到磁盘形成 StoreFile

### 5. WAL（Write Ahead Log）

- 用于数据恢复的日志文件
- 确保数据写入的持久性和一致性

## 六、HBase 与传统数据库的使用场景对比

### 1. 适合 HBase 的场景

- 超大规模数据存储（PB 级别）
- 高并发读写需求
- 非结构化/半结构化数据
- 时序数据存储
- 实时分析和批处理混合场景

### 2. 不适合 HBase 的场景

- 复杂事务处理
- 需要 JOIN 操作的关系型查询
- 小规模数据存储
- 高一致性要求的应用

## 七、HBase 数据操作

### 1. 基本操作

- **Put**：添加或更新数据
- **Get**：根据 RowKey 获取单行数据
- **Scan**：批量扫描数据
- **Delete**：删除数据

### 2. 批量操作

- **BatchPut**：批量写入数据
- **BatchGet**：批量获取数据

### 3. 原子操作

- **CheckAndPut**：根据条件执行 Put 操作
- **CheckAndDelete**：根据条件执行 Delete 操作
- **Increment**：原子递增操作

## 八、HBase 架构组件

### 1. 主要组件

- **HMaster**：管理 RegionServer 和元数据操作
- **RegionServer**：数据存取的服务器节点
- **Zookeeper**：协调各组件，进行节点管理和选举
- **HDFS**：底层数据存储系统

### 2. 工作流程

- 客户端首先与 Zookeeper 通信，获取元数据位置
- 获取表元数据，确定数据所在的 RegionServer
- 直接与 RegionServer 通信进行数据读写
- 数据写入经过 WAL 和 MemStore，最终存储到 HFile

通过理解 HBase 的数据模型及其设计原则，可以有效地利用 HBase 的优势，为大数据应用提供可靠、高效的存储解决方案。
```

## 来源 11: Fuwari / `hbase/HBase-Java-API-Comprehensive-Guide-to-Table-Management.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Java-API-Comprehensive-Guide-to-Table-Management.md>
- 本地路径: `hbase/HBase-Java-API-Comprehensive-Guide-to-Table-Management.md`

```markdown
---
title: HBase Java API：表管理综合指南
published: 2025-06-11
tags: [HBase, 大数据, Java]
category: HBase
description: 全面介绍HBase Java API在表管理中的实际应用，包括连接管理、表操作、数据CRUD等核心功能，帮助开发者高效使用HBase进行大数据存储与管理。
draft: false
---

# HBase Java API：表管理综合指南

HBase 是一个开源的、分布式的、可扩展的多维数据存储系统，构建于 Hadoop 之上。它因处理大量稀疏数据而闻名，而 HBase Java API 允许开发人员有效地管理 HBase 表。本指南将从基础到高级，系统地介绍如何使用 HBase Java API 进行表管理及数据操作。

## 一、连接管理基础

### 1.1 获取HBase Connection

HBase的connection对象是一个重量级对象，它是线程安全的，应避免频繁创建。在编写Spark、Flink等应用时，一个connection对象就足够了。

```java
/**
 * @throws IOException 如果创建连接失败，抛出异常
 * @Description 初始化HBase配置并建立连接
 */
@BeforeTest
public void initHbaseConf() throws IOException {
    // 创建默认的HBase配置对象
    Configuration conf = HBaseConfiguration.create();
    // 建立HBase连接
    connection = ConnectionFactory.createConnection(conf);
    // 获取Admin对象，用于表管理操作
    admin = connection.getAdmin();
}
```

### 1.2 获取HBase Admin对象和关闭连接

```java
/**
 * @throws IOException 如果关闭时发生错误，抛出异常
 * @Description 关闭HBase连接和Admin对象
 */
@AfterTest
public void closeHbaseConnection() throws IOException {
    // 关闭Admin对象
    admin.close();
    // 关闭HBase连接
    connection.close();
}
```

注意：Table对象是轻量级的，非线程安全，使用完毕需要close。

## 二、表管理基础操作

### 2.1 列出所有表

```java
/**
 * @Description 列出所有表的详细信息，包括表名和列族信息
 * @throws IOException 如果操作失败，抛出异常
 */
@Test
public void listAllTables() throws IOException {
    // 获取Admin对象
    Admin admin = connection.getAdmin();
    try {
        // 列出所有的表
        TableName[] tableNames = admin.listTableNames();
        for (TableName tableName : tableNames) {
            System.out.println("Table: " + tableName.getNameAsString());
            // 获取表的描述信息
            TableDescriptor tableDescriptor = admin.getDescriptor(tableName);
            for (ColumnFamilyDescriptor cfd : tableDescriptor.getColumnFamilies()) {
                System.out.println("  Column Family: " + cfd.getNameAsString());
                System.out.println("    Max Versions: " + cfd.getMaxVersions());
                System.out.println("    Min Versions: " + cfd.getMinVersions());
                System.out.println("    Time to Live: " + cfd.getTimeToLive());
            }
        }
    } finally {
        // 关闭Admin
        admin.close();
    }
}
```

### 2.2 获取表的描述信息

```java
/**
 * @Description 获取表的描述信息
 * @throws IOException 如果操作失败，抛出异常
 */
@Test
public void describeTable() throws IOException {
    String tableName = "CLIENT_TABLE"; // 可以根据需求修改具体表名
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (admin.tableExists(tn)) {
            TableDescriptor tableDescriptor = admin.getDescriptor(tn);
            System.out.println("Table Name: " + tableDescriptor.getTableName().getNameAsString());
            System.out.println("Table is Enabled: " + admin.isTableEnabled(tn));
            System.out.println("Table Region Replication: " + tableDescriptor.getRegionReplication());
            for (ColumnFamilyDescriptor cfd : tableDescriptor.getColumnFamilies()) {
                System.out.println("Column Family: " + cfd.getNameAsString());
                System.out.println("Max Versions: " + cfd.getMaxVersions());
                System.out.println("Min Versions: " + cfd.getMinVersions());
                System.out.println("Time to Live: " + cfd.getTimeToLive());
                System.out.println("Block Size: " + cfd.getBlocksize());
                System.out.println("Compression Type: " + cfd.getCompressionType());
                System.out.println("Bloom Filter Type: " + cfd.getBloomFilterType());
                System.out.println("Replication Scope: " + cfd.getScope());
            }
        } else {
            System.out.println("Table " + tableName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.3 启用表

```java
/**
 * @Description 启用指定的表，并等待启用完成
 * @throws IOException 如果操作失败，抛出异常
 * @throws InterruptedException 如果等待过程中被中断，抛出异常
 */
public void enableTable() throws IOException, InterruptedException {
    String tableName = "CLIENT_TABLE";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (!admin.isTableEnabled(tn)) {
            admin.enableTable(tn);
            System.out.println("Table " + tableName + " enable operation initiated.");
            // 等待直到表被启用
            while (!admin.isTableEnabled(tn)) {
                Thread.sleep(100);
            }
            System.out.println("Table " + tableName + " enabled successfully.");
        } else {
            System.out.println("Table " + tableName + " is already enabled.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.4 禁用表

```java
/**
 * @Description 禁用指定的表，并等待禁用完成
 * @throws InterruptedException 如果等待过程中被中断，抛出异常
 */
@Test
public void disableTable() throws IOException, InterruptedException {
    String tableName = "CLIENT_TABLE";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (!admin.isTableDisabled(tn)) {
            admin.disableTable(tn);
            System.out.println("Table " + tableName + " disable operation initiated.");
            // 等待直到表被禁用
            while (!admin.isTableDisabled(tn)) {
                Thread.sleep(100);
            }
            System.out.println("Table " + tableName + " disabled successfully.");
        } else {
            System.out.println("Table " + tableName + " is already disabled.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.5 修改表结构

```java
/**
 * @Description 修改表的结构，例如添加或修改列族
 * @throws IOException 如果操作失败，抛出异常
 * @throws InterruptedException 如果等待过程中被中断，抛出异常
 */
@Test
public void alterTable() throws IOException, InterruptedException {
    String tableName = "CLIENT_TABLE";
    String columnFamilyName = "C1";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (admin.tableExists(tn)) {
            // 获取现有的表描述符
            TableDescriptor tableDescriptor = admin.getDescriptor(tn);
            TableDescriptorBuilder builder = TableDescriptorBuilder.newBuilder(tableDescriptor);

            // 如果列族不存在，则添加新的列族
            if (tableDescriptor.getColumnFamily(Bytes.toBytes(columnFamilyName)) == null) {
                ColumnFamilyDescriptor columnFamilyDescriptor = ColumnFamilyDescriptorBuilder.newBuilder(Bytes.toBytes(columnFamilyName)).build();
                builder.setColumnFamily(columnFamilyDescriptor);
                System.out.println("Column family " + columnFamilyName + " added.");
            } else {
                System.out.println("Column family " + columnFamilyName + " already exists, altering properties if needed.");
            }

            // 修改表结构
            admin.modifyTable(builder.build());
            System.out.println("Table " + tableName + " altered successfully.");

            // 等待直到表修改完成
            while (admin.getDescriptor(tn).equals(tableDescriptor)) {
                Thread.sleep(100);
            }
            System.out.println("Confirmed: Table " + tableName + " has been altered.");
        } else {
            System.out.println("Table " + tableName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

### 2.6 删除表

```java
/**
 * @Description 删除指定的表
 * @throws IOException 如果操作失败，抛出异常
 */
@Test
public void dropTable() throws IOException {
    String tableName = "CLIENT_TABLE";
    Admin admin = connection.getAdmin();
    try {
        TableName tn = TableName.valueOf(tableName);
        if (admin.tableExists(tn)) {
            if (!admin.isTableDisabled(tn)) {
                admin.disableTable(tn);
            }
            // 删除表前清除表中的所有快照
            for (SnapshotDescription snapshot : admin.listSnapshots(tableName + "-*")) {
                admin.deleteSnapshot(snapshot.getName());
                System.out.println("Snapshot " + snapshot.getName() + " deleted successfully.");
            }
            admin.deleteTable(tn);
            System.out.println("Table " + tableName + " deleted successfully.");
        } else {
            System.out.println("Table " + tableName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

## 三、数据操作基础

### 3.1 数据插入操作

#### 3.1.1 单行数据插入

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 插入或更新数据
 */
@Test
public void putDataByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Put对象，指定行键
    Put put = new Put(Bytes.toBytes("row1"));

    // 添加单个列族和列的数据
    put.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("David"));
    // 添加带有时间戳的数据
    put.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), System.currentTimeMillis(), Bytes.toBytes("30"));
    // 设置写前不覆盖
    put.setDurability(Durability.SKIP_WAL);
    // 添加其他属性
    put.setTTL(86400000); // 设置存活时间为一天 (以毫秒为单位)

    // 执行插入操作
    table.put(put);
    // 关闭表
    table.close();
}
```

#### 3.1.2 批量数据插入

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 批量插入数据
 */
@Test
public void batchPutByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Put对象列表
    List<Put> putList = new ArrayList<>();
    // 创建并添加多行数据
    Put put1 = new Put(Bytes.toBytes("row2"));
    put1.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("Alice"));
    put1.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), Bytes.toBytes("28"));
    putList.add(put1);

    Put put2 = new Put(Bytes.toBytes("row3"));
    put2.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("Bob"));
    put2.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), Bytes.toBytes("32"));
    putList.add(put2);

    // 添加更多行的数据
    Put put3 = new Put(Bytes.toBytes("row4"));
    put3.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"), Bytes.toBytes("Charlie"));
    put3.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("age"), Bytes.toBytes("25"));
    put3.setTTL(604800000); // 设置存活时间为七天
    putList.add(put3);

    // 执行批量插入操作
    table.put(putList);
    // 关闭表
    table.close();
}
```

### 3.2 数据查询操作

#### 3.2.1 单行数据查询

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 获取指定行的数据
 */
@Test
public void getRowByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Get对象，指定行键
    Get get = new Get(Bytes.toBytes("row1"));

    // 获取特定列族的数据
    get.addFamily(Bytes.toBytes("C1"));
    // 获取特定列的数据
    get.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"));
    // 设置时间戳范围
    get.setTimeRange(0, System.currentTimeMillis());
    // 设置最大版本数
    get.readVersions(3);
    // 设置缓存以优化性能
    get.setCacheBlocks(true);
    // 检查是否存在指定行
    if (!table.exists(get)) {
        System.out.println("Row 'row1' does not exist.");
        table.close();
        return;
    }

    // 获取数据
    Result result = table.get(get);
    for (Cell cell : result.rawCells()) {
        String family = Bytes.toString(CellUtil.cloneFamily(cell));  // 获取列族
        String qualifier = Bytes.toString(CellUtil.cloneQualifier(cell));  // 获取列名
        String value = Bytes.toString(CellUtil.cloneValue(cell));  // 获取列值
        System.out.println("Row: " + Bytes.toString(result.getRow()) + ", Column Family: " + family + ", Qualifier: " + qualifier + ", Value: " + value);
    }
    // 关闭表
    table.close();
}
```

#### 3.2.2 表数据扫描

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 扫描表数据并展示更多操作
 */
@Test
public void scanTableByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Scan对象
    Scan scan = new Scan();

    // 设置扫描的开始和结束行键
    scan.withStartRow(Bytes.toBytes("row1"));
    scan.withStopRow(Bytes.toBytes("row4"));
    // 设置要扫描的列族和列
    scan.addFamily(Bytes.toBytes("C1"));
    scan.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"));
    // 设置时间戳范围
    scan.setTimeRange(0, System.currentTimeMillis());
    // 设置最大版本数
    scan.readVersions(2);
    // 设置缓存行数以优化性能
    scan.setCaching(100);
    // 设置批量返回的单元格数量
    scan.setBatch(10);

    // 添加过滤器以筛选数据
    FilterList filterList = new FilterList(FilterList.Operator.MUST_PASS_ALL);
    // 添加列值过滤器
    filterList.addFilter(new SingleColumnValueFilter(Bytes.toBytes("C1"), Bytes.toBytes("name"), CompareOperator.EQUAL, Bytes.toBytes("David")));
    // 添加行键过滤器
    filterList.addFilter(new RowFilter(CompareOperator.LESS, new BinaryComparator(Bytes.toBytes("row5"))));
    // 添加前缀过滤器
    filterList.addFilter(new PrefixFilter(Bytes.toBytes("row")));
    // 设置过滤器
    scan.setFilter(filterList);

    // 执行扫描操作
    ResultScanner scanner = table.getScanner(scan);
    try {
        for (Result result : scanner) {
            // 输出每个行的数据
            System.out.println("Found row: " + result);
            // 可以对数据进行更多的操作
            byte[] value = result.getValue(Bytes.toBytes("C1"), Bytes.toBytes("name"));
            if (value != null) {
                System.out.println("Name: " + Bytes.toString(value));
            }
        }
    } finally {
        // 关闭扫描器
        scanner.close();
        // 关闭表
        table.close();
    }
}
```

#### 3.2.3 行数统计

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 统计表中行的数量
 */
@Test
public void countRowsByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Scan对象
    Scan scan = new Scan();

    // 设置扫描的缓存和批量大小以提高性能
    scan.setCaching(500);
    scan.setBatch(100);

    // 执行扫描操作
    ResultScanner scanner = table.getScanner(scan);
    int rowCount = 0;
    try {
        for (Result result : scanner) {
            rowCount++;
        }
        System.out.println("Total number of rows: " + rowCount);
    } finally {
        // 关闭扫描器
        scanner.close();
        // 关闭表
        table.close();
    }
}
```

### 3.3 数据删除操作

#### 3.3.1 单行数据删除

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除指定行的数据
 */
@Test
public void deleteRowByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Delete对象，指定行键
    Delete delete = new Delete(Bytes.toBytes("row1"));

    // 删除特定列族的数据
    delete.addFamily(Bytes.toBytes("C1"));
    // 删除特定列的数据
    delete.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("name"));
    // 设置时间戳以删除特定时间的数据
    delete.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("age"), System.currentTimeMillis());

    // 删除指定行的所有版本
    delete.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("address"));

    // 执行删除操作
    table.delete(delete);
    System.out.println("Row 'row1' deleted successfully.");
    // 关闭表
    table.close();
}
```

#### 3.3.2 删除所有版本数据

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除指定行的所有版本的数据
 */
@Test
public void deleteAllVersionsByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Delete对象，指定行键
    Delete delete = new Delete(Bytes.toBytes("row1"));

    // 删除指定列族中所有版本的数据
    delete.addFamily(Bytes.toBytes("C1"));
    // 删除指定列的所有版本的数据
    delete.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("name"));

    // 执行删除操作
    table.delete(delete);
    System.out.println("All versions of row 'row1' deleted successfully.");
    // 关闭表
    table.close();
}
```

#### 3.3.3 批量数据删除

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 批量删除数据
 */
@Test
public void batchDeleteByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Delete对象列表
    List<Delete> deleteList = new ArrayList<>();

    // 创建并添加删除操作
    Delete delete1 = new Delete(Bytes.toBytes("row2"));
    delete1.addFamily(Bytes.toBytes("C1"));
    deleteList.add(delete1);

    Delete delete2 = new Delete(Bytes.toBytes("row3"));
    delete2.addColumns(Bytes.toBytes("C1"), Bytes.toBytes("age"));
    deleteList.add(delete2);

    // 执行批量删除操作
    table.delete(deleteList);
    System.out.println("Batch delete operation completed successfully.");
    // 关闭表
    table.close();
}
```

### 3.4 计数器操作

#### 3.4.1 列值增量操作

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 对指定列的值进行增量操作，类似于HBase Shell中的incr命令
 */
@Test
public void incrementColumnValue() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Increment对象，指定行键
    Increment increment = new Increment(Bytes.toBytes("row1"));

    // 对特定列族和列进行增量操作
    increment.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("counter"), 1); // 将"counter"列的值增加1

    // 执行增量操作
    Result result = table.increment(increment);
    // 输出增量后的值
    long newValue = Bytes.toLong(result.getValue(Bytes.toBytes("C1"), Bytes.toBytes("counter")));
    System.out.println("New value of 'counter': " + newValue);

    // 关闭表
    table.close();
}
```

#### 3.4.2 单列增量操作

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 使用单个API对列进行增量操作，类似于HBase Shell中的incr命令
 */
@Test
public void incrementSingleColumnValue() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);

    // 使用incrementColumnValue方法对列进行增量操作
    long newValue = table.incrementColumnValue(Bytes.toBytes("row1"), Bytes.toBytes("C1"), Bytes.toBytes("counter"), 5); // 将"counter"列的值增加5
    System.out.println("New value of 'counter' after increment: " + newValue);

    // 关闭表
    table.close();
}
```

#### 3.4.3 获取计数器值

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 获取指定列族和列的计数器值
 */
@Test
public void getCounterByClient() throws IOException {
    // 定义表名
    TableName tableName = TableName.valueOf("CLIENT_TABLE");
    // 获取表对象
    Table table = connection.getTable(tableName);
    // 创建Get对象，指定行键
    Get get = new Get(Bytes.toBytes("row1"));

    // 获取特定列族和列的计数器值
    get.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("counter"));
    // 获取数据
    Result result = table.get(get);
    byte[] value = result.getValue(Bytes.toBytes("C1"), Bytes.toBytes("counter"));
    if (value != null) {
        long counterValue = Bytes.toLong(value);
        System.out.println("Counter value for row 'row1', column 'C1:counter': " + counterValue);
    } else {
        System.out.println("Counter for row 'row1' does not exist.");
    }

    // 使用增量计数器获取最新的值
    Increment increment = new Increment(Bytes.toBytes("row1"));
    increment.addColumn(Bytes.toBytes("C1"), Bytes.toBytes("counter"), 0);
    Result incrementResult = table.increment(increment);
    long updatedCounterValue = Bytes.toLong(incrementResult.getValue(Bytes.toBytes("C1"), Bytes.toBytes("counter")));
    System.out.println("Updated counter value for row 'row1', column 'C1:counter': " + updatedCounterValue);

    // 关闭表
    table.close();
}
```

## 四、快照管理高级操作

### 4.1 创建表快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 创建指定表的快照
 */
@Test
public void createSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        TableName tableName = TableName.valueOf("CLIENT_TABLE");
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";
        SnapshotType snapshotType = SnapshotType.FLUSH; // 设置快照类型，支持 FLUSH, SKIPFLUSH, 等

        // 创建快照
        admin.snapshot(snapshotName, tableName, snapshotType);
        System.out.println("Snapshot " + snapshotName + " created successfully for table " + tableName.getNameAsString() + " with type " + snapshotType + ".");
    } finally {
        admin.close();
    }
}
```

### 4.2 从快照恢复表

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 使用快照恢复表，并验证恢复是否成功
 */
@Test
public void restoreSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";
        TableName tableName = TableName.valueOf("CLIENT_TABLE");

        // 禁用表
        if (admin.isTableEnabled(tableName)) {
            admin.disableTable(tableName);
        }

        // 使用快照恢复表
        admin.restoreSnapshot(snapshotName);
        System.out.println("Table " + tableName.getNameAsString() + " restored successfully from snapshot " + snapshotName + ".");

        // 启用表
        admin.enableTable(tableName);

        // 验证表是否已启用
        if (admin.isTableEnabled(tableName)) {
            System.out.println("Confirmed: Table " + tableName.getNameAsString() + " is enabled after restore.");
        } else {
            System.out.println("Warning: Table " + tableName.getNameAsString() + " could not be enabled after restore.");
        }
    } finally {
        admin.close();
    }
}
```

### 4.3 克隆快照创建新表

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 克隆快照创建新表，并验证新表是否成功创建
 */
@Test
public void cloneSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";
        TableName newTableName = TableName.valueOf("CLIENT_TABLE_CLONE");

        // 克隆快照创建新表
        admin.cloneSnapshot(snapshotName, newTableName);
        System.out.println("Table " + newTableName.getNameAsString() + " cloned successfully from snapshot " + snapshotName + ".");

        // 验证新表是否已创建
        if (admin.tableExists(newTableName)) {
            System.out.println("Confirmed: Table " + newTableName.getNameAsString() + " exists after cloning.");
        } else {
            System.out.println("Warning: Table " + newTableName.getNameAsString() + " could not be found after cloning.");
        }
    } finally {
        admin.close();
    }
}
```

### 4.4 列出所有快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 列出所有快照以及快照的详细信息
 */
@Test
public void listSnapshotsByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        // 列出所有快照
        List<SnapshotDescription> snapshots = admin.listSnapshots();
        if (snapshots.isEmpty()) {
            System.out.println("No snapshots available.");
        } else {
            for (SnapshotDescription snapshot : snapshots) {
                System.out.println("Snapshot Name: " + snapshot.getName() + ", Table: " + snapshot.getTableName() + ", Creation Time: " + snapshot.getCreationTime() + ", Snapshot Type: " + snapshot.getType());
            }
        }
    } finally {
        admin.close();
    }
}
```

### 4.5 删除快照

#### 4.5.1 删除指定快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除指定的快照
 */
@Test
public void deleteSnapshotByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        String snapshotName = "CLIENT_TABLE_SNAPSHOT";

        // 检查快照是否存在
        List<SnapshotDescription> snapshots = admin.listSnapshots();
        boolean snapshotExists = snapshots.stream().anyMatch(snapshot -> snapshot.getName().equals(snapshotName));
        if (snapshotExists) {
            // 删除快照
            admin.deleteSnapshot(snapshotName);
            System.out.println("Snapshot " + snapshotName + " deleted successfully.");
        } else {
            System.out.println("Snapshot " + snapshotName + " does not exist.");
        }
    } finally {
        admin.close();
    }
}
```

#### 4.5.2 删除所有快照

```java
/**
 * @throws IOException 如果操作失败，抛出异常
 * @Description 删除所有快照
 */
@Test
public void deleteAllSnapshotsByClient() throws IOException {
    Admin admin = connection.getAdmin();
    try {
        // 删除所有快照
        Pattern pattern = Pattern.compile(".*");
        admin.deleteSnapshots(pattern);
        System.out.println("All snapshots deleted successfully.");
    } finally {
        admin.close();
    }
}
```
```

## 来源 12: Fuwari / `hbase/HBase-Logical-Data-Model.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Logical-Data-Model.md>
- 本地路径: `hbase/HBase-Logical-Data-Model.md`

```markdown
---
title: HBase逻辑结构模型
published: 2025-06-11
tags: [HBase, 大数据]
category: HBase
description: 深入解析HBase的逻辑结构模型，包括其整体架构、核心进程角色以及Region、Store等关键组件的详细说明，帮助开发者理解HBase的数据存储和访问机制。
draft: false
---

# HBase 逻辑结构模型

## 整体架构概述

HBase 是建立在 Hadoop 之上的分布式、面向列的数据库系统，提供了可靠的数据存储和快速随机访问能力。

### 进程角色

HBase 系统由以下几个关键进程组成：

- **Client**：客户端，包括 Java 应用程序、HBase Shell 等（也可通过 Flink、MapReduce、Spark 等访问）
- **HMaster**：主要负责表的管理操作（创建表、删除表、Region 分配），不负责具体的数据操作
- **HRegionServer**：负责数据的管理、操作（增删改查）及接收客户端请求

### 数据模型层次结构

HBase 的数据模型是层层递进的结构，从宏观到微观依次为：

[image: RegionServer-structure](image/RegionServer-structure.png)

#### Region

- Region 是 HBase 中数据分布的基本单位
- 一张表被分为多个 Region，每个 Region 保存一定 rowkey 范围的数据
- Region 中的数据按照 rowkey 的字典序排列
- Region 根据 rowkey 进行横向切割

[image: Region1](image/Region1.png)

- 每张表的 Region 数量：

[image: Region2](image/Region2.png)

#### Store

- 每个 Region 按列族垂直切分为多个 Store
- 每个列族对应一个 Store
- Store 负责存储列族的数据

[image: Region-is-split-vertically-by-column-family](image/Region-is-split-vertically-by-column-family.png)

#### MemStore

- MemStore 是 Store 的内存缓冲组件
- 每个列族(Store)有一个 MemStore
- 所有写入 HBase 的数据首先写入 MemStore
- 当 MemStore 接近满时，数据会被刷写(flush)到磁盘上的 StoreFile 中

#### StoreFile 与 HFile

- StoreFile 是物理存储层面的概念，底层实现是 HFile
- HFile 是 HBase 存储在 HDFS 上的文件格式
- HFile 具有丰富的结构，包括数据块(DataBlock)、索引和布隆过滤器(BloomFilter)
- 写入 HFile 的操作是连续的，速度非常快（flush 操作）

#### WAL(Write Ahead Log)

- WAL 全称为 Write Ahead Log，主要用于故障恢复
- 每个写入操作(PUT/DELETE/INCR)先记录到 WAL，再写入 MemStore
- 服务器崩溃时，可通过回放 WAL 恢复 MemStore 中的数据
- 物理上存储是 Hadoop 的 Sequence File

## 数据读写流程

### 写入流程

1. 客户端发送写请求至 RegionServer
2. 数据首先写入 WAL 日志
3. 然后数据写入对应列族的 MemStore
4. 当 MemStore 达到阈值时，触发 flush 操作，将数据写入新的 HFile
5. 定期进行文件合并(Compaction)，优化读取性能

### 读取流程

1. 客户端发送读请求至 RegionServer
2. 先检查 Block Cache（读缓存）
3. 再检查 MemStore
4. 最后检查 HFile
5. 返回合并后的结果
```

## 来源 13: Fuwari / `hbase/HBase-Logical-vs-Physical-Data-Models-Deep-Dive.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Logical-vs-Physical-Data-Models-Deep-Dive.md>
- 本地路径: `hbase/HBase-Logical-vs-Physical-Data-Models-Deep-Dive.md`

```markdown
---
title: HBase 逻辑模型与物理模型详解
published: 2025-06-11
tags: [HBase, 大数据]
category: HBase
description: 深入解析HBase的逻辑模型与物理模型，详细讲解表、行、行键、列族等核心概念及其在存储和查询中的实现机制，帮助开发者深入理解HBase的数据组织方式和底层存储原理。
draft: false
---

# HBase 逻辑模型与物理模型详解

## 一、HBase 逻辑模型

> 逻辑模型顺序：表（Table） -> 行（Row） -> 行键(Row Key) -> 列族 (Column Family) -> 列 (Column) -> 单元格 (Cell) <- 时间戳 (Timestamp)

### 1. 表（Table）

- HBase 中的数据以表的形式存储。每个表由多个行组成 ，即数据行的集合，但表结构简单，仅需定义表名和列族。
- 表（Table）特点：
  1. 稀疏性：未使用的列不会占用存储空间
  2. 可伸缩性：通过分区的方式存储和管理数据，可以水平扩展来支持数十亿行和数百列的数据。
  3. 高效的随机访问：行键索引和分布式存储机制使得 HBase 在大规模数据中仍然能支持高效的随机访问。
     - 高效的随机访问并不是一直有效的,这个和 RowKey 的设计有关，如果 RowKey 是无序且没有意义的，这会导致 Get 无法通过 RowKey 去获取到对应的数据，高效的随机访问在此时便不成立了
  4. 列式存储：在物理模型中 Table 最终会被列切分为 Store 存储

### 2. 行（Row）

- 行是 HBase 中的一个逻辑数据单元，它由一个行键和多个列族组成。
- 行特点：
  - **稀疏性**：行之间可以没有固定的列，即不同行可以拥有不同的列，HBase 会自动忽略空的单元格。
  - **多版本控制**：行中的每个列都可以存储多个版本的数据，通过时间戳来标识。默认情况下，HBase 会保留最新的 3 个版本。
  - **高效随机访问**：由于行键的排序和唯一性，HBase 可以高效地定位到特定的行，从而实现快速的随机读取和写入。
- 行结构：
  - 表达一：行键 + 列族（Column Family） + 列限定符（Column Qualifier） + 时间戳（Timestamp） + 类型
  - 表达二：多个 Cell（单元格）组成的集合

### 3. 行键(Row Key)

- 行键是 HBase 中每行数据的唯一标识符，相当于关系数据库中的主键。

  - 在物理底层 Row Key 无法唯一标识一行数据 ， 列限定符有一个 version ， 即一个 Row Key 下的数据其实是有多个版本的 ，Hbase 默认获取时间戳最大的 ， 真正能唯一标识的应该是 Row Key + Timestamp

- 行键特点：
  - **唯一性**：每个行键在一个表中是唯一的。通过行键可以唯一标识和定位行数据。
  - **排序性**：HBase 表的行按行键的字典顺序排序存储，这意味着行键的设计会直接影响数据的物理存储位置。可以利用这一特性，通过行键的设计来提高查询性能。
  - **不可更改**：在 HBase 中，一旦行键设置好，就不能更改或删除它。HBase 是追加写入的系统，因此删除行键只能通过标记删除来实现，数据仍然保留在底层，直到系统进行垃圾回收。

### 4. 列族 (Column Family)

- 列族是 HBase 表中的列的逻辑分组，是物理存储的基本单位。每个表至少有一个列族，列族必须在表创建时定义。
- 列族特点：
  - **物理隔离**：不同列族的数据在物理上分开存储，每个列族对应一个 HFile 文件集合。
  - **共同属性**：同一列族内的所有列共享相同的配置属性，如压缩方式、数据存储时长等。
  - **数量限制**：一般建议每个表的列族数量保持在 3 个以内，过多的列族会影响性能。
  - **命名规范**：列族名通常使用可打印字符组成，避免使用过长名称，因为列族名会被频繁写入 HFile。

### 5. 列 (Column)

- 列是 HBase 中存储数据的最小逻辑单位，由列族和列限定符(Column Qualifier)组成。
- 列特点：
  - **动态性**：HBase 的列是动态的，可以在任何时候添加新列，不需要预先定义表结构。
  - **格式表示**：列的完整表示为"列族:列限定符"，例如"family:qualifier"。
  - **灵活性**：每一行可以有不同的列，同一表中不同行的列数量可以不同。
  - **无类型**：HBase 的列没有数据类型的概念，所有值都以字节数组形式存储。

### 6. 单元格 (Cell)

- 单元格是 HBase 数据存储的最小单位，由{行键, 列族, 列限定符, 时间戳, 类型}五元组唯一确定。
- 单元格特点：
  - **版本化**：每个单元格可以包含同一数据的多个版本，通过时间戳区分。
  - **原子性**：HBase 操作的原子性以单元格为单位，确保数据一致性。
  - **存储结构**：单元格中存储的值(Value)是未解释的字节数组，由应用层负责解释。
  - **TTL(Time To Live)**：可以为单元格设置生存时间，超过时间后将被自动清除。

### 7. 时间戳 (Timestamp)

- 时间戳是 HBase 实现数据多版本的关键机制，用于标识数据的不同版本。
- 时间戳特点：
  - **自动生成**：默认情况下，时间戳由 HBase 自动生成，使用写入时的系统时间。
  - **用户自定义**：客户端也可以在写入数据时指定时间戳。
  - **版本控制**：通过时间戳，HBase 可以保存数据的多个版本，默认保留最新的 3 个版本。
  - **查询机制**：查询时可以指定时间戳或时间范围，获取特定版本的数据。

## 二、HBase 物理模型

> 物理模型顺序：Region -> Store -> MemStore/StoreFile(HFile) -> Block -> KeyValue

### 1. Region

- Region 是 HBase 表数据的物理分片，每个 Region 包含表中某个行键范围内的所有数据。
- Region 特点：
  - **分布式存储**：每个 Region 被分配到一个 RegionServer 上进行管理和服务。
  - **自动分裂**：当 Region 大小超过配置阈值时，会自动分裂为两个子 Region。
  - **负载均衡**：通过 Region 的分裂和迁移，HBase 能够实现集群的负载均衡。
  - **结构组成**：每个 Region 包含表中一个或多个列族的数据，每个列族对应一个 Store。

### 2. Store

- Store 是 Region 的物理存储单元，每个 Region 中的每个列族对应一个 Store。
- Store 特点：
  - **对应关系**：一个 Store 对应一个列族的数据。
  - **结构组成**：每个 Store 包含一个 MemStore 和零到多个 StoreFile(HFile)。
  - **写入路径**：数据先写入 MemStore，当 MemStore 满后，数据被刷新到 StoreFile 中。

### 3. MemStore

- MemStore 是内存中的写缓冲区，新写入的数据首先存储在这里。
- MemStore 特点：
  - **排序存储**：MemStore 中的数据按照行键有序存储。
  - **刷新机制**：当 MemStore 达到配置的阈值时，会触发刷新操作，将数据写入新的 StoreFile。
  - **性能优化**：MemStore 提高了写入性能，避免每次写操作都直接写入磁盘。

### 4. StoreFile(HFile)

- StoreFile 是 HBase 数据在 HDFS 上的物理存储文件，是对 HFile 的封装。
- StoreFile 特点：
  - **不可变性**：一旦创建，StoreFile 内容不可修改，新的更新会创建新的 StoreFile。
  - **合并机制**：通过 Major 和 Minor Compaction 合并小文件，提高读取效率。
  - **文件结构**：包含数据块、索引块、元数据块等多种块结构。

### 5. Block

- Block 是 HFile 的基本存储单位，HFile 由多个 Block 组成。
- Block 特点：
  - **大小可配置**：Block 大小默认为 64KB，可以根据需要调整。
  - **类型多样**：包括数据 Block、索引 Block、元数据 Block、布隆过滤器 Block 等。
  - **缓存机制**：Block 是 HBase 缓存的基本单位，频繁访问的 Block 会被缓存在 BlockCache 中。

### 6. KeyValue

- KeyValue 是 HBase 存储的最小物理单元，对应于逻辑模型中的一个单元格。
- KeyValue 结构：
  - **行键(RowKey)**：标识这个 KeyValue 属于哪一行。
  - **列族(Family)**：标识列族名称。
  - **列限定符(Qualifier)**：标识具体的列。
  - **时间戳(Timestamp)**：标识数据版本。
  - **类型(Type)**：标识操作类型，如 Put、Delete 等。
  - **值(Value)**：实际存储的数据内容。

## 三、逻辑模型与物理模型的映射关系

1. **表(Table)到 Region 的映射**：

   - 一个表被水平划分为多个 Region，每个 Region 负责表中一段连续的行键范围。

2. **列族(Column Family)到 Store 的映射**：

   - 每个列族在物理上对应一个 Store，Store 是 Region 中的物理存储单元。

3. **行(Row)到 KeyValue 序列的映射**：

   - 一行数据在物理上被拆分为多个 KeyValue，每个 KeyValue 对应逻辑模型中的一个单元格。

4. **单元格(Cell)到 KeyValue 的映射**：

   - 逻辑模型中的单元格在物理模型中对应一个 KeyValue 结构。

5. **存储过程映射**：
   - 数据写入时：Client → Region → Store → MemStore → (Flush) → StoreFile → HFile
   - 数据读取时：HFile → StoreFile → BlockCache(可选) → Client
```

## 来源 14: Fuwari / `hbase/HBase-Overview-and-Core-Concepts.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Overview-and-Core-Concepts.md>
- 本地路径: `hbase/HBase-Overview-and-Core-Concepts.md`

```markdown
---
title: HBase概述
published: 2025-06-11
tags: [HBase, 大数据]
category: HBase
description: 全面介绍HBase的基本概念、核心特性和应用场景，涵盖HBase在大数据生态中的定位、NoSQL数据库特点、数据模型以及与传统关系型数据库的对比分析。
draft: false
---

# HBase 概述

## 1. 大数据背景

从 1970 年开始，大多数公司使用关系型数据库来存储和维护数据。随着大数据技术的出现，许多公司开始选择像 Hadoop 这样的分布式系统来存储和处理海量数据。

## 2. Hadoop 生态体系

### 2.1 Hadoop 简介

Hadoop 使用分布式文件系统 HDFS 来存储数据，并使用 MapReduce 来处理数据。它擅长存储各种格式的大数据，支持任意格式，甚至非结构化的数据。此外，Hadoop 生态系统中包含许多组件，例如 Hive、Pig 和 Spark，这些组件进一步增强了数据处理的灵活性和效率。

### 2.2 Hadoop 的局限性

Hadoop 主要用于批量数据处理，通过顺序访问数据来实现。查找数据时必须遍历整个数据集，随机读取数据的效率较低。此外，Hadoop 的 MapReduce 编程模型相对复杂，开发效率低，延迟高，不适合需要低延迟的数据处理任务。

## 3. NoSQL 数据库

### 3.1 NoSQL 概述

NoSQL 是指代非关系型数据库的通用术语，通常不使用 SQL 作为主要语言。NoSQL 数据库设计用于克服关系型数据库在处理大规模数据时的局限性。

### 3.2 HBase 简介

HBase 是 BigTable 的开源 Java 实现，建立在 HDFS 之上，提供高可靠性、高性能、列存储、可伸缩、实时读写的 NoSQL 数据库系统。它弥补了 Hadoop 在随机访问方面的不足。

## 4. HBase 核心特性

### 4.1 基本特点

- **强一致性读/写**：适用于需要强一致性的场景。
- **高速计数器聚合**：适合高速计数器聚合任务。
- **自动分块**：表通过 Region 分布在集群上，随着数据增长，区域自动拆分和重新分布。
- **自动 RegionServer 故障转移**：在 RegionServer 故障时自动转移。

### 4.2 表的特点

- **大规模**：单个表可以有上十亿行和上百万列。
- **面向列**：列族的存储和权限控制，支持独立检索。
- **稀疏性**：为空的列不占用存储空间，因此表可以设计得非常稀疏。

### 4.3 技术集成

- **Hadoop/HDFS 集成**：HBase 支持 HDFS 作为其分布式文件系统。
- **MapReduce 支持**：通过 MapReduce 支持大规模并行处理。
- **Java Client API**：支持 Java API 编程访问。
- **Thrift/REST API**：提供 Thrift 和 REST API 接口，支持多语言访问。

### 4.4 性能优化

- **块缓存和布隆过滤器**：用于查询优化。
- **运行管理**：提供内置网页进行业务监控和管理。

### 4.5 局限性

HBase 的查询功能简单，不支持 join 操作和复杂事务（只支持行级事务）。HBase 更像是一个"数据存储"而不是"数据库"，因为它缺少关系型数据库中的特性，例如带类型的列、二级索引和高级查询语言。HBase 中的数据类型为 byte[]。

HBase 只支持通过主键（rowkey）或主键范围检索数据，仅支持单行事务。它适用于存储结构化和半结构化的松散数据。

## 5. HBase 的扩展性

HBase 的扩展主要依赖于横向扩展，通过增加廉价的服务器来提高存储和处理能力。例如，将集群从 10 个节点扩展到 20 个节点，存储能力和处理能力都会加倍。

## 6. HBase 应用场景

HBase 适用于以下场景：

- **对象存储**：例如网页、图片、新闻、病毒库。
- **时序数据**：例如物联网设备的传感器数据（基于 OpenTSDB 模块）。
- **推荐系统**：例如个性化内容推荐。
- **时空数据存储**：例如地理位置信息和时间序列数据。
- **日志和事件数据处理**：存储和分析服务器日志和用户行为事件。
- **数据立方体（Cube）**：存储和管理多维数据立方体，支持 OLAP 场景中的复杂查询与分析。
- **消息和订单处理**：用于处理电商系统中的订单信息和消息流，提供高效的数据分析和实时响应。
- **Feeds 流**：管理社交媒体等实时数据流，支持用户活动和内容更新的高效处理。
- **NewSQL**：与 NewSQL 数据库结合使用，获得传统关系型数据库的特性与 NoSQL 的扩展性。
- **其他**：适用于需要大规模存储和快速随机访问的场景，如用户画像、内容管理等。

## 7. 技术对比

### 7.1 HBase 与 Hadoop 的关系

HBase 基于 Hadoop 集群搭建，弥补了 Hadoop 的一些局限性，例如高吞吐量的批量数据处理，但在随机查询和实时操作方面不如传统关系型数据库。HBase 不支持 join 操作，仅有一种数据类型：byte[]，写入速度非常快。

HBase 适用于存储非常大的表，支持上亿行和上百万列，常用于实时数据处理中。HBase 与 Hadoop 集成，能够结合 MapReduce、Hive 和 Spark 等工具，支持复杂的数据分析和处理任务。

### 7.2 RDBMS 与 HBase 的对比

#### 7.2.1 RDBMS 结构与功能

**结构**：

- 数据库以表的形式存在。
- 支持多种文件系统，如 FAT、NTFS、EXT 等。
- 使用主键（PK）进行唯一标识。
- 通过外部中间件支持分库分表。
- 数据组织为行、列、单元格。

**功能**：

- 支持向上扩展（通过更好的服务器提升性能）。
- 使用 SQL 进行查询。
- 面向行，每一行都是一个连续单元。
- 数据量受限于服务器配置。
- 支持 ACID 特性。
- 适合结构化数据。
- 支持事务和 Join 操作。

#### 7.2.2 HBase 结构与功能

**结构**：

- 数据以表的形式存在。
- 支持 HDFS 文件系统。
- 使用行键（row key）进行数据定位。
- 原生支持分布式存储和计算。
- 使用行、列、列族和单元格的层次结构。

**功能**：

- 支持向外扩展（通过增加服务器数量提升性能）。
- 使用 API 和 MapReduce、Spark、Flink 等工具来访问数据。
- 面向列，每个列都是独立的单元。
- 数据总量不依赖某台机器，而取决于机器数量。
- 不支持 ACID 特性。
- 支持结构化和非结构化数据。
- 数据存储和访问方式是分布式的。
- 仅支持单行事务操作，不支持 Join 操作。

### 7.3 HDFS 对比 HBase

#### 7.3.1 HDFS

- 适合存储大型文件的分布式文件系统。
- 不适合在文件中快速查询特定数据。

#### 7.3.2 HBase

- 构建在 HDFS 之上，为大型表提供快速查找和更新。
- 数据存储在 HDFS 中名为「StoreFiles」的索引中，以便高速查找。
- 适合快速查询场景，但不适合大规模 OLAP 应用。

### 7.4 Hive 对比 HBase

#### 7.4.1 Hive

- 数据仓库工具，基于 HDFS，适用于离线数据分析。
- 使用 HQL 来管理和查询数据，具有较高的延迟。
- 编写的 HQL 语句最终会被转换为 MapReduce 代码执行。

#### 7.4.2 HBase

- NoSQL 数据库，采用面向列存储的非关系型数据结构。
- 适用于单表数据存储，不适合 JOIN 操作。
- 基于 HDFS，数据以 HFile 形式存放，RegionServer 管理数据。
- 延迟低，适合在线业务，提供高效的数据访问速度。
```

## 来源 15: Fuwari / `hbase/HBase-Shell-Administration-Guide.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Shell-Administration-Guide.md>
- 本地路径: `hbase/HBase-Shell-Administration-Guide.md`

```markdown
---
title: HBase Shell 管理操作
published: 2025-06-11
tags: [HBase, 大数据, shell]
category: HBase
description: 详细介绍HBase Shell管理命令，包括集群状态监控、表结构管理、权限控制等高级管理功能，帮助运维人员高效管理HBase集群。
draft: false
---

# HBase Shell 管理操作

## 简介

HBase Shell 是 Apache HBase 的命令行工具，提供与 HBase 数据库交互的接口。通过 Shell 命令，用户可以执行数据库管理操作、表管理和数据操作等功能。本文档主要介绍 HBase Shell 的管理操作命令。

## 集群信息操作

这些命令用于查看和管理 HBase 集群的基本信息。

### status

- 显示服务器集群状态，包括活跃的 master 数量、备份的 master 数量、RegionServer 数量和集群负载

**示例：**

```shell
hbase:001:0> status
1 active master, 2 backup masters, 3 servers, 0 dead, 1.0000 average load
Took 0.3839 seconds
```

### whoami

- 显示当前连接 HBase 的用户身份和权限信息

**示例：**

```shell
hbase:002:0> whoami
root (auth:SIMPLE)
    groups: root
Took 0.0472 seconds
```

## 表信息查询

这些命令用于查询 HBase 中表的基本信息。

### list

- 列出 HBase 中所有表的名称

**示例：**

```shell
hbase:003:0> list
TABLE
CLONE_ORDER_INFO
ORDER_INFO
2 row(s)
Took 0.0294 seconds
=> ["CLONE_ORDER_INFO", "ORDER_INFO"]
```

### count

- 统计指定表的总行数
- 注意：不建议在大数据量表上使用此命令，会占用大量资源和时间

**示例：**

```shell
hbase:006:0> count 'ORDER_INFO'
5 row(s)
Took 0.0544 seconds
=> 5
```

### describe

- 详细展示表的结构信息，包括表状态、列族详情和设置参数

**示例：**

```shell
hbase:007:0> describe 'ORDER_INFO'
Table ORDER_INFO is ENABLED
ORDER_INFO, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}
COLUMN FAMILIES DESCRIPTION
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '5', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

2 row(s)
Quota is disabled
Took 0.1130 seconds
```

### exists

- 检查指定表是否存在
- 相比 list 命令，更适用于快速检查特定表，尤其在表数量很大的情况下

**示例：**

```shell
hbase:008:0> exists 'ORDER_INFO'
Table ORDER_INFO does exist
Took 0.0150 seconds
=> true
hbase:009:0> exists 'ORDER_INFO1'
Table ORDER_INFO1 does not exist
Took 0.0066 seconds
=> false
```

### is_enabled / is_disabled

- 检查指定表是否处于启用或禁用状态
- 在执行某些操作（如 drop）前，需要先确认表的状态

**示例：**

```shell
hbase:010:0> is_enabled 'ORDER_INFO'
true
Took 0.0312 seconds
=> true
hbase:011:0> is_disabled 'ORDER_INFO'
false
Took 0.0099 seconds
=> false
```

## 表管理操作

这些命令用于创建、修改和管理 HBase 表。

### create

- 创建新表，指定表名和一个或多个列族

**示例：**

```shell
hbase:013:0> create 'NEW_TABLE', 'CF1', 'CF2'
Created table NEW_TABLE
Took 0.8123 seconds
=> Hbase::Table - NEW_TABLE
```

### alter

- 修改表的结构，包括添加、删除列族或更改列族属性
- 修改表的结构不会影响表中现有数据

**示例：**

```shell
hbase:014:0> create 'ALTER_TEST','C1','C2'
Created table ALTER_TEST
Took 0.6650 seconds
=> Hbase::Table - ALTER_TEST
hbase:015:0> describe 'ALTER_TEST'
Table ALTER_TEST is ENABLED
ALTER_TEST, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}
COLUMN FAMILIES DESCRIPTION
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

2 row(s)
Quota is disabled
Took 0.0575 seconds
hbase:016:0> alter 'ALTER_TEST','C3'
Updating all regions with the new schema...
1/1 regions updated.
Done.
Took 1.8192 seconds
hbase:017:0> describe 'ALTER_TEST'
Table ALTER_TEST is ENABLED
ALTER_TEST, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}
COLUMN FAMILIES DESCRIPTION
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

{NAME => 'C3', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

3 row(s)
Quota is disabled
Took 0.0927 seconds
hbase:018:0> alter 'ALTER_TEST','delete' => 'C3'
Updating all regions with the new schema...
1/1 regions updated.
Done.
Took 1.7897 seconds
hbase:019:0> describe 'ALTER_TEST'
Table ALTER_TEST is ENABLED
ALTER_TEST, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}
COLUMN FAMILIES DESCRIPTION
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

2 row(s)
Quota is disabled
Took 0.0699 seconds
```

### disable / enable

- 禁用和启用表
- 许多管理操作（如 drop、alter）要求表先被禁用
- 禁用表期间，表不可访问

**示例：**

```shell
hbase:020:0> disable 'ALTER_TEST'
Took 0.3761 seconds
hbase:021:0> enable 'ALTER_TEST'
Took 0.6413 seconds
```

### drop

- 永久删除一张表及其所有数据
- 注意：只能删除已经被禁用的表，且操作不可恢复

**示例：**

```shell
hbase:022:0> disable 'ALTER_TEST'
Took 0.3607 seconds
hbase:023:0> drop 'ALTER_TEST'
Took 0.3635 seconds
```

### truncate

- 清空表中所有数据，但保留表结构
- 实际操作为：禁用表->删除表->以相同结构重新创建表
- 重要：在执行此操作前应考虑备份或快照

**示例：**

```shell
hbase:003:0> scan 'CLONE_ORDER_INFO'
ROW                                                    COLUMN+CELL
 row1                                                  column=C1:order_count, timestamp=2024-10-15T13:25:40.085, value=\x00\x00\x00\x00\x00\x00\x00(
 row1                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.435, value=2024-10-01
 row1                                                  column=C1:order_id, timestamp=2024-10-15T13:20:09.379, value=11111
 row1                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.460, value=Alice
 row1                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.486, value=123-456-7890
 row2                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.531, value=2024-10-02
 row2                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.518, value=67890
 row2                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.546, value=Bob
 row2                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.573, value=234-567-8901
 row3                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.615, value=2024-10-03
 row3                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.594, value=13579
 row3                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.632, value=Charlie
 row3                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.661, value=345-678-9012
 row4                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.726, value=2024-10-04
 row4                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.701, value=24680
 row4                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.744, value=David
 row4                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.768, value=456-789-0123
 row5                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.810, value=2024-10-05
 row5                                                  column=C1:order_id, timestamp=2024-10-15T12:52:37.798, value=11223
 row5                                                  column=C2:customer_name, timestamp=2024-10-15T12:53:27.341, value=Eva
 row5                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.842, value=567-890-1234
5 row(s)
Took 0.2718 seconds
hbase:004:0> truncate 'CLONE_ORDER_INFO'
Truncating 'CLONE_ORDER_INFO' table (it may take a while):
Disabling table...
Truncating table...
Took 1.6162 seconds
hbase:005:0> scan 'CLONE_ORDER_INFO'
ROW                                                    COLUMN+CELL
0 row(s)
Took 0.6254 seconds
```

## 数据操作命令

除了上述管理操作外，HBase Shell 还提供了一系列数据操作命令，如：

### put

- 向表中插入或更新单元格数据

### get

- 获取表中特定行的数据
- 支持获取整行数据或指定列族、列的数据
- 可以指定时间戳版本或获取多版本数据

**语法：**

```shell
get '<表名>', '<行键>', {COLUMN => '<列族:列名>', VERSIONS => <版本数>, TIMESTAMP => <时间戳>}
```

**示例：**

```shell
# 获取行数据
hbase:001:0> get 'ORDER_INFO', 'row1'
COLUMN                        CELL
 C1:order_count               timestamp=2024-10-15T13:25:40.085, value=\x00\x00\x00\x00\x00\x00\x00(
 C1:order_date                timestamp=2024-10-15T12:52:37.435, value=2024-10-01
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111
 C2:customer_name             timestamp=2024-10-15T12:52:37.460, value=Alice
 C2:customer_phone            timestamp=2024-10-15T12:52:37.486, value=123-456-7890
5 row(s)
Took 0.0351 seconds

# 获取指定列族数据
hbase:002:0> get 'ORDER_INFO', 'row1', {COLUMN => 'C1'}
COLUMN                        CELL
 C1:order_count               timestamp=2024-10-15T13:25:40.085, value=\x00\x00\x00\x00\x00\x00\x00(
 C1:order_date                timestamp=2024-10-15T12:52:37.435, value=2024-10-01
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111
3 row(s)
Took 0.0284 seconds

# 获取指定列的数据
hbase:003:0> get 'ORDER_INFO', 'row1', {COLUMN => 'C1:order_id'}
COLUMN                        CELL
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111
1 row(s)
Took 0.0241 seconds

# 获取多个版本的数据
hbase:004:0> get 'ORDER_INFO', 'row1', {COLUMN => 'C1:order_id', VERSIONS => 3}
COLUMN                        CELL
 C1:order_id                  timestamp=2024-10-15T13:20:09.379, value=11111
 C1:order_id                  timestamp=2024-10-15T12:52:37.379, value=12345
2 row(s)
Took 0.0289 seconds
```

### scan

- 扫描表中的数据，可设定开始和结束行、过滤条件等

### delete

- 删除表中的数据（单元格、列、列族或整行）

## 高级命令

HBase Shell 还提供了一些高级管理命令：

### snapshot

- 创建表的快照，用于备份或迁移

### clone_snapshot

- 从现有快照创建新表

### restore_snapshot

- 从快照恢复表数据

### balance_switch

- 启用或禁用自动负载均衡
```

## 来源 16: Fuwari / `hbase/HBase-Shell-Commands-Quick-Reference.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Shell-Commands-Quick-Reference.md>
- 本地路径: `hbase/HBase-Shell-Commands-Quick-Reference.md`

```markdown
---
title: HBase Shell 操作指南
published: 2025-06-11
tags: [HBase, 大数据, shell]
category: HBase
description: 详细讲解HBase Shell常用命令，涵盖表管理、数据增删改查、过滤器等核心操作，帮助开发者快速掌握HBase命令行工具的使用技巧。
draft: false
---

# HBase 常见的 Shell 操作

## 基本表操作

### 创建表

**语法：** `create '表名', '列族名', ...`

```shell
create 'ORDER_INFO', 'C1', 'C2'
```

- 创建一个表，表名为 `ORDER_INFO`，列族为 `C1` 和 `C2`。
- 表可以有多个列族（Column Family）。

### 查看所有表

**命令：**

```shell
list
```

- 列出所有当前存在的表。

### 显示表描述

**语法：** `describe '表名'`

```shell
describe 'ORDER_INFO'
```

**示例：**

```shell
hbase:031:0> describe 'ORDER_INFO'
Table ORDER_INFO is ENABLED
ORDER_INFO, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}
COLUMN FAMILIES DESCRIPTION
{NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

{NAME => 'C2', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW',
IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}

2 row(s)
Quota is disabled
Took 0.1003 seconds
```

- 显示指定表的详细结构信息。

### 修改表结构

**语法：** `alter '表名', { NAME => '列族名', VERSIONS => 版本数 }`

```shell
alter 'ORDER_INFO', { NAME => 'C1', VERSIONS => 5 }
```

**示例：**

```shell
hbase:032:0> alter 'ORDER_INFO',{NAME => 'C1' , VERSIONS => '5'}
Updating all regions with the new schema...
1/1 regions updated.
Done.
Took 1.8954 seconds
```

- 修改表的结构，例如调整列族的版本数。

### 启用表

**语法：** `enable '表名'`

```shell
enable 'ORDER_INFO'
```

- 启用一个已禁用的表。

### 禁用表

**语法：** `disable '表名'`

```shell
disable 'ORDER_INFO'
```

- 禁用一个表，必须在删除前进行禁用。

### 删除表

**语法：** `drop '表名'`

```shell
drop 'ORDER_INFO'
```

- 删除一个已禁用的表。

## 数据操作

### 插入数据

**语法：** `put '表名', '行键', '列族:列', '值'`

```shell
put 'ORDER_INFO', 'row1', 'C1:order_id', '12345'
```

**示例：**

```shell
hbase:002:0> put 'ORDER_INFO', 'row1', 'C1:order_id', '12345'
Took 0.1551 seconds
```

- 插入一行数据到表中，`order_id` 列的值为 `'12345'`。

### 获取数据

**语法：** `get '表名', '行键'`

```shell
get 'ORDER_INFO', 'row1'
```

- 获取指定行键的数据。
- 显示中文数据可用 `{FORMATTER => 'toString'}`。

```shell
get 'ORDER_INFO', 'row1', {FORMATTER => 'toString'}
```

**示例：**

```shell
hbase:039:0> get 'ORDER_INFO', 'row1', {FORMATTER => 'toString'}
COLUMN                                                 CELL
 C1:order_date                                         timestamp=2024-10-15T12:52:37.435, value=2024-10-01
 C1:order_id                                           timestamp=2024-10-15T12:52:37.409, value=12345
 C2:customer_name                                      timestamp=2024-10-15T12:52:37.460, value=Alice
 C2:customer_phone                                     timestamp=2024-10-15T12:52:37.486, value=123-456-7890
1 row(s)
Took 0.0159 seconds
```

### 更新数据

- 直接使用 `put` 命令来覆盖已有值，达到更新的效果。

```shell
put 'ORDER_INFO', 'row1', 'C1:order_id', '67890'
```

### 删除数据

**语法：** `delete '表名', '行键', '列族:列'`

```shell
delete 'ORDER_INFO', 'row1', 'C1:order_id'
```

**示例：**

```shell
hbase:052:0> delete 'ORDER_INFO','row1','C1:order_id'
Took 0.0210 seconds
hbase:053:0> scan 'ORDER_INFO', {ROWPREFIXFILTER => 'row1'}
ROW                                                    COLUMN+CELL
 row1                                                  column=C1:order_date, timestamp=2024-10-15T12:52:37.435, value=2024-10-01
 row1                                                  column=C1:order_id, timestamp=2024-10-15T13:20:09.379, value=11111
 row1                                                  column=C2:customer_name, timestamp=2024-10-15T12:52:37.460, value=Alice
 row1                                                  column=C2:customer_phone, timestamp=2024-10-15T12:52:37.486, value=123-456-7890
1 row(s)
```

> **注意：**
>
> - 执行 `delete` 时，如果当前行有多个版本的数据，它会删除最近的一个版本。
> - HBase 默认保留每列三个最近的版本。
> - 可以通过设置 `VERSIONS` 属性来控制保留的版本数量。

### 删除整行

**语法：** `deleteall '表名', '行键'`

```shell
deleteall 'ORDER_INFO', 'row1'
```

- 删除指定行的所有数据。

### 计数行数

**语法：** `count '表名'`

```shell
count 'ORDER_INFO'
```

**示例：**

```shell
hbase:054:0> count 'ORDER_INFO'
5 row(s)
Took 0.0174 seconds
=> 5
```

- 统计表中的行数。

### 增量计数操作

在 HBase 中，可以使用 `INCR` 操作来创建并累加列值，适用于计数器等场景。

**语法格式：**

```shell
incr '表名', '行键', '列族:列限定符', 增量值
```

- `表名`：操作的表名称。
- `行键`：指定要操作的行键。
- `列族:列限定符`：指定要操作的列。
- `增量值`：递增的数值，正数表示增加，负数表示减少。

**创建与累加操作：**

- **创建操作**：如果指定的列不存在，`INCR` 操作会首先创建该列，并将其初始值设置为指定的值（默认是 `0`），然后执行递增操作。

  ```shell
  incr 'ORDER_INFO', 'row1', 'C1:order_count', 20
  ```

- **累加操作**：当列已经存在时，`INCR` 会对现有的值进行累加，增量可以是正数或负数。

  ```shell
  incr 'ORDER_INFO', 'row1', 'C1:order_count', 1
  ```

- 该操作是原子的，适用于高并发环境下的计数需求。
- 如果某一列需要实现累加功能，必须使用 `INCR` 来创建对应的列。使用 `PUT` 创建的列无法实现累加。

**获取计数器的值：**

```shell
get_counter 'ORDER_INFO', 'row1', 'C1:order_count'
```

**示例：**

```shell
hbase:060:0> incr 'ORDER_INFO', 'row1', 'C1:order_count', 20
COUNTER VALUE = 20
Took 0.0053 seconds

hbase:063:0> get_counter 'ORDER_INFO' , 'row1','C1:order_count'
COUNTER VALUE = 20
Took 0.0043 seconds
```

## 扫描表操作

避免扫描大表，以免程序运行时间过长、内存不足，甚至导致节点死机。

### 全表扫描

**语法：** `scan '表名'`

```shell
scan 'ORDER_INFO'
```

- 扫描整个表的数据，慎用，效率较低。

### 限定显示条数

**语法：** `scan '表名', {LIMIT => N}`

> LIMIT => N，N 不是表示示例的行数而是 rowkey 的个数

```shell
scan 'ORDER_INFO', {LIMIT => 3}
```

- 限定返回的记录条数。

### 指定查询某些列

**语法：** `scan '表名', {COLUMNS => ['列族:列', ...]}`

```shell
scan 'ORDER_INFO', {COLUMNS => ['C1:order_id', 'C2:customer_name']}
```

- 只扫描指定的列。

### 根据 RowKey 前缀扫描

**语法：** `scan '表名', {ROWPREFIXFILTER => '前缀'}`

```shell
scan 'ORDER_INFO', {ROWPREFIXFILTER => 'row1'}
```

- 根据 RowKey 的前缀来扫描表。

## 过滤器

在 HBase 中，过滤器用于限制扫描或获取数据时返回的结果集，帮助提高查询效率，减少不必要的数据传输。

**语法：**

- 在 HBase Shell 中执行的是 Ruby 脚本，背后调用 HBase 的 Java API
- 过滤器在 Shell 中使用表达式描述，对应 Java 中的对象实例化

**解释：**

```shell
scan "ORDER_INFO" , {FILTER => "RowFilter(=,'binary:02602f66-adc7-40d4-8485-76b5632b5b53')", COLUMNS => ['C1:STATUS', 'C1:PAYWAY'], FORMATTER =>'toString'}
```

- RowFilter 是 Java API 中 Filter 的构造器名称
- =是比较运算符，可以是>、<、>=等
- binary:xxx 是比较器表达式，用于值比较

### 按行键过滤器

1. **PrefixFilter**：根据行键的前缀进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "PrefixFilter('row1')"}
   ```

2. **RowFilter**：基于行键的比较进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "RowFilter(=, 'binary:row1')"}
   ```

3. **InclusiveStopFilter**：扫描到指定的行键时停止。

   ```shell
   scan 'ORDER_INFO', {FILTER => "InclusiveStopFilter('row3')"}
   ```

4. **RandomRowFilter**：随机返回部分行数据。
   ```shell
   scan 'ORDER_INFO', {FILTER => "RandomRowFilter(0.5)"}
   ```

### 列过滤器

1. **SingleColumnValueFilter**：根据指定列的值进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "SingleColumnValueFilter('C1', 'order_id', =, 'binary:12345')"}
   ```

2. **ColumnPrefixFilter**：根据列名前缀进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "ColumnPrefixFilter('order')"}
   ```

3. **QualifierFilter**：基于列限定符的比较进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "QualifierFilter(=, 'binary:order_id')"}
   ```

4. **FamilyFilter**：基于列族的比较进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "FamilyFilter(=, 'binary:C1')"}
   ```

5. **DependentColumnFilter**：当指定列存在时，才返回整行数据。
   ```shell
   scan 'ORDER_INFO', {FILTER => "DependentColumnFilter('C1', 'order_id')"}
   ```

### 其他类型过滤器

1. **PageFilter**：用于分页查询，限制返回的行数。

   ```shell
   scan 'ORDER_INFO', {FILTER => "PageFilter(10)"}
   ```

2. **ValueFilter**：根据列值进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "ValueFilter(=, 'binary:12345')"}
   ```

3. **TimestampsFilter**：根据时间戳进行过滤。

   ```shell
   scan 'ORDER_INFO', {FILTER => "TimestampsFilter([1631022245123, 1631022245124])"}
   ```

4. **KeyOnlyFilter**：只返回行键，不返回列值。

   ```shell
   scan 'ORDER_INFO', {FILTER => "KeyOnlyFilter()"}
   ```

5. **SkipFilter**：跳过包含特定条件的行。

   ```shell
   scan 'ORDER_INFO', {FILTER => "SkipFilter(SingleColumnValueFilter('C1', 'order_id', =, 'binary:12345'))"}
   ```

6. **FirstKeyOnlyFilter**：每行只返回第一个键值对。
   ```shell
   scan 'ORDER_INFO', {FILTER => "FirstKeyOnlyFilter()"}
   ```

### 组合过滤器

可以使用 `FilterList` 组合多个过滤器。

```shell
scan 'ORDER_INFO', {FILTER => "FilterList(AND, SingleColumnValueFilter('C1', 'order_id', =, 'binary:12345'), PrefixFilter('row1'))"}
```

- 组合使用多个过滤条件，返回符合所有条件的行。
- 可以使用 `AND` 或 `OR` 逻辑操作符来控制组合过滤器的行为。

## 快照管理

### 查看表的所有快照

**语法：** `list_snapshots`

```shell
list_snapshots
```

- 列出所有的 HBase 表快照。

### 创建快照

**语法：** `snapshot '表名', '快照名'`

```shell
snapshot 'ORDER_INFO', 'ORDER_INFO_SNAPSHOT'
# 或使用 create_snapshot 'ORDER_INFO', 'ORDER_INFO_SNAPSHOT'
```

- 创建表的快照，作为表当前状态的备份。

### 使用快照

**语法：** `clone_snapshot '快照名', '表名'`

```shell
clone_snapshot 'ORDER_INFO_SNAPSHOT', 'CLONE_ORDER_INFO'
```

- 从快照创建新表。

### 通过快照恢复数据

**语法：** `restore_snapshot '快照名'`

```shell
disable 'ORDER_INFO'
restore_snapshot 'ORDER_INFO_SNAPSHOT'
```

> 注意：恢复时，表需要先被禁用，恢复后会直接作用在所拍快照的表中。

### 删除快照

**语法：** `delete_snapshot '快照名'`

```shell
delete_snapshot 'ORDER_INFO_SNAPSHOT'
```

- 删除指定的快照。

### 快照导出

将快照从一个集群导出到另一个集群：

```shell
hbase org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot ORDER_INFO_SNAPSHOT -copy-to hdfs://mycluster/hbaseSnapshot -mappers 4
```

- `-snapshot`：要导出的快照名称。
- `-copy-to`：目标集群的 HDFS 路径。
- `-mappers`：指定并行执行的 mapper 数量。

## 集群管理操作

### 合并区域

**语法：** `merge_region 'region1', 'region2'`

- 合并两个指定的 Region。
- 需先通过 `list_regions '表名'` 找到具体的 Region 名称。

### 分裂区域

**语法：** `split '表名', '分裂键'`

```shell
split 'ORDER_INFO', 'row3'
```

- 将表按照指定的行键进行分裂，用于数据均衡。

### 压缩操作

#### Major 压缩

**语法：** `major_compact '表名'`

- 对指定表进行 major compaction，合并所有存储文件。

#### Minor 压缩

**语法：** `compact '表名'`

- 对指定表进行 minor compaction，合并部分存储文件，释放 HFile。

### 权限管理

**赋予权限：**

```shell
grant 'admin', 'RWXCA', 'ORDER_INFO'
```

- 给用户赋予读(R)、写(W)、执行(X)、创建(C)、管理(A)权限。

**收回权限：**

```shell
revoke 'admin', 'ORDER_INFO'
```

## 高级操作

### 执行命令文件

使用 HBase Shell 运行上传的 command 文件：

```shell
hbase shell /path/to/command-file.txt
```

- 确保文件中包含合法的 HBase Shell 命令。

### 数据导入导出

**导入数据：**

```shell
hbase org.apache.hadoop.hbase.mapreduce.ImportTsv -Dimporttsv.columns=HBASE_ROW_KEY,C1:order_id,C2:customer_name 'ORDER_INFO' /path/to/data.tsv
```

**大规模数据导入示例：**

```shell
./hbase org.apache.hadoop.hbase.mapreduce.ImportTsv \
-Dimporttsv.separator=',' \
-Dimporttsv.columns=HBASE_ROW_KEY,cf1:name,cf1:age,cf1:city,cf1:phone,cf1:email,cf2:occupation,cf2:company,cf2:salary,cf2:experience,cf2:department,cf3:hobby,cf3:favorite_color,cf3:sport,cf3:pet,cf3:music,cf4:address,cf4:zipcode,cf4:state,cf4:country,cf4:continent,cf5:social_media,cf5:website,cf5:blog,cf5:subscribed,cf5:membership \
USER_INFO /hbasedata/hbase_large_million_dataset.csv
```

### 大量数据的计数统计

对于大规模数据集，使用 MapReduce 任务来进行行数统计：

```shell
hbase org.apache.hadoop.hbase.mapreduce.RowCounter 'ORDER_INFO'
```

- 使用 MapReduce 框架来提高统计效率。
```

## 来源 17: Fuwari / `hbase/HBase-System-Architecture-Deep-Dive.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-System-Architecture-Deep-Dive.md>
- 本地路径: `hbase/HBase-System-Architecture-Deep-Dive.md`

```markdown
---
title: HBase系统架构
published: 2025-06-11
tags: [HBase, 大数据]
category: HBase
description: 深入解析HBase的系统架构，详细讲解其核心组件（Client、ZooKeeper、Master、RegionServer）的职责与协作方式，帮助开发者理解HBase的分布式架构和运行机制。
draft: false
---

# HBase 系统架构

## 架构概述

HBase 是一个分布式、可扩展的 NoSQL 数据库，建立在 HDFS 之上，提供面向列的实时读写能力。

[image: hbase](image/hbase.png)

HBase 系统主要由以下几个核心组件构成：

- Client：客户端，负责发送请求
- ZooKeeper：协调服务，管理集群状态
- Master：主服务器，负责管理和协调整个集群
- RegionServer：区域服务器，负责数据存储和处理

## 核心组件详解

### Client

客户端是发出 HBase 操作请求的对象，包括但不限于：

- Java API 代码
- HBase Shell 命令行工具
- REST/Thrift API 等接口

客户端主要职责：

- 通过 ZooKeeper 定位 Region 位置
- 直接与 RegionServer 通信进行数据读写
- 与 Master 通信进行 DDL 操作（创建、删除、修改表等）

### ZooKeeper

ZooKeeper 在 HBase 中扮演协调服务的角色，主要职责：

- 存储 HBase 集群的元数据信息
- 监控 RegionServer 的状态
- 提供 Master 选举机制
- 存储 Region 寻址信息
- 协调集群配置信息

### Master

Master 是 HBase 集群的管理者，负责管理和协调整个系统。

[image: Master-Web-UI](image/Master-Web-UI.png)

Master 主要职责：

- 监控所有 RegionServer 的状态
- 处理 RegionServer 故障转移
- 管理元数据的变更（表的创建、删除、修改等）
- 处理 Region 的分配或移除
- 在空闲时进行数据的负载均衡
- 通过 ZooKeeper 发布自己的位置给客户端

> Master 专注于管理功能，不直接参与数据读写操作，主要负责元数据管理和资源分配。

### RegionServer

RegionServer 是实际存储 HBase 数据并处理客户端读写请求的服务器。

[image: RegionServer](image/RegionServer.png)

RegionServer 主要职责：

- 处理分配给它的 Region
- 负责存储和管理 HBase 的实际数据
- 刷新内存缓存(MemStore)到 HDFS(HFile)
- 维护预写日志(Write-Ahead Log)
- 执行数据压缩
- 处理 Region 分裂和合并

#### RegionServer 内部组件

RegionServer 内部包含多个关键组件：

1. **Region**：数据的基本存储单元，对应表的一个数据分片
2. **Store**：对应一个列族的存储，每个 Region 包含多个 Store
3. **MemStore**：内存存储，数据写入时首先进入 MemStore
4. **HFile(StoreFile)**：磁盘存储格式，当 MemStore 满时数据刷新到 HFile
5. **Write-Ahead Log(WAL)**：预写日志，保证数据写入的可靠性

## HBase 读写流程

### 写入流程

1. Client 通过 ZooKeeper 找到数据对应的 RegionServer
2. 数据首先写入 WAL 日志
3. 数据写入对应的 MemStore
4. 当 MemStore 达到阈值时，数据刷写到 HFile

### 读取流程

1. Client 通过 ZooKeeper 找到数据对应的 RegionServer
2. 客户端发送读请求到 RegionServer
3. RegionServer 先查找 MemStore，再查找 BlockCache，最后查找 HFile
4. 返回结果给客户端
```

## 来源 18: Fuwari / `hbase/HBase-Table-Schema-Design-Best-Practices.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/hbase/HBase-Table-Schema-Design-Best-Practices.md>
- 本地路径: `hbase/HBase-Table-Schema-Design-Best-Practices.md`

```markdown
---
title: HBase表结构设计与调优
published: 2025-06-11
tags: [HBase, 大数据, 业务]
category: HBase
description: 全面解析HBase表结构设计的最佳实践，涵盖名称空间设计、行键设计策略、列族优化、预分区设计等核心内容，帮助开发者设计出高性能、易维护的HBase表结构。
draft: false
---

# HBase 表结构设计与调优

## 一、HBase 基础架构

### 1. 名称空间（namespace）概念

- 名称空间用于对一个项目中的多张表按业务域进行划分，便于管理
- 类似于 Hive 中的数据库，不同数据库下可放不同类型的表
- HBase 默认名称空间是「default」，创建表时默认使用此名称空间
- HBase 系统内建名称空间「hbase」，用于存放系统内建表（namespace、meta）

[image: namespace-default](image/namespace-default.png)

[image: namespace-hbase](image/namespace-hbase.png)

### 2. 名称空间操作语法

#### 创建命名空间

```shell
create_namespace 'MOMO_CHAT'
```

#### 列出命名空间

```shell
list_namespace
```

#### 删除命名空间

```shell
drop_namespace 'MOMO_CHAT'  # 注意：删除命名空间时，必须确保命名空间内没有表
```

#### 查看命名空间

```shell
describe_namespace 'MOMO_CHAT'
```

#### 创建带命名空间的表

```shell
create 'MOMO_CHAT:MSG', 'C1'  # 表名必须带上命名空间，否则默认为default命名空间
```

## 二、HBase 表设计核心要点

### 1. 表设计基本原则

- 列族：推荐 1-2 个，能使用 1 个就不使用 2 个
- 版本设计：如无需保存历史版本，使用默认配置 VERSIONS=1；如需保存历史变更，可设置 VERSIONS>1（注意会占用更多空间）

### 2. 列族设计

- HBase 列的数量应该越少越好
  - 两个及以上的列族会影响 HBase 性能
  - 当一个列所存储的数据达到 flush 阈值时，表中所有列族将同时进行 flush 操作
  - 这将带来不必要的 I/O 开销，列族越多，对性能影响越大

### 3. 版本设计

- 对于不会更新的历史记录数据：
  - 只保留一个版本即可，节省空间
  - HBase 默认版本为 1，保持默认配置
- 对于 HBase 版本特性：
  - 版本是相对于列族而言
  - 可通过 describe 命令查看版本设置：
  ```shell
  hbase:005:0> describe 'MOMO_CHAT:MSG'
  Table MOMO_CHAT:MSG is ENABLED
  MOMO_CHAT:MSG, {TABLE_ATTRIBUTES => {METADATA => {'hbase.store.file-tracker.impl' => 'DEFAULT'}}}
  COLUMN FAMILIES DESCRIPTION
  {NAME => 'C1', INDEX_BLOCK_ENCODING => 'NONE', VERSIONS => '1', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER =>
  'ROW', IN_MEMORY => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536 B (64KB)'}
  ```

### 4. 数据压缩策略

#### 压缩算法对比

在 HBase 可以使用多种压缩编码，包括 LZO、SNAPPY、GZIP。只在硬盘压缩，内存中或者网络传输中没有压缩。

| 压缩算法     | 压缩后占比 | 压缩速度 | 解压缩速度 | 适用场景                                             |
| ------------ | ---------- | -------- | ---------- | ---------------------------------------------------- |
| GZIP         | 13.4%      | 21 MB/s  | 118 MB/s   | 高压缩率场景，但需考虑 CPU 消耗                      |
| LZO          | 20.5%      | 135 MB/s | 410 MB/s   | 需要快速压缩和极快解压的场景，适合高吞吐量应用       |
| Zippy/Snappy | 22.2%      | 172 MB/s | 409 MB/s   | 对压缩率要求不高但追求速度的场景，适合实时性高的系统 |

#### 数据压缩配置

创建新表时指定压缩算法：

```shell
create 'MOMO_CHAT:MSG',{NAME => 'C1',COMPRESSION => 'GZ'}
```

修改已有表的压缩算法：

```shell
disable 'MOMO_CHAT:MSG'  # 上线使用的表需谨慎操作，防止数据丢失
alter 'MOMO_CHAT:MSG', {NAME => 'C1', COMPRESSION => 'GZ'}
enable 'MOMO_CHAT:MSG'
```

## 三、ROWKEY 设计策略

### 1. HBase 官方设计原则

1. **避免使用递增行键/时序数据**

   - 递增 ROWKEY（如时间戳）会导致写入压力集中在单一机器上
   - 应尽量将写入压力均衡分布到各个 RegionServer

2. **避免 ROWKEY 和列名过长**

   - 访问 Cell 需要 ROWKEY、列名，过大会占用较多内存
   - ROWKEY 最大长度为 64KB，建议尽量短小

3. **使用数值类型比字符串更省空间**

   - long 类型（8 字节）可存储非常大的无符号整数
   - 字符串按一个字节一个字符存储，需要约 3 倍空间

4. **确保 ROWKEY 唯一性**
   - 相同 ROWKEY 的数据会被新数据覆盖
   - HBase 数据以 key-value 形式存储，必须保证 RowKey 唯一

### 2. 热点问题及解决方案

热点问题说明：

- 热点指大量客户端直接访问集群的一个或几个节点
- 过大访问量可能使某节点超出承受能力，影响整个 RegionServer 性能

#### 解决方案 A：预分区

- 默认情况下一个 HBase 表只有一个 Region，被托管在一个 RegionServer 中
- 每个 Region 有两个重要属性：Start Key、End Key，表示维护的 ROWKEY 范围
- 单一 Region 在数据量大时会分裂，但初始阶段负载不均衡
- 预分区数量建议为节点数的倍数，根据预估数据量和默认 Region 大小计算

[image: StartKey-EndKey](image/StartKey-EndKey.png)

#### 解决方案 B：ROWKEY 设计优化

1. **反转策略**

   - 将 ROWKEY 尾部随机性好的部分提前到前面
   - 可以使 ROWKEY 随机分布，但牺牲了有序性
   - 利于 Get 操作，但不利于 Scan 操作

2. **加盐策略**

   - 在原 ROWKEY 前添加固定长度随机数
   - 保障数据在所有 Regions 的负载均衡
   - 但查询时需要查找多个可能的 Regions，降低查询效率

3. **哈希策略**
   - 基于 ROWKEY 完整或部分数据进行 Hash
   - 可使用 MD5、sha1、sha256 等算法
   - 同样不利于 Scan 操作，打乱了自然顺序

### 3. 实践推荐策略

1. **预分区**：创建表时配置多个 region，分布在不同 HRegionServer
2. **ROWKEY 设计**：
   - 反转：对手机号码、时间戳等进行反转
   - 加盐：在 rowkey 前加随机数（注意会影响查询）
   - hash：对 rowkey 部分取 hash，计算结果固定便于获取

## 四、预分区与 ROWKEY 设计实例

### 1. 预分区方法

HBase 预分区可通过多种方式实现：

1. **指定分区数量**

   ```shell
   create 'namespace:t1', 'f1', SPLITS_NUM => 5
   ```

2. **手动指定分区点**

   ```shell
   create 'namespace:t1', 'f1', SPLITS => ['10', '20', '30', '40', '50']
   ```

3. **通过文件指定分区点**

   ```shell
   create 'namespace:t1', 'f1', SPLITS_FILE => 'hdfs://path/to/splits_file', OWNER => 'Johndoe'
   ```

4. **指定分区数量和策略**
   ```shell
   create 't1', 'f1', {NUMREGIONS => 15, SPLITALGO => 'HexStringSplit'}
   ```

分区策略选择：

- HexStringSplit：ROWKEY 是十六进制字符串前缀
- DecimalStringSplit：ROWKEY 是 10 进制数字字符串前缀
- UniformSplit：ROWKEY 前缀完全随机

### 2. 实际业务中的分区示例

业务需求分析：

- 需确保数据均匀分布到每个 Region
- 决策：使用 MD5Hash 作为前缀
- ROWKEY 设计：MD5Hash*账号 id*收件人 id\_时间戳

创建表脚本：

```shell
create 'MOMO_CHAT:MSG', {NAME => 'C1', COMPRESSION => 'GZ'}, {NUMREGIONS => 6, SPLITALGO => 'HexStringSplit'}
```

[image: p1](image/p1.png)

观察 Hadoop HDFS 中的内容 和 Hbase Web UI 中显示的内容

Region 其实对应着 HDFS 中的文件

[image: p2](image/p2.png)

### 3. RowKey 设计示例

模拟场景分析：

1. RowKey 构成：MD5Hash*发件人 id*收件人 id\_消息时间戳
2. MD5Hash 计算：将发送人账号+"_"+收件人账号+"_"+消息时间戳取 MD5 值前 8 位
3. 实现目的：确保数据均匀分布，避免热点问题

关键实现代码：

```java
    // 根据Msg实体对象生成rowkey
    public static byte[] getRowkey(Msg msg) throws ParseException {
        // ROWKEY = MD5Hash_发件人账号_收件人账号_消息时间戳

    // 将发件人账号、收件人账号、消息时间戳拼接
        StringBuilder builder = new StringBuilder();
        builder.append(msg.getSender_account());
        builder.append("_");
        builder.append(msg.getReceiver_account());
        builder.append("_");
        // 获取消息的时间戳
        String msgDateTime = msg.getMsg_time();
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date msgDate = simpleDateFormat.parse(msgDateTime);
        long timestamp = msgDate.getTime();
        builder.append(timestamp);

    // 生成MD5值并取前8位
        String md5AsHex = MD5Hash.getMD5AsHex(builder.toString().getBytes());
        String md5Hex8bit = md5AsHex.substring(0, 8);

    // 拼接最终的rowkey
        String rowkeyString = md5Hex8bit + "_" + builder.toString();

        return Bytes.toBytes(rowkeyString);
    }
```

## 五、HBase 性能优化与二级索引

### 1. 性能瓶颈分析

- HBase 默认只支持行键索引，针对其他列查询只能全表扫描
- 使用 scan+filter 组合查询效率不高，特别是数据量大时
- 存在的问题：
  - 网络传输压力大
  - 客户端处理压力大
  - 大数据量查询效率极低

### 2. 二级索引解决方案

- 需要在 ROWKEY 索引外添加其他索引便于查询
- 原生 HBase 开发二级索引较为复杂
- 使用 SQL 引擎可以简化查询操作，提高开发效率

> 如果每次需要我们开发二级索引来查询数据，这样使用起来很麻烦。再者，查询数据都是 HBase Java API，使用起来不是很方便。为了让其他开发人员更容易使用该接口，使用 SQL 引擎通过 SQL 语句来查询数据会更加方便。
```
