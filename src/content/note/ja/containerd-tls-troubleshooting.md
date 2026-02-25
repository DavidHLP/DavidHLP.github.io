---
title: containerd TLS 証明書検証問題の解決：設定と認証情報クリーンアップガイド
timestamp: 2026-02-25 00:00:00+08:00
tags: [Kubernetes, containerd, TLS, 運用, トラブルシューティング]
description: containerd イメージプル時の TLS 証明書検証エラーの解決方法を詳く説明します。TLS 検証をスキップする設定、Kubernetes レイヤー認証情報のクリーンアップ、ノードランタイムレイヤー認証情報のクリーンアップを含む完全な手順です。
toc: true
---

`tls: failed to verify certificate: x509` エラーは通常、以下の原因で発生します:
- イメージレジストリが自己署名証明書または非 HTTPS 接続を使用している
- containerd はデフォルトで TLS 検証を強制しており、信頼の設定がない

---

## 1. containerd 設定の変更（TLS 検証をスキップ）

### 手順 1: 設定項目を特定
```bash
cat /etc/containerd/config.toml | grep -n 'plugins."io.containerd.grpc.v1.cri".registry.configs'
```

### 手順 2: 設定ファイルを編集
```bash
vim /etc/containerd/config.toml
```

### 手順 3: TLS スキップ設定を追加
```toml
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.configs]
    [plugins."io.containerd.grpc.v1.cri".registry.configs."your.registry".tls]
      insecure_skip_verify = true
```

> **重要な説明**
> `insecure_skip_verify = true`: **TLS 検証をスキップ**（自己署名証明書/非 HTTPS 接続を許可）
> `your.registry` は実際のイメージレジストリアドレスに置き換えてください（例：`cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com`）

### 手順 4: containerd を再起動
```bash
systemctl restart containerd
```

---

## 2. Kubernetes レイヤー認証情報のクリア（マスターノード）

### 手順 1: デフォルト ServiceAccount の認証情報をバックアップ
```bash
kubectl get sa default -o jsonpath='{.imagePullSecrets[*].name}'
# 出力を記録（例：default-secret）
```

### 手順 2: 一時的に認証情報を削除
```bash
kubectl patch sa default -p '{"imagePullSecrets": []}'
```
> **影響**: `default` ServiceAccount を使用するすべての Pod がイメージプル認証情報を失います

---

## 3. ノードランタイムレイヤー認証情報のクリーンアップ（ワーカーノード）

### 手順 1: ターゲットノードにログイン
```bash
ssh k8s-worker1
```

### 手順 2: containerd 設定をクリーンアップ
```bash
sudo sed -i '/$plugins.*registry.configs$/,/^$/d' /etc/containerd/config.toml
sudo systemctl restart containerd
```

### 手順 3: 残留認証ファイルをクリーンアップ
```bash
sudo rm -f /root/.docker/config.json /var/lib/kubelet/config.json
sudo systemctl restart containerd
```

### 手順 4: 認証情報がクリアされたことを確認
```bash
crictl info | grep -i "registry\|auth"
# ターゲットレジストリの認証情報が出力に含まれていないことを確認
```

---

## 4. ローカルイメージキャッシュをクリア
```bash
crictl rmi cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
# または（Docker ランタイムを使用する場合）
docker rmi cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
```

---

## 修正の確認

1. イメージを再度プル:
   ```bash
   crictl pull cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
   ```
2. ログを確認:
   ```bash
   journalctl -u containerd -f | grep -i "pull\|tls"
   ```

> **重要な注意**
> `insecure_skip_verify = true` は**テスト環境でのみ使用**，本番環境では有効な証明書を使用する必要があります。
> この設定は**Kubernetes 証明書管理に影響しません**，containerd ランタイムレイヤーにのみ作用します。
