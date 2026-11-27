---
{
  "archiveId": "X-1330",
  "translationKey": "legacy/note/spring-transaction-boundaries",
  "title": "Spring 事务边界与传播行为：AOP 代理、隔离级别与回滚规则",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "基于 SpringTransactions 原文笔记，梳理 PlatformTransactionManager / AOP + ThreadLocal 实现机制、四大隔离级别、七种传播行为（REQUIRED/REQUIRES_NEW/NESTED 等）、timeout/readOnly 生效边界与 RuntimeException/Checked Exception 回滚规则。",
  "findings": [
    "原始证据: src/content/raw/zh-cn/ingest-spring-cloud.md",
    "证据状态: 暂定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Spring",
    "SpringBoot",
    "Transaction",
    "AOP",
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

`@Transactional` 把连接绑定、提交和回滚从业务代码拆进代理切面，但也因此带来“加了注解却未按预期回滚或隔离”的隐蔽边界：异常类型、嵌套调用传播策略、`timeout`/`readOnly` 继承规则，以及是否真正经过代理对象调用，共同决定事务语义是否成立。

本页承接 [Spring Boot 与 Spring Cloud：自动装配、事务、注册发现、网关与可观测性](/blog/legacy/note/zh-cn/spring-cloud-and-boot/) 中 `SpringTransactions.md` 的细则。

## 核心机制

### 1. 核心接口与 AOP + `ThreadLocal` 模型

Spring 声明式事务围绕三个核心接口协作：

- **`PlatformTransactionManager`**：定义 `getTransaction`、`commit`、`rollback`，按底层实现装配（如 `DataSourceTransactionManager`）。
- **`TransactionDefinition`**：封装隔离级别、传播行为、`timeout`、`readOnly` 等元数据。
- **`TransactionStatus`**：描述当前事务是否新建、是否仅回滚等运行态。

运行时由 AOP 代理（默认 CGLIB）与 `TransactionInterceptor` 拦截外部调用：开启事务并把数据库连接与状态绑定到当前线程的 `ThreadLocal` -> 执行目标业务方法 -> 正常提交或按规则回滚 -> 清理 `ThreadLocal`。

### 2. 七种传播行为与关键边界

| 传播行为 | 存在外层事务时 | 不存在外层事务时 | 典型边界/注意点 |
| --- | --- | --- | --- |
| `PROPAGATION_REQUIRED`（默认） | 加入当前事务 | 新建事务 | 共用连接与回滚边界 |
| `PROPAGATION_SUPPORTS` | 加入当前事务 | 非事务执行 | 适配查询型方法 |
| `PROPAGATION_MANDATORY` | 加入当前事务 | 抛出异常 | 强制调用方已开启事务 |
| `PROPAGATION_REQUIRES_NEW` | 挂起外层，新建独立事务 | 新建事务 | 独立提交（日志/审计），与外层互不阻塞回滚 |
| `PROPAGATION_NOT_SUPPORTED` | 挂起外层，非事务执行 | 非事务执行 | 避免长查询持有事务锁 |
| `PROPAGATION_NEVER` | 抛出异常 | 非事务执行 | 严格禁止在事务上下文调用 |
| `PROPAGATION_NESTED` | 依赖 JDBC Savepoint 嵌套执行 | 新建事务 | 外层回滚连带内层；非所有数据库/管理器均支持 |

**属性生效边界**：`timeout`（单位秒）与 `readOnly=true` **仅对开启新事务的方法有效**（如 `REQUIRED` 新建或 `REQUIRES_NEW`）；若仅加入已有外层事务，方法自身的 `timeout`/`readOnly` 设置会被忽略并沿用外层设置。此外 `readOnly=true` 是性能优化提示而非强制只读锁（实际写入行为取决于底层数据库）。

### 3. 隔离级别与回滚规则

Spring 对接四种标准隔离级别（外加 `DEFAULT` 沿用数据库默认值）：`READ_UNCOMMITTED`、`READ_COMMITTED`、`REPEATABLE_READ`（可避免脏读与不可重复读，仍可能有幻读）与 `SERIALIZABLE`。

**默认回滚规则**：仅在遇到 `RuntimeException` 或 `Error` 时默认自动回滚；受检异常（Checked Exception）**默认不回滚**。需显式调整时使用：

```java
@Transactional(
    isolation = Isolation.REPEATABLE_READ,
    rollbackFor = IOException.class,
    noRollbackFor = InsufficientStockException.class
)
public void processOrder() {
    // 业务逻辑
}
```

## 适用边界与未验证内容

- **适用**：单库本地事务边界设计、`@Transactional` 传播与异常策略核对。
- **不适用**：跨服务/多数据源分布式事务（原文未成文）、内部自调用绕过代理场景的运行期实测替代。
- **未验证边界（来自 raw 既有限制）**：
  - 原料 `SpringTransactions.md` 说明了 `AOP + ThreadLocal`、`timeout`/`readOnly`、`rollbackFor`/`noRollbackFor` 与 JDBC Savepoint（`NESTED`），但**未在固定 MySQL/Spring Boot 版本下运行同事务异常隔离与代理自调用实验**；
  - 读写分离路由、`REQUIRES_NEW` 连接池耗尽风险及分布式事务方案未包含在实测范围内。

## 毕业检查

1. 在本地集成测试中验证 `REQUIRED`、`REQUIRES_NEW` 与 `NESTED`（Savepoint）在异常抛出后的外/内层数据库提交与回滚结果。
2. 构造受检异常（如 `IOException`）与自定义业务异常测试用例，实测默认回滚与 `rollbackFor`/`noRollbackFor` 的实际触发边界。
3. 验证外部 Bean 调用 vs 同类内部方法自调用时 `TransactionInterceptor` 是否被触发。

## 相关页面

- [Spring Boot 与 Spring Cloud：自动装配、事务、注册发现、网关与可观测性](/blog/legacy/note/zh-cn/spring-cloud-and-boot/)
- [ingest-spring-cloud（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-spring-cloud.md)
