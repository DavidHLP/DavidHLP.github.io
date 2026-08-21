---
title: Docker 基础：镜像分层、容器操作与 Compose 网络
timestamp: 2026-08-21 00:00:00+08:00
series: 系统运维与基础设施
kind: concept
status: active
sources: ["ingest-docker-fundamentals"]
related: [containerd-tls-troubleshooting, multi-service-readiness, intranet-penetration-ssh-guide]
tags: [Docker, Container, Compose, Image, Volume, Network]
description: 归纳 Docker 镜像分层、常用命令、数据卷、网络与 Compose 的适用条件与边界。
toc: true
---

`Docker` 的内容在两仓库 7 篇原文中以操作笔记形态重复出现：Dockerfile、分层、数据卷、网络与 Compose。本页把命令清单压成最小可用模型，明确何时用 volume/bind、bridge/host 与 Compose 的价值，不复制镜像倾倒。

## 核心机制

### 1. 镜像分层是缓存与复用的单位

| 概念       | 作用                     | 边界                     |
| ---------- | ------------------------ | ------------------------ |
| Base Image | 共享只读层               | 不要把可变数据写进镜像层 |
| Layer      | 每条 Dockerfile 指令一层 | 过多小层增加元数据       |
| 构建缓存   | 命中可跳过重建           | `COPY` 顺序影响命中率    |

来源原文中 `Layer和BaseImage概念.md` 用 `docker history` 展示分层，`Dockerfile基础.md` 解释 `FROM/RUN/COPY` 的层效应。实践上把不变依赖前置、可变源码后置能命中缓存。

### 2. 容器操作与数据生命周期

- `docker run/stop/start/rm/rmi` 管理容器与镜像生命周期；原文 `Docker常见命令.md` 罗列 save/load/push/pull。
- 数据卷：`volume` 由 Docker 管理，跨容器共享、备份易；`bind mount` 直接映射宿主机路径，适合开发热更新，但耦合宿主机。
- 选择：需要持久且可移植用 volume，需要直接编辑宿主机文件用 bind；不要把数据库文件 bind 到临时目录。

### 3. 网络与 Compose 编排

- `容器网络连接.md` 区分 bridge（默认隔离）、host（共享宿主机网络）、none 与自定义网络；自定义网络支持容器名 DNS。
- `DockerCompose.md` 把 service/network/volume 声明在 `docker-compose.yml`，`up/down/ps/logs/build/pull` 覆盖单机多容器。Compose 适合开发/测试与小型生产，不替代 K8s 的调度与健康。

## 适用条件

- 单机或小集群、需要声明式编排且不依赖 K8s 调度。
- 镜像构建可分层缓存，运行数据需要 volume 持久化。
- 容器间需要 DNS 可达的自定义网络。

## 不适用与风险

- 多宿主机调度、滚动更新与健康门禁应考虑 Compose 之外的编排器（如 K8s）；`multi-service-readiness` 已明确 readiness 与运行期的区别。
- `docker commit` 固化运行态容器为镜像会丢失 Dockerfile 可追溯性；优先重建而非提交。
- bind mount 暴露宿主机路径，生产环境需评估权限与 SELinux/AppArmor。

## 最小验证

1. `docker build` 后 `docker history` 确认层数与缓存命中。
2. `volume` 与 `bind` 分别挂载并重启容器，验证数据是否保留。
3. `docker-compose config` 校验，`up -d` 后 `ps` 与 `logs` 确认服务可达。

## 证据与不确定性

- **来源事实**：`ingest-docker-fundamentals` 原样收录 7 篇原文的命令、数据卷与网络说明。
- **本页综合**：把清单压缩为分层—数据—网络三模型，并给出 volume/bind 选用条件。
- **未确认项**：具体镜像大小、构建耗时与网络性能未做实测；Compose `version` 字段在新版本已可选，原文版本差异未逐字核对。

## 相关页面

- [containerd-tls-troubleshooting](/note/containerd-tls-troubleshooting)
- [multi-service-readiness](/note/multi-service-readiness)
- [intranet-penetration-ssh-guide](/note/intranet-penetration-ssh-guide)
