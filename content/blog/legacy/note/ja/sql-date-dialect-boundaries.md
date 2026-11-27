---
{
  "archiveId": "X-1305",
  "title": "SQL 日付式の方言境界：Spark SQL・Oracle・MySQL",
  "en": "ENGINEERING NOTES",
  "category": "系统运维",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Spark SQL・Oracle・MySQL における月の加減算、切り捨て、書式トークン、年またぎ境界を整理し、方言を先に特定する確認順を定義する。",
  "findings": [
    "ネイティブ wiki ページ: content/blog/legacy/note/ja/sql-date-dialect-boundaries.md",
    "出典スナップショット: database-written-test-review",
    "証拠の状態: 暫定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/database-written-test-review.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "SQL",
    "Spark SQL",
    "Oracle",
    "MySQL",
    "Datetime",
    "ja",
    "note"
  ],
  "draft": false,
  "lang": "ja",
  "translationKey": "legacy/note/sql-date-dialect-boundaries",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "database-written-test-review"
  ],
  "related": [
    "database-written-test-review"
  ]
}
---

同じ式に `date_format`・`trunc`・`add_months` が並んでいても、関数名だけで「異なる DB 方言の混用」と断定してはならない。確認順序は、**エンジン方言を特定し、関数仕様と書式トークンを照合し、1 月の年またぎ境界で結果を検証する**である。

## 同一意図の三方言対照

要件：**前月が属する 4 桁の年**を取得する。

| エンジン | 月の加減算 | 月初切り捨て | 年の書式トークン | 文書基準 |
| --- | --- | --- | --- | --- |
| Spark SQL | `add_months(current_date(), -1)` | `trunc(..., 'MM')` | `date_format(..., 'yyyy')` | Spark 3.5.7 |
| Oracle | `ADD_MONTHS(CURRENT_DATE, -1)` | `TRUNC(..., 'MM')` | `TO_CHAR(..., 'YYYY')` | Oracle 19c |
| MySQL | `DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)` | 年だけなら省略可 | `DATE_FORMAT(..., '%Y')` | MySQL 8.4 |

### Spark SQL

Spark SQL では `date_format`・`trunc`・`add_months` を合法的に組み合わせられる：

```sql
-- Spark SQL
SELECT date_format(
    trunc(add_months(current_date(), -1), 'MM'),
    'yyyy'
) AS previous_month_year;
```

現在日付を取得し、1 か月前へ移動し、月初へ切り捨て、4 桁の年文字列へ整形する。結果は「常に今年」ではなく**前月が属する年**であり、1 月に実行すると前年になる。

### Oracle

Oracle は類似の月演算と切り捨て関数を持つが、整形は `TO_CHAR` を使い `FROM dual` を指定する：

```sql
-- Oracle
SELECT TO_CHAR(
    TRUNC(ADD_MONTHS(CURRENT_DATE, -1), 'MM'),
    'YYYY'
) AS previous_month_year
FROM dual;
```

### MySQL

MySQL は Spark/Oracle の `yyyy` や `YYYY` をそのまま流用できず、`%Y` を用いる。年だけを取り出す場合は月初切り捨ても不要である：

```sql
-- MySQL
SELECT DATE_FORMAT(
    DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH),
    '%Y'
) AS previous_month_year;
```

## 確認順序と年またぎ反例

日付式は次の 4 段階で検証する：

1. **エンジン確認**：Spark SQL・Oracle・MySQL のいずれかと版を固定する。
2. **関数と書式トークンの照合**：`yyyy`・`YYYY`・`%Y` を区別し、書式文字列を他方言から流用しない。
3. **戻り値型の確認**：日付型と整形済み文字列型を区別する。
4. **年またぎ・月末境界の検証**：1 月を最小の反例として前年へ跨ぐか確認する。

## 証拠の境界と未検証項目

- **出典の事実**：本ページは [データベース筆記試験の復盤](/blog/legacy/note/ja/database-written-test-review/) 第 5 節から分離され、`database-written-test-review` スナップショット記載の Spark 3.5.7・Oracle 19c・MySQL 8.4 公式文書を根拠とする。
- **未検証項目**：今回の作業では Spark 3.5.7・Oracle 19c・MySQL 8.4 実機での実行は行っておらず、年またぎ・月末（3 月 31 日の 1 か月前など）・不正書式トークンの実出力と戻り値型は未実測である。

## 昇格チェック

- 固定版の Spark 3.5.7・Oracle 19c・MySQL 8.4 上で上記 3 式を実行して出力を記録する
- 1 月の年またぎおよび月末境界の対照データと戻り値型を検証する
- 誤った書式トークン（MySQL への `yyyy`/`YYYY` 指定など）の挙動を確認し、親ページとの双方向リンクを維持する
