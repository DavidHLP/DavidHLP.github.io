---
title: Arthas: The Online Diagnostic Tool for Java Developers
timestamp: 2026-02-25 00:00:00+08:00
tags: [Java, Operations, Troubleshooting, Arthas]
description: A comprehensive introduction to Arthas, an open-source Java diagnostic tool by Alibaba, covering core features, use cases, and best practices to help developers quickly locate and resolve production issues.
toc: true
---

## Introduction

During the development and maintenance of Java applications, we often encounter various production issues such as high CPU usage, memory leaks, and slow API responses. Traditional debugging methods often require restarting the service or adding logs, which not only affects service availability but also increases the complexity of problem investigation. Today, I will introduce a powerful Java diagnostic tool - Arthas, which can help us quickly locate and resolve these issues without restarting the service.

## What is Arthas

Arthas is an open-source Java diagnostic tool developed by Alibaba, based on Java Instrumentation technology, with the following characteristics:

- **Non-invasive**: No code modifications or service restarts required
- **Real-time diagnostics**: Real-time view of JVM status, method calls, thread information, etc.
- **Command-line interaction**: Rich commands with Tab auto-completion support
- **Cross-platform**: Supports Linux/Mac/Windows, compatible with JDK 6+

According to the official documentation, Arthas can help us solve various common problems, including class loading issues, code debugging problems, and performance monitoring issues.

## Core Features

### 1. Watch: Method Execution State Observation

The Watch command is mainly used to investigate "instantaneous method execution state", capturing real-time details of specified method calls.

**Common Use Cases**:

| Category | Investigation Content | Practical Examples |
|----------|----------------------|-------------------|
| Parameter Exceptions | Whether parameters are tampered with/missing/format errors | Observing HTTP parameters received by Controller, verifying RPC call parameters meet expectations |
| Return Value Issues | Empty results, incorrect data, type mismatch | Checking DAO query results, third-party API responses, cache return values |
| Hidden Exceptions | Exceptions swallowed, incomplete log stack traces | Using `-e` to capture NPE/business exceptions, get complete stack and parameter snapshot at trigger time |
| Conditional Logic Verification | Whether business branches trigger as expected | Verifying "coupon生效", "permission check returns true/false" and other key judgments |
| Data Flow Tracking | Whether parameters are modified during multi-layer calls | Observing parameter passing consistency from Service → DAO layer |

**Example**:
```bash
# Observe the input parameters and return value of the order creation method in the order service
watch com.example.OrderService createOrder '{params[0], params[1], returnObj}'
```

### 2. Trace: Method Call Path Tracing

The Trace command is used to trace "method internal call path and calculate time consumption for each node (top-down)" to accurately locate time-consuming nodes and exception paths.

**Common Use Cases**:

| Investigation Type | Typical Problem | How Trace Solves It |
|-------------------|-----------------|---------------------|
| API Performance Bottleneck | "My Orders" API occasionally times out during peak hours (>3s) | Trace complete call chain of getUserOrders, locate abnormal time consumption in inventory/coupon service calls |
| Slow Method Root Cause | Certain method has high average time but no log details | Output time consumption of each layer call within method (e.g., line #24 calling primeFactors() takes 1.27ms) |
| Exception Context Restoration | Null pointer exception but incomplete stack trace | Capture complete call path and node time consumption at exception occurrence, quickly locate "crime scene" |
| Conditional Trigger Analysis | Only focus on exception calls with time >100ms | trace *StringUtils isBlank '#cost>100' precisely filter spike requests |
| Complex Logic Verification | Whether business branches execute as expected | Visually display all branch call paths within method, verify logic flow |

**Example**:
```bash
# Trace call paths in order processing that exceed 100ms
trace com.example.OrderProcessor processOrder '#cost>100'
```

### 3. Stack: Method Call Path Restoration

The Stack command is used to trace "the complete call path where a specified method is invoked (bottom-up)".

**Common Use Cases**:

| Investigation Scenario | Problem Characteristics | How Stack Solves It |
|-----------------------|----------------------|---------------------|
| Call Source Location | Common method called from multiple places, need to locate specific trigger | Output complete call stack: CustomRealm.ldapLogin → SystemPersonalController.ldapServerConfigConnectionTest |
| Exception Path Restoration | Method behavior abnormal but don't know what triggered it | Capture call chain at exception occurrence, quickly locate "entry point" |
| Performance Spike Tracing | Common method occasionally has high time consumption, need to find "culprit" | stack XxxService commonMethod '#cost>100' filter high time-consuming calls, view caller |
| Framework Flow Learning | Unclear how framework internal methods are triggered | View call paths of key methods in Spring AOP, Shiro and other frameworks |
| Deadlock/Blocking Analysis | Thread blocked but need to confirm blocking point call context | After using thread -b to locate blocking thread, use stack to trace call chain of blocking method |

**Example**:
```bash
# View call path of frequently called common method in order service
stack com.example.CommonService processOrder
```

### 4. TT: Method Call Time Tunnel

TT (TimeTunnel) command records the input parameters and return information of each call for a specified method, and allows observation of these calls at different times.

**Main Functions**:
- Record method call history
- View historical call details
- Replay historical calls
- Filter call records based on conditional expressions

**Example**:
```bash
# Record call history of create method in order service
tt -t com.example.OrderService createOrder

# View detailed information of the most recent call
tt -i 1000

# Replay a specific historical call
tt -p -i 1003
```

### 5. Monitor: Method Execution Monitoring

Monitor command monitors calls matching the class/method, statistics include call count, success rate, average response time and other indicators.

**Main Monitoring Indicators**:
- Call count
- Success/failure count
- Average response time
- Failure rate

**Example**:
```bash
# Monitor execution of create method in order service, output statistics every 5 seconds
monitor -c 5 com.example.OrderService createOrder
```

### 6. System Properties and JVM Information

Arthas also provides functionality to view and modify JVM system properties, view memory information, thread status, etc.

**Common Commands**:
- `sysprop`: View and modify JVM system properties
- `jvm`: View current JVM information
- `memory`: View JVM memory information
- `thread`: View current JVM thread stack information

**Example**:
```bash
# View all JVM system properties
sysprop

# View specific system property
sysprop java.version

# Modify system property
sysprop production.mode true

# View JVM memory usage
memory
```

## Comparison with Other Diagnostic Tools

Compared with other Java diagnostic tools, Arthas has its unique advantages and applicable scenarios:

### Comparison with VisualVM

| Feature | Arthas | VisualVM |
|---------|--------|----------|
| Installation/Usage | Simple, one-click start | Requires installation and configuration |
| Production Environment Suitability | High, non-invasive | Medium, high resource consumption |
| Real-time Monitoring | Command line real-time updates | Graphical interface, refresh delay |
| Remote Diagnostics | Convenient, Telnet-based | Complex, requires configuration |
| Function Depth | Rich command-line tools | Powerful graphical analysis |
| Learning Curve | Command-line operation, needs familiarization | Graphical interface, easy to start |

### Comparison with JProfiler

| Feature | Arthas | JProfiler |
|---------|--------|-----------|
| Performance Impact | Low, on-demand enhancement | High, full monitoring |
| Production Environment | Suitable, can be used online | Not recommended, high resource consumption |
| Sampling Analysis | Supports multiple sampling methods | Advanced analysis like flame graphs |
| Code Hot Replacement | Supported | Not supported |
| Usage Threshold | Command-line, needs learning | Graphical interface, relatively simple |
| License Cost | Open source, free | Commercial license |

### Summary

- **Arthas**: More suitable for real-time diagnosis in production environments, with low resource usage and non-invasive characteristics, ideal for experienced developers to quickly locate issues
- **VisualVM**: Suitable for performance analysis and problem diagnosis during development, friendly graphical interface, but use with caution in production
- **JProfiler**: Suitable for detailed performance analysis and tuning, but high resource consumption, mainly used in development and testing environments

## Best Practices

### 1. Production Environment Usage Precautions

- **Security Control**: Limit Arthas port, avoid public network exposure
- **Performance Impact**: watch/trace commands add 5%~15% overhead, use `-n` to limit output count
- **Output Recording**: Save key command results via `-o /tmp/arthas.log`
- **Resource Release**: Timely `stop` to release resources after problem is resolved

### 2. Problem Investigation Approach

When encountering production issues, follow these steps to use Arthas:

1. **Use dashboard first**: Get overall system status including CPU, memory, GC, thread and other basic information
2. **Use thread command**: View thread status, locate high CPU usage or deadlock issues
3. **Use trace/monitor**: Perform performance analysis on key methods, locate bottlenecks
4. **Use watch/TT**: Observe method call details, verify business logic
5. **Use memory/jmap**: Analyze memory usage, investigate memory leaks

### 3. Common Problem Solutions

**High CPU Issue**:
```bash
# 1. View system status
dashboard

# 2. View thread stack, find high CPU占用 thread
thread -b

# 3. Trace time-consuming methods
trace *Service *Method '#cost>100'

# 4. Monitor method execution
monitor -c 5 com.example.HighCpuMethod
```

**Memory Leak Issue**:
```bash
# 1. View memory usage
memory

# 2. View heap memory usage
heapdump

# 3. Analyze object reference chain
vmtool --action referenceAnalyze --className com.example.LeakedClass

# 4. Monitor GC situation
jvm -g
```

**Slow API Response Issue**:
```bash
# 1. Trace method call path
trace com.example.SlowService slowMethod

# 2. Monitor method execution time
monitor -c 10 com.example.SlowService slowMethod

# 3. Observe method call details
watch com.example.SlowService slowMethod '{params[0], returnObj, cost}'
```

## Conclusion

Arthas, as a powerful Java diagnostic tool, has become a valuable tool for Java developers to solve production problems due to its non-invasive and real-time diagnostic characteristics. Through the introduction in this article, I believe everyone has a deep understanding of Arthas's core functions, including the use cases and practical examples of commands like Watch, Trace, Stack, TT, and Monitor.

Compared with other diagnostic tools, Arthas has obvious advantages in production environments, especially suitable for scenarios requiring real-time diagnosis and problem investigation. In actual use, combined with other tools provided by the system, it can more efficiently locate and solve various Java application problems.

I hope the content of this article can help everyone better understand and use Arthas, improving the observability and problem investigation efficiency of Java applications. If you haven't tried Arthas yet, I strongly recommend trying it in your next project. I believe it will become a powerful assistant in your development toolbox.
