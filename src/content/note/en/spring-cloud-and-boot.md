---
title: "Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability"
timestamp: 2026-08-21 00:00:00+08:00
series: "Architecture & Engineering Practice"
kind: concept
status: active
draft: true
sources: ["ingest-spring-cloud"]
related: [dubbo-nacos-runtime, multi-service-readiness, microservice-data-ownership, containerd-tls-troubleshooting]
tags: [SpringBoot, SpringCloud, Microservices, Gateway, Transaction, Observability]
description: Anchors on service discovery to distill call-chain contracts.
toc: true
---

The 13 Spring Boot/Cloud notes in Fuwari form the main body of microservice notes: auto-configuration, startup, transactions, service discovery, gateway, and observability. This page converges them into reusable contracts anchored on service discovery.

## Core Mechanism

- **Boot**: `SpringBootAuto-configuration.md` covers `@EnableAutoConfiguration` and conditionals; `SpringTransactions.md` covers propagation and isolation.
- **Service discovery**: `Nacos.md` and `ConsulServiceRegistrationandDiscovery.md` compare AP/CP, health checks, and config centers; `dubbo-nacos-runtime` already has pinned evidence for Dubbo+Nacos.
- **Calls and gateway**: `OpenFeign.md`, `LoadBalancer.md`, `SpringCloudGateway.md` cover declarative calls, load balancing, and routing.
- **Resilience and observability**: `Sentinel.md`, `CircuitBreakerPatterns`, `BulkHeadBasics` cover circuit breaking/rate limiting/isolation; `SetupofMicrometerandZipkinTracing.md` covers tracing.

## Applicability

- Spring ecosystem that needs to quickly assemble service discovery and gateway for microservices.

## Not Applicable and Risks

- Source versions are not fully pinned and drift from current Spring Boot 3.x / Cloud 2023; `SpringSecurityAndCloudPermissionService` touches permissions and must be rechecked against current versions.
- Transaction and distributed transaction boundaries (not covered separately) need explicit evaluation.

## Minimum Verification

1. Auto-configuration: locate candidates in `spring.factories`/`imports`.
2. Service discovery: start/stop local Nacos/Consul and verify health and routing.
3. Gateway: unit-test predicates and filters, load-test circuit breaker/rate limit thresholds.

## Evidence and Uncertainty

- **Source facts**: `ingest-spring-cloud` contains 13 source notes, some with zero-width characters in filenames.
- **Synthesis**: This page converges scattered notes into a call-chain model.
- **Unconfirmed**: Spring Cloud version matrix and Gateway predicate syntax must be verified against current versions.

## Related Pages

- [dubbo-nacos-runtime](/note/dubbo-nacos-runtime)
- [multi-service-readiness](/note/multi-service-readiness)
- [microservice-data-ownership](/note/microservice-data-ownership)
- [containerd-tls-troubleshooting](/note/containerd-tls-troubleshooting)
