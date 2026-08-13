---
title: "Headroom 与 cc-switch / Claude Code 共存运行时证据"
capturedAt: 2026-08-13 15:31:11+08:00
sourceType: repository-and-runtime-observation
sourceUrl: "https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc"
immutable: true
tags: [Headroom, cc-switch, ClaudeCode, OMP, Proxy, Routing, Security]
description: "固定 Headroom provider proxy 项目提交与同日运行时观测得到的脱敏证据；记录 Claude Code 经 Headroom 到 cc-switch 的链路、单一整理边界和 BindPaths 安全取舍，不包含凭证、会话标识、请求正文或本机绝对路径。"
---

# Headroom 与 cc-switch / Claude Code 共存运行时证据

这份 raw 快照绑定 Headroom provider proxy 的固定提交，并记录该部署在 2026-08-13 的运行时观测。代码提交 URL 只用于固定实现来源；运行时证据来自同一部署的本地检查。快照经过脱敏，不保存凭证、会话标识、请求正文、完整请求头、日志 request id 或本机绝对路径。

## 固定项目事实

项目 README 与 CONTEXT 将代理划分为两条不交汇的整理路径：

| 调用方 | Headroom 入口 | 整理责任人 | 后续上游 |
| --- | --- | --- | --- |
| OMP | OpenAI `/v1/responses` | Headroom | 由请求头 `x-headroom-base-url` 选择的 OpenAI 上游 |
| Claude Code | Anthropic `/v1/messages` | Headroom | cc-switch `127.0.0.1:15721`，负责协议转换和凭据注入 |

Claude Code 的目标链路为：

```text
Claude Code → Headroom 127.0.0.1:8787（整理 /v1/messages）
           → cc-switch 127.0.0.1:15721（Anthropic↔OpenAI 转换与凭据注入）
           → Codex/ChatGPT
```

cc-switch 不承担压缩；同一 provider 不应同时启用另一个 application-level compression bridge，否则会形成双重整理。

启用 `HEADROOM_CC_SWITCH_RECONCILE=1` 后，reconciler 监视 cc-switch 对 `~/.claude/settings.json` 的覆盖：捕获 `15721` 作为 Headroom 的 Anthropic 运行时上游，并将 `ANTHROPIC_BASE_URL` 纠回 `127.0.0.1:8787`。已有 8787 时跳过自身写入；切换到 Claude Official 时默认允许直连，只有设置 `HEADROOM_CC_SWITCH_ROUTE_OFFICIAL=1` 才强制经 Headroom。

## systemd 安全边界

unit 同时使用 `ProtectHome=tmpfs` 与：

```ini
BindPaths=%h/.claude
```

后者把真实 `~/.claude` 以可写方式 bind 进服务的 mount namespace，使 reconciler 能更新 `settings.json`。代价是该服务虽然仍以当前用户运行且保留 `NoNewPrivileges`、`ProtectSystem=strict`、`PrivateDevices` 等限制，但可以读取 `~/.claude` 下的会话历史、`.mcp.json` 等内容；这是为实现配置回写而记录的防御纵深回退。

## 运行时观测

`GET http://127.0.0.1:8787/admin/upstream` 返回 HTTP 200，响应核心字段为：

```json
{
  "anthropic": "http://127.0.0.1:15721",
  "cc_switch_reconcile": true,
  "captured_upstream": "http://127.0.0.1:15721"
}
```

同一部署的 `proxy.log` 出现以下两类记录：

```text
event=outbound_request ... method=POST path=http://127.0.0.1:15721/v1/messages ...
event=proxy_inbound_response ... method=POST path=/v1/messages status=200 ...
```

`./bin/validate` 完成 shell、systemd、静态契约、Headroom CLI 与 Ponytail 检查，最终输出 `PASS validation`。

## 回滚边界

停止 reconciler 后删除 unit 的 `BindPaths=%h/.claude`，重新安装/加载 user unit 并恢复 `~/.claude/settings.json` 的原始 `ANTHROPIC_BASE_URL`，即可回到 cc-switch 直接接收 Claude Code 请求的路径。回滚时保留现有配置备份，避免覆盖用户设置。

## 未确认项

这是特定项目提交、Headroom 0.34 运行环境和当前 cc-switch 行为的 provisional 证据，不代表所有 Headroom、cc-switch 或 Claude Code 版本都使用相同字段、端口和 reconciler 语义。