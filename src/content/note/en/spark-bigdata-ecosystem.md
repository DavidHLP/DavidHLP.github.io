---
title: "Spark and Big Data Ecosystem: Hadoop, HBase, Spark Runtime Modes, and Clusters"
timestamp: 2026-08-21 00:00:00+08:00
series: "Big Data & Storage"
kind: concept
status: active
draft: true
sources: ["ingest-spark-ecosystem"]
related: [hbase-foundation-and-ops, multi-service-readiness, containerd-tls-troubleshooting]
tags: [Spark, Hadoop, BigData, HBase, Cluster]
description: Compares batch/stream engines and Spark runtime modes.
toc: true
---

The 4 Personal and 3 Fuwari Spark/Big Data notes mirror each other, plus the local cluster scripts in `hadoop-hbase-spark/README`. This page centers on engine selection and runtime modes.

## Core Mechanism

- **Engine overview**: `分布式计算引擎框架概述.md` (Distributed Engine Overview) compares batch/stream models of MapReduce/Spark/Flink.
- **Spark overview and runtime modes**: `Spark概述.md` (Spark Overview) and `Spark运行模式整理.md` (Spark Runtime Modes) distinguish Local/Standalone/YARN/K8s, Driver/Executor roles, and shuffle boundaries.
- **Cluster scripts**: `hadoop-hbase-spark` contains `hadoop-compose.yml`, `start-*.sh` and other local validation scripts.

## Applicability

- Batch/micro-batch processing that needs in-memory computation and DAG scheduling.

## Not Applicable and Risks

- Source versions are not pinned; YARN/K8s resource scheduling and HDFS dependencies must be rechecked against current versions.
- Local scripts are only validated on a single machine, not for multi-node and fault tolerance.

## Minimum Verification

1. Run `SparkPi` in Local mode and confirm Driver/Executor logs.
2. Submit separately in Standalone/YARN and observe shuffle and data locality.

## Evidence and Uncertainty

- **Source facts**: `ingest-spark-ecosystem` contains 7 source notes.
- **Synthesis**: This page converges engine comparisons into batch/stream—resources—shuffle.
- **Unconfirmed**: Spark/Hadoop versions, YARN queues, and HDFS HA are not pinned.

## Related Pages

- [hbase-foundation-and-ops](/note/hbase-foundation-and-ops)
- [multi-service-readiness](/note/multi-service-readiness)
- [containerd-tls-troubleshooting](/note/containerd-tls-troubleshooting)
