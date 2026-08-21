---
title: "JJWT 0.13.0：显式固定签名算法，按 key 类型验签"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java 后端安全"
kind: concept
status: active
sources: ["jjwt-013-security-api-contract", "jjwt-013-security-api-contract-correction"]
related: ["java-online-performance-debug"]
tags: ["JJWT", "JWT", "JWS", "Security", "HS256", "RS256", "Authentication"]
description: "说明 JJWT 0.13.0 中 signWith(Key) 的推荐算法启发式、双参数显式算法 API、verifyWith 的 SecretKey/PublicKey 类型边界，以及 audience builder 的迁移方式。"
toc: true
---

**结论优先**：JJWT 0.13.0 的 `signWith(Key)` 会根据 key 的算法名和强度选择推荐算法；如果协议要求固定 `HS256`、`RS256` 或 `PS*`，应使用 `signWith(key, Jwts.SIG.*)`。验签不要用私钥或已弃用的通用 `setSigningKey(Key)`：使用 `verifyWith(SecretKey)` 或 `verifyWith(PublicKey)`，并把 token header 的 `alg` 与服务端允许的算法策略分开审计。

## 适用版本与场景

本页只对 JJWT `0.13.0` 固定 tag 负责，适用于：

- 从旧版 JJWT 迁移到 0.12/0.13 API；
- 需要核对签发端到底使用了哪一个 HMAC/RSA 算法；
- 需要区分签名 key、验签 key 和 `aud` claim builder；
- 排查“同一套代码换了 key 长度后 token 的 `alg` 发生变化”。

JJWT 1.0 可能移除本页提到的弃用 API；升级后要重新核对源码。

## 1. 不要把 `signWith(Key)` 当作协议配置

JJWT 0.13.0 的单参数入口是：

```java
JwtBuilder signWith(Key key) throws InvalidKeyException;
```

它使用 key 的推荐签名算法：

- `SecretKey` 根据 JCA 算法名 `HmacSHA256`/`HmacSHA384`/`HmacSHA512` 和位长区间选择 `HS256`（256–383 位）、`HS384`（384–511 位）、`HS512`（≥512 位）；
- RSA `PrivateKey` 按位长区间推荐：2048–3071 → `RS256`、3072–4095 → `RS384`、≥4096 → `RS512`；
- `PS256`、`PS384`、`PS512` 不由这套启发式自动选择；
- key 算法名不匹配（HMAC key 的 JCA 名非 `HmacSHA*`）或强度不足（HMAC <256 位、RSA <2048 位）时会失败，而不是安全地“随便换一个算法”；以上位长区间是 `signWith(Key)` Javadoc 推荐表，impl 的 HMAC 选择在 JCA 名匹配后只做最低位长检查，不校验区间上限，因此区间上限是文档建议而非强制边界。

因此，单参数写法适合接受 JJWT 的推荐规则，不适合作为跨服务协议的唯一声明。密钥长度、JCA 算法名或生成方式变化，都可能改变推荐结果。

## 2. 协议需要固定算法时用双参数 API

```java
Jwts.builder()
    .subject("subject")
    .signWith(rsaPrivateKey, Jwts.SIG.RS256)
    .compact();
```

0.12.0 起推荐的签名入口是泛型 `signWith(K, SecureDigestAlgorithm<? super K, ?>)`。`Jwts.SIG.RS256` 是类型安全的 `SignatureAlgorithm` 实例；JJWT 仍会检查 key 是否允许用于该算法，所以显式指定不是绕过 key 类型和强度限制。

HMAC key 应使用满足算法要求的二进制密钥，例如：

```java
SecretKey key = Keys.hmacShaKeyFor(randomBytes);
String token = Jwts.builder()
    .subject("subject")
    .signWith(key, Jwts.SIG.HS256)
    .compact();
```

不要把普通密码字符串直接作为 HMAC key。`Keys.hmacShaKeyFor(byte[])` 会在长度不足时抛 `WeakKeyException`。

### 旧 API 迁移

| 旧写法                                    | 推荐写法                           |
| ----------------------------------------- | ---------------------------------- |
| `signWith(SignatureAlgorithm.HS256, ...)` | `signWith(key, Jwts.SIG.HS256)`    |
| `signWith(key, oldSignatureAlgorithm)`    | `signWith(key, Jwts.SIG.RS256)` 等 |

旧的 `signWith(Key, SignatureAlgorithm)` 在 0.13.0 仍存在，但已经弃用，目标是 1.0 前移除。

## 3. `verifyWith` 以 key 类型划分职责

```java
JwtParser parser = Jwts.parser()
    .verifyWith(publicKey)
    .build();
```

非弃用 API 只有两类：

- `verifyWith(SecretKey)`：用于 MAC 类算法，如 `HS256`、`HS384`、`HS512`；
- `verifyWith(PublicKey)`：用于 RSA、PSS、EC、EdDSA 等非对称签名；
- `PrivateKey` 不能用于验签：非弃用 `verifyWith` 无 `PrivateKey` 重载，编译期即失败；旧 `setSigningKey(Key)` 对 `PrivateKey` 抛 `InvalidKeyException`。

验签算法不是由 key 自动推断的。解析器按 JWS header 的 `alg` 查找算法，再用配置的 key 验证；如果 header、key 类型或实际算法不匹配，验签失败。也就是说：

1. 签发端用双参数 API 固定协议算法；
2. 验签端按服务类型配置 SecretKey 或 PublicKey；
3. 另行审计允许的 `alg` 集合，不要把“能验签”误当作“符合协议”。

### 旧验签 API 迁移

```java
// 旧 API：已弃用
Jwts.parser().setSigningKey(key);

// HMAC
Jwts.parser().verifyWith(secretKey).build();

// RSA/EC/EdDSA
Jwts.parser().verifyWith(publicKey).build();
```

通用 `setSigningKey(Key)` 的问题不是“不能工作”，而是把本应显式区分的 key 类型隐藏在运行时转发中。

## 4. `aud` 使用集合式 builder

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

`audience()` 返回 `AudienceCollection<JwtBuilder>`；`add` 会忽略 null、空白和已存在值，`and()` 回到父 builder。`setAudience(String)` 已弃用，`single(String)` 只为 RFC 允许的单字符串接收方保留。

注意：写入 `aud` claim 不等于完成业务侧 audience 校验。解析后仍需按应用的 issuer、audience、有效期和密钥轮换策略验证 claims；这些策略不由本页的 builder API 自动决定。

## 最小验证清单

在隔离测试中保留以下四个断言：

1. 32 字节 HMAC key 经 `signWith(key)` 签发后，header `alg` 为 `HS256`；
2. `signWith(privateKey, Jwts.SIG.RS256)` 与 `verifyWith(publicKey)` 可以完成 round-trip；
3. `setSigningKey(rsaPrivateKey)`（旧 API）必须失败（`InvalidKeyException`）；非弃用 `verifyWith(rsaPrivateKey)` 无法编译。
4. `audience().add("service-a").and()` 不会重复加入空白或重复 audience。

本批只固定了 API、Javadoc、实现源码和 README 证据，未执行上述编译/运行测试；测试结果不能从静态源码推断。

## 常见误区与边界

- **误区：** key 足够长就一定自动得到想要的算法。**事实：** 单参数入口还依赖 key 的 JCA 算法名和 JJWT 的推荐规则；协议算法应显式传入。
- **误区：** `verifyWith` 会根据公钥决定 token 的算法。**事实：** parser 先读取 JWS header 的 `alg`，再执行匹配校验。
- **误区：** `PrivateKey` 也可以验签，因为它包含公钥信息。**事实：** 非弃用 `verifyWith` 没有 `PrivateKey` 重载，编译期即拒绝；旧 `setSigningKey(Key)` 对 `PrivateKey` 在运行时抛 `InvalidKeyException`。
- **误区：** `audience().add` 就等于完成 audience 授权。**事实：** builder 只写 claim，业务授权仍需独立校验。
- 本页不覆盖 JWE、JWKS 轮换、密钥定位器和具体 issuer/audience 校验实现。

## 证据与相关页面

- **来源事实：** 初始 raw 与 `jjwt-013-security-api-contract-correction` 共同固定 0.13.0 的 API 声明、实现分支和 README 示例。
- **本页综合：** 将算法选择、显式签名、验签 key 类型和 claims builder 组织成迁移与排障顺序。
- [Java 线上性能排障：从症状到证据的最小决策树](/note/java-online-performance-debug)
