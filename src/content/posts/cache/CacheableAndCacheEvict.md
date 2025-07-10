---
title: Spring Boot 本地缓存与清除缓存
published: 2025-07-10
description: 本文详细剖析了 Spring Boot 中用于缓存管理的两个核心注解：`@Cacheable` 和 `@CacheEvict`。`@Cacheable` 负责将高成本操作的结果存入缓存，以提高后续请求的响应速度；而 `@CacheEvict` 则用于在数据发生变更（如更新或删除）时，精确地清除对应的缓存，确保数据的一致性。文章通过代码示例和核心属性详解，帮助开发者理解其工作流程、SpEL 表达式在 `key` 生成中的应用，以及如何处理缓存的同步和清除策略。
tags: [Spring Boot, Java, cache, Cacheable, CacheEvict]
category: Spring Boot
draft: false
---

## `@Cacheable`：缓存的“守门员”

`@Cacheable` 的核心使命是**减少昂贵操作（如数据库查询、远程 API 调用）的执行次数**。它通过将方法的结果存储在缓存中，并在后续相同的请求中直接返回缓存结果来实现这一点。

### 工作流程

它的工作逻辑可以概括为 **“先查缓存，再定行动”**：

1.  **方法调用前拦截**：当一个被 `@Cacheable` 注解的方法被调用时，Spring 的 AOP（面向切面编程）代理会先拦截这个调用。
2.  **生成缓存键 (Key)**：代理会根据方法的参数和注解中定义的 `key` 规则生成一个唯一的缓存键。
3.  **检查缓存**：使用这个键去指定的缓存 (`cacheNames`) 中查找数据。
4.  **决策**：
    - **缓存命中 (Cache Hit)**：如果在缓存中找到了有效的（未过期的）数据，代理会**跳过实际方法的执行**，直接将缓存中的数据返回给调用者。
    - **缓存未命中 (Cache Miss)**：如果在缓存中没有找到数据，代理会**执行原始的业务方法**。
5.  **缓存结果**：方法成功执行后，代理会将其返回值存入缓存，使用的就是第 2 步生成的那个键。下次再有相同的请求，就会直接命中缓存。

### 核心属性详解

| 属性                       | 类型       | 是否必须 | 描述和用法示例                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| :------------------------- | :--------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`value` / `cacheNames`** | `String[]` | **是**   | 指定要使用的缓存空间名称。可以指定一个或多个，例如 `cacheNames = "users"` 或 `cacheNames = {"users", "profiles"}`。                                                                                                                                                                                                                                                                                                                                           |
| **`key`**                  | `String`   | 否       | 定义缓存键的生成规则，使用 **SpEL (Spring Expression Language)** 表达式。**这是最重要的属性之一**。\<br/\>- **默认**：如果不指定，Spring 会使用所有方法参数的 `hashCode()` 组合生成一个默认的键。\<br/\>- **示例**：\<br/\> - `key = "#id"`: 使用名为 `id` 的参数作为键。\<br/\> - `key = "#p0"`: 使用第一个参数作为键。\<br/\> - `key = "#user.id"`: 使用 `user` 对象的 `id` 属性作为键。\<br/\> - `key = "'activeUsers'"`: 使用一个固定的字符串常量作为键。 |
| **`keyGenerator`**         | `String`   | 否       | 指定一个自定义的键生成器 Bean 的名称。当 `key` 属性无法满足复杂的键生成逻辑时使用。                                                                                                                                                                                                                                                                                                                                                                           |
| **`condition`**            | `String`   | 否       | SpEL 表达式，在**方法执行前**进行判断。只有当表达式为 `true` 时，才会检查缓存和缓存结果。\<br/\>- **示例**：`condition = "#id > 10"`，表示只有当 `id` 大于 10 时才启用缓存功能。                                                                                                                                                                                                                                                                              |
| **`unless`**               | `String`   | 否       | SpEL 表达式，在**方法执行后**对**结果 (`#result`)** 进行判断。只有当表达式为 `false` 时，才会将结果缓存。\<br/\>- **示例**：`unless = "#result == null"`，这是最常见的用法，防止将 `null` 值缓存起来。                                                                                                                                                                                                                                                        |
| **`sync`**                 | `boolean`  | 否       | `sync = true` 时，可以防止“缓存击穿”（Dogpile Effect）。当多个线程同时请求一个不存在的缓存项时，只允许一个线程执行方法并填充缓存，其他线程会等待。这需要底层的缓存管理器支持（如 Caffeine）。                                                                                                                                                                                                                                                                 |

### 代码示例

```java
@Service
public class BookService {

    // 使用 "books" 缓存空间，并用参数 isbn 作为 key
    @Cacheable(cacheNames = "books", key = "#isbn")
    public Book findBook(String isbn, boolean isVip) {
        // 这段模拟慢查询
        System.out.println("Executing slow database search for ISBN: " + isbn);
        // ... 从数据库查询书籍
        return new Book(isbn, "Some Book");
    }

    // 只有当书名长度大于5，并且查询结果不为null时才缓存
    @Cacheable(
        cacheNames = "booksByName",
        key = "#name",
        condition = "#name.length() > 5",
        unless = "#result == null"
    )
    public Book findBookByName(String name) {
        System.out.println("Searching book by name: " + name);
        // ...
        return new Book("12345", name);
    }
}
```

---

## `@CacheEvict`：缓存的“清理工”

`@CacheEvict` 的核心使命是**从缓存中移除数据**。当你的业务操作导致了数据变更（如更新或删除），就必须用它来清除旧的、不再准确的缓存，以避免用户读到脏数据。

### 工作流程

1.  **方法调用时拦截**：与 `@Cacheable` 类似，`@CacheEvict` 注解的方法在被调用时也会被代理拦截。
2.  **决定清除时机**：根据 `beforeInvocation` 属性，代理决定是在**方法执行前**还是**执行后**进行清除操作。
3.  **生成缓存键**：与 `@Cacheable` 一样，根据 `key` 规则或 `allEntries` 属性来确定要清除的目标。
4.  **执行清除**：从指定的 `cacheNames` 中移除一个或多个缓存项。
5.  **执行原始方法**：代理会继续执行原始的业务方法（例如，执行数据库的 `DELETE` 或 `UPDATE` 语句）。

### 核心属性详解

| 属性                       | 类型       | 是否必须 | 描述和用法示例                                                                                                                                                                                                                                                                           |
| :------------------------- | :--------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`value` / `cacheNames`** | `String[]` | **是**   | 指定要操作的缓存空间名称。                                                                                                                                                                                                                                                               |
| **`key`**                  | `String`   | 否       | SpEL 表达式，用于定位**需要被清除的单个缓存项**。它的写法必须和对应的 `@Cacheable` 中的 `key` 一致，才能精确找到目标。\<br/\>- **示例**：`key = "#user.id"`                                                                                                                              |
| **`allEntries`**           | `boolean`  | 否       | 如果设置为 `true`，则会**忽略 `key` 属性**，直接清除 `cacheNames` 指定的缓存空间中的**所有条目**。\<br/\>- **默认**：`false`。\<br/\>- **用途**：适用于“删除全部”或可能影响大量数据的批量操作。                                                                                          |
| **`beforeInvocation`**     | `boolean`  | 否       | 定义清除操作的执行时机。\<br/\>- `false` (默认值): 在**方法成功执行后**再清除缓存。如果方法执行过程中抛出异常，缓存不会被清除。这是一种安全的策略，保证了操作的原子性（数据操作成功了，才清除缓存）。\<br/\>- `true`: 在**方法执行前**就清除缓存。无论方法是否成功执行，缓存都会被清除。 |

### 代码示例

假设我们有一个 `UserService`，其中 `findById` 方法被缓存了。

```java
@Service
public class UserService {

    @Cacheable(cacheNames = "users", key = "#id")
    public User findById(Long id) {
        System.out.println("Finding user by id: " + id);
        // ... 从数据库查询
        return new User(id, "John Doe");
    }

    // 更新用户：操作成功后，清除对应的缓存
    // key 必须与 findById 中的 key 对应
    @CacheEvict(cacheNames = "users", key = "#user.id")
    public void updateUser(User user) {
        System.out.println("Updating user: " + user.getId());
        // ... 更新数据库
    }

    // 删除用户：操作成功后，清除对应的缓存
    @CacheEvict(cacheNames = "users", key = "#id")
    public void deleteUser(Long id) {
        System.out.println("Deleting user: " + id);
        // ... 从数据库删除
        if (id == -1) { // 模拟失败场景
            throw new RuntimeException("Deletion failed!");
        }
    }

    // 清除所有 users 缓存
    @CacheEvict(cacheNames = "users", allEntries = true)
    public void reloadAllUsers() {
        System.out.println("Evicting all users from cache.");
        // 可能是一些批量重载数据的操作
    }
}
```

### 场景模拟

1.  调用 `userService.findById(100L)` -\> 控制台打印 "Finding user by id: 100"，数据被缓存。
2.  再次调用 `userService.findById(100L)` -\> 控制台**无任何输出**，直接返回缓存数据。
3.  调用 `userService.updateUser(new User(100L, "Jane Doe"))` -\> 控制台打印 "Updating user: 100"，方法成功执行后，`users` 缓存中 `key=100` 的条目被清除。
4.  再次调用 `userService.findById(100L)` -\> 控制台打印 "Finding user by id: 100"，因为缓存已被清除，所以重新执行方法从数据库获取最新数据，并再次缓存。
5.  调用 `userService.deleteUser(-1L)` -\> 控制台打印 "Deleting user: -1"，方法抛出异常。因为 `beforeInvocation` 是默认的 `false`，所以缓存**不会被清除**。

## 重要注意事项

- **AOP 代理限制**：Spring 缓存是通过 AOP 代理实现的。这意味着，只有通过代理对象（通常是注入的 Bean）调用方法时，注解才会生效。在一个类内部，`this.someAnnotatedMethod()` 这样直接调用是**无效**的，因为它绕过了代理。
- **Key 的一致性**：`@CacheEvict` 要想精确地清除由 `@Cacheable` 创建的缓存，它们的 `cacheNames` 和 `key` 生成逻辑必须完全一致。
- **对象可序列化**：如果使用像 Redis 这样的分布式缓存，存入缓存的对象必须是可序列化的 (`implements Serializable`)。
