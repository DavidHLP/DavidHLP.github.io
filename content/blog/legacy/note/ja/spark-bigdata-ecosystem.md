---
{
  "archiveId": "X-1154",
  "title": "Spark とビッグデータエコシステム：Hadoop、HBase、Spark 実行モードとクラスタ",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "バッチ/ストリームエンジンと Spark 実行モードを比較。",
  "findings": [
    "Original document: src/content/note/ja/spark-bigdata-ecosystem.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/ja/spark-bigdata-ecosystem.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Spark",
    "Hadoop",
    "BigData",
    "HBase",
    "Cluster",
    "ja",
    "note"
  ],
  "draft": true,
  "lang": "ja",
  "legacy": {
    "path": "src/content/note/ja/spark-bigdata-ecosystem.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Spark とビッグデータエコシステム：Hadoop、HBase、Spark 実行モードとクラスタ",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "ビッグデータとストレージ",
      "kind": "concept",
      "status": "active",
      "draft": true,
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
      "description": "バッチ/ストリームエンジンと Spark 実行モードを比較。",
      "toc": true
    }
  }
}
---


Personal の 4 つと Fuwari の 3 つの Spark/ビッグデータノートは互いに鏡像であり、さらに `hadoop-hbase-spark/README` のローカルクラスタスクリプトもあります。本ページはエンジン選択と実行モードを中心にします。

## 核心メカニズム

- **エンジン概要**：`分布式计算引擎框架概述.md` は MapReduce/Spark/Flink のバッチ/ストリームモデルを比較します。
- **Spark 概要と実行モード**：`Spark概述.md` と `Spark运行模式整理.md` は Local/Standalone/YARN/K8s、Driver/Executor の役割、シャッフル境界を区別します。
- **クラスタスクリプト**：`hadoop-hbase-spark` には `hadoop-compose.yml`、`start-*.sh` などのローカル検証スクリプトが含まれます。

## 適用条件

- バッチ/マイクロバッチ処理で、インメモリ計算と DAG スケジューリングが必要な場合。

## 不適用とリスク

- 出典のバージョンは固定されておらず、YARN/K8s のリソーススケジューリングや HDFS 依存は現行バージョンでの再確認が必要です。
- ローカルスクリプトは単一マシンでのみ検証されており、マルチノードや耐障害性は検証されていません。

## 最小検証

1. Local モードで `SparkPi` を実行し、Driver/Executor のログを確認。
2. Standalone/YARN でそれぞれ投入し、シャッフルとデータ局所性を観察。

## 証拠と不確実性

- **出典事実**：`ingest-spark-ecosystem` は 7 つの出典ノートを含む。
- **本ページの統合**：エンジン比較をバッチ/ストリーム—リソース—シャッフルに収束。
- **未確認**：Spark/Hadoop バージョン、YARN キュー、HDFS HA は固定されていない。

## 関連ページ

- [hbase-foundation-and-ops](/blog/legacy/note/zh-cn/hbase-foundation-and-ops/)
- [multi-service-readiness](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [containerd-tls-troubleshooting](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)


## Sources and related documents

- [Spark 与大数据生态聚合快照：Hadoop、HBase、Spark 运行模式与集群](/blog/legacy/raw/zh-cn/ingest-spark-ecosystem/)
- [HBase 基礎・アーキテクチャと運用：データモデル、テーブル設計、Shell と Java API](/blog/legacy/note/zh-cn/hbase-foundation-and-ops/)
- [マルチサービス起動レディネス：running、ready と依存/失敗/再起動の伝播](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [containerd TLS：信頼チェーンと一時的な検証スキップの判断](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)
