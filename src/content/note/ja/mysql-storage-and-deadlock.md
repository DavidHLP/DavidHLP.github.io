---
title: MySQL ストレージエンジンとデッドロック検出
timestamp: 2026-08-21 00:00:00+08:00
series: ビッグデータとストレージ
kind: concept
status: active
draft: true
sources: ["ingest-mysql-storage"]
related: [mysql-performance-troubleshooting, database-schema-drift, multi-service-readiness]
tags: [MySQL, StorageEngine, InnoDB, Deadlock]
description: エンジン能力とデッドロックログの経路を最小検証で区別。
toc: true
---

3 つの MySQL ノートはストレージエンジンとデッドロックに焦点を当てています：`存储引擎.md`、`基础面试题.md`、`checkmysqldeadlock.md`。本ページはエンジン能力とトラブルシューティングの経路を区別します。

## 核心メカニズム

- **ストレージエンジン**：InnoDB（行ロック、MVCC、クラッシュリカバリ） vs MyISAM（テーブルロック、トランザクションなし）；出典には比較図が含まれます。
- **デッドロック検出**：`checkmysqldeadlock.md` は `SHOW ENGINE INNODB STATUS`、`information_schema`、`performance_schema` によるトラブルシューティング手順を示します。

## 適用条件

- トランザクションと並行書き込みには InnoDB；読み取り専用のアーカイブには MyISAM/Archive を検討。

## 不適用とリスク

- MySQL バージョン（5.7 vs 8.0）は大きく異なり、デッドロックログの書式やパラメータは変動します。

## 最小検証

1. 特定のエンジンでテーブルを作成し、ロックとトランザクション挙動を比較。
2. クロスロックのデッドロックを作成し、`INNODB STATUS` をレビュー。

## 証拠と不確実性

- **出典事実**：`ingest-mysql-storage` は 3 つの出典ノートを含む。
- **本ページの統合**：エンジン選択とデッドロックを最小チェックに収束。
- **未確認**：MySQL バージョン、パラメータ、本番設定は再確認が必要。

## 関連ページ

- [mysql-performance-troubleshooting](/note/mysql-performance-troubleshooting)
- [database-schema-drift](/note/database-schema-drift)
- [multi-service-readiness](/note/multi-service-readiness)
