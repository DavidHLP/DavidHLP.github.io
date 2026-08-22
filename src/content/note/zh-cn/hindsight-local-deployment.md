---
title: "Hindsight 本地算力分工与 Docker 容器化部署"
timestamp: 2026-08-23 00:00:00+08:00
series: "OMP 与 Agent 工程"
kind: concept
status: active
sources: ["hindsight-local-deployment-and-agent-integration"]
related: ["hindsight-omp-codex-integration", "hindsight-troubleshooting", "mcp-codebase-memory-workflow"]
tags: [Hindsight, Docker, Ollama, ROCm, BGE-M3, Architecture]
description: "记录 Vectorize Hindsight 记忆中枢的本地算力分工（AMD GPU 推理 + CPU Embedding）、UID 1000 权限模型与 Docker Compose 容器化编排。"
toc: true
---

本篇归档 Vectorize Hindsight 记忆系统在 Linux 环境下的**算力分工架构与容器化部署方案**。系统实现日常推理与记忆存取全离线/本地化运行，重点解决异构算力协同（GPU LLM + CPU Embedding）、数据持久化权限以及服务生命周期编排。

---

## 一、系统架构与运行拓扑

整个本地记忆系统由计算底座、记忆中枢与 Agent 接入层构成，所有端口与流量严格限定在本地回路（`127.0.0.1`）：

```mermaid
flowchart TD
  subgraph Agent_Layer["Agent 客户端接入层"]
    OMP["OMP (Oh-My-Pi)<br/>原生 memory.backend: hindsight<br/>+ FastMCP stdio 桥接"]
    Codex["Codex CLI<br/>FastMCP stdio 桥接器<br/>(hindsight-bridge.mjs)"]
  end

  subgraph Hindsight_Core["Hindsight 记忆中枢 (Docker)"]
    API["Hindsight Core (v0.9.1 固定版本)<br/>API: :8888 | UI: :9999<br/>数据持久化: $HOME/.hindsight/data"]
    FastMCP_EP["Streamable FastMCP 端点<br/>/mcp/{project_bank}/"]
    PG0["嵌入式 pg0 (PostgreSQL + pgvector)<br/>事实提取 / 实体图谱 / 向量索引"]
  end

  subgraph Local_Inference["本地推理引擎 (运行时本地)"]
    OLLAMA["GPU LLM: Ollama ROCm (:11434)<br/>模型: gemma4:12b (Q4_K_M GGUF)<br/>硬件: AMD Radeon RX 6800/6900 XT"]
    EMBED["CPU Embedding: Local Provider<br/>模型: BAAI/bge-m3<br/>硬件: Intel CPU (多线程推理)"]
  end

  OMP -->|自动 Recall / Retain / Reflect| API
  OMP -.->|MCP 工具调用| FastMCP_EP
  Codex -->|MCP JSON-RPC (stdio)| FastMCP_EP
  API --> FastMCP_EP
  API --> PG0
  API -->|LLM 事实提取与反思| OLLAMA
  API -->|向量嵌入与重排| EMBED
```

### 核心设计原则

1. **算力精准分工**：
    - **GPU 专注 LLM**：将 12B 参数的 `gemma4:12b`（Q4_K_M）加载到 AMD GPU 显存，专注负责对话中的事实提炼（Fact Extraction）与心智模型合成（Reflection）。
    - **CPU 专注 Embedding**：将 `BAAI/bge-m3` 强制运行在 CPU，避免占用宝贵的 GPU 显存，保障 LLM 上下文推理稳定性。
2. **数据全生命周期本地化**：
    - 所有向量、实体关系、转录和模型缓存统一定位至 `$HOME/.hindsight/`。

---

## 二、部署实施步骤

### 1. 持久化目录规划与权限管理

Hindsight 容器内部以非 root 用户 `hindsight`（UID 1000）运行，因此挂载的宿主机目录必须确保 UID 1000 具备写权限：

```bash
mkdir -p ~/.hindsight/data ~/.hindsight/models ~/.hindsight/ollama

# 安全权限配置：将数据与模型目录所属权赋予容器 UID 1000
sudo chown -R 1000:1000 ~/.hindsight/data ~/.hindsight/models
chmod -R u+rwX,g+rwX ~/.hindsight/data ~/.hindsight/models
```

### 2. Docker Compose 编排配置 (`~/.hindsight/docker-compose.yml`)

宿主机路径使用 `${HOME}` 或绝对路径，避免在非交互环境中依赖 Shell 波浪号 `~` 展开：

```yaml
services:
    # GPU LLM 服务：通过 Ollama ROCm 加载模型
    ollama-gpu:
        image: ollama/ollama:rocm
        container_name: hindsight-ollama-gpu
        restart: unless-stopped
        ports:
            - "127.0.0.1:11434:11434"
        environment:
            - HSA_OVERRIDE_GFX_VERSION=10.3.0 # AMD RDNA2 (gfx1030)
            - ROCR_VISIBLE_DEVICES=0
            - OLLAMA_KEEP_ALIVE=-1
        devices:
            - "/dev/kfd:/dev/kfd"
            - "/dev/dri:/dev/dri"
        volumes:
            - ${HOME}/.hindsight/ollama:/root/.ollama
            - ${HOME}/.hindsight/models:/models:ro

    # Hindsight 核心服务端 (Vectorize.io 固定版本)
    hindsight:
        image: ghcr.io/vectorize-io/hindsight:v0.9.1
        container_name: hindsight-server
        restart: unless-stopped
        ports:
            - "127.0.0.1:8888:8888" # API & MCP 端点
            - "127.0.0.1:9999:9999" # Web UI 控制台
        environment:
            # --- LLM 驱动 (GPU) ---
            - HINDSIGHT_API_LLM_PROVIDER=ollama
            - HINDSIGHT_API_LLM_BASE_URL=http://ollama-gpu:11434/v1
            - HINDSIGHT_API_LLM_MODEL=gemma4:12b
            # --- Embedding 驱动 (CPU) ---
            - HINDSIGHT_API_EMBEDDINGS_PROVIDER=local
            - HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL=BAAI/bge-m3
            - HINDSIGHT_API_EMBEDDINGS_LOCAL_FORCE_CPU=true
            # --- 模型权重下载配置（首发拉取需连网，预缓存后可脱网） ---
            - HF_ENDPOINT=https://huggingface.co
            - HINDSIGHT_API_LOG_LEVEL=info
        volumes:
            - ${HOME}/.hindsight/data:/home/hindsight/.pg0
            - ${HOME}/.hindsight/models:/home/hindsight/.cache/huggingface
        depends_on:
            - ollama-gpu
```

### 3. GGUF 模型导入与别名注册

编写 `~/.hindsight/models/Modelfile`：

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

导入并验证：

```bash
docker exec -i hindsight-ollama-gpu ollama create gemma4:12b -f /models/Modelfile
docker exec hindsight-ollama-gpu ollama list
```

---

## 三、适用条件与边界

- **硬件要求**：具备支持 ROCm 的 AMD GPU（如 RX 6800/6900 XT 或同代及以上），显存 ≥ 16GB；多核 CPU 用于 BGE-M3 向量提取。
- **网络边界**：所有服务端点必须绑定 `127.0.0.1` 环回接口，禁止未加认证暴露至公共网络。
- **冷启动要求**：初始模型权重拉取需要外网连接或提前离线缓存至 `~/.hindsight/models`。

---

## 四、最小验证

1. **容器状态检查**：`docker ps` 确认 `hindsight-server` 与 `hindsight-ollama-gpu` 处于 Up 状态。
2. **GPU 显存验证**：`docker exec hindsight-ollama-gpu ollama ps` 确认 `gemma4:12b` 完整加载至 GPU VRAM。
3. **健康检查端点**：`curl -I http://127.0.0.1:8888/health` 返回 HTTP 200。

---

## 五、证据与不确定性

- **来源事实**：基于 `hindsight-local-deployment-and-agent-integration` 实际运行部署验证；Ollama ROCm 容器映射 `/dev/kfd` 与 `/dev/dri`，Hindsight v0.9.1 固定镜像。
- **本页归纳**：将算力切分、目录权限与 Compose 编排沉淀为独立 Concept 规范。
- **未确认项**：不同 Linux 发行版（如 Ubuntu vs Fedora/Arch）下 ROCm 内核驱动安装差异需依宿主机环境调整。

---

## 六、相关页面

- [Hindsight 统一记忆接入：FastMCP 桥接与多项目动态路由](/note/hindsight-omp-codex-integration)
- [Hindsight 记忆系统运行时排障矩阵与失效模式](/note/hindsight-troubleshooting)
- [MCP Codebase Memory 工作流](/note/mcp-codebase-memory-workflow)
