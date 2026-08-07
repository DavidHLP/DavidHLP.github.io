---
title: "LLM-Wiki パターン：LLM で蓄積する個人 AI ナレッジベース"
timestamp: 2026-08-07 00:00:00+00:00
series: "個人 AI ナレッジベース"
kind: concept
status: active
sources: ["karpathy-llm-wiki"]
related: ["headroom-single-port-evolution", "omp-config-and-rules-guide", "omp-headroom-persistence", "omp-hook-extension-guide"]
tags: [LLM, Knowledge Base, Wiki, RAG, Agent]
description: "DavidHLPL 個人 AI ナレッジベースの運用説明。raw、wiki、schema の三層と ingest/query/lint の流れを定義する。"
toc: true
top: 1
---

> このページはナレッジベース自身の運用方法を説明します。一次資料は [`karpathy-llm-wiki`](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md)、保守契約は [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) と [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md) です。

## 定義

LLM-Wiki パターンは、質問のたびにファイルを検索して回答を組み立て直す RAG ではありません。LLM がソースを読み、事実、概念、エンティティ、比較、そして不確実性を永続的にリンクされた Markdown ページへまとめます。

重要な違いは一つです。**wiki は複利で成長します。**

相互参照は残り、矛盾は明示され、統合ページは新しいソースに合わせて更新されます。価値のある回答はチャット履歴に消えるのではなく、wiki に戻せます。

## なぜ必要か：RAG の蓄積不足

| 観点 | 従来の RAG / ファイル投入 | LLM-Wiki |
| --- | --- | --- |
| 知識の形 | 質問時に検索する原文 | 永続的にコンパイルされた wiki |
| 統合コスト | 質問のたびに再構成 | ingest 時に統合し、更新を続ける |
| 矛盾の扱い | 何度も再発見する | ページに明示する |
| 複利性 | 多くの場合ゼロから開始 | ingest ごとにネットワークが拡大 |

RAG は必ずしも不正確なのではなく、知識が十分に蓄積されません。LLM-Wiki は整理と統合を ingest の段階へ移します。

## 三層アーキテクチャ

| 層 | 場所 | 役割 | 変更性 |
| --- | --- | --- | --- |
| Raw sources | `src/content/raw/{locale}/` | 収集した記事、論文、文書、データ | 読み取り専用 |
| Wiki | `src/content/note/{locale}/` | `concept`、`entity`、`synthesis` ページ | LLM が増分保守 |
| Schema | `KB.md`、`.claude/skills/knowledge-base.md` | 保守契約と不変条件 | ゆっくり進化 |

分離することで、証拠を上書きせず wiki を大胆に書き換えられます。重要な結論は `sources` をたどって raw に戻れる必要があります。

## 三つの操作

### Ingest（取り込み）

ソースを raw に保存し、重要な事実を確認し、wiki ページを作成・更新します。その後、相互参照、`kb-index.md`、`kb-log.md` を更新します。raw はその後編集しません。

### Query（検索・質問）

最初に目次を読み、関連 wiki と raw の証拠を確認します。原文の事実、既存の統合、現在の推論を区別して回答します。比較、判断、分析に長期的価値があれば `synthesis` ページに保存します。

### Lint（健全性検査）

矛盾、古い主張、孤児ページ、リンク切れ、根拠のない結論、目次にないページ、分割・統合すべき概念を探します。結果を次の ingest や query に変換します。

## ナビゲーションファイル

- [`kb-index.md`](/kb)：concept、entity、synthesis、raw を分類する内容指向の目次です。
- [`kb-log.md`](/kb#log)：追記専用の時系列ログです。各項目は `## [YYYY-MM-DD] 種別 | タイトル` で始まり、`grep '^## \['` で検索できます。

- 次の作業は[取り込みインボックス](/ja/jotting/kb-ingest-todo)に記録しています。

## 現在の境界と今後

このナレッジベースの正典言語は `zh-cn` です。`en` と `ja` はサイトの入口とこの説明ページの翻訳であり、独立した真実のソースではありません。

以前の運用、Java、アーキテクチャ記事は公開 wiki の一覧から外しました。再取り込みするかどうかは、所有権、重複、根拠を確認して決めます。過去に公開されていたことだけでは、安定した知識とはみなしません。

今後は次の三種類のネットワークを育てます。

1. **エンティティページ**：個人プロジェクト、ツール、フレームワーク、実行環境。
2. **概念ページ**：再利用できる方法、原理、トラブルシューティングモデル。
3. **統合ページ**：複数ソースをまたぐ比較、進化、個人の判断。
