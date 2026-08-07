---
title: "MySQL パフォーマンス切り分け：現象 → 指標 → 層 → 安全な緩和"
timestamp: 2026-07-01 00:00:00+08:00
series: "システム運用とインフラストラクチャ"
kind: concept
status: active
sources: ["legacy-mysql-performance-troubleshooting"]
related: ["containerd-tls-troubleshooting", "intranet-penetration-ssh-guide"]
tags: [MySQL, Database, Troubleshooting, Performance, InnoDB, Operations]
description: "MySQL の遅延、停止、接続滞留、レプリケーション警告を、接続・ロック・インデックス・トランザクション・Buffer Pool・I/O の現象、指標、層、安全な緩和へ対応付ける。完全な SOP は複製しない。"
toc: true
---

本ページは、MySQL が遅くなったり停止したりしたとき、最初に見る指標、証拠をアプリ/接続、Server/SQL、InnoDB、OS/ハードウェアのどの層に置くか、事故を広げにくい緩和策は何かを切り分ける。完全なコマンドチェックリストや一つの事故の経過を、そのまま知識本体にはしない。

## コアメカニズム

### 1. 現象から診断層へ

| 現象 | 最初の証拠 | 層 | 優先する緩和 |
| --- | --- | --- | --- |
| `Too many connections`、Sleep セッションの滞留 | `Threads_connected`、`max_connections`、接続元、Sleep 時間、`INNODB_TRX` | アプリ / 接続 | 疑わしいエンドポイントをスロットリングし、プールを修正する。セッション操作前にトランザクションを確認する。 |
| 少数の SQL が停止し、多数が `Waiting` | `SHOW FULL PROCESSLIST`、`sys.innodb_lock_waits` | InnoDB ロック / MDL | ブロッカーを見つけてトランザクションを短縮する。確認済みの非重要スレッドだけに `KILL` を使う。 |
| 特定の SQL 形だけ遅い | スロークエリ/ digest、`rows_examined / rows_sent`、`EXPLAIN` | Server オプティマイザ / インデックス | 統計情報、アクセス型、選択性を確認してから SQL/インデックスを変更する。 |
| 周期的な停止、全体の I/O 高騰 | `iostat -xm 1`、ダーティページ、Buffer Pool の read/wait | OS ディスク / InnoDB Buffer Pool | 大きなクエリの圧力を下げ、証拠に応じて容量、フラッシュ、読み書き経路を調整する。 |
| 長いトランザクションと undo 増大 | トランザクションの年齢、`History list length` | InnoDB MVCC / undo | 不要な長期トランザクションを見つけて終了する。破壊的なクリーンアップを最初に行わない。 |

**順序が重要である**：まず `SHOW PROCESSLIST` でキューの形を見、次に `top`/`iostat` でリソースを確認し、その後に個別 SQL へ掘り下げる。範囲を把握せずに `EXPLAIN` から始めない。

### 2. 接続とロック：待機は因果の手掛かり

- 接続が枯渇したら `Threads_connected` と `max_connections` を比較し、`user, host` ごとに集計する。`Threads_created` が継続的に増えるならプール再利用が弱く、高い `Aborted_clients` は正常に閉じられていない接続を示す。
- 60 秒を超える Sleep が自動的に無害とは限らない。トランザクションを保持していれば DDL を止め undo を増やすため、`INNODB_TRX` と照合する。
- MySQL 5.7 の行ロックは `INNODB_LOCKS`/`INNODB_LOCK_WAITS` で確認できる。MySQL 8.0 では raw が `performance_schema.data_locks`、`data_lock_waits`、`sys.innodb_lock_waits` を推奨している。
- `Waiting for table metadata lock` は MDL を示す。典型的には未コミットの長期トランザクションがあり、別セッションが `ALTER`/`DROP` を実行し、その後の全アクセスがキューに並ぶ。
- デッドロックの証拠は `SHOW ENGINE INNODB STATUS \G` の `LATEST DETECTED DEADLOCK` セクションである。raw の方向性は、ロック順序の統一、トランザクション短縮、必要に応じた RR→RC の分離レベル評価である。

### 3. SQL、インデックス、トランザクション

- スロークエリは動的な `slow_query_log`、または `performance_schema.events_statements_summary_by_digest` の指紋集計で切り分ける。`rows_examined / rows_sent` が 100 を大きく超えることを raw は典型的なインデックス失敗の信号としている。
- `EXPLAIN` では `type`、`key`、`rows`、`filtered`、`Extra` を見る。`ALL`、`key=NULL`、`Using filesort`、`Using temporary` は調査信号であり、それだけで修正方法を決めない。
- raw が挙げるインデックス失敗は、列を関数で包む、暗黙の型変換、複合インデックスの左端プレフィックス欠落、範囲条件の右側列、先頭ワイルドカード `LIKE`、一方にインデックスがない `OR` である。MySQL 8.0 では `EXPLAIN FORMAT=JSON`、`EXPLAIN ANALYZE`、一時的な `INVISIBLE` インデックスで仮説を検証できる。
- 長期トランザクションの連鎖は「undo バージョンを purge できない → history list 増大 → 表/インデックス膨張 → 行参照が遅い」である。30 秒超は raw の例示フィルタであり、全システム共通の SLA ではない。

### 4. Buffer Pool、I/O、直感に反するインデックス選択

主要な証拠は `SHOW ENGINE INNODB STATUS \G` と次の 3 つのグローバルカウンタから得る。

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
```

- `Innodb_buffer_pool_wait_free` の増分が正で `Free buffers` が非常に少なければ、スレッドがページを待っている。`Modified db pages` が高ければフラッシュ圧力も見る。
- ヒット率は `1 - reads / read_requests` で概算し、raw の正常参考は `> 99%` である。比率が高くても短時間の物理読み取り急増は否定できないため、絶対値の差分と `wait_free` を同時に確認する。
- ワーキングセットは概ね「頻繁にアクセスするページ数 × 16KB」である。ホットデータが Buffer Pool を超えると物理 I/O が CPU フィルタリングより高価になり、`FORCE INDEX` は冷たいページを選んで読み取りや `buf0buf.cc` 待機を増やす可能性がある。
- OS の最小証拠は `iostat -xm 1` で、`%util`、`await`、`r/s`、`w/s` を見る。リソースが飽和している時に大きなインデックスを追加すると、メモリをさらに圧迫することがある。

### 5. CPU、一時表、安全な緩和

CPU 高騰は、インデックスなしの全表走査、ソート/集約の一時表、または本当に高い QPS によることが多い。`Created_tmp_disk_tables` の増加と `Using temporary` はディスク上の一時表を示す。レプリケーション警告では `SHOW REPLICA STATUS \G`（MySQL 8.0。raw は 5.7 に `SHOW SLAVE STATUS` と記載）から始める。

安全寄りの順序は、アプリ層でスロットリング/縮退 → 証拠を保存 → ブロッカーを特定 → 非重要な長時間クエリだけを慎重に `KILL` すること。`wait_free > 0` かつ Buffer Pool がほぼ満杯なら、raw はインデックス強制より容量、アーカイブ、キャッシュ、読み書き分離を優先している。

## 適用条件

1. 接続、ロック、インデックス、トランザクション、Buffer Pool、ディスク I/O、一時表、CPU の初期切り分けに使い、各判断を同じ時間窓の指標差分に結び付ける。
2. 障害中はまず新規負荷を減らし、processlist、InnoDB status、リソース指標、SQL サンプルを保存してから、ロールバック可能な設定/クエリ変更を行う。
3. MySQL 5.7 と 8.0 ではロックビュー、レプリケーションコマンド、`EXPLAIN ANALYZE` が異なる。8.0 のビューを 5.7 に適用する前にバージョンを確認する。
4. Buffer Pool の圧力はワーキングセット、物理読み取り、待機カウンタを一緒に評価する。ヒット率だけではメモリの健全性を証明しない。

## 適用外とリスク

- `KILL <thread_id>` は汎用の高速化ボタンではない。重要な書き込みトランザクションを停止するとアプリエラーやロールバックを招くため、raw は最終手段としている。
- Buffer Pool/I/O の飽和を `FORCE INDEX` で隠さない。選択性が高いインデックスでもメモリに常駐しているとは限らない。
- `Free buffers < 100`、`wait_free > 0`、ヒット率 `> 99%` は raw の参考信号である。バージョン、負荷、サンプリング窓に依存し、無条件の閾値ではない。
- `SET GLOBAL` によるスローログ有効化は再起動で失われる。`innodb_flush_log_at_trx_commit`、`sync_binlog`、Buffer Pool サイズの変更は整合性/リソースリスクを変えるため、環境レビューが必要である。
- `EXPLAIN`、`ANALYZE TABLE`、新しいインデックスはオプティマイザの挙動を説明/変更できるだけで、接続プール、ロック順序、トランザクション境界、ディスク容量の修正にはならない。

## 最小検証

まず層をまたぐ証拠を取得する。

```sql
SHOW FULL PROCESSLIST;
SHOW ENGINE INNODB STATUS \G
SELECT trx_id, trx_started, trx_state
FROM information_schema.INNODB_TRX
ORDER BY trx_started;
```

次に症状別の検査を 1 つ追加する。

```bash
iostat -xm 1
```

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
SHOW STATUS LIKE 'Created_tmp%';
```

- 接続/ロック：processlist の `Waiting`、Sleep 時間、トランザクション年齢を対応付け、8.0 では `sys.innodb_lock_waits` を優先する。
- インデックス：障害範囲を把握してから `EXPLAIN SELECT ... \G` を実行する。MySQL 8.0 の実コスト確認は `EXPLAIN ANALYZE SELECT ...` だが、バージョン依存である。
- Buffer Pool/I/O：カウンタの前後差分を記録する。`wait_free`、物理読み取り、`await/%util` が同時に悪化するなら、`FORCE INDEX` の前にリソースボトルネックを緩和する。

## 証拠と不確実性

- **出典事実**：`legacy-mysql-performance-troubleshooting` は 5 層の方法、接続/ロック/MDL の証拠、インデックス失敗の形、長期トランザクションと history list、Buffer Pool カウンタと 16KB ワーキングセット、`FORCE INDEX` の反例、I/O/一時表の信号、止血操作を記録している。
- **本ページの統合**：元の観点を「現象 → 指標 → 層 → 安全な緩和」に圧縮し、SQL 変更より前にリソース証拠を置いた。新しい監視閾値を発明したものではない。
- **未確認**：現在の MySQL バージョン、ハードウェア/ディスク、Buffer Pool サイズ、実ワーキングセット、分離レベル、接続プール実装、SQL サンプル、指標のサンプリング窓は実環境で確認する必要がある。

## 関連ページ

- [containerd TLS 信頼チェーン](/note/containerd-tls-troubleshooting)
- [SSH 内網アクセスの選択](/note/intranet-penetration-ssh-guide)
