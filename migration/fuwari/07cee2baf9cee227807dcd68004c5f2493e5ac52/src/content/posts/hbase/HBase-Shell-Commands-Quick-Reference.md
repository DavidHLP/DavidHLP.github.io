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
