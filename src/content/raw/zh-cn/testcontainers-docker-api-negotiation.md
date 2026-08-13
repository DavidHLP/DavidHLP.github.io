---
title: "Testcontainers 1.20.6 Docker API 版本协商与失败边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-commits
sourceUrl: "https://github.com/testcontainers/testcontainers-java/tree/1.20.6"
immutable: true
tags: [Testcontainers, Docker, docker-java, API-Version, Moby, Diagnostics]
description: "固定 Testcontainers 1.20.6、docker-java 3.4.1 与 Moby v27.5.1 的源码事实：未知 Docker API 版本回退到 1.32、api.version 系统属性边界、DOCKER_API_VERSION 不生效以及 daemon 版本门禁。"
---

# Testcontainers 1.20.6 Docker API 版本协商与失败边界

本快照固定以下公开来源，不把本机 Docker 状态或私有会话当作证据：

- Testcontainers Java `1.20.6`：`cc1c13af22dc54988a875b0e3540bee1d6329d93`
- docker-java BOM `3.4.1`：`9f3d369bd6db48d99d8fc41109a8bca28cc604b6`
- Moby `v27.5.1`：`4c9b3b011ae4c30145a7b344c870bdda01b454e2`

## 读取过的公开来源

- `DockerClientProviderStrategy.java`：<https://raw.githubusercontent.com/testcontainers/testcontainers-java/1.20.6/core/src/main/java/org/testcontainers/dockerclient/DockerClientProviderStrategy.java>
- `DockerClientFactory.java`：<https://raw.githubusercontent.com/testcontainers/testcontainers-java/1.20.6/core/src/main/java/org/testcontainers/DockerClientFactory.java>
- `TestEnvironment.java`：<https://raw.githubusercontent.com/testcontainers/testcontainers-java/1.20.6/core/src/test/java/org/testcontainers/utility/TestEnvironment.java>
- `DefaultDockerClientConfig.java`：<https://raw.githubusercontent.com/docker-java/docker-java/3.4.1/docker-java-core/src/main/java/com/github/dockerjava/core/DefaultDockerClientConfig.java>
- `RemoteApiVersion.java`：<https://raw.githubusercontent.com/docker-java/docker-java/3.4.1/docker-java-core/src/main/java/com/github/dockerjava/core/RemoteApiVersion.java>
- Moby API version middleware：<https://raw.githubusercontent.com/moby/moby/v27.5.1/api/server/middleware/version.go>
- Moby API 常量：<https://raw.githubusercontent.com/moby/moby/v27.5.1/api/common.go>

## 固定源码事实

### 1. Testcontainers 1.20.6 的回退逻辑是内联的

1.20.6 没有 2.x 中单独命名的 `DockerApiVersionResolver` 或 `DockerApiVersionNegotiator`。`DockerClientProviderStrategy.getClientForConfig` 在 docker-java 配置解析后检查 API 版本；当结果为 `UNKNOWN_VERSION`（未设置、为空或解析失败）时，直接调用 `withApiVersion(RemoteApiVersion.VERSION_1_32)`。

因此，1.20.6 的默认行为不是先请求 daemon `/version` 再动态选择版本，而是先用固定的 `1.32` 构造客户端请求。`/v1.32/info` 是策略探测的首个典型请求。

### 2. `api.version` 是 docker-java 3.4.1 的系统属性

`DefaultDockerClientConfig` 使用 `api.version` 配置键，系统属性优先级高于其他配置来源。当前固定源码审计得到：

- `-Dapi.version=1.32` 可以显式固定请求版本；
- 无值、空值或无法解析的值会变成 `UNKNOWN_VERSION`，再由 Testcontainers 回退到 `1.32`；
- `DOCKER_API_VERSION` 在 docker-java 3.4.1 源码中没有使用点，不能按 Docker CLI 的习惯推断它会改变 Testcontainers 客户端；
- Testcontainers 没有另一个 `TESTCONTAINERS_*` Docker API 版本属性。

### 3. 请求版本与 daemon 报告版本不是同一个字段

一旦客户端版本被确定，每个请求使用 `/vX.Y/` 前缀，连 `/version` 请求也遵循客户端 transport 的版本路径。daemon 返回的 `/version` 响应包含自己的 `ApiVersion`，Testcontainers 暴露的 active API version 来自该响应，可能是 `1.47`；这不等于客户端已经改用 `1.47`。

这解释了日志中同时出现“请求版本”和“API Version”时的差异：前者是 transport 的兼容前缀，后者是 daemon 的能力报告。

### 4. daemon 还会做 min/default 门禁

在 Moby `v27.5.1` 的 VersionMiddleware 中：

- 请求版本低于 daemon 最低版本（该固定版本默认 `1.24`，可由 `DOCKER_MIN_API_VERSION` 覆盖）返回 400，提示 client version too old；
- 请求版本高于 daemon 默认版本（该固定版本为 `1.47`）返回 400，提示 client version too new。

这些 min/default 值属于 daemon 版本边界，不能外推到所有 Docker/Moby 版本。

### 5. Testcontainers 的失败表象可能像“找不到 Docker”

策略探测先调用 `infoCmd().exec()`。如果 `/v1.32/info` 因版本过旧/过新或其他兼容错误返回失败，`tryOutStrategy` 记录该策略失败；所有策略都失败后，外层抛出：

```text
Could not find a valid Docker environment. Please see logs and check configuration
```

所以看到这条异常时，先检查最早的 API 版本 HTTP 错误，不要立即只检查 socket、权限或 daemon 是否运行。

## 历史事实与未验证边界

源码历史显示：

- `c3a8ca76d`（2020-12-10，docker-java 3.2.7）引入 `UNKNOWN_VERSION -> 1.30`；
- `71314ab78`（2021-07-19）将回退值改为 `1.32`。

固定提交没有解释为何选择 `1.32`；“1.32 是跨版本公共基线”只是兼容性推断，不是 Testcontainers 的正式保证。

以下内容没有在本快照中证明：

- Moby 其他版本的最低/最高 API 版本；
- 旧 daemon 是否在 `/version` 版本检查上有例外；
- Testcontainers 1.20.6 是否有专门覆盖 1.32 fallback 的单测；
- Testcontainers 2.x 新类的行为能否直接回推到 1.20.6。

## 最小验证矩阵

在隔离的 Java/Testcontainers 项目中，可用以下矩阵定位配置来源：

| 设置 | 预期观察 |
| --- | --- |
| 不设置 `api.version` | 使用 `1.32` 请求，正常时日志显示 daemon active API version |
| `-Dapi.version=banana` | 解析为 unknown，静默回退 `1.32` |
| `-Dapi.version=1.1` | 在支持更高最低版本的 daemon 上触发 too old 失败 |
| `-Dapi.version=999.999` | 触发 too new 或客户端解析失败 |
| 设置 `DOCKER_API_VERSION` 但不设置 `api.version` | 按本固定源码审计，不应改变 docker-java 请求版本 |

本快照固定了源码和版本关系；上述运行矩阵未在本批中执行。
