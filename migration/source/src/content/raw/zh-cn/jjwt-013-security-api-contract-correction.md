---
title: "JJWT 0.13.0 API 契约更正：算法推荐边界与 PrivateKey 验签类型"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-tag-correction
sourceUrl: "https://github.com/jwtk/jjwt/tree/0.13.0"
immutable: true
correctionOf: "jjwt-013-security-api-contract"
tags: [JJWT, JWT, JWS, Security, HS256, RS256, Authentication]
description: "对同日 JJWT 0.13.0 初始 raw 补充源码校正：signWith(Key) 推荐算法的位长分档、HMAC 实现只校验最低位长，以及 verifyWith 仅有 SecretKey/PublicKey 重载和旧 setSigningKey(Key) 对 PrivateKey 的异常边界。"
---

# JJWT 0.13.0 API 契约更正

本文件是 `jjwt-013-security-api-contract` 的独立更正快照，不覆盖、不删除初始 raw。两份文件共同组成 JJWT 0.13.0 的证据链。

## 1. `signWith(Key)` 推荐算法边界

JJWT 0.13.0 `JwtBuilder.signWith(Key)` Javadoc 推荐表与实现边界如下：

- `SecretKey`：按 JCA 算法名 `HmacSHA256`、`HmacSHA384`、`HmacSHA512` 和位长区间选择 `HS256`（256–383 位）、`HS384`（384–511 位）、`HS512`（≥512 位）；位长小于 256 会被拒绝；
- RSA `PrivateKey`：按位长区间 2048–3071 → `RS256`、3072–4095 → `RS384`、≥4096 → `RS512`；位长小于 2048 会被拒绝；
- `PS256`、`PS384`、`PS512` 不由推荐算法启发式自动选择，需显式传入；
- HMAC 实现先按 JCA 名（大小写不敏感，也接受相应 OID）匹配算法，再只校验该算法的最低位长，不校验 Javadoc 区间上限；因此上限是推荐表语义，不是 HMAC 实现的硬拒绝边界；
- 通用名 `RSA` 的 key 按 ≥2048/≥3072/≥4096 的累计下限分档；OID 命名的 PKCS#1 v1.5 key 可由 OID 固定算法，但仍需至少 2048 位。

因此，推荐表不是业务协议配置。需要稳定协议算法时，必须使用双参数 `signWith(key, Jwts.SIG.*)`。

## 2. `verifyWith` 与 `PrivateKey`

`JwtParserBuilder` 的非弃用 API 只有：

```java
verifyWith(SecretKey key)
verifyWith(PublicKey key)
```

没有通用 `verifyWith(Key)`，也没有 `verifyWith(PrivateKey)` 重载；静态类型为 `PrivateKey` 的调用在编译期即无适用方法。旧 API：

```java
Jwts.parser().setSigningKey(rsaPrivateKey)
```

对 `PrivateKey` 在运行时抛 `InvalidKeyException`。私钥用于签名，公钥用于验证。

## 3. 最小负例

- 编译期负例：`Jwts.parser().verifyWith(rsaPrivateKey)` 无法解析到适用重载；
- 运行时负例：旧 `setSigningKey(rsaPrivateKey)` 抛 `InvalidKeyException`；
- 不能用“实现会抛 IllegalArgumentException”概括这两个路径，因为非弃用路径首先是编译期类型拒绝，旧 `Key` 路径有专门的 `InvalidKeyException` 分支。

## 固定来源

- `JwtBuilder.java`（signWith Javadoc）：<https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/JwtBuilder.java>
- `JwtParserBuilder.java`（verifyWith 重载）：<https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/JwtParserBuilder.java>
- `DefaultJwtParserBuilder.java`（旧 setSigningKey 转发/异常）：<https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/impl/src/main/java/io/jsonwebtoken/impl/DefaultJwtParserBuilder.java>
- `Keys.java`：<https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/security/Keys.java>
- `Jwts.java`：<https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/Jwts.java>

以上是同一固定 tag 的公开源码；本更正仍未运行编译/测试。
