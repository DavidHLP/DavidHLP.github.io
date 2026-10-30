---
title: "OMP Headroom Bridge 与原生 Codex 路由运行时证据"
capturedAt: 2026-08-13 22:18:29+08:00
sourceType: repository-and-runtime-observation
sourceUrl: "https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc"
immutable: true
tags: [OMP, Headroom, Codex, OpenCode, ClaudeCode, Proxy, Routing, systemd, Security]
description: "固定 OMP Headroom Bridge 项目提交并结合当前工作树的脱敏交付证据，记录 OMP、原生 Codex CLI/Desktop 与 Claude Code 共存的路由边界、控制器安全约束、验证结果和回滚路径；不包含凭证、用户配置正文、models.db、请求正文或本机绝对路径。"
---

# OMP Headroom Bridge 与原生 Codex 路由运行时证据

这份 raw 快照记录 `omp-headroom-provider-proxy` 的项目架构和当前 Codex 原生路由交付结果。项目实现来源固定到提交 `a9349b762657a28ad8b45a672b9996e831e1eedc`；本次路由控制器、配置 overlay、验证脚本和文档还包含未提交的工作树变更，因此固定 URL 只用于确定项目 lineage，不能表示所有本次变更已经进入该提交。运行时部分采用脱敏摘要，不保存凭证、用户配置正文、`models.db`、backup 内容、请求正文或本机绝对路径。

## 项目责任边界

这是一个外部路由控制器和 Headroom 部署项目，不修改 OMP 或 Headroom 源码，也不复制 OMP credential、OAuth token、`models.db` 或其它 provider 的私有状态。Headroom 由 `systemd --user` 管理，只监听 loopback `127.0.0.1:8787`；项目把 OMP 与 Codex 的路由声明、服务生命周期、状态校验和回滚工具放在项目边界内。

项目包含两条互相独立的 inference 路径：

| 调用方 | 协议与入口 | Headroom 后续责任 | 证据边界 |
| --- | --- | --- | --- |
| OMP `opencode-go` | OpenAI-compatible `/v1`，精确 prefix 为 `/p/omp-headroom-bridge/v1` | 按 provider 声明和请求头转发到 OpenCode 上游 | OMP provider route 和真实请求 smoke |
| OMP `openai-codex` | OpenAI Responses/Live WebSocket，同一 loopback prefix | 通过 `x-headroom-base-url` 选择 ChatGPT Codex upstream | OMP Responses/WS smoke；不包含 discovery |
| Codex CLI/Desktop | 原生 Responses provider，读取用户级 `$CODEX_HOME/config.toml` | Headroom 负责本地压缩和转发，ChatGPT OAuth 负责上游认证 | fresh CLI 与 Desktop local-thread smoke |
| Claude Code（共存模式） | Anthropic `/v1/messages` | Headroom 先整理，再交给 cc-switch 做协议转换和凭据注入 | 仅在 `HEADROOM_CC_SWITCH_RECONCILE=1` 的部署边界内成立 |

Claude Code 的共存链路是 `Claude Code → Headroom 8787 → cc-switch 15721 → Codex/ChatGPT`；OMP `/v1/responses` 与 Claude `/v1/messages` 不交汇。一个请求只保留一个 application-level compression owner，cc-switch 不承担压缩。

## 原生 Codex route

Codex CLI 与 Desktop 共享用户级 `$CODEX_HOME/config.toml`。项目使用一个自定义 Responses provider，而不是 `HTTP_PROXY`、`HTTPS_PROXY` 或 CONNECT 伪装：

- root `model_provider = "headroom"`；
- `[model_providers.headroom]` 的 `base_url` 指向现有 Headroom loopback prefix；
- `wire_api = "responses"`、`requires_openai_auth = true`、`supports_websockets = true`；
- `http_headers` 保留 `x-headroom-base-url = https://chatgpt.com/backend-api`，让 Headroom 复用 Codex 的 ChatGPT OAuth/Responses 上游选择；
- 不读取或复制 `auth.json`，不把 token 写进项目配置或日志。

`bin/codex-routes` 是真实 user config 的唯一受管写入口。它用 root-safe TOML managed marker 插入或更新唯一 overlay，拒绝重复/伪造 marker 和不允许的 root/table 结构；apply、check、restore 均在 state-dir private lock 下运行，并保留 owner-only backup、before/after hash、文件 mode、prepared journal 和 drift guard。目标、临时文件、backup 或状态不符合预期时 fail closed，而不是猜测修复。

## OMP provider route

OMP 路由由 `bin/omp-routes` 负责显式 apply/check/restore。项目只允许两个 provider 的精确 API、prefix、upstream header 和 provider identity；apply 会保留原配置并建立 owner-only backup，restore 不修改 `models.db`。Headroom 的统一入口不意味着 OMP discovery 自动经过 proxy；`openai-codex` 的 model discovery、登录、云端线程和 realtime voice 均不计入本项目的 compression coverage。

## 验证与回滚

当前交付的静态、隔离生命周期和真实客户端证据包括：

- `./bin/validate`：shell、systemd、静态 contract、Codex route lifecycle/conflict smoke、Headroom CLI 和 Ponytail gate 均通过；
- `./bin/headroom-ponytail-check`、`bin/omp-routes check`、`bin/codex-routes check` 均通过，目标 mode、backup hash 和 state hash 正常；
- fresh Codex CLI 返回 `CODEX_HEADROOM_CLI_SMOKE_OK`，proxy 日志确认 loopback `/v1/responses`、ChatGPT OAuth WebSocket 和 `response.completed`；
- fresh Desktop local-thread 返回 `CODEX_HEADROOM_DESKTOP_SMOKE_OK_2`，proxy 日志确认 OAuth ChatGPT Codex WSS 和 `response.completed`；
- `systemctl --user is-active headroom-omp-proxy.service` 为 `active`，服务仍为 loopback-only。

回滚前必须停止所有 Codex CLI/Desktop writer，再执行 `./bin/codex-routes restore --force`，随后重新 `apply` 或 `check` 以确认状态。项目不自动 commit、publish、deploy，也不把用户当前 applied 配置视为可随意覆盖的测试 fixture。

## 未确认项

这是 Headroom 0.34、当前 OMP/Codex 客户端和本机 systemd user service 的版本相关证据。它不证明其它版本使用相同 provider schema、路径、日志字段、WebSocket 行为或 Desktop 配置读取方式；client success 不能替代 proxy inbound/outbound 日志证据。当前工作树仍有未提交变更，后续发布前应重新绑定实际 commit 并复跑 fresh-client smoke。
