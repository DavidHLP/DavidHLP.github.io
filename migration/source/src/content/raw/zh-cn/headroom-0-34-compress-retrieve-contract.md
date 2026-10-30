---
title: "Headroom 0.34.0 /v1/compress 与 /v1/retrieve 契约"
capturedAt: 2026-08-12 00:00:00+00:00
sourceType: upstream-source-and-contract-test
sourceUrl: "https://github.com/headroomlabs-ai/headroom/tree/v0.34.0"
immutable: true
tags: [Headroom, API, Compression, CCR, Contract Testing]
description: "从 Headroom 0.34.0 固定标签源码与本地 loopback contract test 提取的最小、脱敏 API 契约；不包含会话、凭证或本机路径。"
---

# Headroom 0.34.0 压缩与检索契约

这份证据快照只保留可公开复现的字段级事实。版本边界是 `headroom-ai==0.34.0`；后续版本必须重新核对固定标签源码和真实端点。

## `/v1/compress`

请求方法为 `POST`，主体至少包含：

```json
{
  "model": "<MODEL_NAME>",
  "messages": [
    {"role": "user", "content": "..."}
  ]
}
```

`config` 是可选对象；省略时按空对象处理。

- 缺少 `messages` 返回 HTTP 400。
- 缺少 `model` 返回 HTTP 400。
- 该端点读取 `messages`，不能把 Codex Responses 的 `input` 数组原样当作请求主体。
- 非空消息走正常压缩路径时，成功响应的统计字段位于顶层：`messages`、`tokens_before`、`tokens_after`、`tokens_saved`、`compression_ratio`、`transforms_applied`、`transforms_summary`、`ccr_hashes`。空消息 fast return 不含 `transforms_summary`。不要按 `stats.tokens_saved` 读取。

`config.mode` 的版本内语义：

| 值 | 行为 |
| --- | --- |
| 省略 | marker-free，不创建 CCR 检索往返 |
| `ccr` | 条件生成 CCR marker 并写入对应 store entry；调用方还必须注入检索工具且能访问 loopback `/v1/retrieve` |
| `lossy_inline` | marker-free；先 lossless fold，再对剩余内容执行 Kompress |
| `lossless_then_lossy` | `lossy_inline` 的别名 |

`config.frozen_message_count` 在非空消息进入正常压缩路径时必须是非负整数。它固定已进入 provider prompt cache 的前 N 条消息，使压缩不会重写该前缀；它不是“保护最近消息”的替代字段。空消息 fast return 在 config 校验前返回。

## `/v1/retrieve`

请求方法为 `POST`，主体为：

```json
{"hash": "<CCR_HASH>"}
```

成功响应字段为：

```text
hash
original_content
original_tokens
original_item_count
compressed_item_count
tool_name
retrieval_count
```

缺少 `hash` 返回 HTTP 400；store 中不存在或已过期的 hash 返回 HTTP 404。调用方必须读取 `original_content`，不能假设存在 `content` 或 `found`。

## Marker 边界

`ccr_hashes` 表示本次压缩实际插入的 marker。只有选择 `ccr` 且压缩路径确实产生 marker 时才可依赖它；普通纯文本或一般 function 消息不保证生成 marker。对 structured tool output 的 SmartCrusher row-drop 是已观察到的 marker 产生路径。

## 脱敏后的 loopback 观测

| Probe | HTTP 状态 | 观测结果 |
| --- | ---: | --- |
| 非空 `messages`、缺少 `model` | 400 | `invalid_request` |
| 合法 `model` 与非空 `messages` | 200 | `tokens_saved` 位于响应顶层，不存在 `stats.tokens_saved` |
| `ccr` structured tool output 触发 row-drop，再用返回的 hash 调用 `/v1/retrieve` | 200 | 正文键为 `original_content` |

Probe 在测试进程中清除代理环境变量后直接访问 loopback endpoint；这里只保留状态码和字段级结果，不保存请求中的会话正文。

## 验证方式

1. 从固定标签 `v0.34.0` 读取 `headroom/proxy/handlers/openai.py` 的 `handle_compress` 与 `headroom/proxy/server.py` 的 `ccr_retrieve`。
2. 对真实 loopback proxy 发送最小请求，分别断言缺字段的 400、成功响应字段位置和检索字段名称。
3. Mock 必须复用相同 schema；只用自造 mock 不能证明真实 API 契约。

Bun 环境若设置了 `HTTP_PROXY`，loopback `fetch` 可能被送到外部代理而失败。contract test 应显式清除代理环境变量，或使用不会代理 loopback 的客户端；这属于测试传输问题，不是 Headroom API 失败。
