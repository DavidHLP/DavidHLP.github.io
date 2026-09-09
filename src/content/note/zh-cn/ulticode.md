---
title: "UltiCode：把在线评测做成可验证的工程系统"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: entity
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076", "ulticode-project-context"]
related: ["microservice-data-ownership", "dubbo-nacos-runtime", "jjwt-013-security-api", "multi-service-readiness", "database-schema-drift", "ulticode-owner-and-facts", "ulticode-outbox-redis-streams", "ulticode-generation-attempt-fence", "ulticode-docker-sandbox", "ulticode-async-execution-contract", "ulticode-ci-supply-chain"]
tags: [UltiCode, OnlineJudge, DDD, Port, Projection, Outbox, RedisStreams, Docker, Seccomp, CI, LLM]
description: "以 UltiCode 当前 main 的固定提交为证据，解释 owner 边界、outbox 与 Streams、generation/attempt 围栏、Docker 沙箱和交付门禁如何组合成可验证的在线评测系统，并明确生产验证与性能结论的缺口。"
toc: true
---

> **证据状态**：本文以 UltiCode `main` 的固定提交 [`f801a1076`](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) 为主要来源，辅以早期 README/CONTEXT 快照。文中“已实现”表示当前仓库存在相应源码、配置或测试；不等于已经部署到生产。
>
> **阅读边界**：当前仓库文档明确写着没有生产环境、生产流量或生产凭据。本文不声称吞吐量、高可用、零丢失或彻底阻断沙箱逃逸；异步 receipt 的跨实例/重启持久幂等也仍是已记录的缺口。

UltiCode 是一个在线评测平台。它有 Console 和 Management 入口，也把 Auth、Admin、App、Submission、Notification 拆成不同的数据责任边界；Judge Worker 消费提交任务、启动 Docker 沙箱并写回结果，Search Worker 只维护派生搜索索引。

这类系统最值得写的地方，不是“可以运行用户代码”这一句产品描述，而是它如何处理跨服务事实、消息投递失败、重判竞争、租约过期、容器基础设施错误和发布链路。换句话说，亮点是把失败和不确定性也变成了可检查的状态。

本文也把 UltiCode 当作一个可迁移到 LLM/Agent 工程的案例：UltiCode 本身不是 LLM 产品，但它对“不可信输入、异步执行、幂等、隔离和证据链”的处理方式，同样适用于模型生成代码、工具调用和长任务编排。

## 系列文章：把在线评测拆成六个可验证问题

这篇 entity 页负责给出全局地图；下面六篇 `concept` 页分别处理一个设计问题，读者可以单独阅读，也可以沿着“事实 → 投递 → 执行 → 交付”的顺序阅读：

- [数据 Owner 与事实快照：跨服务提交如何保持边界](/note/ulticode-owner-and-facts)：谁拥有事实，为什么提交写入接收不可变快照。
- [Outbox 与 Redis Streams：把判题投递做成可恢复状态](/note/ulticode-outbox-redis-streams)：数据库意图、重试、去重、PEL 与回收。
- [generation 与 attemptId：用条件更新拦截过期判题结果](/note/ulticode-generation-attempt-fence)：重判、租约和旧 Worker 结果的竞争模型。
- [Docker 沙箱：资源隔离与基础设施错误分类](/note/ulticode-docker-sandbox)：安全参数、seccomp 和用户错误/基础设施错误分离。
- [异步执行契约：idempotency、fingerprint 与有界 receipt](/note/ulticode-async-execution-contract)：同步预览与异步任务共享的状态和容量边界。
- [验证与供应链门禁：从 static contract 到可验证发布](/note/ulticode-ci-supply-chain)：静态检查、集成验证、镜像扫描和签名证明。

## 先看五个亮点

| 亮点 | 解决的问题 | 关键机制 |
|---|---|---|
| owner 边界 | 谁能读取、谁能写入容易变成口头约定 | 数据 owner、implementation-free contract、port/projection |
| 可恢复投递 | 提交写入成功但队列不可用 | DB outbox、`FOR UPDATE SKIP LOCKED`、Redis Streams、重试/死信 |
| 结果围栏 | 重判或旧 worker 的结果覆盖新结果 | `generation` + `attemptId` + 条件更新 |
| 执行隔离 | 用户代码把基础设施错误伪装成普通运行错误 | Docker 资源/安全参数、seccomp、基础设施错误分类 |
| 交付自证 | “能构建”不等于依赖和镜像安全 | zero-infra static contract、Trivy、SBOM、Cosign、provenance |

## 1. Owner 边界：把“谁写数据”变成显式契约

当前架构文档给出了五个 Data Owner 和两个 Worker：

| 角色 | 负责的事实/写入 | 明确不负责 |
|---|---|---|
| Auth | 登录、注册、OAuth、凭据、刷新状态、RBAC、JWKS | 不替其他 owner 写业务表 |
| Admin | 管理 BFF、审计、设置、监控、备份与读模型 | 不接管 App 或 Submission 的领域写入 |
| App | 用户资料、Problem、Contest、Solution、Forum、互动、成就和订阅 | 不直接拥有 Submission 结果 |
| Submission | 提交接收、判题状态、generation、租约围栏、结果和判题 outbox | 不写 Problem、TestCase、Contest 表 |
| Notification | 通知、偏好、投递 ledger、邮件、Inbox 和重试 | 不把通知状态散落到业务 owner |
| Judge Worker | 消费 Judge Stream、读取 Problem facts、执行沙箱、写 verdict | 不写业务表、不提供 HTTP 业务入口 |
| Search Worker | 消费 `SearchDocumentChanged`、维护 MeiliSearch 派生索引 | 不写业务表、不提供 HTTP 业务入口 |

这个表的价值不在于“服务多”，而在于它把跨边界通信的默认答案改成了：使用 provider-owned contract 或 consumer-owned port，而不是共享 Entity、Mapper 或业务 Service。`services/api/*` 只放 implementation-free contract，`services/platform/*` 放受约束的共享层；`judge-runtime` 是可复用依赖，不自动等于一个独立进程。

### 用不可变事实快照缩短跨 owner 依赖

提交请求需要用户和题目的事实。一个直觉做法是在 Submission 写库时再去调用 App/Auth 查询，但这样会把远程查询、权限边界和请求时序混进写入路径。

UltiCode 的接口提供了接收 [`SubmissionFactsSnapshot`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) 的 intake 入口。App 侧的 [`RemoteSubmissionWritePort`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java) 先捕获：

- `userId` 与 `userExists`；
- 题目 id、标题、slug、时间/内存限制和 starter code；
- `capturedAtEpochMillis` 与 `schemaVersion`。

Submission 随后用 `facts.admits(requestedUserId, requestedProblemId)` 校验 schema 版本、用户存在性、用户 id 和题目 id 是否仍匹配。这个设计把“事实来自谁、在什么时候捕获、按哪个版本解释”放进了数据结构，而不是依赖调用方记得一组隐含前提。

它不是完整的授权或一致性证明：快照的有效期、跨 owner 的撤销语义和所有业务规则仍需由系统定义。但作为写入契约，它已经比在核心事务里临时发起多次远程查询更容易测试和审计。

## 2. Outbox + Redis Streams：投递失败是状态，不是日志

启用 judge outbox 路径时，提交和“需要判题”这件事先在同一数据库事务里落下：

```text
submit @Transactional
    ├── submissions: Pending
    └── judge_outbox: PENDING
             │
             ├── claim: FOR UPDATE SKIP LOCKED
             ├── atomic SET + XADD
             └── judge-workers
                    └── lease fence -> verdict
```

[`JudgeOutboxMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/outbox/mapper/JudgeOutboxMapper.java) 按 `PENDING` 和下一次重试时间领取记录，并使用 `FOR UPDATE SKIP LOCKED` 避免多个 dispatcher 抢同一批任务。当前实现的默认批量大小是 50，dispatcher 的定时周期是 2 秒；这些是源码默认值，不是生产吞吐承诺。

[`JudgeOutboxDispatcher`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) 对失败做了不同处理：

- queue provider 缺失，或入队发生异常：保留为可重试状态；
- 缺少 `problemId`、`userId`、`language`、`code` 的 malformed payload：转为 `DEAD`，避免把半空任务标成已发送；
- 重试采用指数退避，当前实现上限为 60 秒；
- real dispatch 还受 cutover watermark 和 shadow 标记约束，便于迁移期间区分影子任务与真实任务。

Redis Streams adapter 的关键点不是简单地把消息 `XADD` 出去，而是用 Lua 把“设置去重键”和“写入 Stream”放进一次原子操作。去重键包含 `submissionId:generation`。这样可以避免“SETNX 已成功，但进程在 XADD 前崩溃”留下永远无法投递的空洞。

这仍然不应被叫作 exactly-once。数据库事务和 Redis 外部操作之间仍有边界；更准确的描述是：持久化意图、可重试投递、消息级去重，再由结果围栏处理重复或过期执行。

### PEL 回收让未确认消息可见

消费者组从 `0-0` 创建，以便重新看到建组前的条目。worker NACK 时保留 Pending Entries List（PEL），[`UnackedStreamEntriesReaper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/outbox/reaper/UnackedStreamEntriesReaper.java) 默认每 10 秒扫描空闲条目，每次 sweep 最多回收一条，并暴露 PEL 大小、队列延迟、最老条目年龄和 DLQ 等观测指标。

当前 judge stream 的 visibility timeout 常量是 `1_800_000L`（30 分钟）。它是实现参数，不是“30 分钟内一定完成”或高可用证明。真正处理回收任务时，worker 仍会重新经过 generation/attempt 围栏，旧任务不能仅凭被重新领取就获得写入资格。

## 3. `generation` + `attemptId`：让旧结果在数据库门口失效

异步系统里，“同一个 submission”并不意味着只有一次有效执行：管理员可以重判，租约可以过期，worker 可以重启，Redis 消费者也可能重复收到消息。UltiCode 把两个概念分开：

- `generation`：一次逻辑提交或重判 epoch；
- `attemptId`：某个 worker 执行租约的 token。

关键路径可以压缩成下面的条件：

```text
acquire lease:  id + status=Pending + generation
renew lease:    id + current_attempt_id
write verdict:  id + generation + current_attempt_id
rejudge/reaper: expected generation -> generation + 1
```

[`SubmissionMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java) 中的 lease、续租和 verdict SQL 都把这些条件落成了条件更新。受影响行数为 0 时，调用方将它解释为租约丢失、generation 过期或竞争者已经接管，而不是继续覆盖结果；判题执行器会记录 `judge.stale_result.dropped`，对安全丢弃的旧结果 ACK。

重判服务 [`SubmissionRejudgeService`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/submission/admin/SubmissionRejudgeService.java) 和租约回收器 [`JudgingLeaseReaper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/reaper/JudgingLeaseReaper.java) 都会通过 generation CAS 推进 epoch，再创建新的判题意图。旧消息即便晚到，也无法满足新的条件。

这是一种很实用的“数据库门口围栏”：它不要求所有上游组件都完美地只执行一次，而是把最终写入资格收敛到一个可验证的条件更新。不过，这个围栏的作用域是 Submission owner 的数据库；它不能自动替代跨系统授权、消息持久性或业务级审计。

## 4. Docker D-form 沙箱：隔离资源，也区分基础设施故障

[`SandboxExecutorImpl`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) 的 D-form 执行路径会创建临时 job workspace，写入只读 `input.json`，调用生命周期 runner 启动 Docker，并在 `finally` 中尽力清理目录。Docker 命令包含一组明确的边界：

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

seccomp profile 的解析失败不会静默删掉过滤器，而是让 Docker 返回明确的配置错误。这种选择牺牲了“尽量跑起来”的表面成功率，换取隔离配置不被隐式降级。

更容易被忽略的是错误分类。 [`SandboxOutcomeClassifier`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java) 将以下情况分开：

- 启动进程本身失败：launch failure；
- exit code 137：OOM；
- exit code 125：OCI 配置或 Docker daemon 错误；
- `Cannot fork`、pids 或 `RLIMIT_NPROC`：fork limit；
- 编译器错误：compile error；
- 其余非零退出：普通 runtime error。

这样，Docker daemon 没有创建容器、seccomp 路径错误或 fork 资源不足时，不会被伪装成用户代码的 Runtime Error。它提高了诊断和重试的可解释性，但不等于已经证明完整的容器逃逸防护；这类结论仍需要专门的安全审计和真实环境验证。

## 5. 同步预览与异步执行共享 contract，runtime adapter 藏在 seam 后面

判题系统通常同时需要“立即给一个预览结果”和“提交一个可能运行很久的任务”。如果两条路径各自定义请求、状态和错误，最终会出现同一份代码在不同入口表现不一致。

UltiCode 用 [`AsyncSandboxExecutor`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) 定义 `submit/poll/cancel`，并让 `ExecutionRequest` 要求 job、test case、visibility 和非空 idempotency key。默认 key 是 `job.runId:testCase.id`，请求还会得到 SHA-256 fingerprint；同一 key 的不同 payload 可以被识别为冲突，而不是悄悄复用错误结果。

Judge 侧的 [`CodeExecutionProvider`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java) 则把边界放在入口处：

- 同步 `execute` 只接受 `PUBLIC_PREVIEW`；
- 业务异常映射为 typed `RpcResult`，调用方不需要解析任意字符串；
- 异步提交限制为一个 test case，并维护有界的内存 metadata；
- metadata 上限是 1024 条，TTL 是 15 分钟；终态完成、取消或超时后回收；
- Docker 是默认 runtime，Judge0 是可选 adapter，而不是默认依赖。

这套 seam 对 LLM/Agent 系统尤其有启发：模型生成的代码、工具参数和长任务结果都应当有明确的状态机、幂等键和容量上限，而不是把一个“调用模型/调用工具”的函数无限扩张成全局任务管理器。

同时，当前架构文档已经把边界写出来：异步 receipt 仍是有界的进程内元数据，跨副本或重启后的持久幂等尚未完成；Judge0 外部实例也没有被默认验证。把缺口写清楚，本身就是工程质量的一部分。

## 6. 质量门禁：把静态自证和重验证分层

UltiCode 的验证入口不是只有一个“大而全”的测试命令。当前 [`scripts/dev/test.sh`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/dev/test.sh) 与项目文档按成本和真实性分层：

```text
static       -> zero-infra contract checks
unit         -> unit tests, exclude IT/IntegrationTest
quick/full   -> progressively heavier local checks
integration  -> Testcontainers, DB/Redis, sandbox and owner migration
```

CI 中的 zero-infra 入口是：

```bash
bash scripts/test/zero-infra-validation-contract.sh --static-only
```

这条静态路径不启动 Docker、数据库、服务、Testcontainers、Maven 或 pnpm install，适合在每个小改动上快速检查脚本契约、路径、配置和安全边界；真正的数据库、Redis、沙箱和跨 owner 行为留给更重的 unit/integration 阶段。静态门禁便宜，不能替代集成证据；集成测试真实，也不能替代生产流量证据。

发布链路还把供应链检查变成阻断条件。当前 [`docker-publish.yml`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml) 从服务矩阵构建 GHCR 镜像，启用 SBOM 与 provenance，Trivy 对 HIGH/CRITICAL 的 OS/library 漏洞使用阻断式 exit code，随后按 digest 做 Cosign 签名，并验证签名和 attestation。GHCR 镜像名还先统一转为小写，避免仓库名大小写给发布阶段制造非业务故障。

这些配置不能被改写成“CI 已经替系统证明安全”。更准确的说法是：仓库已经把一些可自动化的安全和交付要求写成了门禁；是否在当前环境完整跑通，还要看执行记录和外部凭据。

## 7. 对 LLM/Agent 工程的四个迁移结论

UltiCode 的领域对象是代码提交，不是 prompt；但它给 LLM 系统提供了四个非常直接的类比。

### 7.1 不可信输入先过能力边界

用户代码要进入 Docker 沙箱，模型生成的代码、工具调用参数、文件补丁和外部网页内容也应当先过能力、资源和数据范围边界。`owner + port + adapter` 说明“谁拥有事实”和“谁被允许执行”最好是类型和接口上的约束，而不是系统提示词里的愿望。

### 7.2 异步任务需要持久意图、幂等和围栏

模型任务可能超时、重试、重复投递或被用户取消。Outbox 负责保留意图，idempotency key 负责识别重复请求，generation/attempt fence 负责阻止旧 worker 写回新状态。这三个职责应当分开，不要把“消息没重复”当成“结果不会过期”。

### 7.3 事实快照比隐式上下文更容易复现

`SubmissionFactsSnapshot` 把请求时的事实、捕获时间和 schema 版本一起传递。对 Agent 来说，工具可见资源列表、授权范围、模型版本、输入摘要和执行策略也可以形成版本化快照，减少长链路里“同一个 id 在不同时间代表了不同对象”的歧义。

### 7.4 失败分类决定系统能不能自我修复

把 OOM、OCI 配置错误、fork 限制和用户编译错误都叫“执行失败”，监控和重试就没有方向。LLM 系统同样需要区分 provider 限流、工具权限拒绝、输入校验失败、模型输出不可解析和业务结果失败；可观察状态比一个笼统的 `FAILED` 更有价值。

## 8. 已实现、已验证与不能声称的内容

| 标签 | 本文采用的准确表述 |
|---|---|
| `Repository Implemented` | 当前固定提交包含 owner/worker 文档、事实快照契约、DB outbox、Streams 去重与 PEL 回收、generation/attempt CAS、Docker 安全参数、错误分类和 CI 发布门禁。 |
| `Repository Evidence` | 仓库中存在对应的源码、配置和边界测试文件；测试文件名是可追溯证据，不等于本次已执行且通过。 |
| `Locally Validated` | 本次会验证博客仓库的知识库 lint 与构建；不把博客构建结果写成 UltiCode 的 Maven、Docker、Redis 或 Testcontainers 验证。 |
| `BLOCKED_EXTERNAL` | 生产部署、生产流量、外部 Judge0 实例、真实多副本/重启 receipt、凭据、镜像运行时和发布凭据不在本文验证范围。 |
| `OUT_OF_SCOPE` | 不声称高吞吐、生产 HA、零丢失、完整沙箱逃逸防护或 Core 可选 profile 已达到生产标准。 |

当前文章的状态保持为 `provisional`。如果要把它升级为更强的工程结论，下一步不是继续堆形容词，而是补最小可复现实验：跑 static/unit/integration 分层门禁，记录 Docker/Redis/MySQL 的真实结果，验证重启和多副本下的异步 receipt，再单独进行沙箱安全审计。

## 最小阅读路径

建议按下面的顺序回到源码，而不是从部署图猜实现：

1. [架构总览](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/overview.md) → [owner 与模块边界](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/modules.md)。
2. [事实快照](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) → [Submission 写入](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/port/DefaultSubmissionWritePort.java)。
3. [outbox dispatcher](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) → [Streams adapter](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java) → [attempt executor](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/processor/DefaultJudgeAttemptExecutor.java)。
4. [Docker 执行器](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) → [错误分类](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java)。
5. [验证状态](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/project/current-status.md) → [测试分层](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/development/testing.md)。

### 对应的边界测试入口

以下测试名用于继续核验契约；本轮没有代替 UltiCode 执行这些测试：

- [`SubmissionFactsSnapshotTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/submission/port/SubmissionFactsSnapshotTest.java)、[`DefaultSubmissionWritePortIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/submission/port/DefaultSubmissionWritePortIT.java)、[`SubmissionOutboxDispatcherIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/queue/outbox/dispatcher/SubmissionOutboxDispatcherIT.java)。
- [`SandboxForkE2EIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/SandboxForkE2EIT.java)、[`SandboxExecutorImplForkDetectionTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplForkDetectionTest.java)、[`SandboxOutcomeClassifierTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifierTest.java)。
- [`DockerAsyncSandboxAdapterTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/DockerAsyncSandboxAdapterTest.java)、[`Judge0AsyncSandboxAdapterTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/Judge0AsyncSandboxAdapterTest.java)。
