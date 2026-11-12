---
title: Mybatis重要概念以及内容
published: 2025-07-09
description: 详细讲解Mybatis重要概念以及内容，其中包含了简洁的面试以及笔试回答
tags: [Mybatis, 面试]
category: Mybatis
draft: false
---

## MyBatis 中的一级缓存和二级缓存有什么区别？

### 面试笔试回答

> [!TIP]
>
> - 一级缓存是 **SqlSession 级别**的缓存，它是默认开启的。当用户在同一个 `SqlSession` 中执行相同的查询（相同的 SQL、相同的参数）时，MyBatis 会直接从缓存中返回结果，而不会再次查询数据库，当 `SqlSession` 被关闭或清空时，其对应的一级缓存也会随之销毁。
> - 二级缓存是 **Mapper (Namespace) 级别**的缓存，它可以被多个 `SqlSession` 共享。要使用二级缓存，需要手动进行配置，只有当应用程序关闭时，二级缓存才会被销毁。
> - 一级缓存 与 二级缓存 所在作用域 执行任何 `INSERT`、`UPDATE` 或 `DELETE` 操作时，该的所有缓存都会被清除。

MyBatis 作为一款优秀的持久层框架，内置了缓存机制以提升查询性能。其缓存分为一级缓存和二级缓存。

### **一级缓存 (Local Cache)**

一级缓存是 **SqlSession 级别**的缓存，它是默认开启的。当用户在同一个 `SqlSession` 中执行相同的查询（相同的 SQL、相同的参数）时，MyBatis 会直接从缓存中返回结果，而不会再次查询数据库。

- **生命周期**: 一级缓存的生命周期与 `SqlSession` 相同。当 `SqlSession` 被关闭或清空 (`clearCache()`) 时，其对应的一级缓存也会随之销毁。
- **作用域**: **SqlSession 级别**。也就是说，不同 `SqlSession` 之间的一级缓存是相互隔离、互不可见的。
- **特点**:
  - 默认开启，无需额外配置。
  - 缓存范围较小，只在当前 `SqlSession` 内有效。
  - 当执行任何 `INSERT`、`UPDATE` 或 `DELETE` 操作时，该 `SqlSession` 的所有一级缓存都会被清空，以保证缓存数据的准确性。

### **二级缓存 (Global Cache)**

二级缓存是 **Mapper (Namespace) 级别**的缓存，它可以被多个 `SqlSession` 共享。要使用二级缓存，需要手动进行配置。

- **生命周期**: 二级缓存的生命周期与应用程序的生命周期相同。只有当应用程序关闭时，二级缓存才会被销毁。

- **作用域**: **Namespace (Mapper) 级别**。同一个 Namespace 下的所有 `SqlSession` 可以共享二级缓存。

- **开启步骤**:

  1.  在 MyBatis 的核心配置文件 `mybatis-config.xml` 中启用二级缓存：
      ```xml
      <settings>
          <setting name="cacheEnabled" value="true"/>
      </settings>
      ```
  2.  或在 `application.yml` 中 启用二级缓存：
      ```yml
      mybatis:
        configuration:
        # 启用或禁用二级缓存。true为启用，false为禁用。
        cache-enabled: true
      ```
  3.  在对应的 Mapper XML 文件中添加 `<cache/>` 标签。
      ```xml
      <mapper namespace="com.example.UserMapper">
          <cache/>
      </mapper>
      ```
  4.  查询结果所对应的 POJO (JavaBean) 类必须实现 `java.io.Serializable` 接口。

- **特点**:

  - 需要手动配置才能开启。
  - 缓存范围更大，可以跨 `SqlSession` 共享数据。
  - 当同一个 Namespace 下执行了任何 `INSERT`、`UPDATE` 或 `DELETE` 操作时，该 Namespace 的二级缓存会被清空（或根据配置刷新）。

**总结对比**

| 特性         | 一级缓存 (Local Cache)       | 二级缓存 (Global Cache)                      |
| :----------- | :--------------------------- | :------------------------------------------- |
| **作用域**   | `SqlSession` 级别            | `Namespace` (Mapper) 级别                    |
| **生命周期** | 与 `SqlSession` 同生共死     | 与应用同生共死                               |
| **隔离性**   | 不同 `SqlSession` 间相互隔离 | 多个 `SqlSession` 可共享                     |
| **配置**     | 默认开启，无需配置           | 需手动开启和配置                             |
| **存储**     | POJO 对象本身                | 序列化后的对象                               |
| **适用场景** | 默认的、基本的查询性能提升   | 对数据一致性要求不高，但查询频率非常高的场景 |

---

## MyBatis 中 `#{}` 和 `${}` 的区别是什么？

### 面试笔试回答

> [!TIP]
>
> - `#{}` 在处理时，会将其中的变量替换成一个 JDBC `PreparedStatement` 的参数占位符 `?`。然后通过 `PreparedStatement` 的 `set` 方法来安全地设置参数值。
> - `${}` 在处理时，会将其中的变量值直接拼接到 SQL 语句中，不做任何转义处理。它是一种简单的字符串替换。

`#{}` 和 `${}` 都是 MyBatis 中用于在 SQL 语句中动态传入参数的方式，但它们的工作机制和安全性有本质的区别。

### **`#{}` (预编译参数占位符)**

- **机制**: `#{}` 在处理时，会将其中的变量替换成一个 JDBC `PreparedStatement` 的参数占位符 `?`。然后通过 `PreparedStatement` 的 `set` 方法来安全地设置参数值。
- **安全性**: **能有效防止 SQL 注入**。因为参数值是作为独立的、非 SQL 命令的部分传递给数据库的，数据库驱动会对传入的参数进行类型检查和转义，不会将其作为 SQL 代码的一部分来执行。
- **类型处理**: MyBatis 会根据传入参数的 Java 类型自动进行相应的 JDBC 类型转换。
- **示例**:
  ```xml
  <select id="getUserById" resultType="User">
    SELECT * FROM users WHERE id = #{userId}
  </select>
  ```
  如果 `userId` 的值为 `123`，最终执行的 SQL 类似于 `SELECT * FROM users WHERE id = ?`，然后将 `123` 作为参数安全地设置进去。

### **`${}` (字符串直接拼接)**

- **机制**: `${}` 在处理时，会将其中的变量值直接拼接到 SQL 语句中，不做任何转义处理。它是一种简单的字符串替换。
- **安全性**: **存在严重的 SQL 注入风险**。如果传入的参数值来自用户输入且未经过严格校验，恶意用户可以构造特殊的字符串（如 `1' OR '1'='1`）来改变 SQL 的原有逻辑，从而执行非预期的数据库操作。
- **类型处理**: 不进行类型处理，直接将参数的 `toString()` 结果拼接到 SQL 中。
- **示例**:
  ```xml
  <select id="getUsersByOrder" resultType="User">
    SELECT * FROM users ORDER BY ${columnName}
  </select>
  ```
  如果 `columnName` 的值为 `create_time DESC`，最终执行的 SQL 就是 `SELECT * FROM users ORDER BY create_time DESC`。

**总结与使用场景**

| 特性         | `#{}`                                                                  | `${}`                                                                    |
| :----------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **本质**     | 预编译参数占位符 (`?`)                                                 | 字符串直接拼接                                                           |
| **安全性**   | **安全**，防止 SQL 注入                                                | **不安全**，有 SQL 注入风险                                              |
| **使用场景** | 用于传递**绝大多数**的参数值，如 `WHERE` 条件、`INSERT` 的 `VALUES` 等 | 用于传递**非参数值**的 SQL 部分，如动态指定表名、列名、`ORDER BY` 子句等 |

**核心原则**: **能用 `#{}` 的地方就坚决不用 `${}`**。只有在需要动态改变 SQL 结构（而非参数值）且能确保参数来源安全可靠时，才考虑使用 `${}`。

---

## MyBatis 中的 `resultMap` 与 `resultType` 是什么？如何使用？

### 面试笔试回答

> [!TIP]
>
> - `resultType` 用于指定查询结果集自动映射成的 Java 类型。它适用于查询结果的列名与 Java Bean 的属性名能**自动对应**上的简单场景。
> - `resultMap` 通过一个详细的映射规则配置，明确地告诉 MyBatis 哪个列对应哪个属性，以及它们之间的类型转换关系。它还能处理复杂的对象关系映射。

`resultType` 和 `resultMap` 都是 MyBatis 用来处理 `select` 查询结果集与 Java 对象之间映射关系的机制。它们决定了 MyBatis 如何将从数据库查询出的数据行封装成 Java 对象。

### **`resultType` (结果类型)**

`resultType` 用于指定查询结果集自动映射成的 Java 类型。它适用于查询结果的列名与 Java Bean 的属性名能**自动对应**上的简单场景。

- **机制**: MyBatis 会获取查询返回的 `ResultSet`，然后根据列名（或列的别名）去查找 Java Bean 中对应的 `setter` 方法（遵循驼峰命名规则，如列名 `user_name` 对应属性 `userName` 的 `setUserName` 方法），并将值赋给该属性。

- **使用方法**: 在 `<select>` 标签中，直接指定 `resultType` 属性为目标 Java 类型的全限定名（或在 `mybatis-config.xml` 中配置了别名后的别名）。

- **示例**:
  假设有 Java Bean:

  ```java
  public class User {
      private Integer id;
      private String userName;
      // getters and setters...
  }
  ```

  数据库表 `users` 的列为 `id`, `user_name`。

  ```xml
  <select id="findUserById" resultType="com.example.model.User">
    SELECT id, username FROM users WHERE id = #{id}
  </select>
  ```

  MyBatis 会自动将 `id` 列的值赋给 `User` 对象的 `id` 属性，`user_name` 列的值赋给 `userName` 属性。

### **`resultMap` (结果集映射)**

`resultMap` 提供了更强大、更灵活的结果集映射能力。当数据库列名和 Java Bean 属性名不一致，或者需要处理复杂的关联查询（如一对一、一对多）时，就需要使用 `resultMap`。

- **机制**: `resultMap` 通过一个详细的映射规则配置，明确地告诉 MyBatis 哪个列对应哪个属性，以及它们之间的类型转换关系。它还能处理复杂的对象关系映射。

- **使用方法**:

  1.  在 Mapper XML 文件中定义一个 `<resultMap>` 元素，并在其中详细配置列（`column`）与属性（`property`）的对应关系。
  2.  在 `<select>` 标签中，使用 `resultMap` 属性指向已定义好的 `<resultMap>` 的 `id`。

- **示例 (列名与属性名不一致)**:
  假设数据库列为 `user_id`, `user_name`，而 Java Bean 属性为 `id`, `username`。

  ```xml
  <resultMap id="userResultMap" type="com.example.model.User">
      <id property="id" column="user_id" />
      <result property="username" column="user_name" />
  </resultMap>

  <select id="findUserById" resultMap="userResultMap">
    SELECT user_id, user_name FROM users WHERE id = #{id}
  </select>
  ```

- **示例 (处理关联关系，如一对多)**:
  `resultMap` 还可以通过 `<association>` (一对一) 和 `<collection>` (一对多) 标签来处理复杂的嵌套查询结果。当一个主对象包含一个其他对象的集合时，我们使用 `<collection>`。

  **1. 定义 Java 模型 (POJO)**

  首先，我们需要 `User` 和 `Order` 两个类，并且 `User` 类中包含一个 `Order` 的列表。

  ```java
  // Order.java
  public class Order implements Serializable {
      private Integer id;
      private String orderNumber;
      // getters and setters...
  }

  // User.java
  public class User implements Serializable {
      private Integer id;
      private String username;
      private List<Order> orders; // 一对多关系：一个用户对应一个订单列表
      // getters and setters...
  }
  ```

  **2. 编写 SQL 查询**

  使用 `JOIN` 查询来同时获取用户和其名下所有订单的信息。

  ```sql
  SELECT
      u.id as user_id,
      u.username,
      o.id as order_id,
      o.order_number
  FROM
      users u
  LEFT JOIN
      orders o ON u.id = o.user_id
  WHERE
      u.id = #{userId}
  ```

  **3. 定义 `resultMap` 以处理一对多关系**

  `resultMap` 的核心在于使用 `<collection>` 标签来映射 `User` 类中的 `orders` 列表。

  ```xml
  <resultMap id="userWithOrdersResultMap" type="com.example.model.User">
      <id property="id" column="user_id"/>
      <result property="username" column="username"/>

      <collection property="orders" ofType="com.example.model.Order">
          <id property="id" column="order_id"/>
          <result property="orderNumber" column="order_number"/>
      </collection>
  </resultMap>

  <select id="findUserWithOrders" resultMap="userWithOrdersResultMap">
      SELECT
          u.id as user_id,
          u.username,
          o.id as order_id,
          o.order_number
      FROM
          users u
      LEFT JOIN
          orders o ON u.id = o.user_id
      WHERE
          u.id = #{userId}
  </select>
  ```

通过这种方式，MyBatis 在处理查询结果时，会创建一个 `User` 对象，然后将所有关联的订单数据封装成 `Order` 对象，并填充到 `User` 对象的 `orders` 列表中，最终返回一个结构完整的 `User` 对象。

| 特性         | `resultType`                                                                       | `resultMap`                                                                                                     |
| :----------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **功能**     | 自动进行简单映射                                                                   | 手动定义复杂映射规则                                                                                            |
| **适用场景** | 列名与属性名一致或能通过 `camelCase` 自动匹配的简单查询                            | 1. 列名与属性名不一致\<br\>2. 需要处理复杂的关联关系（一对一、一对多）\<br\>3. 需要对类型转换等进行更精细的控制 |
| **配置**     | 简单，只需在 `<select>` 中指定类型                                                 | 相对复杂，需要先定义 `<resultMap>`，再在 `<select>` 中引用                                                      |
| **优先级**   | 较低。如果同时配置了 `resultType` 和 `resultMap`，MyBatis 会优先使用 `resultMap`。 | 较高                                                                                                            |

**核心思想**: 优先使用 `resultType` 来简化配置。当 `resultType` 无法满足映射需求时，再使用功能更强大的 `resultMap`。`resultMap` 是解决结果集映射问题的终极方案。
