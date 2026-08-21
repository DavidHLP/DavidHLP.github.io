---
title: "Java Production Performance Troubleshooting: A Minimal Symptom-to-Evidence Decision Tree"
timestamp: 2026-02-25 00:00:00+08:00
series: "Java Fundamentals & Backend Tuning"
kind: concept
status: active
draft: true
sources: ["legacy-java-online-performance-debug"]
related: ["java-null-value", "java-atomic-boolean", "java-internship-interview-blog-polished"]
tags: ["Linux", "Operations", "SRE", "Performance Troubleshooting", "CPU", "Java", "Production Incident", "Arthas", "JVM", "Hot-Swapping"]
description: "Compresses Java production incidents into a minimal decision tree from symptom and evidence to thread, GC, or code localization, followed by reversible mitigation and recovery."
toc: true
---

This page is a decision tree for Java production performance incidents, not a 1,500-line command tutorial. The goal is to preserve evidence while the service is observable, narrow a system symptom to a process, thread, GC signal, or code hotspot, and then choose a reversible mitigation and recovery action.

## Core mechanism

### 1. Classify the symptom before calling it a Java loop

| Symptom / evidence                                      | First hypothesis                                          | Next step                                                       |
| ------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| High `user`, one Java process and thread stay RUNNABLE  | Hot computation, loop, serialization, or retry storm      | Thread stacks, Arthas `thread`/flame graph, code localization   |
| High `system` or `softirq`                              | Kernel, network interrupt, or packet storm                | Inspect system and network actors before changing business code |
| High `iowait`                                           | Disk, logging, database, or downstream I/O wait           | Check I/O latency, connections, and dependency metrics          |
| High CPU with frequent GC and a near-full heap          | Allocation pressure, memory shortage, or collection storm | `jstat`, GC logs, heap/allocation evidence                      |
| High load with modest CPU and `BLOCKED/WAITING` threads | Lock contention, exhausted pool, or blocked dependency    | Stacks, pool queues, locks, and downstream timeouts             |

### 2. The evidence chain matters more than a single command

```text
symptom → time/impact → process PID → hot thread TID → jstack nid
        → RUNNABLE/BLOCKED/WAITING/GC clue → code or dependency → reversible action
```

The smallest useful incident set is a timestamp, load/CPU snapshot, PID/TID, thread stacks, GC statistics or logs, and the deployment/traffic timeline. `top -Hp <pid>` can find threads; `printf "%x" <tid>` converts a TID to the hexadecimal `nid` used by `jstack`. The commands establish a chain; they are not a reason to dump a checklist.

### 3. Converge from thread to code

- `RUNNABLE`: match the `nid` to a stack; if it is not specific enough, use narrowly scoped Arthas `thread`, `trace`, or a flame graph.
- `BLOCKED`: inspect the lock owner and wait chain instead of blindly adding threads.
- `WAITING`: decide whether the wait is a normal queue state, an idle pool, or an unbounded downstream wait.
- GC-related: align `jstat`/GC-log pauses, frequency, and heap movement with allocation and request latency. Seeing GC alone does not prove it is the cause.

Arthas connects to a running JVM and observes threads or methods. `watch`, `trace`, and `stack` have cost; narrow the class, method, condition, and sample count first.

## Applicability

- The process is still reachable enough to read system and JVM evidence.
- You can obtain the PID, thread stacks, GC signals, and deployment/traffic timeline.
- The incident requires an ordered trade-off between preserving evidence and restoring availability, rather than an unconditional restart.
- Production observation has a bounded scope, sample count, and rollback plan, with diagnostic overhead assessed.

## Not applicable and risks

- `kill -9`, an immediate restart, or unbounded `watch/trace` can destroy evidence, widen the incident, or consume more CPU. Use them only after evidence is sufficient or risk is already uncontrollable.
- `jstack` is a sample at one moment. It cannot establish full temporal causality; use repeated samples, metrics, and change history.
- `jmap`, heap dumps, flame graphs, and Arthas observation can pause work, create I/O, or expose sensitive data. Check disk, permissions, redaction, and approval boundaries first.
- HotSwap/redefine/retransform is version- and class-shape-sensitive emergency mitigation, not a repair. Keep the original class, record the change, and prepare rollback.
- The meaning of `user/system/iowait/softirq`, GC counters, and diagnostic commands varies with OS, JDK, containers, and tool versions; this page gives no universal threshold.

## Minimum verification

1. On alert or reproduction, record time, affected endpoints, traffic, load, and the hot PID before killing anything.
2. Collect two samples for the same PID: find hot TIDs, convert one to hex, and locate its `nid` in `jstack`; check whether the state persists.
3. If the stack suggests GC, correlate repeated GC statistics/logs with latency, allocation, and heap movement. If it points to a method, use one bounded `trace` or flame graph to validate the hotspot.
4. Apply one reversible action—rate limit, degrade, pause a bad job, scale, or controlled restart—and observe CPU, latency, errors, queues, and GC before and after. Preserve both sets of evidence.
5. Record direct cause, contributing cause, evidence, action, and follow-up monitoring. “Service recovered” is not the same as “root cause confirmed.”

## Evidence and uncertainty

- **Source facts**: `legacy-java-online-performance-debug` supplies the four-stage approach (mitigate, preserve, locate, recover), CPU categories, PID/TID-to-`jstack` mapping, Arthas thread/method observation, GC/system cases, and Hotfix risks.
- **Synthesis in this page**: The command-heavy source is reduced to symptom → evidence → thread/GC/code → mitigation/recovery, with observation cost and reversibility as decision criteria.
- **Unconfirmed**: Any threshold, exact HotSwap capability, Arthas command compatibility, or claim that one stack is the root cause must be checked against the current JDK, container, OS, versions, and incident evidence.

## Related pages

- [NullValue: The Cache-Null Placeholder and Serialization Boundary](/note/java-null-value)
- [AtomicBoolean: Atomic Boolean State and CAS Boundaries](/note/java-atomic-boolean)
- [Java Backend Interview Retrospective: Project Truth, Engineering Mechanisms, and Production Evidence](/note/java-internship-interview-blog-polished)
