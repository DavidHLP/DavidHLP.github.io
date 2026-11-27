---
{
  "archiveId": "X-1334",
  "translationKey": "legacy/note/spring-cloud-discovery-and-gateway",
  "title": "Spring Cloud Service Discovery, LoadBalancer, OpenFeign, and Gateway",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Summarizes Spring Cloud microservice notes covering Consul vs. Nacos discovery and config centers, non-blocking Spring Cloud LoadBalancer instance selection after Ribbon's removal, OpenFeign @FeignClient proxies, and Spring Cloud Gateway Route/Predicate/Filter primitives.",
  "findings": [
    "Raw source: src/content/raw/zh-cn/ingest-spring-cloud.md",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "SpringCloud",
    "Nacos",
    "Consul",
    "LoadBalancer",
    "OpenFeign",
    "Gateway",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-spring-cloud"
  ],
  "related": [
    "spring-cloud-and-boot"
  ]
}
---

Replacing hardcoded `IP:Port` targets with logical service names puts four coupled control points into every request path: the service registry (who is registered and healthy), client-side load balancing (which instance receives the call), declarative HTTP proxying, and the edge gateway (matching predicates and applying cross-cutting filters).

This page extracts `ConsulServiceRegistrationandDiscovery.md`, `Nacos.md`, `LoadBalancer.md`, `OpenFeign.md`, and `SpringCloudGateway.md` details from [Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability](/blog/legacy/note/en/spring-cloud-and-boot/); for pinned Dubbo + Nacos evidence, see `dubbo-nacos-runtime`.

## Core Mechanisms

### 1. Registry and configuration boundaries: Consul vs. Nacos

- **Consul**: runs periodic TCP/HTTP/script agent health checks; a failing check marks the instance `critical` and keeps it in the catalog rather than removing it. Returning only healthy instances requires `spring.cloud.consul.discovery.query-passing=true` (default `false`, meaning all instances are returned), and automatic deregistration of failed instances requires `spring.cloud.consul.discovery.health-check-critical-timeout` (registered with Consul as the service's `deregister_critical_service_after`). It also provides a hierarchical KV config store (`bootstrap.yml` historically loads remote config before the main context), mTLS (Consul Connect), and a default `8500` Web UI.
- **Nacos**: combines Discovery and dynamic configuration management; Nacos 2.x uses gRPC client/server ports `9848`/`9849` alongside console port `8848`, and production containers should pin explicit tags instead of `latest` while enabling `NACOS_AUTH_ENABLE=true`.

### 2. Client-side load balancing: `Spring Cloud LoadBalancer`

Since blocking Netflix Ribbon was removed in Spring Cloud `2020.0.0` (Ilford), `Spring Cloud LoadBalancer` provides Reactor-based non-blocking routing via two primary chains:

- **`ServiceInstanceListSupplier`**: combines `DiscoveryClientServiceInstanceListSupplier` with `CachingServiceInstanceListSupplier`, `HealthCheckServiceInstanceListSupplier` (filtering out `DOWN` / `OUT_OF_SERVICE` instances), and `ZonePreferenceServiceInstanceListSupplier`.
- **`ServiceInstanceChooser` / `ReactiveLoadBalancer<T>`**: defaults to `RoundRobinLoadBalancer` (atomic modulo counter) alongside `RandomLoadBalancer`; `LoadBalancerClientFilter` (or blocking `LoadBalancerClient`) resolves logical hosts such as `http://user-service/users/1` into physical `host:port` endpoints.

### 3. Declarative clients: `OpenFeign`

Enabling `@EnableFeignClients` scans `@FeignClient(name = "user-service")` interfaces to generate dynamic proxies integrating Service ID resolution, `Spring Cloud LoadBalancer`, and Resilience4j fallbacks:

```java
@FeignClient(name = "user-service")
public interface UserClient {
    @GetMapping("/users/{id}")
    UserDto findById(@PathVariable("id") Long id);
}
```

### 4. Edge entry: `Spring Cloud Gateway` primitives

Positioned between external callers and backend microservices, Gateway builds routing rules from three primitives:

| Component | Responsibility | Typical shape |
| --- | --- | --- |
| **Route** | Core forwarding unit | Unique `id` + target `uri` + predicate set + filter chain |
| **Predicate** | Matches incoming requests | Conditions on `Headers`, `Query`, `Path`, `Method`, time, Cookie, or Host |
| **Filter** | Pre/post request transformation | `GatewayFilter` instances for validation, auth, metrics, and rate limiting |

## Applicability and Unverified Boundaries

- **Applicable**: designing Spring Cloud call chains, debugging `Service ID -> Discovery -> LoadBalancer -> instance` resolution, and structuring Gateway routes.
- **Not applicable**: carrying legacy Boot/Cloud assumptions (unconditional `bootstrap.yml` loading or removed Ribbon properties) into Cloud 2023+ / Boot 3.x unchanged.
- **Unverified boundaries preserved from raw sources**:
  - the source snapshot spans multiple Cloud releases without a **single pinned BOM matrix verifying Gateway predicate syntax, `spring-cloud-starter-bootstrap` toggles, or `OpenFeign` retry/timeout tables**;
  - resilience patterns (Sentinel/CircuitBreaker/Bulkhead) and Micrometer/Zipkin tracing remain summarized in the parent note without load-test benchmarks here.

## Graduation Checks

1. Start and stop a local Nacos/Consul instance under a pinned Spring Cloud 2023+ BOM and JDK to verify `query-passing` filtering, critical-timeout deregistration, and `HealthCheckServiceInstanceListSupplier` eviction lag.
2. Inject an unhealthy backend instance behind an `@FeignClient` call to verify `LoadBalancer` cache expiration and `RoundRobinLoadBalancer` failover.
3. Write an integration test for a Gateway route combining `Path`/`Header` predicates with a pre-`GatewayFilter`, asserting target URI forwarding and response codes.

## Related Pages

- [Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability](/blog/legacy/note/en/spring-cloud-and-boot/)
- [Dubbo + Nacos: Verify the Registration Name and group/version First, Then Run a Real Smoke Test](/blog/legacy/note/en/dubbo-nacos-runtime/)
- [Multi-Service Startup Readiness: running, ready, and Dependency/Failure/Restart Propagation](/blog/legacy/note/en/multi-service-readiness/)
- [ingest-spring-cloud (raw source)](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md)
