---
title: "MCP 2026-07-28 规范契约与 codebase-memory-mcp v0.10.2 图工作流"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-spec-and-source
sourceUrl: "https://github.com/DeusData/codebase-memory-mcp/tree/v0.10.2"
immutable: true
tags: [MCP, Specification, Knowledge Graph, Code Intelligence, Workflow]
description: "基于固定版本一手来源的字段级事实快照：MCP 2026-07-28 规范的生命周期、能力协商与 tools/resources/prompts 契约，以及 codebase-memory-mcp v0.10.2 的索引、图搜索、调用链、源码与 coverage 工具 API 与可复核工作流。不含本机配置与会话信息。"
---

# MCP 2026-07-28 规范契约与 codebase-memory-mcp v0.10.2 图工作流

本快照只记录可公开复现的字段级事实。固定点为两个上游版本：MCP 规范 tag `2026-07-28`（commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`）与 codebase-memory-mcp release `v0.10.2`（commit `b377c62a4e8b7ad64ccd295e4aa88abc8d275180`）。后续版本必须重新核对。

## 1. MCP 生命周期与能力协商（2026-07-28 规范）

规范文本来源为 `docs/specification/2026-07-28/basic/versioning.mdx` 与 `basic/index.mdx`。

- **无协商握手**：2026-07-28 及以后是 "modern" 版本，改用**逐请求声明**。每个请求的 `_meta` 必须携带 `io.modelcontextprotocol/protocolVersion`（必需）与 `io.modelcontextprotocol/clientCapabilities`（必需）；`io.modelcontextprotocol/clientInfo` 与 `logLevel` 可选。缺必需字段视为畸形请求，服务器必须以 JSON-RPC `-32602`（Invalid params）拒绝，HTTP 状态 `400`。
- **服务器不得依赖连接级状态**：协议是 stateless 的，服务器禁止从同连接先前的请求推断 capabilities/版本/身份；stdio 进程不是会话。
- **版本不匹配**：服务器返回 `UnsupportedProtocolVersionError`（`-32022`），`data.supported` 列出支持的版本；客户端选择双方共同支持的版本重试。
- **服务器必须实现 `server/discover`**：客户端可先行调用以获知支持的版本，但不是必须。
- **能力协商（extension negotiation）**：能力声明在 `capabilities`，可选扩展经 `capabilities.extensions`（扩展标识 → settings 对象）协商；一方不支持某扩展时必须回退到核心协议行为或报错。
- **未声明能力**：服务器不得依赖客户端未声明的能力；否则返回 `MissingRequiredClientCapabilityError`（`-32021`），`data.requiredCapabilities` 列出缺失项，HTTP `400`。
- **legacy 兼容**：`2025-11-25` 及更早是 "legacy"（`initialize` 握手）；"dual-era" 实现可同时支持两种时代，按请求形态区分（带 modern `_meta` 则按 modern 处理；`initialize` 则按 legacy 会话处理）。
- **响应 `resultType`**：`"complete"` 表示成功；`"input_required"` 表示需要更多输入（MRTR 多轮请求）；未知值视为无效；缺省按 `"complete"` 处理。

## 2. tools / resources / prompts 官方契约（2026-07-28）

来源：`server/tools.mdx`、`server/resources.mdx`、`server/prompts.mdx`。三类能力都要求先声明对应 capability：

| 能力 | 声明示例 | 方法 | 变更通知 |
| --- | --- | --- | --- |
| tools | `"capabilities":{"tools":{"listChanged":true}}` | `tools/list`、`tools/call` | `notifications/tools/list_changed` |
| resources | `"capabilities":{"resources":{"listChanged":true,"subscribe":true}}` | `resources/list`、`resources/read`、`resources/templates/list` | `notifications/resources/list_changed`、`notifications/resources/updated` |
| prompts | `"capabilities":{"prompts":{"listChanged":true}}` | `prompts/list`、`prompts/get` | `notifications/prompts/list_changed` |

- **Tool** 定义字段：`name`（唯一）、`title`、`description`、`icons`、`inputSchema`（JSON Schema，无 `$schema` 时默认 2020-12）。`tools/call` 响应含 `content` 与 `isError`；也允许 `resultType:"input_required"` 的 MRTR 响应。
- **Resource** 以 URI 唯一标识；`resources/read` 可返回多个 contents；模板用 RFC 6570 URI template；`subscribe` 特性通过 `subscriptions/listen` + `resourceSubscriptions` 过滤订阅单资源更新。
- **Prompt** 定义字段：`name`、`title`、`description`、`icons`、`arguments`；`prompts/get` 响应 `messages` 中的 content 类型包括 text/image/audio、`resource_link`、embedded resources。
- **信任与安全**：工具是 model-controlled 的，规范建议始终保留 human-in-the-loop（可拒绝工具调用的 UI、调用指示器、确认提示）。
- 三类 list 操作都支持分页（cursor/`nextCursor`）与缓存（`ttlMs`/`cacheScope`）。

## 3. codebase-memory-mcp v0.10.2 公开 API（固定 commit）

公开上游：`https://github.com/DeusData/codebase-memory-mcp`（MIT，纯 C，单静态二进制，SQLite 图存储）。README 与 `src/mcp/mcp.c` 的 `TOOLS[]` 表（第 375 行起）给出 15 个 MCP 工具及其 JSON Schema。

| 工具 | 用途（README / 源码描述） |
| --- | --- |
| `index_repository` | 把仓库索引进知识图；`mode` 枚举 `full/moderate/fast/cross-repo-intelligence`；响应报告 `skipped` 与 `parse_partial` 覆盖缺口 |
| `list_projects` | 列出所有已索引项目（node/edge 计数） |
| `delete_project` | 删除项目及其图数据 |
| `index_status` | 项目索引状态 + 索引覆盖报告（`parse_partial`/`skipped`/`not_indexed`） |
| `search_graph` | 结构搜索：`query`（BM25 全文）、`name_pattern`（正则）、`semantic_query`（向量）三种模式；分页 `limit`/`offset`/`has_more` |
| `trace_path` | BFS 调用链：`direction` 枚举 `inbound/outbound/both`（默认 `both`），`depth` 默认 3（README：Depth 1-5），`mode` 枚举 `calls/data_flow/cross_service`；别名 `trace_call_path` |
| `get_code_snippet` | 按 `qualified_name` 读取符号源码；短名歧义时返回建议；部分索引文件返回 `coverage_note` |
| `check_index_coverage` | 对精确仓库相对路径（`paths`，≤128）或路径前缀（`scopes`，≤32）检查权威覆盖元数据 |
| `query_graph` | 只读 openCypher 子集（`MATCH`/`WHERE`/`RETURN` 等），上限 100k 行；`graph:"missed"` 查询未完整索引文件的"miss graph" |
| `get_graph_schema` | 节点标签/边类型/属性定义（README：先运行它） |
| `get_architecture` | 概览：languages/packages/routes/hotspots/clusters（Leiden）等 |
| `search_code` | 图增强 grep（仅索引文件内）；模式 `compact/full/files` |
| `detect_changes` | git diff → 影响符号 + blast radius（`inbound` 默认） |
| `manage_adr` | Architecture Decision Record CRUD |
| `ingest_traces` | 注入运行时 trace 以验证 `HTTP_CALLS` 边 |

关键输入契约（来自固定源码 `src/mcp/mcp.c` 的 `TOOLS[]`）：

- `index_repository`：`required:["repo_path"]`；可选 `mode`、`name`（项目名覆盖）、`target_projects`、`persistence`（写 `.codebase-memory/graph.db.zst` 团队共享工件）。
- `search_graph`：`required:["project"]`；`query` 存在时忽略 `name_pattern`；`semantic_query` 必须是**字符串数组**（单个字符串是类型错误）；`format` 枚举 `tree`（默认）/`json`；响应含 `total` 与 `has_more` 用于分页。
- `trace_path`：`required:["function_name","project"]`；`limit` 默认 100（1–5000）；`truncated:true` + `next` 游标续页（`cursor` 在 reindex 后失效返回 `stale_cursor`）；`include_tests` 默认 false；`include_evidence` 增加每跳解析策略（`lsp|language_rule|heuristic|unresolved`）与置信度。
- `get_code_snippet`：`required:["qualified_name","project"]`；可选 `include_neighbors`（默认 false）；源码注释明确"First call search_graph to find the exact qualified_name, then pass it here. This is a read tool, not a search tool."
- `index_status`：`required:["project"]`；可选 `verbose`；返回 node/edge 计数、root path、git context 与覆盖报告。
- `check_index_coverage`：`required:["project"]`；`paths`/`scopes` 至少其一（都缺则运行时拒绝）；`scope_limit` 默认 200（1–1000）；返回状态独立于文件系统元数据新鲜度，含结构化解析错误范围与直接读源回退动作。

### 3.1 协议时代边界（决定性兼容事实）

固定 commit 的 `src/mcp/mcp.c` 是 **legacy 时代（initialize 握手）服务器**，不是 2026-07-28 modern 服务器：

- 第 1222–1231 行 `SUPPORTED_PROTOCOL_VERSIONS[]`（新到旧）只有：`"2025-11-25"`、`"2025-06-18"`、`"2025-03-26"`、`"2024-11-05"` —— **不含 `2026-07-28`**。
- 第 1262–1293 行 `cbm_mcp_initialize_response_for_profile` 实现 legacy `initialize` 握手：读请求参数 `protocolVersion`、能支持则回显、返回 `protocolVersion` + `serverInfo` + `capabilities`。
- 第 11341 行起在请求分发中处理 `"initialize"` 方法；源码中不存在 `server/discover`、modern `_meta` 逐请求协议字段或 `notifications/initialized` 的任何处理。

按 2026-07-28 规范的兼容矩阵（versioning.mdx），"Modern client | Legacy server" 组合结果是 **Fails**：modern 客户端无法直接对 v0.10.2 执行第 4 节的工作流。验证 v0.10.2 必须使用 legacy 2025-11-25 契约（`initialize` 握手 + `notifications/initialized` 通知），或经 dual-era 适配器。

## 4. 可复核工作流（上游背书）

固定源码 `src/mcp/mcp.c` 的 `MCP_SERVER_INSTRUCTIONS`（第 1233 行起）给出了项目自身推荐的工作流，与任务目标一致：

1. **先索引 / 确认 generation**：`list_projects` 看已索引项目；`index_repository` 只在仓库未索引或需强制刷新时调用（README tier 契约中的 "current index generation"；watched 项目后台自动刷新）；`index_status` 检查项目健康与覆盖报告。**generation 有直接字段支撑**：固定源码中 `check_index_coverage` 响应含 `signal:"best_effort"` 与 `metadata` 对象（`generation`、`index_mode`、`recorded_at`、`coverage_version`、`generation_matches` 布尔 = 项目 `indexed_at` 与覆盖元数据 `generation` 是否一致）；据此判断图与覆盖记录是否同代。
2. **图搜索**：`search_graph` 发现符号并取得精确 `qualified_name`（`trace_path` 返回 0 结果时 README 明确提示先用 `search_graph(name_pattern=...)`）。
3. **调用链**：`trace_path`（`direction="both"`）查调用者与被调用者；README 的 tier 契约要求先 `search_graph` 再 `trace_path`、`get_code_snippet`。
4. **源码片段**：`get_code_snippet` 按 `qualified_name` 读精确源码——"a read tool, not a search tool"。
5. **coverage 检查**：对每个引用或操作的路径调用 `check_index_coverage`；负面/穷尽性断言前用 `scopes` 检查；`index_status` 与 `query_graph(graph="missed")` 提供全量缺口。

**图结果不能替代源码与覆盖检查**——这是上游反复强调的边界：

- `index_repository`/`index_status`："absence of a flag is NOT a completeness guarantee"（信号只是 best-effort）。
- `check_index_coverage`："indexed_no_recorded_gap is not a completeness guarantee"；`parse_partial` 文件中的行范围构造可能缺失于图，"prefer grep inside flagged ranges"。
- `get_code_snippet`：返回 `coverage_note` 时"prefer grep there and treat the returned source as ground truth"。
- 被完全跳过的文件（gitignore/.cbmignore/skip-lists）不出现在常规图结果中，`not_indexed` 是设计使然而非失败。

## 5. 边界与未证明内容

- 本快照仅覆盖 MCP `2026-07-28` 与 codebase-memory-mcp `v0.10.2` 两个固定点；`2026-07-28` 的 authorization/transports/subscriptions 细节未展开；legacy `initialize`/`notifications/initialized` 序列仅引用 `2025-06-18` 生命周期文档（见来源列表），未逐条对照更早版本差异。
- **关键兼容事实**：v0.10.2 支持的最高协议版本是 `2025-11-25`（legacy 握手时代），不含 `2026-07-28`；因此第 4 节工作流的运行时验证必须以 2025-11-25 契约（或 dual-era 适配器）执行，不能假设 2026-07-28 modern 客户端可直接跑通。
- `semantic_query` 在 v0.10.2 中是 `search_graph` 的参数模式，不是独立工具（README Feature 段行文略含糊，以源码 `TOOLS[]` 为准）。
- "15 tools" 计数来自 README 徽章与源码 `TOOLS[]`（15 项），未对二进制做运行时枚举实验。
- `trace_path` 的 depth 范围（README "Depth 1-5"）与 schema 默认值（3，未声明上限）来自不同文档位置，未做运行时验证。
- 未运行任何索引/查询实验；所有 API 描述均为上游 README 与固定源码摘要，未复制大段第三方文本。

## 6. 来源列表（固定 URL）

- MCP spec tag `2025-06-18`（commit `f5ccad944fdf2b7d9cc70cf817f66ca5a8aa03a4`）：`https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/f5ccad944fdf2b7d9cc70cf817f66ca5a8aa03a4/docs/specification/2025-06-18/basic/lifecycle.mdx` —— 第 4 节 legacy 序列（`initialize` 握手 + `notifications/initialized`）的规范出处，与本仓库 v0.10.2 的 `initialize` 实现一致。
- MCP spec tag `2026-07-28`（commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`）：`https://github.com/modelcontextprotocol/modelcontextprotocol/tree/2026-07-28`
  - `docs/specification/2026-07-28/basic/index.mdx`（消息/statelessness/`_meta`）
  - `docs/specification/2026-07-28/basic/versioning.mdx`（生命周期/版本协商/兼容矩阵）
  - `docs/specification/2026-07-28/server/tools.mdx`、`server/resources.mdx`、`server/prompts.mdx`
- codebase-memory-mcp release `v0.10.2`（commit `b377c62a4e8b7ad64ccd295e4aa88abc8d275180`）：`https://github.com/DeusData/codebase-memory-mcp/tree/v0.10.2`
  - `README.md`（工具表、multi-agent tier、graph artifact、性能）
  - `src/mcp/mcp.c`（`TOOLS[]` 第 375 行起、`MCP_SERVER_INSTRUCTIONS` 第 1233 行起、工具分发第 10984 行起）

## 7. 验证方式

1. 从固定 tag/commit 拉取上述规范 mdx 与源码文件，核对引用的方法名、错误码（`-32602`/`-32021`/`-32022`）与字段。
2. 对固定 commit 的 `src/mcp/mcp.c` 检查 `TOOLS[]` 表的 15 项工具名与 JSON Schema 字段；确认 `trace_call_path` 是 `trace_path` 的别名（第 10999 行分发逻辑）。
3. 如需运行时验证，在隔离环境启动 `v0.10.2` 二进制，**按 legacy 2025-11-25 契约**（先 `initialize` 握手并协商 `protocolVersion`，再发送 `notifications/initialized`，随后走 `list_projects` → `index_repository(repo_path=...)` → `search_graph` → `trace_path` → `get_code_snippet` → `check_index_coverage`）走通最小样例后对照本快照；本快照未执行该步骤，且该流程不适用于 modern 2026-07-28 客户端直连。
