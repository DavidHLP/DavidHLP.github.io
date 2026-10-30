---
{
  "archiveId": "X-1212",
  "title": "Spark 与大数据生态：Hadoop、HBase、Spark 运行模式与集群",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "对比分布式计算引擎，收敛 Spark 概述、运行模式与 Hadoop/HBase 集群搭建的最小验证。",
  "findings": [
    "Original document: src/content/note/zh-cn/spark-bigdata-ecosystem.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/zh-cn/spark-bigdata-ecosystem.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Spark",
    "Hadoop",
    "BigData",
    "HBase",
    "Cluster",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "src/content/note/zh-cn/spark-bigdata-ecosystem.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Spark 与大数据生态：Hadoop、HBase、Spark 运行模式与集群",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "大数据与存储",
      "kind": "concept",
      "status": "active",
      "sources": [
        "ingest-spark-ecosystem"
      ],
      "related": [
        "hbase-foundation-and-ops",
        "multi-service-readiness",
        "containerd-tls-troubleshooting"
      ],
      "tags": [
        "Spark",
        "Hadoop",
        "BigData",
        "HBase",
        "Cluster"
      ],
      "description": "对比分布式计算引擎，收敛 Spark 概述、运行模式与 Hadoop/HBase 集群搭建的最小验证。",
      "toc": true
    }
  }
}
---


Personal 4 篇与 Fuwari 3 篇 Spark/大数据原文互为镜像，另含 `hadoop-hbase-spark/README` 的本地集群脚本。本页以引擎选型与运行模式为核心。

## 核心机制

- **引擎概述**：`分布式计算引擎框架概述.md` 对比 MapReduce/Spark/Flink 的批/流模型。
- **Spark 概述与运行模式**：`Spark概述.md` 与 `Spark运行模式整理.md` 区分 Local/Standalone/YARN/K8s，Driver/Executor 角色与 shuffle 边界。
- **集群脚本**：`hadoop-hbase-spark` 目录含 `hadoop-compose.yml`、`start-*.sh` 等本地验证脚本。

## 适用条件

- 批量/微批处理、需要内存计算与 DAG 调度的场景。

## 不适用与风险

- 原文版本未固定，YARN/K8s 的资源调度与 HDFS 依赖需按当前版本复核。
- 本地脚本仅作单机验证，未做多节点与容错验证。

## 最小验证

1. Local 模式跑 `SparkPi`，确认 Driver/Executor 日志。
2. Standalone/YARN 分别提交，观察 shuffle 与数据本地性。

## 证据与不确定性

- **来源事实**：`ingest-spark-ecosystem` 收录 7 篇原文。
- **本页综合**：把引擎对比收敛为批/流—资源— shuffle 三问。
- **未确认项**：Spark/Hadoop 版本、YARN 队列与 HDFS HA 未固定。

## 相关页面

- [hbase-foundation-and-ops](/blog/legacy/note/zh-cn/hbase-foundation-and-ops/)
- [multi-service-readiness](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [containerd-tls-troubleshooting](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)


## 来源与关联文档

- [Spark 与大数据生态聚合快照：Hadoop、HBase、Spark 运行模式与集群](/blog/legacy/raw/zh-cn/ingest-spark-ecosystem/)
- [HBase 基础、架构与运维：数据模型、表设计、Shell 与 Java API](/blog/legacy/note/zh-cn/hbase-foundation-and-ops/)
- [多服务启动就绪：running、ready 与依赖/失败/重启传播](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [containerd TLS：证书信任链与临时跳过验证的决策](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)
