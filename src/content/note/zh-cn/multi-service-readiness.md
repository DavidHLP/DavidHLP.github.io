---
title: "多服务启动就绪：running、ready 与依赖/失败/重启传播"
timestamp: 2026-08-13 00:00:00+08:00
series: "系统运维与基础设施"
kind: concept
status: active
sources: ["multi-service-readiness-contract", "multi-service-readiness-contract-correction", "multi-service-readiness-safety-correction"]
related: ["mysql-performance-troubleshooting", "database-schema-drift"]
tags: [Docker Compose, systemd, depends_on, healthcheck, Readiness, Orchestration]
description: "用一张决策表区分多服务编排中的进程启动、业务就绪、排序、依赖建立、失败与重启传播六个概念，给出 Compose healthcheck/depends_on 与 systemd After/Wants/Requires 的最小组合和验证路径。"
toc: true
---

本页回答一个问题：在 Compose 或 systemd 里声明了依赖之后，我到底得到了什么保证？核心结论：编排器只按声明的 condition（`service_started` / `service_healthy` / `service_completed_successfully`）做启动门禁，不自动保证业务就绪；排序、依赖、失败与重启传播是四个正交语义，必须分开判断。

## 核心机制

### 1. 一张决策表区分六个概念

| 概念 | 语义 | 判定/触发 | 关键边界 |
| --- | --- | --- | --- |
| running（进程启动） | 编排器只等容器“运行中” | 容器状态为 running；端口绑定属于此层 | 不等应用就绪；端口被监听不构成就绪证据 |
| ready（业务就绪） | 必须由用户显式定义 | `healthcheck` 通过，或一次性任务完成（`service_completed_successfully`，v2.20.0+） | 探针是用户命令；编排器不验证应用内状态 |
| ordering（排序） | 只决定先后，不建立依赖 | Compose 短语法 `depends_on: [db]`（等价 `service_started`）；systemd `After=`/`Before=` | 短语法只保证启动顺序；`After=` 与 `Requires=`/`Wants=` 正交 |
| requirement（依赖建立） | 声明“依赖满足才启动” | 长语法 `condition: service_healthy`；systemd `Requires=`/`Wants=` | `Wants=` 是弱形式，失败不影响整体事务 |
| failure propagation（失败传播） | 依赖不健康时依赖方不启动 | `up --wait` 失败退出；`--abort-on-container-failure` 全停；systemd `Requires=`+`After=` | `--abort-on-container-failure` 与 `-d` 不兼容、与 `--wait` 互斥 |
| restart propagation（重启传播） | 只有显式操作触发的重启才传播 | `depends_on.restart: true`；systemd `Requires=` 的显式 stop/restart | 容器运行时自动重启不传播；systemd 意外失败需 `BindsTo=` |

### 2. 关键语义拆分

- **running ≠ ready**：Compose 启动时不等待容器 ready，只等 running（docker/docs 固定源原文）。就绪必须由用户显式定义：`condition: service_healthy`（由 `healthcheck` 定义健康）或 `service_completed_successfully`（一次性任务跑完）。
- **排序 ≠ 依赖（systemd）**：`After=`/`Before=` 只配置排序依赖，与 `Requires=`/`Wants=` 正交（v261.2 手册原文 “independent and orthogonal”）；官方常见写法是同一单元同时放进 `After=` 与 `Wants=`。service 单元在“所有配置的启动命令已被调用（无论成败，含 `ExecStartPost=`）”时即视为完成——已启动不等于可服务。
- **healthcheck 是用户定义的就绪探针**：spec 原文说它声明一个 check 判断容器是否 healthy，工作方式与 Dockerfile `HEALTHCHECK` 相同；探针测什么完全由用户命令决定，编排器不做业务级推断。`test` 支持 `NONE`/`CMD`/`CMD-SHELL`，可用 `disable: true` 关闭。
- **端口占用 ≠ 就绪**：`ports` 只定义发布映射（未写 HOST 时绑定全部网卡 `0.0.0.0`），不涉及容器内应用状态。端口被监听属于“进程启动”层信号，不构成就绪证据。

### 3. 失败传播与重启传播

- **Compose 失败**：spec 保证标了 `service_healthy` 的依赖先健康再启动依赖方；`up --wait`（隐含 detached 模式）在依赖不健康时失败退出（raw 实跑：退出码 1、输出 “dependency failed start: container … is unhealthy”、app 仅创建未启动）；`--abort-on-container-failure` 在任一容器失败退出时停止全部，与 `-d` 不兼容且与 `--wait` 互斥。
- **Compose 重启**：`depends_on.restart: true` 只传播“显式 Compose 操作”触发的重启（如 `docker compose restart` / update）；容器运行时层面的自动重启（`restart: always`/`on-failure`/`unless-stopped`）不通过 `depends_on` 传播。
- **systemd**：`Requires=` + `After=` 时，依赖激活失败会阻止本单元启动；`Wants=` 是弱形式，失败不影响事务整体有效性。`Requires=` 只在依赖被显式 stop/restart 时连带，意外失败不传播；要覆盖“依赖意外停止也连带停止”须用 `BindsTo=`。

## 最小组合示例

### Compose：healthcheck + `depends_on.condition: service_healthy`

```yaml
services:
  app:
    image: alpine:3.19
    command: ["sh", "-c", "echo APP_STARTED; sleep 60"]
    depends_on:
      db:
        condition: service_healthy
        restart: true
  db:
    image: redis:7.2-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
      start_period: 10s
      timeout: 5s
```

选型要点（来自更正 raw 的最小实验）：固定官方镜像、免构建、免凭证、无端口；`app` 不定义 healthcheck，对 `up --wait` 而言 running 即满足，`db` 的 `redis-cli ping` 通过后 `app` 才启动。`healthcheck` 的探针命令决定了 ready 的定义，换成别的命令就换成别的就绪标准。

### systemd：`After=` 与 `Wants=`/`Requires=` 的组合边界

```ini
[Unit]
After=db.service
Wants=db.service
```

- `After=` 只排序：db 先启动，但 db 启动失败不影响本单元。
- 把 `Wants=` 换成 `Requires=`：db 激活失败（且存在 `After=`）时本单元不启动；db 被显式 stop/restart 时本单元连带 stop/restart。
- 边界核对：只有 `After=` 时 `Requires=`/`Wants=` 为空；只有 `Requires=` 没有 `After=` 则不阻止启动；意外失败传播需要 `BindsTo=`。

## 最小验证

先把上面的匿名 fixture 保存到专用临时目录中的 `compose.yaml`。不要在现有开发或生产 Compose 项目目录复制以下命令；`restart` 会中断服务，`--abort-on-container-failure` 会停止该隔离 project 的全部容器，`down` 会停止并删除其容器和网络。

```bash
fixture="$(pwd)/compose.yaml"           # 当前目录必须只包含此匿名 fixture
project="readiness-contract-$$"         # 当前 shell 内唯一；后续命令保持一致
printf 'Copy these values to the scenario terminal: fixture=%q project=%q\n' "$fixture" "$project"

docker compose -f "$fixture" -p "$project" config -q
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 30
docker compose -f "$fixture" -p "$project" ps
docker inspect --format '{{json .State.Health}}' \
  "$(docker compose -f "$fixture" -p "$project" ps -q db)"
# 警告：restart 会中断 db；depends_on.restart: true 时 app 也会重启。
docker compose -f "$fixture" -p "$project" restart db
# 警告：down 会停止并删除此隔离 project 的容器和网络；不要增加 --volumes。
docker compose -f "$fixture" -p "$project" down
```

场景命令需要使用同一 `fixture`/`project`，并与主流程分开运行。另开终端时，先把第一段打印出的实际值填入下面两行；不要让 Compose 从当前目录自动推导 project：

```bash
fixture="<FIXTURE_PATH>"                # 替换为第一段打印的 fixture 值
project="<PROJECT_NAME>"               # 替换为第一段打印的 project 值

# 事件流会阻塞到 Ctrl-C；另开终端用同一 -f/-p 执行 up。
docker compose -f "$fixture" -p "$project" events
# 失败门禁：只在隔离 fixture 中把 db healthcheck.test 改成恒 exit 1。
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 8
# 前台失败传播会在任一容器失败后停止该隔离 project 的全部容器；
# 它与 -d 不兼容并与 --wait 互斥，需要另一个含非零退出服务的隔离 fixture。
docker compose -f "$fixture" -p "$project" up --abort-on-container-failure
```

```bash
systemctl show <unit> -p After -p Before -p Requires -p Wants   # After= 与 Requires= 是正交字段
systemd-analyze verify <unit>.service          # 单元文件校验
```

对照决策表解读验证结果：`ps` 的 healthy 列只证明探针通过，不证明业务就绪；`events` 的 `health_status` 序列用于确认依赖顺序；`systemctl show` 里只有 `After=` 而 `Requires=`/`Wants=` 为空，说明只有排序没有依赖。

## 编排器不能替代的部分

- **migration 不在编排器职责内**：spec 唯一的“一次性任务”排序原语是 `condition: service_completed_successfully`（Compose v2.20.0+ 标注），它只负责排序；迁移逻辑本身必须由用户定义为 service/命令。schema 变更、数据回填等业务就绪不在编排器职责内。
- **业务就绪不在 healthcheck 语义内**：缓存预热、一致性、业务断言等应用内状态，编排器不验证；探针只是用户定义的任意命令。
- 因此“迁移完成后再启动 app”这类需求，正确写法是用户把迁移做成一次性 service 并在 app 上声明 `service_completed_successfully` 依赖，而不是依赖编排器自动推断。

## 适用条件

1. 判断“我的编排声明到底保证什么”时，用决策表逐项对照；尤其区分排序与依赖、失败与重启传播，它们经常被混为一谈。
2. 需要“健康后再启动”时用长语法 `condition: service_healthy`；只在意先后顺序时短语法足够（等价 `service_started`）。
3. systemd 需要“依赖失败就不启动”时用 `Requires=`+`After=`；需要意外失败也连带时才引入 `BindsTo=`。

## 不适用与风险

- 本文首先依据 `multi-service-readiness-contract` 保存的 compose-spec/systemd 固定点；后续 `multi-service-readiness-contract-correction` 独立补充 docker/docs 与 Compose CLI 固定源码和一次性 Redis/Alpine 实验，`multi-service-readiness-safety-correction` 再补充 `-f`/`-p` 项目隔离与 `down` 删除范围。`service_completed_successfully` 需 Compose v2.20.0+；`restart` 字段在 v2.17.0 之前的语义未覆盖。
- 端口占用与就绪的分离是规范推导，没有执行“端口已绑定而应用未就绪”的专门实验；`--wait` 失败、健康后启动和显式 restart 传播则在更正 raw 的最小 fixture 中观察到。
- 未覆盖：swarm mode 下 `depends_on` 的行为差异、systemd `Requisite=`/`PartOf=`/`Conflicts=` 的完整语义。

## 证据与不确定性

- **来源事实**：`multi-service-readiness-contract` 保存最初的 Compose/systemd 规范契约与匿名 PostgreSQL 示例；`multi-service-readiness-contract-correction` 独立保存后续固定来源与一次性 Redis/Alpine 实验，观察到 `service_healthy` 启动门禁、`--wait` 失败退出和显式 restart 传播；`multi-service-readiness-safety-correction` 固定 Compose v5.4.0 的 project flags 与 `down` 删除边界。
- **规范推导**：端口占用 ≠ 就绪；编排器不能从进程/端口自动推断业务状态。
- **未验证项**：没有观察“端口已绑定而应用未就绪”的专门实机行为；systemd 侧的 `Requires=`/`BindsTo=` 传播也未在真实主机实跑，只引用 v261.2 手册语义。

## 相关页面

- [MySQL 性能排查](/note/mysql-performance-troubleshooting)
- [数据库 Schema 漂移](/note/database-schema-drift)
