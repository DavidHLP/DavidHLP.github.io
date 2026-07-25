---
title: "Hook ステータスを OMP 上部バーへ：誤診からアップストリーム Patch までの全記録"
timestamp: 2026-07-25 00:00:00+08:00
series: "OMP プラグインと拡張開発"
tags: [OMP, Agent, Hooks, TUI, DevOps, Plugin, Extension]
description: "GitHub 書き込みゲート（GH-gate）のステータスを OMP の statusline に表示するというニーズから出発し、誤診の特定、設定の死角、session_name 代用案の否決、そして上流への 10 ファイル Patch 提出までに至るプロセスを技術的に詳細記録。"
toc: true
---

# Hook ステータスを OMP 上部バーへ：誤診からアップストリーム Patch までの全記録

OMP (`Oh My Pi`) の Extension Hook は `ctx.ui.setStatus(key, text)` を通じてステータステキストを発行できます。私の `github-write-gate` hook（`git push` や `gh pr create` などの書き込み操作を物理遮断するハードゲート）は、`session_start` 時に `GH-gate armed · blocks git push / gh pr / API writes` を発行していました。ここでの要求は、**このステータスを上部の statusline border に表示させること** でした。

一見シンプルな UI 修正の裏には、誤診の特定、設定スキーマの限界、回避策の否決、そして上流へのコミットが必要でした。

---

## 一、誤診：ステータスは元々表示されていた

最初の仮説は「`setStatus` が動作していない」というものでした。しかしソースコードを追跡した結果（`runner.ts` → `extension-ui-controller.ts` → `component.ts`）、データパスは正常でした。実際のレンダリング位置は **エディタ上部の独立した行** であり、`statusLine.showHookStatus`（デフォルト `true`）によって制御されていたのです（ユーザーが想定していた最上部 border 行ではありませんでした）。

### 検証手法：手動スクリーンショットに代わる headless tmux
TUI 描画の検証を自動化するため、スクリプト可能な headless tmux パイプラインを導入しました：

```bash
tmux new-session -d -s probe -x 220 -y 50 'omp' && sleep 25 \
  && tmux capture-pane -t probe -p | grep -n 'GH-gate'
tmux kill-session -t probe
```

- `-d`（detached）および 220×50 の固定サイズにより再現可能な表示を確保。
- `capture-pane -p` でプレーンテキストを得て `grep -n` で行番号を特定し、最上部 border 行か独立行かを判別。

---

## 二、設定の死角：最上部 border の segment ユニオンは閉じられている

`statusLine.leftSegments/rightSegments` は設定可能に見えますが、スキーマ層の `StatusLineSegmentId` は **24 項目の閉じた union 型** であり、`hook` 用の枠は存在しませんでした。

**結論：純粋な設定操作だけでは最上部 border に hook ステータスを注入できません。**

---

## 三、否決された回避策：`session_name` の流用

調査の中で Extension API に `setSessionName()` が存在し、デフォルト preset の `rightSegments` に `session_name` が含まれていることが判明しました。セッション名にステータスを書くことで最上部 border 右端に表示させることは可能でした。

しかし、以下の理由からこの案は否決されました：
1. **セッション選択画面の汚染**：履歴選択画面にステータス文字列が溢れる。
2. **自動命名との競合**：`session_start` 時の書き込みがユーザー権限を上書きし、後の自動命名をブロックする。
3. **冗長性**：独立行で既に表示されているため、脆弱なワークアラウンドを導入する必要がない。

---

## 四、正しい解決策：上流への `hook` segment Patch

閉じられた union 型を開くため、ネイティブな `hook` segment を追加する上流 Patch を作成しました：

| ファイル | 変更内容 |
| --- | --- |
| `settings-schema.ts` | `StatusLineSegmentId` union に `"hook"` を追加 |
| `types.ts` | `SegmentContext` に `hookStatuses: ReadonlyMap<string, string>` を注入 |
| `component.ts` | `#hookStatuses` を segment コンテキストへ自動注入 |
| `segments.ts` | `hookSegment` を新規作成（キー順ソート、ドット連結、デフォルト 32 文字切捨て） |
| `presets.ts` | デフォルト preset の `rightSegments` に `"hook"` を追加 |

### 境界値の発見：border の表示予算と切り捨て
長パスディレクトリ表示時、画面幅の制限により右端の新規 segment が消失する現象が発生しました。`segmentOptions.hook.maxLength`（デフォルト 32）を設定し、53 文字のゲートステータスを `GH-gate armed · blocks git push…` へ省略することで、高負荷表示下でも安定して描画されるようになりました。

---

## 五、ロールバックにおける注意点

パッチ適用済みのバイナリをインストールする際、`showHookStatus: false` に設定している場合、設定を元に戻さずにストックバイナリへロールバックすると、ストック版には border segment が存在しないためステータス表示が完全消失します。

正確なロールバック手順：
```bash
mv -f ~/.local/bin/omp.stock ~/.local/bin/omp
omp config set statusLine.showHookStatus true
```
