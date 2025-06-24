---
title: CompletableFuture
published: 2025-06-24
description: 本文系统梳理了 CompletableFuture 的核心 API、典型用法与实践示例，涵盖任务创建、结果处理、组合操作及常见陷阱，帮助开发者快速掌握 Java 异步编程要点。
tags: [CompletableFuture, Java, 多线程]
category: Java
draft: false
---


# CompletableFuture

> 以下内容整理自 `CompletableFutureAction.java`，涵盖常见的 API 使用场景。每小节均给出：关键知识点 → 示例代码 → 预期输出，方便快速查阅。

---

## 1. 直接 `new CompletableFuture()`

**关键知识点**

- 使用空参构造方法得到的是 _待手动完成_ 的 `CompletableFuture`，若未调用 `complete/completeExceptionally`，则 `get/join` 会永久阻塞 ⇒ **不安全**。

```java
// 不要这样使用！
CompletableFuture cf = new CompletableFuture();
```

**结果**

- 若无外部线程调用 `cf.complete(...)`，则获取结果的方法会一直阻塞。

---

## 2. `runAsync` / `supplyAsync`

**关键知识点**

- `runAsync`：无返回值，对应 `CompletableFuture<Void>`。
- `supplyAsync`：有返回值，使用 `Supplier<T>`。
- 若未显式指定线程池，则默认使用 `ForkJoinPool.commonPool()`；可通过第二个参数传入自定义 `Executor`。

```java
// 无返回值，使用公共线程池
CompletableFuture<Void> cf1 = CompletableFuture.runAsync(() ->
        System.out.println(Thread.currentThread().getName()));
System.out.println(cf1.get());        // 输出 null

// 有返回值，使用自定义线程池
ExecutorService pool = Executors.newFixedThreadPool(10);
CompletableFuture<String> cf2 = CompletableFuture.supplyAsync(() ->
        Thread.currentThread().getName(), pool);
System.out.println(cf2.get());
pool.shutdown();
```

**结果（示例）**
```text
ForkJoinPool.commonPool-worker-1
null
pool-1-thread-1
```

---

## 3. `whenComplete` / `exceptionally`

### 3.1 无自定义线程池

```java
CompletableFuture.supplyAsync(() -> 1)
        .whenComplete((v, t) -> System.out.println("whenComplete:" + (v + 1)))
        .exceptionally(t -> { System.out.println(t.getMessage()); return null; });
System.out.println("Main Thread:" + 3);
```

**结果**（主线程未休眠时）
```text
Main Thread:3
```

**结果**（主线程休眠 1s）
```text
Main Thread:3
whenComplete:2
```

### 3.2 使用自定义线程池

- 逻辑与 3.1 相同，只是把 `supplyAsync` 放入自定义线程池即可。

---

## 4. `join()`

**关键知识点**

- `join()` 与 `get()` 类似，但会将受检异常转换为 `UncheckedExecutionException`。

```java
int r = CompletableFuture.supplyAsync(() -> 1, pool).join();
System.out.println("CompletableFutureJoin:" + r);
```

**结果**
```text
CompletableFutureJoin:1
Main Thread
```

---

## 5. 获取结果方式对比

```java
CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> {
    Thread.sleep(200);
    return Thread.currentThread().getName();
});
System.out.println("get:" + f.get());
System.out.println("join:" + f.join());
System.out.println("getNow:" + f.getNow("default"));
System.out.println("Timeout 200ms:" + f.get(200, TimeUnit.MILLISECONDS));
```

**结果（示例）**
```text
get: ForkJoinPool.commonPool-worker-1
join: ForkJoinPool.commonPool-worker-1
getNow: default
Timeout 200ms: ForkJoinPool.commonPool-worker-1
```

- 再次调用 `get(100, TimeUnit.MILLISECONDS)` 将抛出 `TimeoutException`。

---

## 6. 主动触发计算 `complete()`

```java
CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> {
    Thread.sleep(300);
    return Thread.currentThread().getName();
});
TimeUnit.MILLISECONDS.sleep(200);
f.complete("Hello World");
System.out.println(f.get());
```

**结果**
```text
Hello World
```

---

## 7. 结果转换 `thenApply` / `handle`

### 7.0 回调方法区别速查

| 方法 | Lambda 类型 | 是否需要上一步结果 | 是否有返回值 |
|------|-------------|--------------------|--------------|
| `thenRun` | `Runnable` | 否 | 否 |
| `thenAccept` | `Consumer<T>` | 是 | 否 |
| `thenApply` | `Function<T,R>` | 是 | 是 |

> 任务 A 执行完毕后：
> - **thenRun**：直接执行任务 B，B 不关心 A 的结果；
> - **thenAccept**：执行任务 B，B 依赖 A 的结果，但 B 自身无返回值；
> - **thenApply**：执行任务 B，B 依赖 A 的结果，并且 B 产生新的返回值。

### 常用函数式接口对照表

| 函数式接口 | 抽象方法 | 参数数量 | 返回值 |
|-------------|----------|----------|--------|
| `Runnable` | `void run()` | 0 | 无 |
| `Function<T,R>` | `R apply(T t)` | 1 | 有 |
| `Consumer<T>` | `void accept(T t)` | 1 | 无 |
| `Supplier<T>` | `T get()` | 0 | 有 |
| `BiConsumer<T,U>` | `void accept(T t,U u)` | 2 | 无 |


### 7.1 `thenApply`（链式转换）

```java
CompletableFuture.supplyAsync(() -> 1, pool)
        .thenApply(r -> r + 1)
        .thenApply(r -> r + 1)
        .thenApply(r -> r + 1);
System.out.println("Main Thread");
```

**结果**
```text
Main Thread
2
3
4
```

### 7.2 `handle`（可处理异常）

```java
CompletableFuture.supplyAsync(() -> 1, pool)
        .handle((r, ex) -> r + 1)
        .handle((r, ex) -> r + 1)
        .handle((r, ex) -> r + 1)
        .exceptionally(Throwable::getMessage);
```

---

## 8. 消费结果 `thenAccept` / 纯触发 `thenRun`

```java
// thenAccept 消费值
CompletableFuture.supplyAsync(() -> 1, pool)
        .thenAccept(r -> System.out.println(r + 10));

// thenRun 只关心前序完成
CompletableFuture.supplyAsync(() -> 1, pool)
        .thenRun(() -> System.out.println("thenRun"));
```

**结果**
```text
Main Thread
11            // thenAccept 输出
thenRun        // thenRun 输出
```

### `thenRun` 连续调用及线程差异

- 若前序计算线程休眠 → 后续 `thenRun` 仍在同一线程。
- 若不休眠 → 后两次 `thenRun` 可能在 `main` 线程。

### `thenRunAsync`

- 不指定线程池时，后续任务切到 `ForkJoinPool.commonPool()`。

---

## 9. 组合任务

### 9.1 `applyToEither`

- 获取**先完成**的结果，未完成的任务仍继续执行。

```java
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> {
    Thread.sleep(1000);
    return "future1 fast";
}, pool);
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> {
    Thread.sleep(2000);
    return "future2 slow";
}, pool);
CompletableFuture<String> fastest = f1.applyToEither(f2, s -> s);
fastest.thenAccept(System.out::println); // future1 fast
f2.thenAccept(System.out::println);      // future2 slow
```

**结果**
```text
future1 fast
future2 slow
```

### 9.2 `thenCombine`

- 等待**两个**任务都完成后合并结果。

```java
CompletableFuture<Integer> r =
        CompletableFuture.supplyAsync(() -> 10, pool)
                .thenCombine(CompletableFuture.supplyAsync(() -> 20, pool), Integer::sum);
r.thenAccept(System.out::println); // 30
```

**结果**
```text
30
```

---

> 以上示例均基于 JDK 17，输出可能因线程调度而略有差异，仅供参考。
