---
title: "MySQLパフォーマンス・トラブルシューティング実戦ハンドブック"
timestamp: 2026-07-01 00:00:00+08:00
series: Database
tags: [MySQL, Database, Troubleshooting, Performance, InnoDB, Operations]
description: "オンコール時の止血対応から根本原因の深掘りまでを一気通貫で扱う MySQL パフォーマンス・トラブルシューティングの完全マニュアル。接続/セッション・スロークエリ・インデックス・ロック・MVCC/undo・Buffer Pool メモリ・I/O・CPU・一時テーブル/ソート・レプリケーション・オプティマイザ統計という 10 つの観点を網羅し、メモリ飽和によるインデックス破綻の事例、症状別ディシジョンツリー、状態指標のチートシート、モニタリングアラートも添付する。"
toc: true
---

# MySQLパフォーマンス・トラブルシューティング実戦ハンドブック

データベースの遅延は常に次の 3 つの根本原因のいずれかに帰着する：**リソースボトルネック**（CPU / メモリ / I/O / ネットワーク）、**ロック競合**、**SQL/インデックスの非効率**。本マニュアルは、症状を最短経路で分類し、適切な処方箋を導くことを目的とする。

本書は 2 つのパートを融合している：**10 観点の汎用調査フロー**と、**実ケース深掘り**——「メモリ飽和によるインデックスの破綻」。このケースは反直感的な工学的真理を明らかにする：**メモリが飽和している状況では、物理 I/O コストは CPU フィルタリングコストを大きく上回るため、`FORCE INDEX` を盲目的に適用すると速くはならずに逆に遅くなる。**

## 第 1 部：オンコール止血 SOP（ゴールデン 10 分）

**目標**：迅速に業務を復旧し、データベース負荷を削減する。診断は手段、止血が目的なのだ。

### 1.1 キューを確認する——アクティブ接続と滞留

まず、大量のクエリ滞留や長トランザクションがパイプラインを塞いでいないか確認する。

```sql
-- 現在実行中のスレッドを確認。Time（経過秒数）と State 列に注目
SHOW FULL PROCESSLIST;

-- 未コミットトランザクションを確認（長トランザクションは MDL ロック・undo 膨張の元凶）
SELECT trx_id, trx_state, trx_started,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_query
FROM information_schema.INNODB_TRX
WHERE trx_state != 'RUNNING'
   OR TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30
ORDER BY trx_started;
```

### 1.2 緊急対応 3 点セット

- **スロットリング**：疑わしいエンドポイントの並行度をアプリ層で制限。
- **セッション停止**：重要でない長時間クエリには `KILL <thread_id>`。
- **縮退運用**：重要度の低いレポート、統計ジョブ、バッチ処理を一時停止。

> ⚠️ `KILL` 前に必ず対象スレッドを確認すること。重要な書き込みトランザクションを誤って停止すると、アプリがクラッシュしたり、最悪データがロールバックされる。`KILL` は最終手段である。

---

## 第 2 部：調査方法論——5 階層ローカリゼーション

**黄金律**：まず `SHOW PROCESSLIST` でキューの形状を確認し、次にシステムリソース（`top` / `iostat`）を見、それから**初めて**個別 SQL に踏み込む。**最初から `EXPLAIN` を走らせてはならない。**

```
アプリケーション層（コネクションリーク / 肥大トランザクション / N+1 クエリ）
   ↓
コネクション層（接続数枯渇 / 認証ストーム）
   ↓
サーバ層（パース / オプティマイザの誤ったインデックス選択 / ソート / 一時テーブル）
   ↓
エンジン層（InnoDB ロック / Buffer Pool / MVCC / ダーティページフラッシュ）
   ↓
OS / ハードウェア（CPU / メモリ / ディスク I/O / ネットワーク）
```

ローカリゼーションはトップダウンで進める。アプリ層の問題（コネクションプール設定ミスなど）は、データベースの CPU を倍にしても解決しない。

### 根本原因クイックトリアージ

| 根本原因 | 典型症状 | 第一指標 |
|---|---|---|
| **リソースボトルネック** | 全体遅延、間欠的ストール、システム負荷高 | `top` / `iostat` / `SHOW ENGINE INNODB STATUS` |
| **ロック競合** | 一部のクエリが停止し、他が後ろで詰まる | `SHOW PROCESSLIST` に `Waiting` 多数 |
| **SQL/インデックス非効率** | 特定クエリのみ遅い、CPU/メモリは全体正常 | スロークエリログ、`EXPLAIN` |

---

## 第 3 部：観点別詳細診断

### 3.1 コネクションとセッション

#### 接続数枯渇（`Too many connections`）

```sql
-- 現在の接続数 vs 上限
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';

-- ソース別の分布（誰が新規接続を大量発生させているか特定）
SELECT user, host, COUNT(*) AS cnt
FROM information_schema.processlist
GROUP BY user, host ORDER BY cnt DESC;

-- 接続の再利用状況：Threads_created が Threads_cached に近いならプールが効いていない
SHOW STATUS LIKE 'Threads_%';
```

| 指標 | 意味 | 健全性判定 |
|---|---|---|
| `Threads_created` が増え続ける | 新規接続が絶え間なく開かれている（プール無効） | アプリ層のプール設定を監査 |
| `Aborted_clients` が多い | 接続が正常に閉じられていない | アプリが接続を解放していない |
| `Aborted_connects` が多い | 接続失敗（認証/ネットワーク） | error log を確認 |

#### Sleep 接続の滞留（リーク疑い）

```sql
-- 長時間の Sleep セッションを特定——トランザクション漏れか close() 忘れの可能性
SELECT id, user, host, db, command, time, state, info
FROM information_schema.processlist
WHERE command = 'Sleep' AND time > 60
ORDER BY time DESC;
```

> 開いているトランザクションを保持したまま Sleep しているセッションが最も危険——DDL をブロックし undo を膨らませる。必ず `INNODB_TRX` と突き合わせて確認すること。

### 3.2 スロークエリの特定

#### スロークエリログの有効化

```sql
-- ランタイム有効化（再起動で消失、永続化には設定ファイルへ）
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;                    -- 1 秒超を記録
SET GLOBAL log_queries_not_using_indexes = ON;      -- インデックス未使用も記録
SET GLOBAL min_examined_row_limit = 100;            -- 100 行未満のスキャンは除外（ノイズフィルタ）
```

#### performance_schema——フィンガープリントで集約（生ログより有用）

```sql
-- スロークエリ TOP ランキング：SQL フィンガープリントで集約
SELECT
  digest_text,
  count_star                AS exec_count,
  round(avg_timer_wait/1e9) AS avg_ms,
  round(max_timer_wait/1e9) AS max_ms,
  sum_rows_examined         AS total_rows_read,
  sum_rows_sent             AS total_rows_sent
FROM performance_schema.events_statements_summary_by_digest
WHERE digest_text IS NOT NULL
ORDER BY sum_timer_wait DESC
LIMIT 10;

-- 重要指標：rows_examined / rows_sent >> 100 は典型的なインデックス破綻の兆候
```

#### pt-query-digest でスローログ分析

```bash
# 集約分析。影響度順の TOP SQL と時間帯別分布を出力
pt-query-digest --limit 100% /var/log/mysql/slow.log > report.txt
```

### 3.3 実行計画とインデックス問題

#### EXPLAIN フィールド早見表

```sql
EXPLAIN SELECT ... \G

-- MySQL 8.0：実実行コスト（実行数、ループ回数、所要時間）— 推定より遥かに信頼性が高い
EXPLAIN ANALYZE SELECT ...;
```

| フィールド | 確認ポイント | 危険シグナル |
|---|---|---|
| `type` | アクセス種別 | `ALL`（全表）、`index`（全インデックス走査） |
| `key` | 実際に使われたインデックス | `NULL`（インデックス未使用） |
| `rows` | 推定走査行数 | 返却行数を大幅に上回る |
| `filtered` | フィルタ後の残存率 | 100 に近いほど良い |
| `Extra` | 追加情報 | `Using filesort` / `Using temporary` / `Using join buffer` |

#### インデックスを殺す 6 つの典型パターン

```sql
-- ❌ 1. カラムを関数で包む → インデックス無効
WHERE DATE(create_time) = '2026-07-01'
-- ✅ 範囲スキャンに書き換え
WHERE create_time >= '2026-07-01' AND create_time < '2026-07-02'

-- ❌ 2. 暗黙の型変換（カラムは VARCHAR、値が INT）
WHERE phone = 13800138000
-- ✅ リテラルをクォート
WHERE phone = '13800138000'

-- ❌ 3. 最左プレフィックス欠落（複合インデックス (a, b, c)）
WHERE b = 1 AND c = 2   -- `a` が不在 → インデックス未使用

-- ❌ 4. 範囲の右側が死ぬ（複合インデックス (a, b, c)）
WHERE a = 1 AND b > 10 AND c = 3   -- `c` はインデックスを使えない

-- ❌ 5. LIKE の前方がワイルドカード
WHERE name LIKE '%張'
-- ✅ 全文インデックス or 右固定 LIKE '張%'

-- ❌ 6. OR の片側にインデックスなし
WHERE indexed_col = 1 OR unindexed_col = 2   -- 全表スキャンに退化
```

#### インデックス可視性診断（MySQL 8.0）

```sql
-- オプティマイザが想定外を選んだ？ 検討内容とコストを確認
EXPLAIN FORMAT=JSON SELECT ...;

-- インデックスをオプティマイザから一時的に隠す（物理削除なし、簡単に戻せる）
ALTER TABLE t ALTER INDEX idx_name INVISIBLE;
ALTER TABLE t ALTER INDEX idx_name VISIBLE;
```

### 3.4 ロック問題（最も多い本番インシデント源）

#### 行ロック待機調査

```sql
-- MySQL 5.7
SELECT * FROM information_schema.INNODB_LOCKS;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;

-- MySQL 8.0（推奨、より詳細）
SELECT * FROM performance_schema.data_locks;       -- 誰がロックを保持
SELECT * FROM performance_schema.data_lock_waits;  -- 誰が何で待機

-- 一発で「張本人」を特定するクエリ（8.0）
SELECT
  blocking_pid, blocking_query,
  waiting_pid,  waiting_query,  waiting_age
FROM sys.innodb_lock_waits;
```

#### デッドロック

```sql
SHOW ENGINE INNODB STATUS \G
-- LATEST DETECTED DEADLOCK を探す。双方のトランザクションの保持・待機リソースを確認
-- デッドロックログを error log に恒久出力：
SET GLOBAL innodb_print_all_deadlocks = ON;
```

**よくある誘因**：トランザクション内の複数テーブル更新順序の不一致、ユニークインデックスへの並行挿入、ギャップロック競合。対処方針は**ロック順序の統一 + トランザクション短縮 + 分離レベル低下**（RR→RC で大部分のギャップロックが消える）。

#### MDL（メタデータロック——見落とされがち）

**症状**：あるテーブルへの `SELECT` / `UPDATE` が全部ハングし、`SHOW PROCESSLIST` に `Waiting for table metadata lock` が並ぶ。

**典型シナリオ**：長トランザクションが未コミットの状態で、別セッションが `ALTER` / `DROP` を実行。以後、当該テーブルへの全アクセスがキュー待ちになる。

```sql
-- MDL 保持者を特定（8.0）
SELECT * FROM performance_schema.metadata_locks
WHERE OBJECT_SCHEMA = 'db' AND OBJECT_NAME = 'table';

-- 古典的犯人：未コミットの長トランザクション
SELECT * FROM information_schema.INNODB_TRX ORDER BY trx_started;
```

### 3.5 トランザクション・undo・MVCC

#### 長トランザクション（本番キラー）

被害の連鎖：**長トランザクション → undo 版がパージ不能 → history list 増加 → テーブル/インデックス膨張 → バックテーブル走査の低速化 → 全般的な遅延**。

```sql
-- 30 秒以上稼働しているトランザクション
SELECT trx_id, trx_started, trx_state,
       TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_sec,
       trx_query
FROM information_schema.INNODB_TRX
WHERE TIMESTAMPDIFF(SECOND, trx_started, NOW()) > 30
ORDER BY trx_started;
```

#### undo 膨張 / パージ遅延

```sql
SHOW ENGINE INNODB STATUS \G
-- TRANSACTIONS セクションの History list length を確認
-- 伸び続けるならパージが追いついていない（多くは長トランザクションが原因）
```

### 3.6 メモリと Buffer Pool（コアケース章）

> 本書最重要パート。実インシデントを基にする：業務テーブルが遅くなり、Buffer Pool が飽和し、セマフォ待機が急上昇——根本原因は**「メモリボトルネックによるインデックス破綻」**。

#### 重要ステップ——Buffer Pool は満杯か？

```sql
SHOW ENGINE INNODB STATUS \G
```

注目ポイント：

- **`Free buffers`** — `< 100` ならメモリ逼迫。「ページ入れ替え—待機」のデスループに陥っている。
- **`Modified db pages`** — 多ければダーティページが滞留、フラッシュ圧が高い。
- **`OS WAIT ARRAY INFO`** — `reservation count` が百万級に達していたら、スレッドがロック取得で大行列を作っている。

#### メモリ / I/O ボトルネックの証拠チェイン

怪しいクエリの**実行前後**で下記を取得し、差分を確認する。

```sql
-- 1. Buffer Pool の空きページ待ち回数（最重要指標）
--    通常は 0。1 クエリで数十増えればメモリ深刻不足
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free';

-- 2. 物理読込回数（ディスクから）
--    多ければヒット率低下、データがメモリに無い
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';

-- 3. 論理読込リクエスト（メモリから）— ヒット率算出用
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
```

**🔴 判定基準：**

- **ヒット率** = `1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)`。通常 `> 99%`。
  - 注意：比率が高くても安心できない——物理読込の絶対値が急増し `wait_free` を伴っていれば、依然として**容量不足による頻繁ページ退避**が起きている。
- **Wait Free 差分**：1 クエリで `> 0` 増えていれば**ハードメモリボトルネック**確定。

#### ロック競合とセマフォ分析

`SHOW ENGINE INNODB STATUS \G` の `SEMAPHORES` セクションを見る：

- **キーワード**：`buf0buf.cc`——スレッドが Buffer Pool ページの RW ラッチを待機している。
- **意味**：この待機が多発するなら、**ホットなデータページへの並行アクセス**または**メモリページの頻繁な退避**が起きている。本ケースは後者（メモリ満杯 → 頻繁退避 → 頻繁再ロード → 頻繁ラッチ）。

#### ⚠️ 特殊ケース：なぜ `FORCE INDEX` は遅くなるのか？

- **症状**：選択性の高いインデックスを強制した方が、オプティマイザの選択より遅い。
- **根本原因**：メモリ飽和下では、**物理 I/O コスト > CPU フィルタリングコスト**。
  - オプティマイザの選んだインデックスページは、過去の頻繁使用で Buffer Pool に「ホット」状態で残っている。
  - 強制したインデックスのページは退避済み（コールド）の可能性。
  - 強制インデックスにより大量ディスク読込とメモリラッチ待機（`buf0buf.cc`）が発生し、所要時間がかえって増大する。
- **教訓**：メモリボトルネック下では**インデックスを盲目的に強制せず**、オプティマイザの「ホット性」判断を信頼するか、まずメモリを是正すること。

#### 根本原因確認——ワーキングセット見積もり

```sql
-- テーブルの総行数
SELECT COUNT(*) AS total_rows FROM biz_table;

-- 物理サイズ（データ + インデックス）
SELECT TABLE_NAME,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'db_main' AND TABLE_NAME = 'biz_table';

-- WHERE 条件の選択性を確認（フィルタ後件数も多ければインデックス選択性が不足）
SELECT COUNT(*) AS filtered_rows
FROM biz_table
WHERE user_id = 1008611 AND group_id = 'uuid_sample_001';
```

ワーキングセット ≈ `ホットなデータページ数 × 16 KB`。本ケースでは Buffer Pool 約 1.8 GB に対しホットデータがその数倍——「小さな池で大きな魚を釣ろうとして、水を何度も入れ替える」状態になっていた。

### 3.7 I/O ボトルネック

```bash
# システムレベルでディスクを確認
iostat -xm 1
# 注視：%util（100% 近い = 飽和）、await（待機時間）、r/s w/s
```

| チューニング項目 | 効果 |
|---|---|
| `innodb_io_capacity` / `innodb_io_capacity_max` | ダーティページフラッシュ速度（SSD：2000 / 4000+） |
| `innodb_flush_neighbors` | SSD：0（隣接フラッシュ無効） |
| `innodb_flush_log_at_trx_commit` | `1` = 最高耐久性、`2` / `0` = 性能向上だがデータ損失リスクあり |
| `sync_binlog` | 上記と組み合わせて「ダブル 1」トレードオフ |

### 3.8 CPU ボトルネック

CPU 急上昇はほぼ次の 3 種類：

1. **インデックス無しの全表スキャンが大量発生** — スローログとインデックス章を参照。
2. **ソート/集約による一時テーブル溢出** — 次節を参照。
3. **QPS が純粋に高い** — キャッシュ / 読み書き分離を検討。

```sql
-- CPU を最も消費している SQL（走査行数 + ソート）
SELECT digest_text, count_star, sum_rows_examined, sum_sort_rows
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_sort_rows DESC LIMIT 10;
```

### 3.9 一時テーブルとソート

```sql
SHOW STATUS LIKE 'Created_tmp%';
-- Created_tmp_disk_tables が増え続ける = 一時テーブルがディスクに溢出（非常に遅い）
```

| シナリオ | EXPLAIN シグナル | 対策 |
|---|---|---|
| ソートがディスクへ | `Extra: Using filesort` | ORDER BY を覆うインデックス作成、`sort_buffer_size` 調整 |
| 一時テーブルがディスクへ | `Extra: Using temporary` | GROUP BY / DISTINCT 最適化、`tmp_table_size` 調整 |

```sql
SHOW VARIABLES LIKE 'tmp_table_size';
SHOW VARIABLES LIKE 'max_heap_table_size';
-- 2 つの小さい方がメモリ一時テーブル上限
```

### 3.10 レプリケーション問題（スレーブ遅延）

```sql
SHOW REPLICA STATUS \G   -- MySQL 8.0（5.7 は SHOW SLAVE STATUS）
-- 主要項目：
--   Seconds_Behind_Master    -- 遅延秒数
--   Slave_IO_Running         -- Yes 必須
--   Slave_SQL_Running        -- Yes 必須
--   Last_Error / Executed_Gtid_Set
```

| 原因 | 対策 |
|---|---|
| マスターの巨大トランザクション / 大規模 DDL | トランザクション分割、DDL は `pt-online-schema-change` |
| シングルスレッド適用（5.7） | バージョンアップ or `slave_parallel_workers` 有効化 |
| スレーブがマスターより弱い | 増強 / スレーブ負荷軽減 |
| スレーブのインデックス欠落で適用遅延 | スレーブ側のインデックス監査 |
| ネットワーク揺らぎ | 帯域確認、`binlog_transaction_dependency` |

### 3.11 統計情報とオプティマイザ

統計情報の陳腐化は、オプティマイザのインデックス選択ミス（行数推定の大幅な誤り）を引き起こす。

```sql
-- 統計情報の手動リフレッシュ
ANALYZE TABLE biz_table;

-- ヒストグラム（8.0）：データ分布の偏りに特に有効
ANALYZE TABLE t UPDATE HISTOGRAM ON status WITH 100 BUCKETS;

-- オプティマイザの意思決定過程をトレース
SET optimizer_trace = 'enabled=on';
SELECT ...;
SELECT * FROM information_schema.OPTIMIZER_TRACE \G
```

---

## 第 4 部：最適化プレイブック（症状別処方）

### 4.1 アーキテクチャ & 設定（根本治療）

`Innodb_buffer_pool_wait_free > 0` かつ `Free buffers ≈ 0` という状況下では、これは**ハードウェアリソースのボトルネックであり、SQL チューニングだけでは完全には解決できない**。

1. **Buffer Pool の拡大（最優先）**
   - `innodb_buffer_pool_size` を物理メモリの 50%–70% に設定。16 GB サーバなら MySQL に最低 8–10 GB を割り当てる。
   - 期待効果：`wait_free` 解消、物理読込削減、`buf0buf.cc` 待機解消。
2. **ダーティページフラッシュ戦略の調整**（`Modified db pages` が多い場合）
   - `innodb_max_dirty_pages_pct_lwm`：10–20 に設定し、フラッシュを平滑化して I/O スパイクを避ける。
   - `innodb_io_capacity`：ディスク性能に合わせる（SSD：2000+）。
3. **読み書き分離**：統計系や重い `COUNT` クエリを読み取り専用スレーブへルーティングし、マスターのトランザクションコミットを絶対にブロックしない。

### 4.2 SQL & インデックス調整（対症療法）

メモリ拡張を待つ間の妥協策：

1. **カバリングインデックス**：クエリが `count` のみ必要なら、カバリングインデックスを作成してバックテーブル参照を回避。注意点：大きなインデックスはメモリ負荷を悪化させる。既にメモリが満杯なら、まずアーカイブを優先。
2. **データアーカイブ**：`create_time` 等でパーティショニングするか、コールド行を `biz_table_history` へ移し、ホットセットを Buffer Pool に収まるよう縮小。
3. **キャッシュ層の導入（Redis）**：`user_id + group_id` のような固定次元結果は、Redis に短い TTL（例：5 分）で書き込み、アプリ層は先にキャッシュを読む。これだけでデータベース圧の 90% 以上を削減可能。

### 4.3 モニタリング & アラート

下記を Prometheus / Zabbix に配線する：

1. `Innodb_buffer_pool_wait_free > 0`（1 分継続でアラート）
2. `Innodb_buffer_pool_pages_free < 100`
3. `Semaphore waits`（`SHOW ENGINE INNODB STATUS` から解析）の増加率過大
4. `Buffer Pool Hit Rate < 99%`

---

## 第 5 部：症状別クイックディシジョンツリー

以下の症状が出たら、対応する節へ直行：

```
データベース全体がカックカク、CPU/IO がスパイク
  └─ まず SHOW PROCESSLIST
       ├─ 多数のクエリ停止、状態バラバラ   → スロークエリ (3.2) / インデックス (3.3)
       ├─ Waiting for lock 多数           → ロック (3.4)
       ├─ Waiting for metadata lock 多数  → MDL (3.4) + 長トランザクション (3.5)
       └─ Sleep 多数                      → 接続リーク (3.1)

特定の SQL のみ突然遅化
  ├─ EXPLAIN で実行計画変化？            → 統計情報 (3.11)
  ├─ wait_free > 0                       → メモリボトルネック (3.6)
  └─ 分離レベル/データ量変化            → トランザクション/MVCC (3.5)

周期的・間欠的なストール
  ├─ ダーティページフラッシュ/checkpoint → I/O (3.7)
  ├─ undo パージ遅延                    → トランザクション (3.5)
  └─ 定时重いジョブ                     → アプリ層を調査

スレーブ遅延アラート
  └─ SHOW REPLICA STATUS                → レプリケーション (3.10)
```

---

## 付録 A：コマンド早見表（チートシート）

| 観点 | コマンド/指標 | 正常参考値 | 異常の意味 |
|---|---|---|---|
| メモリ余裕 | `SHOW ENGINE INNODB STATUS` → `Free buffers` | `> 1000` | プール満杯、拡張必須 |
| メモリ待機 | `Innodb_buffer_pool_wait_free` | **0** | `> 0` = メモリ逼迫、スレッドがサスペンド |
| ディスク圧力 | `Innodb_buffer_pool_reads` | 低 | 多 = メモリに無いデータが多い、ディスク読込多発 |
| ロック競合 | `SHOW ENGINE INNODB STATUS` → `semaphore waits` | 低 | `buf0buf.cc` 多 = ページラッチ競合 |
| ダーティページ | `SHOW ENGINE INNODB STATUS` → `Modified db pages` | 安定 | 多すぎ = フラッシュ遅延、I/O ジッタリスク |
| インデックス効率 | `EXPLAIN` → `type` | `ref` / `range` | `ALL` = 全表スキャン |
| インデックス効率 | `EXPLAIN` → `Extra` | `NULL` / `Using index` | `Using filesort` / `Using temporary` = 調整必要 |
| 行ロック待機 | `Innodb_row_lock_waits` | 低 | 多 = ロック競合 |
| 一時テーブル | `Created_tmp_disk_tables` | 安定 | 増加 = ソート/集約のチューニング必要 |

## 付録 B：ツールボックス

| ツール | 用途 |
|---|---|
| `SHOW ENGINE INNODB STATUS \G` | InnoDB ワンストップ健康診断（ロック/トランザクション/I/O/セマフォ） |
| `sys` スキーマ | `sys.innodb_lock_waits` など、生テーブルを人間語に翻訳するビュー |
| `performance_schema` | 待機イベント、文ダイジェスト、ロックのフルスタック |
| `EXPLAIN ANALYZE` (8.0) | 実実行コスト |
| `pt-query-digest` | スローログ集約 |
| `pt-online-schema-change` | オンライン DDL |
| `pt-deadlock-logger` | デッドロック常時収集 |
| `mysqldumpslow` | 軽量スローログ分析 |

---

## 💡 最終推奨事項（タイムライン別）

**短期（1 時間以内）：**

- **`FORCE INDEX` を試みない**——メモリ競合を悪化させる。
- 該当エンドポイントに **Redis キャッシュ** を追加——最速の打ち手。
- 他の重いクエリが Buffer Pool を奪っていないか確認し、必要ならスロットリング。

**中期（1 日以内）：**

- **メモリ増強が根本解決**。`innodb_buffer_pool_size` をホストが許容する最大安全値まで引き上げる。
- **コールドデータのアーカイブ**——ワーキングセットを縮小。

**長期：**

- スロークエリとリソースのモニタリング/アラートを整備。
- 分析系ワークロードを Elasticsearch や ClickHouse など OLAP エンジンへ移行することを検討（OLTP の MySQL で複雑な集約をしない）。

---

**結論**：データベースが遅い原因は、多くの場合**「SQL がまずい」ではなく「小馬に大きすぎる荷を引かせている」**ことにある。メモリ（Buffer Pool）がアクティブワーキングセットに対して小さすぎるため、データベースは「計算」に時間を使うのではなく、「データ移送」と「ロック待ち行列」に時間を費やす。**メモリ増強 + キャッシュ導入が最善の解決策**。SQL チューニングは、その天井を引き上げる前の限られたレバーに過ぎない。