---
title: "JJWT 0.13.0：署名アルゴリズムを明示固定し、key 型で検証する"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java セキュリティ・並行処理とテスト"
kind: concept
status: active
draft: true
sources: ["jjwt-013-security-api-contract", "jjwt-013-security-api-contract-correction"]
related: ["java-online-performance-debug"]
tags: ["JJWT", "JWT", "JWS", "Security", "HS256", "RS256", "Authentication"]
description: "JJWT 0.13.0 における signWith(Key) の推奨アルゴリズムのヒューリスティック、二引数の明示アルゴリズム API、verifyWith の SecretKey/PublicKey 型境界、audience builder の移行方法を説明する。"
toc: true
---

**結論優先**：JJWT 0.13.0 の `signWith(Key)` は key のアルゴリズム名と強度で推奨アルゴリズムを選ぶ。プロトコルが `HS256`、`RS256`、`PS*` の固定を要求する場合は `signWith(key, Jwts.SIG.*)` を使うべきだ。検証に秘密鍵や非推奨の汎用 `setSigningKey(Key)` を使ってはならない。`verifyWith(SecretKey)` か `verifyWith(PublicKey)` を使い、token header の `alg` とサーバー側で許可するアルゴリズム戦略は分けて監査する。

## 適用バージョンとシナリオ

このページは JJWT `0.13.0` の固定 tag だけに責任を持ち、次に当てはまる：

- 旧 JJWT から 0.12/0.13 API への移行；
- 署名側が実際に使った HMAC/RSA アルゴリズムの確認；
- 署名 key、検証 key、`aud` claim builder の区別；
- 「同じコードで key の長さを変えたら token の `alg` が変わった」という調査。

JJWT 1.0 はこのページで言及する非推奨 API を削除する可能性がある。アップグレード後はソースで再確認する。

## 1. `signWith(Key)` をプロトコル設定として扱わない

JJWT 0.13.0 の単引数エントリポイントは次だ：

```java
JwtBuilder signWith(Key key) throws InvalidKeyException;
```

これは key の推奨署名アルゴリズムを使う：

- `SecretKey` は JCA アルゴリズム名 `HmacSHA256`/`HmacSHA384`/`HmacSHA512` とビット長区間で `HS256`（256–383 ビット）、`HS384`（384–511 ビット）、`HS512`（≥512 ビット）を選ぶ；
- RSA の `PrivateKey` はビット長区間で推奨する：2048–3071 → `RS256`、3072–4095 → `RS384`、≥4096 → `RS512`；
- `PS256`、`PS384`、`PS512` はこのヒューリスティックでは自動選択されない；
- key のアルゴリズム名の不一致（HMAC key の JCA 名が `HmacSHA*` でない）や強度不足（HMAC <256 ビット、RSA <2048 ビット）は、「安全に別のアルゴリズムへ切り替える」のではなく失敗する。上記ビット長区間は `signWith(Key)` の Javadoc 推奨表で、impl の HMAC 選択は JCA 名一致後に最小ビット長だけを検査し区間上限は検証しない。したがって区間上限はドキュメント上の推奨であり強制境界ではない。

したがって、単引数形式は JJWT の推奨規則を受け入れるのに適するが、クロスサービスプロトコルの唯一の宣言としては不十分だ。key の長さ、JCA アルゴリズム名、生成方式の変化が推奨結果を変え得る。

## 2. プロトコルがアルゴリズム固定を要求するときは二引数 API を使う

```java
Jwts.builder()
    .subject("subject")
    .signWith(rsaPrivateKey, Jwts.SIG.RS256)
    .compact();
```

0.12.0 以降の推奨署名エントリポイントはジェネリックの `signWith(K, SecureDigestAlgorithm<? super K, ?>)` だ。`Jwts.SIG.RS256` は型安全な `SignatureAlgorithm` インスタンスであり、JJWT は key がそのアルゴリズムに許可されているかを依然として検査する。つまり明示指定は key の型と強度の制限を迂回するものではない。

HMAC key はアルゴリズム要件を満たすバイナリ鍵を使うべきだ。例えば：

```java
SecretKey key = Keys.hmacShaKeyFor(randomBytes);
String token = Jwts.builder()
    .subject("subject")
    .signWith(key, Jwts.SIG.HS256)
    .compact();
```

普通のパスワード文字列をそのまま HMAC key にしてはならない。`Keys.hmacShaKeyFor(byte[])` は長さ不足のとき `WeakKeyException` を投げる。

### 旧 API の移行

| 旧形式                                    | 推奨形式                             |
| ----------------------------------------- | ------------------------------------ |
| `signWith(SignatureAlgorithm.HS256, ...)` | `signWith(key, Jwts.SIG.HS256)`      |
| `signWith(key, oldSignatureAlgorithm)`    | `signWith(key, Jwts.SIG.RS256)` など |

旧 `signWith(Key, SignatureAlgorithm)` は 0.13.0 にも存在するが非推奨で、1.0 までに削除が予定されている。

## 3. `verifyWith` は key 型で責務を分ける

```java
JwtParser parser = Jwts.parser()
    .verifyWith(publicKey)
    .build();
```

非推奨でない API は次の二つだけだ：

- `verifyWith(SecretKey)`：`HS256`、`HS384`、`HS512` など MAC 系アルゴリズム用；
- `verifyWith(PublicKey)`：RSA、PSS、EC、EdDSA など非対称署名用；
- `PrivateKey` は検証に使えない：非推奨でない `verifyWith` には `PrivateKey` のオーバーロードがなくコンパイル時に失敗する。旧 `setSigningKey(Key)` は `PrivateKey` に対して `InvalidKeyException` を投げる。

検証アルゴリズムは key から自動推論されない。parser は JWS header の `alg` でアルゴリズムを探し、設定された key で検証する。header、key 型、実際のアルゴリズムが一致しなければ検証は失敗する。つまり：

1. 署名側は二引数 API でプロトコルアルゴリズムを固定する；
2. 検証側はサービス型に応じて SecretKey か PublicKey を設定する；
3. 許可する `alg` 集合を別途監査し、「検証できた」を「プロトコル適合」と誤解しない。

### 旧検証 API の移行

```java
// 旧 API：非推奨
Jwts.parser().setSigningKey(key);

// HMAC
Jwts.parser().verifyWith(secretKey).build();

// RSA/EC/EdDSA
Jwts.parser().verifyWith(publicKey).build();
```

汎用 `setSigningKey(Key)` の問題は「動かないこと」ではなく、明示的に区別すべき key 型をランタイムの転送の中に隠すことにある。

## 4. `aud` はコレクション式 builder を使う

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

`audience()` は `AudienceCollection<JwtBuilder>` を返す。`add` は null、空白、既存の値を無視し、`and()` は親 builder に戻る。`setAudience(String)` は非推奨で、`single(String)` は RFC が許す単一文字列レシーバーのためにだけ残されている。

注意：`aud` claim を書き込むことは、ビジネス側の audience 検証を完了することと同義ではない。パース後もアプリの issuer、audience、有効期間、鍵ローテーション戦略に従って claims を検証する必要がある。これらの戦略はこのページの builder API が自動決定するものではない。

## 最小検証チェックリスト

隔離テストで次の四つのアサーションを保持する：

1. 32 バイトの HMAC key を `signWith(key)` で署名すると header の `alg` が `HS256` になる；
2. `signWith(privateKey, Jwts.SIG.RS256)` と `verifyWith(publicKey)` で round-trip が完了できる；
3. `setSigningKey(rsaPrivateKey)`（旧 API）は必ず失敗する（`InvalidKeyException`）。非推奨でない `verifyWith(rsaPrivateKey)` はコンパイルできない。
4. `audience().add("service-a").and()` は空白や重複 audience を再追加しない。

この回では API、Javadoc、実装ソース、README の証拠だけを固定しており、上記のコンパイル/実行テストは実行していない。テスト結果は静的ソースから推論できない。

## よくある誤解と境界

- **誤解：** key が十分長ければ自動で望むアルゴリズムになる。**事実：** 単引数エントリポイントは key の JCA アルゴリズム名と JJWT の推奨規則にも依存する。プロトコルアルゴリズムは明示的に渡すべきだ。
- **誤解：** `verifyWith` は公開鍵から token のアルゴリズムを決める。**事実：** parser はまず JWS header の `alg` を読み、それから一致検証を実行する。
- **誤解：** `PrivateKey` は公開鍵情報を含むので検証もできる。**事実：** 非推奨でない `verifyWith` には `PrivateKey` オーバーロードがなくコンパイル時に拒否される。旧 `setSigningKey(Key)` は `PrivateKey` に対して実行時に `InvalidKeyException` を投げる。
- **誤解：** `audience().add` は audience 認可の完了と同じだ。**事実：** builder は claim を書くだけであり、ビジネス認可は独立した検証が必要だ。
- このページは JWE、JWKS ローテーション、key locator、具体的な issuer/audience 検証実装は扱わない。

## 証拠と関連ページ

- **情報源の事実：** 初期 raw と `jjwt-013-security-api-contract-correction` が 0.13.0 の API 宣言、実装分岐、README 例を共同で固定する。
- **本ページの総合：** アルゴリズム選択、明示署名、検証 key 型、claims builder を移行とトラブルシューティングの順序に整理する。
- [Java オンライン性能トラブルシューティング：症状から証拠への最小決定木](/ja/note/java-online-performance-debug)
