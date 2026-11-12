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