---
{
  "archiveId": "X-1116",
  "title": "HBase 基礎・アーキテクチャと運用：データモデル、テーブル設計、Shell と Java API",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "論理/物理モデル、アーキテクチャ、テーブル設計と運用を収束し、RDBMS とのトレードオフを明確化。",
  "findings": [
    "Original document: src/content/note/ja/hbase-foundation-and-ops.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/ja/hbase-foundation-and-ops.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "HBase",
    "BigData",
    "DataModel",
    "Architecture",
    "Shell",
    "JavaAPI",
    "ja",
    "note"
  ],
  "draft": true,
  "lang": "ja",
  "legacy": {
    "path": "src/content/note/ja/hbase-foundation-and-ops.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "HBase 基礎・アーキテクチャと運用：データモデル、テーブル設計、Shell と Java API",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "ビッグデータとストレージ",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-hbase-foundation"
      ],
      "related": [
        "spark-bigdata-ecosystem",
        "database-schema-drift",
        "mysql-storage-and-deadlock"
      ],
      "tags": [
        "HBase",
        "BigData",
        "DataModel",
        "Architecture",
        "Shell",
        "JavaAPI"
      ],
      "description": "論理/物理モデル、アーキテクチャ、テーブル設計と運用を収束し、RDBMS とのトレードオフを明確化。",
      "toc": true
    }
  }
}
---


2 つのリポジトリの 18 の HBase ノートは高度に同質です（Personal 9 + Fuwari 9、実質的には言語と長さが違うだけの一対一対応）。本ページはそれらをデータモデル—アーキテクチャ—テーブル設計—運用の 4 部に収束させ、重複する章を削除し再利用可能な概念を残します。

## 核心メカニズム

### 1. データモデル：論理と物理の分離

- 論理：`Table → RowKey → ColumnFamily:ColumnQualifier → Timestamp → Value`、スパースでバージョン管理される。
- 物理：`ColumnFamily` ごとに `Region` を垂直分割し、Region は `RowKey` 範囲で RegionServer に分散；`HStore` は Family に対応し、`StoreFile/HFile` が永続化、`MemStore` がメモリバッファ、`WAL` が先行書き込み。
- 出典 `Hbase逻辑模型与物理模型详解.md` と `HBase-Logical-vs-Physical` は、同一行が物理的には Family ごとに分散して格納されることを説明しています。

### 2. アーキテクチャ構成

| コンポーネント | 責務                          | 境界                               |
| -------------- | ----------------------------- | ---------------------------------- |
| HMaster        | Region 割り当て、DDL          | 書き込み/読み取りパス上にない      |
| RegionServer   | Region ホスティング、読み書き | ホットスポットは RowKey 設計に依存 |
| ZooKeeper      | リーダー選出、メタデータ      | 新バージョンで徐々に弱体化         |
| HDFS           | HFile/WAL ストレージ          | HDFS の可用性に依存                |

### 3. テーブル設計と運用

- RowKey：均一ハッシュ、単調増加のホットスポットを避ける；Family 数は少なく（1–2）、Qualifier は多くてよい。
- 運用：HBase Shell（`create/put/get/scan/disable/drop`）、Java API（`Admin/Table/Connection`）は `HBase-Shell-Administration-Guide` に対応。

## 適用条件

- ワイドでスパース、書き込みが多く、RowKey プレフィックスでのスキャンとバージョン保持が必要。
- すでに HDFS/ZK を運用している、またはマネージド HBase をクラウドで利用している。

## 不適用とリスク

- 強いトランザクション、JOIN、二次インデックス、全文検索は HBase の得意分野ではない。
- 不適切な RowKey 設計は Region のホットスポットを引き起こし、Family が多すぎると Flush/Compaction が増大。
- 個人ノートのクラスタスクリプト（`hadoop-hbase-spark`）はローカルでのみ検証され、本番では検証されていない。

## 最小検証

1. Shell でテーブルを作成し、複数バージョンを書き込み、`scan` でタイムスタンプと Family 分割を検証。
2. Java API でテーブル作成/削除とバッチ Put/Get を行い、接続クローズと例外処理を確認。
3. RowKey プレフィックスを調整し、Region 分裂とホットスポットを観察。

## 証拠と不確実性

- **出典事実**：`ingest-hbase-foundation` は 18 の出典ノートを含み、重複は言語の違いのみ。
- **本ページの統合**：散在する章をモデル—アーキテクチャ—設計に収束。
- **未確認**：HBase バージョン（出典で固定されていない）、ZK 依存の変遷、Phoenix/二次インデックスとの統合は未検証。

## 関連ページ

- [spark-bigdata-ecosystem](/blog/legacy/note/zh-cn/spark-bigdata-ecosystem/)
- [database-schema-drift](/blog/legacy/note/zh-cn/database-schema-drift/)
- [mysql-storage-and-deadlock](/blog/legacy/note/zh-cn/mysql-storage-and-deadlock/)


## Sources and related documents

- [HBase 基础、架构与运维聚合快照：数据模型、表设计、Shell 与 Java API](/blog/legacy/raw/zh-cn/ingest-hbase-foundation/)
- [Spark とビッグデータエコシステム：Hadoop、HBase、Spark 実行モードとクラスタ](/blog/legacy/note/zh-cn/spark-bigdata-ecosystem/)
- [データベース Schema ドリフト：history、schema、query の三ビューで特定する](/blog/legacy/note/zh-cn/database-schema-drift/)
- [MySQL ストレージエンジンとデッドロック検出](/blog/legacy/note/zh-cn/mysql-storage-and-deadlock/)
