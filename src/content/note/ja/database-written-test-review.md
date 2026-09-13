---
title: "データベース筆記試験の復盤：SQL セマンティクスからバッチ処理まで"
timestamp: 2026-09-13 00:00:00+08:00
series: "データベースとデータエンジニアリング"
kind: synthesis
status: provisional
sources: ["database-written-test-review"]
related: ["mysql-performance-troubleshooting", "mysql-storage-and-deadlock", "database-schema-drift", "spark-bigdata-ecosystem"]
tags: [数据库, SQL, Oracle, MySQL, Spark SQL, Kettle, ETL, 笔试复盘]
description: "データベース筆記試験を検証可能な判断の連鎖として復盤する。SQL の意味と方言を分け、NULL・重複・空結果を扱い、最後に Kettle と巨大テーブルの操作を分割・復旧・照合・リスク管理へ落とし込む。"
toc: true
---

データベースの筆記試験を復盤すると、答えの一覧は残りやすい一方、その答えが成立する条件は失われやすい。結合でどの行を残すのか、NULL が式にどう参加するのか、その式がどの SQL 方言に属するのか、そしてデータ量が増えたときにコストを抑え、結果を検証し、失敗から復旧するにはどうするのか、という条件である。

ここでは問題番号ごとに答えを書き写さず、ひとつの判断の連鎖に組み直す。**まず意味を復元し、次に方言を確認し、NULL と境界条件を補い、最後に実行コスト・復旧・照合を考える。** Oracle 固有の構文は個別に説明し、4 表の練習問題と巨大テーブルの操作は **MySQL 8.4 / InnoDB** を前提にする。日付式は Spark SQL、Oracle、MySQL を分けて扱う。

## 復盤の枠組み：1 問につき少なくとも 4 つ答える

一見正しそうな SQL でも、最低限次を答えられなければならない。

1. **意味**：どの行を残し、何を比較または変更するのか。
2. **方言**：その関数、日付書式、更新制約はどのデータベースまたはツールのどのバージョンに属するのか。
3. **境界**：NULL、空結果、重複、年またぎ、同時実行ではどうなるのか。
4. **実行**：データが大きくなったりタスクが失敗したりしたとき、コストを制限し、再開し、完全性を証明するにはどうするのか。

この 4 つの問いが、基礎概念がバッチ処理や巨大テーブルへ自然につながる理由でもある。前者は意味を問うが、後者は現実の制約の中でその意味を実現できるかを問う。

## 1. 基礎：概念を正しい層に戻す

### SELECT が参照できるオブジェクト

Oracle では、表とビューを問い合わせのデータ源にでき、シーケンスは NEXTVAL や CURRVAL のような疑似列を通じて式に参加できる。インデックスはデータアクセスを助ける構造であり、通常の表やビューのように名前を FROM の直後へ置いてデータ源にするものではない。[^1][^2]

したがって「表、シーケンス、インデックス、ビュー」から選ぶ問題では、通常は **インデックス** が答えになる。「データベースが検索実行時にインデックスを利用する」ことと、「問い合わせがインデックスを業務データ源として扱う」ことは別である。

### ABS(-45) が -45 にならない理由

絶対値と丸めは別の操作である。整数 -45 に対して、切り上げ、切り下げ、整数位への丸めは値を変えないが、絶対値は符号を取り除く。[^3][^4][^5][^6]

| 式 | 結果 | 意味 |
| --- | ---: | --- |
| ABS(-45) | 45 | 絶対値 |
| CEIL(-45) | -45 | 切り上げ |
| FLOOR(-45) | -45 | 切り下げ |
| ROUND(-45) | -45 | 整数位への丸め |

### データベース、DBMS、表構造の変更

データベースは整理されたデータの集合である。データベース管理システム、つまり **DBMS** は、データの保存・構成・アクセスを管理する。「データベースシステムの中核ソフトウェア」を問われたら、データファイルやクライアントツールではなく DBMS と答える。[^7]

既存表の構造を変更するには ALTER TABLE を使う。次の MySQL 文は列を追加するもので、既存行の値を更新するものではない。[^8]

    ALTER TABLE student
    ADD COLUMN email VARCHAR(254);

これらは単なる用語問題に見えるが、実際にはオブジェクトの境界を問うている。データ集合、管理ソフトウェア、アクセス構造、DDL 操作は互いに代替できない。

## 2. 結合：残す行を決めてから、マッチ条件を決める

結合問題では、**どの行を残すか、何を一致とするか** を分けて考える。内部結合は条件を満たす組だけを残し、左外部結合は左表のすべての行を残し、右外部結合は右表のすべての行を残す。外部結合で片側に一致がなければ、反対側には NULL が補われる。[^9]

「外部結合は必ず等値結合である」という理解は誤りである。等値・大小比較・範囲一致は結合条件の話であり、内部結合・外部結合は結果の保持規則の話である。外部結合でも非等値条件を使える。[^9]

例えば、C002 の成績記録がない学生も含め、全学生とその C002 の成績を表示する場合は次のようになる。

    SELECT s.sno, r.score
    FROM student AS s
    LEFT JOIN sc AS r
      ON r.sno = s.sno
     AND r.cno = 'C002';

科目条件を ON に置くことで、マッチできる成績行だけを制限している。これを WHERE r.cno = 'C002' に移すと、右側が NULL になる学生が除外され、「全学生を残す」という目的を達成できない。[^10]

外部結合を見たら、私はまず「絶対にマッチしない行」を 1 行作り、後続のフィルタで消えないかを追跡する。この反例は LEFT JOIN の定義を暗記するより安全である。

## 3. カーソル、型、制約：状態・格納・正当性を混同しない

### Oracle カーソル：結果集合を開くことと行を取得することは違う

次は自己完結した PL/SQL の例である。

    DECLARE
        CURSOR c_demo IS
            SELECT 1 AS n FROM dual;
    BEGIN
        OPEN c_demo;
        DBMS_OUTPUT.PUT_LINE(c_demo%ROWCOUNT);
        CLOSE c_demo;
    END;
    /

明示カーソルの意味に従えば、出力は **0** であり 1 ではない。ROWCOUNT は結果集合全体の行数ではなく、すでに FETCH した行数を表す。OPEN 直後で最初の FETCH 前なら 0 であり、取得に成功してから増える。[^11]

重要なのは、元表の行数だけから実行結果を推測しないことだ。OPEN → FETCH → CLOSE の状態遷移に沿って考える。この 0 は公式の意味から導いた期待値であり、実際の本番ログではない。

### CHAR と VARCHAR

MySQL では、CHAR は固定長文字の意味を、VARCHAR は可変長文字の意味を表す。宣言した長さは主に文字数であり、固定バイト数を保証するものではない。文字セット、実データ、格納方式も使用領域に影響し、末尾空白の扱いにも違いがある。[^12]

型はデータの特徴から選ぶ。固定長コードなら CHAR、長さが大きく変わる名称やタイトルなら VARCHAR が候補になるが、「CHAR は常に速い」とは言えない。増加し続ける本文なら、上限を評価したうえで TEXT や MEDIUMTEXT などを検討し、VARCHAR を無限長文字列とみなしてはいけない。[^12][^13]

### DEFAULT は完全性制約ではない

一般的な完全性規則には、レコードを識別する PRIMARY KEY、参照関係を表す FOREIGN KEY、重複を制限する UNIQUE、NULL を禁止する NOT NULL、条件を検査する CHECK がある。MySQL の表定義で DEFAULT はデフォルト値を定めるものであり、これらの規則と混同してはいけない。[^14]

例えば次の列定義には異なる役割がある。

    status VARCHAR(16) NOT NULL DEFAULT 'PENDING'

DEFAULT 'PENDING' はデフォルト時に何を入れるかを決め、NOT NULL は NULL の格納を禁止する。DEFAULT だけでは、状態値をいくつかの業務上の値に制限できない。[^14]

また「SQL の制約は 5 種類だけ」という言い方も、すべてのデータベースに対しては厳密ではない。Oracle にはオブジェクト関係の場面で使う REF 制約もある。制約の種類を答えるときは、対象のデータベースと議論の範囲を明示する必要がある。[^15]

## 4. インデックスと集合演算：性能の結論には問い合わせ条件が必要

### どの列がインデックス候補になるか

WHERE、JOIN、ORDER BY、GROUP BY によく現れることは観察の出発点にすぎない。そのような列すべてに単独インデックスを作るべきだとは言えない。問い合わせの組み合わせ、選択性、返却行数、複合インデックスの順序、書き込み保守コストも関係する。[^16][^2]

例えば次の問い合わせを考える。

    SELECT order_id, created_at
    FROM orders
    WHERE user_id = 1001
      AND status = 'PAID'
    ORDER BY created_at DESC
    LIMIT 20;

(user_id, status, created_at) は複合インデックスの候補になり得るが、ほかの問い合わせと実行計画を合わせて検証しなければならない。複合インデックスの先頭列は対応できる問い合わせを左右するため、実際の負荷から切り離して順番を決めることはできない。[^17]

したがって、より完全な回答はこうなる。**頻出 SQL から候補を出し、実行計画と実測で検証し、読み取りの効果と書き込みコストを比較する。** 実行計画、データ分布、書き込み負荷がなければ、インデックスの助言を普遍的な結論にしてはいけない。

### UNION と UNION ALL

UNION はデフォルトで結果行を重複排除し、UNION ALL は重複を残す。重複排除の単位は**投影された行全体**であり、1 つの列だけではない。結果が (sno, cno) なら、同じ学生でも異なる科目の 2 行は重複ではない。[^18]

重複排除が不要なら UNION ALL を優先し、無意味な処理を避けられる。ただし、どの問い合わせでも決まった倍率で速くなるとは約束できない。どちらも最終的な ORDER BY の代わりにはならないため、表示順が必要なら明示的に並べ替える。[^18]

## 5. 日付式：結果を計算する前に方言を認識する

date_format、trunc、add_months が同じ式に現れても、名前だけで「方言が混ざっている」と判断してはいけない。Spark SQL では、これらの関数を合法的に組み合わせられる。[^19]

    -- Spark SQL
    SELECT date_format(
        trunc(add_months(current_date(), -1), 'MM'),
        'yyyy'
    ) AS previous_month_year;

処理は、現在日付を取得し、1 か月戻し、その月の 1 日へ切り捨て、4 桁の年文字列にする、という順序である。結果は**前月が属する年**であり、「常に今年」ではない。現在が 1 月なら前年になり、それ以外の月では通常は当年になる。[^19][^20]

同じ意図を Oracle で書くと次のようになる。

    -- Oracle
    SELECT TO_CHAR(
        TRUNC(ADD_MONTHS(CURRENT_DATE, -1), 'MM'),
        'YYYY'
    ) AS previous_month_year
    FROM dual;

ここでは Oracle の月計算、日付切り捨て、書式化関数を使っている。[^21][^22][^23]

MySQL で年だけを取り出すなら、月初まで切り捨てる必要はない。

    -- MySQL
    SELECT DATE_FORMAT(
        DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH),
        '%Y'
    ) AS previous_month_year;

MySQL の日付書式は %Y を使う。別のエンジンの yyyy や YYYY をそのまま移植してはいけない。[^24]

確認の順番は、**エンジンを確認 → 関数と書式を確認 → 戻り値の型を分析 → 年またぎを検証** である。最小の反例として現在日付を 1 月に設定すれば、前年になるかを確認できる。

## 6. 4 表 SQL：正しい検索の後に NULL と重複を処理する

練習では次の教育用テーブルを使う。

    student(sno, sname, sage, ssex)  学生
    course(cno, cname, tno)          科目
    sc(sno, cno, score)              履修と成績
    teacher(tno, tname)              教師

sno、cno、tno はそれぞれ対応する主キー、sc の複合主キーは (sno, cno)、成績は NULL を許す DECIMAL(5, 2) とする。例の科目番号は C001 と C002、教師番号は T001 である。

以下の 4 問は**独立した練習問題**である。データを変更する問題は、それぞれ同じ初期データから始め、前の問題の変更結果を次の入力とみなしてはいけない。

### 1. C001 の成績が C002 より高い学生番号を求める

同じ学生の 2 科目の成績は別々の行にあるため、自己結合で 1 行に並べて比較する。

    SELECT a.sno
    FROM sc AS a
    JOIN sc AS b
      ON b.sno = a.sno
    WHERE a.cno = 'C001'
      AND b.cno = 'C002'
      AND a.score > b.score;

この条件から、両方の科目記録が存在し、最初の成績が厳密に大きい学生だけが選ばれると分かる。どちらかの記録がない、成績が等しい、比較対象が NULL である場合は条件を満たさない。内部結合とフィルタが結果を決める。[^9][^10]

### 2. 平均成績が 60 より大きい学生と平均を求める

    SELECT sno, AVG(score) AS avg_score
    FROM sc
    GROUP BY sno
    HAVING AVG(score) > 60;

AVG(score) はデフォルトで NULL を無視する。欠席、未入力、未履修を自動的に 0 点へ変換するものではない。ある学生の成績がすべて NULL なら平均も NULL であり、60 より大きい条件を通らない。欠席を 0 点とみなすかどうかは、式のデフォルト動作ではなく業務ルールで決める。[^25]

### 3. ある教師が担当する科目の成績を、科目ごとの平均にする

重要なのは「**各科目自身の平均**」である。cno ごとに平均を計算してから対応する科目を更新し、教師の全科目を 1 つの平均へ混ぜてはいけない。

    -- MySQL 8.4
    UPDATE sc AS s
    JOIN course AS c
      ON c.cno = s.cno
    JOIN teacher AS t
      ON t.tno = c.tno
    JOIN (
        SELECT cno, AVG(score) AS avg_score
        FROM sc
        GROUP BY cno
    ) AS a
      ON a.cno = s.cno
    SET s.score = ROUND(a.avg_score, 2)
    WHERE t.tno = 'T001'
      AND a.avg_score IS NOT NULL;

教師番号を使うのは、教師名が必ず一意だという前提を置かないためである。平均が NULL の科目を除外することで、有効な成績がない科目に架空の点数を入れずに済む。

MySQL では、更新対象表をサブクエリ内でも読む場合に追加の制約がある。ここでは派生表に GROUP BY と集約関数があり、派生表のマージを妨げ、マテリアライズされた形で更新に参加させる。これは同一表を読むすべての更新サブクエリへ無条件に適用できるテンプレートではない。[^26][^27]

この書き方では、有効な平均がある科目なら、元々 NULL だった成績も置き換えられる。未入力状態を保持する業務ルールなら、s.score IS NOT NULL を追加する。

### 4. C002 の記録がない学生へ、科目の既存平均で記録を補う

まず「この科目の成績がない」を、**sc にその科目の行が存在しない**という意味に固定する。行は存在するが score IS NULL という場合は別のケースであり、重複行を挿入しないために更新ロジックを使う。

次の例では一時表で科目平均を固定してから、左結合で欠落行を探す。

    -- MySQL 8.4；この練習では同時書き込みがないと仮定
    CREATE TEMPORARY TABLE tmp_review_course_avg AS
    SELECT cno, AVG(score) AS avg_score
    FROM sc
    WHERE cno = 'C002'
    GROUP BY cno;

    INSERT INTO sc (sno, cno, score)
    SELECT stu.sno, a.cno, ROUND(a.avg_score, 2)
    FROM student AS stu
    CROSS JOIN tmp_review_course_avg AS a
    LEFT JOIN sc AS existing
      ON existing.sno = stu.sno
     AND existing.cno = a.cno
    WHERE existing.sno IS NULL
      AND a.avg_score IS NOT NULL;

    DROP TEMPORARY TABLE tmp_review_course_avg;

この書き方は、MySQL の INSERT ... SELECT の境界も避けている。対象表は主問い合わせの FROM に現れてよいが、その問い合わせのサブクエリで直接読むことはできない。そのため、同じ表の平均を求めるサブクエリと同じ表への NOT EXISTS を、確認なしに 1 つの INSERT へ詰め込むべきではない。[^28]

コードからいくつかの結果を導ける。科目の記録がまったくなければ挿入しない。有効な点数がなければ挿入しない。科目行はあるが成績が NULL の学生も重複挿入しない。未知の平均を勝手に 0 点へ置き換えていない。

本番では一貫性と同時実行を別途設計する必要がある。複合主キーは重複行を防ぐが、複数の文に同じスナップショットを自動的に与えるわけではない。競合後のリトライ、トランザクション境界、平均がどの時点のデータを表すかを明確にする必要がある。

## 7. Kettle：スループット調整と大量抽出は別の問題

### 先にボトルネックを特定し、すぐ並列度を上げない

Kettle / Pentaho Data Integration の性能問題では、まずパイプラインを入力・変換・出力に分ける。各ステップの行数、スループット、待ち時間、資源使用量を観察してから、測定されたボトルネックを最適化する。最初からスレッド数や JVM ヒープを増やすより、検証可能な判断になりやすい。

**入力では不要な読み取りを減らす。** 必要な列だけを選び、可能ならフィルタをデータベース側へ押し込む。「入力行ごとにクエリを実行」のような設定が有効になっていないか確認する。不要な場合、一括読み取りが大量の小さなクエリへ変わってしまう。Table Input は SQL パラメータと行単位の実行設定を持つため、タスクの意味と一致させる。[^29]

**変換では 1 行あたりのコストを見る。** 繰り返しの DB 問い合わせ、不要な型変換、複雑なスクリプト、大量ソートを個別に測定する。キャッシュ、遅延変換、ステップの複製は候補になるが、複製前に順序・グループ化・重複排除を壊さないことを確認する。[^30]

**出力ではバッチ送信とトランザクションコミットを区別する。** Table Output の Commit size は、何件の INSERT を累積してからトランザクションをコミットするかを制御する。Use batch update for inserts は INSERT 文をまとめて送る設定であり、同じスイッチではない。ドライバの対応や他のステップ設定にも左右されるため、チェックを入れただけで有効になったと考えず、実際に確認する。[^31]

コミット単位は大きければよいわけではない。スループット、メモリ、失敗後のやり直しコスト、対象 DB の負荷を同時に比べ、1 回だけの最速時間だけを記録しない。

### 大量データを一度に抽出するなら、復旧と照合を優先する

「1 つの変換を速くする」ことは、「信頼できる抽出タスクを設計する」ことの代わりにはならない。大量抽出では境界が明確な分割を使い、各分割の範囲、状態、出力件数、リトライ回数を記録する。1 本の長時間クエリにすべてを背負わせない。

分割は安定した主キー範囲や固定時間窓で設計できるが、端点を明確にし、範囲の重複と漏れを防ぐ必要がある。再起動後は、完了を確認できた位置から続行できなければならない。対象側は一意キー、冪等書き込み、ステージング領域からのマージなどで必要なリトライを受け止める。

ソースデータが変化し続けるなら、どの時点を抽出結果が表すのかを定義する。最大主キーだけを記録しても、古い行の更新や削除は捕捉できず、一貫性スナップショットの代わりにもならない。スナップショットと増分の接続方法を検討し、分割件数、重要な集計値、サンプル内容を検証する。

評価基準は「1 回成功した」ではなく、「中断後に続行でき、繰り返しても結果を汚染せず、最終的にデータの完全性を説明できる」ことである。

## 8. 巨大テーブルの INSERT・UPDATE・DELETE：範囲を狭めてからコストを制御する

数十億行の表に対して、いきなり「シャーディングする」「インデックスを無効にする」とは答えない。まず影響行数、インデックスやパーティションで絞れるか、オフライン処理が許されるか、ソースが書き込み中か、どのようなロールバックと復旧が必要かを確認する。

MySQL / InnoDB では、操作ごとに焦点が異なる。

| 操作 | 検討できる方法 | 主なリスク |
| --- | --- | --- |
| 大量削除 | 範囲を限定した分割削除。削除割合が高い場合は残すデータの再構築も検討 | ロック、ログ、ディスク容量、復旧 |
| 大量更新 | ステージング表で検証し、範囲を限定した結合更新を分割実行 | 一意なマッチ、ロック競合、トランザクションサイズ |
| 大量挿入 | バッチ書き込み、または適切な一括ロード | 制約の正しさ、インデックス保守、対象 DB 負荷 |

実際の条件でこれらを検証する必要がある。MySQL の文書は単一表 DELETE の LIMIT、結合 UPDATE、InnoDB の一括ロードにおけるトランザクションと導入戦略を別々に説明しており、どれも万能な巨大表最適化 SQL ではない。[^32][^26][^33]

削除割合が非常に高いなら、残すデータをコピーして表を切り替える方法が候補になる。ただしこれはデータ移行として扱う。コピー中の書き込み、オブジェクト依存、インデックスと制約、切替時間、チェックサム、ロールバックを処理する必要がある。コピーと改名の文だけでは完全な解決策とは言えない。MySQL の文書も、特定の大量削除では残すデータのコピーと表の切替を選択肢として挙げている。[^32]

TRUNCATE を「より速く、いつでもロールバックできる DELETE」とみなしてはいけない。MySQL の TRUNCATE TABLE は暗黙コミットを行い、通常のトランザクションロールバックで復元できず、WHERE 条件も使えない。表全体を空にして関連制約を満たせる場合に適し、オンライン業務の削除を無条件に置き換えるものではない。[^34]

実行原則は、制御可能な範囲で正しさを検証し、その後にロック待ち、スループット、ログ、レプリケーション負荷を見てバッチサイズを調整することだ。異常があれば、大きなトランザクションで押し切らず、停止または範囲縮小を行う。

## 結論の範囲：この復盤が証明すること、しないこと

### ここで明確になった結論

- 結合の種類と結合条件は別の軸であり、外部結合の保持規則は WHERE で右表を絞ることで静かに変わり得る。
- NULL、空結果、重複、年またぎは直感的な答えを変えるため、推論に含めなければならない。
- SQL 方言は関数、書式、同一表の読み書き制約を決める。Oracle、MySQL、Spark SQL の例を説明なしに交換してはいけない。
- 大量タスクは 1 回完走するだけでなく、境界の非重複、復旧可能性、リトライの制御、結果照合で評価する。

### この記事だけでは証明していないこと

- サンプル SQL は、実環境の実行計画、データ分布、ロック待ち、トランザクション検証の代わりにはならない。
- Kettle のキャッシュ、並列度、ステップ複製、コミット単位は、固定バージョンの PDI と実データでベンチマークしていないため、「何倍速い」とは言えない。
- 巨大テーブルの案は、オンライン複製、切替、ロールバック、外部キーやトリガー、継続書き込みでの停止時間ゼロを証明しない。
- カーソル例の 0 は公式の意味から得た期待値であり、この記事を実行して得たログではない。

### 先に確認が必要な条件

- 「科目成績がない」とは sc の行がないことか、行はあるが score が NULL であることか。前者は INSERT、後者は UPDATE に対応する。
- 業務上 NULL を平均から除外するのか、欠席を 0 点とみなすのか。これは AVG のデフォルト動作に委ねるものではなく業務ルールである。
- 問題の対象は Oracle、MySQL、Spark SQL、Kettle のどれで、正確なバージョンは何か。
- データが継続的に変化しているか、どの時点の一貫性スナップショットが必要か、失敗後にどのリトライと復旧が許されるか。

## 再利用できるチェックリスト：次にデータベース問題へ出会ったら

1. **エンジンとバージョンを固定する**：関数、日付書式、DDL/DML 制約を具体的な方言へ戻す。
2. **結果の境界を描く**：結合条件を書く前に、残すべき行を示す。
3. **反例を作る**：不一致、NULL、空結果、重複行、年またぎを少なくとも 1 回ずつ試す。
4. **欠落と未知を分ける**：行がない、行はあるがフィールドが空、平均値が存在しない、を同じ WHERE で混ぜない。
5. **読み取り・更新・挿入を分けて検証する**：対象表、サブクエリ、一時表、トランザクション境界、冪等性を個別に確認する。
6. **性能の結論には証拠を付ける**：実行計画、選択性、スループット、待ち時間、メモリ、書き込みコストのうち、結論に対応する層を確認する。
7. **大量操作は先に境界を設計する**：重複と漏れをなくし、進捗を記録し、停止・リトライ・冪等性・照合を支える。
8. **証拠のレベルを書く**：公式の意味、例からの推論、実際の実行結果、未検証の仮定を区別する。

今回の復盤を通じて、データベース問題は **意味が正しいか、方言が明確か、実行を制御できるか** の 3 層で見るのが有用だと感じた。正常系の例の外でもなぜ答えが成立するのかを説明できる方が、1 本のクエリを暗記するより価値がある。

## 参考資料

[^1]: Oracle Database 19c SQL Language Reference — Sequence Pseudocolumns. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Sequence-Pseudocolumns.html
[^2]: Oracle Database 19c Concepts — Indexes and Index-Organized Tables. https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/indexes-and-index-organized-tables.html
[^3]: Oracle Database 19c SQL Language Reference — ABS. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ABS.html
[^4]: Oracle Database 19c SQL Language Reference — CEIL. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CEIL.html
[^5]: Oracle Database 19c SQL Language Reference — FLOOR. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/FLOOR.html
[^6]: Oracle Database 19c SQL Language Reference — ROUND (number). https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROUND-number.html
[^7]: Oracle Database 19c Concepts — Introduction to Oracle Database. https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/introduction-to-oracle-database.html
[^8]: MySQL 8.4 Reference Manual — ALTER TABLE Statement. https://dev.mysql.com/doc/refman/8.4/en/alter-table.html
[^9]: Oracle Database 19c SQL Language Reference — Joins. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html
[^10]: MySQL 8.4 Reference Manual — Outer Join Simplification. https://dev.mysql.com/doc/refman/8.4/en/outer-join-simplification.html
[^11]: Oracle AI Database PL/SQL Language Reference — Cursors Overview. https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/cursors-overview.html
[^12]: MySQL 8.4 Reference Manual — The CHAR and VARCHAR Types. https://dev.mysql.com/doc/refman/8.4/en/char.html
[^13]: MySQL 8.4 Reference Manual — The BLOB and TEXT Types. https://dev.mysql.com/doc/refman/8.4/en/blob.html
[^14]: MySQL 8.4 Reference Manual — CREATE TABLE Statement. https://dev.mysql.com/doc/refman/8.4/en/create-table.html
[^15]: Oracle Database 19c SQL Language Reference — constraint. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/constraint.html
[^16]: MySQL 8.4 Reference Manual — How MySQL Uses Indexes. https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html
[^17]: MySQL 8.4 Reference Manual — Multiple-Column Indexes. https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html
[^18]: MySQL 8.4 Reference Manual — Set Operations with UNION, INTERSECT, and EXCEPT. https://dev.mysql.com/doc/refman/8.4/en/set-operations.html
[^19]: Apache Spark 3.5.7 — Built-in Functions. https://spark.apache.org/docs/3.5.7/api/sql/index.html
[^20]: Apache Spark 3.5.7 — Datetime Patterns. https://spark.apache.org/docs/3.5.7/sql-ref-datetime-pattern.html
[^21]: Oracle Database 19c SQL Language Reference — ADD_MONTHS. https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ADD_MONTHS.html
[^22]: Oracle Database 19c SQL Language Reference — TRUNC (date). https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TRUNC-date.html
[^23]: Oracle Database 19c SQL Language Reference — TO_CHAR (datetime). https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_CHAR-datetime.html
[^24]: MySQL 8.4 Reference Manual — Date and Time Functions. https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html
[^25]: MySQL 8.4 Reference Manual — Aggregate Function Descriptions. https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html
[^26]: MySQL 8.4 Reference Manual — UPDATE Statement. https://dev.mysql.com/doc/refman/8.4/en/update.html
[^27]: MySQL 8.4 Reference Manual — Optimizing Derived Tables, View References, and Common Table Expressions with Merging or Materialization. https://dev.mysql.com/doc/refman/8.4/en/derived-table-optimization.html
[^28]: MySQL 8.4 Reference Manual — INSERT ... SELECT Statement. https://dev.mysql.com/doc/refman/8.4/en/insert-select.html
[^29]: Pentaho Data Integration — Table Input. https://docs.pentaho.com/pdia-data-integration/pdi-transformation-steps-reference-overview/table-input
[^30]: Pentaho Data Integration — Performance Tips. https://docs.pentaho.com/pdia-admin/optimize-the-pentaho-system/performance-tuning/pentaho-data-integration-performance-tips
[^31]: Pentaho Data Integration — Table Output. https://docs.pentaho.com/pdia-data-integration/pdi-transformation-steps-reference-overview/table-output
[^32]: MySQL 8.4 Reference Manual — DELETE Statement. https://dev.mysql.com/doc/refman/8.4/en/delete.html
[^33]: MySQL 8.4 Reference Manual — Bulk Data Loading for InnoDB Tables. https://dev.mysql.com/doc/refman/8.4/en/optimizing-innodb-bulk-data-loading.html
[^34]: MySQL 8.4 Reference Manual — TRUNCATE TABLE Statement. https://dev.mysql.com/doc/refman/8.4/en/truncate-table.html
