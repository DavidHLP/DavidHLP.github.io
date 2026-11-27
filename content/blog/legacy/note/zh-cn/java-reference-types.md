---
{
  "archiveId": "X-1324",
  "translationKey": "legacy/note/java-reference-types",
  "title": "Java 引用类型与生命周期状态机：Strong/Soft/Weak/Phantom 与 Cleaner",
  "en": "ENGINEERING NOTES",
  "category": "后端工程",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "基于 JDK 8/17 引用类型原文笔记，梳理 java.lang.ref.Reference 四态状态机、get/clear 在 JDK 8 与 17 的实现差异、四种引用强度的回收语义差异，以及为什么 SoftReference 缓存常构成抖动反模式、堆外清理应优先使用 Cleaner。",
  "findings": [
    "原始证据: src/content/raw/zh-cn/ingest-java-concurrency.md",
    "证据状态: 暂定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "Java",
    "GC",
    "Reference",
    "WeakReference",
    "Cleaner",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "ingest-java-concurrency"
  ],
  "related": [
    "java-concurrency-deepdive"
  ]
}
---

Java 把对象可达性与堆外资源清理拆成一套异步事件通知模型：仅靠“强引用置空”无法表达弱绑定元数据、资源回收回调，以及缓存淘汰边界；但误用 `SoftReference` 做内存敏感缓存又会引入不可预测的 Full GC 抖动。

本页承接 [Java 并发深度：JUC、CAS、原子类、锁与线程机制](/blog/legacy/note/zh-cn/java-concurrency-deepdive/) 中 JDK 17 与 JDK 8 两篇 `JavaReferenceTypes` 原文细则。

## 核心机制

### 1. `java.lang.ref.Reference` 四阶段生命周期

所有非强引用都围绕 `Reference<T>` 与 GC、守护线程协作的四个阶段流转：

1. **`Active`（活跃态）**：初始常规状态，`get()` 可返回所指 `referent`。
2. **`Pending`（待决态）**：GC 可达性分析发现对象不再满足对应引用强度要求时，将其原子加入内部 `discovered` 待处理链表。
3. **`Enqueued`（入队态）**：JVM 守护线程 `Reference-Handler` 轮询待处理链表，将 `referent` 置空并把该 `Reference` 对象放入关联的 `ReferenceQueue`。
4. **`Inactive`（失活态）**：应用从 `ReferenceQueue` 取出该引用，或未关联队列的引用目标已被回收后进入终态。

`get()` 与 `clear()` 的实现与网络上常见的示例不同。JDK 17 的 `java.lang.ref.Reference` 并没有在 Java 层用 `VarHandle` 读写 `referent`：`get()` 直接返回 `this.referent`（标注 `@IntrinsicCandidate`，由 JIT 与 GC 协同处理），`clear()` 调用 native `clear0()`。可见性与回收屏障由 VM 和原生代码保证，不能从 Java 层的 acquire/release 操作推断。

```java
// OpenJDK 17 java.lang.ref.Reference（节选）
public T get() {
    return this.referent;
}

public void clear() {
    clear0();
}

private native void clear0();
```

常见的 `REFERENT.getAcquire(this)` / `REFERENT.setRelease(this, null)` 写法只是解释内存屏障意图的示意伪代码，不是 JDK 源码，也不代表 JDK 17 的 `Reference` 使用了这些操作。

### 2. 四种引用强度对比与架构取舍

| 引用类型 | 回收条件 | `ReferenceQueue` / 典型用途 | 关键风险与替代 |
| --- | --- | --- | --- |
| **强引用（Strong）** | 从 GC Root 可达则绝不回收 | 普通对象引用；内存耗尽抛 `OutOfMemoryError` | 长期持有没有边界的大集合引用 |
| **软引用（SoftReference）** | 仅剩软引用可达且接近内存压力边界时回收 | 早期简单内存缓存 | 回收时机不可预测，低延迟场景属反模式（应选 Caffeine 等确定性淘汰） |
| **弱引用（WeakReference）** | 仅剩弱引用可达时下一次 GC 必定回收 | `WeakHashMap`、`ThreadLocalMap.Entry` key | `WeakHashMap` key 被回收后需借访问触发清理 stale value |
| **虚引用（PhantomReference）** | 无法通过 `get()` 取对象，仅用于追踪回收入队 | 资源清理事件通知；Java 9+ 优先用 `Cleaner` API | 不应再依赖已废弃的 `finalize()` |

### 3. `Cleaner` API 替代 `finalize()`

管理堆外资源（如 JNI、`DirectByteBuffer`、本地文件句柄）时，Java 9+ 推荐用 `java.lang.ref.Cleaner` 强制把清理动作（`Runnable` 状态载体，不能反向持有被清理对象的强引用）与宿主对象解耦，形成显式 `close()` + GC 兜底的双重保障。

## 适用边界与未验证内容

- **适用**：弱绑定元数据缓存（如 `WeakHashMap` 键映射）与堆外资源 `Cleaner` 兜底设计。
- **不适用**：把 `SoftReference` 当作高并发低延迟系统的主缓存淘汰策略。
- **未验证边界（来自 raw 既有限制）**：
  - 引用队列入队时机与回收暂停受具体 GC（G1GC / ZGC）与 JDK 版本实现影响；
  - 原料给出了示意测试输出，**未在同一固定 JDK + 指定 GC 参数下完成不同收集器的入队延迟对照实测**。

## 毕业检查

1. 在固定 JDK 与显式 GC 参数（`-XX:+UseG1GC` 与 ZGC 对照）下运行 `WeakHashMap` 与 `Cleaner` 验证用例，记录 `ReferenceQueue` 入队时机。
2. 核实 `Cleaner` 清理动作对象中不存在隐式强引用捕获外层宿主对象（避免对象永不回收）。
3. 将早期依赖 `SoftReference` 的缓存点逐项对照确认或迁移至确定性容量淘汰组件。

## 相关页面

- [Java 并发深度：JUC、CAS、原子类、锁与线程机制](/blog/legacy/note/zh-cn/java-concurrency-deepdive/)
- [AutoCloseable：资源所有权与关闭异常语义](/blog/legacy/note/zh-cn/java-auto-closeable/)
- [ingest-java-concurrency（raw 原文）](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ingest-java-concurrency.md)
