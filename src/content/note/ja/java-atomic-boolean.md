---
title: "AtomicBoolean：原子ブール状態と CAS の境界"
timestamp: 2025-10-07 20:25:00+08:00
series: "Java 基礎とバックエンドチューニング"
kind: concept
status: active
draft: true
sources: ["legacy-java-atomic-boolean"]
related: ["java-auto-closeable", "java-online-performance-debug", "java-internship-interview-blog-polished"]
tags: ["Java", "Concurrency", "AtomicBoolean", "CAS", "JUC"]
description: "原子ブール状態が必要な条件、compareAndSet が検査と遷移をまとめる仕組み、複数フィールドの整合性や高競合での CAS の限界を整理します。"
toc: true
---

`AtomicBoolean` は、複数スレッドで共有する二値状態を、可視かつ原子的に切り替えるための型です。本ページでは、通常の `boolean` や `volatile` では足りない場面と、CAS が保証できない範囲を示します。「ロックフリーなら常にロックよりよい」という規則ではありません。

## 核心メカニズム

### 1. 可視性と状態遷移を分ける

| 要件 | 適した道具 | 因果関係 |
| --- | --- | --- |
| 一つのスレッドだけの状態 | `boolean` | 共有並行性の意味がない |
| 状態変更を通知するだけ | `volatile boolean` | 読み書きは可視だが、検査と書き込みは競合する |
| 一つのスレッドだけが `false → true` を完了 | `AtomicBoolean.compareAndSet` | 読み、比較、書き込みを一つの原子更新にする |
| 複数フィールドの不変条件を維持 | `synchronized` / `Lock` | フラグではなく臨界区間全体を保護する |

`if (!flag) { flag = true; }` は check-then-act です。二つのスレッドが `false` を読めます。`volatile` は可視性を直しますが、この複合操作を原子化しません。

### 2. CAS の最小モデル

```java
private final AtomicBoolean running = new AtomicBoolean();

if (!running.compareAndSet(false, true)) {
    return;                 // 別スレッドが処理を取得済み
}
try {
    doWork();
} finally {
    running.set(false);     // 失敗しても解放する
}
```

CAS は現在値が `expectedValue` と一致したときだけ `newValue` を書き込み、成功可否を返します。一度だけの処理、キャンセル通知、開始/停止、二重送信防止などの小さな状態機械に向きます。成功者が処理し、失敗者は即時失敗または明示した回数だけ再試行します。

原子的な読み書きには該当するメモリ可視性もありますが、`data`、カウンタ、コレクションなど他の通常フィールドまで安全にはしません。それらには正しい公開順序と同期設計が必要です。

## 適用条件

- 共有状態が本当に二値で、遷移を CAS の前提条件として書ける。
- 競合が通常は限定的で、CAS 失敗時に中止、競合通知、または有限回の再試行を選べる。
- フラグが「一度だけ実行」「実行中」「キャンセル済み」などの小さなライフサイクルを表し、長時間の臨界区間ではない。
- `AtomicBoolean` 自体を `final` フィールドにして置き換えず、処理の成功/失敗を呼び出し側が観測できる。

## 不適用とリスク

- 残高、件数、記録を一緒に更新する場合、フラグだけでは整合性を保てない。ロックや適切な並行データ構造を使う。
- 高競合で無制限にスピンすると CPU を消費する。CAS は公平性を保証せず、待機スレッドを休ませもしない。
- 待機・通知・容量調整・複雑な状態機械には、まず `CountDownLatch`、`Semaphore`、`Condition`、キュー、ロックを評価する。
- `set(true)` は単なる書き込みであり、旧値が条件を満たす必要がある場合の `compareAndSet` の代わりにならない。
- 「CAS は速い」は出典から導ける事実ではない。競合、臨界区間、失敗率、ハードウェア、JDK に依存し、API 名だけでは判断できない。

## 最小検証

1. `compareAndSet(false, true)` を使う一度だけの処理を二つのスレッドから同時に呼び、副作用が一回だけになることを確認する。
2. `doWork()` に例外を発生させ、その後もう一度呼ぶ。`finally` で復元できていれば再び `false → true` へ遷移できる。
3. 競合テストでは無競合のスループットだけでなく CAS 失敗数と CPU を記録し、再試行が無限になっていないか確認する。
4. フラグでデータを公開するなら、「データを書いてから `set(true)`」と「`get()` が true の後に読む」を別々に検証する。一つの原子フィールドを全フィールドの安全性の証拠にしない。

## 証拠と不確実性

- **出典事実**：`legacy-java-atomic-boolean` は、volatile の check-then-act の限界、`compareAndSet`、`get/set`、キャンセル/ライフサイクル例、複数フィールドと高競合のリスクを記録しています。
- **本ページの統合**：例を可視性・原子的遷移・臨界区間の選択モデルへ圧縮し、CAS の条件を限定的な競合と素早い失敗に置きました。
- **未確認**：CAS とロックの性能差、VarHandle/Unsafe の実装詳細は JDK、ハードウェア、負荷に依存します。本ページは安定した結論として扱いません。

## 関連ページ

- [AutoCloseable：リソース所有権と close 例外の意味](/note/java-auto-closeable)
- [Java 本番性能トラブルシューティング：症状から証拠への最小判断木](/note/java-online-performance-debug)
- [Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠](/note/java-internship-interview-blog-polished)
