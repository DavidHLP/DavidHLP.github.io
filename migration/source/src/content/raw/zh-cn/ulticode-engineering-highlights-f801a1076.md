---
title: "UltiCode 当前主线工程化亮点：源码与文档选段固定快照"
capturedAt: 2026-09-09 00:00:00+08:00
sourceType: repository-source-and-document-selected-excerpts-fixed-commit
sourceUrl: "https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c"
immutable: true
tags: [UltiCode, OnlineJudge, Owner, Outbox, RedisStreams, Docker, Seccomp, CI]
description: "以 UltiCode main 固定提交 f801a1076 的 README、架构文档、判题/沙箱源码、测试与 CI 配置为证据，提炼模块边界、可靠投递、结果围栏、隔离执行和交付门禁。"
---

# 快照说明

这是面向知识页的文件级证据索引与选段快照，不是 UltiCode 仓库的完整镜像。所有来源均固定到提交 `f801a1076b2fa9aa06ce3d63821f0778b477042c`；本文件记录的是该提交可读到的实现、配置、文档和测试边界。它不证明生产部署、生产流量、性能指标或完整的沙箱逃逸防护。

## 来源清单

- [README.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/README.md)：Console、Management、Judge、Auth、Admin、App、Submission、Notification、Search 的产品与数据责任概览。
- [docs/architecture/overview.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/overview.md)：五个 owner、两个 worker、Submission outbox/fence、异步执行及 Core 可选 profile 的当前状态。
- [docs/architecture/modules.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/modules.md)：owner/worker 表、跨 owner contract/port、共享层与禁止的共享 Entity/Mapper/业务 Service。
- [docs/project/current-status.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/project/current-status.md) 与 [docs/development/testing.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/development/testing.md)：验证状态语义和 static/unit/full/integration 分层。
- [SubmissionFactsSnapshot.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java)：请求 owner 捕获的用户与题目事实、schemaVersion 和 `admits` 校验。
- [DefaultSubmissionWritePort.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/port/DefaultSubmissionWritePort.java)：Submission intake、fact-aware submit、outbox 写入和 fenced verdict 写入。
- [JudgeOutboxMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/outbox/mapper/JudgeOutboxMapper.java) 与 [JudgeOutboxDispatcher.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java)：`SKIP LOCKED` claim、发送/重试/死信和切换水位线。
- [SubmissionMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java)、[SubmissionRejudgeService.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/submission/admin/SubmissionRejudgeService.java) 与 [JudgingLeaseReaper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/reaper/JudgingLeaseReaper.java)：generation/attempt lease 的 CAS 条件、重判和租约恢复。
- [RedissonStreamsJudgeQueueAdapter.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java)、[UnackedStreamEntriesReaper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/outbox/reaper/UnackedStreamEntriesReaper.java) 与 [DefaultJudgeAttemptExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/processor/DefaultJudgeAttemptExecutor.java)：Redis Streams 去重、PEL 回收、租约心跳和结果 ACK/NACK。
- [SandboxExecutorImpl.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) 与 [SandboxOutcomeClassifier.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java)：Docker D-form 执行、seccomp/资源边界和基础设施故障分类。
- [AsyncSandboxExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) 与 [CodeExecutionProvider.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java)：同步预览、异步 submit/poll/cancel、idempotency key、fingerprint 和内存元数据上限。
- [_backend.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/_backend.yml)、[docker-publish.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml) 与 [zero-infra-validation-contract.sh](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/test/zero-infra-validation-contract.sh)：静态契约门禁、Docker 镜像扫描、SBOM/provenance 和签名验证。

## 选段：事实快照契约

来源：[SubmissionFactsSnapshot.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java)

```java
public record SubmissionFactsSnapshot(
        String userId, boolean userExists, ProblemFacts problem,
        long capturedAtEpochMillis, int schemaVersion) implements Serializable {
    public static final int CURRENT_SCHEMA_VERSION = 1;

    public boolean admits(String requestedUserId, Long requestedProblemId) {
        return schemaVersion == CURRENT_SCHEMA_VERSION
                && userExists
                && Objects.equals(userId, requestedUserId)
                && problem != null
                && Objects.equals(problem.id(), requestedProblemId);
    }
}
```

快照的 `ProblemFacts` 包含题目 id、标题、slug、时间/内存限制和 starter code。构造器拒绝空 userId、低于 1 的 schemaVersion 和负的捕获时间。

## 选段：投递与结果围栏

- `JudgeOutboxMapper.claim` 按 `PENDING`、到期重试时间和 `FOR UPDATE SKIP LOCKED` 领取待发送记录；dispatcher 默认批量 50、定时周期 2 秒。
- provider 缺失或入队异常走 retry；缺少 `problemId/userId/language/code` 的 malformed payload 走 `DEAD`；指数退避上限为 60 秒。
- Redis Streams adapter 用 Lua 将 `SET` 去重键与 `XADD` 放进同一原子操作；去重键包含 `submissionId:generation`，避免“先 SETNX、随后在 XADD 前崩溃”的空洞。
- `SubmissionMapper` 的 lease/verdict SQL 同时约束 submission id、generation 和 current attempt id；受影响行数为 0 时，调用方记录 stale result 并丢弃过期结果。
- Streams group 从 `0-0` 创建以允许重放建组前条目；NACK 保留 PEL，reaper 默认每 10 秒回收空闲条目，每次 sweep 最多推进一条。
- judge stream visibility timeout 常量为 `1_800_000L`；该实现值不等同于生产 SLO 或高可用证明。

## 选段：沙箱和错误分类

来源：[SandboxExecutorImpl.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java)

- D-form 执行先创建临时 job workspace、写入只读 `input.json`，再由生命周期 runner 启动 Docker，最后在 `finally` 中尽力清理 job 目录。
- Docker 命令包含 `--network none`、`--cap-drop ALL`、`--read-only`、`--user 1000:1000`、`no-new-privileges`、seccomp、内存/CPU/pids/nofile 限制、64 MiB tmpfs 和只读 workspace。
- seccomp 路径解析失败不会静默删除过滤器；最终让 Docker 报清晰的配置错误。
- `SandboxOutcomeClassifier` 将 launch failure、exit 137 OOM、exit 125 OCI 配置/daemon 错误、fork/pids 限制、编译错误和普通 runtime error 分开。

## 选段：同步/异步执行契约

- `CodeExecutionProvider.execute` 只接受 `PUBLIC_PREVIEW`，并把业务异常映射为 typed `RpcResult`。
- async request 要求非空 job、test case、visibility 和 idempotency key；默认 key 为 `job.runId:testCase.id`，并计算 SHA-256 fingerprint。
- async metadata 是有界内存结构，最大 1024 条、TTL 15 分钟；完成/取消/超时后回收，失败状态可继续查询。
- Docker 是默认 async adapter，Judge0 为可选适配器；当前异步 receipt 的跨实例/重启持久幂等仍被架构文档标记为未完成。

## 选段：验证与交付门禁

- static 验证入口是 `bash scripts/test/zero-infra-validation-contract.sh --static-only`；文档说明它不启动 Docker、数据库、服务、Testcontainers、Maven 或 pnpm install。
- backend workflow 进一步组合编译、unit/full/integration、coverage、owner migration、Redis ACL/TLS、lease、graceful drain、streams、拓扑和 sandbox 等契约门禁。
- Docker publish workflow 从服务矩阵构建 GHCR 镜像，启用 SBOM/provenance，Trivy HIGH/CRITICAL 扫描使用阻断式 exit code，随后执行 digest、Cosign 签名以及 attestation 的签名/验证。

## 相关边界测试名称

以下是当前提交中与上述契约对应的测试文件名；它们是源码证据，不代表本快照生成时已执行并通过：

- `SubmissionFactsSnapshotTest`、`DefaultSubmissionWritePortIT`、`SubmissionOutboxDispatcherIT`、`JudgeOutboxDispatcherTest`
- `SandboxForkE2EIT`、`SandboxExecutorImplForkDetectionTest`、`SandboxExecutorImplSeccompResolutionTest`、`SandboxOutcomeClassifierTest`
- `SandboxExecutorContractParityTest`、`DockerAsyncSandboxAdapterTest`、`Judge0AsyncSandboxAdapterTest`、`ContestAdjudicationReceiptIT`
