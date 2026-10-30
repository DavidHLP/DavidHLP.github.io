---
title: "MCP 协议时代边界与 codebase-memory-mcp v0.10.2 图工作流"
timestamp: 2026-08-13 00:00:00+08:00
series: "OMP 与 Agent 工程"
kind: concept
status: active
sources: ["mcp-codebase-memory-workflow"]
related: ["llm-wiki-pattern"]
tags: [MCP, Specification, Knowledge Graph, Code Intelligence, Workflow, Codebase Memory]
description: "MCP 2026-07-28 modern 逐请求 _meta 与 legacy initialize 握手的边界及错误码，以及 codebase-memory-mcp v0.10.2 的图搜索工作流：图结果不等于完整性证明，负面结论必须回到 coverage 与源码。"
toc: true
---

把代码图工具当证据源时，先分清两个版本边界：MCP 规范 `2026-07-28`（modern）改为**逐请求 stateless 声明**，不再有 `initialize` 握手；而 codebase-memory-mcp `v0.10.2` 是 **legacy 时代服务器**，最高只支持 `2025-11-25`，modern 客户端无法直连。两者之间的兼容事实决定工作流用什么契约验证，而图工具本身的纪律决定结论是否可信：**图结果不等于完整性证明，负面结论必须靠 coverage 检查加源码回退**。

## 协议时代边界：逐请求 `_meta` vs `initialize` 握手

MCP 2026-07-28 规范（commit `5f5440bb`）中 "modern" 版本取消连接级协商握手，改为每个请求自描述：

| 维度           | legacy（2025-11-25 及更早）                                                                            | modern（2026-07-28 起）                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 会话建立       | `initialize` 握手 + `notifications/initialized`                                                        | 无握手，无 `notifications/initialized`                                             |
| 版本/能力声明  | 握手时协商                                                                                             | 每个请求的 `_meta` 携带                                                            |
| 服务器状态假设 | 允许会话状态                                                                                           | **stateless**：禁止从同连接先前请求推断 capabilities/版本/身份；stdio 进程不是会话 |
| 版本发现       | 协商                                                                                                   | 服务器必须实现 `server/discover`（客户端可选先调用）                               |
| 兼容           | dual-era 实现可同时支持两种时代，按请求形态区分（带 modern `_meta` 按 modern；`initialize` 按 legacy） | 同一规则                                                                           |

modern 逐请求 `_meta` 字段（来自 `basic/index.mdx`）：

- `io.modelcontextprotocol/protocolVersion`：**必需**。
- `io.modelcontextprotocol/clientCapabilities`：**必需**。
- `io.modelcontextprotocol/clientInfo`、`logLevel`：可选。

**错误码必须按契约区分**：

| 错误                                   | 错误码               | 触发条件                      | 附带数据                                              |
| -------------------------------------- | -------------------- | ----------------------------- | ----------------------------------------------------- |
| Invalid params                         | `-32602`（HTTP 400） | 缺必需 `_meta` 字段，请求畸形 | —                                                     |
| `MissingRequiredClientCapabilityError` | `-32021`（HTTP 400） | 服务器需要客户端未声明的能力  | `data.requiredCapabilities` 列出缺失项                |
| `UnsupportedProtocolVersionError`      | `-32022`             | 协议版本不匹配                | `data.supported` 列出支持的版本，客户端选共同版本重试 |

扩展协商走 `capabilities.extensions`（扩展标识 → settings 对象）；一方不支持某扩展时回退到核心协议行为或报错。响应 `resultType`：`"complete"` 表示成功，`"input_required"` 表示需要更多输入（MRTR 多轮请求），未知值视为无效，缺省按 `"complete"` 处理。

## v0.10.2 的协议时代归属（决定性兼容事实）

固定 commit `b377c62a` 的 `src/mcp/mcp.c` 是 **legacy 时代（initialize 握手）服务器**，不是 2026-07-28 modern 服务器：

- `SUPPORTED_PROTOCOL_VERSIONS[]`（第 1222–1231 行）新到旧只有 `"2025-11-25"`、`"2025-06-18"`、`"2025-03-26"`、`"2024-11-05"`，**不含 `2026-07-28`**。
- 第 1262–1293 行 `cbm_mcp_initialize_response_for_profile` 实现 legacy `initialize` 握手（读请求参数 `protocolVersion`、能支持则回显，返回 `protocolVersion` + `serverInfo` + `capabilities`）；第 11341 行起在请求分发中处理 `"initialize"` 方法。
- 源码中不存在 `server/discover`、modern `_meta` 逐请求协议字段或 `notifications/initialized` 的任何处理。

按 2026-07-28 规范的兼容矩阵，"Modern client | Legacy server" 组合结果是 **Fails**：modern 客户端无法直接对 v0.10.2 执行下面的工作流。验证 v0.10.2 必须使用 legacy `2025-11-25` 契约（`initialize` 握手 + `notifications/initialized` 通知），或经 dual-era 适配器。

## 最小工作流：确认 → 搜索 → 调用链 → 源码 → 覆盖

上游背书顺序来自固定源码 `MCP_SERVER_INSTRUCTIONS`（第 1233 行起）。v0.10.2 是 legacy 服务器，必须先按 `2025-11-25` 契约完成生命周期（或经 dual-era 适配器），伪调用顺序如下（不含本机配置）：

```text
0. initialize { protocolVersion: "2025-11-25" }      # legacy 握手：协商版本 + capabilities
1. notifications/initialized                          # 通知初始化完成（modern 2026-07-28 无此步）
2. list_projects                        # 确认项目已索引；未索引才调 index_repository
3. index_repository { repo_path }       # 仅仓库未索引或需强制刷新时；响应报告 skipped/parse_partial 缺口
4. index_status { project }             # 项目健康 + 覆盖报告（node/edge 计数、root path、git context）
5. check_index_coverage { project, scopes: [...] }
                                        # 判读 metadata.generation_matches，确认图与覆盖记录同代
6. search_graph { project, query | name_pattern }   # 发现符号，取精确 qualified_name
7. trace_path { function_name, project, direction: "both" }   # 调用者 + 被调用者
8. get_code_snippet { qualified_name, project }     # 按 qualified_name 读精确源码
9. check_index_coverage { project, paths: [...] }   # 每个引用/操作的路径都查覆盖
10. query_graph { graph: "missed" }      # 穷尽断言前的全量缺口检查
```

步骤要点：

- **先确认索引代次与健康**：用 `list_projects`、`index_status` 确认项目存在、索引状态和覆盖报告；只有仓库未索引或明确需要刷新时才调用 `index_repository`。`check_index_coverage` 的结果仍是 best-effort 信号，不是完整性证明。
- `trace_path` 返回 0 结果时，README 明确提示先用 `search_graph(name_pattern=...)` 再查；README 的 tier 契约要求先 `search_graph` 再 `trace_path`、`get_code_snippet`。
- `get_code_snippet` 是读取工具不是搜索工具：源码注释明确 "First call search_graph to find the exact qualified_name, then pass it here. This is a read tool, not a search tool." 短名歧义时返回建议。

## 工具参数契约速查（以固定源码 `TOOLS[]` 为准）

| 工具                   | 必填                                                     | 关键可选/行为                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index_repository`     | `repo_path`                                              | `mode` 枚举 `full/moderate/fast/cross-repo-intelligence`；`persistence` 写 `.codebase-memory/graph.db.zst` 团队共享工件                                                                                                                                                                                                                                                                                  |
| `search_graph`         | `project`                                                | `query`（BM25）存在时忽略 `name_pattern`；`semantic_query` 必须是**字符串数组**（单个字符串是类型错误）；`format` 枚举 `tree`（默认）/`json`；响应含 `total` 与 `has_more` 用于分页                                                                                                                                                                                                                      |
| `trace_path`           | `function_name`、`project`                               | `direction` 枚举 `inbound/outbound/both`（默认 `both`）；`depth` 默认 3（README 注 Depth 1–5）；`mode` 枚举 `calls/data_flow/cross_service`；`limit` 默认 100（1–5000）；`truncated:true` + `next` 游标续页，reindex 后 `cursor` 失效返回 `stale_cursor`；`include_tests` 默认 false；`include_evidence` 增加每跳解析策略（`lsp\|language_rule\|heuristic\|unresolved`）与置信度；别名 `trace_call_path` |
| `get_code_snippet`     | `qualified_name`、`project`                              | `include_neighbors` 默认 false；返回 `coverage_note` 时按覆盖纪律处理                                                                                                                                                                                                                                                                                                                                    |
| `check_index_coverage` | `project`；`paths`/`scopes` 至少其一（都缺则运行时拒绝） | `paths` ≤128 精确路径，`scopes` ≤32 路径前缀；`scope_limit` 默认 200（1–1000）；状态独立于文件系统元数据新鲜度                                                                                                                                                                                                                                                                                           |
| `index_status`         | `project`                                                | `verbose` 可选；返回 node/edge 计数、root path、git context 与覆盖报告                                                                                                                                                                                                                                                                                                                                   |
| `query_graph`          | —                                                        | 只读 openCypher 子集（`MATCH`/`WHERE`/`RETURN` 等），上限 100k 行；`graph:"missed"` 查未完整索引文件的 miss graph                                                                                                                                                                                                                                                                                        |

其他工具：`list_projects`（列出已索引项目）、`delete_project`、`get_graph_schema`（节点标签/边类型/属性，README 建议先运行它）、`get_architecture`（languages/packages/routes/hotspots/clusters）、`search_code`（图增强 grep，仅索引文件内，模式 `compact/full/files`）、`detect_changes`（git diff → 影响符号 + blast radius，`inbound` 默认）、`manage_adr`、`ingest_traces`。共 15 个 MCP 工具。

## 图结果 ≠ 完整性证明

上游反复强调的边界，负面/穷尽性结论必须遵守：

- `index_repository`/`index_status`："absence of a flag is NOT a completeness guarantee"——信号只是 best-effort。
- `check_index_coverage`："indexed_no_recorded_gap is not a completeness guarantee"；`parse_partial` 文件中的行范围可能缺失于图，应 "prefer grep inside flagged ranges"。
- `get_code_snippet`：返回 `coverage_note` 时 "prefer grep there and treat the returned source as ground truth"。
- 被完全跳过的文件（gitignore/.cbmignore/skip-lists）不出现在常规图结果中；`not_indexed` 是设计使然而非失败。

因此，"图里搜不到 X" 或 "trace_path 无调用者" 不能直接写成负面结论。先用 `check_index_coverage`（`scopes`）检查覆盖状态与缺口——但 `indexed_no_recorded_gap` 同样不是完整性证明，覆盖检查只能暴露已记录的缺口，不能背书"确实被完整索引"；对相关范围必须直接读/grep 源码（`parse_partial`/`not_indexed` 区域优先），以源码事实为负面结论的最终依据。

## 边界与未证明内容

- 本页仅覆盖 MCP `2026-07-28` 规范与 codebase-memory-mcp `v0.10.2` 工具契约两个固定点；`2026-07-28` 的 authorization/transports/subscriptions 细节未展开；legacy `initialize`/`notifications/initialized` 序列只引用 `2025-06-18` 生命周期文档，未逐条对照更早版本差异。
- **未运行任何索引/查询实验**：所有 API 描述均为上游 README 与固定源码摘要；"15 tools" 计数来自 README 徽章与源码 `TOOLS[]`（15 项），未对二进制做运行时枚举；`trace_path` 的 depth 范围（README "Depth 1-5"）与 schema 默认值（3，未声明上限）来自不同文档位置，未做运行时验证。
- `semantic_query` 在 v0.10.2 中是 `search_graph` 的参数模式，不是独立工具（README 行文略含糊，以源码 `TOOLS[]` 为准）。
- 运行时验证 v0.10.2 必须按 legacy `2025-11-25` 契约执行（先 `initialize` 协商 `protocolVersion`，再发送 `notifications/initialized`，随后走 `list_projects` → `index_repository` → `search_graph` → `trace_path` → `get_code_snippet` → `check_index_coverage`），且该流程不适用于 modern `2026-07-28` 客户端直连；本页未执行该运行时实验。

## 证据与不确定性

- **来源事实**：`mcp-codebase-memory-workflow` 快照固定两个上游版本——MCP 规范 tag `2026-07-28`（commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`）与 codebase-memory-mcp release `v0.10.2`（commit `b377c62a4e8b7ad64ccd295e4aa88abc8d275180`），字段级契约来自规范 mdx 与 `src/mcp/mcp.c` 的 `TOOLS[]`、`MCP_SERVER_INSTRUCTIONS`、`SUPPORTED_PROTOCOL_VERSIONS[]`（第 1222–1231 行）与 `initialize` 分发逻辑（第 11341 行起）。协议时代归属（最高 `2025-11-25`、不含 `2026-07-28`、"Modern client | Legacy server" 为 Fails）是 raw 依据固定源码给出的决定性事实。
- **本页综合**：把规范与源码整理为"时代边界 → 最小工作流 → 完整性纪律"的可执行模型；错误码、必填字段、枚举值与 generation 字段均逐条来自 raw。
- **未确认项**：没有任何运行时索引/查询实验佐证；工具行为在真实二进制上的表现、`trace_path` depth 上限、15 工具运行时枚举均未验证。后续版本（高于两个固定点）必须重新核对。

## 相关页面

- [LLM-Wiki 模式](/note/llm-wiki-pattern)：本知识库把此类来源编译为证据驱动 wiki 页的运行方式
