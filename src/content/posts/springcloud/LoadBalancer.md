---
title: Spring Cloud LoadBalancer 负载均衡深度解析与实战指南
published: 2025-07-13
tags:
  [
    Spring Cloud,
    LoadBalancer,
    负载均衡,
    微服务,
    RestTemplate,
    WebClient,
    响应式编程,
  ]
category: Spring Cloud
description: 深入剖析 Spring Cloud LoadBalancer 的架构原理、核心组件和工作流程，涵盖从基础配置到高级定制的完整实践，包括粘性会话、重试机制、区域感知等企业级负载均衡解决方案
draft: false
---

# Spring Cloud LoadBalancer 负载均衡深度解析

在现代微服务架构中，服务之间的相互调用是常态。为了确保系统的可伸缩性（Scalability）和高可用性（High Availability），通常我们会为同一个服务部署多个实例。这时，客户端在发起请求时就需要一个机制来决定到底调用哪一个服务实例，这个机制就是“负载均衡”。

Spring Cloud LoadBalancer 是 Spring Cloud 全家桶中用于实现客户端负载均衡的核心组件。它旨在替代进入维护模式的 Netflix Ribbon，并以其轻量级、非阻塞、与 Spring WebFlux 深度集成等特性，成为现代响应式微服务架构下的首选方案。

## 一、 什么是 Spring Cloud LoadBalancer？

Spring Cloud LoadBalancer 提供了一种抽象，允许你在客户端代码中通过逻辑服务名（Service ID）来调用服务，而无需硬编码具体的服务实例地址（IP:Port）。它会自动从服务注册中心（如 Eureka, Consul, Nacos）获取可用服务实例列表，并根据设定的负载均衡策略（如轮询、随机）选择一个实例来处理请求。

**核心目标：**

1.  **解耦**：客户端代码与服务实例的具体位置解耦。
2.  **高可用**：当某个服务实例宕机时，负载均衡器能自动将其从可用列表中剔除，将请求转发到其他健康实例，避免单点故障。
3.  **伸缩性**：当服务集群动态扩容或缩容时，负载均衡器能自动感知变化，将请求分发到新的实例上或停止向已下线的实例分发请求。

**与 Netflix Ribbon 的关系：**

Netflix Ribbon 是 Spring Cloud 初期默认的客户端负载均衡器。但随着响应式编程模型（Reactive Programming）的兴起，Ribbon 基于阻塞式 I/O 的设计成为了瓶颈。因此，Spring 团队开发了 Spring Cloud LoadBalancer，它基于 Project Reactor 构建，是一个完全非阻塞的解决方案，更适合与 Spring WebFlux 等响应式框架配合使用。从 Spring Cloud 2020.0.0 (codenamed Ilford) 版本开始，Netflix Ribbon 已被正式移除，Spring Cloud LoadBalancer 成为了唯一的官方选择。

## 二、 核心架构与关键组件

Spring Cloud LoadBalancer 的设计非常模块化，其核心由以下几个关键接口和类构成：

1.  **`LoadBalancerClient`**:

    - 这是最核心的阻塞式客户端接口。它提供了两个关键方法：
      - `execute(String serviceId, LoadBalancerRequest<T> request)`: 允许你传入一个 `serviceId` 和一个包含具体业务逻辑的 `LoadBalancerRequest` 回调，负载均衡器会选择一个 `ServiceInstance` 并执行该回调。
      - `reconstructURI(ServiceInstance instance, URI original)`: 用于根据选择的服务实例信息（IP 和端口）来重建原始的、基于逻辑服务名的 URI。

2.  **`ReactiveLoadBalancer<T>`**:

    - 这是响应式的核心接口，专为非阻塞场景设计。它返回一个 `Mono<Response<T>>`。
    - `choose(Request request)`: 这是它的核心方法，用于选择一个服务实例。它返回一个 `Mono<Response<ServiceInstance>>`，`Response` 对象中包含了所选的 `ServiceInstance`。如果找不到可用的实例，则返回一个 `EmptyResponse`。

3.  **`ServiceInstanceListSupplier`**:

    - **职责**：服务实例列表的提供者。这是负载均衡过程的起点，负责从某个源头获取指定 `serviceId` 的所有可用服务实例。
    - **实现**：Spring Cloud 会根据你的依赖自动配置不同的实现。
      - `DiscoveryClientServiceInstanceListSupplier`: 与服务发现客户端（如 Eureka, Consul）集成，通过 `DiscoveryClient` 获取实例列表。这是最常用的实现。
      - `ZonePreferenceServiceInstanceListSupplier`: 在获取的实例列表中，优先选择与客户端处于同一区域（Zone）的实例。
      - `HealthCheckServiceInstanceListSupplier`: 对 `ServiceInstanceListSupplier` 委托返回的实例列表进行健康检查，过滤掉不健康的实例。
      - `CachingServiceInstanceListSupplier`: 增加了缓存层，避免每次请求都去服务注册中心拉取列表，提升性能。

4.  **`ServiceInstanceChooser`**:

    - **职责**：服务实例选择器。它定义了具体的负载均衡算法。
    - `choose(String serviceId)`: 从 `ServiceInstanceListSupplier` 提供的实例列表中，根据特定策略选择一个 `ServiceInstance`。
    - **内置实现**：
      - `RoundRobinLoadBalancer` (默认): 轮询负载均衡器。它实现了 `ReactorLoadBalancer<ServiceInstance>` 接口，内部维护一个原子计数器，通过取模运算（`position % instanceList.size()`）来实现依次选择。
      - `RandomLoadBalancer`: 随机选择一个实例。

## 三、 工作流程解析

无论是使用阻塞的 `RestTemplate` 还是响应式的 `WebClient`，其背后的工作流程都遵循相似的逻辑。我们以 `WebClient` 为例，因为它能更好地体现其非阻塞特性。

当一个被 `@LoadBalanced` 注解的 `WebClient.Builder` 创建的 `WebClient` 发起一个请求时（例如 `http://user-service/users/1`）：

1.  **请求拦截**: `LoadBalancerClientFilter` 是一个 `ExchangeFilterFunction`，它会拦截这个请求。这是整个负载均衡流程的入口。

2.  **获取 `ReactiveLoadBalancer`**: `LoadBalancerClientFilter` 会从 Spring 应用上下文中获取一个与 `serviceId`（此例中为 "user-service"）关联的 `ReactiveLoadBalancer` 实例。如果没有为该服务定制，则使用默认的全局配置。

3.  **选择服务实例 (`choose`)**: `LoadBalancerClientFilter` 调用 `ReactiveLoadBalancer` 的 `choose()` 方法。

    - `choose()` 方法内部首先会调用 `ServiceInstanceListSupplier` 链。
    - **缓存检查**: `CachingServiceInstanceListSupplier` 首先检查是否有缓存的、未过期的实例列表。如果有，直接返回。
    - **服务发现**: 如果没有缓存，`DiscoveryClientServiceInstanceListSupplier` 会调用 `DiscoveryClient.getInstances("user-service")` 从服务注册中心（如 Eureka）拉取实例列表。
    - **健康检查**: `HealthCheckServiceInstanceListSupplier` (如果启用) 会对拉取到的列表进行健康检查，移除那些被标记为 `DOWN` 或 `OUT_OF_SERVICE` 的实例。
    - **返回可用列表**: 最终，一个健康的、可用的服务实例列表被返回给 `RoundRobinLoadBalancer` (默认策略)。

4.  **执行负载均衡策略**: `RoundRobinLoadBalancer` 从可用实例列表中，根据其内部的原子计数器选择一个 `ServiceInstance` 对象。这个对象包含了该实例的 `host` 和 `port`。

5.  **重建请求 URI**: `LoadBalancerClientFilter` 拿到选定的 `ServiceInstance` 后，会将原始请求中的主机名（`user-service`）替换为实例的实际地址（如 `192.168.1.101:8080`）。请求 URI 从 `http://user-service/users/1` 变成了 `http://192.168.1.101:8080/users/1`。

6.  **转发请求**: `LoadBalancerClientFilter` 将修改后的请求交给过滤器链中的下一个组件，最终由 HTTP 客户端（如 Reactor Netty）向目标实例的物理地址发起真正的网络调用。

7.  **处理响应**: 收到响应后，沿着过滤器链返回给调用方。

整个过程是完全异步和非阻塞的，非常高效。

## 四、 基础与高级配置

### 1. 添加依赖

首先，你需要确保项目中包含了 Spring Cloud LoadBalancer 的启动器。

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

### 2. 启用负载均衡

对于 `RestTemplate` 和 `WebClient`，启用方式非常简单，只需在它们的 `Bean` 定义上添加 `@LoadBalanced` 注解。

**RestTemplate (传统阻塞式)**:

```java
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

**WebClient (现代响应式)**:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
    <version>${spring.boot.version}</version>
</dependency>
```

```java
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}
```

### 3. 全局配置 (application.yml)

你可以通过 `application.yml` 文件对所有服务进行全局配置。

```yaml
spring:
  cloud:
    loadbalancer:
      # 负载均衡缓存配置
      cache:
        enabled: true
        ttl: 15s # 缓存存活时间
        capacity: 256 # 缓存容量
      # 健康检查配置
      health-check:
        enabled: true
        initial-delay: 5s # 首次检查延迟
        interval: 30s # 检查间隔
        path: # 可以指定对每个服务的哪个端点进行健康检查
          user-service: /actuator/health
      # 提示信息配置
      hint:
        enabled: true # 启用基于 hint 的路由
        default: "zone-a" # 默认 hint 值
      # 区域感知负载均衡
      zone: "zone-a"
```

### 4. 定制化配置（按服务）

Spring Cloud LoadBalancer 提供了强大的定制能力，允许你为不同的服务（`serviceId`）应用不同的负载均衡配置。这通过 `@LoadBalancerClient` 和 `@LoadBalancerClients` 注解实现。

**步骤：**

1.  **创建配置类**：创建一个 Java Configuration 类，但**不要**用 `@Configuration` 注解，以避免被主应用上下文扫描，从而成为全局配置。
2.  **定义 Bean**: 在这个类中定义你想要覆盖的 Bean，例如一个不同的 `ReactorLoadBalancer` 实现。
3.  **应用配置**: 在你的主配置类或启动类上，使用 `@LoadBalancerClient` 注解，将其指向你刚创建的配置类。

**示例：为 `user-service` 使用随机负载均衡策略**

**第一步：创建负载均衡配置类**

> [!NOTE]
> 负载均衡配置类不能被 @ComponentScan 扫描到
> 只需要一个负载均衡的 Bean 即可，多个 Bean 会导致冲突。

```java
// CustomLoadBalancerConfiguration.java
// 注意：这个类不能被 @ComponentScan 扫描到
public class CustomLoadBalancerConfiguration {

    // 定义一个随机负载均衡器 Bean
    @Bean
    ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        // 使用框架提供的工厂来创建 ServiceInstanceListSupplier
        return new RandomLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),
                name);
    }

    // 定义一个轮询负载均衡器 Bean
    // 二选一即可
    // 注意：这个 Bean 只会在没有其他负载均衡器时使用
    @Bean
    ReactorLoadBalancer<ServiceInstance> roundRobinLoadBalancer(Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new RoundRobinLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),
                name);
    }
}
```

**第二步：在主配置中应用该配置**

```java
// MainApplication.java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.loadbalancer.annotation.LoadBalancerClient;

@SpringBootApplication
// 将 CustomLoadBalancerConfiguration 配置应用到 "user-service"
@LoadBalancerClient(name = "user-service", configuration = CustomLoadBalancerConfiguration.class)
public class MainApplication {

    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }
}
```

现在，所有发往 `user-service` 的请求都将使用 `RandomLoadBalancer` 策略，而发往其他服务的请求（如 `order-service`）将继续使用默认的 `RoundRobinLoadBalancer` 策略。

如果你想为多个服务指定配置，可以使用 `@LoadBalancerClients`。

```java
@LoadBalancerClients({
  @LoadBalancerClient(name = "user-service", configuration = UserLoadBalancerConfig.class),
  @LoadBalancerClient(name = "product-service", configuration = ProductLoadBalancerConfig.class)
})
```

## 五、 高级主题与最佳实践

### 1. 粘性会话 (Sticky Sessions)

    discovery:
            instance-zone: "cn-hangzhou-g"

在某些场景下，你可能希望来自同一个客户端的连续请求都被路由到同一个服务实例上，这被称为粘性会话或会话亲和性。Spring Cloud LoadBalancer 本身不直接提供开箱即用的粘性会话实现，但可以通过自定义 `ServiceInstanceChooser` 或 `ReactorLoadBalancer` 来实现。

一种常见的实现思路是：

- **客户端标识**: 在请求中加入一个唯一标识（如 `userId` 或 `sessionId`），可以放在请求头（Header）或 Cookie 中。
- **哈希路由**: 在自定义的负载均衡器中，获取这个标识，并对其进行哈希运算。然后用哈希值对可用实例列表的大小取模，从而得到一个固定的索引，确保相同的标识总是被路由到同一个实例。

<!-- end list -->

```java
// 这是一个简化的概念实现
public class StickySessionLoadBalancer implements ReactorLoadBalancer<ServiceInstance> {
    // ... 构造函数注入 serviceId 和 supplier

    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        // request.getContext() 可以获取到请求上下文，如 HttpHeaders
        HttpHeaders headers = ((RequestDataContext) request.getContext()).getClientRequest().getHeaders();
        String clientId = headers.getFirst("X-Client-ID");

        return supplier.get(request).next().map(serviceInstances -> {
            if (serviceInstances.isEmpty()) {
                return new EmptyResponse();
            }

            ServiceInstance instance;
            if (clientId == null) {
                // 如果没有客户端ID，则退回到轮询
                instance = // ... round-robin logic
            } else {
                // 哈希路由逻辑
                int hashCode = clientId.hashCode();
                int index = Math.abs(hashCode % serviceInstances.size());
                instance = serviceInstances.get(index);
            }
            return new DefaultResponse(instance);
        });
    }
}
```

这个配置意味着，如果对一个实例的调用返回 502，负载均衡器会选择一个新的实例，然后再次发起请求，这个过程最多发生 2 次。

### 2. 区域感知（Zone-Aware）负载均衡

在多区域、多数据中心部署中，为了降低网络延迟和提高容错性，我们总是希望请求优先被路由到与客户端处于同一区域（Zone）的服务实例。

Spring Cloud LoadBalancer 通过 `ZonePreferenceServiceInstanceListSupplier` 提供了对区域感知的支持。

**配置方法**:

1.  **客户端配置**: 在客户端应用的 `application.yml` 中指定其所在的区域。

    ```yaml
    spring:
      cloud:
        loadbalancer:
          zone: "cn-hangzhou-g" # 假设客户端在杭州G区
    ```

2.  **服务端实例元数据**: 确保你的服务实例在注册到服务中心时，也包含了区域信息。以 Consul 为例：

    ```yaml
    spring:
      cloud:
        consul:
          discovery:
            instance-zone: "cn-hangzhou-g"
    ```

启用后，`ZonePreferenceServiceInstanceListSupplier` 会过滤服务列表，优先返回与客户端 `spring.cloud.loadbalancer.zone` 属性值相同的实例。如果同区域内没有可用实例，它才会将其他区域的实例也纳入选择范围，实现了跨区域的故障转移（Failover）。

通过理解其核心组件如 `ServiceInstanceListSupplier` 和 `ReactorLoadBalancer`，掌握其通过 `@LoadBalanced` 的简单用法，以及利用 `@LoadBalancerClient` 进行精细化定制的能力，开发者可以灵活地应对从简单轮询到复杂的基于业务逻辑的路由等各种场景。结合重试、健康检查和区域感知等高级功能，Spring Cloud LoadBalancer 为你的微服务架构提供了坚实的稳定性和弹性保障。
