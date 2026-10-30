---
title: "UltiCode Docker 沙箱：资源隔离与基础设施错误分类"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Docker, Seccomp, Sandbox, ResourceLimit, ErrorHandling, LLM]
description: "从 UltiCode 的 D-form 执行路径提炼 Docker 资源/安全参数、seccomp fail-closed 和用户错误与基础设施错误分类。"
toc: true
---

> **证据状态**：本文依据 UltiCode 当前固定提交的 Docker 执行器、错误分类器和沙箱测试整理。它说明实现了明确的隔离与分类边界，不等于完成了完整的容器逃逸审计或生产安全证明。

运行用户代码的难点不只是启动一个进程，而是让代码无法轻易影响宿主资源，同时让平台知道“是用户代码失败，还是 Docker/宿主机失败”。如果两类故障都返回同一个 Runtime Error，系统既无法正确提示用户，也无法决定是否应该重试基础设施。

## D-form 执行路径

[`SandboxExecutorImpl`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) 的 D-form 路径会：

1. 解析语言 profile 和有效资源限制；
2. 创建临时 job workspace；
3. 写入只读 `input.json` 和工作区内容；
4. 通过生命周期 runner 启动 Docker；
5. 解析结果 envelope；
6. 在 `finally` 中尽力清理 job 目录。

## 安全和资源参数是显式的

当前 Docker 命令包含：

```text
--network none
--cap-drop ALL
--read-only
--user 1000:1000
--security-opt no-new-privileges
--security-opt seccomp=<resolved profile>
--memory <effective limit>
--cpus <effective limit>
--pids-limit <effective limit>
--ulimit nofile=128:128
--tmpfs /tmp:rw,exec,size=64m
<workspace>:/workspace:ro
--rm
```

这组参数形成了网络、Linux capability、文件系统、用户身份、进程数、文件描述符和 CPU/内存的多层边界。seccomp profile 的解析失败不会静默删除过滤器，而是保留错误，使 Docker 返回明确的配置失败。

这种行为是 fail-closed：配置不完整时宁愿拒绝执行，也不把“暂时能跑”当成隔离仍然有效。

## 分类比一个 `FAILED` 更重要

[`SandboxOutcomeClassifier`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java) 将结果区分为：

| 现象 | 分类 |
|---|---|
| 进程启动本身失败 | launch failure |
| exit code 137 | out of memory |
| exit code 125 | OCI/daemon error |
| `Cannot fork`、pids、`RLIMIT_NPROC` | fork limit |
| 编译器拒绝代码 | compile error |
| 其余非零退出 | runtime error |

因此 Docker daemon 没有创建容器、seccomp 路径错误或宿主 pids 资源不足时，不会被伪装成用户程序的普通运行错误。错误分类还应与监控、重试和用户提示保持一致，否则分类器只是漂亮的枚举。

## 安全边界仍需诚实描述

这些参数是重要的防护层，但源码阅读不能推出“彻底阻断逃逸”。真实安全结论还需要在目标 Docker、内核、镜像、Rootless/remote daemon 和权限配置上做专门测试与审计。本文只确认实现中存在 fail-closed 参数和基础设施错误分类。

## 对 LLM/Agent 系统的迁移

模型生成代码、插件和工具脚本应当被视作不可信执行输入。除容器隔离外，还需要显式的文件、网络、进程、时间和输出大小上限；同时把 provider/权限拒绝和模型生成错误分开。这样 Agent 才能知道是修改输入、请求授权，还是重试基础设施。

## 最小验证路径

阅读 [SandboxExecutorImpl.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java)、[SandboxOutcomeClassifier.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java)，再看 [`SandboxExecutorImplForkDetectionTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplForkDetectionTest.java) 和 [`SandboxExecutorImplSeccompResolutionTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplSeccompResolutionTest.java)。
