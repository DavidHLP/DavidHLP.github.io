---
title: "ResiCache：observer のネスト実行はライフサイクル、fragment、scope token を区別しなければならない"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java バックエンド並行処理"
kind: concept
status: active
draft: true
sources: ["resicache-observer-nested-execution-contract"]
related: ["redis-jackson-java-time"]
tags: ["Java", "Observer", "ThreadLocal", "Concurrency", "Redis", "Cache", "Reentrant"]
description: "公開 ResiCache の固定コミットから、observer ライフサイクル、ロック内 fragment、per-call scope token、ThreadLocal スナップショット分離の境界を抽出し、ネスト実行での hook の二重発火や並行状態の汚染を避ける。"
toc: true
---

**結論優先**：キャッシュチェーン、同期ロック、single-flight を持つ Java システムでは、完全な `execute`、ロック内の `executeChainFragment`、observer の per-call scope token は三つの異なる概念だ。around hook の状態は今回の呼び出しが返した token とペアにして復元しなければならない。fragment はノードを進めるだけで外側のライフサイクルを開き直さない。`ThreadLocal` は現在の実行スナップショットを分離するのにだけ適し、observer の状態機械にしてはならない。

## 適用範囲

このページは公開 ResiCache `main` の固定コミット `75ed279a71b17f227c3170d738eb93e50d876c8a` に基づき、次に当てはまる：

- キャッシュ handler chain に MDC、Timer、tracing observer を追加する；
- 分散ロックや単発（single-flight）ロードの中で同じ handler chain に再入する；
- ネスト実行による重複計時、MDC リーク、future の自己待ちを調査する；
- 並行再利用に安全な observer API を設計する。

## 1. まず三つの実行境界を描く

公開 Engine の完全な実行順序は次のように単純化できる：

```text
execute(ctx)
  -> snapshot handlers
  -> observer.onChainStart(ctx)
  -> beforeNode(handler)
  -> handler.handle(ctx)
  -> afterNode(handler, result)
  -> decision: continue / skip / terminate
  -> post-process
  -> observer.onChainEnd(ctx, scopeTokens, result)
```

ロック内の fragment は次だ：

```text
executeChainFragment(context, fromHandler)
  -> 現在の snapshot から from を見つける
  -> 後続ノードだけ進める
  -> ノードレベルの before/handle/after を実行する
  -> around start/end を再実行しない
  -> post-process を実行しない
```

この二つのエントリポイントは交換できない。fragment は外側の execute の内部続行であり、独立した完全なチェーン呼び出しではない。

## 2. around hook はトークンでペアにする。共有フィールドは使わない

observer インターフェースは `onChainStart` に `scopeToken` を返させ、同じトークンを `onChainEnd` に渡す：

```java
Object token = observer.onChainStart(context);
try {
    // chain execution
} finally {
    observer.onChainEnd(context, token, result);
}
```

実際の実装では、token は今回の呼び出しで復元すべき状態を保持すべきだ。例えば：

- MDC の元の request id；
- Timer の start nanos；
- tracing span や parent context；
- ネスト深度と復元順序。

これらの値を共有 observer フィールドに書き込んではならない。`CacheContext` の型なし文字列属性に詰め込んでもいけない。observer は通常複数のスレッドに再利用される。フィールド状態はリクエスト A の後始末とリクエスト B の開始を繋いでしまう。

## 3. fragment が around hook を再発火できない理由

同期ロック handler がロック内で後続ノードを続行するとき、外側の `execute` が引き続き責任を持つのは：

- 現在の snapshot のライフサイクル；
- around hook の start/end のペア；
- 最終的な post-process；
- 最終結果と例外境界。

fragment が再び完全な `execute` を呼んだ場合の一般的な結果は：

1. MDC stamp が二重に書き込まれ、内側の終了時にもとの previous value に復元されない；
2. Timer と tracing が偽のネスト呼び出しを生む；
3. post-process が二回実行され、キャッシュ書き戻しや状態遷移が重複する；
4. observer は外側のリクエストが二回起きたと判断するが、実際はロック内の一度の続行にすぎない。

したがって fragment は「どの handler の後から続行するか」という最小エントリポイントだけを公開し、around/post-process を担わないことを明示すべきだ。

## 4. `ThreadLocal` には実行スナップショットだけを入れる

Engine は `ThreadLocal<List<CacheHandler>>` で現在スレッドの handler snapshot を保持し、fragment が外側の execute と一致する不変リストを見られるようにする。この使い方は並行呼び出し間の構造的隔離を解決する：

```java
List<CacheHandler> snapshot = List.copyOf(handlers);
CURRENT_SNAPSHOT.set(snapshot);
try {
    // execute and possibly executeChainFragment
} finally {
    CURRENT_SNAPSHOT.remove();
}
```

observer の MDC previous value、Timer start、scope token を同じ ThreadLocal スロットに入れてはならない。スナップショットは実行構造であり、token は per-call 状態であり、ライフサイクルが異なる。

将来、完全な execute の任意深度ネストをサポートするなら、明示的な execution context かスタック式 ThreadLocal を使い、各層で前の層を復元する必要がある。単一の上書き可能スロットは、現在公開されている fragment 境界だけを安全にサポートできる。

## 5. single-flight の leader/follower は分けてモデル化する

同 key の single-flight は「どのスレッドがロードを実行するか」を答える：

- 最初のスレッドが `Leader` になる；
- 同スレッド・同 key のネスト呼び出しは `Reentrant` fast path を通る；
- 他のスレッドは `Follower` になり leader の future を待つ；
- leader は finally で状態を掃除し future を完了させる。

observer は「今回のチェーン実行がどのライフサイクルイベントを経験したか」を答える。両者は互いに代替できない：

- single-flight が observer token の開始と終了を決めてはならない；
- observer が leader/follower の共有ロック状態を保持してはならない；
- reentrant fast path は自分が作った future を待ってはならない。デッドロックする。

## 最小テストマトリクス

| シナリオ | 検証すべきこと |
| --- | --- |
| 正常な完全チェーン | `onChainStart -> beforeNode -> afterNode -> onChainEnd`、start/end token が同一 |
| ロック内 fragment | 後続ノードの hook だけ。二回目の around hook なし。二回目の post-process なし |
| handler が例外を投げる | 例外は伝播し続ける。finally が `onChainEnd` を発火。失敗した handler は `afterNode` を発火しない |
| 二スレッド並行 | token、MDC previous state、snapshot が互いに汚染しない |
| 同 key ネスト | reentrant パスは自身の future を待たず、実行権を二重取得しない |

これらが最小の回帰契約だ。本番システムではキャンセル、タイムアウト、ロック失効、結果可視性のテストも補うべきだ。

## よくある誤り

- **開始時間や MDC previous value を共有フィールドに保存する**：並行呼び出しが互いに上書きする。
- **fragment が完全な execute を呼ぶ**：around hook と post-process が二重になる。
- **ThreadLocal を万能コンテキストとみなす**：ネスト層が上書きされ、例外パスでの復元が困難になる。
- **single-flight と observer を一つの層に統合する**：調整状態と観測状態が相互に汚染する。
- **observer が既定で主失敗結果を受け取る**：公開固定実装の `onChainEnd` には成功結果のプレースホルダが渡される。失敗結果が必要なら、先に明確な契約とテストを補う必要がある。

## 証拠の境界

このページは公開固定コミット内の挙動だけを約束し、未公開のローカル変更を証拠としない。ソース事実と固定コミットは [ResiCache 公開固定コミット](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a) を参照。脱感済み raw スナップショットはリポジトリの `src/content/raw/zh-cn/resicache-observer-nested-execution-contract.md` にある。
