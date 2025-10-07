---
title: Notes on NullValue
timestamp: 2025-10-07 21:43:00+08:00
series: Java
contents: true
tags: [Java, Notes]
description: An in-depth exploration of the design philosophy behind Spring Cache's `NullValue` and its application in defending against cache penetration
---

In caching practices, we often encounter a scenario: a method's return value might be `null`, and we want to cache this `null` result as well. This is called **cache penetration defense**.

For example, when querying a user that doesn't exist in the database, the first query returns `null`. If we don't cache this `null` result, all subsequent queries for this non-existent user will hit the database directly, causing unnecessary pressure - this is cache penetration.

However, many underlying cache implementations **do not support storing `null` values**.

- **`ConcurrentHashMap`**: One of the most commonly used in-memory cache implementations in Java. Its `put(key, value)` method explicitly requires that both key and value cannot be `null`.
- **Redis**: Although Redis itself can store empty strings, many client libraries or upper-layer abstractions may behave differently when handling `null`, or interpret a `get` operation returning `null` as "key does not exist", which creates ambiguity.

Therefore, the Spring Cache framework needs a unified mechanism to solve this problem: how to express the semantics of "a key does exist, and its corresponding value is null" in caches that don't support `null` values?

---

### 2. Solution: Null Object Pattern

`NullValue` is the answer to this problem. It adopts the classic **Null Object Design Pattern**.

It creates a special, globally unique object (`NullValue.INSTANCE`) to serve as a **placeholder** or **substitute** for `null`.

The entire process works as follows:

1. **Storing to cache (`toStoreValue`)**: When Spring Cache detects that a method's return value is `null`, it doesn't directly store `null` into the underlying cache. Instead, it stores the predefined `NullValue.INSTANCE` object.
2. **Reading from cache (`fromStoreValue`)**: When retrieving a value from the cache, Spring Cache checks if this value is `NullValue.INSTANCE`. If it is, it returns the actual `null` to the caller; if not, it returns the original value.

Through this intermediate conversion, Spring Cache cleverly bypasses the limitation that the underlying cache cannot store `null`, while correctly preserving the business semantics of caching `null` values.

---

### 3. Exquisite Design Details of `NullValue`

Analyzing its source code, we can see several excellent design points:

#### **1. Singleton Pattern**

```java
public final class NullValue implements Serializable {
    public static final Object INSTANCE = new NullValue();

    private NullValue() {
    }
    // ...
}
```

- **`private` constructor**: Prevents external code from creating new instances via `new NullValue()`.
- **`public static final INSTANCE`**: Provides a globally unique, immutable public instance.
- **Advantages**:
    - **Memory efficient**: Only one `NullValue` instance exists in the entire JVM. No matter how many `null` values are cached, they all point to the same object reference.
    - **Performance optimization**: Can use `==` for efficient identity comparison, `if (value == NullValue.INSTANCE)`, which is faster than `equals()`.

#### **2. Serialization Safety (`readResolve`)**

```java
private Object readResolve() {
   return INSTANCE;
}
```

This is a very critical point in `NullValue`'s design, especially in distributed caching scenarios (like Redis, Memcached).

- **Problem**: When `NullValue.INSTANCE` is serialized (e.g., written to Redis) and then read from Redis and deserialized, standard Java deserialization would create a new `NullValue` object. This would break the singleton pattern, causing `deserializedObject == NullValue.INSTANCE` to return `false`, thus breaking the caching logic.
- **Role of `readResolve()`**: This is a special hook method provided by Java's serialization mechanism. At the end of the deserialization process, if the class defines a `readResolve()` method, its return value will **replace** the new object created by deserialization.
- **Effect**: By returning the globally unique `INSTANCE`, `readResolve` ensures that **no matter how the `NullValue` object is serialized and deserialized, what you ultimately get in the JVM is always that unique singleton `INSTANCE`**. This guarantees the consistency and robustness of the singleton pattern in distributed environments.

#### **3. Clever `equals()` Implementation**

```java
@Override
public boolean equals(@Nullable Object other) {
   return (this == other || other == null);
}
```

This `equals` method design is very clever. It defines that `NullValue.INSTANCE` is logically equivalent to two cases:

1. `this == other`: Equal to itself.
2. `other == null`: Equal to an actual `null` value.

This means you can write `NullValue.INSTANCE.equals(null)` and get `true`. Although Spring Cache internally uses `==` for comparison more often, this design makes `NullValue` semantically perfectly equivalent to `null`, increasing its versatility.

---

#### 4. **`NullValue` Source Code**:

> [!note]
> Even if you don't use Spring Cache, you can leverage the design of `NullValue` to handle `null` values.

As a highly optimized Null instance design, the complete source code is as follows:

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

Spring Cache's `NullValue` is a seemingly simple but meticulously designed utility class. It solves the core contradiction of storing `null` in caches that don't support `null` values through the **Null Object Pattern**. At the same time, it combines the **Singleton Pattern** to achieve efficient memory and performance, and cleverly utilizes the **`readResolve`** method in Java's serialization mechanism to ensure its correctness in distributed environments. It's an excellent engineering practice example worth studying.
