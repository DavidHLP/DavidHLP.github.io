---
title: "Hindsight 完全本地化部署与 OMP / Codex 统一记忆集成证据快照"
capturedAt: 2026-08-17 00:00:00+00:00
sourceType: local-deployment-and-contract-test
sourceUrl: "https://github.com/vectorize-io/hindsight/tree/v0.9.1"
immutable: true
tags: [Hindsight, Memory, OMP, Codex, MCP, Ollama, ROCm, BGE-M3, FastMCP]
description: "Vectorize Hindsight v0.9.1 本地容器部署、AMD ROCm Ollama LLM、CPU BGE-M3 嵌入、FastMCP 桥接及 OMP/Codex 客户端配置的脱敏证据与实测记录。"
---

# Hindsight 完全本地化部署与 OMP / Codex 统一记忆集成证据快照

这份证据快照记录 Vectorize Hindsight v0.9.1 在 Linux (AMD GPU ROCm) 环境下的本地容器部署、Ollama `gemma4:12b` (Q4_K_M GGUF)、CPU `BAAI/bge-m3` 向量嵌入、FastMCP 桥接及 OMP/Codex 接入配置。本方案为**运行时本地化（Runtime Local）**：日常推理与记忆存取均在本地 GPU/CPU 执行；首次部署、模型与依赖拉取需访问网络（拉取后可完全脱网离线运行）。

## 1. 运行时组件与网络边界

- **Hindsight Core**: `ghcr.io/vectorize-io/hindsight:v0.9.1`, 端口 `127.0.0.1:8888` (API/MCP), `127.0.0.1:9999` (Dashboard UI)
- **数据库**: 嵌入式 PostgreSQL + pgvector (`pg0://hindsight-mcp`), 存储于 `$HOME/.hindsight/data`
- **LLM Provider (GPU)**: `ollama/ollama:rocm`, 端口 `127.0.0.1:11434`, 环境变量 `HSA_OVERRIDE_GFX_VERSION=10.3.0`, 设备映射 `/dev/kfd` 与 `/dev/dri`
- **LLM 模型**: `gemma-4-12b-it-Q4_K_M.gguf` (来自 `unsloth/gemma-4-12b-it-GGUF`), 通过 Ollama Modelfile 注册别名 `gemma4:12b`
- **Embedding Provider (CPU)**: `local`, 模型 `BAAI/bge-m3`, 环境变量 `HINDSIGHT_API_EMBEDDINGS_LOCAL_FORCE_CPU=true`
- **MCP 服务端**: Hindsight 原生 Streamable FastMCP 端点 `/mcp/{bank_id}/`

## 2. Docker Compose 编排文件 (`$HOME/.hindsight/docker-compose.yml`)

> 注：在配置文件中，`$HOME` 需按实际宿主机环境配置或使用 Docker Compose 环境变量解析；在 stdio 命令行参数中避免直接使用未经 Shell 展开的 `~` 符号。

```yaml
services:
  ollama-gpu:
    image: ollama/ollama:rocm
    container_name: hindsight-ollama-gpu
    restart: unless-stopped
    ports:
      - "127.0.0.1:11434:11434"
    environment:
      - HSA_OVERRIDE_GFX_VERSION=10.3.0
      - ROCR_VISIBLE_DEVICES=0
      - OLLAMA_KEEP_ALIVE=-1
    devices:
      - "/dev/kfd:/dev/kfd"
      - "/dev/dri:/dev/dri"
    volumes:
      - ${HOME}/.hindsight/ollama:/root/.ollama
      - ${HOME}/.hindsight/models:/models:ro

  hindsight:
    image: ghcr.io/vectorize-io/hindsight:v0.9.1
    container_name: hindsight-server
    restart: unless-stopped
    ports:
      - "127.0.0.1:8888:8888"
      - "127.0.0.1:9999:9999"
    environment:
      - HINDSIGHT_API_LLM_PROVIDER=ollama
      - HINDSIGHT_API_LLM_BASE_URL=http://ollama-gpu:11434/v1
      - HINDSIGHT_API_LLM_MODEL=gemma4:12b
      - HINDSIGHT_API_EMBEDDINGS_PROVIDER=local
      - HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL=BAAI/bge-m3
      - HINDSIGHT_API_EMBEDDINGS_LOCAL_FORCE_CPU=true
      - HF_ENDPOINT=https://huggingface.co
      - HINDSIGHT_API_LOG_LEVEL=info
    volumes:
      - ${HOME}/.hindsight/data:/home/hindsight/.pg0
      - ${HOME}/.hindsight/models:/home/hindsight/.cache/huggingface
    depends_on:
      - ollama-gpu
```

## 3. FastMCP 桥接协议与 Git 根目录路由 (`$HOME/.hindsight/hindsight-bridge.mjs`)

- 针对 stdio 客户端（如 Codex CLI 与 OMP 子代理），通过 Node.js 脚本桥接 stdin/stdout 到 HTTP `/mcp/{bank_id}/`。
- 自动提取 `git rev-parse --show-toplevel` 解析仓库根目录，将 Bank ID 动态映射为项目名（如 `ulticode`, `resicache`），防止深层子目录漂移。
- 自动追踪 FastMCP 握手响应中的 `mcp-session-id` Header 并透传至后续请求。

## 4. 实测验证日志

```text
1. FastMCP 握手与工具发现:
-> initialize OK (serverInfo: hindsight-mcp-server v0.9.1)
-> tools/list OK (29 tools: sync_retain, retain, recall, reflect, list_mental_models, etc.)

2. 写入与提炼:
-> sync_retain: "Backend uses Java 17 and Spring Boot 3.2.5 with three owner services: auth 9101, admin 9102, app 9103."
-> GPU LLM 生成 3 条 Fact 实体, CPU bge-m3 完成向量索引.

3. 召回验证:
-> recall query: "What port does the auth service use?"
-> 命中: "Backend has three owner services: auth (9101), admin (9102), and app (9103)" (Reranker: 0.965, Semantic: 0.668, 时延: 0.059s)
```

## 5. 会话全流程演进与技术决策链

| 阶段 | 核心任务 | 遇阻与排障细节 | 最终决策与产出 |
| :--- | :--- | :--- | :--- |
| **阶段 1：需求接收与架构设计** | 用户要求完全本地化部署 Hindsight，GPU 跑 Gemma-4 12B，CPU 跑 BGE-M3，为 OMP 与 Codex 统一集成。 | 初始曾尝试寻找是否有第三方 npm 包可直接桥接。 | 确立 Docker Compose 双容器架构：Ollama ROCm (GPU) + Hindsight Core (CPU pg0/BGE-M3)。 |
| **阶段 2：协议去伪存真** | 排查已安装的 `hindsight-mcp` npm 包。 | 发现该包指向 `api.hindsight-ai.com`，要求 PAT Token，是第三方遗留包。 | 果断卸载该包，采用 Vectorize Hindsight 原生 Streamable FastMCP `/mcp/{bank}/` 端点。 |
| **阶段 3：底层容器与模型准备** | 启动 Docker 容器并拉取模型。 | 1. 容器报 UID 1000 无写权限；2. Ollama 官方缺 `gemma4:12b` 标签；3. 6.63GB 模型同步下载超时。 | 1. 赋予目录 UID 1000 读写权限；2. 编写带 Range 断点续传的后台 Python 下载器；3. 通过 Modelfile 成功将 GGUF 导入 Ollama。 |
| **阶段 4：协议栈与通信修复** | 建立 Hindsight 与 Ollama 通信及 Codex 桥接。 | 1. Hindsight 校验 LLM 报 404；2. FastMCP 桥接在第二包报 `Missing session ID (-32600)`。 | 1. BASE_URL 显式补齐 `/v1`；2. 桥接器加入状态机，自动提取并透传 `mcp-session-id` Header。 |
| **阶段 5：记忆隔离与路由架构演进** | 处理 OMP 与 Codex 记忆共享与隔离。 | 发现硬编码 `ulticode` 会导致跨项目污染，而直接使用 `process.cwd()` 会在 `services/app/` 子目录下产生库名漂移。 | 1. OMP 设置 `scoping: per-project`；2. 桥接器优先使用 `git rev-parse --show-toplevel` 追溯根目录。 |
| **阶段 6：废弃临时空间清理与规范归档** | 清理测试残留 Bank，并进行全量沉淀。 | 清理 `codex` 与 `omp` 临时 Bank；按 KB 宪法补充 raw 快照、更新 Index/Log 并跑通所有静态检查。 | 知识库全量验证通过（`pnpm kb:lint`, `pnpm check`, `pnpm build` 全部通过）。 |
