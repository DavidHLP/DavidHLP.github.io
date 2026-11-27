---
{
  "archiveId": "X-1320",
  "translationKey": "legacy/note/java-cas-and-aba",
  "title": "Java CAS・ABA 問題・LongAdder：ロックフリー原子プリミティブと競合境界",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "JUC アトミッククラスのソースノートに基づき、CAS（cmpxchg / Unsafe）の 3 オペランド仕様、ABA 問題と AtomicStampedReference によるバージョンスタンプ対策、高競合時の AtomicLong スピン対 LongAdder（Cell ストライプ・フォールスシェアリング回避）を整理する。",
  "findings": [
    "一次情報源: src/content/raw/zh-cn/ingest-java-concurrency.md",
    "証拠の状態: 暫定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Java",
    "JUC",
    "CAS",
    "Atomic",
    "LongAdder",
    "ABA",
    "ja",
    "note"
  ],
  "draft": false,
  "lang": "ja",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-java-concurrency"
  ],
  "related": [
    "java-concurrency-deepdive"
  ]
}
---

CAS（Compare-And-Swap）は悲観的なブロッキングロックを楽観的な非ブロッキング更新へ置き換える。競合は低確率とみなし、失敗したスレッドは即座に停止せず失敗結果を受け取って呼び出し側が再試行やスピンを判断する。しかし業務不変条件や高競合カウンタでは、ロックフリーであっても無条件に「正しい」または「常に速い」とは言えない。

本稿は [Java 並行処理の深掘り：JUC、CAS、アトミック、ロックとスレッド機構](/blog/legacy/note/ja/java-concurrency-deepdive/) から `CASDeepDive.md`、`JavaAtomicClasses.md`、`LongAdderVSAtomicLong.md` の詳細を切り出したものである。二値フラグの `AtomicBoolean` は `java-atomic-boolean` を参照。

## 中核メカニズム

### 1. CAS プリミティブと `Unsafe` 基盤

CAS は **メモリアドレス `V`、期待旧値 `A`、更新新値 `B`** の 3 オペランドを扱う。現在値が `A` と一致する場合に限り `B` へ原子更新し、x86 の `cmpxchg` などの CPU 命令でマルチプロセッサ原子性を保証する。

```java
// V: メモリ値, A: 期待値, B: 新値
public boolean compareAndSwap(V, A, B) {
    if (V == A) {
        V = B;
        return true;
    } else {
        return false;
    }
}
```

JUC のアトミッククラス（`AtomicInteger`、`AtomicLong`、`AtomicBoolean`）は `volatile` フィールドを中心に以下の操作群を提供する。

- `get()` / `set(newValue)`：それぞれ `volatile` 読み出し・書き込みセマンティクスを提供する。
- `lazySet(newValue)`：遅延書き込み。後続スレッドへの即時可視性を保証しない代わりにバリアコストが低く、監視メトリクスのリセット等に向く。
- `compareAndSet(expect, update)` / `weakCompareAndSet(expect, update)`：弱 CAS は一部環境で値が一致していても擬似失敗（spurious failure）が起こり得るため、必ずループ内で使用する。

### 2. ABA 問題と `AtomicStampedReference`

`V == A` だけを比較しても、別スレッドがその間に `A -> B -> A` と書き換えた履歴は検知できない。ロックフリースタックでは先頭ポインタが元の `A` に戻ってもリンク構造が変わっている可能性があり、古い参照のまま CAS すると構造破壊を起こす。

`AtomicStampedReference` は参照と整数スタンプ `(reference, stamp)` を組で管理し、参照値とバージョンの両方を同時に照合する。

```java
// 参照が expectedReference かつスタンプが expectedStamp のときのみ更新する
stampedRef.compareAndSet(expectedReference, newReference, stamp, stamp + 1);
```

競合スレッドが `A -> B -> A` の往復でスタンプを進めると、古いスタンプを持つスレッドの `compareAndSet` は不一致により `false` を返す。

### 3. 高競合カウンタ：`AtomicLong` 対 `LongAdder`

| 比較軸 | `AtomicLong` | `LongAdder`（`Striped64` 継承） |
| --- | --- | --- |
| 内部構造 | 単一共有 `volatile long value` | `base` ＋ 分散配列 `volatile Cell[] cells` |
| 無競合/低競合 | `value` へ直接 CAS | 高速パスで `base` へ CAS |
| 高競合時 | 同一キャッシュラインへのホットスポット競合・スピン | `ThreadLocalRandom` プローブで異なる `Cell` へ分散 |
| フォールスシェアリング対策 | 単一変数の書換が同一ラインを無効化 | `Cell` に `@sun.misc.Contended` を付与し独立ライン化 |
| 読み書き特性 | `get()` で厳密な単一値を取得 | `add()` で分散書込、`sum()` で非原子的集計値を取得 |

競合が軽度で厳密な即時値が必要な場合は `AtomicLong` が簡潔であり、多数スレッドが並列加算し `sum()` の集計スナップショットで足りる場合は `LongAdder` が空間と引き換えに競合を分散する。

## 適用境界と未検証内容

- **適用**：単一変数の状態遷移・フラグ・カウンタ・小さな臨界区間で、再試行を許容できる場面。
- **不適用**：複数変数にまたがる不変条件の排他制御、待機条件キューが必要な処理、ストライプなしの極端なホットスポット書き込み。
- **未検証境界（raw 資料の制限を明示保持）**：
  - `sun.misc.Unsafe` のリフレクション取得（`theUnsafe`）は JDK 17 以降のモジュール強固カプセル化で制限され、資料は `VarHandle` 置換手順まで確認していない；
  - 資料は構造とキャッシュライン原理で `AtomicLong` と `LongAdder` を比較しており、**固定 JDK・実機での JMH ベンチマーク数値を伴わないため具体的な何倍速といった主張はできない**。

## 卒業チェック

1. 固定された JDK 17/21 ビルド（`--illegal-access` 回避なし）上で `AtomicStampedReference` / `VarHandle` による ABA 拒否再現を実行し、失敗検知ログを記録する。
2. 実機マルチコア環境で 1/4/16/64 スレッドの JMH スループット計測を行い、`AtomicLong` と `LongAdder` の実測分岐点を特定する。
3. `lazySet` の可視性遅延が業務メトリクス収集間隔の許容範囲に収まるかを検証する。

## 関連ページ

- [Java 並行処理の深掘り：JUC、CAS、アトミック、ロックとスレッド機構](/blog/legacy/note/ja/java-concurrency-deepdive/)
- [AtomicBoolean：原子ブール状態と CAS の境界](/blog/legacy/note/ja/java-atomic-boolean/)
- [ingest-java-concurrency（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md)
