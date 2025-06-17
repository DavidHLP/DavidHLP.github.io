---
title: BulkHead 舱壁模式详解
published: 2025-06-17
tags: [SpringCloud, Resilience4j]
category: SpringCloud
description: 详解BulkHead舱壁模式如何通过线程池和信号量隔离实现系统保护，防止故障扩散，并结合Resilience4j框架的SpringCloud微服务实战案例
draft: false
---

# **BulkHead 舱壁模式详解**

## **什么是 BulkHead 舱壁模式？**

BulkHead（舱壁模式）是一种重要的系统保护机制，主要用于**防止单个组件或服务的故障扩散到整个系统**，从而提高系统的稳定性和可靠性。通过**限制并发执行**的数量，BulkHead 模式可以有效防止系统过载。

## **BulkHead 的实现方式**

### 1. **线程池隔离**

- **工作原理**：为每个服务或组件分配独立的线程池资源
- **优势**：
  - 防止单个服务过载影响整个系统
  - 即使某个服务超出其线程池容量，其他服务仍能正常工作
- **适用场景**：服务之间相对独立且并发量较高的微服务架构

### 2. **信号量隔离**

- **工作原理**：通过信号量限制并发请求数量
- **优势**：
  - 更精细的资源使用控制
  - 相比线程池隔离，资源开销更小
- **适用场景**：资源消耗较高或需要严格控制的场景（如数据库连接池、外部 API 调用）

## **代码实现示例**

### **项目结构**

项目包含以下三个主要模块：

1. consumer-order-feign：消费者服务
2. payment-cloud-8001：支付服务
3. cluod-api-commons：公共 API 模块

### **1. consumer-order-feign 模块**

#### **核心配置类**

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableDiscoveryClient // 该注解用于向使用 Consul 为注册中心时注册服务
@EnableFeignClients(basePackages = "com.cluod.commons.api")
@ComponentScan(basePackages = {"com.cluod.feign.controller", "com.cluod.commons.exp"})
public class SpringApplication9988 {
    public static void main(String[] args) {
        SpringApplication.run(SpringApplication9988.class, args);
    }
}
```

#### **控制器实现**

```java
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import jakarta.annotation.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * @Title: OrderCircuitController
 * @Author David
 * @Package com.cluod.feign.controller
 * @Date 2024/7/17 下午4:14
 * @description: 熔断
 */
@RestController
public class OrderCircuitController {
    @Resource
    private PayFeignApi payFeignApi;

    /**
     * (船的)舱壁, 隔离
     *
     * @param id
     * @return
     */
    @GetMapping(value = "/feign/pay/bulkhead/{id}")
    @Bulkhead(name = "cloud-payment-service", fallbackMethod = "myBulkheadFallback", type = Bulkhead.Type.SEMAPHORE)
    public ResponseEntity<String> myBulkhead(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(payFeignApi.myBulkhead(id));
    }

    public ResponseEntity<String> myBulkheadFallback(Throwable t) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                             .body("myBulkheadFallback，隔板超出最大数量限制，系统繁忙，请稍后再试-----/(ㄒoㄒ)/~~");
    }
}
```

#### **配置文件**

```yaml
# application-dev.yml
resilience4j:
  bulkhead:
    configs:
      default:
        maxConcurrentCalls: 2 # 最大并发调用数
        maxWaitDuration: 1s # 最大等待时间
    instances:
      cloud-payment-service:
        baseConfig: default
  timelimiter:
    configs:
      default:
        timeout-duration: 20s # 请求超时时间
```

### **2. payment-cloud-8001 模块**

#### **控制器实现**

```java
import cn.hutool.core.util.IdUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * @Title: PayCircuitController
 * @Author David
 * @Package com.cluod.feign.controller
 * @Date 2024/7/15 下午3:41
 * @description: 熔断测试
 */
@RestController
public class PayCircuitController {
    //=========Resilience4j bulkhead 的例子
    @GetMapping(value = "/pay/bulkhead/{id}")
    public String myBulkhead(@PathVariable("id") Integer id) {
        if (id == -4) throw new RuntimeException("----bulkhead id 不能-4");

        if (id == 9999) {
            try {
                TimeUnit.SECONDS.sleep(5);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        return "Hello, bulkhead! inputId:  " + id + " \t " + IdUtil.simpleUUID();
    }
}
```

### **3. cluod-api-commons 模块**

#### **Feign 接口定义**

```java
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * @Title: PayFeignApi
 * @Author David
 * @Package com.cluod.commons.api
 * @Date 2024/7/12 下午2:17
 * @description: Pay的Feigen代理接口
 */
@FeignClient(value = "cloud-payment-service")
public interface PayFeignApi {
    /**
     * Resilience4j Bulkhead 的例子
     *
     * @param id
     * @return
     */
    @GetMapping(value = "/pay/bulkhead/{id}")
    public String myBulkhead(@PathVariable("id") Integer id);
}
```

## **测试结果分析**

使用 Apifox 进行并发测试：

- 测试场景：3 个线程并发请求
- 请求参数：
  - 第一个请求：id=9999（模拟阻塞请求）
  - 后续请求：id=3
- 测试结果：
  - 总请求数：9 次
  - 成功请求：6 次
  - 失败请求：3 次
  - 原因：由于设置了最大并发数为 2，第三个线程的请求被舱壁模式隔离

## **注意事项**

1. 合理设置 `maxConcurrentCalls` 和 `maxWaitDuration` 参数
2. 根据实际业务场景选择合适的隔离方式（线程池/信号量）
3. 确保服务降级策略（fallback）能够正确处理异常情况
4. 监控系统性能指标，及时调整配置参数
