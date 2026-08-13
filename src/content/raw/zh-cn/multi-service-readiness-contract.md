---
title: "多服务启动就绪契约：Compose depends_on 与 systemd 排序/依赖边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-spec-and-manpage
sourceUrl: "https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md"
immutable: true
tags: [Docker Compose, systemd, depends_on, healthcheck, Readiness, Orchestration]
description: "以固定 commit 的 Compose 规范与 systemd v261.2 手册提取多服务启动就绪最小契约：进程启动、依赖排序、健康检查、端口占用、失败与重启传播六者的区别与边界；不含私有部署细节。"
---

# 多服务启动就绪契约

这份快照只保留固定公开源可支持的字段级/行为级事实。核心结论：编排器只保证“进程已启动/健康检查通过”，不保证“业务就绪”。

## 版本/固定点

- compose-spec `05-services.md` @ commit `11296e387ba76c77db1db768b9153a4304a3c9bd`（main，2026-07-17）。
- systemd.unit(5) @ tag `v261.2`（commit `4925d9f07fc697efccd98a93046ff535b8832445`）。
- docs.docker.com 两页为稳定 URL 但可变动，仅作散文佐证；字段级事实以上述固定源为准。

## 来源列表

1. compose-spec 05-services.md（固定 commit）：<https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md>（`depends_on`、`healthcheck`、`ports`、`restart` 章节）
2. Docker docs 启动顺序（稳定 URL）：<https://docs.docker.com/compose/how-tos/startup-order/>
3. Docker CLI `docker compose up` 参考（稳定 URL）：<https://docs.docker.com/reference/cli/docker/compose/up/>
4. systemd.unit(5) 手册源（固定 tag）：<https://github.com/systemd/systemd/blob/v261.2/man/systemd.unit.xml>

## 最小事实：六组概念的区别

### 1. 进程启动（running）≠ 就绪（ready）

Compose 官方文档原文：“On startup, Compose does not wait until a container is "ready", only until it's running.” 依赖的“就绪”必须由用户显式定义：`condition: service_healthy`（由 `healthcheck` 定义健康）或 `service_completed_successfully`（一次性任务跑完）。短语法 `depends_on: [db]` 只保证启动顺序，等价于 `condition: service_started`。

### 2. 依赖排序 ≠ 依赖建立（systemd 边界）

systemd.unit(5) v261.2 原文：After=/Before= “configure ordering dependencies between units”，并且 “those settings are independent and orthogonal to requirement dependencies as configured by Requires=, Wants=, Requisite=, or BindsTo=”。`After=` 只排序；要建立“启动依赖”必须另有 `Requires=`/`Wants=`。官方建议的常见写法是把同一单元同时放进 `After=` 与 `Wants=`。手册还注明：service 单元的启动，对 After=/Before= 而言在“所有配置的启动命令已被调用（无论成败）”时即视为完成（含 `ExecStartPost=`）——即“已启动”不等于“应用可服务”。

### 3. 健康检查 = 用户定义的就绪探针

spec 原文：`healthcheck` “declares a check that's run to determine whether or not service containers are "healthy"”，工作方式与 Dockerfile `HEALTHCHECK` 指令相同，Compose 文件可覆盖镜像默认值。`test` 支持 `NONE`、`CMD`、`CMD-SHELL`，可用 `disable: true` 关闭。`interval`/`timeout`/`start_period`/`start_interval` 为时长。探针测什么完全由用户写的命令决定；编排器不做业务级推断。

### 4. 端口占用 ≠ 就绪

spec `ports` 只定义发布映射（`[HOST:]CONTAINER[/PROTOCOL]`；未写 HOST 时绑定全部网卡 `0.0.0.0`），不涉及容器内应用状态。结合第 1 条（running ≠ ready）与第 3 条（就绪唯一由 healthcheck 定义）：端口被监听/绑定属于“进程启动”层信号，不构成就绪证据。此条为两条固定源共同支持的规范推导，本快照未运行容器实验观察。

### 5. 失败传播

- Compose：spec 原文“Compose guarantees dependency services marked with `service_healthy` are "healthy" before starting dependent service.” 依赖永不健康时该保证无法满足，被依赖方不启动；`docker compose up --wait`（等待 running|healthy，隐含 detached）配合 `--wait-timeout` 会失败退出。`up --abort-on-container-failure` 在任一容器失败退出时停止全部。
- systemd：`Requires=` 原文“If this unit gets activated, units listed will be activated as well. If one of the other units fails to activate, and an ordering dependency After= on the failing unit is set, this unit will not be started.” 即 Requires= + After= 时，依赖激活失败会阻止本单元启动。`Wants=` 是弱形式：列出的单元启动失败“has no impact on the validity of the transaction as a whole”。

### 6. 重启传播

- Compose：`depends_on` 长语法 `restart: true`，spec 原文“When set to true Compose restarts service after updates dependency service. This applies explicit restart controlled by Compose operation, excludes automated restart by container runtime after container dies.” 官方文档补充：`restart: true` 使“if `db` is updated or restarted due to an explicit Compose operation, for example `docker compose restart`, the `web` service is also restarted automatically”。反向边界同样明确：容器运行时层面的自动重启（`restart: always`/`on-failure`/`unless-stopped` 策略，spec `restart` 章节）不通过 `depends_on` 传播到依赖方。
- systemd：`Requires=` 原文“this unit will be stopped (or restarted) if one of the other units is explicitly stopped (or restarted)”，但意外失败不传播；需要“依赖意外停止也连带停止”时须用 `BindsTo=`（“also does so if the listed unit stops unexpectedly (which includes when it fails)”）。

## 最小匿名示例与验证

官方文档同形示例（已匿名，无凭证、无端口、无私有路径）：

```yaml
services:
  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
        restart: true
  db:
    image: postgres:18
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      retries: 5
      start_period: 30s
      timeout: 10s
```

可重复验证命令：

```bash
docker compose config -q                       # 校验文件
docker compose up -d --wait --wait-timeout 30   # 等待全部 running|healthy；依赖不健康时失败退出
docker compose ps                               # 查看健康状态列
docker inspect --format '{{json .State.Health}}' <service>   # 健康检查明细
docker compose events                           # 观察 start / health_status 事件序列
docker compose restart <dependency>             # 配合 depends_on.restart: true 观察依赖方随之重启
docker compose up --abort-on-container-failure  # 失败传播：任一容器失败退出即停止全部
docker compose down                             # 清理
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
- 未证明：本快照未运行容器实验；端口占用与就绪的分离为规范推导（见第 4 条），未做“端口已绑定而应用未就绪”的实机观察。
- 未覆盖：swarm mode 下 `depends_on` 的行为差异、Compose v2.17.0 之前版本的 `restart` 字段、systemd 其他依赖类型（Requisite=、PartOf=、Conflicts=）的完整语义；这些需要另行固定源。
- 事实、推导与未观察项已在正文分别标注；本快照不含用户名、绝对路径、凭证、内部主机或私有实现。
