---
title: Linux 高 CPU 应急指南：从“快速止血”到“深度复盘”
timestamp: 2026-02-25 00:00:00+08:00
tags: [Linux, 运维, 问题排查]
description: 深度解析 Linux 系统下 CPU 飙升的应急处理流程。涵盖紧急暂停（STOP/CONT）、线程级堆栈追踪、火焰图分析及生产环境资源隔离。
toc: true
---

当线上服务器 CPU 突然飙升到 100% 时，系统的响应极慢，甚至 SSH 都难以建立连接。作为运维或开发者，此时最忌讳“盲目重启”。本指南带你通过 **“止血、存证、分析、决策”** 四步走策略，科学解决战斗。

---

## 第一阶段：紧急止血（止痛而不杀人）

在高负载下，直接 `kill -9` 会导致关键数据丢失或无法分析死循环原因。

### 1. 寻找元凶
如果 `top` 命令卡死，请使用快照式的 `ps`：
```bash
ps -eo pid,ppid,user,cmd,%cpu --sort=-%cpu | head -n 11
```

### 2. 紧急暂停 (STOP)
使用 `SIGSTOP` 信号让进程进入“深度睡眠”状态。此时它不消耗 CPU，但内存和寄存器状态被完美保留，方便后续分析。
```bash
# 语法：kill -STOP <PID>
sudo kill -STOP 12345
```
> [!TIP]
> **为什么要 STOP 而不是 KILL？**
> KILL 之后现场全无，你无法知道它是由于什么业务逻辑触发的死循环。STOP 给你留下了“存证”的时间。

---

## 第二阶段：深度存证（保留犯罪现场）

系统负载降下来后，我们可以从容地进行分析。

### 1. 观察特定线程
对于 Java 或 C++ 等多线程程序，找到最耗时的线程：
```bash
top -Hp <PID>
```
记住该线程的十六进制 ID（在 Java `jstack` 中会用到）。

### 2. 抓取堆栈 (Stack Trace)
- **Java**: `jstack -l <PID> > /tmp/stack.txt`
- **原生进程**: `pstack <PID>` 或 `gdb --batch -ex "thread apply all bt" -p <PID>`

### 3. 查看资源占用
```bash
# 查看网络连接
ss -antp | grep <PID>
# 查看打开的文件数（防止是由于文件句柄泄露导致的 I/O 等待）
lsof -p <PID> | wc -l
```

---

## 第三阶段：特殊场景诊断

并非所有高 CPU 都是业务逻辑导致的。

- **`kswapd0` 飙高**：说明系统 **内存不足**，频繁进行页面置换。解决方法是释放 `Cache` 或增加 `Swap`。
- **中断风暴 (`softirq`)**：可能是由于网卡收到大量小包（DDoS 攻击）或驱动异常。通过 `watch -n 1 "cat /proc/interrupts"` 观察。
- **僵尸进程 (`Z` 状态)**：虽然本身不占 CPU，但其父进程可能正在死循环等待它，或者系统已经乱了套。

---

## 第四阶段：恢复与长期预防

### 1. 决策执行
- **恢复运行**：`kill -CONT <PID>`
- **正式终结**：`kill -TERM <PID>`

### 2. 引入资源隔离 (Cgroups)
在生产环境，不应允许任何一个非核心业务占满 CPU。可以通过 `systemd` 配置文件进行限制：

编辑服务文件 `/etc/systemd/system/myapp.service`：
```ini
[Service]
# 限制该服务最多只能使用 50% 的单核 CPU
CPUQuota=50%
# 限制内存
MemoryLimit=2G
```
随后执行 `systemctl daemon-reload && systemctl restart myapp`。

### 3. 部署监控报警
利用 `Prometheus` + `Node Exporter` 监控 `node_cpu_seconds_total` 指标。当 `iowait` 或 `user` 占比超过阈值时，自动触发报警。

---

## 总结

一个合格的工程师，在线上故障面前应当像外科医生：**手要快（紧急止血），心要细（存证分析），工具要利（perf/jstack/gdb）**。永远记住，重启只是手段，不是目的。
