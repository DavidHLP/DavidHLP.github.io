---
title: Spring Boot 与 Spring Cloud：自动装配、事务、注册发现、网关与可观测性
timestamp: 2026-08-21 00:00:00+08:00
series: "微服务与 RPC"
kind: concept
status: active
sources: ["ingest-spring-cloud"]
related: [dubbo-nacos-runtime, multi-service-readiness, microservice-data-ownership, containerd-tls-troubleshooting]
tags: [SpringBoot, SpringCloud, Microservices, Gateway, Transaction, Observability]
description: 以服务注册发现为起点，归纳自动装配、事务、熔断限流与可观测性的配置与运行边界。
toc: true
---

Fuwari 13 篇 Spring Boot/Cloud 原文构成微服务笔记的主体：自动装配、启动流程、事务、注册发现、网关与可观测性。本页以注册发现为锚，收敛为可复用契约。

## 核心机制

- **Boot**：`SpringBootAuto-configuration.md` 讲 `@EnableAutoConfiguration` 与条件化；`SpringTransactions.md` 讲事务传播与隔离。
- **注册发现**：`Nacos.md` 与 `ConsulServiceRegistrationandDiscovery.md` 对比 AP/CP、健康检查与配置中心；`dubbo-nacos-runtime` 页已有 Dubbo+Nacos 的固定版本证据。
- **调用与网关**：`OpenFeign.md`、`LoadBalancer.md`、`SpringCloudGateway.md` 覆盖声明式调用、负载与路由。
- **容错与可观测**：`Sentinel.md`、`CircuitBreakerPatterns`、`BulkHeadBasics` 讲熔断/限流/隔离；`SetupofMicrometerandZipkinTracing.md` 讲 Trace。

## 适用条件

- Spring 生态、需快速搭建注册发现与网关的微服务。

## 不适用与风险

- 原文版本未完全固定，与当前 Spring Boot 3.x/Cloud 2023 有漂移；`SpringSecurityAndCloudPermissionService` 涉及权限，需按当前版本复核。
- 事务与分布式事务（未单独成文）边界需显式评估。

## 最小验证

1. 自动装配：在 `spring.factories`/`imports` 中定位候选。
2. 注册发现：本地 Nacos/Consul 起停，验证健康与路由。
3. 网关：谓词与过滤器单测，熔断/限流阈值压测。

## 证据与不确定性

- **来源事实**：`ingest-spring-cloud` 收录 13 篇原文，部分含零宽字符文件名。
- **本页综合**：把分散笔记收敛为调用链路模型。
- **未确认项**：Spring Cloud 版本矩阵、Gateway 谓词语法需按当前版本验证。

## 相关页面

- [dubbo-nacos-runtime](/note/dubbo-nacos-runtime)
- [multi-service-readiness](/note/multi-service-readiness)
- [microservice-data-ownership](/note/microservice-data-ownership)
- [containerd-tls-troubleshooting](/note/containerd-tls-troubleshooting)
