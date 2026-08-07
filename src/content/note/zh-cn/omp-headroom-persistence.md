---
title: "历史 Headroom 路由恢复：Named Profile 与 model_cache Reconciler"
timestamp: 2026-08-06 00:00:00+08:00
series: "OMP 规则与配置体系"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, Routing, Proxy, Codex, OpenCode]
description: "记录 OMP 更新重写运行时模型缓存时的旧迁移/恢复方案：named profile、外部路由声明和幂等 SQLite reconciler 仅作为迁移证据；当前日常启动只使用官方 headroom wrap omp。"
toc: true
---

# 历史 Headroom 路由恢复：Named Profile 与 model_cache Reconciler

日常启动现在唯一推荐使用官方 wrapper，而不是常驻服务。请以[官方 Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md)为准：

```bash
# 只需安装一次官方 CLI（Python 3.13+）
uv tool install --python 3.13 "headroom-ai[all]"

# OMP 唯一推荐的启动入口
headroom wrap omp

# wrapped 会话运行期间，在另一个终端验证
headroom doctor
headroom perf
headroom dashboard
```

`headroom wrap omp` 会启动 OMP，并管理当前会话所需的本地代理。通常不要创建或维护旧的 `~/.config/systemd/user/headroom-proxy.service`，不要启用 provider 专用 systemd unit，不要手工运行 `headroom proxy --port 8787`，也不要把 reconciler 作为启动步骤。这些是已废弃的手工/迁移路径，不是推荐的 OMP 生命周期。由于 wrap 会把路由状态持久写入 `models.yml`，进程退出不会恢复它；会话结束后必须显式执行 `headroom unwrap omp`（默认移除 wrapper 管理的路由状态并停止本地代理），只有明确要保留代理时才使用 `--no-stop-proxy`。

下面的持久化模型用于说明历史上的路由意图与派生状态：

```text
OMP named profile
    │
    ├─ config.yml / models.yml        用户配置与覆盖层
    ├─ agent.db                       profile 独立的认证与会话状态
    └─ models.db                      可重建的运行时 model_cache
                  ▲
                  │ 仅限旧迁移的 reconciler
                  │
~/.config/omp/headroom-routes.json    外部路由声明
                  │
                  ▼
Headroom 本地代理                    生命周期由 headroom wrap omp 管理
```

wrapped 会话负责 active 代理生命周期，但进程退出不会自动清理路由状态。声明文件和 `models.db` 是路由/配置制品，不是每天手工修改 SQLite 或维持用户服务的指令；会话结束后必须显式执行 `headroom unwrap omp`。

## 1. 先纠正一个容易误判的前提


`models.yml`、`models.db` 和 `config.yml` 不是同一类配置：

- `config.yml` 保存 OMP 的用户级行为配置，例如 `modelRoles`、重试和工具设置；
- `models.yml` 是静态 provider/model 覆盖层；
- `models.db` 保存 OMP 发现和合并后的运行时 `model_cache`，其中的 provider 行可能被标记为 authoritative。

在这次实际使用的 OMP 版本中，已经存在的 authoritative `model_cache` 行不会可靠地被 `models.yml` provider override 接管。换句话说，把某个 `baseUrl` 写进 `models.yml`，并不等价于当前正在运行的 provider 一定会改用这个地址。

因此不能把 `models.yml` 或手工编辑 `models.db` 当成唯一的持久化方案。当前推荐的分层是：

1. 用 named profile 隔离 OMP 的配置、认证和会话状态；
2. 可选地用 OMP 目录之外的 JSON 保存 Headroom 路由意图；
3. 把 `models.db` 当成派生状态；
4. 将 reconciler 明确限定为旧迁移期间的恢复工具，绝不能作为正常 `headroom wrap omp` 启动步骤。


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

下面的命令只用于迁移期间的旧 profile 隔离诊断，不是当前启动入口。当前会话必须从 `headroom wrap omp` 开始：

```bash
# 仅作旧迁移/profile 诊断；不是日常启动。
OMP_PROFILE=headroom omp
```

下面的固定 `omp-headroom` 入口同样是历史方案，不得替代 `headroom wrap omp`：

```bash
# 仅作旧迁移/profile 诊断；不是日常启动。
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

## 4. 旧 reconciler：仅限迁移，不推荐

下面的 reconciler 只作为旧持久化设计的历史证据保留，不属于日常启动；当前 OMP 会话必须使用 `headroom wrap omp`：

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

## 5. 旧 Update wrapper：仅限迁移，不推荐

本节命令描述旧的 update 后恢复流程。不要使用 `omp-headroom update` 或运行 reconciler 作为 OMP 的正常启动方式；当前会话使用官方 wrapper：

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

wrapped 会话运行期间，在另一个终端验证：

```bash
headroom doctor
headroom perf
headroom dashboard
```

历史命令曾是：

```bash
omp update
```

它不保证外部声明已经写回 `models.db`；旧的固定入口是：

```bash
omp-headroom update
```

旧流程如下：

```text
OMP_PROFILE=headroom omp update
→ 校验 profile agent 目录
→ 执行 omp-headroom-reconcile
→ 输出最终 provider/cache 状态
```

这个 wrapper 只为解释迁移而保留，不要在其中复制 token、API key 或完整 provider catalog。


## 6. 旧 systemd 服务：不属于推荐生命周期

旧用户服务 `~/.config/systemd/user/headroom-proxy.service` 及其 provider 变体已经废弃。`headroom wrap omp` 不需要它们，正常情况下不得创建、启用、重启或维护。

推荐生命周期由 `headroom wrap omp` 管理当前会话的本地代理。OMP 仍负责选择 provider 和协议，路由声明是可选的配置意图，`models.db` 是派生运行时状态；日常启动不需要常驻 systemd 进程。

## 7. 迁移后的验证证据（旧 reconciler 证据）



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

### 7.3 历史 Codex WebSocket 请求（显式 custom 路由）

下面的证据属于旧迁移方案，不是普通 `headroom wrap omp` 的默认结果。它是在固定 profile 和显式配置的 Codex custom provider 路由下采集的：

```text
PERSISTED-OK
```

Headroom 日志同时出现：

```text
route=chatgpt_subscription
connecting to wss://chatgpt.com/backend-api/codex/responses
last_upstream_type=response.completed
```

这次历史请求到达了 loopback 代理和 Codex subscription WebSocket 上游。当前 `openai-codex` role 默认直连；只有显式配置 custom provider 让它经过 Headroom 时，才应重复这项检查。

### 7.4 历史 OpenCode Go HTTP 请求（显式 custom 路由）

这项旧迁移证据在同一个 profile 下使用了显式配置的 OpenCode Go custom provider 路由：

```text
PERSISTED-OK
```

日志确认最终上游是：

```text
path=https://opencode.ai/zen/go/v1/chat/completions
status=200
```

当前 `opencode-go` role 默认直连。普通 `headroom wrap omp` 不会自动把它变成 Headroom 路由；只有添加显式 custom provider 配置后，才通过 `proxy.log` 验证它。

### 7.5 不把“经过代理”和“产生压缩”混为一谈

短请求可能已经经过 Headroom，但因为没有足够可压缩内容而显示零 savings。验证时应分别看：

1. OMP 的 loopback `baseUrl`；
2. Headroom 的 inbound/outbound 日志；
3. 最终 upstream URL 或 WebSocket；
4. `/stats` 中的压缩统计。

只看到 `127.0.0.1:8787` 或 HTTP 200，不能证明上游路由正确；只看到 savings 为零，也不能证明请求绕过了 Headroom。
## 8. 安全、备份与回滚边界（旧迁移上下文）

- `agent.db`、OAuth token、API key 和 session 文件只留在本机 profile；
- 外部路由声明文件权限应为 `600`；
- systemd unit 中不写可用凭据；
- reconciler 修改前创建备份；
- 失败时事务回滚，不留下半套 headers；
- 缺少匹配 row 时停止并报告，不用猜测数据填充；
- 回滚优先恢复 reconciler 备份和上一版声明文件，不要直接删除整个 `models.db`；
- 已经运行的 OMP 进程可能继续持有旧的内存配置，切换后新会话应统一使用 `headroom wrap omp`。
正常启动只使用官方 wrapper：

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

wrapped 会话运行期间，在另一个终端执行检查：

```bash
headroom doctor
headroom perf
headroom dashboard
```

验证路由时，只有在 selector 使用 active wrapper 管理的内置 `anthropic` 路由，或使用显式配置的 custom-provider 路由时，才运行真实 OMP selector 并检查 `~/.headroom/logs/proxy.log` 或最终上游 URL/WebSocket。普通 wrap 不会自动代理 `openai-codex`、`opencode-go`、Zhipu、Kimi、MiniMax、Codex；前两者默认直连，后四者属于历史/条件路由。直连 role 应另行核对其直连上游。只看到 loopback URL 或 HTTP 200，不能证明请求到达了预期 provider。会话结束后必须显式执行 `headroom unwrap omp`；默认会停止本地代理，只有明确要保留代理时才使用 `--no-stop-proxy`。


核心原则只有一句话：**把路由意图放在 OMP 更新不会覆盖的位置，把 `models.db` 当成派生状态，并让 `headroom wrap omp` 管理本地代理生命周期。**
