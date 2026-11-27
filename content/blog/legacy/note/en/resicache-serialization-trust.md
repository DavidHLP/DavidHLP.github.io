---
{
  "archiveId": "X-1313",
  "translationKey": "legacy/note/resicache-serialization-trust",
  "title": "Redis Deserialization Security and Type Allowlists: Validating Package Boundaries Before Instantiation",
  "en": "ENGINEERING NOTES",
  "category": "项目实践",
  "department": "工程笔记",
  "date": "2026-11-27",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Examines ResiCache's SecureJacksonRedisSerializer, WhitelistPolicy, and streaming preflight to show why polymorphic type identifiers must be validated before object instantiation and how package.* differs from startsWith matching.",
  "findings": [
    "Raw source: src/content/raw/zh-cn/resicache-engineering-highlights-2954fff.md",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/resicache-engineering-highlights-2954fff.md",
  "pubDate": "2026-11-27T00:00:00.000Z",
  "tags": [
    "ResiCache",
    "Redis",
    "Serialization",
    "Security",
    "Jackson",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "kind": "concept",
  "status": "provisional",
  "sources": [
    "resicache-engineering-highlights-2954fff"
  ],
  "related": [
    "resicache-serialization-migration"
  ]
}
---

When polymorphic type identifiers stored in Redis may originate from legacy writers, external services, or untrusted input, letting Jackson instantiate an object from `@class` before checking its type in business code is already too late. The deserialization trust boundary must sit **before object creation**: read raw bytes -> verify every type identifier against the allowlist -> enter `EnvelopeCodec.read` only after all checks pass.

This note focuses on ResiCache's serialization trust mechanisms implemented in [`SecureJacksonRedisSerializer.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java#L132-L205) and [`WhitelistPolicy.java`](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/WhitelistPolicy.java#L89-L134); for the four-phase migration workflow and Lua CAS cutover, see [Replacing a Redis Serializer Is Not a One-Line Configuration Change: Object Trust and Rollback-Safe Migration](/blog/legacy/note/en/resicache-serialization-migration/).

## Core Mechanisms

### 1. Versioned envelopes identify format only

Non-null cached values are wrapped in a fixed outer envelope:

```json
{
  "version": 2,
  "payload": "..."
}
```

Here `version` tracks the serialization wire format only; it is neither a business-object version nor a cache-value CAS token. `@JsonTypeInfo` on `VersionEnvelope.payload` currently fixes the type property to `@class`, so any future change to the type property must update both the annotation and configuration together.

### 2. Streaming preflight: inspect type IDs before instantiation

Before invoking `EnvelopeCodec.read`, `SecureJacksonRedisSerializer` scans the raw JSON stream with `JsonParser` to validate polymorphic type identifiers, covering:

- the configured type property;
- `@class`;
- wrapper-array type identifiers;
- nested type identifiers inside polymorphic payloads.

```java
try (JsonParser parser = objectMapper.createParser(bytes)) {
    validateTypeIdsStreaming(parser);
}

Object envelope = EnvelopeCodec.read(objectMapper, bytes);

if (EnvelopeCodec.version(envelope)
        != EnvelopeCodec.currentVersion()) {
    // reject when failOnUnknownType=true
}
```

Even during legacy cache decoding or migration replay, the legacy decoder must reuse the same allowlist boundary: a malicious payload such as `@class: "com.attacker.Gadget"` is rejected regardless of whether it came from legacy bytes.

### 3. `WhitelistPolicy` package boundaries vs. `startsWith` matching

By default the allowlist permits `io.github.davidhlp` along with `java.lang`, selected `java.time` and `java.math` classes, and explicitly enumerated collection types. Rule syntax carries an important matching boundary:

```text
com.example.*  -> match by package boundary
com.example    -> match by startsWith
```

Without the trailing `.*`, a rule such as `com.example` can accidentally match `com.exampleX.SomeType`. Whenever strict package boundaries are required, configure an explicit `.*` suffix or an exact class name.

## Verified and Unverified Boundaries

Current serializer unit tests verify:

- rejecting `@class` values outside the allowlist;
- rejecting wrapper-array type identifiers;
- rejecting custom or unexpected type properties;
- round-trip serialization for allowlisted types and configuration propagation via the serializer factory;
- reading older `CachedValue` payloads missing refresh metadata.

**Unverified boundaries retained explicitly:**

- streaming preflight and allowlisting only cover explicit type-identifier inspection and do not constitute a complete supply-chain audit or cover arbitrary custom Jackson deserializers;
- this round did not measure streaming preflight latency, CPU overhead, or GC pressure across varying payload depths, so no throughput multiplier can be claimed;
- custom domain packages and multi-module classloaders still require verification against the concrete application's class allowlist.

## Graduation Checks

1. Audit all custom package rules in the target application's serializer config to confirm `.*` package boundaries or exact class names are used rather than bare `startsWith` prefixes.
2. Run serialization security tests against mixed legacy formats and polymorphic encodings (`@class`, wrapper-array, custom type properties) to confirm disallowed types fail prior to `EnvelopeCodec.read`.
3. Capture CPU and GC measurements under load testing for streaming preflight before replacing the unmeasured baseline status with numeric claims.

## Related Pages

- [Replacing a Redis Serializer Is Not a One-Line Configuration Change: Object Trust and Rollback-Safe Migration](/blog/legacy/note/en/resicache-serialization-migration/)
- [resicache-engineering-highlights-2954fff (raw source)](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/resicache-engineering-highlights-2954fff.md)
