---
title: "数据库租约不够：UltiCode 用 Fence Token 拦住过期单例任务"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-generation-attempt-fence"]
tags: [UltiCode, FencedLease, DistributedLock, Reconciliation, CAS, MySQL, Concurrency, LLM]
description: "从 UltiCode 的 fenced_job_leases 和 reconciliation run 写入路径出发，说明为什么只有租约过期时间还不够，以及 fence token 如何让旧执行者在数据库门口失效。"
toc: true
---

> **证据状态**：本文依据 UltiCode 固定提交中的 `FencedJobLeaseMapper`、`FencedJobLeaseService`、`OwnerReconciler`、`ReconciliationRunMapper`、ADR 和 MySQL 迁移整理。源码和边界测试说明了 stale completion 会被拒绝；不等于所有外部副作用都具备 fencing，也不等于单例任务 exactly-once。

假设系统只允许一个 reconciliation 任务运行。实例 A 获取了租约，开始扫描；过了一段时间，A 停顿，租约过期。实例 B 获取新租约并完成了新一轮扫描。此时 A 恢复，继续执行最后一步：把自己的结果写成“任务已完成”。

如果数据库更新只检查 `lease_name` 或 `owner_token`，A 可能仍然成功：它曾经是合法 owner，而数据库只知道“现在有一个租约”，不知道这个写入来自哪一代租约。B 的新结果就可能被旧执行者覆盖。

这就是普通租约与 fenced lease 的差别：租约负责决定谁可以开始，fence token 负责决定谁还有资格结束。

## 先看朴素方案为什么会失效

### 进程内锁只能解决单进程

` synchronized`、`ReentrantLock` 或单例 Bean 可以阻止同一个 JVM 中的重复执行，但服务重启、第二个副本或独立运维脚本出现后，锁的作用域就结束了。它适合明确只有一个进程的离线任务，不适合把数据库写入当作全局事实的服务集群。

### 只有 owner + expiry 的租约仍允许旧 owner 回来

典型的租约表有 `lease_name`、`owner_token` 和 `leased_until`。获取时抢占过期租约，写入时检查 owner 和时间，看起来已经能处理宕机恢复，但它没有表达“这是第几次获取”。

时间检查也不是万能的：旧 worker 可能在检查后暂停，等到租约过期和新 owner 接管后才继续写；应用层的本地时间还可能和数据库时间存在偏差。

### Redis 分布式锁不是自动的 fencing

Redis 锁可以帮助协调获取，但如果下游数据库更新不携带并检查一个单调递增 token，旧 owner 仍然可能在锁过期后完成写入。把锁换成另一种存储，不会自动得到 stale-writer protection。

## UltiCode 的核心机制：租约代次随接管递增

UltiCode 用 `fenced_job_leases` 保存单例任务的租约，并为每次有效接管分配 `fence_token`：

```text
lease_name = admin:reconciliation

first owner:  owner=A, fence=7, leased_until=T1
lease expires
new owner:   owner=B, fence=8, leased_until=T2
```

`FencedJobLeaseMapper` 的数据库 upsert 只有在租约已过期时才接管，并提升 token；获取、续租、释放和 `isHeld` 都要求 `lease_name + owner_token + fence_token` 同时匹配。租约时间使用数据库的 `CURRENT_TIMESTAMP(3)` 参与判断，避免把应用进程的本地时钟当作唯一事实来源。

这一步解决的是“谁是当前 owner”与“这个 owner 属于哪一代租约”之间的歧义。A 即使持有旧的 owner token，也只有旧 fence `7`；B 接管后数据库已经进入 fence `8`，A 的后续更新可以被条件直接拒绝。

## 真正的围栏在完成写入处

获取 token 本身还不够。必须把 token 一路带到最终写入，才能在旧 worker 最容易造成损害的地方实施检查。

`OwnerReconciler` 获取 `admin:reconciliation` 后，把 owner token 和 fence token 记录到 reconciliation run，并在执行过程中续租。完成 run 时，[`ReconciliationRunMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/reconciliation/ReconciliationRunMapper.java) 使用带 join 的条件更新：

```sql
UPDATE reconciliation_runs AS r
JOIN fenced_job_leases AS l
  ON l.lease_name = :leaseName
SET r.status = :status,
    r.finished_at = :finishedAt
WHERE r.run_id = :runId
  AND r.fence_token = :runFenceToken
  AND l.owner_token = :ownerToken
  AND l.fence_token = :fenceToken
  AND l.leased_until > CURRENT_TIMESTAMP(3)
```

上面是从实现中抽出的简化示例，省略了其他字段；它保留了决定语义的条件。任何一个条件不满足，受影响行数就是 0。调用方不能把 0 行当作“稍后再写一次”，而应把它解释为租约丢失、旧 token 或竞争者接管。

这和只在 Java 代码里写：

```java
if (lease.isHeld()) {
    run.setFinished(true);
}
```

不同。Java 检查和数据库更新之间存在竞态；条件更新把检查和写入放在同一个数据库原子操作里。

## 为什么不直接使用数据库悲观锁

`SELECT ... FOR UPDATE` 可以保护一次事务内的行，但 reconciliation 可能持续很久，不能把数据库事务一直打开；长事务会持有锁、放大资源消耗，也不适合跨多个外部步骤。

fenced lease 把长任务拆成短事务：获取、续租、记录进度、完成，每次都用 token 验证当前资格。它牺牲了“整个任务被一把锁包住”的简单感，却让任务可以在事务之外运行，并让最终提交仍由数据库判定。

这不是说悲观锁没有用。在很短的本地临界区里，它可能更直接；当任务包含网络、文件或长时间计算时，租约 + fencing 通常更贴合生命周期。

## 这个设计真正解决了什么

- **跨实例协调**：唯一 `lease_name` 和数据库约束让多个实例竞争同一个单例任务。
- **过期接管**：旧实例不续租时，新实例可以在租约过期后接管。
- **旧完成写入失效**：新接管会提升 fence token，旧执行者无法满足最终写入条件。
- **数据库时间一致性**：租约有效性判断使用数据库时钟，而不是把应用本地时钟当作权威。
- **失败结果可观测**：0 行更新是明确的 stale/lost-lease 信号，而不是静默覆盖。

它没有解决：任务已经调用的外部 API 是否可回滚、文件是否已写入、第三方是否检查 token、旧 worker 是否会继续消耗 CPU，或者整个业务是否只执行一次。Fencing 主要保护“被 fence 的写入 seam”；不受 token 约束的副作用仍需要幂等键、补偿或独立的 fencing 协议。

## 成本、适用条件与失效边界

适用信号包括：任务必须单例运行；任务可能跨越租约 TTL；实例可能暂停、重启或被替换；最终状态写入可以回到同一个数据库。

它增加的成本也很明确：token 必须从获取点传到每个有副作用的写入点；续租和 TTL 需要监控；每一种终态更新都要写正确的条件；测试必须覆盖“旧 owner 在新 owner 接管后返回”。如果所有工作都在一个短事务内完成，直接使用行锁或唯一约束更简单。

最容易遗漏的边界是只给“获取”加 fence，而没有给“完成、发布、删除或标记成功”加 fence。那样系统只是拥有一个带编号的锁，仍然没有阻止 stale completion。

## 对 LLM/Agent 调度的迁移

一个长时间运行的 Agent 任务也可能因为模型切换、取消恢复或 worker 重启而出现多个执行者。可以把计划版本或任务 epoch 作为 fence token，并要求工具结果、最终摘要和任务状态更新同时携带它。旧计划可以继续运行到自然结束，但没有资格把新计划标记为完成。

这里的迁移重点不是“给 Agent 加分布式锁”，而是问：哪些副作用必须在数据库门口再次验证当前计划版本？如果一个工具只依赖内存中的 `isCurrent` 判断，它仍然可能在检查和写入之间失效。

## 最小验证路径

先阅读 [`FencedJobLeaseMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/lease/FencedJobLeaseMapper.java) 的获取/续租/释放条件，再阅读 [`ReconciliationRunMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/reconciliation/ReconciliationRunMapper.java) 的完成更新。最后看 [`FencedJobLeaseIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/test/java/com/ulticode/modules/lease/FencedJobLeaseIT.java) 和 [`OwnerReconcilerTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c)：一个验证租约接管后旧释放失败，另一个验证旧 owner 的完成写入被拒绝。

本次 UltiCode 分析阶段已实际执行并通过该 fenced lease 的两项 MySQL 8 Testcontainers 集成测试以及 reconciliation 的定向单元测试；这验证的是选定竞争场景，不是性能、网络分区或所有外部副作用的证明。
