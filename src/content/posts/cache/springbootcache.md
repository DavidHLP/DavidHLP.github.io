---
title: Spring Boot 启动 进行缓存数据预热
published: 2025-07-10
description: 本文介绍了在 Spring Boot 应用启动时预热缓存数据的两种主要方法：主动加载和懒加载。主动加载技术包括使用 `CommandLineRunner`、`ApplicationRunner` 接口以及 `@PostConstruct` 注解，可以在应用启动阶段直接将数据加载到缓存中。懒加载则通过 `@Cacheable` 注解，在首次方法调用时触发缓存写入。这些策略有助于提高应用的初始响应速度和性能。
tags: [Spring Boot, Java, cache]
category: Spring Boot
draft: false
---

# 主动加载

## 1. 使用 CommandLineRunner 或 ApplicationRunner 接口

- CommandLineRunner

```java
@Component
public class CacheLoader implements CommandLineRunner {

    //注入相关 bean

    @Override
    public void run(String args) {
        // TODO 预热或存入数据
    }
}
```

```java
@Component
public class CacheLoader implements ApplicationRunner {

    //注入相关 bean

    @Override
    public void run(String args) {
        // TODO 预热或存入数据
    }
}
```

## 2. 使用 @Postconstruct 注解

```java
@Service
public class CacheService {

    // 注入相关 bean

    @PostConstruct
    public void init() {
        // TODO 预热或存入数据
    }
}

```

# 懒加载

## 使用 @Cacheable 注解

> [!NOTE]
> 通过 @cacheable 在首次调用方法时触发缓存写入，但需手动触发首次调用才能完成预加载。

```java
@Service
public class CacheService {

    // 注入相关 bean

    @Cacheable(value = "users", key = "#id", unless = "#result == null", condition = "#useCache == true")
    public User findUserById(Long id, boolean useCache) {
        return userRepository.findById(id).orElse(null);
    }
}
```
