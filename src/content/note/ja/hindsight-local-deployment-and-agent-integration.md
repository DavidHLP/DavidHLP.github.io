---
title: "Hindsight 完全ローカルデプロイと OMP / Codex 統一メモリ連携の実践"
timestamp: 2026-08-17 20:00:00+08:00
series: "LLM と Agent エンジニアリング"
kind: concept
status: active
draft: true
sources: ["hindsight-local-deployment-and-agent-integration"]
related: ["omp-config-and-rules-guide", "mcp-codebase-memory-workflow", "llm-wiki-pattern"]
tags: [Hindsight, Memory, OMP, Codex, MCP, Ollama, ROCm, BGE-M3, Architecture, Troubleshooting]
description: "Vectorize Hindsight 記憶エンジンの完全ローカルデプロイ（AMD ROCm GPU LLM + CPU Embedding）と、OMP と Codex 向けに適応型マルチプロジェクト動的ルーティング記憶を構成するための完全な実装・深度トラブルシューティング・根本原因調査ガイドを記録する。"
toc: true
---

このページは、Linux 環境における Vectorize Hindsight 記憶システムの**実行時ローカルデプロイ**（日常の推論と記憶アクセスはすべてオフライン／ローカルモデルで賄う。初回デプロイとモデルウェイトの取得だけはネットワーク接続または事前キャッシュが必要）と、端末エージェント **OMP (Oh-My-Pi)** と **Codex CLI** にクロスツール統一記憶を提供するための実践を体系的に記録する。環境設定、プロトコル適応、デバッグ過程、および 7 つの主要な「落とし穴」の経験と予防策に重点を置く。

---

## 1. システムアーキテクチャと実行トポロジー

ローカル記憶システム全体は、計算基盤、記憶ハブ、Agent アクセス層の三つの部分で構成される。すべてのポートとトラフィックは厳密にローカルループバック（`127.0.0.1`）に限定される：

```mermaid
flowchart TD
  subgraph Agent_Layer["Agent クライアントアクセス層"]
    OMP["OMP (Oh-My-Pi)<br/>ネイティブ memory.backend: hindsight<br/>+ FastMCP stdio ブリッジ"]
    Codex["Codex CLI<br/>FastMCP stdio ブリッジ<br/>(hindsight-bridge.mjs)"]
  end

  subgraph Hindsight_Core["Hindsight 記憶ハブ (Docker)"]
    API["Hindsight Core (固定 v0.9.1)<br/>API: :8888 | UI: :9999<br/>データ永続化: $HOME/.hindsight/data"]
    FastMCP_EP["Streamable FastMCP エンドポイント<br/>/mcp/{project_bank}/"]
    PG0["組み込み pg0 (PostgreSQL + pgvector)<br/>事実抽出 / エンティティグラフ / ベクトル索引"]
  end

  subgraph Local_Inference["ローカル推論エンジン (実行時ローカル)"]
    OLLAMA["GPU LLM: Ollama ROCm (:11434)<br/>モデル: gemma4:12b (Q4_K_M GGUF)<br/>ハードウェア: AMD Radeon RX 6800/6900 XT"]
    EMBED["CPU Embedding: Local Provider<br/>モデル: BAAI/bge-m3<br/>ハードウェア: Intel CPU (マルチスレッド推論)"]
  end

  OMP -->|自動 Recall / Retain / Reflect| API
  OMP -.->|MCP ツール呼び出し| FastMCP_EP
  Codex -->|MCP JSON-RPC (stdio)| FastMCP_EP
  API --> FastMCP_EP
  API --> PG0
  API -->|LLM の事実抽出とリフレクション| OLLAMA
  API -->|ベクトル埋め込みとリランク| EMBED
```

### コア設計原則

1. **計算の精密な役割分担**：
   - **GPU は LLM に専念**：12B パラメータの `gemma4:12b`（Q4_K_M）を AMD GPU の VRAM にロードし、対話中の事実抽出（Fact Extraction）と心象モデル合成（Reflection）を専任で担当する。
   - **CPU は Embedding に専念**：`BAAI/bge-m3` を CPU で強制実行し、貴重な GPU VRAM の占有を避けて LLM コンテキスト推論の安定性を確保する。
2. **マルチプロジェクト適応型分離（Dynamic Workspace Routing）**：
   - グローバルなハードコード単一 Bank（例：`ulticode` の直書き）をやめ、Git リポジトリルートの検出メカニズムで異なるプロジェクトを専用 Bank（例：`ulticode`、`resicache`）へ自動ルーティングし、コンテキスト汚染を防ぐ。
3. **データの全ライフサイクルローカル化**：
   - すべてのベクトル、エンティティ関係、文字起こし、モデルキャッシュを `$HOME/.hindsight/` に統一的に配置する。

---

## 2. デプロイと統合の実装手順

### 1. 永続化ディレクトリの計画と権限管理

Hindsight コンテナは非 root ユーザー `hindsight`（UID 1000）で実行されるため、マウントするホストディレクトリは UID 1000 に書き込み権限があることを保証する必要がある：

```bash
mkdir -p ~/.hindsight/data ~/.hindsight/models ~/.hindsight/ollama

# 推奨される安全な権限設定：データ・モデルディレクトリの所有権をコンテナの UID 1000 に付与する（またはコンテナのユーザーグループに書き込み権限を設定する）
sudo chown -R 1000:1000 ~/.hindsight/data ~/.hindsight/models
chmod -R u+rwX,g+rwX ~/.hindsight/data ~/.hindsight/models
```

### 2. Docker Compose オーケストレーション設定 (`~/.hindsight/docker-compose.yml`)

> **注意**：Compose ファイル内では、ホストパスに `${HOME}` または絶対パスを使用すること。非対話環境で Shell のチルダ `~` 展開に依存しないためである。

```yaml
services:
  # GPU LLM サービス：Ollama ROCm でモデルをロードする
  ollama-gpu:
    image: ollama/ollama:rocm
    container_name: hindsight-ollama-gpu
    restart: unless-stopped
    ports:
      - "127.0.0.1:11434:11434"
    environment:
      - HSA_OVERRIDE_GFX_VERSION=10.3.0  # AMD RDNA2 (gfx1030)
      - ROCR_VISIBLE_DEVICES=0
      - OLLAMA_KEEP_ALIVE=-1
    devices:
      - "/dev/kfd:/dev/kfd"
      - "/dev/dri:/dev/dri"
    volumes:
      - ${HOME}/.hindsight/ollama:/root/.ollama
      - ${HOME}/.hindsight/models:/models:ro

  # Hindsight コアサーバー (Vectorize.io 固定バージョン)
  hindsight:
    image: ghcr.io/vectorize-io/hindsight:v0.9.1
    container_name: hindsight-server
    restart: unless-stopped
    ports:
      - "127.0.0.1:8888:8888"   # API & MCP エンドポイント
      - "127.0.0.1:9999:9999"   # Web UI コンソール
    environment:
      # --- LLM ドライバー (GPU) ---
      - HINDSIGHT_API_LLM_PROVIDER=ollama
      - HINDSIGHT_API_LLM_BASE_URL=http://ollama-gpu:11434/v1
      - HINDSIGHT_API_LLM_MODEL=gemma4:12b
      # --- Embedding ドライバー (CPU) ---
      - HINDSIGHT_API_EMBEDDINGS_PROVIDER=local
      - HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL=BAAI/bge-m3
      - HINDSIGHT_API_EMBEDDINGS_LOCAL_FORCE_CPU=true
      # --- モデルウェイト取得設定（初回取得はネットワーク必要、事前キャッシュ後はオフライン可能） ---
      - HF_ENDPOINT=https://huggingface.co
      - HINDSIGHT_API_LOG_LEVEL=info
    volumes:
      - ${HOME}/.hindsight/data:/home/hindsight/.pg0
      - ${HOME}/.hindsight/models:/home/hindsight/.cache/huggingface
    depends_on:
      - ollama-gpu
```

### 3. GGUF モデルのインポートとエイリアス登録

`~/.hindsight/models/Modelfile` を作成する：
```dockerfile
FROM /models/gemma-4-12b-it-Q4_K_M.gguf
TEMPLATE """{{ if .System }}<start_of_turn>system
{{ .System }}<end_of_turn>
{{ end }}{{ if .Prompt }}<start_of_turn>user
{{ .Prompt }}<end_of_turn>
{{ end }}<start_of_turn>model
{{ .Response }}<end_of_turn>
"""
PARAMETER stop "<start_of_turn>"
PARAMETER stop "<end_of_turn>"
PARAMETER num_ctx 8192
```

インポートして検証する：
```bash
docker exec -i hindsight-ollama-gpu ollama create gemma4:12b -f /models/Modelfile
docker exec hindsight-ollama-gpu ollama list
```

### 4. 動的マルチプロジェクト FastMCP ブリッジ (`~/.hindsight/hindsight-bridge.mjs`)

stdio クライアント（Codex CLI や OMP サブエージェントなど）が HTTP FastMCP に接続し、現在の Git リポジトリに基づいて Bank を自動ルーティングできるように、汎用ブリッジスクリプトを作成した：

```javascript
#!/usr/bin/env node
/**
 * Dynamic Multi-Project FastMCP Bridge for Hindsight
 * Resolves Git repository root to accurately derive project bank ID even from subdirectories.
 */
import readline from 'node:readline';
import path from 'node:path';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

function findProjectRoot() {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
    if (gitRoot && fs.existsSync(gitRoot)) return gitRoot;
  } catch {}

  let curr = process.cwd();
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, '.git'))) return curr;
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
  if (!baseName || baseName === '/' || baseName === '.' || baseName === 'root') {
    return 'default';
  }
  return baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

const BANK_ID = getDynamicBankId();
const BASE_URL = process.env.HINDSIGHT_API_BASE_URL || 'http://127.0.0.1:8888';
const TARGET_URL = `${BASE_URL.replace(/\/+$/, '')}/mcp/${BANK_ID}/`;

let sessionId = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const payload = JSON.parse(trimmed);
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;

    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const returnedSessionId = res.headers.get('mcp-session-id');
    if (returnedSessionId) sessionId = returnedSessionId;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const text = await res.text();
      for (const l of text.split('\n')) {
        if (l.startsWith('data:')) {
          const data = l.slice(5).trim();
          if (data && data !== '[DONE]') process.stdout.write(data + '\n');
        }
      }
    } else {
      const json = await res.json();
      process.stdout.write(JSON.stringify(json) + '\n');
    }
  } catch (err) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id !== undefined) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: parsed.id,
            error: { code: -32603, message: `Hindsight Bridge Error: ${err.message}` },
          }) + '\n'
        );
      }
    } catch {}
  }
});
```

### 5. OMP と Codex のクライアント接続設定

> **パスの注意**：Node プロセスとネイティブクライアントは `args` のパスを解決するとき、チルダ `~` を自動的に Home ディレクトリへ展開しない。実際の設定では実際の絶対パス（例：`/home/<username>/.hindsight/hindsight-bridge.mjs`）または環境固有の変数を使用すること。

#### OMP 設定 (`~/.omp/agent/config.yml` と `~/.omp/agent/mcp.json`)
```yaml
# config.yml
memory:
  backend: hindsight

hindsight:
  apiUrl: http://127.0.0.1:8888
  scoping: per-project                  # プロジェクトごとに独立した Bank を自動割り当てし、Codex 側と揃える
  autoRecall: true                      # セッション初回で自動クエリして記憶を注入する
  autoRetain: true                      # セッション終了時に自動で抽出・沈殿する
  mentalModelsEnabled: true             # 心象モデルを有効化
  mentalModelAutoSeed: true             # シード心象モデルを自動生成
  recallBudget: mid

autolearn:
  enabled: true
  autoContinue: true
```

```json
// mcp.json (<USER_HOME> を実際の絶対パスに置き換えること。例：/home/user)
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

#### Codex 設定 (`~/.codex/config.toml`)
```toml
# config.toml (<USER_HOME> を実際の絶対パスに置き換えること。例：/home/user)
[mcp_servers.hindsight]
command = "node"
args = [
    "<USER_HOME>/.hindsight/hindsight-bridge.mjs",
]

[mcp_servers.hindsight.env]
HINDSIGHT_API_BASE_URL = "http://127.0.0.1:8888"
# 注：HINDSIGHT_BANK_ID はハードコードしない。bridge が Git ルートから自動解決する
```

---

## 3. 深度トラブルシューティング記録と根本原因調査ガイド

今回のデプロイとチューニングの中で、7 つの重要なアーキテクチャ・設定欠陥を調査・解決した：

```mermaid
graph TD
  P1[落とし穴 1: サードパーティの hindsight-mcp を誤導入] --> S1[アンインストールして Hindsight ネイティブ FastMCP を使用]
  P2[落とし穴 2: Ollama 公式に 12B タグがない] --> S2[HuggingFace GGUF を取得し Modelfile でローカルインポート]
  P3[落とし穴 3: Docker UID 1000 権限クラッシュ] --> S3[/home/hindsight/.pg0 を揃えて UID 1000 に権限を付与]
  P4[落とし穴 4: 6.63GB モデルの同期ダウンロードがタイムアウト] --> S4[Range 断点続伝の Python チャンクダウンローダー + nohup]
  P5[落とし穴 5: Ollama API の /v1 欠落で 404] --> S5[BASE_URL を http://ollama-gpu:11434/v1 に明示設定]
  P6[落とし穴 6: FastMCP セッションで Session ID 喪失] --> S6[ブリッジが mcp-session-id を自動キャプチャして透過送信]
  P7[落とし穴 7: Bank のハードコードとサブディレクトリドリフト] --> S7[OMP per-project + Git ルートの自動スニッフィング]
```

### 落とし穴 1：同名のサードパーティ npm パッケージを誤導入（`hindsight-mcp`）
- **エラー現象**：`npm install -g hindsight-mcp` でインストールした後、その README はデフォルトで `https://api.hindsight-ai.com` にリクエストし、PAT Token と Agent UUID を要求し、`create_memory_block` などのツールを定義しており、Vectorize オープンソース版には接続できない。
- **根本原因**：npm レジストリには同名のサードパーティ遺産パッケージが存在し、Vectorize オープンソースプロジェクトの公式成果物ではない。Vectorize Hindsight 自体が FastMCP サービスを内蔵している。
- **解決策**：その npm パッケージを完全にアンインストールし、Hindsight サーバー内蔵の `/mcp/{bank}/` エンドポイントで直接接続する。
- **予防策**：オープンソースプロジェクト周辺ツールを導入する前に、公式ソースリポジトリ内の公開プロトコルと統合ディレクトリ（`hindsight-integrations/`）を先に確認する。

---

### 落とし穴 2：Ollama 公式パブリックライブラリに `gemma4:12b` タグが存在しない
- **エラー現象**：Hindsight 起動時に LLM 接続チェックがエラーを報告する：
  `APIStatusError (ollama/gemma4:12b): HTTP 404: {"message": "model 'gemma4:12b' not found"}`。
- **根本原因**：Ollama 公式 Registry は現在 `gemma4:31b` のみ収録している。12B 版は主にオープンソースコミュニティ（例：`unsloth`、`bartowski`）が GGUF 形式で HuggingFace にホストしている。
- **解決策**：HuggingFace リポジトリ（`unsloth/gemma-4-12b-it-GGUF`）から `gemma-4-12b-it-Q4_K_M.gguf` を取得し、ボリュームマウントと `Modelfile` で `ollama create gemma4:12b -f /models/Modelfile` を実行してインポートする。
- **予防策**：非標準／コミュニティ量子化モデルには `ollama pull <tag>` に頼らず、ローカル GGUF + Modelfile のローカルビルド方式が最も信頼できる。

---

### 落とし穴 3：Rootless Docker コンテナのマウントボリューム権限エラー（UID 1000）
- **エラー現象**：Hindsight が起動に失敗し、コンテナログに次の出力が出る：
  `❌ The embedded database directory /home/hindsight/.pg0 is not writable by this container (UID 1000).`
- **根本原因**：Hindsight イメージはセキュリティ上の理由から非 root ユーザー `hindsight`（UID 1000）で実行される。ホスト上で root または現在のユーザーが作成したディレクトリの権限が制限されていると、コンテナ内の pg0 データベースプロセスが初期化できない。
- **解決策**：
  1. マウントパスは必ずコンテナユーザーのホームディレクトリへマップする：`${HOME}/.hindsight/data:/home/hindsight/.pg0` と `${HOME}/.hindsight/models:/home/hindsight/.cache/huggingface`。
  2. ホスト側でディレクトリの所有権を UID 1000 に設定する：`sudo chown -R 1000:1000 ~/.hindsight/data ~/.hindsight/models`。
- **予防策**：非 root で実行されるコンテナイメージはすべて、Host Path をマウントする際にターゲット UID の読み書き権限を明示的に検証し、無思慮なグローバル 777 を避ける。

---

### 落とし穴 4：巨大モデルファイル（6.63GB）の同期ダウンロードタイムアウト
- **エラー現象**：Agent ツール内でダウンロードコマンドを直接同期実行したところ、300 秒タイムアウトで中断され、孤児の一時ファイルが生成された。
- **根本原因**：巨大なモデルウェイトファイルは越境ネットワーク帯域の制約で時間がかかり、同期ブロッキング呼び出しはプロセス管理や CLI ウォッチドッグに強制終了されやすい。
- **解決策**：専用の Python ダウンロードスクリプトを作成し、`urllib.request` と HTTP `Range` ヘッダーで**断点続伝**を実現する。`nohup python3 ... > download.log 2>&1 &` でバックグラウンド常駐実行し、ログのポーリングで完了を確認する。
- **予防策**：1GB 超のモデルファイル取得は一律にバックグラウンドデーモン + 断点続伝の仕組みを使う。

---

### 落とし穴 5：Ollama API の Base URL パスに `/v1` が欠落
- **エラー現象**：Hindsight を `HINDSIGHT_API_LLM_BASE_URL=http://ollama-gpu:11434` と設定したとき接続に失敗する。
- **根本原因**：Hindsight 内部の `llm_wrapper.py` は `ollama` provider へのリクエストが OpenAI 互換標準に従い、デフォルトで `/v1` ベースのエンドポイントを連結する（すなわち `http://localhost:11434/v1`）。カスタムコンテナドメインを使う場合、`/v1` がないとパスが 404 になる。
- **解決策**：Docker Compose の環境変数で `/v1` を含む URL を明示指定する：
  `HINDSIGHT_API_LLM_BASE_URL=http://ollama-gpu:11434/v1`。
- **予防策**：OpenAI 互換プロトコルで Ollama に接続するすべてのシステムは、URL に `/v1` を明示的に付ける。

---

### 落とし穴 6：FastMCP プロトコルが Session ID 欠落で `Bad Request (-32600)`
- **エラー現象**：簡易 stdio ブリッジを作成した際、最初の `initialize` パケットは成功するが、続く `tools/list` や `tools/call` が `Bad Request: Missing session ID` を報告する。
- **根本原因**：Hindsight は Streamable FastMCP アーキテクチャを採用している。最初の `initialize` ハンドシェイク成功後、サーバーはレスポンスヘッダーで `mcp-session-id` を返す。以降のすべての JSON-RPC POST は HTTP ヘッダーにこの Session ID を載せる必要がある。
- **解決策**：Node.js ブリッジに軽量な状態管理を追加する：
  ```javascript
  const returnedSessionId = res.headers.get('mcp-session-id');
  if (returnedSessionId) sessionId = returnedSessionId;
  if (sessionId) headers['mcp-session-id'] = sessionId;
  ```
- **予防策**：HTTP-to-stdio MCP プロキシを実装するときは、ハンドシェイクの Session Header を厳密に処理し透過送信しなければならない。

---

### 落とし穴 7：グローバルな Bank ハードコードとサブディレクトリルーティングドリフト（Subdirectory Drift）
- **エラー現象**：
  1. `bank: ulticode` をハードコードすると、他のプロジェクトを開発する際にクロスプロジェクトの事実汚染が発生する。
  2. `process.cwd()` だけでプロジェクト名を取得すると、開発者がプロジェクトのサブディレクトリに入った場合にサブディレクトリ名と誤判定され、記憶が分断・分散する。
- **根本原因**：モノリス／マルチモジュール（Monorepo）プロジェクトでは作業ディレクトリ（CWD）がサブモジュール層にあることが多く、現在のパス名を直接取っても所属 Git リポジトリ実体を表せない。また、OMP の `per-project-tagged` モードと Codex の独立 Bank にはルーティング意味論のずれがある。
- **解決策**：
  1. OMP に `hindsight.scoping: per-project` を設定し、そのネイティブロジックでも Git ルートを独立 Bank にする。
  2. ブリッジスクリプトは `git rev-parse --show-toplevel` でリポジトリルートまで遡り、ルートディレクトリ名を Bank の一意識別子にする。
- **予防策**：マルチプロジェクトの動的記憶ルーティングは必ず**Git ルートパス**を命名アンカーに統一し、相対 CWD に依存してはならない。

---

## 4. 検証結果と実測指標

マルチモジュールのサブディレクトリでエンドツーエンドの実測を実施した：

```bash
# 1. クロスツール記憶書き込み (Codex MCP Bridge -> GPU Fact Extraction)
# 書き込み: "Backend uses Java 17 and Spring Boot 3.2.5 with three owner services: auth 9101, admin 9102, app 9103."
# 抽出結果: 3 件の Fact エンティティを生成し、BAAI/bge-m3 のベクトル索引を完了

# 2. クロスツール記憶召回 (OMP / Codex Recall)
# クエリ: "What port does the auth service use?"
# 結果: "Backend has three owner services: auth (9101), admin (9102), and app (9103)" にヒット
# 指標: Reranker スコア 0.965、セマンティックスコア 0.668、検索応答時間 0.059s
```

---

## 5. 開発者クイックリファレンスチェックリスト

| チェック項目 | 標準状態 | 異常確認コマンド |
| :--- | :--- | :--- |
| **GPU 推論コンテナ** | Up (:11434) | `docker logs hindsight-ollama-gpu` |
| **GPU VRAM モデル** | `gemma4:12b` (7.1 GB) | `docker exec hindsight-ollama-gpu ollama list` |
| **Hindsight サービス** | Up (:8888, :9999) | `docker logs hindsight-server` |
| **永続化データ** | `$HOME/.hindsight/data` (pg0) | `ls -la ~/.hindsight/data` |
| **汎用ブリッジ** | `node $HOME/.hindsight/hindsight-bridge.mjs` | `grep hindsight ~/.codex/config.toml` |
| **OMP 記憶設定** | `backend: hindsight`, `scoping: per-project` | `omp config get memory` |

---

## 6. セッション全プロセス進化と技術決定チェーン

| 段階 | 中心タスク | 障害と排障の詳細 | 最終決定と成果 |
| :--- | :--- | :--- | :--- |
| **段階 1：要件受領とアーキテクチャ設計** | ユーザーは Hindsight の完全ローカルデプロイを要求。GPU で Gemma-4 12B、CPU で BGE-M3 を実行し、OMP と Codex へ統合する。 | 当初は直接ブリッジできるサードパーティ npm パッケージを探した。 | Docker Compose の二重コンテナ構成を確立：Ollama ROCm (GPU) + Hindsight Core (CPU pg0/BGE-M3)。 |
| **段階 2：プロトコルの真偽確認** | インストール済みの `hindsight-mcp` npm パッケージを調査する。 | このパッケージは `api.hindsight-ai.com` を指し、PAT Token を要求するサードパーティの遺産パッケージであると判明。 | そのパッケージを断固アンインストールし、Vectorize Hindsight ネイティブの Streamable FastMCP `/mcp/{bank}/` エンドポイントを採用。 |
| **段階 3：基盤コンテナとモデル準備** | Docker コンテナを起動しモデルを取得する。 | 1. コンテナが UID 1000 に書き込み権限がないと報告；2. Ollama 公式に `gemma4:12b` タグがない；3. 6.63GB のモデル同期ダウンロードがタイムアウト。 | 1. ディレクトリに UID 1000 の読み書き権限を付与；2. Range 断点続伝のバックグラウンド Python ダウンローダーを作成；3. Modelfile で GGUF を Ollama に正常にインポート。 |
| **段階 4：プロトコルスタックと通信修復** | Hindsight と Ollama の通信、および Codex ブリッジを確立する。 | 1. Hindsight の LLM 検証が 404 を報告；2. FastMCP ブリッジが 2 パケット目に `Missing session ID (-32600)` を報告。 | 1. BASE_URL に `/v1` を明示追加；2. ブリッジに状態機械を追加し、`mcp-session-id` ヘッダーを自動抽出して透過送信。 |
| **段階 5：記憶分離とルーティングのアーキテクチャ進化** | OMP と Codex の記憶共有と分離を処理する。 | `ulticode` のハードコードがクロスプロジェクト汚染を引き起こし、`process.cwd()` を直接使うと `services/app/` サブディレクトリで Bank 名のドリフトが発生する。 | 1. OMP に `scoping: per-project` を設定；2. ブリッジは `git rev-parse --show-toplevel` を優先してルートを辿る。 |
| **段階 6：廃棄一時領域の掃除と規範アーカイブ** | テスト残留 Bank を掃除し、全量沈殿を行う。 | `codex` と `omp` の一時 Bank を掃除。KB 憲法に従い raw スナップショットを補充し、Index/Log を更新して全静的チェックを通過。 | 知識ベースの全量検証が通過（`pnpm kb:lint`、`pnpm check`、`pnpm build` すべて通過）。 |
