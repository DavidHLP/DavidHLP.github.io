---
title: "Redis serializer の交換は一行の設定変更ではない：object trust から rollback 可能な migration へ"
timestamp: 2026-09-09 00:00:00+08:00
series: "Java の安全性、並行性、テスト"
kind: concept
status: provisional
sources: ["resicache-engineering-highlights-2954fff", "resicache-project-overview"]
related: ["resicache", "redis-jackson-java-time"]
tags: [ResiCache, Redis, Serialization, Security, Migration]
description: "ResiCache の安全な deserialization と migration engine から、wire format、type trust、既存データ migration を一緒に設計すべき理由を説明する。"
toc: true
---

Redis serializer の変更は、一つの Bean を編集するだけに見える。しかし Redis に保存されるのは Java object ではなく bytes である。

旧 cache が JDK serializer や GenericJackson2JsonRedisSerializer を使い、新 serializer が別の envelope を使う場合、直接切り替えると二つの問いが生じる。

1. 新しい code は Redis 内の type information を安全に解釈できるか。
2. 既存の bytes を migration・rollback し、concurrent write を上書きしない方法は何か。

## deserialization の危険は object 作成前に発生する

Jackson の polymorphic data は通常 type identifier を持つ。

```json
{
  "version": 2,
  "payload": {
    "@class": "com.example.User"
  }
}
```

type identifier が Redis 由来で、その内容を別 application、古い program、攻撃者が書ける可能性があるなら、「先に Jackson に type で object を作らせ、business layer で確認する」では遅すぎる。

必要な境界は次である。

```text
bytes を読む
  -> type identifier が許可されるか確認
  -> 通過してから Jackson に object を instantiate させる
```

これは通常の DTO conversion ではなく trust boundary である。

## ResiCache の serializer は三層の制約を持つ

現在の SecureJacksonRedisSerializer には三つの関連 mechanism がある。

### versioned envelope

空でない cache value は次のように包まれる。

```json
{
  "version": 2,
  "payload": "..."
}
```

ここでの version は serialization format version であり、business object version や cache value の CAS token ではない。

### allowlist policy

default で許可される business package prefix は次である。

```text
io.github.davidhlp
```

java.lang、java.time、java.math の一部 type と、明示列挙された collection type も通過できる。

allowlist は単なる「polymorphism を on/off」ではない。次に答える必要がある。

`この完全修飾 class name は cache bytes に現れてよいか？`

現在の設定には注意すべき境界がある。

```text
com.example.*  -> package boundary で match
com.example    -> startsWith で match
```

そのため com.example は com.exampleX.SomeType にも match し得る。厳密な package boundary が必要なら .* 付き prefix、または十分に限定した prefix を使う。

### streaming preflight

serializer は envelope を本当に読む前に streaming parser で次を確認する。

- 設定された type property。
- @class。
- wrapper-array 形式の type id。
- polymorphic payload に現れる type identifier。

確認を通過してから EnvelopeCodec.read に入る。

中心の flow は次の通り。

```java
try (JsonParser parser = objectMapper.createParser(bytes)) {
    validateTypeIdsStreaming(parser);
}

Object envelope = EnvelopeCodec.read(objectMapper, bytes);

if (EnvelopeCodec.version(envelope)
        != EnvelopeCodec.currentVersion()) {
    // failOnUnknownType=true のとき reject
}
```

完全な deserialization security audit ではないが、最も重要な type check を object instantiation 前に置いている。

[SecureJacksonRedisSerializer.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/SecureJacksonRedisSerializer.java#L132-L205) と [WhitelistPolicy.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/main/java/io/github/davidhlp/spring/cache/redis/cache/WhitelistPolicy.java#L89-L134) を参照。

## 古い cache の migration をなぜ支えるのか

新 serializer が安全でも、古い cache は現在の envelope でない可能性がある。

migration config は四つの phase を明確に分ける。

| phase | behavior | source key を変更するか |
|---|---|---|
| SHADOW_READ | old value を decode・validate | しない |
| DUAL_WRITE | old value を残し、新 envelope を sidecar に write | しない |
| CUTOVER | old value を backup して source を replace | する |
| ROLLBACK | backup から old value を restore | する |

default phase は SHADOW_READ であり、application startup 時に自動 migration は実行しない。

## SHADOW_READ：まず既存データを知る

SHADOW_READ は意図的に保守的である。

```text
candidate key を scan
  -> current envelope かを識別
  -> 設定した legacy serializer で decode を試す
  -> 成功/失敗を記録
  -> Redis には何も write しない
```

migration 前の visibility を解決する。

旧 format と decode 可能な割合を先に知らずに直接 cutover すると、compatibility failure を通常の cache miss に見せてしまう。

## DUAL_WRITE：まず sidecar に書く

DUAL_WRITE は old source key を残し、新 envelope を sidecar に書く。

```text
user:42
user:42:__resicache_envelope
```

sidecar は source key の TTL を引き継ぐ。同じ内容で再度 migration しても、不要な再 write はしない。

利点は二つある。

- old consumer は old source key を読み続けられる。
- main data を replace する前に new format を検証できる。

## CUTOVER：backup、compare、replace

cutover の順序は次の通り。

```text
old source を読む
  -> legacy backup sidecar に書く
  -> source が old bytes のままか atomic compare
  -> 一致した場合だけ new envelope に replace
  -> KEEPTTL で lifetime を保持
```

重要な Lua semantics は次の通り。

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
    redis.call('set', KEYS[1], ARGV[2], 'KEEPTTL')
    return 1
else
    return 0
end
```

migration が old value を読んだ後に business code が new value を write すると、compare は失敗する。

```text
migration が old を読む
business が new を書く
migration が old -> envelope(old) を試みる
compare failure、新しい write を保護
```

migration を必ず完了させることが目的ではない。migration tool が新しい data overwriter になるのを防ぐ。

## ROLLBACK も盲目的に overwrite してはいけない

rollback は backup を source に単純に書き戻さない。

current source が expected envelope のままか先に確認する。

```text
current value が今回の cutover で生成した value のまま
  -> old value の restore を許可

current value が business code により再度 write 済み
  -> rollback を拒否し、新しい write を保護
```

rollback も unconditional overwrite ではなく conditional recovery である。

## なぜ Redis を消去して切り替えないのか

cache が本当に捨てられ、business が一度の full source reload を受け入れられるなら、old cache を消して serializer を切り替える方が単純かもしれない。

ただし次の前提をすべて満たす必要がある。

- cache が失うと困る state を含まない。
- full source-load pressure を受け入れられる。
- すべての instance が同時に切り替えられる。
- old consumer が old format を書き続けない。
- canary、sidecar validation、rollback が不要。

現在の migration engine は、単純に消去できない、既存 format を観測したい、concurrent write を保護したい場合に向く。そのコストは次である。

- 複数の migration phase。
- sidecar と backup key。
- operator control。
- legacy decoder。
- migration report と failure handling。
- Redis wire format の追加 maintenance。

これは自動的に「より高度」という意味ではない。migration 中の control と運用複雑性を交換している。

## type safety と migration safety は同時に成立する必要がある

legacy decoder も allowlist を bypass してはいけない。

test で使う悪意ある old JSON は次である。

```json
{
  "@class": "com.attacker.Gadget"
}
```

old format 由来だからと信頼せず、migration 中も reject される。

migration は security boundary 外の一時 script ではない。同じ untrusted または uncertain data を読むため、type constraint を再利用する必要がある。

## test が検証する境界

serializer test は次を含む。

- allowlist 外の @class を拒否。
- wrapper-array type identifier を拒否。
- custom type property を拒否。
- allowlist 内 type の round-trip。
- serializer factory の設定伝達。
- refresh metadata のない古い CachedValue の read。

real Redis integration test の SerializationMigrationIntegrationTest は 8 test がすべて通過し、次をカバーする。

- SHADOW_READ は source key に write しない。
- DUAL_WRITE は old value を保持し idempotent に実行できる。
- sidecar は TTL を保持する。
- CUTOVER は old bytes を backup する。
- ROLLBACK は old value を restore する。
- concurrent business write の後は overwrite を拒否する。
- mixed dataset の allowlist 外 type を拒否する。

[SerializationMigrationIntegrationTest.java](https://github.com/DavidHLP/ResiCache/blob/2954fff217257e9cf7c906450a75070d5e092637/src/test/java/io/github/davidhlp/spring/cache/redis/cache/SerializationMigrationIntegrationTest.java#L61-L169) を参照。

## コストと失敗境界

この設計の境界も明示する必要がある。

- envelope version は format version だけで、任意の過去 format を自動 migration しない。
- current legacy decoder が support する format は限定され、別 serializer には別 decoder が必要。
- VersionEnvelope.payload の JsonTypeInfo は固定の @class を使う。type property を変えるなら annotation と config を同時に変更する。
- default allowlist は自身の package name を優先し、custom business type は明示設定が必要。
- preflight は sample を scan するだけで Redis 全体に old format がないとは証明しない。
- migration scan は maxKeys、pattern、batch size に制限され、全 database の一つの transaction ではない。
- dryRun は risk を下げるが、real cutover test の代わりにはならない。
- allowlist と streaming preflight は完全な supply-chain security audit ではない。
- 本ラウンドでは serialization CPU、GC、Redis network overhead を測定しておらず、性能改善比率は主張できない。

## 移植できる判断方法

persistence format を変更するとき、少なくとも次を確認する。

1. 新 format はどう識別するか。
2. old format はいくつあり、各々 decode できるか。
3. untrusted type はどこで reject するか。
4. old consumer の read 能力を残す必要があるか。
5. cutover は concurrent write の overwrite をどう防ぐか。
6. TTL、expiry、sidecar をどう一致させるか。
7. rollback は current value が今回の migration に属するかをどう判定するか。
8. migration failure は全体を止めるか、key ごとに隔離して続行するか。

答えがなければ、serializer config を変更しただけでは migration 完了とは言えない。

