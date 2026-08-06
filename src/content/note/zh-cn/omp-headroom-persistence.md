---
title: "让 OMP 更新后不再丢路由：Headroom named profile 与 model_cache reconciler"
timestamp: 2026-08-06 00:00:00+08:00
series: "OMP 规则与配置体系"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, Routing, Proxy, Codex, OpenCode]
description: "记录 OMP 更新会重写运行时模型缓存时，如何用 named profile、外部路由声明和幂等 SQLite reconciler 持久化 Headroom 路由，并用真实 Codex WebSocket 与 OpenCode HTTP 请求验证。"
toc: true
---

# 让 OMP 更新后不再丢路由：Headroom named profile 与 model_cache reconciler

这次工作的重点不是再改一次代理地址，而是把配置分成三个层次：**用户声明、运行时派生状态、外部基础设施**。这样 OMP 更新可以重建自己的缓存，Headroom 也可以继续保持单一 loopback 入口，而不会把路由恢复寄托在一次手工 SQLite 修改上。

最终采用的结构是：

```text
OMP named profile
    │
    ├─ config.yml / models.yml        用户配置与覆盖层
    ├─ agent.db                       profile 独立的认证与会话状态
    └─ models.db                      可重建的运行时 model_cache
                  ▲
                  │ omp-headroom-reconcile
                  │
~/.config/omp/headroom-routes.json    外部路由声明
                  │
                  ▼
127.0.0.1:8787                        Headroom loopback proxy
```

## 1. 先纠正一个容易误判的前提

`models.yml`、`models.db` 和 `config.yml` 不是同一类配置：

- `config.yml` 保存 OMP 的用户级行为配置，例如 `modelRoles`、重试和工具设置；
- `models.yml` 是静态 provider/model 覆盖层；
- `models.db` 保存 OMP 发现和合并后的运行时 `model_cache`，其中的 provider 行可能被标记为 authoritative。

在这次实际使用的 OMP 版本中，已经存在的 authoritative `model_cache` 行不会可靠地被 `models.yml` provider override 接管。换句话说，把某个 `baseUrl` 写进 `models.yml`，并不等价于当前正在运行的 provider 一定会改用这个地址。

因此不能把 `models.yml` 或手工编辑 `models.db` 当成唯一的持久化方案。更稳妥的分层是：

1. 用 named profile 隔离 OMP 的配置、认证和会话状态；
2. 用 OMP 目录之外的 JSON 保存 Headroom 路由意图；
3. 把 `models.db` 当成派生状态；
4. 在 OMP 更新后，用 reconciler 根据声明恢复运行时路由。

## 2. Named profile 隔离用户状态

profile 使用独立的 agent 目录：

```text
~/.omp/profiles/headroom/agent/
├── config.yml
├── models.yml
├── agent.db
├── models.db
├── history.db
├── mcp.json
├── agents/
├── hooks/
├── skills/
└── managed-skills/
```

启动时显式选择 profile：

```bash
OMP_PROFILE=headroom omp
```

或者使用固定入口：

```bash
omp-headroom
```

这样 OMP 默认 profile 的更新、认证变更和会话历史不会与 Headroom 专用 profile 混在一起。`agent.db` 可能包含 OAuth/API credential，不能提交到 Git，也不能复制到文章或日志中。

## 3. 用外部文件保存路由意图

声明文件放在 OMP 安装目录之外：

```text
~/.config/omp/headroom-routes.json
```

它只描述 provider、协议、loopback 地址和 Headroom 所需的动态 header，不保存任何凭据。实际验证过的结构如下：

```json
{
  "schemaVersion": 1,
  "providers": [
    {
      "providerId": "openai-codex",
      "matchApis": ["openai-codex-responses"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {},
      "removeHeaders": [
        "x-headroom-base-url",
        "x-headroom-original-path"
      ],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["openai-completions"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go/v1",
        "x-headroom-original-path": "/chat/completions"
      },
      "removeHeaders": [],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["openai-responses"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go/v1",
        "x-headroom-original-path": "/responses"
      },
      "removeHeaders": [],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["anthropic-messages"],
      "baseUrl": "http://127.0.0.1:8787",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go"
      },
      "removeHeaders": ["x-headroom-original-path"],
      "minimumMatches": 1
    }
  ]
}
```

这个文件是声明层，不是 OMP 的 catalog。它的作用是明确回答：某个 provider 的某种协议应该经过哪个本机入口、应该携带什么上游信息。

## 4. Reconciler 只修复声明过的 runtime rows

入口：

```text
~/.local/bin/omp-headroom-reconcile
```

它遵循以下顺序：

```text
BEGIN IMMEDIATE
→ 读取外部路由声明
→ 备份当前 models.db
→ 按 provider_id + api 匹配 model_cache
→ 缺少匹配行时 fail-loud
→ 只更新声明的 baseUrl/header 字段
→ 保留 catalog metadata、fingerprint、version
→ authoritative=1
→ COMMIT
```

几个边界很重要：

- 不删除模型；
- 不重建整个 `model_cache`；
- 不凭空 INSERT OMP 没有生成的 provider/model 行；
- 不覆盖当前 cache version；
- 不把路由声明复制成第二份静态 catalog；
- 重复执行时应该得到 `changed=false`。

这次验证确认 reconciler 保留了现有 cache version，并将匹配行保持为 `authoritative=1`，而不是强行写入一组未经验证的固定数据库值。

## 5. Update wrapper 把恢复动作固定下来

普通的：

```bash
omp update
```

只负责更新 OMP，本身不保证外部 Headroom 声明已经重新写回 `models.db`。因此提供固定入口：

```bash
omp-headroom update
```

其逻辑是：

```text
OMP_PROFILE=headroom omp update
→ 校验 profile agent 目录
→ 执行 omp-headroom-reconcile
→ 输出最终 provider/cache 状态
```

最小 wrapper 可以保持非常薄：

```bash
#!/usr/bin/env bash
set -euo pipefail

export OMP_PROFILE=headroom
exec "$HOME/.local/bin/omp" "$@"
```

更新 wrapper 负责把 `update` 交给专用更新脚本，其余参数原样转发给固定 profile 的 OMP。不要在 wrapper 中复制 token、API key 或完整 provider catalog。

## 6. Headroom systemd 服务独立于 OMP 安装

Headroom 服务放在：

```text
~/.config/systemd/user/headroom-proxy.service
```

它只监听 loopback：

```text
127.0.0.1:8787
```

服务文件不应放进 OMP 的安装目录，也不应包含供应商凭据。基本原则是：

- OMP 负责选择 provider 和协议；
- `models.db` 只保存运行时可重建结果；
- 外部声明文件保存持久化路由意图；
- Headroom 负责协议转发、压缩和缓存；
- systemd 负责 Headroom 进程生命周期。

这样 OMP 更新不会覆盖 systemd unit，Headroom 重启也不会改变 OMP 的认证数据库。

## 7. 迁移后的验证证据

### 7.1 当前 profile 与 cache

验证 profile 配置和认证库存在后，reconciler 的检查模式输出为：

```text
declared API routes matched
authoritative=1
changed=false
```

### 7.2 模拟 OMP update 重写

在临时数据库中把路由改回直连、删除 Headroom headers，并将 `authoritative` 改为 `0`，随后执行 reconciler：

```text
reconcile_rc=0
backup_created=true
declared routes restored
authoritative=1
cache_version=preserved
```

这证明恢复动作不是只对当前数据库手工修补，而是可以在 update 后重新执行。

### 7.3 Codex 真实 WebSocket 请求

通过固定 profile 入口发送最小请求，得到：

```text
PERSISTED-OK
```

Headroom 日志同时出现：

```text
route=chatgpt_subscription
connecting to wss://chatgpt.com/backend-api/codex/responses
last_upstream_type=response.completed
```

这说明请求不仅到达了 `127.0.0.1:8787`，还确实进入了 Codex subscription 的 WebSocket 上游。

### 7.4 OpenCode Go 真实 HTTP 请求

通过同一个 profile 发送最小请求，得到：

```text
PERSISTED-OK
```

日志确认最终上游是：

```text
path=https://opencode.ai/zen/go/v1/chat/completions
status=200
```

### 7.5 不把“经过代理”和“产生压缩”混为一谈

短请求可能已经经过 Headroom，但因为没有足够可压缩内容而显示零 savings。验证时应分别看：

1. OMP 的 loopback `baseUrl`；
2. Headroom 的 inbound/outbound 日志；
3. 最终 upstream URL 或 WebSocket；
4. `/stats` 中的压缩统计。

只看到 `127.0.0.1:8787` 或 HTTP 200，不能证明上游路由正确；只看到 savings 为零，也不能证明请求绕过了 Headroom。

## 8. 安全、备份与回滚边界

- `agent.db`、OAuth token、API key 和 session 文件只留在本机 profile；
- 外部路由声明文件权限应为 `600`；
- systemd unit 中不写可用凭据；
- reconciler 修改前创建备份；
- 失败时事务回滚，不留下半套 headers；
- 缺少匹配 row 时停止并报告，不用猜测数据填充；
- 回滚优先恢复 reconciler 备份和上一版声明文件，不要直接删除整个 `models.db`；
- 已经运行的 OMP 进程可能继续持有旧的内存配置，切换后新会话应统一使用 `omp-headroom`。

## 9. 最终工作流

以后维护这套配置时，使用下面的顺序：

```bash
# 1. 编辑外部路由声明
$EDITOR ~/.config/omp/headroom-routes.json

# 2. 检查而不写入
omp-headroom-reconcile --agent-dir "$HOME/.omp/profiles/headroom/agent" --check

# 3. 执行 OMP 更新并自动恢复路由
omp-headroom update

# 4. 检查 runtime cache
omp-headroom-reconcile --agent-dir "$HOME/.omp/profiles/headroom/agent" --check

# 5. 用固定 profile 发起真实最小请求
omp-headroom -p --no-session --no-tools --no-extensions --no-rules \
  --model openai-codex/gpt-5.6-luna \
  'Reply with exactly PERSISTED-OK.'

# 6. 同时检查 Headroom 日志和最终 upstream
```

核心原则只有一句话：**把路由意图放在 OMP 更新不会覆盖的位置，把 `models.db` 当成可验证、可备份、可重建的派生状态。**