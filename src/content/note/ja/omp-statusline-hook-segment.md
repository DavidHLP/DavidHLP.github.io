---
title: Hook ステータスを OMP トップボーダーへ：誤診からソース Patch までの全行程
timestamp: 2026-07-25 00:00:00+08:00
series: OMP プラグインと拡張開発
tags: [OMP, Agent, Hooks, TUI, DevOps, Plugin, Extension]
description: きっかけは単純な要望だった――GitHub 書き込みゲート（GH-gate）の状態を OMP の statusline に表示したい。しかしその答えは四つの層に散らばっていた：既に動作しているが看過されていた描画チャネル、ハードコードされた segment ホワイトリスト、正しく識別された「偽の要望」、そして最終的には上流に送る五ファイルの patch。本文はこの全行程を記録する――ユーザのスクリーンショットを tmux 擬似端末によるエビデンスで置換する方法、config の行き止まりを認識する方法、session_name の相乗りを否决した理由、新しい segment を border オーバーフロー予算が最初に追い出す仕組み、そしてトランケーションがいかにそれを救うか。
toc: true
---
