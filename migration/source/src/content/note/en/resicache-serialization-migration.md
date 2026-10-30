---
title: "Replacing a Redis Serializer Is Not a One-Line Configuration Change: Object Trust and Rollback-Safe Migration"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java Security, Concurrency, and Testing"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-jackson-java-time"]
tags: [ResiCache, Redis, Serialization, Security, Migration]
description: "Why wire format, type trust, and migration of existing data must be designed together, based on ResiCache's secure deserialization and migration engine."
toc: true
---

Changing a Redis serializer may appear to require editing one Bean. But Redis stores bytes, not Java objects.

If old cache entries use a JDK serializer or GenericJackson2JsonRedisSerializer and the new serializer uses another envelope, switching directly creates two separate questions:

1. Can the new code safely interpret type information in Redis?
2. How can existing bytes be migrated and rolled back without overwriting concurrent writes?

## Deserialization is dangerous before the object is created

Jackson polymorphic data often carries a type identifier, for example:

```json
{
  "version": 2,
  "payload": {
    "@class": "com.example.User"
  }
}
```

If the type identifier came from Redis, and Redis content may have been written by another application, an old program, or an attacker, then “let Jackson create the object by type and check it in the business layer” is already too late.

The required boundary is:

```text
read bytes
  -> check whether the type identifier is allowed
  -> only then let Jackson instantiate the object
```

This is a trust boundary, not ordinary DTO conversion.

## ResiCache's serializer applies three constraints

The current SecureJacksonRedisSerializer has three related mechanisms.

### Versioned envelope

Every non-empty cached value is wrapped as:

```json
{
  "version": 2,
  "payload": "..."
}
```

This version is the serialization-format version. It is not the business-object version and not a cache-value CAS token.

### Allowlist policy

The default allowed business-package prefix is:

```text
io.github.davidhlp
```

Some java.lang, java.time, and java.math types, along with explicitly enumerated collection types, are also allowed.

An allowlist is not simply “polymorphism on or off.” It must answer:

`Is this exact fully qualified class name allowed to appear in the cache bytes?`

One configuration boundary in the current implementation deserves attention:

```text
com.example.*  -> match by package boundary
com.example    -> match by startsWith
```

Thus com.example may also match com.exampleX.SomeType. For strict package boundaries, use a prefix with .* or a sufficiently precise prefix.

### Streaming preflight

Before reading the envelope, the serializer uses a streaming parser to inspect:

- the configured type property;
- @class;
- wrapper-array type IDs;
- type identifiers appearing in polymorphic payloads.

Only after these checks pass does it enter EnvelopeCodec.read.

The core flow is:

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

This is not a complete deserialization security audit, but it places the most important type check before object instantiation.

See [SecureJacksonRedisSerializer.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java#L132-L205) and [WhitelistPolicy.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c90645070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/WhitelistPolicy.java#L89-L134).

## Why support migration of old cache entries

Even if the new serializer is safe, old entries may not use the current envelope.

The migration configuration explicitly separates four phases:

| Phase | Behavior | Modifies source key? |
|---|---|---|
| SHADOW_READ | decode and validate the old value | no |
| DUAL_WRITE | keep the old value and write the new envelope to a sidecar | no |
| CUTOVER | back up the old value, then replace the source value | yes |
| ROLLBACK | restore the old value from the backup | yes |

The default phase is SHADOW_READ, and migration does not run automatically at application startup.

## SHADOW_READ: learn what the existing data is

SHADOW_READ is intentionally conservative:

```text
scan candidate keys
  -> identify whether the current envelope is already present
  -> try to decode with the configured legacy serializer
  -> record success or failure
  -> write nothing to Redis
```

It solves visibility before migration.

Without knowing the old format and the decodable ratio first, a direct cutover can disguise compatibility failures as ordinary cache misses.

## DUAL_WRITE: write through a sidecar first

DUAL_WRITE keeps the old source key and writes the new envelope to a sidecar:

```text
user:42
user:42:__resicache_envelope
```

The sidecar reuses the source key's TTL. If migration runs again and the sidecar content is already identical, it does not write again.

This provides two benefits:

- old consumers can continue reading the old source key;
- the new format can be validated before the main data is replaced.

## CUTOVER: back up, compare, and replace

The cutover order is:

```text
read old source
  -> write a legacy backup sidecar
  -> atomically compare the source with the old bytes
  -> replace with the new envelope only on equality
  -> use KEEPTTL to preserve the lifetime
```

The essential Lua semantics are:

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
    redis.call('set', KEYS[1], ARGV[2], 'KEEPTTL')
    return 1
else
    return 0
end
```

If business code writes a new value after migration reads the old value, the comparison fails:

```text
migration reads old
business writes new
migration tries to replace old -> envelope(old)
comparison fails; new is protected
```

The goal is not to guarantee that migration always completes. It is to prevent the migration tool from becoming another data overwriter.

## ROLLBACK must not overwrite blindly either

Rollback does not simply write the backup back to the source.

It first checks whether the current source is still the expected envelope:

```text
current value is still the value produced by this cutover
  -> restore the old value

current value was written again by business code
  -> reject rollback and protect the new write
```

Rollback is therefore a conditional recovery, not an unconditional overwrite.

## Why not clear Redis and switch

If the cache is truly disposable and the business can accept one full source reload, clearing the old cache before switching serializers may be simpler.

That requires all of the following to be true:

- the cache contains no state that must not be lost;
- the full source-load pressure is acceptable;
- every instance can switch at the same time;
- no old consumer continues writing the old format;
- there is no need for a canary, sidecar validation, or rollback.

The current migration engine is for cases where the cache cannot simply be cleared, the existing format needs to be observed, or concurrent writes need protection. Its cost includes:

- multiple migration phases;
- sidecar and backup keys;
- operator control;
- a legacy decoder;
- migration reports and failure handling;
- additional maintenance of the Redis wire format.

This is not “more advanced” by itself. It exchanges operational complexity for control during migration.

## Type safety and migration safety must both hold

The legacy decoder must not bypass the allowlist.

The malicious old JSON used in tests is:

```json
{
  "@class": "com.attacker.Gadget"
}
```

It is rejected during migration too, rather than being trusted merely because it came from an old format.

Migration is not a temporary script outside the security boundary. It reads the same untrusted or uncertain data, so it must reuse the type constraints.

## What the tests verify

Current serializer tests cover:

- rejection of an @class outside the allowlist;
- rejection of wrapper-array type identifiers;
- rejection of a custom type property;
- round-trip for an allowed type;
- correct configuration propagation by the serializer factory;
- reading an old CachedValue with missing refresh metadata.

In the real Redis integration test, SerializationMigrationIntegrationTest has eight passing tests covering:

- SHADOW_READ does not write the source key;
- DUAL_WRITE preserves the old value and is idempotent;
- the sidecar preserves TTL;
- CUTOVER backs up the old bytes;
- ROLLBACK restores the old value;
- concurrent business writes are not overwritten;
- non-allowlisted types in a mixed dataset are rejected.

See [SerializationMigrationIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SerializationMigrationIntegrationTest.java#L61-L169).

## Cost and failure boundaries

The boundaries of this design also need to be explicit.

- envelope version is only a format version; it does not automatically migrate arbitrary historical formats;
- the current legacy decoder supports a defined set of formats; other serializers need their own decoder;
- VersionEnvelope.payload uses a fixed @class JsonTypeInfo property; changing the type property requires annotation and configuration changes together;
- the default allowlist favors the project's own package names; custom business types must be explicitly configured;
- preflight scans samples and cannot prove that the entire Redis dataset has no old format;
- migration scans are limited by maxKeys, pattern, and batch size, not one whole-database transaction;
- dryRun reduces risk but cannot replace a real cutover test;
- an allowlist and streaming preflight are not a complete supply-chain security audit;
- this round measured no serialization CPU, GC, or Redis-network overhead, so no performance-improvement ratio can be claimed.

## A reusable decision method

When changing a persistence format, confirm at least:

1. How is the new format identified?
2. What old formats exist, and can each be decoded?
3. Where are untrusted types rejected?
4. Must old consumers keep reading?
5. How does cutover avoid overwriting concurrent writes?
6. Are TTL, expiry, and sidecars kept consistent?
7. How does rollback decide that the current value still belongs to this migration?
8. Does one migration failure stop the whole flow, or is it isolated per key?

If these questions have no answers, changing a serializer configuration is not the same as completing a migration.

