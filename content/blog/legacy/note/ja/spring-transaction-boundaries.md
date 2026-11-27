---
{
  "archiveId": "X-1332",
  "translationKey": "legacy/note/spring-transaction-boundaries",
  "title": "Spring トランザクション境界と伝播動作：AOP プロキシ・分離レベル・ロールバック規則",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "SpringTransactions の原文ノートに基づき、PlatformTransactionManager / AOP + ThreadLocal の仕組み、4 つの分離レベル、7 種の伝播動作、timeout/readOnly の適用条件、RuntimeException 対検査例外のロールバック境界を整理する。",
  "findings": [
    "一次情報源: src/content/raw/zh-cn/ingest-spring-cloud.md",
    "証拠の状態: 暫定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Spring",
    "SpringBoot",
    "Transaction",
    "AOP",
    "ja",
    "note"
  ],
  "draft": false,
  "lang": "ja",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-spring-cloud"
  ],
  "related": [
    "spring-cloud-and-boot"
  ]
}
---

`@Transactional` は接続束縛・コミット・ロールバックを業務コードから AOP インターセプタへ切り離すが、その裏返しとして例外型の違い、ネスト時の伝播属性、`timeout`/`readOnly` の継承範囲、およびプロキシ経由で呼ばれているかによって意図しない挙動が起きる。

本稿は [Spring Boot と Spring Cloud：自動構成、トランザクション、サービス検出、ゲートウェイと可観測性](/blog/legacy/note/ja/spring-cloud-and-boot/) から `SpringTransactions.md` の詳細を切り出したものである。

## 中核メカニズム

### 1. 中核インターフェースと AOP + `ThreadLocal`

Spring の宣言的トランザクションは 3 つの抽象で構成される。

- **`PlatformTransactionManager`**：`getTransaction`、`commit`、`rollback` を提供（例：`DataSourceTransactionManager`）。
- **`TransactionDefinition`**：分離レベル、伝播動作、`timeout`、`readOnly` を保持。
- **`TransactionStatus`**：新規開始かロールバック専用状態かなどの実行時状態を保持。

実行時は AOP プロキシ（デフォルト CGLIB）と `TransactionInterceptor` が外部呼び出しを捕捉し、DB 接続や状態をスレッドの `ThreadLocal` に束縛して対象メソッドを実行したうえでコミットまたはロールバックし、最後に `ThreadLocal` を清掃する。

### 2. 7 種の伝播動作と属性有効範囲

| 伝播動作 | 外側トランザクションあり | 外側なし | 主な境界・注意点 |
| --- | --- | --- | --- |
| `PROPAGATION_REQUIRED`（既定） | 既存に参加 | 新規作成 | 接続とロールバック境界を共有 |
| `PROPAGATION_SUPPORTS` | 既存に参加 | 非トランザクション実行 | 参照系メソッドに適する |
| `PROPAGATION_MANDATORY` | 既存に参加 | 例外送出 | 呼び出し側の既存トランザクションを強制 |
| `PROPAGATION_REQUIRES_NEW` | 外側を一時停止し独立新規作成 | 新規作成 | 監査ログ等の独立コミット向け |
| `PROPAGATION_NOT_SUPPORTED` | 外側を一時停止し非トランザクション実行 | 非トランザクション実行 | ロック保持を避けたい参照等 |
| `PROPAGATION_NEVER` | 例外送出 | 非トランザクション実行 | トランザクション内実行を厳禁 |
| `PROPAGATION_NESTED` | JDBC Savepoint でネスト実行 | 新規作成 | 外側の失敗で内側もロールバック；DB/管理機構の対応に依存 |

**属性境界**：`timeout`（秒）と `readOnly=true` は**新しいトランザクションを開始するメソッドにのみ有効**であり（新規の `REQUIRED` や `REQUIRES_NEW`）、既存トランザクションへ参加する場合は内側の設定は無視される。また `readOnly=true` は最適化ヒントであり強制的な書込禁止ではない。

### 3. 分離レベルとロールバック規則

`DEFAULT` に加え `READ_UNCOMMITTED`、`READ_COMMITTED`、`REPEATABLE_READ`（ダーティリードと非再現読み取りを防ぎ得るがファントムリードの可能性は残る）、`SERIALIZABLE` を扱う。

**既定のロールバック規則**：`RuntimeException` と `Error` では自動ロールバックし、検査例外（Checked Exception）は**既定ではロールバックしない**。変更時は明示指定する。

```java
@Transactional(
    isolation = Isolation.REPEATABLE_READ,
    rollbackFor = IOException.class,
    noRollbackFor = InsufficientStockException.class
)
public void processOrder() {
    // 業務ロジック
}
```

## 適用境界と未検証内容

- **適用**：単一 DB ローカルトランザクション境界設計、`@Transactional` の伝播・例外戦略点検。
- **不適用**：複数 DB / マイクロサービス間の分散トランザクション（原文未カバー）やプロキシ経路検証の代替。
- **未検証境界（raw 資料の制限を明示保持）**：
  - `SpringTransactions.md` は `AOP + ThreadLocal`、`timeout`/`readOnly`、`rollbackFor`/`noRollbackFor`、Savepoint（`NESTED`）を解説するが、**固定 MySQL/Spring Boot バージョンでの自己呼び出しや例外分離の結合テスト結果は未記録**；
  - 読み書き分離ルーティングや `REQUIRES_NEW` によるコネクションプール枯渇・分散トランザクションは実測していない。

## 卒業チェック

1. 結合テストで `REQUIRED`、`REQUIRES_NEW`、`NESTED`（Savepoint）の内外例外発生時における DB コミット・ロールバック挙動を実測検証する。
2. 検査例外（`IOException` 等）と独自業務例外で既定ロールバック対 `rollbackFor`/`noRollbackFor` の動作を確認する。
3. 別 Bean からの呼び出しと同一クラス内自己呼び出しで `TransactionInterceptor` の動作有無を確認する。

## 関連ページ

- [Spring Boot と Spring Cloud：自動構成、トランザクション、サービス検出、ゲートウェイと可観測性](/blog/legacy/note/ja/spring-cloud-and-boot/)
- [ingest-spring-cloud（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md)
