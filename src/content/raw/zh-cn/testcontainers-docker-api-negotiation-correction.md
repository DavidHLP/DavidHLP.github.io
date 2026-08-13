---
title: "Testcontainers 1.20.6 API 协商更正：源码路径与 999.999 版本矩阵"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-commits-correction
sourceUrl: "https://github.com/testcontainers/testcontainers-java/tree/1.20.6"
immutable: true
correctionOf: "testcontainers-docker-api-negotiation"
tags: [Testcontainers, Docker, docker-java, API-Version, Moby, Diagnostics]
description: "对 Testcontainers 1.20.6 初始 raw 补充两项校正：TestEnvironment 的固定源码路径位于 main/java，以及 docker-java 3.4.1 可解析 999.999，实际失败应归因于 daemon too new。"
---

# Testcontainers 1.20.6 API 协商更正

本文件是 `testcontainers-docker-api-negotiation` 的独立 correction raw，不覆盖、不删除初始快照。

## 1. TestEnvironment 固定路径

Testcontainers 1.20.6 的 `TestEnvironment.java` 固定路径是：

<https://raw.githubusercontent.com/testcontainers/testcontainers-java/1.20.6/core/src/main/java/org/testcontainers/utility/TestEnvironment.java>

不是 `core/src/test/...`。相关 Docker provider 源码仍为：

<https://raw.githubusercontent.com/testcontainers/testcontainers-java/1.20.6/core/src/main/java/org/testcontainers/dockerclient/DockerClientProviderStrategy.java>

## 2. `999.999` 的实际语义

docker-java 3.4.1 的 `RemoteApiVersion` 解析器接受 `999.999` 这种 `major.minor` 形式，并能构造请求版本。因此：

- `-Dapi.version=999.999` 不应描述为客户端解析失败；
- 客户端会发送带 `/v999.999/` 前缀的请求；
- 对 Moby v27.5.1，daemon 应返回 client version too new 的 400；
- 具体错误正文仍由 daemon 版本和 middleware 返回内容决定。

## 固定来源

- `RemoteApiVersion.java`：<https://raw.githubusercontent.com/docker-java/docker-java/3.4.1/docker-java-core/src/main/java/com/github/dockerjava/core/RemoteApiVersion.java>
- Moby version middleware：<https://raw.githubusercontent.com/moby/moby/v27.5.1/api/server/middleware/version.go>

本 correction 只校正静态源码事实，未执行运行矩阵。
