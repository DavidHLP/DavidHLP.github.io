---
{
  "archiveId": "X-1327",
  "translationKey": "legacy/note/spring-boot-auto-configuration",
  "title": "Spring Boot 自动装配与启动顺序：Imports、条件注解与显式排除",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "基于 Spring Boot 自动装配与启动流程笔记，梳理 @EnableAutoConfiguration、2.7+ AutoConfiguration.imports 与 2.x spring.factories 的演进、@Conditional 条件评估、装配顺序注解及三种显式排除边界。",
  "findings": [
    "原始证据: src/content/raw/zh-cn/ingest-spring-cloud.md",
    "证据状态: 暂定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "SpringBoot",
    "AutoConfiguration",
    "Spring",
    "Startup",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
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

Spring Boot 的“约定大于配置”并非黑盒魔法，而是一条由主启动注解触发、从类路径清单加载候选配置、再通过条件注解与顺序规则裁剪的装配流水线。若版本迁越 Boot 2.x 到 3.x 时仍沿用旧清单文件或忽略排除属性，自动装配就会静默失效或发生 Bean 冲突。

本页承接 [Spring Boot 与 Spring Cloud：自动装配、事务、注册发现、网关与可观测性](/blog/legacy/note/zh-cn/spring-cloud-and-boot/) 中 `SpringBootAuto-configuration.md` 与 `SpringBootStartupProcess.md` 的细则。

## 核心机制

### 1. `@EnableAutoConfiguration` 与候选清单演进

`@SpringBootApplication` 内部复合了 `@EnableAutoConfiguration`，后者通过 `@Import({AutoConfigurationImportSelector.class})` 加载自动配置候选类，同时 `@AutoConfigurationPackage` 扫描主应用类所在包及子包。候选列表发现路径随版本存在明确代际边界：

| 版本区间 | 候选清单路径 | 备注 |
| --- | --- | --- |
| Spring Boot 2.x 及更早 | `META-INF/spring.factories`（键为 `org.springframework.boot.autoconfigure.EnableAutoConfiguration`） | 仅适用于旧版或兼容过渡 |
| Spring Boot 2.7+ / 3.x | `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 每行一个全限定类名；Boot 3.x 已废弃旧 `spring.factories` 自动配置发现 |

### 2. 条件注解裁剪与加载顺序控制

加载候选并不等于全部实例化。`AutoConfigurationImportSelector` 借助 `@Conditional` 系列注解决定是否激活：

- `@ConditionalOnClass`：classpath 存在目标类时才生效（如 `DataSource.class`）。
- `@ConditionalOnMissingBean`：容器尚无自定义同类型 Bean 时提供默认实现（避免覆盖业务配置）。
- `@ConditionalOnProperty`：指定配置属性存在且匹配预期值时启用。
- `@ConditionalOnWebApplication` / `@ConditionalOnNotWebApplication`：区分 Web 与非 Web 环境。

当配置类之间存在依赖或覆盖次序时，使用 `@AutoConfigureBefore` 与 `@AutoConfigureAfter` 声明顺序（如 `@AutoConfigureBefore(DataSourceAutoConfiguration.class)`）。

### 3. 三种显式排除方式与启动挂载时机

在不需要某默认自动配置（例如排除 `DataSourceAutoConfiguration`）时，可按作用域选用：

```yaml
# 方式 1：配置文件排除（最常用）
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

- 方式 2：主启动类 `@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})`；
- 方式 3：自定义配置类 `@EnableAutoConfiguration(exclude = ...)` 或 `excludeName`。

结合 `SpringApplication.run()` 启动时序：创建 `SpringApplication` 推断应用类型（Servlet / Reactive / 非 Web）并加载监听器 -> `ConfigurableEnvironment` 读取配置 -> 创建并刷新 `ApplicationContext`（在此阶段加载配置类、自动配置类与 Bean 初始化） -> 启动嵌入式 Web 容器 -> 触发 `CommandLineRunner` / `ApplicationRunner` -> 发送 `ApplicationReadyEvent`。

## 适用边界与未验证内容

- **适用**：Spring Boot starter 开发、Bean 冲突定位与 2.x 到 3.x 升级核查。
- **不适用**：不能仅凭自动配置清单推导运行时最终激活 Bean，因实际生效仍受业务 classpath、`@Conditional` 评估与配置属性覆盖共同决定。
- **未验证边界（来自 raw 既有限制）**：
  - 原文版本跨度涵盖 2.x 至 3.x 描述，**未绑定单一固定 BOM / JDK 版本实机跑出 Condition Evaluation Report**；
  - 新版 `@AutoConfiguration` 注解与更细粒度 Condition 变体未在固定构建中逐项核对。

## 毕业检查

1. 在固定 Spring Boot 3.x BOM 与 JDK 版本工程中开启 `--debug`，核对 `CONDITIONS EVALUATION REPORT` 中候选类的命中与排除原因。
2. 编写一个自定义 starter，使用 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 注册并验证 `@ConditionalOnMissingBean` 被业务 Bean 覆盖时的行为。
3. 验证 `spring.autoconfigure.exclude` 与 `@SpringBootApplication(exclude = ...)` 在测试上下文中的一致性。

## 相关页面

- [Spring Boot 与 Spring Cloud：自动装配、事务、注册发现、网关与可观测性](/blog/legacy/note/zh-cn/spring-cloud-and-boot/)
- [ingest-spring-cloud（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md)
