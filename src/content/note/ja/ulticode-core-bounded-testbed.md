---
title: "modular monolith を実験場として扱う：UltiCode Core の allowlist、timeout、close-once lifecycle"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-owner-and-facts", "ulticode-generation-attempt-fence"]
tags: [UltiCode, ModularMonolith, Lifecycle, ClassLoader, Allowlist, FailClosed, Testing, LLM]
description: "UltiCode Core の owner-context manager が opt-in、allowlist、起動上限、close-once handoff を使い、modular monolith を可逆な topology testbed に限定する方法。"
toc: true
---

> **証拠の状態**：この記事は固定コミット時点の UltiCode Core registry、owner-context manager、classloader、smoke/lifecycle test、アーキテクチャ文書に基づく。現在の実装は Core を opt-in の allowlist 駆動 experimental profile に限定しており、全 business path を覆う production modular monolith とは説明しない。

複数 module を一つの JVM に入れるとき、最初に解決すべきなのは deployment 数ではなく検証であることが多い。完全な distributed topology を起動せず、owner wiring、port contract、startup order、stop behavior を確認できるかという問題である。

しかし module ごとに ApplicationContext を作るだけでは、安全な modular monolith にはならない。child context が startup で停止することがあり、parent process が失敗にした後で background thread が resource を作ることもある。timeout path と正常 path が同時に close() する可能性もある。全 module を default 起動にすると、実験 code 自体が default topology と failure radius を変え得る。

UltiCode Core の仕組みで重要なのは、この profile を別の default runtime mode にしなかった点である。default off、明示 allowlist、bounded startup、明確な state、close-once resource handoff を持つ bounded testbed に収束させている。

## 素朴な multi-context 設計に足りないもの

最も直接的な実装は module を走査し、startup task を submit し、timeout を待ち、失敗時に context を close する方法である。

```java
for (Module module : modules) {
    executor.submit(() -> start(module));
}

if (!future.get(timeout, MILLISECONDS)) {
    context.close();
}
```

この pseudo-code には複数の race が隠れている。

- timeout 時点で background task が context を作ったか決めていない可能性。
- timeout thread と startup thread が両方 cleanup の owner だと思う可能性。
- parent が return した後、遅れてきた context が READY になる可能性。
- thread を stop しても Spring context、classloader、executor が close したとは限らない。
- package name isolation だけでは parent classpath の class 再利用を止められない。

したがって Core の難しさは「Spring Boot を複数起動する」ことではない。一つの startup attempt が作る全 resource の ownership、つまり誰が作り、誰が close し、いつ result が stale になるかを管理することである。

## 第一の境界：default では起動せず、Registry が allowlist を担う

[CoreModuleRegistry](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java) は現在 Auth と Admin を enabled、App、Submission、Notification、Search を disabled としている。CoreOwnerContextManager は core.owner-contexts.enabled の opt-in 設定にも制御され、default は false である。

この二つの switch は重複ではない。

```text
Core profile enabled?       -> experimental path に入れるか
Registry allowlist enabled? -> 起動資格を持つ owner はどれか
```

両方を満たすときだけ module が startup queue に入る。将来 owner 定義を追加しても、「module を発見した」だけで default deployment topology が変わるリスクを防ぐ。

また「全 module を default で起動し、失敗を隠す」を採用しなかった理由でもある。failure を隠すと missing dependency、port conflict、誤った scan が半可用状態になる。allowlist は範囲を明示的な安全上限として記述する。

## 第二の境界：lifecycle を state machine にする

CoreOwnerContextManager は owner context の lifecycle を明示 state で表す。

```text
DISABLED
   │ opt-in + allowlist
   ▼
STARTING ───────────────┐
   │                    │ timeout / exception
   ▼                    ▼
 READY                 FAILED
   │ stop                │ stop/cleanup
   └───────────────► STOPPED
```

state の価値は「context が non-null なら ready」という曖昧な判定を拒否することにある。dependency が足りない context を business entry point が利用可能と扱ってはいけない。timeout した owner も background task が遅れて return したことで READY に戻ってはいけない。

Core smoke test は default disabled、readiness 未準備時の 503、必要な Judge dependency がないときの fail-closed を観測可能な挙動にする。503 は business feature ではなく、「not ready」を空 response や partial success に偽装しないためのものである。

## 第三の境界：timeout は exception だけでなく close ownership を handoff する

context の起動は Spring context、thread、classloader、既に開いた connection など回収が必要な resource を作る。timeout 後に最も危険なのは、二つの executor が同時に cleanup するか、誰も cleanup しないことである。

UltiCode は TIMEOUT_CLAIMED のような atomic handoff state で、一つの startup attempt の close responsibility を三つの実行者のうち一つだけに渡す。

```text
startup attempt
       │
       ├── startAll caller completes first -> caller が close/own
       ├── timeout path wins              -> timeout path が close
       └── late callable creates context  -> late callable が close
```

一つの startup attempt の resource close 回数は 0 または 1 であるべきだ。context を作らなければ 0、作った後は必ず一つの path が一度だけ close する。正常完了、timeout 後の遅延 return、interrupt、startup 中の stop は同じ ownership handoff rule を通り、各 exception branch に勝手な close() を追加してはいけない。

これは「finally で全部 close」より狭いが信頼しやすい。finally は一つの call stack の終了時に cleanup できるだけで、別の concurrent call stack が同じ resource を引き継いだかは判断できない。

## ClassLoader は security boundary ではない

[CoreOwnerClassLoaders](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java) は parent-first strategy を使う。resource loading と module organization には役立つが、parent-first では同名 class が parent classpath から再利用され得る。これは security isolation ではなく、dependency version isolation も単独では証明しない。

実際の境界は明示的な制約にある。

- Registry allowlist が起動可能な owner を決める。
- child context は明示的な component scan 範囲を使う。
- Core profile は不要な Web、Flyway、Dubbo などの auto-start surface を閉じる。
- data source、Redis、adapter は owner-specific config を使う。
- dependency が未準備なら readiness は fail-closed する。

そのため architecture document は Core の状態を OPEN に残し、exec-jar scenario の parent-first classpath と overlapping scan の問題を記録している。起動しやすい classloader scheme を「module 間が完全に隔離された」と包んではいけない。

## なぜ独立 process に直接分けないのか

独立 process は dependency、thread、failure の isolation が強く、resource limit と release の観点でも理解しやすい。一方、cross-owner wiring を試すには network topology、registry、database、config をすべて起動する必要があり、検証コストが高い。

Core の適切な位置付けは低コストな補助面である。default distributed profile を変えずに、少数の owner を一つの JVM で起動し、context lifecycle と制御された topology combination を確認する。二つの deployment model のどちらが「進んでいるか」を競うのではなく、verification profile と production profile を分ける。

Core がすべての business HTTP/WS journey を担い、全 owner を自動 scan し、任意の data source を共有し、default startup path になるなら、もはや同じ問題ではない。独立 process、container boundary、実際の module dependency isolation を再評価すべきである。

## この設計が実際に解決すること

- **default topology が漂流しない**：Core opt-in と Registry allowlist が新 module の自動加入を防ぐ。
- **startup failure が見える**：state machine と fail-closed readiness が half-started state を成功扱いしない。
- **concurrent cleanup を説明できる**：一つの startup attempt の close responsibility に唯一の owner がいる。
- **実験コストを制御できる**：distributed default を変えず、一つの process で一部の owner wiring を検証できる。
- **test が実際の race を見る**：timeout-after-done、interrupt、startup 中の stop、thread leak に対応する test entry point がある。

解決しないのは parent classpath の dependency conflict、真の security isolation、すべての business journey、process 間 network failure、本番 traffic 下の capacity、すべての owner を embeddable module にすることだ。Core は lifecycle と topology の testbed であり、「microservice が自動で modularize される」証明ではない。

## コスト、適用条件、失敗境界

完全な distributed environment を毎回起動せず少数 module の assembly relation を素早く検証したいとき、この bounded testbed に価値がある。前提は明示的 opt-in、有限の allowlist、child context ごとの timeout、parent-first classloader が security boundary ではないことの受容である。

state machine、thread pool、resource handoff、race test、config matrix のコストが増える。module 数が多い、dependency version conflict が深刻、real network/isolation を含む test が必要な場合、一つの JVM に詰め込む方が理解コストを増やすこともある。

失敗しやすい箇所は三つある。

1. startup success だけを test し、timeout 後の遅延 return を test しないため context leak や誤った READY が生じる。
2. allowlist だけ作り、scan、data source、external client を制限しないため、cross-owner dependency を一つの process に移しただけになる。
3. Core smoke test を production validation と扱い、文書の OPEN status と未カバーの HTTP/WS journey を無視する。

## LLM/Agent system への適用

Agent runtime も複数 provider、tool plugin、task context を同時に動かすことがある。移植すべきなのは「各 plugin に classloader を与える」ことではない。experimental capability は default off、allowlist で load 資格を決め、start・cancel・timeout ごとに resource close の唯一の owner を定める三つの規則である。

特に cancel race が重要である。tool call が timeout した後、background provider が遅れて return することがある。Core の late callable と同じく、遅れた result を失効した attempt に属させ、context、connection、一時 file は一つの path だけが回収する必要がある。

## 最小検証経路

まず [CoreModuleRegistry](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java) と [CoreOwnerContextManager](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerContextManager.java) を読み、opt-in、allowlist、state、timeout を確認する。次に [CoreOwnerClassLoaders](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java) を確認し、parent-first loading を security isolation と誤読しない。最後に [CoreApplicationSmokeTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreApplicationSmokeTest.java) と [CoreOwnerContextManagerLifecycleTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreOwnerContextManagerLifecycleTest.java) を読む。

本 Core 分析は source、architecture document、test entry point の static review を行った。Core module の Maven test は再実行しておらず、smoke/lifecycle test file の存在を production execution の証明へ広げていない。確認できるのは design boundary と test intent であり、全 module の起動成功ではない。

