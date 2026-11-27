---
{
  "archiveId": "X-1315",
  "translationKey": "legacy/note/mcp-modern-legacy-compatibility",
  "title": "MCP 协议时代兼容边界：2026-07-28 Modern 与 Legacy 握手契约",
  "en": "ENGINEERING NOTES",
  "category": "AI 工具",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "整理 MCP 2026-07-28（commit 5f5440bb）modern 无状态逐请求 _meta 与 legacy initialize 握手的协议差异、错误码契约，以及 codebase-memory-mcp v0.10.2（commit b377c62a）最高支持 2025-11-25 的兼容事实。",
  "findings": [
    "原始证据: src/content/raw/zh-cn/mcp-codebase-memory-workflow.md",
    "证据状态: 暂定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/mcp-codebase-memory-workflow.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "MCP",
    "Specification",
    "Protocol Compatibility",
    "Codebase Memory",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "mcp-codebase-memory-workflow"
  ],
  "related": [
    "mcp-codebase-memory-workflow"
  ]
}
---

当客户端按新版 MCP 规范实现而目标服务器停留在旧代协议时，工具工作流在真正调用业务方法前就会在握手契约阶段失败。本文依据固定上游规范 `2026-07-28`（commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`）与 `codebase-memory-mcp` `v0.10.2`（commit `b377c62a4e8b7ad64ccd295e4aa88abc8d275180`）源码，梳理协议时代边界、错误码以及跨时代互操作条件；`v0.10.2` 图检索最小工作流与覆盖纪律见 [MCP 协议时代边界与 codebase-memory-mcp v0.10.2 图工作流](/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow/)。

## 核心机制

### 1. 协议时代边界：逐请求 `_meta` vs `initialize` 握手

MCP `2026-07-28`（modern）取消了连接级初始化协商，改成逐请求无状态自描述：

| 维度 | legacy（`2025-11-25` 及更早） | modern（`2026-07-28` 起） |
| --- | --- | --- |
| 会话建立 | `initialize` 握手 + `notifications/initialized` | 无握手，无 `notifications/initialized` |
| 版本/能力声明 | 握手时协商 | 每个请求的 `_meta` 携带 |
| 服务器状态假设 | 允许会话状态 | **stateless**：禁止从同连接先前请求推断 capabilities/版本/身份；stdio 进程不是会话 |
| 版本发现 | 协商 | 服务器必须实现 `server/discover`（客户端可选先调用） |
| 兼容 | dual-era 实现可同时支持两种时代，按请求形态区分（modern `_meta` → modern；`initialize` → legacy） | 同一规则 |

modern 逐请求 `_meta` 字段（来自 `basic/index.mdx`）：

- `io.modelcontextprotocol/protocolVersion`：**必需**。
- `io.modelcontextprotocol/clientCapabilities`：**必需**。
- `io.modelcontextprotocol/clientInfo`、`logLevel`：可选。

扩展协商通过 `capabilities.extensions`（扩展标识 → settings 对象）传递，一方不支持时回退到核心协议行为或报错；响应 `resultType` 使用 `"complete"`（默认）或 `"input_required"`（MRTR 多轮请求），未知值视为无效。

### 2. 错误码与版本不匹配契约

| 错误 | 错误码 | 触发条件 | 附带数据 |
| --- | --- | --- | --- |
| Invalid params | `-32602`（HTTP 400） | 缺必需 `_meta` 字段，请求畸形 | — |
| `MissingRequiredClientCapabilityError` | `-32021`（HTTP 400） | 服务器需要客户端未声明的能力 | `data.requiredCapabilities` 列出缺失项 |
| `UnsupportedProtocolVersionError` | `-32022` | 协议版本不匹配 | `data.supported` 列出支持的版本，客户端选共同版本重试 |

### 3. `v0.10.2` 的源码级协议归属

固定 commit `b377c62a` 的 `src/mcp/mcp.c` 是明确的 **legacy 时代服务器**：

- `SUPPORTED_PROTOCOL_VERSIONS[]`（第 1222–1231 行）从新到旧只包含 `"2025-11-25"`、`"2025-06-18"`、`"2025-03-26"`、`"2024-11-05"`，**不含 `2026-07-28`**。
- 第 1262–1293 行 `cbm_mcp_initialize_response_for_profile` 实现 legacy `initialize` 握手（读 `protocolVersion`、命中支持列表则回显并返回 `protocolVersion` + `serverInfo` + `capabilities`），请求分发从第 11341 行起处理 `"initialize"`。
- 源码不包含 `server/discover`、modern 逐请求 `_meta` 字段或 `notifications/initialized` 的 modern 无状态契约处理。

按 2026-07-28 兼容矩阵，“Modern client | Legacy server”组合直接判定为 **Fails**。因此对接 `v0.10.2` 必须采用 legacy `2025-11-25`（`initialize` + `notifications/initialized`）或经由 dual-era 适配器转发：

```text
initialize { protocolVersion: "2025-11-25" }
  -> notifications/initialized
  -> 业务工具调用 (list_projects / search_graph / trace_path ...)
```

## 已验证与未验证边界

- **已从固定源码与规范核实的事实**：两个上游固定版本标签、`src/mcp/mcp.c` 中的版本表范围、legacy `initialize` 响应与分发位置、`_meta` 必需字段及三项核心错误码定义。
- **尚未验证的边界（需继续保留）**：
  - `2026-07-28` 的 authorization、transports 与 subscriptions 细节未展开；
  - legacy `initialize`/`notifications/initialized` 序列仅引用 `2025-06-18` 生命周期文档，未逐条比对更早版本的细节差异；
  - 本页结论基于源码与规范文档阅读，**未针对真实二进制运行过握手或 dual-era 适配器互操作实验**。

## 毕业检查

1. 在本地 stdio 或 HTTP 测试中实跑一次真实客户端对接 `codebase-memory-mcp v0.10.2` 二进制的会话，记录 `initialize` 请求/响应与 modern 直连失败错误码，替换“未执行运行时实验”状态。
2. 若升级到 `v0.10.2` 之后的版本或接入新版 MCP 客户端 SDK，重新检查 `SUPPORTED_PROTOCOL_VERSIONS[]` 与 `server/discover` 实现。
3. 如使用 dual-era 适配器，补充验证同时出现 legacy `initialize` 与 modern `_meta` 请求时的路由隔离与无状态假设是否被破坏。

## 相关页面

- [MCP 协议时代边界与 codebase-memory-mcp v0.10.2 图工作流](/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow/)
- [mcp-codebase-memory-workflow（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/mcp-codebase-memory-workflow.md)
