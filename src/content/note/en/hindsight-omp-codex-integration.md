---
title: "Hindsight Unified Memory Access: FastMCP Bridge and Dynamic Multi-Project Routing"
timestamp: 2026-08-23 00:00:00+08:00
series: "OMP & Agent Engineering"
kind: entity
status: active
sources: ["hindsight-local-deployment-and-agent-integration"]
related: ["hindsight-local-deployment", "hindsight-troubleshooting", "omp-config-and-rules-guide"]
tags: [Hindsight, OMP, Codex, FastMCP, MCP, DynamicRouting]
description: "Explains the FastMCP stdio bridge state machine, Git-root-adaptive dynamic Bank routing, and dual-client configuration used to give OMP and Codex unified access to Hindsight memory."
toc: true
---

This page records the bridge implementation and configuration for connecting the Vectorize Hindsight memory engine to the terminal agents **OMP (Oh-My-Pi)** and **Codex CLI**. The central improvement is **dynamic workspace routing with multi-project isolation** plus a **FastMCP stdio bridge that preserves session state**.

---

## 1. Adaptive Isolation Across Multiple Projects

In multi-project development, hard-coding one global Bank (for example, always using `ulticode`) causes memories, entities, and rules from different repositories to contaminate one another.

This solution probes the Git repository root and automatically uses the current repository name as an independent Bank identifier (such as `ulticode`, `resicache`, or `davidhlp_github_io`), providing complete physical isolation across projects.

```
Project workspace (/path/to/project-a)  ──> Git root detection ──> Bank: project_a ──> Hindsight /mcp/project_a/
Project workspace (/path/to/project-b)  ──> Git root detection ──> Bank: project_b ──> Hindsight /mcp/project_b/
```

---

## 2. Generic FastMCP Bridge (`~/.hindsight/hindsight-bridge.mjs`)

Codex CLI and some Agent child processes communicate over JSON-RPC through stdio, while Hindsight v0.9.1 exposes an HTTP Streamable FastMCP endpoint. A small local Node.js bridge is therefore needed to convert the protocol and preserve the Session ID:

```javascript
#!/usr/bin/env node
/**
 * Dynamic Multi-Project FastMCP Bridge for Hindsight
 * Resolves the Git repository root to derive the project Bank ID accurately, even from subdirectories.
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

## 3. Agent Client Configuration

> **Path configuration rule**: Node processes and environments do not automatically expand `~` in `args` paths. Use an absolute path (such as `/home/user/`) or inject the path through an environment variable.

### 1. OMP configuration (`~/.omp/agent/config.yml` and `~/.omp/agent/mcp.json`)

`~/.omp/agent/config.yml`:

```yaml
memory:
  backend: hindsight
  hindsight:
    apiUrl: http://127.0.0.1:8888
    scoping: per-project # isolate Banks by project automatically
    autoRecall: true     # retrieve and inject memory at session start
    autoRetain: true     # extract and retain memory at session end
    mentalModelsEnabled: true # enable mental models
    mentalModelAutoSeed: true # generate seed mental models automatically
    recallBudget: mid
    autolearn:
      enabled: true
      autoContinue: true
```

`~/.omp/agent/mcp.json` (replace `<USER_HOME>` with the actual absolute path):

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

### 2. Codex configuration (`~/.codex/config.toml`)

```toml
[mcp_servers.hindsight]
command = "node"
args = ["<USER_HOME>/.hindsight/hindsight-bridge.mjs"]

[mcp_servers.hindsight.env]
HINDSIGHT_API_BASE_URL = "http://127.0.0.1:8888"
# Do not hard-code HINDSIGHT_BANK_ID; the bridge routes by Git root automatically.
```

---

## 4. Verification Results and Observed Metrics

An end-to-end test was performed from real multi-module subdirectories:

```
[Write stage (Codex MCP Bridge -> GPU Fact Extraction)]
Written: "Backend uses Java 17 and Spring Boot 3.2.5 with three owner services: auth 9101, admin 9102, app 9103."
Extraction result: 3 fact entities were extracted successfully and indexed with BAAI/bge-m3.

[Query stage (OMP / Codex Recall)]
Query: "What port does the auth service use?"
Result: matched "Backend has three owner services: auth (9101), admin (9102), and app (9103)"
Metrics: reranker score 0.965, semantic score 0.668, retrieval latency 0.059s.
```

---

## 5. Evidence and Uncertainty

- **Source facts**: The pinned raw source `hindsight-local-deployment-and-agent-integration` verifies the FastMCP stdio state machine, Git toplevel detection, and end-to-end OMP/Codex retrieval.
- **Synthesis in this page**: The bridge code, dual-client configuration, and observed metrics are consolidated as an independent Entity integration specification.
- **Unconfirmed**: If a project is not initialized as a Git repository and `HINDSIGHT_BANK_ID` is not specified, the bridge falls back to the `default` partition.

---

## 6. Related Pages

- [Hindsight Local Compute Allocation and Dockerized Deployment](/note/hindsight-local-deployment)
- [Hindsight Runtime Troubleshooting Matrix and Failure Modes](/note/hindsight-troubleshooting)
- [OMP Configuration Layers and Rules Guide](/note/omp-config-and-rules-guide)
