---
title: "非同期の早期期限切れが TTL 短縮だけを行う理由：version CAS で古い task を無効化する"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java の安全性、並行性、テスト"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-business-patterns"]
tags: [ResiCache, Redis, EarlyExpiration, CAS, Concurrency]
description: "キャッシュ値の version、Redis Lua CAS、通常の miss 経路を使い、古い非同期 task が新しい cache value を変更しないようにする ResiCache の方法。"
toc: true
---

> この記事は現在のソースにある early-expiration protocol を説明する。これをバックグラウンドデータ更新とは呼ばず、テスト結果を性能や freshness SLA へ拡張しない。

キャッシュの期限が近づいたとき、よくある目的は大量のリクエストが同時に miss へ到達するのを避けることである。

```text
cache が期限に近づく
  -> 一度だけ意図的に miss を作る
  -> 後続の request に通常の load を起こさせる
  -> すべての request を同時に source へ戻さない
```

難しいのは、early expiration が非同期 task で完了する一方、その task の実行前に cache value が変わる可能性がある点である。

## 古い task が新しい値をどう傷つけるか

request の処理時に task が古い値を取得したとする。

```text
T0: Redis = value-A, version=1
T1: request が early expiration を判断し、task を submit、task は version=1 を取得
T2: business code が value-B, version=2 を書く
T3: 古い task が開始
```

古い task が key だけを覚えていて、次を実行するとする。

`EXPIRE key 5`

value-B の TTL が短縮される。新しい値は early-expiration の判断に参加していないのに、古い task によって寿命を変更される。

この bug は直ちにデータの誤りとして現れるとは限らない。しかし新しい値の cache lifetime を変え、不要な source load を増やす。

## 現在の実装は「バックグラウンドで直接 refresh」ではない

ResiCache の EarlyExpirationHandler は二つの mode を分ける。

- SYNC：early-expiration 条件を満たしたら実際の cache node を skip し、通常の load path に miss を処理させる。
- ASYNC：background task を submit し、現在の request は既に読んだ cache value を使い続ける。

ASYNC mode の task は business loader を直接呼ばない。次の小さな動作だけを行う。

> capture した cache value が現在の value であれば、TTL を 5 秒の grace period まで短縮する。

その後の本当の miss は通常の loader、single-flight、write-back path を通る。

## 現在の request が cache value を返せる理由

early-expiration handler は Redis を既に読み、結果を PrefetchDecision に入れている。

最後の ActualCacheHandler はその prefetch value を優先する。

```java
CachedValue cachedValue = prefetchDecision != null
        && prefetchDecision.prefetchedValue() instanceof CachedValue cv
        ? cv
        : null;

if (cachedValue == null) {
    Object rawValue = valueOperations.get(context.getRedisKey());
    cachedValue = rawValue instanceof CachedValue cv ? cv : null;
}
```

したがって ASYNC の意味は次の通りである。

```text
current request: 現在の cache value を返し続ける
background task: 現在の value の TTL 短縮を試みる
future request: miss 後に通常の loader path へ入る
```

これは ASYNC が、期限の近い古い value を現在の request が返すことを許すという意味でもある。現在の request が常に最新データを受け取る保証ではない。

## 二つの version は同じではない

実装には混同しやすい二つの version がある。

| field | identity |
|---|---|
| VersionEnvelope.version | serialization format version、現在は 2 |
| CachedValue.version | 一つの cache value の identity token、CAS に使用 |

format version が答えるのは次である。

`この Redis bytes をどの protocol で decode するか？`

cache value version が答えるのは次である。

`この async task が capture した value は、現在 Redis にある同じ value か？`

CachedValue.of は現在の process の System.nanoTime() で value version を生成する。startNanoTime は永続化せず、process 内の monotonic time 計算に使う。どちらも cross-process の global clock や増加 sequence と解釈してはいけない。

## task 実行前に live value を再読する

async task は最初に Redis をもう一度読む。

```java
Object rawLiveValue = valueOperations.get(redisKey);

if (rawLiveValue == null) {
    return;
}

if (!(rawLiveValue instanceof CachedValue liveValue)) {
    return;
}

long remainingTtl = liveValue.getRemainingTtl();
if (remainingTtl > 0 && remainingTtl < REFRESH_GRACE_PERIOD_SECONDS) {
    return;
}

boolean shortened =
        atomicShortenTtlIfValueUnchanged(redisKey, capturedValue);
```

保護は二層ある。

1. task は submit 時に capture した state を盲信しない。
2. TTL の変更には Redis 内の value-version CAS も必要である。

live value を読むことで、key が削除された場合や型が想定外の場合を処理できる。ただし read の直後に value が置き換わる race は解決できないため、Redis 側の atomic script が必要になる。

## Lua CAS で check と change を Redis 内に置く

source script の要点は次のように短縮できる。

```lua
local current = redis.call('get', KEYS[1])

local parsed = decode(current)
local payload = unwrap_payload(parsed)

if tostring(payload.version) == ARGV[1] then
    redis.call('expire', KEYS[1], ARGV[2])
    return 1
end

return 0
```

ARGV[1] は capture した CachedValue.version であり、top-level envelope の version ではない。

script は Redis 内で次を行う。

```text
GET
  -> JSON decode
  -> envelope / wrapper array を unwrap
  -> payload.version を比較
  -> 一致した場合だけ EXPIRE
```

そのため、次の順序で新しい value を傷つけない。

```text
old task が version=1 を capture
new request が version=2 を write
old task が Lua を実行
version 1 != version 2
0 を返し、TTL を短縮しない
```

JSON decode に失敗した場合も script は 0 を返す。現在の実装は「value がまだ一致すると証明できない」を「変更しない」と扱い、楽観的に書き込まない。

[EarlyExpirationHandler.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandler.java#L209-L260) と [EarlyExpirationScripts.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationScripts.java#L47-L66) を参照。

## なぜ background task から loader を直接呼ばないのか

直接の background refresh は積極的に見えるが、別の load protocol を導入する。

```text
background task
  -> loader を呼ぶ
  -> exception を処理
  -> synchronization lock を取得
  -> cache に write
  -> old/new value の race を処理
  -> cancel と timeout を処理
```

現在のシステムには既に single-flight、distributed lock、double-check、write-back failure 処理を含む通常の load protocol がある。

そのため現在の実装は副作用を小さくする。

```text
async task は TTL だけを短縮
  -> future request が自然に通常の miss path に入る
  -> 既存の loader protocol を再利用
```

これは「refresh を速くする」ことではなく、二つ目の loader semantics を作らない選択である。

## executor にも per-key 保護がある

ThreadPoolEarlyExpirationExecutor は次を使う。

```java
ConcurrentHashMap<String, CompletableFuture<Void>> inFlight;
```

同じ key に未完了 task があると、後続 submit は skip される。business PUT のとき ActualCacheHandler は次を呼ぶ。

```java
earlyExpirationExecutor.cancel(context.getRedisKey());
```

これにより明示的な write が古い async early-expiration task より優先される。

ただし executor の deduplication は Redis 層の CAS ではない。同一 JVM 内の重複 task を減らすだけで、thread や instance をまたぐ value identity check の代わりにはならない。

## Redis race test が実際に検証すること

現在の test は次を含む。

- version が変わらなければ TTL 短縮を許可する。
- key が削除された後、古い task が復元しない。
- 新しい value の write 後、古い task が新しい TTL を短縮しない。
- 複数回 submit した後も最新 value が変わらない。

本ラウンドでは Testcontainers で実 Redis cluster を起動し、early-expiration nested test 21 件と Redis race test 5 件を実行し、すべて通過した。

[EarlyExpirationHandlerRaceConditionIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/EarlyExpirationHandlerRaceConditionIntegrationTest.java#L125-L299) を参照。

## コストと失敗境界

この設計が解決するのは「古い async task が新しい value を変更しない」ことであり、すべての refresh 問題ではない。

- ASYNC は TTL だけを短縮し、loader が必ず実行されるとは限らない。
- 特定の時刻までに fresh data が得られる保証はない。
- 現在の request は期限直前の古い value を返す可能性がある。
- Lua script は JSON envelope、wrapper-array、payload.version の wire format に依存する。
- Redis は script が使う cjson 能力を必要とし、script と serializer は一緒に進化させる必要がある。
- CachedValue.version は equality token であり、global increment version や conflict resolution algorithm ではない。
- background exception は外側の request を汚さないよう log して飲み込むため、log と metric で refresh failure を発見する必要がある。
- TTL 短縮は一部のコストを future request へ移し、future request が loader latency を負担する可能性がある。

## 移植できる判断方法

遅延実行 task について次を問う。

1. submit 時にどの state を capture したか。
2. 実行時には object が replace または delete されていないか。
3. mutation に object identity check があるか。
4. 古い task が有効性を証明できないとき、変更を拒否するか、書き続けるか。

task が future state への一歩を作るだけなら、次を優先する。

```text
old task は制御された次の action だけを作る
  -> future request は統一 protocol に入る
  -> 実際の write で identity を再検証する
```

