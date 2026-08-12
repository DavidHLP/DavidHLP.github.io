---
title: "Headroom 0.34 压缩与检索契约：字段、模式与真实端点验证"
timestamp: 2026-08-12 00:00:00+08:00
series: "OMP 与 Agent 工程"
kind: concept
status: active
sources: ["headroom-0-34-compress-retrieve-contract"]
related: ["headroom-single-port-evolution", "omp-headroom-persistence", "omp-hook-extension-guide", "llm-wiki-pattern"]
tags: [Headroom,API,Compression,CCR,Contract Testing,Agent]
description: "固定 Headroom 0.34.0 的 /v1/compress 与 /v1/retrieve 请求、响应和模式边界，并说明为何真实 loopback contract test 必须与 mock 使用同一 schema。"
toc: true
---

集成 Headroom 0.34.0 时，先把 API 当成版本化契约，而不是根据 dashboard、类型名或 mock 猜字段。`/v1/compress` 需要 `model` 和 `messages`，压缩统计位于响应顶层；`/v1/retrieve` 返回 `original_content`。这三个细节足以让“测试全绿”的适配器在真实代理上失败。

## 契约速查

### `POST /v1/compress`

```json
{
  "model": "<MODEL_NAME>",
  "messages": [
    {"role": "user", "content": "..."}
  ],
  "config": {}
}
```

非空消息走正常压缩路径时，成功响应包含以下顶层字段：

```text
messages
tokens_before
tokens_after
tokens_saved
compression_ratio
transforms_applied
transforms_summary
ccr_hashes
```

边界如下：

- 缺少 `model` 或 `messages` 返回 HTTP 400。
- 端点接受 `messages`；Codex Responses 的 `input` 数组必须先转换，不能原样发送。
- `tokens_saved` 在顶层，不在 `stats` 下。
- 空消息列表在 config 校验前快速返回，且响应不含 `transforms_summary`；调用方仍应决定空列表是否符合业务语义。

### `POST /v1/retrieve`

```json
{"hash": "<CCR_HASH>"}
```

成功响应包含：

```text
hash
original_content
original_tokens
original_item_count
compressed_item_count
tool_name
retrieval_count
```

缺少 `hash` 返回 HTTP 400；hash 不存在或已过期返回 HTTP 404。适配器应读取 `original_content`，不要探测并不存在的 `content` 或 `found`。

## 压缩模式不是同义开关

| `config.mode` | Marker | Store write | 适用条件 |
| --- | --- | --- | --- |
| 省略 | 无 | 无 | 默认路径；调用方不需要 CCR 检索闭环 |
| `ccr` | 条件产生 | 条件写入 | 调用方能注入检索工具并访问 loopback `/v1/retrieve` |
| `lossy_inline` | 无 | 无 | 先 lossless fold，再对剩余内容执行 Kompress |
| `lossless_then_lossy` | 无 | 无 | `lossy_inline` 的兼容别名 |

`ccr_hashes` 只报告实际插入的 marker。即使启用 `ccr`，普通文本或一般 function 消息也不保证产生 marker；structured tool output 发生 SmartCrusher row-drop 时才是已验证的产生路径。因此，测试不能把“启用了 `ccr`”等同于“响应一定有非空 `ccr_hashes`”。

## 固定 provider cache 前缀

非空消息进入正常压缩路径时，`config.frozen_message_count` 必须是非负整数。它固定前 N 条已经进入 provider prompt cache 的消息：这些消息仍参与跨消息分析，但返回时保持字节不变，避免每轮压缩重写已付费的 cache prefix。空消息会在这项校验前快速返回。

它与“保护最近 N 条消息”方向相反：

- `frozen_message_count` 固定开头的 provider cache 前缀；
- `protect_recent` 保护靠近尾部的最近消息。

把两者混用会造成 cache miss，或让本应压缩的历史消息被长期保留。

## 为什么 mock 会给出假阳性

曾出现过三种自洽但错误的 mock 假设：

1. 从 `stats.tokens_saved` 读取统计；
2. 从检索响应读取 `content` 或 `found`；
3. 允许省略 `model`。

如果实现与 mock 共享这些错误，单元测试仍会通过。最小修复不是增加更多 mock，而是从固定版本源码提取真实 schema，再让 mock 和 loopback contract test 共同遵守它。

## 最小 contract test

至少覆盖四类断言：

1. `/v1/compress` 缺 `model` 返回 400；
2. 合法压缩请求的 `tokens_saved` 位于顶层；
3. `/v1/retrieve` 的正文键为 `original_content`；
4. 只有实际产生 marker 的 fixture 才断言 `ccr_hashes` 非空。

测试真实 loopback 端点时还要隔离传输环境。Bun 的 `fetch` 在某些环境会使用 `HTTP_PROXY`，却不按预期绕过 loopback；此时应在测试进程中清除代理变量，或改用明确不代理 loopback 的客户端。否则连接错误会被误诊为 API 契约失败。

## 适用范围、风险与回滚

本页只适用于 `headroom-ai==0.34.0`。升级后应重新读取固定标签源码并执行同一组 contract tests，尤其关注请求必填字段、响应层级、mode 别名和 CCR store 行为。

集成回滚不需要删除数据：将新请求恢复为默认 marker-free 模式。已经含有 CCR marker 的活跃会话应继续保留检索工具直到越过会话边界，或直接新开会话；之后再停用依赖 `/v1/retrieve` 的工具注入。若已经写入 CCR store，应按 Headroom 自身生命周期清理，不要手工修改 store 内部文件。

## 相关页面

- [Headroom 单端口路由](/note/headroom-single-port-evolution)
- [Headroom 路由持久化](/note/omp-headroom-persistence)
- [OMP Hook 扩展](/note/omp-hook-extension-guide)
- [LLM-Wiki 模式](/note/llm-wiki-pattern)
