---
title: "AutoCloseable：リソース所有権と close 例外の意味"
timestamp: 2025-10-07 20:25:00+08:00
series: "Java 基礎とバックエンドチューニング"
kind: concept
status: active
sources: ["legacy-java-auto-closeable"]
related: ["java-atomic-boolean", "java-null-value", "java-internship-interview-blog-polished"]
tags: ["Java", "JDK", "Exception Handling", "Resource Management", "Try-With-Resources"]
description: "リソース所有権を起点に、AutoCloseable と try-with-resources の逆順 close、主例外と suppressed 例外、冪等な後片付けの境界を説明します。"
toc: true
---

`AutoCloseable` はリソース解放のプロトコルです。リソースを所有するコードがライフサイクルを `try-with-resources` に渡し、スコープを離れると `close()` が呼ばれます。本ページはストリームや JDBC の手順集ではなく、所有権、順序、例外伝播に焦点を当てます。

## 核心メカニズム

### 1. 構文より先に所有権を決める

`AutoCloseable` の実装は「閉じられる」ことを示すだけで、所有者を決めません。生成して解放責任を持つコードが TWR に入れるべきです。借用側が、別の所有者も使っている共有リソースを先に閉じてはいけません。

```java
try (Connection c = dataSource.getConnection();
     PreparedStatement p = c.prepareStatement(sql)) {
    // c と p はこのスコープだけで使う
}
```

初期化に成功したリソースは、正常終了でも例外終了でも自動的に閉じられます。複数リソースは宣言の逆順で閉じます。`p` を `c` より先に閉じるのは、依存するラッパーを基盤より先に解放するためです。

### 2. 主例外と suppressed 例外

- `try` 本体の例外が主例外になります。
- `close()` の失敗は `主例外.getSuppressed()` に追加され、主例外を置き換えません。
- 本体が成功して `close()` だけ失敗した場合、close の例外が送出されます。
- 初期化に失敗した後続リソースは取得済みとは扱わず、取得済みのものはプロトコルに従って片付けます。

手書きの `try-finally` では `finally` の再送出が業務例外を隠すことがあります。TWR は両方の証拠を保持する点が安全です。

### 3. 最小の close プロトコル

```java
final class Handle implements AutoCloseable {
    private boolean closed;

    @Override public void close() throws Exception {
        if (!closed) {
            closed = true;
            release();
        }
    }
}
```

`close()` はできるだけ冪等にし、解放以外の新しい業務処理を始めないようにします。close が flush や出力の完全性を決めるなら失敗を見える形にします。一時ファイル削除のような補償的な後片付けなら、許容する失敗をログに残して抑制する設計もありますが、方針は明示が必要です。

## 適用条件

- ファイルディスクリプタ、接続、カーソル、ロック、一時ディレクトリなど明示解放が必要な外部リソースを保持する。
- 所有権を一つのスコープで表現できる、または明示的なラッパーで移譲できる。
- 複数リソースに依存関係があり、決定的な逆順解放が必要である。
- close 失敗を `Exception`、`IOException`、ドメイン固有例外の契約として呼び出し側に見せる必要がある。

`Closeable` は `AutoCloseable` の I/O 特化型で、通常 `IOException` を宣言します。一般的な業務リソースは `AutoCloseable` を直接実装できます。

## 不適用とリスク

- 借用した共有接続、コンテナ管理の executor、グローバル singleton を所有していない TWR に入れない。別の利用者のライフサイクルを壊します。
- `close()` の例外型は実装と JDK API の契約に従います。すべてのリソースが無例外で閉じるとは限りません。
- 冪等性は推奨される本番属性であり、すべてのライブラリが二重 close を無害にする保証ではありません。個別 API を確認してください。
- 逆順 close が解決するのはリソース依存だけで、トランザクション commit、メッセージ確認、業務補償ではありません。これらは別に設計します。
- コネクションプール、JDBC ドライバ、外部クライアントはバージョンで挙動が変わります。コンパイラ展開を公開 API の契約とみなさないでください。

## 最小検証

1. `open`、`use`、`close` を記録するリソースを作り、正常終了と本体例外の両方で一度だけ close されることを確認する。
2. 依存する二つのリソースを宣言し、イベントを記録して後に宣言したものが先に閉じることを確認する。
3. `use()` と `close()` の両方を失敗させ、主例外と `getSuppressed()` の内容を調べる。
4. 借用/共有リソースは別にテストする。借用スコープ終了後も所有者が使えるべきです。使えないなら TWR を外すか、寿命のラッパーを定義します。

## 証拠と不確実性

- **出典事実**：`legacy-java-auto-closeable` は Java 7 の `AutoCloseable`、TWR の逆順、主例外/抑制例外、`Closeable` との関係、独自リソース、冪等な `close()` を説明しています。
- **本ページの統合**：構文の前提として所有権を置き、close 失敗を伝播必須の失敗と方針次第で記録できる後片付け失敗に分けました。
- **未確認**：JDBC、ファイルシステム、外部クライアントの冪等性・例外型・トランザクション挙動は対象バージョン API と実行テストが必要です。例は普遍的保証ではありません。

## 関連ページ

- [AtomicBoolean：原子ブール状態と CAS の境界](/note/java-atomic-boolean)
- [NullValue：キャッシュ null のプレースホルダーとシリアライズ境界](/note/java-null-value)
- [Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠](/note/java-internship-interview-blog-polished)
