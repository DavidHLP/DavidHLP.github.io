---
title: "MCP プロトコル時代の境界と codebase-memory-mcp v0.10.2 のグラフワークフロー"
timestamp: 2026-08-13 00:00:00+08:00
series: "OMP と Agent エンジニアリング"
kind: concept
status: active
draft: true
sources: ["mcp-codebase-memory-workflow"]
related: ["llm-wiki-pattern"]
tags: [MCP, Specification, Knowledge Graph, Code Intelligence, Workflow, Codebase Memory]
description: "MCP 2026-07-28 modern の request 単位 _meta と legacy initialize ハンドシェイクの境界とエラーコード、および codebase-memory-mcp v0.10.2 のグラフ検索ワークフロー。グラフ結果は完全性の証明ではなく、否定的結論は coverage とソースに立ち戻らなければならない。"
toc: true
---

コードグラフツールを証拠源として扱うとき、まず二つのバージョン境界を分ける。MCP 仕様 `2026-07-28`（modern）は **request 単位の stateless 宣言**に変わり、`initialize` ハンドシェイクは存在しない。一方 codebase-memory-mcp `v0.10.2` は **legacy 時代のサーバー**で、最高でも `2025-11-25` までしか対応せず、modern クライアントは直接接続できない。この二つの互換事実がワークフローの検証契約を決め、グラフツール自体の規律が結論の信頼性を決める。**グラフ結果は完全性の証明ではなく、否定的結論は coverage チェックとソースへの回帰に依拠しなければならない**。

## プロトコル時代の境界：request 単位の `_meta` と `initialize` ハンドシェイク

MCP 2026-07-28 仕様（commit `5f5440bb`）の "modern" バージョンは、接続レベルのネゴシエーションハンドシェイクを廃止し、各リクエストを自己記述型にした：

| 次元                   | legacy（2025-11-25 以前）                                                                                                       | modern（2026-07-28 以降）                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| セッション確立         | `initialize` ハンドシェイク ＋ `notifications/initialized`                                                                      | ハンドシェイクなし、`notifications/initialized` なし                                                                                      |
| バージョン／能力の宣言 | ハンドシェイク時にネゴシエーション                                                                                              | 各リクエストの `_meta` が携帯                                                                                                             |
| サーバー状態の前提     | セッション状態を許可                                                                                                            | **stateless**：同一接続の以前のリクエストから capabilities／バージョン／identity を推測することを禁止。stdio プロセスはセッションではない |
| バージョン発見         | ネゴシエーション                                                                                                                | サーバーは `server/discover` を実装しなければならない（クライアントが先に呼んでもよい）                                                   |
| 互換                   | dual-era 実装は二つの時代を同時にサポートでき、リクエスト形状で判別する（modern `_meta` なら modern、`initialize` なら legacy） | 同じ規則                                                                                                                                  |

modern の request 単位 `_meta` フィールド（`basic/index.mdx` より）：

- `io.modelcontextprotocol/protocolVersion`：**必須**。
- `io.modelcontextprotocol/clientCapabilities`：**必須**。
- `io.modelcontextprotocol/clientInfo`、`logLevel`：任意。

**エラーコードは契約ごとに区別しなければならない**：

| エラー                                 | エラーコード         | 発生条件                                                | 付随データ                                                                            |
| -------------------------------------- | -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Invalid params                         | `-32602`（HTTP 400） | 必須の `_meta` フィールドが欠落、またはリクエストが不正 | —                                                                                     |
| `MissingRequiredClientCapabilityError` | `-32021`（HTTP 400） | サーバーがクライアント未宣言の能力を必要とする          | `data.requiredCapabilities` が欠落項目を列挙                                          |
| `UnsupportedProtocolVersionError`      | `-32022`             | プロトコルバージョンの不一致                            | `data.supported` が対応バージョンを列挙し、クライアントは共通バージョンを選んで再試行 |

拡張ネゴシエーションは `capabilities.extensions`（拡張識別子 → settings オブジェクト）で行う。一方が拡張に対応しない場合、コアプロトコルの挙動にフォールバックするかエラーを返す。レスポンスの `resultType`：`"complete"` は成功、`"input_required"` はさらなる入力が必要（MRTR 多ラウンド要求）、未知の値は無効扱い、デフォルトは `"complete"`。

## v0.10.2 のプロトコル時代の帰属（決定的な互換事実）

固定コミット `b377c62a` の `src/mcp/mcp.c` は **legacy 時代（initialize ハンドシェイク）のサーバー**であり、2026-07-28 の modern サーバーではない：

- `SUPPORTED_PROTOCOL_VERSIONS[]`（第 1222–1231 行）には新しい順で `"2025-11-25"`、`"2025-06-18"`、`"2025-03-26"`、`"2024-11-05"` しかなく、**`2026-07-28` は含まれない**。
- 第 1262–1293 行の `cbm_mcp_initialize_response_for_profile` が legacy `initialize` ハンドシェイクを実装する（リクエスト引数 `protocolVersion` を読み、対応可能ならエコーし、`protocolVersion` ＋ `serverInfo` ＋ `capabilities` を返す）。第 11341 行からリクエスト分岐で `"initialize"` メソッドを処理する。
- ソースには `server/discover`、modern の request 単位 `_meta` プロトコルフィールド、`notifications/initialized` の処理は存在しない。

2026-07-28 仕様の互換マトリクスによると、"Modern client | Legacy server" の組み合わせは **Fails** である。modern クライアントは v0.10.2 に対して以下のワークフローを直接実行できない。v0.10.2 を検証するには legacy `2025-11-25` 契約（`initialize` ハンドシェイク ＋ `notifications/initialized` 通知）か、dual-era アダプターを使う必要がある。

## 最小ワークフロー：確認 → 検索 → 呼び出しチェーン → ソース → カバレッジ

上流の推奨順序は固定ソース `MCP_SERVER_INSTRUCTIONS`（第 1233 行から）に由来する。v0.10.2 は legacy サーバーなので、まず `2025-11-25` 契約でライフサイクルを完了しなければならない（または dual-era アダプター経由）。疑似呼び出し順は次の通り（本機設定を除く）：

```text
0. initialize { protocolVersion: "2025-11-25" }      # legacy ハンドシェイク：バージョン＋capabilities をネゴシエーション
1. notifications/initialized                          # 初期化完了を通知（modern 2026-07-28 にはこのステップなし）
2. list_projects                        # プロジェクトのインデックスを確認。未インデックスの場合のみ index_repository を呼ぶ
3. index_repository { repo_path }       # リポジトリが未インデックスか明示的な再構築が必要な場合のみ。レスポンスが skipped/parse_partial の欠落を報告
4. index_status { project }             # プロジェクトのヘルス＋coverage レポート（node/edge 数、root path、git context）
5. check_index_coverage { project, scopes: [...] }
                                        # metadata.generation_matches を読み、グラフとカバレッジ記録が同世代か確認
6. search_graph { project, query | name_pattern }   # シンボルを発見し、正確な qualified_name を得る
7. trace_path { function_name, project, direction: "both" }   # 呼び出し元＋呼び出し先
8. get_code_snippet { qualified_name, project }     # qualified_name で正確なソースを読む
9. check_index_coverage { project, paths: [...] }   # 参照・操作した各パスのカバレッジを確認
10. query_graph { graph: "missed" }      # 網羅的断言前の全量欠落チェック
```

ステップの要点：

- **まずインデックスの世代とヘルスを確認**：`list_projects`、`index_status` でプロジェクトの存在、インデックス状態、coverage レポートを確認する。`index_repository` はリポジトリが未インデックスの場合か、明示的な再構築が必要な場合だけ呼ぶ。`check_index_coverage` の結果も best-effort なシグナルであり、完全性の証明ではない。
- `trace_path` が 0 件を返した場合、README は明示的にまず `search_graph(name_pattern=...)` で検索してから調べるよう指示している。README の tier 契約では `search_graph` を `trace_path`、`get_code_snippet` より先に行う。
- `get_code_snippet` は読み取りツールであり検索ツールではない。ソースのコメントは明記している："First call search_graph to find the exact qualified_name, then pass it here. This is a read tool, not a search tool." 短い名前が曖昧なときは提案を返す。

## ツールパラメータ契約の早見（固定ソース `TOOLS[]` に従う）

| ツール                 | 必須                                                                      | 主要な任意・挙動                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index_repository`     | `repo_path`                                                               | `mode` 列挙 `full/moderate/fast/cross-repo-intelligence`；`persistence` はチーム共有成果物 `.codebase-memory/graph.db.zst` を書く                                                                                                                                                                                                                                                                                                                                                   |
| `search_graph`         | `project`                                                                 | `query`（BM25）がある場合 `name_pattern` は無視される；`semantic_query` は**文字列配列**でなければならない（単一文字列は型エラー）；`format` 列挙 `tree`（デフォルト）／`json`；レスポンスに `total` と `has_more` を含みページングに使う                                                                                                                                                                                                                                           |
| `trace_path`           | `function_name`、`project`                                                | `direction` 列挙 `inbound/outbound/both`（デフォルト `both`）；`depth` デフォルト 3（README は Depth 1–5 と注記）；`mode` 列挙 `calls/data_flow/cross_service`；`limit` デフォルト 100（1–5000）；`truncated:true` ＋ `next` カーソルで継続ページ、reindex 後は `cursor` が無効になり `stale_cursor` を返す；`include_tests` デフォルト false；`include_evidence` はホップごとの解析戦略（`lsp\|language_rule\|heuristic\|unresolved`）と信頼度を追加；エイリアス `trace_call_path` |
| `get_code_snippet`     | `qualified_name`、`project`                                               | `include_neighbors` デフォルト false；`coverage_note` が返る場合、coverage 規律に従って扱う                                                                                                                                                                                                                                                                                                                                                                                         |
| `check_index_coverage` | `project`；`paths`／`scopes` の少なくとも一方（両方欠落なら実行時に拒否） | `paths` ≤128 の正確なパス、`scopes` ≤32 のパスプレフィックス；`scope_limit` デフォルト 200（1–1000）；状態はファイルシステムメタデータの新しさと独立                                                                                                                                                                                                                                                                                                                                |
| `index_status`         | `project`                                                                 | `verbose` 任意；node/edge 数、root path、git context、coverage レポートを返す                                                                                                                                                                                                                                                                                                                                                                                                       |
| `query_graph`          | —                                                                         | 読み取り専用の openCypher サブセット（`MATCH`/`WHERE`/`RETURN` など）、上限 100k 行；`graph:"missed"` で完全にインデックスされていないファイルの miss graph を調べる                                                                                                                                                                                                                                                                                                                |

その他のツール：`list_projects`（インデックス済みプロジェクトの一覧）、`delete_project`、`get_graph_schema`（ノードラベル／エッジタイプ／プロパティ。README は最初に実行することを推奨）、`get_architecture`（languages/packages/routes/hotspots/clusters）、`search_code`（グラフ強化 grep、インデックス済みファイル内のみ、パターン `compact/full/files`）、`detect_changes`（git diff → 影響シンボル＋blast radius、デフォルト `inbound`）、`manage_adr`、`ingest_traces`。MCP ツールは計 15 個。

## グラフ結果 ≠ 完全性の証明

上流が繰り返し強調する境界で、否定的・網羅的結論では必ず守ること：

- `index_repository`/`index_status`："absence of a flag is NOT a completeness guarantee"——シグナルは best-effort にすぎない。
- `check_index_coverage`："indexed_no_recorded_gap is not a completeness guarantee"；`parse_partial` ファイル内の行範囲はグラフに欠けている可能性があるため、"prefer grep inside flagged ranges" とすべき。
- `get_code_snippet`：`coverage_note` が返る場合、"prefer grep there and treat the returned source as ground truth"。
- 完全にスキップされたファイル（gitignore/.cbmignore/skip-lists）は通常のグラフ結果に現れない。`not_indexed` は設計上のものであり、失敗ではない。

したがって「グラフで X が見つからない」「trace_path に呼び出し元がない」をそのまま否定的結論にはできない。まず `check_index_coverage`（`scopes`）でカバレッジ状態と欠落を確認する。ただし `indexed_no_recorded_gap` も同様に完全性の証明ではない。coverage チェックは記録された欠落を晒すだけで、「確かに完全にインデックスされている」ことを保証できない。関連範囲はソースを直接読む／grep し（`parse_partial`/`not_indexed` 領域を優先）、否定的結論の最終根拠をソース事実にする。

## 境界と未証明の内容

- 本ページは MCP `2026-07-28` 仕様と codebase-memory-mcp `v0.10.2` ツール契約の二つの固定点だけを対象とする。`2026-07-28` の authorization/transports/subscriptions の詳細は展開しない。legacy `initialize`/`notifications/initialized` シーケンスは `2025-06-18` のライフサイクルドキュメントだけを参照し、より古いバージョンとの差分を一つずつ照合していない。
- **インデックス・クエリ実験は一切実行していない**。すべての API 記述は上流 README と固定ソースの要約である。「15 tools」の数は README バッジとソース `TOOLS[]`（15 項目）から得たもので、バイナリに対する実行時列挙はしていない。`trace_path` の depth 範囲（README "Depth 1-5"）と schema のデフォルト値（3、上限は未宣言）は異なるドキュメント箇所に由来し、実行時検証はしていない。
- `semantic_query` は v0.10.2 では `search_graph` のパラメータモードであり、独立したツールではない（README の記述はやや曖昧だが、ソース `TOOLS[]` に従う）。
- v0.10.2 の実行時検証は legacy `2025-11-25` 契約で行わなければならない（まず `initialize` で `protocolVersion` をネゴシエーションし、次に `notifications/initialized` を送り、続いて `list_projects` → `index_repository` → `search_graph` → `trace_path` → `get_code_snippet` → `check_index_coverage` を進める）。この流れは modern `2026-07-28` クライアントの直接接続には適用されない。本ページはこの実行時実験を実施していない。

## 証拠と不確実性

- **情報源の事実**：`mcp-codebase-memory-workflow` スナップショットが二つの上流バージョンを固定する——MCP 仕様 tag `2026-07-28`（commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`）と codebase-memory-mcp release `v0.10.2`（commit `b377c62a4e8b7ad64ccd295e4aa88abc8d275180`）。フィールド単位の契約は仕様 mdx と `src/mcp/mcp.c` の `TOOLS[]`、`MCP_SERVER_INSTRUCTIONS`、`SUPPORTED_PROTOCOL_VERSIONS[]`（第 1222–1231 行）、`initialize` 分岐ロジック（第 11341 行から）に由来する。プロトコル時代の帰属（最高 `2025-11-25`、`2026-07-28` 不含、"Modern client | Legacy server" が Fails）は、raw が固定ソースから示す決定的事実である。
- **本ページの総合**：仕様とソースを「時代の境界 → 最小ワークフロー → 完全性の規律」という実行可能なモデルに整理する。エラーコード、必須フィールド、列挙値、generation フィールドはすべて raw から項目ごとに取った。
- **未確認**：実行時のインデックス／クエリ実験は一切ない。実際のバイナリでのツール挙動、`trace_path` の depth 上限、15 ツールの実行時列挙は未検証である。後のバージョン（二つの固定点より新しいもの）は再確認が必要。

## 関連ページ

- [LLM-Wiki パターン](/ja/note/llm-wiki-pattern)：このナレッジベースがこうしたソースを証拠駆動の wiki ページへ編纂する運用方式
