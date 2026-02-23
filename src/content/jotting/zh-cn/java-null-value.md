---
title: NullValue 随笔
timestamp: 2025-10-07 21:43:00+08:00
tags: [Java, 随笔]
description: 深入探讨 Spring Cache 中 `NullValue` 的设计思想及其在缓存穿透防御中的应用
---

在缓存实践中，我们经常遇到一个场景：一个方法的返回值可能是 `null`，而我们希望将这个 `null` 结果也缓存起来。这被称为**缓存穿透的防御**。

例如，查询一个数据库中不存在的用户，第一次查询返回 `null`。如果不缓存这个 `null` 结果，那么后续所有对这个不存在用户的查询都会直接打到数据库上，造成不必要的压力，这就是缓存穿透。

然而，很多底层的缓存实现**本身不支持存储 `null` 值**。

- **`ConcurrentHashMap`**：Java 中最常用的内存缓存实现之一，其 `put(key, value)` 方法明确规定 key 和 value 都不能为 `null`。
- **Redis**: 虽然 Redis 自身可以存储空字符串等，但很多客户端库或上层抽象在处理 `null` 时可能会有不同的行为，或者将 `get` 操作返回 `null` 解释为 "key不存在"，这会产生歧义。

所以，Spring Cache 框架需要一个统一的机制来解决这个问题：如何在不支持 `null` 值的缓存中，表达 "一个key确实存在，且其对应的value就是null" 这个语义？

## 解决方案：空对象模式 (Null Object Pattern)

`NullValue` 正是这个问题的答案。它采用了经典的**空对象设计模式**。

它创建了一个特殊的、全局唯一的对象（`NullValue.INSTANCE`）来作为 `null` 的**占位符**或**替代品**。

整个流程如下：

1. **存入缓存时 (`toStoreValue`)**: 当 Spring Cache 发现方法的返回值是 `null` 时，它不会直接将 `null` 存入底层缓存，而是将预先定义好的 `NullValue.INSTANCE` 对象存进去。
2. **读出缓存时 (`fromStoreValue`)**: 当从缓存中获取到一个值时，Spring Cache 会检查这个值是不是 `NullValue.INSTANCE`。如果是，它就向调用者返回真正的 `null`；如果不是，就返回原始值。

通过这个中间转换，Spring Cache 巧妙地绕过了底层缓存不能存 `null` 的限制，同时正确地保留了缓存 `null` 值的业务语义。

## `NullValue` 的精巧设计细节

分析其源码，我们可以看到几个非常出色的设计点：

### 单例模式 (Singleton Pattern)

```java
public final class NullValue implements Serializable {
    public static final Object INSTANCE = new NullValue();

    private NullValue() {
    }
    // ...
}
```

- **`private` 构造函数**：防止外部通过 `new NullValue()` 创建新的实例。
- **`public static final INSTANCE`**：提供一个全局唯一的、不可变的公共实例。
- **优点**：
  - **内存高效**：整个 JVM 中只有一个 `NullValue` 实例，无论缓存了多少个 `null` 值，都指向同一个对象引用。
  - **性能优化**：可以使用 `==` 进行高效的身份比较，`if (value == NullValue.INSTANCE)`，这比 `equals()` 更快。

### 序列化安全 (`readResolve`)

```java
private Object readResolve() {
   return INSTANCE;
}
```

这是 `NullValue` 设计中非常关键的一点，尤其是在分布式缓存（如 Redis, Memcached）场景下。

- **问题**：当 `NullValue.INSTANCE` 被序列化（例如，写入 Redis），然后再从 Redis 读出并反序列化时，标准的 Java 反序列化会创建一个新的 `NullValue` 对象。这会破坏单例模式，导致 `deserializedObject == NullValue.INSTANCE` 的结果为 `false`，从而使缓存逻辑出错。
- **`readResolve()` 的作用**：这是 Java 序列化机制提供的一个特殊钩子方法。在反序列化过程的最后，如果类中定义了 `readResolve()` 方法，其返回值将会**替代**反序列化创建出的那个新对象。
- **效果**：通过返回全局唯一的 `INSTANCE`，`readResolve` 确保了**无论 `NullValue` 对象被如何序列化和反序列化，最终在 JVM 中得到的永远是那个唯一的单例 `INSTANCE`**。这保证了单例模式在分布式环境中的一致性和健壮性。

### 巧妙的 `equals()` 实现

```java
@Override
public boolean equals(@Nullable Object other) {
   return (this == other || other == null);
}
```

这个 `equals` 方法的设计非常巧妙。它定义了 `NullValue.INSTANCE` 在逻辑上等价于两种情况：

1. `this == other`: 与它自身相等。
2. `other == null`: 与一个真正的 `null` 值相等。

这意味着你可以编写 `NullValue.INSTANCE.equals(null)` 并且得到 `true`。虽然在 Spring Cache 内部更多使用 `==` 进行比较，但这个设计使得 `NullValue` 在语义上与 `null` 完美对等，增加了其通用性。

## `NullValue` 源码

> [!note]
> 即使不使用Spring Cache，你也可以利用 `NullValue` 的设计来处理 `null` 值。

作为一个非常优化的Null实例化设计，完整源码如下：

```java
package org.springframework.cache.support;
import java.io.Serializable;
import org.springframework.lang.Nullable;

public final class NullValue implements Serializable {

	public static final Object INSTANCE = new NullValue();

	private static final long serialVersionUID = 1L;

	private NullValue() {
	}

	private Object readResolve() {
		return INSTANCE;
	}

	@Override
	public boolean equals(@Nullable Object other) {
		return (this == other || other == null);
	}

	@Override
	public int hashCode() {
		return NullValue.class.hashCode();
	}

	@Override
	public String toString() {
		return "null";
	}
}
```

Spring Cache 的 `NullValue` 是一个看似简单但设计思想非常缜密的工具类。它通过**空对象模式**解决了在不支持 `null` 值的缓存中存储 `null` 的核心矛盾。同时，它结合了**单例模式**以实现高效内存和性能，并通过巧妙利用 Java 序列化机制中的 **`readResolve`** 方法，保证了其在分布式环境下的正确性，是一个非常值得学习的工程实践范例。
