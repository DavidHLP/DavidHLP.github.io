---
{
  "archiveId": "X-1328",
  "translationKey": "legacy/note/spring-boot-auto-configuration",
  "title": "Spring Boot Auto-Configuration and Startup Sequence: Imports, Conditionals, and Exclusions",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Summarizes Spring Boot auto-configuration and startup notes covering @EnableAutoConfiguration, the transition from 2.x spring.factories to 2.7+/3.x AutoConfiguration.imports, @Conditional filtering, ordering annotations, and explicit exclusion mechanisms.",
  "findings": [
    "Raw source: src/content/raw/zh-cn/ingest-spring-cloud.md",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "SpringBoot",
    "AutoConfiguration",
    "Spring",
    "Startup",
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

Spring Boot's "convention over configuration" is not hidden magic; it is an assembly pipeline triggered by the root annotation, discovering candidates from classpath descriptors, and filtering them through condition and ordering annotations. Upgrading across Boot 2.x and 3.x without updating discovery descriptors or exclusion config leads to silent non-loading or bean conflicts.

This page extracts `SpringBootAuto-configuration.md` and `SpringBootStartupProcess.md` details from [Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability](/blog/legacy/note/en/spring-cloud-and-boot/).

## Core Mechanisms

### 1. `@EnableAutoConfiguration` and descriptor evolution

`@SpringBootApplication` embeds `@EnableAutoConfiguration`, which imports `AutoConfigurationImportSelector` to load candidate configurations while `@AutoConfigurationPackage` registers the main package and subpackages. Candidate discovery changed across major versions:

| Version range | Candidate descriptor path | Notes |
| --- | --- | --- |
| Spring Boot 2.x and earlier | `META-INF/spring.factories` (key `org.springframework.boot.autoconfigure.EnableAutoConfiguration`) | Legacy discovery path |
| Spring Boot 2.7+ / 3.x | `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | One fully qualified class name per line; Boot 3.x drops `spring.factories` auto-config discovery |

### 2. Conditional filtering and ordering

Listed candidates are activated selectively by `@Conditional` annotations inside `AutoConfigurationImportSelector`:

- `@ConditionalOnClass`: activates only when required classes exist on the classpath (e.g., `DataSource.class`).
- `@ConditionalOnMissingBean`: supplies default beans only when user beans of that type are absent.
- `@ConditionalOnProperty`: enables configuration when properties match expected values.
- `@ConditionalOnWebApplication` / `@ConditionalOnNotWebApplication`: distinguishes web and non-web runtimes.

Ordering between configuration classes uses `@AutoConfigureBefore` and `@AutoConfigureAfter` (e.g., `@AutoConfigureBefore(DataSourceAutoConfiguration.class)`).

### 3. Three explicit exclusion paths and startup timing

When suppressing a default auto-configuration (such as `DataSourceAutoConfiguration`), choose the matching mechanism:

```yaml
# Option 1: property configuration (most common)
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

- Option 2: `@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})` on the main class;
- Option 3: `@EnableAutoConfiguration(exclude = ...)` or `excludeName` on a custom configuration class.

Inside `SpringApplication.run()`: construct `SpringApplication` and infer web type (Servlet / Reactive / non-web) -> load `ConfigurableEnvironment` properties -> create and refresh `ApplicationContext` (loading configuration classes, auto-configurations, and initializing beans) -> start embedded web server -> invoke `CommandLineRunner` / `ApplicationRunner` -> emit `ApplicationReadyEvent`.

## Applicability and Unverified Boundaries

- **Applicable**: authoring Boot starters, diagnosing bean collisions, and auditing 2.x-to-3.x migrations.
- **Not applicable**: a descriptor entry alone cannot confirm active runtime beans without evaluating actual classpath contents, `@Conditional` outcomes, and environment properties.
- **Unverified boundaries preserved from raw sources**:
  - the source spans 2.x and 3.x notes without a **single pinned BOM/JDK Conditions Evaluation Report run**;
  - newer `@AutoConfiguration` options and finer condition variants were not verified against a pinned live build.

## Graduation Checks

1. Run `--debug` on a pinned Spring Boot 3.x BOM and JDK build to capture the live `CONDITIONS EVALUATION REPORT` showing positive matches and exclusions.
2. Package a custom starter using `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` and verify `@ConditionalOnMissingBean` yields to a user-defined bean.
3. Verify consistent exclusion behavior across `spring.autoconfigure.exclude` and `@SpringBootApplication(exclude = ...)` in integration test slices.

## Related Pages

- [Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability](/blog/legacy/note/en/spring-cloud-and-boot/)
- [ingest-spring-cloud (raw source)](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md)
