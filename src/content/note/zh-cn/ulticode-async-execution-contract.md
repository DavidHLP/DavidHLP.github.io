---
title: "UltiCode 异步执行契约：idempotency、fingerprint 与有界 receipt"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Async, Idempotency, Fingerprint, StateMachine, Judge0, LLM]
description: "解释 UltiCode 如何让同步预览与异步执行共享 contract，并用幂等键、SHA-256 fingerprint、状态机和内存上限约束长任务。"
toc: true
---

> **证据状态**：本文依据 UltiCode 的异步执行接口和 Judge provider 源码整理。当前实现包含 Docker 默认 adapter、可选 Judge0 adapter 以及有界进程内 metadata；跨副本或重启后的持久 receipt 幂等仍是明确缺口。

同步预览和异步执行解决的是同一个问题的不同时间尺度：前者希望尽快拿到结果，后者允许任务排队、运行、取消或超时。如果两条路径各自定义输入、状态和错误，调用方最终会得到两套互不兼容的执行语义。

## 先定义执行 contract

[`AsyncSandboxExecutor`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) 提供 `submit`、`poll`、`cancel`，并把执行状态限制为：

```text
QUEUED -> RUNNING -> COMPLETED
                  ├-> FAILED
                  ├-> CANCELLED
                  └-> TIMED_OUT
```

`ExecutionRequest` 要求 job、test case、visibility 和非空 idempotency key。默认 key 为 `job.runId:testCase.id`，同时计算 SHA-256 fingerprint。于是“同一个 key”不再只是字符串相同，还可以检查 payload 是否一致。

## Provider 负责入口约束

[`CodeExecutionProvider`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java) 在入口处做几件重要的事：

- 同步 `execute` 只接受 `PUBLIC_PREVIEW`；
- 业务异常映射成 typed `RpcResult`，调用方不需要解析任意字符串；
- 异步提交限制为一个 test case；
- 完成、取消和超时后回收 metadata，失败状态仍允许继续查询；
- metadata 上限为 1024 条，TTL 为 15 分钟。

这些限制看起来像“保守”，实际是在阻止一个预览接口逐渐变成没有容量边界的全局任务管理器。

## Adapter 可以替换，语义不能漂移

Docker 是默认的异步 runtime，Judge0 是可选 adapter。Docker 和 Judge0 都有对应的幂等回放测试：同一个 idempotency key 的终态 receipt 可以重放，不同 payload 则不能无条件复用相同句柄。

这说明替换执行后端时，真正需要保持的是 contract：输入指纹、状态不变量、取消语义和终态结果，而不是某个 adapter 的内部 API。

## 当前缺口：receipt 还不是持久队列

架构文档明确指出，当前异步 receipt metadata 受限于进程内内存；跨副本和重启后的持久幂等尚未完成，外部 Judge0 实例也没有被默认验证。因而本文只能说“实现了有界的异步执行 seam”，不能说“任务在任何重启后都可恢复”。

## 对 LLM/Agent 系统的迁移

Agent 任务也应当拥有明确的 `QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED/TIMED_OUT` 状态、幂等键、输入 fingerprint 和 metadata 上限。尤其当用户重复点击“继续执行”或多个 Agent 同时接管任务时，payload 冲突必须显式返回，而不是悄悄复用旧结果。

## 最小验证路径

先阅读 [AsyncSandboxExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) 和 [CodeExecutionProvider.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java)，再对照 [`DockerAsyncSandboxAdapterTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/DockerAsyncSandboxAdapterTest.java) 和 [`Judge0AsyncSandboxAdapterTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/Judge0AsyncSandboxAdapterTest.java)。
