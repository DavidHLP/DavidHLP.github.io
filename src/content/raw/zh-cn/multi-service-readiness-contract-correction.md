---
title: "多服务启动就绪契约更正：固定来源与最小运行实验"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-spec-source-and-minimal-experiment
sourceUrl: "https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md"
immutable: true
tags: [Docker Compose, systemd, depends_on, healthcheck, Readiness, Orchestration]
description: "以固定 commit 的 Compose 规范与 systemd v261.2 手册提取多服务启动就绪最小契约：进程启动、依赖排序、健康检查、端口占用、失败与重启传播六者的区别与边界；不含私有部署细节。"
---

# 多服务启动就绪契约更正

本文件是对同日早先快照的独立补充，保留后续固定来源与最小运行实验；不得覆盖或删除原 raw。

这份快照只保留固定公开源可支持的字段级/行为级事实。核心结论：编排器只按声明的 condition（service_started / service_healthy / service_completed_successfully）做启动门禁，不保证“业务就绪”。

## 版本/固定点

- compose-spec `05-services.md` @ commit `11296e387ba76c77db1db768b9153a4304a3c9bd`（main，2026-07-17）。
- docker/docs `startup-order.md` @ commit `0220ef67450476a5e2c18f481f29a3ee1b352f56`（2025-12-04）。
- docker/compose `cmd/compose/up.go` @ tag `v5.4.0`（CLI flag 定义）。
- systemd.unit(5) @ tag `v261.2`（commit `4925d9f07fc697efccd98a93046ff535b8832445`）。

## 来源列表

1. compose-spec 05-services.md（固定 commit）：<https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md>（`depends_on`、`healthcheck`、`ports`、`restart` 章节）
2. docker/docs startup-order.md（固定 commit）：<https://github.com/docker/docs/blob/0220ef67450476a5e2c18f481f29a3ee1b352f56/content/manuals/compose/how-tos/startup-order.md>
3. docker/compose cmd/compose/up.go（固定 tag）：<https://github.com/docker/compose/blob/v5.4.0/cmd/compose/up.go>（`--wait`、`--wait-timeout`、`--abort-on-container-failure` 定义）
4. systemd.unit(5) 手册源（固定 tag）：<https://github.com/systemd/systemd/blob/v261.2/man/systemd.unit.xml>

## 最小事实：六组概念的区别

### 1. 进程启动（running）≠ 就绪（ready）

Docker docs 固定源原文：“On startup, Compose does not wait until a container "ready", only until it's running.” 依赖的“就绪”必须由用户显式定义：`condition: service_healthy`（由 `healthcheck` 定义健康）或 `service_completed_successfully`（一次性任务跑完）。短语法 `depends_on: [db]` 只保证启动顺序，等价于 `condition: service_started`。

### 2. 依赖排序 ≠ 依赖建立（systemd 边界）

systemd.unit(5) v261.2 原文：After=/Before= “configure ordering dependencies between units”，并且 “those settings are independent and orthogonal to requirement dependencies as configured by Requires=, Wants=, Requisite=, or BindsTo=”。`After=` 只排序；要建立“启动依赖”必须另有 `Requires=`/`Wants=`。官方建议的常见写法是把同一单元同时放进 `After=` 与 `Wants=`。手册还注明：service 单元的启动，对 After=/Before= 而言在“所有配置的启动命令已被调用（无论成败）”时即视为完成（含 `ExecStartPost=`）——即“已启动”不等于“应用可服务”。

### 3. 健康检查 = 用户定义的就绪探针

spec 原文：`healthcheck` “declares a check that's run to determine whether or not service containers are "healthy"”，工作方式与 Dockerfile `HEALTHCHECK` 指令相同，Compose 文件可覆盖镜像默认值。`test` 支持 `NONE`、`CMD`、`CMD-SHELL`，可用 `disable: true` 关闭。`interval`/`timeout`/`start_period`/`start_interval` 为时长。探针测什么完全由用户写的命令决定；编排器不做业务级推断。

### 4. 端口占用 ≠ 就绪

spec `ports` 只定义发布映射（`[HOST:]CONTAINER[/PROTOCOL]`；未写 HOST 时绑定全部网卡 `0.0.0.0`），不涉及容器内应用状态。结合第 1 条（running ≠ ready）与第 3 条（`service_healthy` 的就绪信号仅由用户定义的 healthcheck 给出）：端口被监听/绑定属于“进程启动”层信号，不构成就绪证据。此条为两条固定源共同支持的规范推导，本快照未做“端口已绑定而应用未就绪”的实机观察。

### 5. 失败传播

- Compose：spec 原文“Compose guarantees dependency services marked with `service_healthy` are "healthy" before starting dependent service.” 依赖永不健康时该保证无法满足，被依赖方不启动。`docker compose up --wait` 的定义（docker/compose v5.4.0 up.go）为“Wait for services to be running|healthy. Implies detached mode.”，`--wait-timeout` 为“Maximum duration in seconds to wait for the project to be running|healthy”——依赖不健康时等待超时即失败退出（超时失败为 flag 语义推导）。`--abort-on-container-failure` 定义为“Stops all containers if any container exited with failure. Incompatible with -d”；且 `--wait` 与 `--abort-on-container-failure` 不可同时使用（up.go 校验互斥）。
- systemd：`Requires=` 原文“If this unit gets activated, units listed will be activated as well. If one of the other units fails to activate, and an ordering dependency After= on the failing unit is set, this unit will not be started.” 即 Requires= + After= 时，依赖激活失败会阻止本单元启动。`Wants=` 是弱形式：列出的单元启动失败“has no impact on the validity of the transaction as a whole”。

### 6. 重启传播

- Compose：`depends_on` 长语法 `restart: true`，spec 原文“When set to true Compose restarts service after updates dependency service. This applies explicit restart controlled by Compose operation, excludes automated restart by container runtime after container dies.” 固定 startup-order.md 补充：“`restart: true` ensures if `db` updated or restarted due an explicit Compose operation, example `docker compose restart`, `web` service also restarted automatically”。反向边界同样明确：容器运行时层面的自动重启（`restart: always`/`on-failure`/`unless-stopped` 策略，spec `restart` 章节）不通过 `depends_on` 传播到依赖方。
- systemd：`Requires=` 原文“this unit will be stopped (or restarted) if one of the other units is explicitly stopped (or restarted)”，但意外失败不传播；需要“依赖意外停止也连带停止”时须用 `BindsTo=`（“also does so if the listed unit stops unexpectedly (which includes when it fails)”）。

## 最小匿名示例与验证

最小匿名示例（固定官方镜像，无需构建、无凭证、无端口；本快照已按此实跑验证）：

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

`app` 不定义 healthcheck：对 `up --wait` 而言“running”即满足；`db` 的 `redis-cli ping` 通过后 `app` 才启动。若改用需 `POSTGRES_PASSWORD` 的 postgres 镜像，示例将无法无凭证复现，故此处不用。

可重复验证命令（主流程，非阻塞）：

```bash
docker compose config -q                                    # 校验文件
docker compose up -d --wait --wait-timeout 30                # 等待全部 running|healthy；依赖不健康时失败退出
docker compose ps                                            # 查看健康状态列
docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q db)"  # 健康检查明细（-q 输出容器 ID）
docker compose restart db                                    # 配合 depends_on.restart: true：db 重启后 app 自动重启
docker compose down                                          # 清理
```

场景命令（阻塞型或需独立 fixture，不与主流程同流）：

```bash
# 事件流：阻塞直到 Ctrl-C；另开终端执行 up --wait，可观察到 create/start/health_status 事件
docker compose events
# 失败传播 fixture：将 db 的 healthcheck.test 改为 ["CMD","sh","-c","exit 1"] 后执行——
# up 以非零码退出，app 仅创建不启动
docker compose up -d --wait --wait-timeout 8
# 前台失败传播（与 -d 互斥，阻塞至停止）：任一容器失败退出即停止全部；需配 command 非零退出的服务
docker compose up --abort-on-container-failure
```

systemd 边界核对（v261.2 手册语义）：

```bash
systemctl show <unit> -p After -p Before -p Requires -p Wants
systemd-analyze verify <unit>.service
```

`systemctl show` 输出中 `After=` 与 `Requires=` 是正交字段；只有排序没有依赖时，`Requires=`/`Wants=` 为空。

## 边界与未证明内容

- Compose 不能代替应用级迁移：spec 唯一的“一次性任务”排序原语是 `condition: service_completed_successfully`（Compose v2.20.0+ 标注）。迁移逻辑本身必须由用户定义为 service/命令，编排器只负责排序；schema 变更、数据回填等业务就绪不在编排器职责内（由 spec 无此原语推出）。
- 业务就绪（如缓存预热、一致性与业务断言）不在 healthcheck 语义内：探针是用户定义的任意命令，编排器不验证应用内状态。
- 本机观测（docker 29.7.1 / Compose v5.4.0，本地镜像 redis:7.2-alpine、alpine:3.19，临时目录完成，已清理）：
  - `up -d --wait` 事件序列为 db Started → Healthy → app Started，即 app 在 db 健康后才启动。
  - `docker compose restart db` 后 db 重新 healthy 时 app 自动重启（容器 StartedAt 更新）；与固定 startup-order.md 所述一致。
  - 恒 `exit 1` 探针下 `up -d --wait` 退出码 1，输出“dependency failed start: container … is unhealthy”；`ps` 中 db 为 unhealthy，app 仅创建未启动。
  - `docker compose events` 输出 `health_status: unhealthy` 事件。
- 未观察：端口占用与就绪的分离为规范推导（见第 4 条），未做“端口已绑定而应用未就绪”的实机观察。
- 未覆盖：swarm mode 下 `depends_on` 的行为差异、Compose v2.17.0 之前版本的 `restart` 字段、systemd 其他依赖类型（Requisite=、PartOf=、Conflicts=）的完整语义；这些需要另行固定源。
- 事实、推导与未观察项已在正文分别标注；本快照不含用户名、绝对路径、凭证、内部主机或私有实现。
