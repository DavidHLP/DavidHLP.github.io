---
title: "cache stampede に Future、distributed lock、double-check が同時に必要な理由"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java の安全性、並行性、テスト"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-business-patterns"]
tags: [ResiCache, Redis, SingleFlight, Concurrency, DistributedLock]
description: "ResiCache の load path で single-flight、distributed lock、double-check、failure result model がそれぞれ解決する問題と、保証しないことを整理する。"
toc: true
---

> この記事は過去の障害の振り返りではない。リポジトリには特定の本番障害記録がなく、以下の concurrent miss は現在のソースから復元した最小の engineering problem である。

cache miss の直接的な経路は通常次のようになる。

```text
cache を読む
  -> value がない
  -> loader を呼ぶ
  -> cache に write-back
  -> result を返す
```

同じ key に対する 100 request が同時にこの経路へ入ると、100 回の database query や remote call になり得る。cache stampede で本当に解決すべきなのは「どこに lock を加えるか」ではなく、次である。

> この load を今所有する request はどれか。他の request はどう同じ result を受け取るか。

## synchronized だけでは足りない理由

process 内 lock は一つの JVM 内の request を直列化できるが、他の instance は制約できない。

service が三つの instance に deploy されているとする。

```text
instance A: request 1 ──┐
instance A: request 2 ──┤
instance B: request 3 ──┼── すべてが同時に cache miss を発見
instance C: request 4 ──┘
```

JVM lock がまとめられるのは instance A 内の request だけであり、B と C は同時に source へ戻り得る。

distributed lock は相互排他の範囲を広げるが、別の問いには答えない。既に完了した result を waiter がどう再利用するかである。

素朴な実装は次のようになる。

```text
request 1 が distributed lock を取得し、loader を実行して release
request 2 が lock を待ち、取得後に cache を double-check
request 3 が lock を待ち、取得後に cache を double-check
```

これは重複 load を防げるが、各 waiter はなお lock contention に参加し、wait、exception propagation、timeout、reentrancy を正しく実装する必要がある。

distributed lock と process 内 Future は異なる問題を解く。

| mechanism | 解決する問題 |
|---|---|
| CompletableFuture | 一つの process 内の request が leader の result/exception を共有 |
| distributed lock | instance 間で一つの request だけが load critical section に入る |
| double-check | 本当に load する前に、wait 中に誰かが write していないか確認 |

## ResiCache の実際の call path

RedisProCache.get(key, loader) は全てを直接実装せず、LoaderOrchestrator に委譲する。

中心の branch は次のようにまとめられる。

```java
if (isBloomShortCircuited(...)) {
    return new BloomShortCircuited<>();
}

if (operation != null && operation.isSync() && syncSupport != null) {
    return executeSyncLoad(...);
}

try {
    T value = defaultLoadFn.load(key, loader);
    return new Loaded<>(value);
} catch (Throwable cause) {
    return new LoadFailed<>(cause);
}
```

重要なのは二点である。

第一に sync=true はすべての cache request の default ではなく、method-level operation metadata が選んだ経路である。

第二に load result は単純な T や exception ではない。現在の実装は次を区別する。

- BloomShortCircuited：source を load すべきでないと確定。
- Loaded：load と write-back が両方成功。
- LoadedWithWriteBackFailure：business value の load は成功したが cache write-back が失敗。
- LoadFailed：loader 自体が失敗。

[LoaderOrchestrator.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/LoaderOrchestrator.java#L74-L105) を参照。

## leader、follower、reentrant

SyncSupport は二つの process 内 structure を使う。

```java
ConcurrentMap<String, CompletableFuture<Object>> inFlight;
ThreadLocal<Set<String>> reentrantKeys;
```

key election の要点は次の通り。

```java
if (reentrantKeys.get().contains(key)) {
    return new SyncRole.Reentrant<>(loader);
}

CompletableFuture<Object> mine = new CompletableFuture<>();
CompletableFuture<Object> existing = inFlight.putIfAbsent(key, mine);

if (existing == null) {
    return new SyncRole.Leader<>(...);
}

return new SyncRole.Follower<>(...);
```

同じ key の request は三つの role のいずれかに入る。

### Leader

最初に Future を inFlight へ publish した request が leader になる。責務は次の通り。

1. distributed lock を取得。
2. double-check を実行。
3. loader を呼ぶ。
4. cache に write-back。
5. result または exception で Future を complete。
6. inFlight と thread-local state を clear。

leader の終了時は無条件の remove(key) ではなく次を使う。

```java
inFlight.remove(key, mine);
```

これにより古い leader が後から公開された新しい Future を誤って削除しない。

### Follower

後続 request は loader を呼び直さず、leader の Future を待つ。

```text
leader 成功 -> すべての follower が同じ value を受け取る
leader 失敗 -> すべての follower が同じ exception を受け取る
wait timeout -> 現在の follower が失敗
```

wait には上限がある。timeout は leader を cancel せず、loader が rollback したことも意味しない。この waiter が待つのを止めるだけである。

### Reentrant

Future 自体は reentrant ではない。leader の loader が同じ thread で同じ key を同期的に要求すると、自分の Future を待って deadlock する。

そのため current thread が key の leader role を持つ間、同じ key の nested request は reentrant fast path に入り、nested loader を直接実行する。

これは二つ目の leader election ではなく、自分自身を待つ経路を明示的に回避する動作である。

## double-check が lock 内に必要な理由

leader は lock を取得した直後に loader を呼ばず、まず cache を確認する。

```java
Cache.ValueWrapper existingValue = doubleCheckFn.apply(key);
if (existingValue != null) {
    return (T) existingValue.get();
}
```

典型的な順序は次の通り。

```text
request A                request B

cache miss を発見
distributed lock を取得
                         distributed lock を待つ
A が loader を実行
A が cache に write
lock を release
                         lock を取得
                         double-check が hit
                         loader を再実行しない
```

lock 内 double-check がなければ、B は A の完了を待った後でも loader を再実行し得る。

この check は別 instance が cache に write した場合も扱う。multi-instance system では process 内 Future は local request を merge するだけで、shared cache の再確認の代わりにはならない。

## 「load 成功だが write-back 失敗」を分ける理由

cache write-back failure と loader failure は caller にとって同じ result ではない。

例えば次の状態である。

```text
database query は成功
Redis write は失敗
```

business value は既に得られている。Redis failure を request 全体の failure と扱うと、「cache が使えない」を「business data が使えない」へ拡大する。

ResiCache は LoadedWithWriteBackFailure に二つの情報を残す。

```text
business value: 返す
write-back exception: diagnostic information として記録
```

これは availability-first の選択である。cache が復旧したとも、次の request が再び source load しないとも言わない。既に正常取得できた business result を cache failure が捨てないようにするだけである。

loader 自体が失敗した場合は LoadFailed を返し、上位層が Spring Cache の exception contract に従って処理する。

## distributed-lock backend がない場合に default fail-fast する理由

SyncSupport の起動時に distributed-lock backend がなくてもよい。application が sync=true を使わない可能性があるためである。

しかし synchronized load が実際に動くとき、single JVM synchronization へ黙って degrade しない。

```text
LockManager がない
  + local-only=false
  -> 最初の sync=true miss は即時 failure
```

明示的な設定だけが single-JVM single-flight を許可する。

```yaml
resi-cache:
  sync-lock:
    local-only: true
```

この境界は重要である。silent degradation は一見 available だが、multi-instance deployment では cross-instance synchronization があるような誤った印象を与える。

## test が実際に検証すること

現在の test は次を含む。

- 10 concurrent request が loader を一度だけ呼ぶ。
- leader exception がすべての follower に伝播する。
- 同じ key の nested call が deadlock しない。
- follower timeout。
- double-check。
- write-back failure でも business value を保持する。

本ラウンドでは JDK 21 で次の関連 test を実行した。

```bash
mise exec java@temurin-21.0.12+101.0.LTS -- \
  ./mvnw -Punit \
  -Dtest=SecureJacksonRedisSerializerTest,SecureJacksonSerializerFactoryTest,LoaderOrchestratorTest,SyncSupportSingleFlightTest \
  test
```

焦点を絞った unit suite 39 件はすべて通過した。これは選択した test scenario の protocol behavior を証明するもので、cross-datacenter、process crash、本番 failover の証明ではない。

## コストと失敗境界

この設計はすべての cache scenario に適するわけではない。

- inFlight は current JVM にしか存在せず、instance 間の exclusion は実際に使える distributed-lock backend に依存する。
- follower が timeout しても leader は動き続けられ、global exactly-once semantics を得たことにはならない。
- process crash、lock lease expiry、external side effect の retry は lock implementation と business loader が処理する必要がある。
- write-back failure 時も business value は返るが cache は miss のままで、後続 request が再び source load する可能性がある。
- loader が速く service が single instance なら、Spring Cache の default load path で十分なこともある。

## 移植できる判断方法

concurrent miss に遭遇したら次を答える。

1. 必要なのは mutual exclusion か、一回の load result の共有か。
2. 共有範囲は thread、JVM、全 instance のどれか。
3. waiter に timeout が必要か。
4. leader exception を waiter に伝えるか。
5. load は成功したが write-back が失敗したとき business value を返せるか。
6. loader に繰り返せない external side effect が含まれるか。
7. same-thread nested call が自分の Future を待つ可能性があるか。

答えがなければ、distributed lock を一つ足すだけでは通常不十分である。

