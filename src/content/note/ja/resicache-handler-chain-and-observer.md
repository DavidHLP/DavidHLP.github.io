---
title: "ResiCache の cache responsibility chain：control flow、nested fragment、observer lifecycle"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java の安全性、並行性、テスト"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-observer-nested-execution-contract", "resicache-project-overview"]
related: ["resicache", "resicache-observer-nested-execution"]
tags: [ResiCache, Java, ChainOfResponsibility, Observer, ThreadLocal, Concurrency]
description: "HandlerResult、handler snapshot、lock 内 fragment、observer scope token を使い、cache responsibility chain の control flow と lifecycle 境界を保つ ResiCache の現在の実装を分析する。"
toc: true
---

> この記事は ResiCache の現在の main@2954fff217257e9cf7c906450a75070d5e092637 のソースに基づく。過去の障害の振り返りではなく、chain abstraction 自体を価値とみなすものでもない。焦点は、現在のコードが control flow、nested execution、観測 state をどう分離するかである。

cache protection は通常一つの handler ではなく、順序を持つ複数の step である。Bloom filter、sync lock、early expiration、TTL、null value 処理、実際の Redis read/write などである。問いはすぐに「各 handler をどう書くか」から変わる。

> 一つの node が後続処理を skip するとき、他の node はどう知るのか？ lock 内で続行するとき、なぜ chain 全体を再実行してはいけないのか？ observer は start と end が同じ call に属するとどう分かるのか？

## handler を直接つなぐと、なぜすぐ制御不能になるのか

最も直接的な実装は各 handler が次の handler を呼ぶ方法である。

```text
handler A
  -> handler B
      -> handler C
```

node が少ない間は動くが、control flow が局所コードに隠れていく。

- handler が value を返したとき、それは terminate か continue か。
- 後続 node の skip と通常終了はどう違うか。
- handler を追加しても元の順序は正しいか。
- lock 内で残りを実行すると chain 全体の around hook を再度発火しないか。
- timer、MDC、tracing の開始 state を誰が復元するか。

これらを result != null、共有 field、暗黙の exception で表すと、コードは動いても review と test が難しくなる。

ResiCache の現在の実装は、handler result protocol、固定 execution order、不変 chain snapshot、observer の per-call token という四つの protocol に分けている。

## HandlerResult で result と control flow を分ける

HandlerResult は二つの field を持つ record である。

```java
public record HandlerResult(FlowControl decision, CacheResult result) {
    public static HandlerResult continueChain() { ... }
    public static HandlerResult terminate(CacheResult result) { ... }
    public static HandlerResult skipAll() { ... }
}
```

主な decision は三つある。

| decision | 意味 |
|---|---|
| CONTINUE | 現在の node が完了し、次の node を実行 |
| SKIP_ALL | 現在の result を materialize し、残りを skip |
| TERMINATE | 現在の result を materialize し、chain を終了 |

decision と result を分けることで、result の有無から「continue か」を推測せずに済む。CONTINUE は中間 result を持たないことがあり、SKIP_ALL は result を持てる。

ChainEngine の loop は decision だけで進む。

```text
CONTINUE  -> 次の node
SKIP_ALL  -> context を mark して現在の result を返す
TERMINATE -> 現在の result を返す
```

現在の実装は null の handler result も拒否し、後で NullPointerException として現れるのではなく違反 handler を示す。これは SPI 境界の input validation であり、追加の業務機能ではない。

出典：[HandlerResult.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/chain/HandlerResult.java#L14-L49)、[ChainEngine.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/ChainEngine.java#L214-L257)。

## 順序は実装詳細ではなく protocol である

現在の handler order は次の通り。

```text
BLOOM_FILTER(100)
  -> SYNC_LOCK(200)
  -> EARLY_EXPIRATION(250)
  -> TTL(300)
  -> NULL_VALUE(400)
  -> ACTUAL_CACHE(500)
```

順序が control flow を決める。

- 存在しないと確定した key は source load 前に short-circuit できる。
- sync lock は実際の cache read 前に critical section を作れる。
- early expiration は現在の request が miss path に入るか cache value を使い続けるか決める。
- ActualCacheHandler は最後に real read/write を行う。

CacheHandlerChainFactory は HandlerPriority で並べ替え、disabled config で handler を filter する。Bloom、SyncLock、EarlyExpiration、NullValue は共通の protection toggle に入り、TTL は意図的に除外される。TTL を off にすると実際の cache write の expiry boundary がなくなるからである。

新しい protection mechanism を review 可能にするには、既存 order の位置、termination semantics、toggle semantics を明示しなければならない。

代償は order による暗黙の coupling である。一つの priority を変えると後続 node の input がすべて変わり得るため、HandlerOrder を普通の constant cleanup として扱えない。

## snapshot が解決するのは concurrent rebuild であり business state ではない

chain instance は factory が cache し、構築時に handler list を sort して chain を作る。ChainEngine.execute は現在の snapshot を受け取り、current thread の ThreadLocal に置く。

```java
CURRENT_SNAPSHOT.set(snapshot);
try {
    return new ChainLifecycle(observers, snapshot, context).run();
} finally {
    CURRENT_SNAPSHOT.remove();
}
```

一つの execution が使う snapshot は immutable list である。後で factory が chain を再構築・交換しても、開始済みの call は自分の snapshot を読み、一回の execution の途中で handler list の変更を見ない。

この ThreadLocal が保持するのは、current call がどの handler structure を使うかだけである。MDC previous value、Timer start、observer token を詰め込む汎用 state bag にしてはいけない。structure snapshot と call state は lifecycle が異なる。

## lock 内の続行に fragment を使う理由

sync lock handler の責務は完全な cache chain を再実行することではなく、lock 取得後に自分の後ろの node を進めることである。

```java
CacheResult result = syncSupport.executeSync(
        lockKey,
        () -> engine.executeChainFragment(context, this),
        timeout);

return HandlerResult.terminate(result);
```

executeChainFragment は現在の snapshot で from を探し、それより後の handler だけを実行する。

完全実行と fragment の境界は次の通り。

```text
complete execute
  -> chain around start
  -> node before/handle/after
  -> post-process
  -> chain around end

in-lock fragment
  -> from より後の node の before/handle/after
  -> chain around start/end は再実行しない
  -> post-process は実行しない
```

lock 内で complete execute を呼び直すと、二つ目の around lifecycle と二回目の post-process が発生する。MDC、Timer、fired counter、tracing observer にとって、これは単なる重複 log ではなく、一つの外部 call を二つの chain call と誤記録する。

fragment は別の chain ではない。外側の call がまだ終わっていない間の内部 continuation である。

## observer は scope token で各 call を対応付ける

ChainObserver.onChainStart は token を返せ、Engine は同じ reference を対応する onChainEnd に渡す。

```java
Object token = observer.onChainStart(context);
try {
    // execute chain
} finally {
    observer.onChainEnd(context, token, result);
}
```

Engine は observer ごとに独立した slot を持つため、observer A の token が observer B に渡らない。token には次を保存できる。

- MDC の元の値。
- Timer の開始時刻。
- tracing span または親 context。
- その call だけに属する復元 state。

node-level hook も同じ原則である。onNodeStart が token を返し、finally で onNodeEnd が受け取る。handler が exception を投げても afterNode は呼ばれないが、onNodeEnd は result=null で実行される。state を回収するためであり、成功 decision を偽造するためではない。

observer hook 自体の exception は記録して隔離する。業務 handler の result を上書きさせないためである。観測の完全性を一部犠牲にし、観測 component が cache main path を汚染しないことを優先している。

現在の境界として残すべき点が一つある。ChainLifecycle の onChainEnd に渡るのは main chain の実結果ではなく CacheResult.success() である。現在の observer は引数を読まないため既存 test の意味は成立するが、将来 hit、miss、failure を区別する observer が必要なら、この contract をそのまま再利用せず interface と test を先に変更する必要がある。

## test が実際に検証すること

現在の test は次の protocol を対象にする。

- CONTINUE は複数 handler を順序どおり進める。
- TERMINATE は後続 node を呼ばない。
- SKIP_ALL は context を mark して後続を skip する。
- onChainStart と onChainEnd は対になる。
- scope token は observer ごとに分離され、そのまま返る。
- handler exception 時も onNodeEnd が実行される。
- null HandlerResult は明示的に拒否される。
- executeChainFragment は完全な chain observer を再発火しない。
- MDC observer は caller の元の値を復元する。
- Timer observer は動的 Redis key を high-cardinality label にしない。

これらが証明するのは control-flow と lifecycle contract であり、実際の production thread pool、Tracing SDK、長時間 process における observer の全挙動ではない。

## コストと失敗境界

この設計は responsibility chain を自然に拡張可能にするわけではない。

- handler order が upstream/downstream semantics を決めるため、node 追加時は隣接 node を確認する。
- ThreadLocal は current thread の同期 fragment 向けで、async thread へ自動伝播しない。
- fragment は post-process を含まないため、新しい handler が post-process に依存するか確認する。
- observer hook failure を隔離すると telemetry が欠ける可能性があり、log と metric で発見する必要がある。
- token は current call だけを対応付け、thread/process をまたぐ lifecycle は解決しない。
- 現在の chain-end observer は real main result を見られず、結果観測の拡張には新しい interface が必要である。
- 固定された二、三の step だけなら、chain より明示的な method call の方が保守しやすい場合がある。

## 移植できる判断方法

composable な processing chain を設計するとき、まず決める。

1. control flow は result が空かどうかではなく明示的な state で表されているか。
2. node order は安定した test 可能な protocol か。
3. 一回の execution は immutable snapshot を使うか。
4. nested execution は新しい外部 call か、現在の call の fragment か。
5. すべての around hook に per-call token があり、finally で回収するか。
6. observation failure は main path を止めるか、隔離するか。
7. post-process の所有者は complete execution か、特定の fragment か。

答えがなければ、handler を増やすほど暗黙の coupling が多くの file に分散する。

関連专项：[ResiCache：observer の nested execution は lifecycle、fragment、scope token を区別する](/note/resicache-observer-nested-execution)。

