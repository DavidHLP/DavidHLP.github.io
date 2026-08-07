---
title: "Java バックエンド面接の振り返り：プロジェクトの真正性、設計機構、実運用の証拠"
timestamp: 2026-02-25 00:00:00+08:00
series: "Java 基礎とバックエンドチューニング"
kind: synthesis
status: provisional
sources: ["legacy-java-internship-interview-blog-polished", "legacy-java-null-value", "legacy-java-online-performance-debug"]
related: ["java-null-value", "java-online-performance-debug", "java-atomic-boolean", "java-auto-closeable"]
tags: ["Java", "Backend", "Internship Interview", "Redis", "Docker", "Kafka", "WebSocket", "JVM", "Production Troubleshooting"]
description: "プロジェクトの ownership の証明、cache/非同期の機構、本番での診断・止血・復旧の証拠を一つの能力モデルに統合します。"
toc: true
---

これは個人の物語や質問リストではなく、面接で確認できる能力の統合ページです。「プロジェクトを作った」を、担当範囲を示し、機構とトレードオフを説明し、障害・メトリクス・復旧の証拠で検証できる判断へ変換する方法を扱います。目的は技術名を並べることではなく、プロジェクトの真正性、機構の正しさ、実運用の可観測性を結び付けることです。

## 核心メカニズム

### 1. 三層の能力モデル

| 層 | 明確にすること | 検証できる証拠 | よくある歪み |
| --- | --- | --- | --- |
| プロジェクトの真正性 | entry point、担当 module、data flow、具体的な変更 | code path、endpoint/table/message、commit/test の境界 | 技術 stack だけを挙げ、失敗経路を説明できない |
| 設計機構 | なぜ cache、queue、隔離、長接続を選び、何を負担したか | state transition、limit、TTL、retry、idempotency、exception contract | 「使った」を「理解した」と扱う |
| 実運用の証拠 | 観測、特定、止血、rollback、review の方法 | metrics、log、stack、GC/error rate、timeline | 「restart」「log を見る」だけで終わる |

三層は **事実と ownership → 機構とコスト → 観測結果 → 障害 action** の因果鎖になります。担当した、推測した、未検証を明示し、根拠のない ownership を広げません。

### 2. 負キャッシュで「機構 + 境界」を示す

「Redis を使った」で終わらず、不在オブジェクトについて次を説明します。

1. 回源できるのは cache miss だけ。DB が不在を確認したら短 TTL の `NullValue` marker を保存する。
2. 読み出し時に marker を業務 `null` へ戻し、key 不在、negative hit、実オブジェクトを区別する。
3. validation/Bloom filter で不正 key、lock/single-flight で hot reload、TTL と明示 invalidation で stale 窓を制限する。
4. serializer が marker を認識するか実測する。Spring 内部の `readResolve` は異言語プロトコルではない。

「穿透、击穿、雪崩」という語を暗記するより、境界を説明できることが重要です。

### 3. 性能排障で「証拠 + 復旧」を示す

CPU または latency 障害は次へ圧縮できます。

```text
症状 → 時系列と snapshot を保存 → PID/TID → stack/GC/method の証拠
     → code、lock、GC、dependency の仮説 → 可逆止血 → 指標を再確認して review
```

良い説明は、`RUNNABLE` なら hot code、`BLOCKED` なら lock chain、`WAITING` なら queue/dependency、GC なら allocation・pause・latency の相関を見ると述べます。`kill -9` を第一手段にせず、一つの stack sample を根因の証明にもしてはいけません。

### 4. インフラ選択を観測可能な機構へ翻訳する

| 技術 | 説明する機構 | 本番の証拠 |
| --- | --- | --- |
| Docker sandbox | CPU、memory、network、filesystem、実行時間を隔離 | exit code、stderr、timeout、health、resource metrics |
| Kafka judging | state を保存して非同期に平準化し、consumer を retry/scale | backlog、重複処理、retry failure、最終 state |
| WebSocket | realtime push に限定し、heartbeat/reconnect/接続上限を管理 | 接続数、切断率、push latency |
| JWT | signature/expiry に加えて refresh と active revoke を設計 | jti blacklist、expiry rate、拒否理由、audit |

選択は業務制約から切り離せません。処理が遅くないなら queue latency と運用コストが割に合わず、push 要件がなければ長接続は HTTP の万能な代替ではありません。

## 適用条件

- プロジェクト深掘りの準備、または resume の技術を検証可能な engineering claim に変換する。
- code/interface の事実から cache、concurrency、async、isolation の機構を導けるか評価する。
- 本番障害を、証拠収集、リスク制御、復旧、長期的な運用まで含めて議論する。
- 未出荷または未担当の能力を provisional と明示し、指標や責任を作らない。

## 不適用とリスク

- 面接の模範解答、技術 stack の一覧、個人の証拠の代用品ではありません。code/log がなければ検証待ちのモデルです。
- `NullValue` は Spring Cache と serializer 設定に依存し、一つの実装を全 Redis client に一般化できません。
- CPU 閾値、GC の解釈、Arthas/HotSwap の動作は JDK、OS、container、tool に依存します。一つの snapshot では根因を証明できません。
- `restart: always`、Kafka retry、JWT の stateless 性だけでは本番設計になりません。health check、idempotency、backlog 管理、revoke が必要です。
- プロジェクトを誇張すると、技術事実、権限境界、障害責任が矛盾します。主張を狭め、検証経路を残してください。

## 最小検証

1. 各 project highlight について entry → state/data → side effect → failure path を描き、「実装」「呼び出し」「観測」を区別する。
2. cache highlight を三状態でテストする。miss は回源、`NullValue` negative hit は回源せず、実値は hit する。その後 TTL または invalidation で新データを確認する。
3. 非破壊の排障演習を行う。load、PID/TID、stack、GC を保存し、RUNNABLE/BLOCKED/GC を分類して可逆止血の前後を検証する。
4. async/isolation component の失敗経路を検証する。重複 message、container timeout、disconnect、期限切れ token が retry、alert、recover 可能か記録する。
5. 回答の最後に未確認項目と次の実験を一つ示す。未検証の本番証拠を断言するより信頼できます。

## 証拠と不確実性

- **出典事実**：`legacy-java-internship-interview-blog-polished` は project truth から engineering への追問線と、cache、Docker、Kafka、WebSocket、JWT、CPU 排障のテーマを提供します。
- **出典事実**：`legacy-java-null-value` は負キャッシュ、placeholder object、TTL、シリアライズ、cache 抽象境界を支えます。
- **出典事実**：`legacy-java-online-performance-debug` は現場保存、PID/TID と stack、GC/Arthas 特定、制御された復旧を支えます。
- **本ページの統合**：三つの出典を「project truth → engineering mechanism → production evidence」に抽象化し、各層を観測可能な検証へ対応付けました。
- **未確認**：raw には共通 SLO、本番 metric set、version matrix、個人の code ownership の証明がありません。本ページから推測できません。

## 関連ページ

- [NullValue：キャッシュ null のプレースホルダーとシリアライズ境界](/note/java-null-value)
- [Java 本番性能トラブルシューティング：症状から証拠への最小判断木](/note/java-online-performance-debug)
- [AtomicBoolean：原子ブール状態と CAS の境界](/note/java-atomic-boolean)
- [AutoCloseable：リソース所有権と close 例外の意味](/note/java-auto-closeable)
