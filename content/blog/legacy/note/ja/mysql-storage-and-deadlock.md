---
{
  "archiveId": "X-1108",
  "title": "MySQL ストレージエンジンとデッドロック検出",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "エンジン能力とデッドロックログの経路を最小検証で区別。",
  "findings": [
    "元の文書: src/content/note/ja/mysql-storage-and-deadlock.md",
    "出典リビジョン: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "証拠の状態: 有効"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/ja/mysql-storage-and-deadlock.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "MySQL",
    "StorageEngine",
    "InnoDB",
    "Deadlock",
    "ja",
    "note"
  ],
  "draft": false,
  "lang": "ja",
  "legacy": {
    "path": "src/content/note/ja/mysql-storage-and-deadlock.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "MySQL ストレージエンジンとデッドロック検出",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "ビッグデータとストレージ",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-mysql-storage"
      ],
      "related": [
        "mysql-performance-troubleshooting",
        "database-schema-drift",
        "multi-service-readiness"
      ],
      "tags": [
        "MySQL",
        "StorageEngine",
        "InnoDB",
        "Deadlock"
      ],
      "description": "エンジン能力とデッドロックログの経路を最小検証で区別。",
      "toc": true
    }
  },
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-mysql-storage"
  ],
  "related": [
    "mysql-performance-troubleshooting",
    "database-written-test-review"
  ]
}
---

3 つの MySQL ノートはストレージエンジンとデッドロックに焦点を当てています：`存储引擎.md`、`基础面试题.md`、`checkmysqldeadlock.md`。本ページはエンジン能力とトラブルシューティングの経路を区別します。

## 核心メカニズム

- **ストレージエンジン**：InnoDB（行ロック、MVCC、クラッシュリカバリ） vs MyISAM（テーブルロック、トランザクションなし）；出典には比較図が含まれます。
- **デッドロック検出**：`checkmysqldeadlock.md` は `SHOW ENGINE INNODB STATUS`、`information_schema`、`performance_schema` によるトラブルシューティング手順を示します；4 表の書き込み演習・同一表 DML 制約・トランザクション間同時実行の確認は [データベース筆記試験の復盤：SQL セマンティクスからバッチ処理まで](/blog/legacy/note/ja/database-written-test-review/) を参照。

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


- [mysql-performance-troubleshooting](/blog/legacy/note/ja/mysql-performance-troubleshooting/)
- [データベース筆記試験の復盤：SQL セマンティクスからバッチ処理まで](/blog/legacy/note/ja/database-written-test-review/)

## 出典と関連文書

- [ingest-mysql-storage](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-mysql-storage.md)
- [MySQL パフォーマンス切り分け：現象 → 指標 → 層 → 安全な緩和](/blog/legacy/note/ja/mysql-performance-troubleshooting/)

## 昇格チェック

- 固定 MySQL 小版・engine・分離レベルで engine 差を実行
- 二つの匿名 transaction で victim rollback と deadlock log を観察
- 同順 lock 対照と性能頁リンク
