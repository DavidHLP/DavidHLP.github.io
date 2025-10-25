---
title: What is the difference between String, StringBuffer, and StringBuilder in Java
timestamp: 2025-09-29 10:57:00+08:00
series: Java Base
contents: true
tags: [Java, 字符串]
description: What is the difference between String, StringBuffer, and StringBuilder in Java
---

# What is the difference between String, StringBuffer, and StringBuilder in Java

```markmap
# String, StringBuffer, StringBuilder

- Key Points
    - They are all classes in Java for handling strings, with the differences mainly in **mutability**, **thread safety**, and **performance**:
    - 1 **String**
        - **Immutable**: `String` is an immutable class; once a string is created, its content cannot be changed. Every modification operation on a `String` (like concatenation, substring, etc.) creates a new `String` object.
        - **Suitable Scenarios**: `String` is suitable for scenarios where the string content will not change frequently, such as a small number of string concatenations or string constants.

    - 2 **StringBuffer**
        - **Mutable**: `StringBuffer` is mutable and allows operations like appending, deleting, and inserting strings.
        - **Thread-Safe**: `StringBuffer` is thread-safe; it uses the `synchronized` keyword internally to ensure safety in a multi-threaded environment.
        - **Suitable Scenarios**: `StringBuffer` is suitable for scenarios in a multi-threaded environment where strings need to be modified frequently.

    - 3 **StringBuilder**
        - **Mutable**: `StringBuilder` is also mutable and provides similar operation interfaces to `StringBuffer`.
        - **Not Thread-Safe**: `StringBuilder` does not guarantee thread safety, but it offers higher performance than `StringBuffer`.
        - **Suitable Scenarios**: `StringBuilder` is suitable for high-performance string processing in a single-threaded environment where strings are heavily modified, such as high-frequency concatenation operations.

- Summary
    - **String**: Immutable, suitable for a small number of string operations.
    - **StringBuffer**: Mutable and thread-safe, suitable for frequent string modification in a multi-threaded environment.
    - **StringBuilder**: Mutable and not thread-safe, suitable for high-performance string processing in a single-threaded environment.

- Extended Knowledge
    - **Optimization in Java 8**
        - In Java 8 and later, the compiler optimizes constant string concatenation by converting string concatenation into `StringBuilder` operations. This optimization improves code performance, but in scenarios involving dynamic concatenation or multi-threading, manually using `StringBuilder` and `StringBuffer` is still more appropriate.

    - **Viewing the Three from an Evolutionary Perspective**
        - `String` is a fundamental and important class in Java, and it is also a typical implementation of an `Immutable` class, declared as a `final class`, with all properties except the `hash` property declared as `final`.
        - Due to its immutability, operations like string concatenation can generate many useless intermediate objects, which impacts performance if performed frequently.
        - **StringBuffer was introduced to solve the problem of generating many intermediate objects during large amounts of string concatenation**. It provides `append` and `insert` methods to add strings to the end or a specified position of an existing sequence.
        - Its essence is a thread-safe, modifiable sequence of characters, with all data modification methods synchronized using `synchronized`. However, ensuring thread safety comes at a performance cost.
        - In many cases, our string concatenation operations do not require thread safety. This is where **StringBuilder** comes in. `StringBuilder` was released in `JDK 1.5`, and essentially, it is not much different from `StringBuffer`; it simply **removes the parts that ensure thread safety, reducing the overhead**.
        - Both `StringBuffer` and `StringBuilder` inherit from `AbstractStringBuilder`, and their underlying structure utilizes a modifiable `char` array (or `byte` array since JDK 9).
        - Therefore, if we have a large amount of string concatenation, and we can predetermine the size, it is best to set the `capacity` when `new StringBuffer` or `StringBuilder` to avoid the overhead of multiple expansions (expansion involves discarding the original array and performing an array copy to create a new one).
```
