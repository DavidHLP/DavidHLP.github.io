---
title: "containerd TLS：信頼チェーンと一時的な検証スキップの判断"
timestamp: 2026-02-25 00:00:00+08:00
series: "システム運用とインフラストラクチャ"
kind: concept
status: active
draft: true
sources: ["legacy-containerd-tls-troubleshooting"]
related: ["intranet-penetration-ssh-guide", "mysql-performance-troubleshooting"]
tags: [Kubernetes, containerd, TLS, Harbor, Operations, Troubleshooting]
description: "プライベートレジストリの pull 失敗を、証明書信頼・containerd 設定・Kubernetes の認証情報・ノードキャッシュに分解し、本番 CA と一時的な skip_verify の境界を判断するためのモデル。"
toc: true
---

本ページは、プライベートレジストリで `x509` の pull エラーが出たとき、ノードと containerd に CA を信頼させるべきか、それとも原因切り分けの間だけ検証をスキップするべきかを答える。containerd の設定、ノード OS の信頼ストア、Kubernetes の Secret/ServiceAccount、キャッシュを分離し、異なる層の失敗を混同しないようにする。

## コアメカニズム

### 1. pull 経路と責任境界

```text
Pod → kubelet → imagePullSecrets/ServiceAccount → CRI → containerd
    → config.toml の config_path → certs.d/<registry>/hosts.toml
    → Registry TLS → manifest/layer
```

| 観測結果 | 最初に見る層 | 再利用できる判断 |
| --- | --- | --- |
| `x509: certificate signed by unknown authority` | Registry TLS / containerd | 証明書チェーン、SAN、`config_path`、ノード上の `ca.crt` を確認する。 |
| `certificate is valid for xxx, not yyy` | Registry アドレス | イメージアドレスを証明書 SAN に合わせ、対象外の IP に置き換えない。 |
| TLS は通るが `unauthorized` | Kubernetes 認証情報 | Pod の `imagePullSecrets` と、明示しない場合に継承する ServiceAccount を確認する。 |
| `crictl pull` は成功するが Pod は失敗 | Kubernetes またはキャッシュ | CA を変更する前に Secret、ServiceAccount、namespace、イメージ名、古いレイヤーを見る。 |

### 2. TLS の二つの選択肢

| 選択 | 最小設定 | 判断 | 代償 |
| --- | --- | --- | --- |
| 信頼 CA（本番経路） | `hosts.toml` に `ca = "ca.crt"` | プライベートレジストリを長期運用し、ノードがサーバーを認証する必要がある | pull を行うすべての Worker に証明書と設定を配布する必要がある。 |
| 一時的な検証スキップ | `skip_verify = true` | テスト、デモ、一時的な内網レジストリで、証明書検証が原因かを確認する | 証明書の出所を検証せず、中間者攻撃のリスクがある。本番の既定値にはしない。 |

`skip_verify` が変えるのは TLS 検証だけである。誤ったホスト名、ポート、認証情報、DNS、プロキシ経路は直らない。本番設定の最小例は次のとおり。

```toml
server = "https://harbor.example.com"

[host."https://harbor.example.com"]
  capabilities = ["pull", "resolve", "push"]
  ca = "ca.crt"
```

一時診断では最後の設定だけを `skip_verify = true` に置き換える。ポート付きなら `harbor.example.com:8443` を Registry アドレスと `certs.d` ディレクトリ名の両方に含める。

### 3. containerd、ノード CA、Kubernetes 認証情報、キャッシュは別物

- **containerd 層**：新しい設定では `/etc/containerd/certs.d` 配下の `hosts.toml` を読む。raw の例では containerd 1.x は `version = 2` と `io.containerd.grpc.v1.cri`、2.x は `version = 3` と `io.containerd.cri.v1.images` を使う。バージョン依存なので `containerd --version` で確認する。
- **ノード OS の CA 層**：`ca.crt` を Debian/Ubuntu、RHEL 系、Arch の信頼ディレクトリに置くと、主に `curl`、`openssl`、その他のシステムサービスが信頼できるようになる。containerd の `config_path` と `hosts.toml` の代わりにはならない。
- **Kubernetes 認証情報層**：`imagePullSecrets` または ServiceAccount は Registry 認証を解決する。TLS 通過後も `unauthorized` なら、TLS ではなく正しい `docker-registry` Secret の再作成・バインドを行う。
- **キャッシュ層**：ノード上の失敗イメージや古いレイヤーにより、直接 pull と Pod の結果が食い違って見えることがある。キャッシュ削除は検証手段であり、信頼チェーンの修正ではない。

## 適用条件

1. 本番レジストリでは信頼 CA を使い、実際に pull するすべての Worker で `hosts.toml`、`ca.crt`、`config.toml` を揃える。
2. `skip_verify` はテストやデモの切り分けだけに使い、一時設定であることを記録して、確認後は `ca = "ca.crt"` に戻す。
3. ポート付き Registry のパスを正確に保つ。例は `/etc/containerd/certs.d/harbor.example.com:8443/` である。
4. `crictl pull` 成功後に Kubernetes 層を判断する。失敗したら TLS、CA、hosts、DNS、プロキシ、ネットワークへ戻る。
5. 新しいリリースでは古い `registry.configs` の例より `certs.d/hosts.toml` を優先する。ただし旧形式の互換性は未確認のバージョンに依存する。

## 適用外とリスク

- `skip_verify = true` を本番クラスタに残さない。証明書の出所を認証せずにサーバーを受け入れる。
- 「OS の CA を更新した」ことを「containerd が読み込んだ」ことと同一視しない。正しい `config_path` を確認し、サービスを再起動する。
- `unauthorized` が出たからといって CA を何度も交換しない。これは Secret、ServiceAccount、Registry アカウントの境界である。
- `/root/.docker/config.json` や `/var/lib/kubelet/config.json` を確認なしに削除しない。raw はそれらを過去の残留候補として挙げているだけである。
- containerd 1.x/2.x のプラグインパスや各ディストリビューションの CA 更新コマンドは、raw に基づくバージョン・環境依存の主張であり、未確認環境への保証ではない。

## 最小検証

層を区別できる検査だけを順に実行する。

```bash
containerd --version
sudo systemctl status containerd --no-pager
sudo crictl pull harbor.example.com/project/app:v1
```

- `crictl pull` が `x509` なら `hosts.toml`、CA、SAN、ポートディレクトリを再確認する。ログは `sudo journalctl -u containerd -n 200 --no-pager` で見る。
- 認証エラーなら Pod の ServiceAccount と Secret を見る。

```bash
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.serviceAccountName}'
kubectl get sa <service-account> -n <namespace> -o yaml
```

- CA の subject、issuer、日付を確認する。

```bash
openssl x509 -in /etc/containerd/certs.d/harbor.example.com/ca.crt -noout -subject -issuer -dates
```

- `crictl pull` は成功するのに Pod が失敗するなら、`kubectl describe pod` の Events を確認し、必要な場合だけ `crictl images`/`crictl rmi` で古いキャッシュを除外する。

## 証拠と不確実性

- **出典事実**：`legacy-containerd-tls-troubleshooting` は x509/SAN/ポート/認証情報/キャッシュの症状、containerd 1.x/2.x の例、`certs.d` の二つの TLS 設定、ServiceAccount/Secret の確認、`crictl pull` の分岐を記録している。
- **本ページの統合**：それらを「失敗層を分類してから CA または一時スキップを選ぶ」決定表に圧縮した。「OS CA は containerd 設定ではない」はその経路から導いた境界である。
- **未確認**：現在のクラスタの containerd の正確なバージョン、Registry CA の完全性、証明書 SAN、ノードの proxy/NO_PROXY、Secret のバインド、キャッシュ状態は実環境で確認する必要がある。

## 関連ページ

- [SSH 内網アクセスの選択](/note/intranet-penetration-ssh-guide)
- [MySQL パフォーマンス問題モデル](/note/mysql-performance-troubleshooting)
