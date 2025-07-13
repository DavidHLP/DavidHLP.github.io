---
title: CircuitBreaker的原理解析与Resilience4j实现
published: 2025-06-17
tags: [SpringCloud, Resilience4j]
category: SpringCloud
description: 全面解析CircuitBreaker熔断器模式原理，包括其如何通过CLOSED、OPEN、HALF_OPEN三种状态转换防止雪崩效应，并结合Resilience4j框架在SpringCloud微服务中的实现细节与测试案例
draft: false
---

## **一、 问题背景：为何需要熔断器？**

在现代分布式系统，特别是微服务架构中，服务之间相互依赖、相互调用是常态。一个用户请求的背后，可能是一条由多个微服务构成的复杂调用链。这种设计在提升系统灵活性和可扩展性的同时，也引入了新的风险——**级联故障（Cascading Failures）**，通常被称为“雪崩效应”。

### **雪崩效应的根源**

想象一个典型的“扇出”调用场景：微服务 A 依赖于微服务 B 和 C，而 B 和 C 又各自依赖于其他服务。

```mermaid
graph TD
    A[用户请求] --> SVC_A[微服务 A]
    SVC_A --> SVC_B[微服务 B]
    SVC_A --> SVC_C[微服务 C]
    SVC_B --> SVC_D[微服务 D]
    SVC_B --> SVC_E[微服务 E]
    SVC_C --> SVC_F[微服务 F]

    subgraph "依赖链路"
        direction LR
        SVC_A -- 调用 --> SVC_B
        SVC_A -- 调用 --> SVC_C
    end
```

如果链路末端的某个服务（如 `SVC_D`）因为高负载、程序 Bug 或网络问题，出现响应缓慢或无响应，那么对它的调用请求就会开始堆积。调用方 `SVC_B` 的线程池、连接池等资源将被这些等待的请求迅速占满。很快，`SVC_B` 自身也会变得不稳定，无法响应来自 `SVC_A` 的请求。

这个故障会像雪球一样，沿着调用链逆向传递，最终导致入口处的 `SVC_A` 也因资源耗尽而崩溃。此时，整个系统对外表现为大面积瘫痪，这就是毁灭性的**雪崩效应**。

在高流量场景下，单个节点的微小延迟都可能被放大，并迅速传导至整个系统，造成灾难性后果。因此，我们必须实现一种**快速失败（Fail-Fast）和故障隔离**的机制，确保单个依赖的故障不会拖垮整个系统。**Circuit Breaker（熔断器）模式**正是为此而生。

## **二、 核心原理：熔断器模式详解**

Circuit Breaker 的设计灵感来源于现实世界中的电路保险丝。它在服务调用方和服务提供方之间引入了一个代理层，通过监控调用的成功与失败，动态地改变自身状态，从而实现对下游服务的保护和自动恢复。

其核心是一个有限状态机，包含三个主要状态：

1.  **`CLOSED` (闭合状态)**：

    - **行为**：这是熔断器的默认和正常状态。所有请求都会直接穿过熔断器，到达下游服务。
    - **逻辑**：在此状态下，熔断器会持续计算近期请求的失败率。如果失败率低于预设的阈值，它将保持`CLOSED`状态。
    - **状态转换**：当失败率在指定的时间窗口内（或指定请求次数内）超过阈值时，熔断器会从`CLOSED`切换到`OPEN`状态。

2.  **`OPEN` (断开状态)**：

    - **行为**：熔断器已“跳闸”。所有进入该熔断器的请求都会立即失败，直接返回一个错误响应（如执行降级逻辑），而不会去调用下游服务。
    - **逻辑**：这是一种保护机制，通过阻止流量涌向下游已经出问题的服务，给予其恢复的时间，同时也避免了调用方因无谓的等待而耗尽资源。
    - **状态转换**：在`OPEN`状态下停留一段预设的时间（`waitDurationInOpenState`）后，熔断器会自动切换到`HALF_OPEN`状态，尝试进行恢复探测。

3.  **`HALF_OPEN` (半开状态)**：

    - **行为**：熔断器会允许一小部分“探针”请求通过，去调用下游服务。
    - **逻辑**：这是从故障中恢复的试探阶段。熔断器会根据这些探针请求的结果来判断下游服务是否已经恢复。
    - **状态转换**：
      - **如果探针请求的失败率仍然高于阈值**，说明下游服务尚未恢复。熔断器会立刻切换回`OPEN`状态，重新开始等待计时。
      - **如果探针请求的成功率达到标准**，说明下游服务已恢复。熔断器则会切换到`CLOSED`状态，恢复正常链路。

此外，还有两个用于管理和干预的特殊状态：

- **`DISABLED` (禁用状态)**：熔断器功能被完全关闭，所有请求都将通过。
- **`FORCED_OPEN` (强制开启状态)**：手动将熔断器置于`OPEN`状态，拒绝所有请求。常用于计划内维护或紧急故障处理。

### **状态转换流程图**

```mermaid
stateDiagram-v2
    direction LR
    [*] --> CLOSED: 初始化
    CLOSED --> OPEN: 失败率超过阈值
    OPEN --> HALF_OPEN: 等待时间结束
    HALF_OPEN --> CLOSED: 探针请求成功
    HALF_OPEN --> OPEN: 探针请求失败

    state CLOSED {
        CLOSED_NOTE: 正常处理请求
        CLOSED_NOTE2: 并持续监控失败率
    }

    state OPEN {
        OPEN_NOTE: 立即拒绝所有请求
        OPEN_NOTE2: 执行降级逻辑
        OPEN_NOTE3: 等待恢复计时器
    }

    state HALF_OPEN {
        HALF_OPEN_NOTE: 允许少量探针请求通过
        HALF_OPEN_NOTE2: 根据结果决定下一步状态
    }
```

## **三、 实战：基于 Resilience4j 的熔断实现**

Hystrix 进入维护模式后，**Resilience4j** 已成为 Java 生态中熔断、限流等弹性能力实现的首选。它是一个轻量级、函数式的容错库，无外部依赖，与 Spring Cloud 生态无缝集成。

### **1. 引入依赖**

```xml
<!--resilience4j-circuitbreaker-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
<!-- 由于断路保护等需要AOP实现，所以必须导入AOP包 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

### **1. 核心配置 (application.yml)**

我们将熔断相关的配置集中在`application.yml`或其环境特定文件中。

```yaml
// application.yml
resilience4j:
  circuitbreaker:
    configs:
      # 定义一个可复用的默认配置模板
      default:
        failureRateThreshold: 50 # 失败率阈值(%)。当失败率达到50%时，熔断器将打开
        slidingWindowType: COUNT_BASED # 滑动窗口类型。此处基于请求数量
        slidingWindowSize: 6 # 滑动窗口大小。在CLOSED状态下，统计最近6次调用的失败率
        minimumNumberOfCalls: 6 # 最小调用次数。在熔断器计算失败率之前，至少需要6次调用
        automaticTransitionFromOpenToHalfOpenEnabled: true # 自动从OPEN转换到HALF_OPEN，无需任何操作
        waitDurationInOpenState: 5s # 在OPEN状态下等待5秒后，转换为HALF_OPEN
        permittedNumberOfCallsInHalfOpenState: 2 # 在HALF_OPEN状态下，允许2个探针请求
        recordExceptions: # 将哪些异常记录为失败
          - java.lang.Exception
    instances:
      # 为名为 "cloud-payment-service" 的服务创建一个熔断器实例
      # 这个名字将与代码中的 @CircuitBreaker 注解关联
      cloud-payment-service:
        baseConfig: default # 继承上面定义的 'default' 配置
```

**关键配置参数解析:**

| 参数                                    | 解释                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `failureRateThreshold`                  | **失败率阈值**：触发熔断的核心条件。                                                           |
| `slidingWindowType`                     | **滑动窗口类型**：`COUNT_BASED`（基于次数）或 `TIME_BASED`（基于时间）。                       |
| `slidingWindowSize`                     | **滑动窗口大小**：在`CLOSED`状态下，统计失败率的样本范围（次数或秒数）。                       |
| `minimumNumberOfCalls`                  | **最小调用次数**：防止因偶然的少量失败就触发熔断。只有当调用次数达到该值后，才开始计算失败率。 |
| `waitDurationInOpenState`               | **开启状态持续时间**：熔断器在`OPEN`状态下停留的时间，之后会自动转为`HALF_OPEN`。              |
| `permittedNumberOfCallsInHalfOpenState` | **半开状态探测次数**：在`HALF_OPEN`状态下，允许多少个请求去探测下游服务是否恢复。              |
| `recordExceptions`                      | **记录为失败的异常**：定义哪些异常发生时，应被计为一次“失败”调用。                             |

### **2. 服务提供方 (Producer)**

为了测试熔断，我们在服务提供方模拟出正常、异常和超时三种情况。

```java
// PayCircuitController.java
@RestController
public class PayCircuitController {
    @GetMapping(value = "/pay/circuit/{id}")
    public String myCircuit(@PathVariable("id") Integer id) {
        // 模拟业务异常
        if (id < 0) {
            throw new RuntimeException("---- Circuit Breaker: id 不能为负数 ----");
        }
        // 模拟请求超时
        if (id == 9999) {
            try {
                TimeUnit.SECONDS.sleep(5);
            } catch (InterruptedException e) {
                // ...
            }
        }
        // 正常返回
        return "Hello, circuit! inputId: " + id + " \t " + IdUtil.simpleUUID();
    }
}
```

### **3. 服务调用方 (Consumer)**

在 Feign 客户端的调用方法上，我们使用`@CircuitBreaker`注解来启用熔断功能。

**Feign 接口定义:**

```java
// PayFeignApi.java
@FeignClient(value = "cloud-payment-service")
public interface PayFeignApi {
    @GetMapping(value = "/pay/circuit/{id}")
    String myCircuit(@PathVariable("id") Integer id);
}
```

**Controller 层调用与降级处理:**

```java
// OrderCircuitController.java
@RestController
public class OrderCircuitController {
    @Resource
    private PayFeignApi payFeignApi;

    @GetMapping(value = "/feign/pay/circuit/{id}")
    @CircuitBreaker(name = "cloud-payment-service", fallbackMethod = "myCircuitFallback")
    public String myCircuitBreaker(@PathVariable("id") Integer id) {
        return payFeignApi.myCircuit(id);
    }

    // 降级方法 (Fallback)
    // 方法签名必须与原方法保持一致，但可以在最后追加一个 Throwable 类型的参数来接收异常信息。
    public String myCircuitFallback(Integer id, Throwable t) {
        // 你可以在这里记录日志，t.getMessage() 会包含原始异常信息
        // log.error("Circuit Breaker fallback triggered for id: {}, error: {}", id, t.getMessage());
        return "myCircuitFallback: 系统繁忙或服务暂时不可用，请稍后再试。/(ㄒoㄒ)/~~";
    }
}
```

## **四、 熔断测试与状态验证**

现在，我们通过逐步测试来观察熔断器的状态转换。

**测试场景:** 根据我们的配置 (`slidingWindowSize: 6`, `failureRateThreshold: 50%`)，在最近的 6 次调用中，只要有 3 次失败，熔断器就会开启。

**Step 1: 正常调用 (状态: `CLOSED`)**

- 访问 `http://localhost:9988/feign/pay/circuit/1`，`.../2`，`.../3`
- **结果**：所有请求均正常返回，如 `"Hello, circuit! inputId: 1 ..."`。
- **熔断器状态**：`CLOSED`。

**Step 2: 触发熔断 (状态: `CLOSED` -\> `OPEN`)**

- 连续 3 次或以上访问 `http://localhost:9988/feign/pay/circuit/-1`。
- **结果**：
  - 前几次请求，你会看到服务端的 `RuntimeException` 错误栈（如果全局异常处理器没有捕获）。
  - 当失败次数达到阈值（本例中为 3 次失败 / 6 次总调用），熔断器“跳闸”。
  - 此时再次访问，无论是 `.../circuit/-1` 还是正常的 `.../circuit/1`，都会**立即**返回降级信息：`"myCircuitFallback: 系统繁忙..."`。
- **熔断器状态**：从 `CLOSED` 切换到 `OPEN`。

**Step 3: 熔断期间 (状态: `OPEN`)**

- 在熔断器开启后的 5 秒内，持续访问 `http://localhost:9988/feign/pay/circuit/1`。
- **结果**：每次调用都**不会**请求下游服务，而是毫秒级地返回降级响应。这完美地实现了故障隔离和快速失败。
- **熔断器状态**：`OPEN`。

```mermaid
flowchart LR
    A["CLOSED<br/>(正常状态)"] -->|"失败率 > 50%"| B["OPEN<br/>(熔断状态)"]
    B -->|调用| C{"执行降级逻辑"}

    style A fill:#90EE90,stroke:#333,stroke-width:2px
    style B fill:#FFB6C1,stroke:#333,stroke-width:2px
    style C fill:#FFA07A,stroke:#333,stroke-width:2px
```

**Step 4: 自动恢复探测 (状态: `OPEN` -\> `HALF_OPEN`)**

- 等待超过 `waitDurationInOpenState`（我们配置的 5 秒）。
- **结果**：熔断器自动进入`HALF_OPEN`状态，准备放行探针请求。
- **熔断器状态**：从 `OPEN` 切换到 `HALF_OPEN`。

**Step 5: 恢复验证 (状态: `HALF_OPEN` -\> `CLOSED` 或 `OPEN`)**

- 在进入`HALF_OPEN`状态后，我们有 2 次（`permittedNumberOfCallsInHalfOpenState`）探测机会。
  - **场景一：恢复成功**
    - 访问 `http://localhost:9988/feign/pay/circuit/1`。
    - **结果**：该请求被放行，并成功调用下游服务，返回 `"Hello, circuit!..."`。
    - **熔断器状态**：探测成功，熔断器立即从 `HALF_OPEN` 切换回 `CLOSED`。后续所有请求恢复正常。
  - **场景二：恢复失败**
    - 访问 `http://localhost:9988/feign/pay/circuit/-1`。
    - **结果**：该探针请求依然失败，直接返回降级响应 `"myCircuitFallback:..."`。
    - **熔断器状态**：探测失败，熔断器立即从 `HALF_OPEN` 切换回 `OPEN`，并重新开始 5 秒的等待计时。

```mermaid
flowchart LR
    A["OPEN<br/>(熔断状态)"] -->|"等待5秒"| B["HALF_OPEN<br/>(半开探测)"]
    B -->|"探针请求成功"| C["CLOSED<br/>(恢复正常)"]
    B -->|"探针请求失败"| A

    style A fill:#FFB6C1,stroke:#333,stroke-width:2px
    style B fill:#FFD700,stroke:#333,stroke-width:2px
    style C fill:#90EE90,stroke:#333,stroke-width:2px
```

### **五、 滑动窗口策略**

在微服务架构中，熔断器是保障服务韧性的核心组件。它通过监控对下游服务的调用情况，在服务出现故障时快速失败（Fail-Fast），防止故障的连锁扩散。而这一切决策的核心依据，便是滑动窗口策略。滑动窗口负责收集和统计最近一段时间的请求数据，为熔断器的状态转换（CLOSED, OPEN, HALF-OPEN）提供决策依据。

熔断器的实现可以基于不同的滑动窗口策略，主要有以下两种：

- **COUNT-BASED (基于计数的滑动窗口)**：通过统计最近 N 次请求的成功和失败次数来判断是否触发熔断。
- **TIME-BASED (基于时间的滑动窗口)**：通过设定一个时间窗口，在窗口时间内统计请求的成功和失败情况。

下面，我们来深入剖析这两种策略的内部机制、优缺点以及在现代框架中的应用。

### **1. COUNT-BASED (基于计数的滑动窗口)**

这是最简单直观的一种实现方式。

#### **工作机制**

它在内存中维护一个固定大小的“环形数组”（Ring Buffer）或队列，长度为 N。每当一个新的请求发生（无论成功、失败或超时），它都会被记录下来并放入这个数组。如果数组已满，最老的一条记录将被挤出。

熔断器的决策逻辑（例如，计算失败率）始终基于这最近的 N 次请求。

为了更直观地展示这个过程，可以参考下面的序列图：

```mermaid
sequenceDiagram
    participant Client
    participant CB as "熔断器 (滑动窗口 N=5)"
    loop 最近 N 次调用
        Client->>+CB: 发起请求1 (成功)
        Client->>+CB: 发起请求2 (成功)
        Client->>+CB: 发起请求3 (失败)
        Client->>+CB: 发起请求4 (成功)
        Client->>+CB: 发起请求5 (成功)
    end
    Note right of CB: 窗口已满<br/>[S, S, F, S, S]<br/>失败率: 20%
    Client->>+CB: 发起请求6 (失败)
    Note right of CB: 挤出最老的记录: 请求1(S)<br/>窗口更新为<br/>[S, F, S, S, F]<br/>失败率: 40%
    Client->>+CB: 发起请求7 (失败)
    Note right of CB: 挤出最老的记录: 请求2(S)<br/>窗口更新为<br/>[F, S, S, F, F]<br/>失败率: 60% > 阈值(50%)<br/>熔断器打开!
```

#### **举例说明：**

假设我们配置 `sliding-window-type: count` 并且 `sliding-window-size: 100`。
这意味着熔断器会持续监控最近的 100 次调用。当第 101 次调用发生时，它会替换掉第 1 次调用的记录。熔断决策（如失败率是否超过 50%）将基于这 100 个样本进行计算。

#### **优点**

- **实现简单**：逻辑清晰，内存占用固定且可预测。
- **资源消耗低**：不需要额外的时间线程来管理窗口的滑动。

#### **缺点**

- **无法应对流量毛刺（Bursty Traffic）问题**：这是其最致命的缺陷。如果一个服务在很长一段时间内没有被调用，窗口中可能充满了很久以前的“成功”记录。此时，即使连续出现几次失败的调用，也可能因为被大量旧的成功记录“稀释”，导致失败率无法达到阈值，熔断器不会及时打开。
- **时间敏感性差**：它只关心“次数”，不关心这些次数发生在多长的时间内。例如，1 分钟内发生 100 次调用和 1 天内发生 100 次调用，对于 COUNT-BASED 窗口来说是等价的，但这在现实场景中显然代表了完全不同的负载情况。

#### **适用场景**

由于其明显的缺点，纯粹的 COUNT-BASED 滑动窗口在现代复杂的微服务环境中已非常罕见。它可能仅适用于那些调用频率非常稳定、可预测且对时间不敏感的特殊场景。

### **2. TIME-BASED (基于时间的滑动窗口)**

这是目前业界主流且推荐的策略，被 Resilience4j 等现代熔断器库作为默认实现。

#### **工作机制**

TIME-BASED 窗口不再关注固定数量的请求，而是关注一个固定的时间周期（例如，最近的 60 秒）。为了平滑地滑动并高效计算，它通常会把整个时间窗口分割成多个更小的“桶”（Bucket）。

下面的甘特图清晰地展示了分桶和窗口滑动的机制：

```mermaid
flowchart TD
    subgraph "时间窗口示例 (60秒窗口, 6个桶)"
        A["Bucket1 (0-10s)"] --> B["Bucket2 (10-20s)"]
        B --> C["Bucket3 (20-30s)"]
        C --> D["Bucket4 (30-40s)"]
        D --> E["Bucket5 (40-50s)"]
        E --> F["Bucket6 (50-60s)"]
    end

    subgraph "窗口滑动过程"
        G["T=61s: Bucket1过期"] --> H["创建Bucket7 (60-70s)"]
        H --> I["新窗口: Bucket2-7"]
    end

    subgraph "数据聚合"
        J["聚合所有活动桶的数据"]
        J --> K["计算失败率和慢调用率"]
    end

    style A fill:#87CEEB,stroke:#333,stroke-width:2px
    style F fill:#FFB6C1,stroke:#333,stroke-width:2px
    style H fill:#90EE90,stroke:#333,stroke-width:2px
```

#### **举例说明（Resilience4j 的实现方式）：**

假设我们配置 `sliding-window-type: time`，`sliding-window-size: 60` (秒)，并且内部默认或配置了 10 个桶。

- **分桶 (Bucketing)**：整个 60 秒的时间窗口被划分为 10 个桶，每个桶负责记录 6 秒内的调用数据（成功数、失败数、慢调用数等）。
- **数据记录**：当请求发生时，其结果会被记录在当前时间所在的桶内。例如，在第 13 秒发生的调用，其结果会记录在第 3 个桶里（12s-18s）。
- **窗口滑动**：时间是向前流逝的。当第 61 秒到来时，第一个桶（0s-6s）的数据就会过期，被丢弃。同时一个新的桶被创建出来，用于记录 60s-66s 的数据。这样，整个窗口就向前“滑动”了。
- **指标聚合**：在任何时刻，熔断器需要决策时，它会聚合当前所有有效桶（在此例中是 10 个桶）的数据，计算出在整个时间窗口（60 秒）内的总请求数、失败率、慢调用率等核心指标。

#### **优点**

- **时间敏感，更符合直觉**：它统计的是“最近一段时间内”的系统健康状况，完美解决了 COUNT-BASED 的流量毛刺问题。无论流量如何波动，它始终能反映出最近一个时间周期内的真实表现。
- **数据更平滑**：通过分桶机制，避免了在窗口边界发生数据突变的问题，统计结果更加平滑和准确。
- **灵活性高**：可以配置窗口大小和桶的数量，以适应不同服务的特性。

#### **缺点**

- **实现相对复杂**：需要管理桶的创建、过期和数据聚合。
- **内存占用稍高**：需要为多个桶分配内存来存储统计数据。但在大多数应用中，这点开销是完全可以接受的，并且对于保障系统稳定性来说是值得的。

### **总结与最佳实践：现代熔断器的混合模型**

在 Spring Cloud 生态中，我们现在主要使用 Resilience4j。值得注意的是，Resilience4j 的配置虽然区分了 `time-based` 和 `count-based`，但其决策过程通常是一个混合模型。

**即便是选择了 time-based 窗口，我们依然会配置一个基于计数的阈值，这才是最完善的实践。**

来看一个典型的 Resilience4j 配置：

```yaml
resilience4j:
  circuitbreaker:
    instances:
      myApiService:
        # 1. 选择基于时间的滑动窗口
        sliding-window-type: time-based
        # 2. 设置时间窗口大小为60秒
        sliding-window-size: 60
        # 3. 核心！设置窗口内触发计算的最小调用次数
        minimum-number-of-calls: 20
        # 4. 设置失败率阈值
        failure-rate-threshold: 50
        # 5. 设置慢调用率阈值
        slow-call-rate-threshold: 80
        # 6. 定义慢调用的耗时
        slow-call-duration-threshold: 5000 # 5秒
```

#### **解读这段配置：**

熔断器首先采用一个 60 秒的时间窗口来收集数据 (`time-based`)。

但是，它并不会在只有一两次调用的情况下就草率地计算失败率。`minimum-number-of-calls: 20` 这个计数阈值规定了：**只有当 60 秒窗口内的总调用次数达到 20 次时**，熔断器才会开始计算失败率。

一旦调用次数超过 20 次，熔断器就会检查失败率是否超过了 50%。如果超过，则熔断器打开。

这种 **“时间窗口 + 最小请求数阈值”** 的混合模型，其决策流程可以可视化为：

```mermaid
flowchart TD
    A["请求结果被记录到时间窗口"] --> B{"窗口内总调用次数 <br/> >= minimum-number-of-calls?"}
    B -->|"否 (样本不足)"| C["不计算, 熔断器保持当前状态"]
    B -->|"是 (样本充足)"| D{"计算总失败率和慢调用率"}
    D --> E{"失败率 > failure-rate-threshold? <br/> OR <br/> 慢调用率 > slow-call-rate-threshold?"}
    E -->|"是"| F["打开熔断器 (OPEN)"]
    E -->|"否"| G["保持/切换至关闭状态 (CLOSED)"]

    style F fill:#FFB6C1,stroke:#333,stroke-width:2px
    style G fill:#90EE90,stroke:#333,stroke-width:2px
```

该模型结合了两者的优点：

- **确保了统计的及时性（基于时间）**。
- **避免了因样本量过小而导致的误判（基于计数）**。例如，如果窗口内只有 2 次调用，其中 1 次失败，失败率高达 50%，但这种情况下熔断显然是不合理的。

1.  **首选并默认使用 `TIME-BASED` 滑动窗口**，因为它能更准确地反映服务在“最近”一段时间的健康状况。
2.  **务必配置 `minimum-number-of-calls`**，为熔断决策提供一个有统计意义的最小样本量，防止在低流量时发生误判。
3.  根据服务的 QPS、重要性和网络状况，仔细调优 `sliding-window-size`, `failure-rate-threshold` 和 `slow-call-rate-threshold` 等参数，以达到最佳的保护效果。
4.  纯粹的 `COUNT-BASED` 策略在理论上存在，但在追求高可用的现代分布式系统中，已经基本被功能更强大、表现更稳健的 **TIME-BASED 混合模型**所取代。
