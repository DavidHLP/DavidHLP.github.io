---
title: "JJWT 0.13.0: Explicitly Fixing the Signature Algorithm, Verifying by Key Type"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java Backend Security"
kind: concept
status: active
draft: true
sources: ["jjwt-013-security-api-contract", "jjwt-013-security-api-contract-correction"]
related: ["java-online-performance-debug"]
tags: ["JJWT", "JWT", "JWS", "Security", "HS256", "RS256", "Authentication"]
description: "Explains the recommended algorithm heuristic of signWith(Key), the two-argument explicit-algorithm API, the SecretKey/PublicKey type boundaries of verifyWith, and the migration path for the audience builder in JJWT 0.13.0."
toc: true
---

**Conclusion first**: JJWT 0.13.0's `signWith(Key)` selects a recommended algorithm from the key's algorithm name and strength; if the protocol requires a fixed `HS256`, `RS256`, or `PS*`, use `signWith(key, Jwts.SIG.*)`. Do not verify with a private key or the deprecated generic `setSigningKey(Key)`: use `verifyWith(SecretKey)` or `verifyWith(PublicKey)`, and audit the token header's `alg` separately from the server-side allowed algorithm policy.

## Applicable versions and scenarios

This page is only responsible for the fixed JJWT `0.13.0` tag, and applies to:

- Migrating from older JJWT versions to the 0.12/0.13 API;
- Confirming which HMAC/RSA algorithm the signing side actually used;
- Distinguishing the signing key, verification key, and the `aud` claim builder;
- Investigating "the token's `alg` changed after the same code switched key lengths".

JJWT 1.0 may remove the deprecated APIs mentioned on this page; re-verify against the source after upgrading.

## 1. Do not treat `signWith(Key)` as protocol configuration

JJWT 0.13.0's single-argument entry point is:

```java
JwtBuilder signWith(Key key) throws InvalidKeyException;
```

It uses the key's recommended signing algorithm:

- `SecretKey` selects `HS256` (256–383 bits), `HS384` (384–511 bits), or `HS512` (≥512 bits) based on the JCA algorithm name `HmacSHA256`/`HmacSHA384`/`HmacSHA512` and bit-length range;
- RSA `PrivateKey` is recommended by bit-length range: 2048–3071 → `RS256`, 3072–4095 → `RS384`, ≥4096 → `RS512`;
- `PS256`, `PS384`, and `PS512` are not automatically selected by this heuristic;
- A mismatch in the key's algorithm name (an HMAC key whose JCA name is not `HmacSHA*`) or insufficient strength (HMAC <256 bits, RSA <2048 bits) fails rather than safely "switching to another algorithm"; the bit-length ranges above are the `signWith(Key)` Javadoc recommendation table. After the JCA name matches, the impl only performs a minimum bit-length check for HMAC selection and does not validate the upper range bound, so the upper bounds are documentation suggestions, not enforced boundaries.

Therefore, the single-argument form is suitable for accepting JJWT's recommended rules, but is not a sufficient sole declaration of a cross-service protocol. Changes in key length, JCA algorithm name, or generation method can all change the recommended result.

## 2. Use the two-argument API when the protocol needs a fixed algorithm

```java
Jwts.builder()
    .subject("subject")
    .signWith(rsaPrivateKey, Jwts.SIG.RS256)
    .compact();
```

Since 0.12.0, the recommended signing entry point is the generic `signWith(K, SecureDigestAlgorithm<? super K, ?>)`. `Jwts.SIG.RS256` is a type-safe `SignatureAlgorithm` instance; JJWT still checks whether the key is permitted for that algorithm, so an explicit specification is not a way around key type and strength restrictions.

An HMAC key should be a binary key that satisfies the algorithm requirements, for example:

```java
SecretKey key = Keys.hmacShaKeyFor(randomBytes);
String token = Jwts.builder()
    .subject("subject")
    .signWith(key, Jwts.SIG.HS256)
    .compact();
```

Do not use a plain password string directly as an HMAC key. `Keys.hmacShaKeyFor(byte[])` throws `WeakKeyException` when the length is insufficient.

### Old API migration

| Old form | Recommended form |
| --- | --- |
| `signWith(SignatureAlgorithm.HS256, ...)` | `signWith(key, Jwts.SIG.HS256)` |
| `signWith(key, oldSignatureAlgorithm)` | `signWith(key, Jwts.SIG.RS256)`, etc. |

The old `signWith(Key, SignatureAlgorithm)` still exists in 0.13.0 but is deprecated, with removal targeted before 1.0.

## 3. `verifyWith` divides responsibilities by key type

```java
JwtParser parser = Jwts.parser()
    .verifyWith(publicKey)
    .build();
```

There are only two non-deprecated forms:

- `verifyWith(SecretKey)`: for MAC-type algorithms such as `HS256`, `HS384`, `HS512`;
- `verifyWith(PublicKey)`: for asymmetric signatures such as RSA, PSS, EC, EdDSA;
- A `PrivateKey` cannot be used for verification: the non-deprecated `verifyWith` has no `PrivateKey` overload, so it fails at compile time; the old `setSigningKey(Key)` throws `InvalidKeyException` for a `PrivateKey`.

The verification algorithm is not automatically inferred from the key. The parser looks up the algorithm from the JWS header's `alg`, then verifies with the configured key; if the header, key type, or actual algorithm does not match, verification fails. That is to say:

1. The signing side fixes the protocol algorithm with the two-argument API;
2. The verification side configures a SecretKey or PublicKey according to the service type;
3. Audit the allowed `alg` set separately; do not mistake "can verify" for "conforms to the protocol".

### Old verification API migration

```java
// Old API: deprecated
Jwts.parser().setSigningKey(key);

// HMAC
Jwts.parser().verifyWith(secretKey).build();

// RSA/EC/EdDSA
Jwts.parser().verifyWith(publicKey).build();
```

The problem with the generic `setSigningKey(Key)` is not that it "does not work", but that it hides key types that should be explicitly distinguished in runtime forwarding.

## 4. `aud` uses a collection-style builder

```java
String token = Jwts.builder()
    .subject("subject")
    .audience()
    .add("service-a")
    .add("service-b")
    .and()
    .signWith(key, Jwts.SIG.HS256)
    .compact();
```

`audience()` returns an `AudienceCollection<JwtBuilder>`; `add` ignores null, blank, and already-present values, and `and()` returns to the parent builder. `setAudience(String)` is deprecated, and `single(String)` is retained only for the RFC-permitted single-string recipient.

Note: writing the `aud` claim is not the same as completing business-side audience validation. After parsing, claims must still be validated against the application's issuer, audience, validity period, and key rotation policy; these policies are not decided automatically by this page's builder API.

## Minimal verification checklist

Keep the following four assertions in an isolated test:

1. A 32-byte HMAC key signed via `signWith(key)` produces a header `alg` of `HS256`;
2. `signWith(privateKey, Jwts.SIG.RS256)` and `verifyWith(publicKey)` can complete a round-trip;
3. `setSigningKey(rsaPrivateKey)` (old API) must fail (`InvalidKeyException`); the non-deprecated `verifyWith(rsaPrivateKey)` does not compile.
4. `audience().add("service-a").and()` does not add blank or duplicate audiences again.

This batch only pinned the API, Javadoc, implementation source, and README evidence; the compile/runtime tests above were not executed, and test results cannot be inferred from static source.

## Common misconceptions and boundaries

- **Misconception:** a sufficiently long key always automatically yields the desired algorithm. **Fact:** the single-argument entry point also depends on the key's JCA algorithm name and JJWT's recommendation rules; the protocol algorithm should be passed explicitly.
- **Misconception:** `verifyWith` determines the token's algorithm from the public key. **Fact:** the parser first reads the JWS header's `alg`, then performs a matching check.
- **Misconception:** a `PrivateKey` can also verify because it contains public-key information. **Fact:** the non-deprecated `verifyWith` has no `PrivateKey` overload and rejects it at compile time; the old `setSigningKey(Key)` throws `InvalidKeyException` at runtime for a `PrivateKey`.
- **Misconception:** `audience().add` is equivalent to completing audience authorization. **Fact:** the builder only writes the claim; business authorization still requires independent validation.
- This page does not cover JWE, JWKS rotation, key locators, or concrete issuer/audience validation implementations.

## Evidence and related pages

- **Source facts:** the initial raw and `jjwt-013-security-api-contract-correction` together pin 0.13.0's API declarations, implementation branches, and README examples.
- **This page's synthesis:** organizes algorithm selection, explicit signing, verification key types, and the claims builder into a migration and troubleshooting order.
- [Java online performance troubleshooting: minimal decision tree from symptom to evidence](/en/note/java-online-performance-debug)
