---
title: "Testcontainers 1.20.6：先排查 Docker API 版本，再判断 daemon 不可用"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java 安全、并发与测试"
kind: concept
status: active
sources: ["testcontainers-docker-api-negotiation", "testcontainers-docker-api-negotiation-correction"]
related: ["containerd-tls-troubleshooting", "multi-service-readiness"]
tags: ["Testcontainers", "Docker", "docker-java", "API-Version", "Moby", "Diagnostics"]
description: "说明 Testcontainers 1.20.6 如何将未知 Docker API 版本回退到 1.32、为什么 DOCKER_API_VERSION 不应套用 Docker CLI 经验，以及如何从最早的 400 错误区分版本不兼容和 Docker 环境缺失。"
toc: true
---

**结论优先**：Testcontainers Java `1.20.6` 把未知 Docker API 版本回退到 `1.32`，而不是先动态协商到 daemon 的最新版本。遇到 `Could not find a valid Docker environment` 时，先检查最早的 `/v1.32/info` 请求和 HTTP 400；不要因为 daemon 正在运行，就排除 API 版本不兼容。

## 版本边界

| 组件                | 固定范围                    |
| ------------------- | --------------------------- |
| Testcontainers Java | `1.20.6`，commit `cc1c13af` |
| docker-java         | BOM `3.4.1`                 |
| 对照 daemon         | Moby `v27.5.1`              |

本文只对这组固定源码负责。Testcontainers 2.x 的 API 版本实现不能直接回推到 1.20.6。

## 1. 1.20.6 的默认请求版本

在 `DockerClientProviderStrategy.getClientForConfig` 中，docker-java 配置解析后如果 API 版本是 `UNKNOWN_VERSION`，Testcontainers 直接设置：

```java
withApiVersion(RemoteApiVersion.VERSION_1_32)
```

`UNKNOWN_VERSION` 包括未设置、空值和无法解析的值。因此默认路径是：

```text
配置解析
  -> UNKNOWN_VERSION
  -> 固定为 1.32
  -> 首次策略探测请求 /v1.32/info
```

这不是“向 daemon 询问最新版本并选择它”。daemon `/version` 返回的 `ApiVersion` 是能力报告，可能是 `1.47`；它不表示客户端请求已经切换为 `1.47`。

## 2. 配置键不要套用 Docker CLI 经验

在 docker-java `3.4.1` 固定源码中，`api.version` 是读取的配置键，系统属性优先：

```bash
mvn test -Dapi.version=1.32
```

当前源码审计没有发现 `DOCKER_API_VERSION` 的使用点。它可能是 Docker CLI 或其他客户端的配置习惯，但不能据此断言会影响 Testcontainers 1.20.6。

为了避免排错时混淆，先固定一个来源：

1. 用 `-Dapi.version=1.32` 做基线；
2. 观察实际请求路径和 Testcontainers 日志；
3. 再单独改变环境变量，确认它是否真的改变请求；
4. 不要同时混入 Docker context、socket 和 API 版本变量。

## 3. daemon 的 min/default 版本检查

以 Moby `v27.5.1` 为例，VersionMiddleware 会拒绝：

- 低于最低 API 版本的请求，返回 `client version X is too old`；
- 高于 daemon 默认 API 版本的请求，返回 `client version X is too new`。

该固定版本的默认边界是最低 `1.24`、默认/最高 `1.47`；最低值还可由 `DOCKER_MIN_API_VERSION` 覆盖。其他 daemon 版本必须重新读取其源码或 `/version` 响应，不能硬编码到所有环境。

## 4. 为什么最后会变成“找不到 Docker 环境”

Testcontainers 的 provider strategy 会先执行 `infoCmd().exec()`。如果 `/v1.32/info` 因版本兼容性失败，当前策略被记为失败；当所有策略都失败，外层才抛出：

```text
Could not find a valid Docker environment. Please see logs and check configuration
```

诊断顺序应是：

1. 找到日志中最早的 HTTP 请求和状态码；
2. 判断路径是 `/v1.32/...` 还是显式版本；
3. 若是 400，读取 too old/too new 的服务端正文；
4. 再检查 socket、TLS、权限和 context；
5. 最后才换 provider strategy。

## 最小验证矩阵

在隔离项目中执行同一个最小 Testcontainers 测试，逐项只改变一个输入：

| 输入                        | 预期                                             |
| --------------------------- | ------------------------------------------------ |
| 不设置 `api.version`        | 请求版本为 `1.32`                                |
| `-Dapi.version=banana`      | unknown，静默回退 `1.32`                         |
| `-Dapi.version=1.1`         | 对较新 daemon 触发 too old                       |
| `-Dapi.version=999.999`     | docker-java 可解析；对 Moby v27.5.1 触发 too new |
| 只设置 `DOCKER_API_VERSION` | 按固定源码审计，不应替代 `api.version`           |

本页引用的矩阵是复现方案，不是本批已经执行的运行结果；要把它写成环境结论，必须保留实际 daemon 版本和日志。

## 常见误区

- **“daemon 在运行，所以 Testcontainers 一定能用。”** API transport 仍可能先被 daemon 拒绝。
- **“Testcontainers 会自动使用 daemon 最新 API。”** 1.20.6 默认 unknown fallback 是 `1.32`。
- **“设置 `DOCKER_API_VERSION` 就能控制 docker-java。”** 当前固定 docker-java 源码未使用该环境变量。
- **“看到 valid Docker environment 异常就换 socket。”** 先查最早的 API 400，避免掩盖根因。
- **“1.24/1.47 是永恒边界。”** 它们只属于 Moby `v27.5.1` 固定版本。

## 证据边界

初始源码快照、版本更正和未验证项见仓库 `src/content/raw/zh-cn/testcontainers-docker-api-negotiation.md` 与 `testcontainers-docker-api-negotiation-correction.md`。这不是对所有 Testcontainers 或 Docker 版本的通用保证。
