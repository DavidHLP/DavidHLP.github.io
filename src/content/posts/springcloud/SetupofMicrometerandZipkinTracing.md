---
title: Micrometer Tracing 与 Zipkin 分布式链路追踪实战指南
published: 2025-07-15
tags: [SpringCloud, Micrometer, Zipkin, 分布式追踪, Docker, 链路追踪, 可观测性]
category: SpringCloud
description: 详细介绍如何使用Docker Compose部署Zipkin服务，并配置Spring Boot项目集成Micrometer Tracing实现分布式链路追踪。包含完整的Maven依赖配置、Docker网络设置和采样率优化等最佳实践
draft: false
---

## Zipkin 安装与配置指南

本指南将帮助您使用 Docker Compose 安装 Zipkin，并配置 Micrometer Tracing 以将跟踪数据发送到 Zipkin。

### 1\. 准备 Zipkin 安装

使用 Docker Compose 可以方便地部署 Zipkin 服务。

#### Docker Compose 配置 (`docker-compose.yml`)

创建一个名为 `docker-compose.yml` 的文件，内容如下：

```yml
services:
  # Zipkin 服务定义
  zipkin:
    image: openzipkin/zipkin:latest # 推荐使用 :latest 获取最新稳定版，或者指定具体版本如 openzipkin/zipkin:2.23.1
    container_name: zipkin
    restart: unless-stopped # 容器异常退出或 Docker 重启时自动重启
    ports:
      - "9411:9411" # 将容器的 9411 端口映射到宿主机的 9411 端口，方便外部访问 UI
    networks:
      spring-cloud-networks:
        # 为 Zipkin 服务分配一个固定 IP 地址，便于服务发现和配置
        ipv4_address: 10.25.0.10

networks:
  spring-cloud-networks:
    name: spring-cloud-networks # 定义一个自定义网络，所有微服务都将加入此网络
    driver: bridge # 使用桥接模式
    ipam:
      driver: default
      config:
        - subnet: 10.25.0.0/24 # 定义子网，这是分配静态 IP 的前提
```

**说明：**

- **`image: openzipkin/zipkin:latest`**: 使用官方 Zipkin Docker 镜像。建议指定一个具体的版本号，例如 `openzipkin/zipkin:2.23.1`，以确保环境的稳定性。
- **`ports: - "9411:9411"`**: 将容器内部的 Zipkin UI 端口（9411）映射到宿主机的 9411 端口。这样您就可以通过 `http://localhost:9411`（或 `http://宿主机IP:9411`）访问 Zipkin UI。
- **`networks`**: 定义了一个名为 `spring-cloud-networks` 的自定义 Docker 网络。建议将所有相关的微服务都添加到这个网络中，以便它们可以通过内部 IP 地址相互通信。
- **`ipv4_address: 10.25.0.10`**: 为 Zipkin 容器分配一个固定的 IP 地址。这对于服务配置（特别是 `application.yml` 中的 `endpoint`）非常有用，因为它可以避免因容器重启导致 IP 地址变化。

#### 启动 Zipkin

在包含 `docker-compose.yml` 文件的目录下，执行以下命令来启动 Zipkin 服务：

```bash
docker-compose up -d
```

- `up`: 创建并启动服务。
- `-d`: 后台运行容器（detached mode）。

成功启动后，您可以通过浏览器访问 `http://10.25.0.10:9411` 来查看 Zipkin UI。

### 2\. 准备 Micrometer Tracing 配置

Micrometer Tracing 是 Spring Boot 3.x 推荐的分布式跟踪解决方案，它与 Zipkin 等跟踪系统集成。

#### Maven 依赖

在您的 Spring Boot 项目的 `pom.xml` 文件中，添加以下 Maven 依赖。确保版本号与您的 Spring Boot 版本兼容。

```xml
<properties>
    <micrometer-tracing.version>1.2.0</micrometer-tracing.version>
    <micrometer-observation.version>1.12.0</micrometer-observation.version>
    <feign-micrometer.version>12.5</feign-micrometer.version>
    <zipkin-reporter-brave.version>2.17.0</zipkin-reporter-brave.version>
    <spring-boot.version>3.2.0</spring-boot.version> </properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing-bridge-brave</artifactId>
        </dependency>
    <dependency>
        <groupId>io.zipkin.reporter2</groupId>
        <artifactId>zipkin-reporter-brave</artifactId>
        <version>${zipkin-reporter-brave.version}</version>
    </dependency>
    <dependency>
        <groupId>io.github.openfeign</groupId>
        <artifactId>feign-micrometer</artifactId>
        <version>${feign-micrometer.version}</version>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-observation</artifactId>
        <version>${micrometer-observation.version}</version>
    </dependency>
    </dependencies>
</properties>
```

**说明：**

- **`spring-boot-starter-web`**: 引入 Spring Web 功能。
- **`spring-boot-starter-actuator`**: 提供生产就绪特性，如健康检查、度量指标和跟踪端点。这是 Micrometer Tracing 自动配置的基础。
- **`micrometer-tracing-bom`**: 推荐使用 BOM（Bill Of Materials）来统一管理 Micrometer Tracing 相关的依赖版本，避免版本冲突。
- **`micrometer-tracing-bridge-brave`**: 这是 Micrometer Tracing 与 Brave（Zipkin 客户端库）之间的桥接，负责将跟踪数据转换为 Zipkin 格式。
- **`zipkin-reporter-brave`**: 实际负责将转换后的 Zipkin 格式数据通过 HTTP 发送到 Zipkin 服务器。
- **`feign-micrometer`**: 如果您的项目使用 OpenFeign 进行服务间调用，添加此依赖可以确保 Feign 客户端的请求也能被跟踪。
- **`micrometer-observation`**: Micrometer Tracing 是基于 Micrometer Observation 构建的。如果您需要更细粒度的控制或自定义可观测性，这个依赖会很有用。

#### Micrometer Tracing 配置文件 (`application.yml`)

在您的 Spring Boot 项目的 `application.yml` 或 `application.properties` 文件中，添加以下配置：

```yml
management:
  zipkin:
    tracing:
      # Zipkin 服务器的 HTTP 收集器端点。使用 Docker Compose 中 Zipkin 容器的固定 IP 和端口。
      endpoint: http://10.25.0.10:9411/api/v2/spans
  tracing:
    sampling:
      # 采样率。1.0 表示收集所有跟踪，0.1 表示收集 10% 的跟踪。
      probability: 1.0
    # service-name: my-application # 可以为您的服务配置一个名称，方便在 Zipkin UI 中识别
```

**说明：**

- **`management.zipkin.tracing.endpoint`**: 这是最关键的配置。它指定了 Micrometer Tracing 将跟踪数据发送到哪个 Zipkin 服务器端点。请确保这里的 IP 地址（`10.25.0.10`）与您在 `docker-compose.yml` 中为 Zipkin 容器分配的 `ipv4_address` 保持一致，并且端口是 Zipkin 的收集器端口（默认为 9411），路径是 `/api/v2/spans`。
- **`management.tracing.sampling.probability`**: 配置跟踪的采样率。
  - **`1.0`**: 表示所有请求都会被跟踪并发送到 Zipkin。这在开发和测试环境中非常有用，可以确保所有操作都被记录。
  - **`0.1`**: 表示只有 10% 的请求会被随机抽样并跟踪。在生产环境中，为了减少性能开销和数据量，通常会使用一个小于 1.0 的值。
- **`management.tracing.service-name`**: （可选）为您的服务设置一个唯一的名称。这个名称将在 Zipkin UI 中显示，帮助您识别不同的服务。
