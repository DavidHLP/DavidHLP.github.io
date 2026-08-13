---
title: "Headroom 0.34 圧縮・取得契約：フィールド、モード、実エンドポイント検証"
timestamp: 2026-08-12 00:00:00+08:00
series: "OMP と Agent エンジニアリング"
kind: concept
status: active
sources: ["headroom-0-34-compress-retrieve-contract"]
related: ["llm-wiki-pattern"]
tags: [Headroom,API,Compression,CCR,Contract Testing,Agent]
description: "Headroom 0.34.0 の /v1/compress と /v1/retrieve の request、response、mode の境界を固定し、mock と実 loopback contract test が同じ schema を使う必要性を説明する。"
toc: true
---

Headroom 0.34.0 の API は、dashboard、型名、mock から推測せず、バージョン付き契約として扱う。`/v1/compress` には `model` と `messages` が必要で、圧縮統計は response のトップレベルにあり、`/v1/retrieve` は `original_content` を返す。この三点を誤っていても、実装と mock が同じ誤りを共有すればテストは成功してしまう。

## 契約の要点

### `POST /v1/compress`

```json
{
  "model": "<MODEL_NAME>",
  "messages": [
    {"role": "user", "content": "..."}
  ],
  "config": {}
}
```

非空 messages が通常の圧縮経路を通る場合、成功 response には次のトップレベルフィールドがある。

```text
messages
tokens_before
tokens_after
tokens_saved
compression_ratio
transforms_applied
transforms_summary
ccr_hashes
```

境界は次のとおりである。

- `model` または `messages` がなければ HTTP 400。
- この endpoint が読むのは `messages` である。Codex Responses の `input` 配列は先に変換する。
- `tokens_saved` はトップレベルであり、`stats` の下ではない。
- 空の message 配列は config 検証より先に fast return し、response に `transforms_summary` を含まない。業務上有効かは caller が判断する。

### `POST /v1/retrieve`

```json
{"hash": "<CCR_HASH>"}
```

成功 response は次のフィールドを含む。

```text
hash
original_content
original_tokens
original_item_count
compressed_item_count
tool_name
retrieval_count
```

`hash` がなければ HTTP 400、存在しないか期限切れなら HTTP 404。adapter は `original_content` を読み、存在しない `content` や `found` を前提にしない。

## 圧縮 mode は同じスイッチではない

| `config.mode` | Marker | Store write | 条件 |
| --- | --- | --- | --- |
| 省略 | なし | なし | デフォルト。CCR 取得ループは不要 |
| `ccr` | 条件付き | 条件付き | caller が取得 tool を注入し、loopback `/v1/retrieve` に到達できる |
| `lossy_inline` | なし | なし | lossless fold の後、残りを Kompress |
| `lossless_then_lossy` | なし | なし | `lossy_inline` の互換 alias |

`ccr_hashes` は実際に挿入した marker だけを表す。`ccr` mode でも通常の text や一般的な function message が marker を生成するとは限らない。structured tool output に対する SmartCrusher row-drop は、確認済みの marker 生成経路である。したがって「`ccr` を有効にした」ことと「`ccr_hashes` が必ず非空」を同一視しない。

## Provider cache prefix の固定

非空 messages が通常の圧縮経路に入る場合、`config.frozen_message_count` は 0 以上の整数でなければならない。provider prompt cache に入った先頭 N messages を固定し、cross-message 分析には見せながら、response では byte-for-byte で変更しない。これにより既に支払った cache prefix の書き換えを防ぐ。空の message 配列はこの検証より先に fast return する。

recent message の保護とは方向が逆である。

- `frozen_message_count` は先頭の provider-cache prefix を固定する。
- `protect_recent` は末尾側の最近の messages を保護する。

混同すると cache miss を起こすか、本来圧縮すべき古い messages を残し続ける。

## Mock が false positive を生む理由

次の三つの、内部では整合するが誤った mock 仮定が確認された。

1. `stats.tokens_saved` を読む。
2. retrieve response から `content` または `found` を読む。
3. `model` の省略を許す。

実装と mock が同じ仮定なら unit test は成功する。最小の修正は、固定 release の source から schema を抽出し、mock と loopback contract test の両方に同じ契約を課すことである。

## 最小 contract test

少なくとも次の四点を検証する。

1. `model` なしの `/v1/compress` が 400 を返す。
2. 正常 response の `tokens_saved` がトップレベルにある。
3. `/v1/retrieve` の本文フィールドが `original_content` である。
4. 実際に marker を挿入する fixture だけが、非空の `ccr_hashes` を期待する。

実 loopback endpoint を呼ぶ場合は transport 環境も分離する。一部環境では Bun `fetch` が `HTTP_PROXY` を利用し、期待どおり loopback を除外しない。test process で proxy 変数を消すか、loopback を明示的に proxy しない client を使う。そうしないと接続失敗を API 契約の失敗と誤診する。

## 適用範囲、リスク、ロールバック

本ページは `headroom-ai==0.34.0` に限定する。upgrade 後は固定 tag の source を読み直し、必須フィールド、response 階層、mode alias、CCR store 動作について同じ contract tests を再実行する。

ロールバックでデータを削除する必要はない。新しい request をデフォルトの marker-free mode に戻す。既に CCR marker を含む進行中の会話では、会話境界を越えるまで取得 tool を維持するか、新しい会話を開始してから `/v1/retrieve` に依存する tool injection を無効化する。CCR store に entry がある場合は内部ファイルを手動編集せず、Headroom の lifecycle で整理する。

## 関連ページ

- [LLM-Wiki パターン](/ja/note/llm-wiki-pattern)
