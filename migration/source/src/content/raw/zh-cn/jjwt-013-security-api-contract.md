---
title: "JJWT 0.13.0 签名、验签与 audience API 契约"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-tag
sourceUrl: "https://github.com/jwtk/jjwt/tree/0.13.0"
immutable: true
tags: [JJWT, JWT, JWS, Security, HS256, RS256, Authentication]
description: "以 JJWT 0.13.0 固定 tag 的 API、实现源码和官方 README 固定 signWith、verifyWith 与 audience builder 的类型边界、算法选择和迁移语义。不含密钥、令牌、私有配置或项目路径。"
---

# JJWT 0.13.0 签名、验签与 audience API 契约

本快照只记录公开源码和 README 能复现的 API 事实。版本边界为 JJWT `0.13.0` tag；JJWT 1.0 可能移除本快照中已弃用的旧 API。

## 固定点与来源

| 项 | 值 |
| --- | --- |
| 版本 | JJWT `0.13.0`，tag `0.13.0` |
| API 来源 | `api/src/main/java/io/jsonwebtoken/JwtBuilder.java`、`JwtParserBuilder.java`、`ClaimsMutator.java`、`Jwts.java` |
| 实现来源 | `impl/src/main/java/io/jsonwebtoken/impl/DefaultJwtBuilder.java`、`DefaultJwtParserBuilder.java`、`DefaultJwtParser.java`、`impl/security/StandardSecureDigestAlgorithms.java`、`DefaultMacAlgorithm.java` |
| 官方说明 | `README.adoc` 的 signing key algorithm selection 与 explicit algorithm sections |

稳定 URL：

- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/JwtBuilder.java
- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/JwtParserBuilder.java
- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/ClaimsMutator.java
- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/api/src/main/java/io/jsonwebtoken/Jwts.java
- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/impl/src/main/java/io/jsonwebtoken/impl/DefaultJwtBuilder.java
- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/impl/src/main/java/io/jsonwebtoken/impl/DefaultJwtParserBuilder.java
- https://raw.githubusercontent.com/jwtk/jjwt/0.13.0/impl/src/main/java/io/jsonwebtoken/impl/DefaultJwtParser.java
- https://github.com/jwtk/jjwt/blob/0.13.0/README.adoc

## API 事实

### 1. `signWith(Key)` 会按 key 推荐算法选择

JJWT 0.13.0 的非弃用单参数入口是：

```java
JwtBuilder signWith(Key key) throws InvalidKeyException;
```

`JwtBuilder` 没有 `signWith(SecretKey)` 专属单参数重载，因此 `SecretKey` 调用会绑定到这个通用入口。实现先调用 `forSigningKey(key)`，再转到双参数 `signWith`。

官方 Javadoc/README 给出的推荐选择包括：

- `SecretKey`：按 JCA 算法名 `HmacSHA256`、`HmacSHA384`、`HmacSHA512` 和密钥最低位长选择 `HS256`、`HS384`、`HS512`。
- RSA `PrivateKey`：按 2048、3072、4096 等位长推荐 `RS256`、`RS384`、`RS512`。
- `PS256`、`PS384`、`PS512` 不由推荐算法启发式自动选择，需要显式传入算法。

实现层按 key 的 JCA 算法名查找 HMAC 算法，并校验最低密钥长度；因此不要把推荐表当作业务策略配置。若签发端必须稳定使用某个算法，应使用双参数入口，不依赖密钥元数据和位长启发式。

`Keys.hmacShaKeyFor(byte[])` 会按输入字节长度生成适用于 HMAC 的 `SecretKey`；长度不足时抛 `WeakKeyException`。生产代码不要用口令字符串直接当 HMAC key。

### 2. 显式算法使用新的泛型重载

0.12.0 起推荐的显式入口是：

```java
<K extends Key>
JwtBuilder signWith(K key, SecureDigestAlgorithm<? super K, ?> alg)
```

例如：

```java
Jwts.builder()
    .subject("subject")
    .signWith(rsaPrivateKey, Jwts.SIG.RS256)
    .compact();
```

`Jwts.SIG.RS256` 的类型是 `SignatureAlgorithm`，其继承 `SecureDigestAlgorithm<PrivateKey, PublicKey>`，因此可与 RSA `PrivateKey` 配合。JJWT 仍会检查 key 是否允许用于指定算法；显式算法不是绕过 key 类型和强度校验的开关。

旧的 `signWith(Key, SignatureAlgorithm)`（旧 enum 类型）在 0.13.0 仍存在但已弃用，迁移时改用 `Jwts.SIG.*` 注册表实例。

### 3. `verifyWith` 只有 SecretKey/PublicKey 两条非弃用路径

JJWT 0.13.0 提供：

```java
JwtParserBuilder verifyWith(SecretKey key);
JwtParserBuilder verifyWith(PublicKey key);
```

- `SecretKey` 用于 MAC 算法，例如 `HS256`、`HS384`、`HS512`。
- `PublicKey` 用于非对称签名，例如 `RS*`、`PS*`、`ES*`、`EdDSA`。
- `PrivateKey` 不能用于验签；实现会抛 `IllegalArgumentException`，因为私钥用于签名，公钥用于验证。
- 非弃用 API 没有通用 `verifyWith(Key)`。旧的 `setSigningKey(Key)` 已弃用，只是按 key 类型转发到上述两条路径。

验签时算法由待解析 JWS 的 `alg` header 查注册表得到，`verifyWith` 提供验证 key，并不根据 key 自动选择算法。token 的 `alg` 与 key 类型或实际算法不匹配时，解析/验签失败。

### 4. `audience()` 是集合式 builder

`JwtBuilder` 通过 `ClaimsMutator` 继承：

```java
AudienceCollection<JwtBuilder> audience();
```

推荐写法：

```java
Jwts.builder()
    .audience()
    .add("service-a")
    .and()
    .compact();
```

`add`/`add(Collection)` 会忽略 null、空白和已存在值；`and()` 回到父 builder。旧的 `setAudience(String)` 已弃用；`AudienceCollection.single(String)` 仍保留以兼容 RFC 允许的单字符串 `aud` 表示，但官方建议优先使用集合式 API。

## 迁移表

| 旧 API | 0.13.0 推荐 API | 变化 |
| --- | --- | --- |
| `signWith(SignatureAlgorithm, ...)` | `signWith(key, Jwts.SIG.RS256)` 等 | 使用类型安全的算法实例 |
| `setSigningKey(Key)` | `verifyWith(SecretKey)` 或 `verifyWith(PublicKey)` | 验签 key 类型显式化 |
| `setAudience(String)` | `audience().add(value).and()` | audience 改为集合 builder |

## 最小验证建议

以下只描述可重复的验证方向，本快照未执行编译或运行测试：

1. 用 `Keys.hmacShaKeyFor(new byte[32])` 签发 token，断言单参数 `signWith(key)` 生成的 header `alg` 为 `HS256`。
2. 用 `Jwts.SIG.RS256.keyPair().build()` 生成密钥对，使用 `signWith(privateKey, Jwts.SIG.RS256)` 签发，再使用 `verifyWith(publicKey)` 解析。
3. 将 `verifyWith(rsaPrivateKey)` 作为负例，断言抛出 `IllegalArgumentException`。
4. 使用 `audience().add("service-a").and()` 后读取 `aud` claim，检查重复值和空白值不会被重复加入。

## 边界与未验证项

- 本快照未编译或运行 JJWT 示例；上述验证步骤是建议，不是本次运行结果。
- RSA 位长分档主要来自 0.13.0 Javadoc/README；本次未单独读取 `RsaSignatureAlgorithm.findByKey` 方法体。
- `Jwts.ENC`、JWE、密钥定位器、JWKS 轮换和具体 issuer/audience 校验策略不在本快照范围内。
- API、弃用状态和推荐算法规则只对 `0.13.0` 固定点负责；升级 JJWT 后需重新读取 API 和实现源码。
