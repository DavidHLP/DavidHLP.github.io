---
{
  "archiveId": "X-1071",
  "title": "NullValue: The Cache-Null Placeholder and Serialization Boundary",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2025-10-07",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "Explains why a cache must distinguish a missing key from a business null, how NullValue prevents repeated negative lookups, and where singleton and serialization semantics stop.",
  "findings": [
    "Original document: src/content/note/en/java-null-value.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/java-null-value.md",
  "pubDate": "2025-10-07T13:43:00.000Z",
  "tags": [
    "Java",
    "Spring Cache",
    "Caching",
    "Null Object",
    "Design Patterns",
    "en",
    "note"
  ],
  "draft": true,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/java-null-value.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "NullValue: The Cache-Null Placeholder and Serialization Boundary",
      "timestamp": "2025-10-07 21:43:00+08:00",
      "series": "Java Fundamentals & Backend Tuning",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "legacy-java-null-value"
      ],
      "related": [
        "java-online-performance-debug",
        "java-auto-closeable",
        "java-internship-interview-blog-polished",
        "redis-business-patterns"
      ],
      "tags": [
        "Java",
        "Spring Cache",
        "Caching",
        "Null Object",
        "Design Patterns"
      ],
      "description": "Explains why a cache must distinguish a missing key from a business null, how NullValue prevents repeated negative lookups, and where singleton and serialization semantics stop.",
      "toc": true
    }
  }
}
---


`NullValue` is a cache-layer placeholder for “the key exists, but the business result is null.” This page explains how to prevent repeated lookups for absent data and why the placeholder’s singleton and serialization behavior must remain inside the cache boundary.

## Core mechanism

### 1. Distinguish a miss from a negative hit

Without negative caching, every request for an absent object follows “cache miss → database → null.” A hot nonexistent key can repeat that path indefinitely. The cache must represent three states:

| Cache observation            | Business meaning                   | Next action                                          |
| ---------------------------- | ---------------------------------- | ---------------------------------------------------- |
| Key absent                   | Not queried, or expired            | May load from the source and decide whether to store |
| Key present with `NullValue` | Absence has already been confirmed | Return business `null` without a source call         |
| Key present with an object   | Real value hit                     | Return the object                                    |

The Spring Cache abstraction can be reduced to:

```java
store = value == null ? NullValue.INSTANCE : value;
value = store == NullValue.INSTANCE ? null : store;
```

Business methods still return `null`, while the backend stores a recognizable non-null object. A container such as `ConcurrentHashMap`, which rejects null values, can therefore still hold the negative result.

### 2. Three constraints on the placeholder

- `final` plus a private constructor limits extension and extra instances.
- A `static final INSTANCE` reuses one marker in a JVM, so the adapter can recognize it by identity.
- `Serializable` plus `readResolve()` returns the canonical instance after Java serialization, preventing a deserialized object from losing identity with `INSTANCE`.

`equals(null)`, a stable `hashCode()`, and `toString()` support the semantic presentation. Business code should not treat `NullValue` as a user object.

### 3. A placeholder is not a consistency strategy

Negative caching blocks only an absent key that has already been observed. It still needs a short TTL or active invalidation on creation/update; otherwise a new object can remain hidden behind the old marker. Parameter validation, Bloom filters, rate limits, and single-flight loading protect different stages and can be combined according to traffic and data shape.

## Applicability

- “Absent” is a cacheable business result, and repeated source lookups would harm the database or downstream service.
- The adapter converts `null` to a marker before storage and converts it back after reads, without exposing the marker to business code.
- Negative-cache TTL, invalidation, and serialization behavior are defined; a short period of staleness is acceptable after creation.
- The implementation needs to distinguish a cache miss, negative hit, and real object; an empty string is not used as a substitute for null.

## Not applicable and risks

- `NullValue` is not universal penetration protection. Random or invalid keys still need validation, a Bloom filter, rate limiting, or another admission control.
- A long TTL can hide newly created data. Strong-consistency paths may disable negative caching or invalidate synchronously.
- Serialization is an implementation boundary: different processes, languages, Spring versions, and cache serializers may not recognize `NullValue`. `readResolve()` alone does not prove remote compatibility.
- Null, an empty string, an empty collection, and an absent key are different meanings; a string marker can pollute business data.
- If business code checks `NullValue.INSTANCE`, the cache abstraction has leaked and conversion belongs back in the adapter.

## Minimum verification

1. Choose a genuinely absent key. The first request should load once and store a negative marker; the second should hit the marker without accessing the database.
2. Run the same test against an in-memory cache and the real serialized cache. The adapter should return business `null`, while a miss remains distinguishable.
3. Serialize and deserialize the marker. With Java serialization, check identity against `INSTANCE`; test the production serializer separately for compatibility.
4. After storing a real object, verify invalidation or TTL expiry exposes it. Record source calls, negative-hit rate, and the stale-data window.

## Evidence and uncertainty

- **Source facts**: `legacy-java-null-value` gives the Spring `NullValue` placeholder, singleton, `readResolve`, `toStoreValue/fromStoreValue`, short TTL, and its relationship to Bloom filters.
- **Synthesis in this page**: The problem is expressed as miss/negative-hit/positive-hit states, with serializer compatibility and invalidation treated as deployment boundaries.
- **Unconfirmed**: Compatibility with a particular Spring version, Redis serializer, or cross-language client requires the actual configuration and an experiment; the source does not establish one universal remote behavior.

## Related pages

- [Java Production Performance Troubleshooting: A Minimal Symptom-to-Evidence Decision Tree](/blog/legacy/note/zh-cn/java-online-performance-debug/)
- [AutoCloseable: Resource Ownership and Close-Exception Semantics](/blog/legacy/note/zh-cn/java-auto-closeable/)
- [Java Backend Interview Retrospective: Project Truth, Engineering Mechanisms, and Production Evidence](/blog/legacy/note/zh-cn/java-internship-interview-blog-polished/)


## Sources and related documents

- [NullValue 随笔：Spring Cache 如何优雅缓存 null](/blog/legacy/raw/zh-cn/legacy-java-null-value/)
- [Java Production Performance Troubleshooting: A Minimal Symptom-to-Evidence Decision Tree](/blog/legacy/note/zh-cn/java-online-performance-debug/)
- [AutoCloseable: Resource Ownership and Close-Exception Semantics](/blog/legacy/note/zh-cn/java-auto-closeable/)
- [Java Backend Interview Retrospective: Project Truth, Engineering Mechanisms, and Production Evidence](/blog/legacy/note/zh-cn/java-internship-interview-blog-polished/)
- [Redis Business Patterns: Caching, Distributed Locks, Message Queues, Feed Streams, and Seckill](/blog/legacy/note/zh-cn/redis-business-patterns/)
