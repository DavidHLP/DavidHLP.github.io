---
title: "Hindsight 統合メモリアクセス：FastMCP ブリッジと動的マルチプロジェクトルーティング"
timestamp: 2026-08-23 00:00:00+08:00
series: "OMP と Agent エンジニアリング"
kind: entity
status: active
sources: ["hindsight-local-deployment-and-agent-integration"]
related: ["hindsight-local-deployment", "hindsight-troubleshooting", "omp-config-and-rules-guide"]
tags: [Hindsight, OMP, Codex, FastMCP, MCP, DynamicRouting]
description: "OMP と Codex が Hindsight メモリへ統合アクセスするための FastMCP stdio ブリッジ状態機械、Git ルート適応型の動的 Bank ルーティング、両クライアントの設定規約を解説する。"
toc: true
---

このページでは、Vectorize Hindsight メモリエンジンを端末エージェント **OMP (Oh-My-Pi)** と **Codex CLI** に接続するブリッジ実装と設定規約を記録する。中心となる改善は、**マルチプロジェクト適応型の分離ルーティング（Dynamic Workspace Routing）**と、セッション状態を保持する **FastMCP stdio ブリッジ**である。

---

## 1. マルチプロジェクト適応型分離

複数プロジェクトを開発するとき、グローバルな単一 Bank（例えば常に `ulticode` を使う方式）をハードコードすると、異なるコードベースのメモリ、エンティティ、ルールが互いに汚染される。

この方式は Git ルートを検出し、現在のリポジトリ名を独立した Bank 識別子（`ulticode`、`resicache`、`davidhlp_github_io` など）として自動的に使うことで、プロジェクト間の完全な物理分離を実現する。

```
プロジェクトワークスペース (/path/to/project-a)  ──> Git ルート検出 ──> Bank: project_a ──> Hindsight /mcp/project_a/
プロジェクトワークスペース (/path/to/project-b)  ──> Git ルート検出 ──> Bank: project_b ──> Hindsight /mcp/project_b/
```

---

## 2. 汎用 FastMCP ブリッジ（`~/.hindsight/hindsight-bridge.mjs`）

Codex CLI と一部の Agent 子プロセスは stdio パイプ経由で JSON-RPC 通信を行う。一方、Hindsight v0.9.1 が提供するのは HTTP ベースの Streamable FastMCP エンドポイントである。そのため、プロトコル変換と Session ID の状態保持を行う軽量なローカル Node.js ブリッジが必要になる：

```javascript
#!/usr/bin/env node
/**
 * Dynamic Multi-Project FastMCP Bridge for Hindsight
 * サブディレクトリからでも Git リポジトリルートを解決し、正確なプロジェクト Bank ID を求める。
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

## 3. Agent クライアント設定

> **パス設定規約**：Node プロセスと環境は `args` のパス内の `~` を自動展開しない。`/home/user/` のような絶対パスを使うか、環境変数から注入すること。

### 1. OMP 設定（`~/.omp/agent/config.yml` と `~/.omp/agent/mcp.json`）

`~/.omp/agent/config.yml`：

```yaml
memory:
  backend: hindsight
  hindsight:
    apiUrl: http://127.0.0.1:8888
    scoping: per-project # プロジェクトごとに Bank を自動分離
    autoRecall: true     # セッション開始時にメモリを取得して注入
    autoRetain: true     # セッション終了時にメモリを抽出して保持
    mentalModelsEnabled: true # メンタルモデルを有効化
    mentalModelAutoSeed: true # シードメンタルモデルを自動生成
    recallBudget: mid
    autolearn:
      enabled: true
      autoContinue: true
```

`~/.omp/agent/mcp.json`（`<USER_HOME>` を実際の絶対パスに置き換える）：

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

### 2. Codex 設定（`~/.codex/config.toml`）

```toml
[mcp_servers.hindsight]
command = "node"
args = ["<USER_HOME>/.hindsight/hindsight-bridge.mjs"]

[mcp_servers.hindsight.env]
HINDSIGHT_API_BASE_URL = "http://127.0.0.1:8888"
# HINDSIGHT_BANK_ID はハードコードしない。ブリッジが Git ルートで自動ルーティングする。
```

---

## 4. 検証結果と実測指標

実際のマルチモジュールサブディレクトリからエンドツーエンド検証を行った：

```
[書き込み段階（Codex MCP Bridge -> GPU Fact Extraction）]
書き込み："Backend uses Java 17 and Spring Boot 3.2.5 with three owner services: auth 9101, admin 9102, app 9103."
抽出結果：3 件の Fact エンティティの抽出に成功し、BAAI/bge-m3 でベクトル索引を作成した。

[クエリ段階（OMP / Codex Recall）]
クエリ："What port does the auth service use?"
結果："Backend has three owner services: auth (9101), admin (9102), and app (9103)" にヒットした。
指標：リランカー スコア 0.965、セマンティックスコア 0.668、検索応答時間 0.059s。
```

---

## 5. 証拠と不確実性

- **ソース事実**：固定 raw ソース `hindsight-local-deployment-and-agent-integration` に基づき、FastMCP stdio 状態機械、Git toplevel 検出、OMP/Codex のエンドツーエンド検索を検証した。
- **本ページの統合**：ブリッジコード、両クライアントの設定、実測指標を独立した Entity 接続仕様として整理した。
- **未確認**：プロジェクトが Git リポジトリとして初期化されておらず、`HINDSIGHT_BANK_ID` も指定されていない場合、ブリッジは `default` パーティションへフォールバックする。

---

## 6. 関連ページ

- [Hindsight のローカル計算資源分担と Docker コンテナ化デプロイ](/note/hindsight-local-deployment)
- [Hindsight ランタイムトラブルシューティングマトリクスと失敗モード](/note/hindsight-troubleshooting)
- [OMP 設定レイヤーとルールガイド](/note/omp-config-and-rules-guide)
