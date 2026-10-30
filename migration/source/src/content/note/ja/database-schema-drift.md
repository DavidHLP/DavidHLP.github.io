---
title: "データベース Schema ドリフト：history、schema、query の三ビューで特定する"
timestamp: 2026-08-13 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: active
draft: true
sources: ["database-schema-drift-contract"]
related: ["mysql-performance-troubleshooting", "multi-service-readiness", "microservice-data-ownership"]
tags: ["Flyway", "MySQL", "Schema Drift", "Migration", "Database", "Troubleshooting"]
description: "Flyway validate が実際の Schema チェックの代わりにならない理由と、migration history、実際の schema、アプリ query の三ビューで checksum ドリフト、外部 DDL、Unknown column、失敗した migration の残骸を区別する方法を説明する。"
toc: true
---

**結論を先に**：Flyway Community の `validate` が比較するのは「適用済み migration history」と「ローカルで解決できる migration」であり、「実際の database schema」と「期待 schema」ではない。`Unknown column`、列の重複追加、migration 失敗に遭遇した場合は、history、schema、query の三ビューを必ず同時に確認すること。`repair` だけを実行しても history テーブルの整合性は回復するかもしれないが、DDL を再生・取り消し・クリーンアップすることはない。

## 適用バージョンと証拠の強度

このページは Flyway `13.2.0`（tag `flyway-13.2.0`、commit `5c5d90da`）と公式 `mysql:8.4` イメージ内の MySQL `8.4.11` に固定する。

- Flyway のセマンティクスは公式ドキュメントと固定ソースによる。今回のバッチでは Flyway CLI の実行に成功しなかったため、具体的な CLI 出力は検証済み事実として扱わない。
- MySQL の `1060`、`1054`、`1091`、単一の複数句 `ALTER TABLE` の原子ロールバック、外部 DDL ドリフトは、使い捨てコンテナで実測した。
- 他の Flyway/MySQL のメジャーバージョン、ストレージエンジン、レプリケーショントポロジは再検証が必要。

## 三ビューは互いに代替できない

| ビュー            | 答える質問                                                        | 最小チェック                                              | 見えないもの                         |
| ----------------- | ----------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| migration history | どの migration が適用済み・失敗・欠落・乱順として記録されているか | `flyway info`、`flyway validate`、schema history table    | Flyway を経ない外部 DDL              |
| actual schema     | 現在のテーブル・列・インデックスは実際に何か                      | `SHOW CREATE TABLE`、`SHOW COLUMNS`、`information_schema` | アプリコードが実際に参照しているもの |
| application query | 失敗 SQL はどのオブジェクトをどの句で参照しているか               | 最小再現 SQL、エラーコードと SQLSTATE                     | オブジェクトが現在の状態になった理由 |

したがって：`validate` が通っても schema ドリフトがないことは証明できない。schema に列が存在しても、すべてのアプリインスタンスの query と serializer がアップグレード済みとは証明できない。query のエラーも、それだけで migration が未実行であることを直接証明できない。

## Flyway の本当の境界

### `validate`

`validate` は適用済み migration とローカルで解決された migration を比較する。名前・タイプ・checksum の違い、適用済み migration がローカルで消えている、またはローカル migration がまだ適用されていない場合に失敗する。SQL migration の checksum は CRC32 を使用する。

固定ソースの `DbValidate` は `MigrationInfoService` 経由で history と resolved migrations を検査し、ユーザーテーブルの構造は読まない。そのため外部で：

```sql
ALTER TABLE users ADD COLUMN ext_drift INT;
```

を実行しても、実際の schema は変わるが migration history は生成されない。Community の `validate` はこれだけでは drift を自動報告しない。公式の schema snapshot/drift analysis は Enterprise の能力だ。

### `repair`

`repair` は失敗レコードの削除、checksum/description/type の整合、欠落 migration の deleted マークができる。ただし history しか直さない：

- migration を再実行しない；
- 実行済み DDL を取り消さない；
- 失敗 migration が残したオブジェクトを削除しない；
- MySQL が DDL transaction を提供しない場合、人手での確認とクリーンアップが引き続き必要。

したがって `repair` をロールバック扱いにしてはいけない。まず実際の schema と目標状態を確認し、その上で元の migration を復元するか、前方修復 migration を書くか、制御されたウィンドウで手動クリーンアップするかを決める。

### `outOfOrder`

`outOfOrder` のデフォルトは `false`。例えば `1.0` と `3.0` が適用済みで、後から `2.0` が現れた場合、これを有効にして初めて実行され `Out of Order` と記録される。「ゼロからの再現」と「既存環境の段階的アップグレード」で異なる結果になり得るため、空 DB とアップグレード済み DB の両方で先に検証すること。

## エラーコードはまず SQL コンテキストで振り分ける

MySQL 8.4.11 の最小実験の結果：

| 現象                                    | エラー                                            | 意味                                                     |
| --------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 再度 `ADD COLUMN email`                 | `1060 (42S21) Duplicate column name`              | migration が二重実行された、または列が外部操作で作成済み |
| `SELECT no_such_col ...`                | `1054 (42S22) Unknown column ... in 'field list'` | 存在しない列を query が参照                              |
| `DROP COLUMN no_such_col`               | `1091 (42000) Can't DROP ...`                     | DROP 対象が存在しない。1054 ではない                     |
| 1 つの `ALTER TABLE` の後続句が列を重複 | `1060`、文全体がロールバック                      | 同一 InnoDB DDL 文は原子                                 |

「単一 DDL が原子」は「migration ファイルがトランザクション化される」を意味しない。MySQL の DDL は暗黙コミットする：同じ migration ファイル内の最初の DDL が成功し二番目が失敗した場合、最初の DDL は残る可能性があり、Flyway history は失敗を記録する。このとき `repair` で失敗レコードを削除しても、最初の文が残したオブジェクトはクリーンアップされない。

## 最小診断の順序

1. **失敗 SQL とエラーコードを固定する**：SELECT・ADD・DROP を区別し、すべての「列問題」を 1054 に分類しない。
2. **history を見る**：version、success、checksum、description、state を確認する。`validate` は migration history の整合性だけを判定する。
3. **actual schema を見る**：`SHOW CREATE TABLE`/`SHOW COLUMNS` で列・インデックス・制約を照合し、history の外の変化を探す。
4. **migration ファイルと照合する**：同一バージョンが書き換えられたか、欠落、乱順、または非トランザクション DDL を複数含むかを確認する。
5. **前方修復を選ぶ**：本番では新しい migration を追加して実状態を唯一の目標に進めるのが優先。履歴レコード自体が誤りと確認できた場合だけ `repair` を実行する。
6. **二経路で検証する**：空 DB でゼロから一度 migration、既存 DB を現バージョンから一度アップグレードし、その後アプリの最小 query を実行する。

## 最小 MySQL 再現

以下は使い捨てのローカルコンテナ専用。`TEMP_PASSWORD` を実環境に使い回さないこと：

```bash
docker run -d --name schema-drift-mysql \
  -e MYSQL_ROOT_PASSWORD=TEMP_PASSWORD \
  -e MYSQL_DATABASE=driftdb mysql:8.4

# コンテナ内の mysqld が実際に接続を受け付けるまで待つ。docker run -d は起動を証明するだけである。
until docker exec -e MYSQL_PWD=TEMP_PASSWORD schema-drift-mysql \
  mysqladmin -uroot ping --silent; do sleep 1; done

docker exec -e MYSQL_PWD=TEMP_PASSWORD schema-drift-mysql \
  mysql -uroot driftdb -e \
  "CREATE TABLE users (id BIGINT PRIMARY KEY); ALTER TABLE users ADD COLUMN email VARCHAR(100);"

docker exec -e MYSQL_PWD=TEMP_PASSWORD schema-drift-mysql \
  mysql -uroot driftdb -e \
  "ALTER TABLE users ADD COLUMN c2 INT, ADD COLUMN email INT; SHOW COLUMNS FROM users;"

docker rm -f schema-drift-mysql
```

2 番目のコマンドの重複列は `1060` を報告し、`c2` は列リストにないことが期待される。この実験は MySQL 側の挙動だけを証明する。Flyway の挙動は、対象バージョンの隔離 DB で `info`、`validate`、`migrate` を別途実行すべきだ。

## 証拠と不確実性

- **情報源の事実**：`database-schema-drift-contract` は Flyway のドキュメント/ソースと MySQL 8.4.11 の実験に固定し、validate/repair/outOfOrder の境界とエラーコード行列を支える。
- **本ページの総合**：migration history、actual schema、application query を三ビュー診断法として整理し、前方修復の順序を示す。
- **未確認**：今回のバッチでは Flyway CLI を実走していない。duplicate-version の具体的なエラーテキスト、パーティション/外部キー/レプリケーションのシナリオ、他のストレージエンジン、他のメジャーバージョンは未検証。

## 関連ページ

- [MySQL 性能トラブルシューティング：現象→指標→特定層→安全な緩和](/ja/note/mysql-performance-troubleshooting)
- [マルチサービス起動レディネス：running、ready、依存の伝播](/ja/note/multi-service-readiness)
