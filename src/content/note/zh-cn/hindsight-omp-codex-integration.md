---
title: "Hindsight 统一记忆接入：FastMCP 桥接与多项目动态路由"
timestamp: 2026-08-23 00:00:00+08:00
series: "OMP 与 Agent 工程"
kind: entity
status: active
sources: ["hindsight-local-deployment-and-agent-integration"]
related: ["hindsight-local-deployment", "hindsight-troubleshooting", "omp-config-and-rules-guide"]
tags: [Hindsight, OMP, Codex, FastMCP, MCP, DynamicRouting]
description: "详解 Hindsight 为 OMP 与 Codex 统一接入记忆的 FastMCP stdio 桥接状态机、Git 根目录自适应 Bank 动态路由及双端配置规范。"
toc: true
---

本篇详细记录 Vectorize Hindsight 记忆引擎接入终端智能体 **OMP (Oh-My-Pi)** 与 **Codex CLI** 的桥接实现与配置规范。核心突破在于设计了**多项目自适应隔离路由（Dynamic Workspace Routing）**与带会话状态保持的 **FastMCP stdio 桥接器**。

---

## 一、多项目自适应隔离机制

在多项目开发中，硬编码全局单一 Bank（例如固定使用 `ulticode`）会导致不同代码库的记忆、实体与规则发生上下文交叉污染。

本方案通过 Git 根目录探测逻辑，自动以当前代码仓库名作为独立 Bank 标识符（如 `ulticode`、`resicache`、`davidhlp_github_io`），实现跨项目完全物理隔离。

```
项目工作区 (/path/to/project-a)  ──> Git Root 探测 ──> Bank: project_a ──> Hindsight /mcp/project_a/
项目工作区 (/path/to/project-b)  ──> Git Root 探测 ──> Bank: project_b ──> Hindsight /mcp/project_b/
```

---

## 二、通用 FastMCP 桥接器实现 (`~/.hindsight/hindsight-bridge.mjs`)

由于 Codex CLI 及部分 Agent 子进程采用 stdio 管道方式进行 JSON-RPC 通信，而 Hindsight v0.9.1 提供的是基于 HTTP 的 Streamable FastMCP 端点，因此需要通过本地轻量 Node.js 桥接器实现协议转换与 Session ID 状态保持：

```javascript
#!/usr/bin/env node
/**
 * Dynamic Multi-Project FastMCP Bridge for Hindsight
 * Resolves Git repository root to accurately derive project bank ID even from subdirectories.
 */
import readline from "node:readline";
import path from "node:path";
import { execSync } from "node:child_process";
import fs from "node:fs";

function findProjectRoot() {
	try {
		const gitRoot = execSync("git rev-parse --show-toplevel", {
			stdio: ["pipe", "pipe", "ignore"],
			encoding: "utf-8"
		}).trim();
		if (gitRoot && fs.existsSync(gitRoot)) return gitRoot;
	} catch {}

	let curr = process.cwd();
	while (curr && curr !== path.dirname(curr)) {
		if (fs.existsSync(path.join(curr, ".git"))) return curr;
		curr = path.dirname(curr);
	}
	return process.cwd();
}

function getDynamicBankId() {
	if (process.env.HINDSIGHT_BANK_ID?.trim()) {
		return process.env.HINDSIGHT_BANK_ID.trim();
	}
	const root = findProjectRoot();
	const baseName = path.basename(root);
	if (!baseName || baseName === "/" || baseName === "." || baseName === "root") {
		return "default";
	}
	return baseName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

const BANK_ID = getDynamicBankId();
const BASE_URL = process.env.HINDSIGHT_API_BASE_URL || "http://127.0.0.1:8888";
const TARGET_URL = `${BASE_URL.replace(/\/+$/, "")}/mcp/${BANK_ID}/`;

let sessionId = null;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

rl.on("line", async (line) => {
	const trimmed = line.trim();
	if (!trimmed) return;
	try {
		const payload = JSON.parse(trimmed);
		const headers = {
			"Content-Type": "application/json",
			Accept: "application/json, text/event-stream"
		};
		if (sessionId) {
			headers["mcp-session-id"] = sessionId;
		}
		const res = await fetch(TARGET_URL, {
			method: "POST",
			headers,
			body: JSON.stringify(payload)
		});

		const returnedSessionId = res.headers.get("mcp-session-id");
		if (returnedSessionId) {
			sessionId = returnedSessionId;
		}

		const contentType = res.headers.get("content-type") || "";
		if (contentType.includes("text/event-stream")) {
			const text = await res.text();
			for (const l of text.split("\n")) {
				if (l.startsWith("data:")) {
					const data = l.slice(5).trim();
					if (data && data !== "[DONE]") {
						process.stdout.write(data + "\n");
					}
				}
			}
		} else {
			const json = await res.json();
			process.stdout.write(JSON.stringify(json) + "\n");
		}
	} catch (err) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed.id !== undefined) {
				process.stdout.write(
					JSON.stringify({
						jsonrpc: "2.0",
						id: parsed.id,
						error: {
							code: -32603,
							message: `Hindsight Bridge Error: ${err.message}`
						}
					}) + "\n"
				);
			}
		} catch {}
	}
});
```

---

## 三、Agent 客户端配置规范

> **路径配置规范**：Node 进程和环境在解析 `args` 路径时不会自动将波浪号 `~` 展开为 Home 目录。实际配置中应使用绝对路径（如 `/home/user/`）或由环境变量注入。

### 1. OMP 配置 (`~/.omp/agent/config.yml` 与 `~/.omp/agent/mcp.json`)

`~/.omp/agent/config.yml`：
```yaml
memory:
  backend: hindsight
  hindsight:
    apiUrl: http://127.0.0.1:8888
    scoping: per-project # 按项目自动分库
    autoRecall: true     # 会话开始自动检索并注入记忆
    autoRetain: true     # 会话结束自动提炼沉淀
    mentalModelsEnabled: true # 启用心智模型
    mentalModelAutoSeed: true # 自动生成种子心智模型
    recallBudget: mid
    autolearn:
      enabled: true
      autoContinue: true
```

`~/.omp/agent/mcp.json`（将 `<USER_HOME>` 替换为实际绝对路径）：
```json
{
  "mcpServers": {
    "hindsight": {
      "type": "stdio",
      "command": "node",
      "args": ["<USER_HOME>/.hindsight/hindsight-bridge.mjs"]
    }
  }
}
```

### 2. Codex 配置 (`~/.codex/config.toml`)

```toml
[mcp_servers.hindsight]
command = "node"
args = ["<USER_HOME>/.hindsight/hindsight-bridge.mjs"]

[mcp_servers.hindsight.env]
HINDSIGHT_API_BASE_URL = "http://127.0.0.1:8888"
# 注：不硬编码 HINDSIGHT_BANK_ID，由 bridge 自动按 Git 根目录探测动态路由
```

---

## 四、验证结果与实测指标

在真实多模块子目录中执行端到端实测：

```
[写入阶段 (Codex MCP Bridge -> GPU Fact Extraction)]
写入： "Backend uses Java 17 and Spring Boot 3.2.5 with three owner services: auth 9101, admin 9102, app 9103."
提炼结果： 成功提炼 3 条 Fact 实体并完成 BAAI/bge-m3 向量索引。

[查询阶段 (OMP / Codex Recall)]
查询： "What port does the auth service use?"
结果： 命中 "Backend has three owner services: auth (9101), admin (9102), and app (9103)"
指标： Reranker 得分 0.965, 语义得分 0.668, 检索响应耗时 0.059s。
```

---

## 五、证据与不确定性

- **来源事实**：基于固定 raw 来源 `hindsight-local-deployment-and-agent-integration`，验证了 FastMCP stdio 状态机、Git toplevel 探测及 OMP/Codex 端到端检索。
- **本页归纳**：将桥接代码、双端配置与实测指标沉淀为独立 Entity 接入规范。
- **未确认项**：若项目未初始化为 Git 仓库且未指定 `HINDSIGHT_BANK_ID`，桥接器将回退到 `default` 分区。

---

## 六、相关页面

- [Hindsight 本地算力分工与 Docker 容器化部署](/note/hindsight-local-deployment)
- [Hindsight 记忆系统运行时排障矩阵与失效模式](/note/hindsight-troubleshooting)
- [OMP 配置分层与规则指南](/note/omp-config-and-rules-guide)
