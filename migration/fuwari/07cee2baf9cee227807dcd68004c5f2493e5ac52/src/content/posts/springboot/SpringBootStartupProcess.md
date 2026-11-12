---
title: Spring Boot 的 启动流程
published: 2025-07-09
description: Spring Boot 的 启动流程
tags: [Spring Boot, 面试]
category: 面试
draft: false
---

# Spring Boot 的 启动流程

1. 从 main 方法启动，调用 SpringApplication.run()方法
2. 先会创建 SpringApplication 对象，创建的时候会推断应用类型(判断是 servlet 应用，还是 reactive 应用，或者不是 web 应用)，设置启动监听器
3. 创建完 SpringAplitcation 之后，调用该对象的 run 方法，通过 ConfiqurableEnvironment 准备环境，这一步会读取配置文件，例如 aplication.preperties
4. 创建应用上下文，这一步会加载所有配置类和自动配置类
5. 刷新应用上下文，这一步会进行 bean 的创建和初始化，包括开发者自定义的 bean 以及自动注入的 bean
6. 对于 web 应用，刷新应用上下文的最后，会自动启动嵌入式 web 服务器
7. 服务器启动完成会发送应用己启动的事件
8. 接着调用实现了 CommandLineRunner 或者 ApplicationRunner 接囗的 bean，执行一些初始化逻辑
9. 发送 ApplicationReadyEvent，应用启动完成
