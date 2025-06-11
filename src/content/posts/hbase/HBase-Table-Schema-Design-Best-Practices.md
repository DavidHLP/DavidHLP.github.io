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

![namespace-default](image/namespace-default.png)

![namespace-hbase](image/namespace-hbase.png)

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

![StartKey-EndKey](image/StartKey-EndKey.png)

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

![p1](image/p1.png)

观察 Hadoop HDFS 中的内容 和 Hbase Web UI 中显示的内容

Region 其实对应着 HDFS 中的文件

![p2](image/p2.png)

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
