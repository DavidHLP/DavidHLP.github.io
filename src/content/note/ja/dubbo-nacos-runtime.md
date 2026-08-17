---
title: "Dubbo + Nacos：登録名と group/version を先に確認してから、本物の smoke test を実行する"
timestamp: 2026-08-13 00:00:00+08:00
series: "マイクロサービスと RPC"
kind: concept
status: active
draft: true
sources: ["dubbo-nacos-runtime-registration", "dubbo-nacos-runtime-registration-correction"]
related: ["multi-service-readiness", "microservice-data-ownership"]
tags: ["Apache Dubbo", "Nacos", "Service Discovery", "Registry", "RPC", "Smoke Test"]
description: "Apache Dubbo 3.3.6 と Nacos 公式資料に基づき、インターフェースレベル/アプリケーションレベルの登録名、metadata、group/version のマッチング、起動チェック、本物の Nacos smoke test の最小境界を説明する。"
toc: true
---

**結論を先に**：Dubbo + Nacos のトラブルシューティングは「レジストリにインスタンスがいる」だけでは足りない。まずインターフェースレベルの service name `providers:{interface}:{version}:{group}`、Nacos group、provider URL metadata、consumer の version/group サブスクリプション条件を確認してから、アプリケーションレベルのディスカバリが必要か判断する。デフォルトの `register-mode=all` はアプリ名サービスとインターフェースレベルのサービスを同時に生み出し得る。エンドツーエンドの RPC を証明できるのは、本物の Nacos provider/consumer smoke test だけだ。

## バージョンと範囲

このページは Apache Dubbo `dubbo-3.3.6` の固定 commit `f1585880bee4ca7776f44380c47c994217721ffe` と公式 Nacos registry ドキュメントに基づく。ドキュメントの対象は Nacos 2.x で、例は Dubbo 3.3.0 + Nacos 2.3.0 を推奨している。これはすべての Dubbo/Nacos の組み合わせへの互換性の約束ではない。

## 1. インターフェースレベルの登録名は厳密に一致させる

provider のインターフェースレベルの service name は：

```text
providers:{interface}:{version}:{group}
```

ここで：

- `providers` はデフォルトの category；
- `interface` はサービスインターフェースの完全名；
- version/group が空でも空のセグメントは保持される；
- Nacos group のデフォルトは `DEFAULT_GROUP` で、`dubbo.registry.group` で変更できる；
- Nacos instance metadata は provider URL の全パラメータを含む。

トラブルシューティング時は少なくとも次を同時に確認する：

```text
service name + Nacos group + version + provider metadata
```

同じ IP/ポートや「インスタンス healthy」だけでは、consumer のサブスクリプション条件が満たされたことは証明できない。

## 2. デフォルト設定はアプリケーションレベルとインターフェースレベルの二種のサービスを生み出し得る

アプリケーションレベルの登録は `dubbo.application.name` を Nacos service name に使う。metadata には以下を含み得る：

- `dubbo.metadata-service.url-params`；
- `meta-v`；
- `dubbo.metadata.storage-type=local`；
- `dubbo.metadata.revision`；
- マルチプロトコルでの `dubbo.endpoints`。

デフォルトの `register-mode=all` はアプリケーションレベルとインターフェースレベルのサービスを同時に登録する。`instance`、`interface` は対応する層だけを残す。「providers サービスしか見えない」ことをアプリケーションレベルのディスカバリ無効と誤解してはならず、アプリ名サービスをインターフェースレベルの provider リストと混同してもいけない。

## 3. Consumer には二つのディスカバリ経路がある

### インターフェースレベル

consumer は同名の `providers:...` サービスを購読し、Nacos naming event がインスタンスをプッシュする。version/group は厳密に一致させる。範囲が必要なときだけ `*` やカンマ式を使う。

### アプリケーションレベル

アプリケーションレベルのディスカバリは Nacos Config mapping と MetadataService RPC に依存する：

- mapping group は `mapping`；
- 移行のデフォルトポリシーは `APPLICATION_FIRST`；
- application name、interface name、metadata revision は別のフィールド。

二つの経路は設定、service name、障害の現れ方が異なる。まず現在の `register-mode` を判断する必要がある。

## 4. 起動チェックと実行時の失敗

URL パラメータとトップレベル設定を混同しない最小の例：

```properties
dubbo.registry.address=nacos://127.0.0.1:8848?nacos.check=true&retry.period=5000&register-consumer-url=false
dubbo.registry.group=DEFAULT_GROUP
dubbo.registry.check=true
dubbo.registry.enable-empty-protection=false
dubbo.registry.register-mode=all
```

`nacos.check`、`retry.period`、`register-consumer-url` は registry URL パラメータで、address query か `dubbo.registry.parameters.*` に書ける。`enable-empty-protection` はトップレベルの `dubbo.registry.enable-empty-protection` 宣言があることも確認済み。namespace はデフォルトで `public` で、Nacos client にそのまま渡される。

起動と実行時は分けて見る：

- provider はまずローカルで export/ポートバインドし、その後 registry に登録する。Nacos に到達できず `nacos.check=true` のときは起動に失敗する；
- consumer の `check=true` はデフォルトで起動時に provider の存在を要求し、なければ `No provider available for the service` を投げる；
- 実行時に利用可能なインスタンスがないと、デフォルトの fail-fast ルーティングが `FORBIDDEN No provider available from registry` を投げ得る；
- failback はデフォルトで 5 秒周期で再試行するが、初回の起動チェックを成功にはしない。

## 5. Nacos のハートビート境界はサーバー側に属する

公式資料が示すデフォルトの保活値は：

- `preserved.heart.beat.interval=5000ms`；
- `preserved.heart.beat.timeout=15000ms` 経過で unhealthy とマーク；
- `preserved.ip.delete.timeout=30000ms` 経過でインスタンス削除。

これらの値は Nacos server の挙動であり、Dubbo registry 自身の安定した保証ではない。デプロイバージョンやサーバー側設定が変わるときは再確認する。

## 最小の本物の smoke test

固定したローカル Nacos 2.x と provider/consumer fixture で、次の順で検証する：

1. Nacos 未起動時に、provider の `nacos.check` 失敗と consumer の `check` 失敗をそれぞれ観察する；
2. Nacos 起動後に、厳密な `providers:{interface}:{version}:{group}` service name を確認する；
3. metadata に protocol、path、methods、version、group が含まれるか確認する；
4. デフォルトの `register-mode=all` でアプリ名サービスと providers サービスが共存することを確認する。`instance`/`interface` に切り替えたら一層だけ残ることを確認する；
5. 実際に RPC を 1 回成功させる；
6. provider `1.1.0`、consumer `1.0.0` のとき不整合で fail-fast することを確認し、`version=*` のとき範囲内の発見が可能なことを確認する；
7. provider がオフラインになったら呼び出しは失敗し、再起動・再登録後に呼び出しが回復する。

dubbo registry-nacos 付属のテストは主に `NamingService` を mock するもので、本物の Nacos 統合テストの代わりにはならない。このページは smoke test を実行済み結果としては設定していない。

## よくある誤解と境界

- **「Nacos にインスタンスがいれば呼び出せる。」** service name、group、version、metadata のどれか一つでも一致しなければ発見できないことがある。
- **「デフォルトは一種類の登録だけ。」** `register-mode=all` ではアプリケーションレベルとインターフェースレベルのサービスが同時に存在し得る。
- **「`retry.period` は普通のトップレベルキー。」** 現在の固定証拠はまず、これが registry URL パラメータであることを示す。未検証の flat 形式を一般的な構文とみなさないこと。
- **「ハートビートのタイムアウトは Dubbo が決める。」** `preserved.*` は Nacos server の境界だ。
- **「mock の NamingService テストがエンドツーエンドの可用性を証明する。」** 本物の Nacos、バージョン一致、provider オフラインからの回復はまだ smoke test が必要。

## 証拠の境界

固定 commit、公式ドキュメント、設定キーの訂正、未検証項目は、リポジトリの `src/content/raw/zh-cn/dubbo-nacos-runtime-registration.md` と `dubbo-nacos-runtime-registration-correction.md` を参照。このページには非公開アドレス、資格情報、具体的な業務サービス名は含まれない。
