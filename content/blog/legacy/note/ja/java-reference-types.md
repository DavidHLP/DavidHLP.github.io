---
{
  "archiveId": "X-1326",
  "translationKey": "legacy/note/java-reference-types",
  "title": "Java 参照型とライフサイクル状態機械：Strong・Soft・Weak・Phantom と Cleaner",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "JDK 8/17 の参照型ノートに基づき、java.lang.ref.Reference の 4 状態遷移、JDK 9+ の VarHandle 化、4 種の参照強度の回収仕様、SoftReference が低遅延キャッシュで反パターンになる理由と Cleaner への置き換えを整理する。",
  "findings": [
    "一次情報源: src/content/raw/zh-cn/ingest-java-concurrency.md",
    "証拠の状態: 暫定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Java",
    "GC",
    "Reference",
    "WeakReference",
    "Cleaner",
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

Java はオブジェクト到達可能性とオフヒープ資源の解放を非同期イベント通知モデルとして分離している。強参照を `null` にするだけでは弱束縛メタデータや回収通知を表現できない一方、遅延に厳しいキャッシュで `SoftReference` を誤用すると予測不能な Full GC 揺らぎを引き起こす。

本稿は [Java 並行処理の深掘り：JUC、CAS、アトミック、ロックとスレッド機構](/blog/legacy/note/ja/java-concurrency-deepdive/) から JDK 8 と JDK 17 の `JavaReferenceTypes` 解説を切り出したものである。

## 中核メカニズム

### 1. `java.lang.ref.Reference` の 4 段階ライフサイクル

強参照以外の参照型は、GC と専用デーモン間の 4 状態を通じて遷移する。

1. **`Active`（活性）**：初期状態。`get()` で参照対象 `referent` を取得できる。
2. **`Pending`（保留）**：GC が到達性解析で参照強度条件を満たさないと判定すると、内部の `discovered` リストへ原子的に追加する。
3. **`Enqueued`（キュー登録）**：JVM の `Reference-Handler` スレッドが `referent` を `null` にしたうえで関連付けられた `ReferenceQueue` へ投入する。
4. **`Inactive`（非活性）**：アプリがキューから取り出すか、キュー未指定のまま回収完了して到達する終端状態。

JDK 9 以降では G1GC や ZGC などの並行 GC と整合するため、`VarHandle REFERENT`（`getAcquire` / `setRelease`）で操作する。

```java
// Reference<T> の取得・消去セマンティクス（JDK 9+ VarHandle 方式）
public T get() {
    return (T) REFERENT.getAcquire(this);
}

public void clear() {
    REFERENT.setRelease(this, null);
}
```

### 2. 4 種の参照強度の比較と設計判断

| 参照型 | 回収条件 | `ReferenceQueue` / 主な用途 | 主なリスクと代替 |
| --- | --- | --- | --- |
| **強参照（Strong）** | GC Root から到達可能なら非回収 | 通常の参照；枯渇時は `OutOfMemoryError` | 無制限コレクションによるヒープ圧迫 |
| **ソフト参照（SoftReference）** | メモリ逼迫時にソフト到達のみなら回収 | 簡易メモリキャッシュ | 回収時期が不定で低遅延系の反パターン（Caffeine 等の確定的退避を優先） |
| **弱参照（WeakReference）** | 空きメモリ有無に関わらず次回 GC で回収 | `WeakHashMap` キー、`ThreadLocalMap.Entry` キー | キー消滅後の value 清掃は後続マップ操作に依存 |
| **ファントム参照（PhantomReference）** | `get()` は常に `null`、キュー通知専用 | 回収後の資源解放；Java 9+ は `Cleaner` を推奨 | 非推奨の `finalize()` は使わない |

### 3. `finalize()` に代わる `Cleaner` API

オフヒープ資源（JNI、`DirectByteBuffer`、ネイティブファイルハンドル等）では Java 9+ で導入された `java.lang.ref.Cleaner` を使い、クリーンアップ処理（対象オブジェクトへの強参照を持たない独立 `Runnable` 状態クラス）を対象から分離し、明示的 `close()` と GC フェイルセーフを両立させる。

## 適用境界と未検証内容

- **適用**：`WeakHashMap` による弱キー連想や `Cleaner` を用いたネイティブ資源の保険解放。
- **不適用**：低遅延・高スループット要件の主キャッシュ退避戦略としての `SoftReference`。
- **未検証境界（raw 資料の制限を明示保持）**：
  - キュー投入のタイミングや停止時間は GC（G1GC / ZGC）と JDK ビルドにより異なる；
  - 資料の例示出力は挙動説明にとどまり、**固定 JDK と複数 GC オプション間の並列実測ベンチマークは実施していない**。

## 卒業チェック

1. 固定された JDK ビルドで `-XX:+UseG1GC` と ZGC を切り替え、`WeakHashMap` と `Cleaner` の `ReferenceQueue` 到達挙動を実測比較する。
2. `Cleaner` のアクション定義がラムダ等で対象本体への強参照を捕捉していないことを点検する。
3. 既存の `SoftReference` 利用箇所を確認し、必要に応じて確定的容量上限付きキャッシュへ置き換える。

## 関連ページ

- [Java 並行処理の深掘り：JUC、CAS、アトミック、ロックとスレッド機構](/blog/legacy/note/ja/java-concurrency-deepdive/)
- [AutoCloseable：リソース所有権と close 例外の意味](/blog/legacy/note/ja/java-auto-closeable/)
- [ingest-java-concurrency（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md)
