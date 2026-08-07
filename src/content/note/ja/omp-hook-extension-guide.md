---
title: "OMP Hook 拡張の概念：意思決定ポイントのヒント、ハードブロック、ステータス橋渡し"
timestamp: 2026-07-25 00:00:00+08:00
series: "OMP と Agent エンジニアリング"
kind: concept
status: active
sources: ["legacy-omp-hook-extension-guide"]
related: ["headroom-single-port-evolution", "omp-config-and-rules-guide", "omp-headroom-persistence", "llm-wiki-pattern"]
tags: [Agent,OMP,Codebase,Hooks,DevOps,TUI,Plugin,Extension]
description: "OMP Hook をツール意思決定ポイントのイベント拡張として整理する。sendMessage はブロックせずソフトヒントを渡し、ハード結果は呼び出しを拒否し、setStatus は状態を UI へ橋渡しする。API の境界、mock と実セッションの検証、提案機構をセキュリティ境界にしない原則を示す。"
toc: true
---

このページは、Hook をどこに置き、何を変え、どう動作を証明するかを答える。要点はツール呼び出し直前の意思決定ポイントである。`sendMessage` は低リスクなヒントに適し、`{ block, reason }` が拒否チャネルであり、`ctx.ui.setStatus` は状態を見える UI へ公開するだけで、提案をセキュリティ強制へ変えるものではない。

## コアメカニズム

### 1. 意思決定ポイントと二つの出力チャネル

```mermaid
flowchart LR
  A[tool_call イベント] --> B[toolName/input を読む]
  B --> C{ヒントか拒否か?}
  C -- ヒント --> D[pi.sendMessage<br/>custom message]
  D --> E[return void<br/>呼び出し継続]
  C -- 明示的拒否 --> F[return {block, reason}]
  F --> G[呼び出し拒否、呼び出し元が再試行]
  H[ライフサイクル/ツールイベント] --> I[ctx.ui.setStatus]
  I --> J[Hook 状態 map] --> K[ステータス行/任意 segment]
```

| チャネル | 最小契約 | 証明できる観測結果 | 仮定してはいけない効果 |
| --- | --- | --- | --- |
| ソフトヒント | `pi.sendMessage({ customType, content, display, attribution })` の後に `void` を返す | メッセージが Agent コンテキストに入り、現在のツールは継続する | Agent が必ず従うこと、安全な操作が遮断されること |
| ハードブロック | `return { block: true, reason }`（フィールドは現行型に従う） | 現在のツール呼び出しが拒否され、呼び出し元が理由を受け取る | 誤判定が起きないこと、サーバー認可の代替になること |
| UI 状態 | `ctx.ui.setStatus(key, text)` | 状態が Hook の状態集合に入り、レンダリング対象になり得る | 必ずトップ border に表示されること、長文が切られないこと |

### 2. 拡張ライフサイクルと状態ブリッジ

- Hook ファイルは通常セッション開始時にロードされる。変更は新しいセッションで確認し、hot reload を前提にしない。
- `session_start` は探針、プロジェクトルートの検出、状態初期化に使う。`tool_call` の分類は速く、診断失敗に耐えるものにして、ツール経路を診断処理で止めない。
- `setStatus` は「イベント → 状態 map → renderer」の橋である。独立した Hook 状態行とトップ statusline segment は別の gate を持つことがある。一方に表示されないだけで API 失敗とは判断しない。
- トップ segment が閉じた ID union や preset の allowlist で制御される場合、設定だけで新しい Hook segment は作れない。これはホスト UI の能力であり、Hook 側 API ではない。
- 可視性と強制性を分離する。statusline は観測用、block 結果は一回の呼び出しを制御するもの、実際のセキュリティ境界は独立した権限または書き込みゲートである。

### 3. 安定した信号で検出する

脆い自然言語 pattern より、`toolName`、入力内のパス範囲、プロジェクトルートなど安定したフィールドを先に確認する。Hook は fail-soft にし、エラーを捕捉して記録または静かに縮退させ、通常のツールフローを壊さない。重複排除や throttling はノイズを減らすためのもので、ハードブロックの意味を変えてはならない。

## 適用条件

- Agent が特定の意思決定ポイントで弱いデフォルトツールを繰り返し選び、代替案を即時に知らせたい。
- gate、圧縮、インデックス、実行状態を UI に投影して観測したい。業務結果を偽装するためではない。
- ホストプログラムを変更せず、プロジェクトまたはセッションにイベントロジックを登録したい。
- まず合成イベントでロジックを証明し、その後新しいセッションでロードと配送を証明したい。

## 非適用とリスク

| 境界 | 失敗の兆候 | 正しい対応 |
| --- | --- | --- |
| ソフトヒントはセキュリティ制御ではない | Agent が `sendMessage` を無視し、危険な呼び出しが続く | 取り返しのつかない操作にはテスト済みの hard gate またはサーバー認可を使い、ヒントを保証とみなさない |
| Hook API はバージョン依存 | 型は通るがイベントフィールドやロード場所が変わる | 現行型宣言を確認し、新しいセッションで実イベントを観測する |
| mock は実行時証拠ではない | 合成 handler は通るが拡張がロードまたは描画されない | mock の後に実 `tool_call` と TUI 検証を行う |
| 状態行とトップ segment は別 | `setStatus` にデータがあるが期待位置に出ない | status gate、segment union/preset、renderer 経路を別々に確認する |
| UI の長さと更新予算がある | 文が省略、border が overflow、状態が古い | segment は短くし、完全な状態は独立行に残し、実端末サイズで試す |
| 検出が重い、または throw する | ツールが遅くなり、正常呼び出しにも影響する | 高速な path/field 判定、throttling、fail-soft `try/catch` を使う |

## 最小検証

```text
型/契約確認
  → mock pi に handler を登録し、正・負・エラーイベントを発火
  → 新しいセッション：実 tool_call を発火し、ヒントと通常結果を確認
  → 新しいセッション：hard-block 例を実行し、block/reason を確認
  → tmux または実端末：setStatus と目的の statusline 経路を観測
```

mock 探針では少なくとも、対象外ツールが静かであること、対象ツールが一度または throttling 規則どおりにヒントされること、エラーが外へ漏れないこと、hard 分岐が拒否を返すことを断言する。実行時の証拠にはメッセージ／状態の到達と、実際のツールまたは UI の結果の両方が必要である。export された関数を見るだけでは不十分だ。

## 証拠と不確実性

- **情報源の事実**：`legacy-omp-hook-extension-guide` は `session_start`/`tool_call`、`HookAPI.sendMessage`、`ToolCallEventResult`、`ctx.ui.setStatus`、セッション開始時のロード、mock-pi と tmux の段階的検証、statusline segment のホスト制限を記録する。
- **本ページの総合**：「意思決定への介入」と「可視性の橋渡し」を分離し、ソフトヒントを提案に限定することで、可視性をセキュリティ強制として報告しない。
- **未確認**：イベント型、`display`/`triggerTurn` のデフォルト、status gate、segment 名、hot reload はインストール済み OMP のリリースで確認する必要がある。このページは UI 位置の永続性を保証しない。

## 関連ページ

- [Headroom 単一ポート移行](/ja/note/headroom-single-port-evolution)
- [OMP 設定の階層](/ja/note/omp-config-and-rules-guide)
- [Headroom ルート永続化](/ja/note/omp-headroom-persistence)
- [LLM wiki pattern](/ja/note/llm-wiki-pattern)
