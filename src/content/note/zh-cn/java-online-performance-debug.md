---
title: "Java 线上性能排障：从症状到证据的最小决策树"
timestamp: 2026-02-25 00:00:00+08:00
series: "Java 基础与后端调优"
kind: concept
status: active
sources: ["legacy-java-online-performance-debug"]
related: ["java-null-value", "java-atomic-boolean", "java-internship-interview-blog-polished"]
tags: ["Linux", "Operations", "SRE", "Performance Troubleshooting", "CPU", "Java", "Production Incident", "Arthas", "JVM", "Hot-Swapping"]
description: "把 Java 线上性能事故压缩为症状、证据、线程/GC/代码定位、止损与恢复的最小决策树，避免用重启或命令清单替代根因分析。"
toc: true
---

本页是 Java 线上性能故障的决策树，不是 1500 行命令教程。目标是在服务仍可观测时保留证据，再从系统症状收敛到进程、线程、GC 或代码热点，最后选择可回滚的止损和恢复动作。

## 核心机制

### 1. 症状先分类，避免把所有高 CPU 当成 Java 死循环

| 症状/证据 | 第一假设 | 下一步 |
| --- | --- | --- |
| `user` 高、某 Java 进程和线程持续 RUNNABLE | 热点计算、死循环、序列化或频繁重试 | 线程栈、Arthas `thread`/火焰图、代码定位 |
| `system` 或 `softirq` 高 | 内核、网络中断或小包风暴 | 查系统进程、网络和调用方，不先改业务代码 |
| `iowait` 高 | 磁盘、日志、数据库或下游 I/O 等待 | 查 I/O 延迟、连接和下游指标 |
| CPU 高且 GC 频繁、堆接近上限 | 分配压力、内存不足或回收风暴 | `jstat`、GC 日志、堆/分配证据 |
| load 高但 CPU 不高，线程 `BLOCKED/WAITING` | 锁竞争、线程池耗尽或依赖阻塞 | 线程栈、池队列、锁和下游超时 |

### 2. 证据链比单个命令重要

```text
症状 → 时间/影响范围 → 进程 PID → 高 CPU 线程 TID → jstack nid
     → RUNNABLE/BLOCKED/WAITING/GC 线索 → 代码或依赖 → 可回滚动作
```

最小现场集是时间戳、负载/CPU 快照、PID/TID、线程栈、GC 统计或日志，以及变更和请求量。`top -Hp <pid>` 可找线程，`printf "%x" <tid>` 可把 TID 转为 `jstack` 的十六进制 `nid`；命令只为建立链路，不应倾倒整套清单。

### 3. 从线程到代码的收敛

- `RUNNABLE`：对照 `nid` 看栈；若栈不够具体，再用 Arthas `thread`、受限的 `trace` 或火焰图确认热点。
- `BLOCKED`：优先看锁持有者和等待链，而不是盲目增加线程。
- `WAITING`：判断是正常队列等待、线程池空闲，还是下游无超时导致的堆积。
- GC 相关：把 `jstat`/GC 日志中的暂停、频率、堆变化与请求延迟对齐；不能只因“看到 GC”就断言 GC 是根因。

Arthas 的价值是连接运行中的 JVM、观察线程和方法；`watch/trace/stack` 是有成本的观测，必须先缩小类、方法和次数。

## 适用条件

- 进程尚未完全失联，允许读取系统和 JVM 现场。
- 有权限取得 PID、线程栈、GC 指标和发布/流量时间线。
- 事故需要在“保留证据”和“恢复可用性”之间做有序取舍，而不是已经决定无条件重启。
- 线上观测有明确范围、次数和回滚方案；生产环境可接受的诊断开销已经评估。

## 不适用与风险

- `kill -9`、直接重启或无限 `watch/trace` 可能丢失现场、放大故障或继续耗 CPU；它们只能在证据足够或风险已不可控时作为恢复动作。
- `jstack` 只提供采样时刻的线程栈；它不能证明完整的时间因果，需结合多次采样、指标和变更记录。
- `jmap`、堆转储、火焰图和 Arthas 观测可能暂停、放大 I/O 或暴露敏感数据，先确认磁盘、权限、脱敏和审批边界。
- HotSwap/redefine/retransform 属于版本和类结构敏感的临时止血，不等价于修复；必须保留原 class、记录变更并准备回滚。
- `user/system/iowait/softirq` 的含义、GC 统计和诊断命令会受 OS、JDK、容器和工具版本影响；本页不给出固定阈值。

## 最小验证

1. 复现或接警后先记录时间、影响接口、请求量、负载和高 CPU PID；不要先杀进程。
2. 对同一 PID 采集两次线程证据：找出高 CPU TID、转十六进制并在 `jstack` 中定位 `nid`；确认状态是否稳定。
3. 若线程指向 GC，连续采集 GC 统计/日志并对齐延迟、分配量和堆变化；若指向业务方法，用一次受限 `trace` 或火焰图验证热点。
4. 执行一个可逆动作（限流、降级、暂停异常任务、扩容或受控重启）后观察 CPU、延迟、错误率、队列和 GC 是否回落；保存前后证据。
5. 事故结束后记录直接原因、深层原因、证据、动作和后续监控，避免把“服务恢复”误写成“根因已确认”。

## 证据与不确定性

- **来源事实**：`legacy-java-online-performance-debug` 提供四阶段思路（止血、存证、定位、恢复）、CPU 分类、PID/TID→`jstack`、Arthas 线程/方法观测、GC/系统场景和 Hotfix 风险。
- **本页综合**：将命令教程压缩成症状→证据→线程/GC/代码→止损/恢复的最小路径，并把观测成本和可回滚性放进决策条件。
- **未确认项**：任何阈值、具体 HotSwap 能力、Arthas 命令兼容性和“某个栈就是根因”的判断，都需结合当前 JDK、容器、OS、版本和现场复核。

## 相关页面

- [NullValue：缓存 null 的占位对象与序列化边界](/note/java-null-value)
- [AtomicBoolean：原子布尔状态与 CAS 边界](/note/java-atomic-boolean)
- [Java 后端面试复盘：项目真实性、工程机制与生产证据](/note/java-internship-interview-blog-polished)
