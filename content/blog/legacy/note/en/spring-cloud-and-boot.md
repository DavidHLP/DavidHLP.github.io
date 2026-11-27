---
{
  "archiveId": "X-1067",
  "title": "Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Anchors on service discovery to distill call-chain contracts.",
  "findings": [
    "Original document: src/content/note/en/spring-cloud-and-boot.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/spring-cloud-and-boot.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "SpringBoot",
    "SpringCloud",
    "Microservices",
    "Gateway",
    "Transaction",
    "Observability",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/spring-cloud-and-boot.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Microservices & RPC",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-spring-cloud"
      ],
      "related": [
        "dubbo-nacos-runtime",
        "multi-service-readiness",
        "microservice-data-ownership",
        "containerd-tls-troubleshooting"
      ],
      "tags": [
        "SpringBoot",
        "SpringCloud",
        "Microservices",
        "Gateway",
        "Transaction",
        "Observability"
      ],
      "description": "Anchors on service discovery to distill call-chain contracts.",
      "toc": true
    }
  },
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-spring-cloud"
  ],
  "related": [
    "dubbo-nacos-runtime",
    "multi-service-readiness",
    "microservice-data-ownership",
    "spring-boot-auto-configuration",
    "spring-transaction-boundaries",
    "spring-cloud-discovery-and-gateway"
  ]
}
---

The 13 Spring Boot/Cloud notes in Fuwari form the main body of microservice notes: auto-configuration, startup, transactions, service discovery, gateway, and observability. This page converges them into reusable contracts anchored on service discovery.

## Core Mechanism

- **Auto-Configuration and Startup**: `@EnableAutoConfiguration`, `AutoConfiguration.imports` / `spring.factories`, conditionals, and exclusions live in [Spring Boot Auto-Configuration and Startup Sequence: Imports, Conditionals, and Exclusions](/blog/legacy/note/en/spring-boot-auto-configuration/).
- **Local Transaction Boundaries**: `PlatformTransactionManager`, AOP + `ThreadLocal`, seven propagation modes, and rollback rules live in [Spring Transaction Boundaries and Propagation: AOP Proxies, Isolation, and Rollback Rules](/blog/legacy/note/en/spring-transaction-boundaries/).
- **Discovery, Calls, and Gateway**: `Nacos`, `Consul`, `Spring Cloud LoadBalancer`, `OpenFeign`, and `Spring Cloud Gateway` live in [Spring Cloud Service Discovery, LoadBalancer, OpenFeign, and Gateway](/blog/legacy/note/en/spring-cloud-discovery-and-gateway/), while pinned Dubbo + Nacos runtime evidence lives in [Dubbo + Nacos: Verify the Registration Name and group/version First, Then Run a Real Smoke Test](/blog/legacy/note/en/dubbo-nacos-runtime/).
- **Resilience and Observability**: `Sentinel.md`, `CircuitBreakerPatterns`, and `BulkHeadBasics` summarize circuit breaking/rate limiting/isolation boundaries; `SetupofMicrometerandZipkinTracing.md` summarizes distributed tracing setup.

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


- [dubbo-nacos-runtime](/blog/legacy/note/en/dubbo-nacos-runtime/)
- [multi-service-readiness](/blog/legacy/note/en/multi-service-readiness/)
- [microservice-data-ownership](/blog/legacy/note/en/microservice-data-ownership/)
- [Spring Boot Auto-Configuration and Startup Sequence](/blog/legacy/note/en/spring-boot-auto-configuration/)
- [Spring Transaction Boundaries and Propagation](/blog/legacy/note/en/spring-transaction-boundaries/)
- [Spring Cloud Service Discovery, LoadBalancer, OpenFeign, and Gateway](/blog/legacy/note/en/spring-cloud-discovery-and-gateway/)

## Sources and related documents

- [ingest-spring-cloud](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md)
- [Spring Boot Auto-Configuration and Startup Sequence: Imports, Conditionals, and Exclusions](/blog/legacy/note/en/spring-boot-auto-configuration/)
- [Spring Transaction Boundaries and Propagation: AOP Proxies, Isolation, and Rollback Rules](/blog/legacy/note/en/spring-transaction-boundaries/)
- [Spring Cloud Service Discovery, LoadBalancer, OpenFeign, and Gateway](/blog/legacy/note/en/spring-cloud-discovery-and-gateway/)
- [Dubbo + Nacos: Verify the Registration Name and group/version First, Then Run a Real Smoke Test](/blog/legacy/note/en/dubbo-nacos-runtime/)
- [Multi-Service Startup Readiness: running, ready, and Dependency/Failure/Restart Propagation](/blog/legacy/note/en/multi-service-readiness/)
- [Microservice Data Ownership: Establish the Domain Owner First, Then Talk About Database Splitting and Migration](/blog/legacy/note/en/microservice-data-ownership/)

## Graduation checks

- Pinned BOM/JDK confirming auto-configuration candidates and exclusions
- local transaction propagation, rollback, and proxy boundaries
- discovery, predicate, and filter against a pinned gateway/registry pair plus C45/C47
