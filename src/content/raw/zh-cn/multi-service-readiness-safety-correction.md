---
title: "多服务启动就绪验证安全更正：Compose project 隔离与 down 边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-tag
sourceUrl: "https://github.com/docker/compose/tree/v5.4.0"
immutable: true
tags: [DockerCompose, ProjectName, Isolation, Down, Safety, Correction]
description: "以 Docker Compose v5.4.0 固定源码补充验证命令的项目隔离与清理边界，更正早期快照中未限定 project 的 restart、abort 和 down 示例。不含私有路径、凭证或会话记录。"
---

# 多服务启动就绪验证安全更正：Compose project 隔离与 down 边界

本快照不覆盖 `multi-service-readiness-contract` 或 `multi-service-readiness-contract-correction`。它只补充后续安全审查发现的命令作用域缺口。

## 固定来源

- Docker Compose tag：`v5.4.0`。
- `cmd/compose/compose.go`：`COMPOSE_PROJECT_NAME` 用于指定 project name，而不是从父目录推断；全局 `--project-name`/`-p` flag 描述为 `Project name`，`--file`/`-f` 用于指定 Compose 配置文件。
- `cmd/compose/down.go`：`down` 命令摘要是 `Stop and remove containers, networks`；只有显式 `--volumes` 才额外删除 compose 文件声明的 named volumes 与容器 anonymous volumes。
- 固定源码：
  - <https://github.com/docker/compose/blob/v5.4.0/cmd/compose/compose.go>
  - <https://github.com/docker/compose/blob/v5.4.0/cmd/compose/down.go>

## 对早期验证命令的更正

早期 raw 直接给出 `docker compose restart`、`up --abort-on-container-failure` 与 `down`，却没有固定 Compose 文件或 project name。Compose 会从当前目录/配置解析 project；读者若在真实项目目录直接复制，命令可能重启、停止或删除该项目资源。

安全验证必须同时满足：

1. 在只含匿名 fixture 的临时目录中运行；不要复用开发或生产 Compose 文件。
2. 每条命令使用同一个专用 `-f <fixture>` 与唯一 `-p <project>`，避免命中当前目录推导出的真实项目。
3. 执行前明确：`restart` 会造成服务中断；`--abort-on-container-failure` 会停止该隔离 project 的全部容器；`down` 会停止并删除该隔离 project 的容器和网络。
4. 不要在清理命令中增加 `--volumes`，除非确实要删除该隔离 fixture 的卷数据。

最小安全命令形态：

```bash
fixture="$(pwd)/compose.yaml"              # 当前目录必须是专用临时 fixture
project="readiness-contract-$$"            # 当前 shell 内唯一且后续命令保持一致

docker compose -f "$fixture" -p "$project" config -q
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 30
docker compose -f "$fixture" -p "$project" ps
# 警告：以下 restart 会中断该隔离 project 的服务。
docker compose -f "$fixture" -p "$project" restart db
# 警告：down 会停止并删除该隔离 project 的容器和网络。
docker compose -f "$fixture" -p "$project" down
```

## 边界

- 本快照固定 CLI 的 project 选择 flag 与 `down` 删除范围；它不声称 `-p` 能保护名称碰撞的 project，因此仍要求唯一名称与专用 fixture。
- 本快照没有重跑早期 readiness 实验，只更正公开验证命令的安全作用域。
