---
title: "Java 本番性能トラブルシューティング：症状から証拠への最小判断木"
timestamp: 2026-02-25 00:00:00+08:00
series: "Java 基礎とバックエンドチューニング"
kind: concept
status: active
draft: true
sources: ["legacy-java-online-performance-debug"]
related: ["java-null-value", "java-atomic-boolean", "java-internship-interview-blog-polished"]
tags: ["Linux", "Operations", "SRE", "Performance Troubleshooting", "CPU", "Java", "Production Incident", "Arthas", "JVM", "Hot-Swapping"]
description: "Java 本番性能障害を、症状・証拠・スレッド/GC/コード特定・可逆的な止血と復旧の最小判断木に圧縮し、再起動やコマンド一覧を根因分析の代わりにしない方法を示します。"
toc: true
---

本ページは Java 本番性能障害の判断木であり、1500 行のコマンド手順ではありません。サービスが観測可能な間に証拠を保存し、システム症状をプロセス、スレッド、GC、コードの hot spot へ絞り、可逆的な止血と復旧を選ぶことが目的です。

## 核心メカニズム

### 1. すべての高 CPU を Java の無限ループと呼ばない

| 症状/証拠 | 最初の仮説 | 次の手順 |
| --- | --- | --- |
| `user` が高く、Java プロセス/スレッドが RUNNABLE 継続 | 計算 hot spot、loop、シリアライズ、retry storm | thread stack、Arthas `thread`/flame graph、コード特定 |
| `system` または `softirq` が高い | kernel、network interrupt、packet storm | 業務コードを変える前に system/network を調べる |
| `iowait` が高い | disk、logging、DB、下流 I/O 待ち | I/O latency、connection、依存先メトリクスを確認 |
| 高 CPU、GC 頻発、heap が上限に近い | allocation 圧力、メモリ不足、collection storm | `jstat`、GC log、heap/allocation 証拠 |
| CPU は中程度なのに load が高く `BLOCKED/WAITING` | lock 競合、pool 枯渇、依存先ブロック | stack、pool queue、lock、下流 timeout |

### 2. 単一コマンドより証拠の鎖

```text
症状 → 時刻/影響 → process PID → hot thread TID → jstack nid
     → RUNNABLE/BLOCKED/WAITING/GC の手掛かり → code/dependency → 可逆 action
```

最小の現場記録は時刻、load/CPU snapshot、PID/TID、thread stack、GC 統計または log、deploy/traffic の時系列です。`top -Hp <pid>` は thread を探し、`printf "%x" <tid>` は `jstack` の hexadecimal `nid` に変換します。コマンドは鎖を作るためで、一覧を丸ごと貼るためではありません。

### 3. スレッドからコードへ収束する

- `RUNNABLE`：`nid` を stack と照合し、具体性が足りなければ範囲を絞った Arthas `thread`、`trace`、flame graph を使う。
- `BLOCKED`：スレッドを増やす前に lock owner と待機鎖を調べる。
- `WAITING`：通常の queue 待ち、idle pool、無期限の下流待ちを区別する。
- GC 関連：`jstat`/GC log の pause、頻度、heap 変化を allocation と request latency に合わせる。GC が見えただけでは根因といえない。

Arthas は実行中 JVM に接続して thread/method を観測します。`watch`、`trace`、`stack` にはコストがあるため、クラス、メソッド、条件、回数を先に限定します。

## 適用条件

- プロセスがまだ到達可能で、system と JVM の証拠を取得できる。
- PID、thread stack、GC 信号、deploy/traffic の時系列を取得できる。
- 無条件の再起動ではなく、証拠保存と可用性回復を順序付けて判断する必要がある。
- 本番観測の範囲、回数、rollback plan があり、診断コストを評価済みである。

## 不適用とリスク

- `kill -9`、即時 restart、無制限 `watch/trace` は証拠を壊し、障害を広げ、CPU をさらに使う可能性があります。証拠が十分か、リスクが制御不能な場合だけ recovery action として使います。
- `jstack` は一時点の sample です。時間的因果を証明できないので、複数 sample、メトリクス、変更履歴と組み合わせます。
- `jmap`、heap dump、flame graph、Arthas は pause、I/O、機密情報露出を起こし得ます。disk、権限、redaction、承認境界を先に確認します。
- HotSwap/redefine/retransform は JDK と class 形状に依存する緊急止血で、修正そのものではありません。元 class を保存し、変更を記録して rollback を準備します。
- `user/system/iowait/softirq`、GC counter、診断 command の意味は OS、JDK、container、tool で変わります。本ページは普遍的閾値を示しません。

## 最小検証

1. alert または再現時に、時刻、影響 endpoint、traffic、load、高 CPU PID を記録してから、何も kill しない。
2. 同一 PID について二回 sample を取る。hot TID を探し、hex 化して `jstack` の `nid` に対応付け、状態が継続するかを見る。
3. stack が GC を示すなら GC 統計/log を複数回取り、latency、allocation、heap 変化と相関させる。method を示すなら一度だけ bounded `trace` または flame graph で検証する。
4. rate limit、degrade、異常 job の pause、scale、controlled restart など可逆 action を一つ実行し、CPU、latency、error、queue、GC の前後を観測して証拠を保存する。
5. 直接原因、寄与要因、証拠、action、follow-up monitoring を記録する。「復旧した」は「根因を確認した」と同じではない。

## 証拠と不確実性

- **出典事実**：`legacy-java-online-performance-debug` は止血・保存・特定・復旧の四段階、CPU 分類、PID/TID から `jstack`、Arthas thread/method 観測、GC/system 事例、Hotfix のリスクを扱います。
- **本ページの統合**：コマンド中心の出典を症状 → 証拠 → thread/GC/code → 止血/復旧へ縮約し、観測コストと可逆性を判断条件にしました。
- **未確認**：閾値、HotSwap の能力、Arthas command の互換性、一つの stack が根因だという主張は、現在の JDK、container、OS、version、現場証拠で確認が必要です。

## 関連ページ

- [NullValue：キャッシュ null のプレースホルダーとシリアライズ境界](/note/java-null-value)
- [AtomicBoolean：原子ブール状態と CAS の境界](/note/java-atomic-boolean)
- [Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠](/note/java-internship-interview-blog-polished)
