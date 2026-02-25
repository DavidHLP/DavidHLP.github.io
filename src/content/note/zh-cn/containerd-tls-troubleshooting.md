---
title: 解决 containerd TLS 证书验证问题：配置与凭证清理指南
timestamp: 2026-02-25 00:00:00+08:00
tags: [Kubernetes, containerd, TLS, 运维, 问题排查]
description: 详细讲解如何解决 containerd 镜像拉取时的 TLS 证书验证错误，包括配置跳过 TLS 验证、清理 Kubernetes 层凭证、清理节点运行时凭证的完整流程。
toc: true
---

`tls: failed to verify certificate: x509` 错误通常由以下原因导致：
- 镜像仓库使用自签名证书或非 HTTPS 连接
- containerd 默认强制 TLS 验证，未配置信任

---

## 一、修改 containerd 配置（跳过 TLS 验证）

### 步骤 1：定位配置项
```bash
cat /etc/containerd/config.toml | grep -n 'plugins."io.containerd.grpc.v1.cri".registry.configs'
```

### 步骤 2：编辑配置文件
```bash
vim /etc/containerd/config.toml
```

### 步骤 3：添加 TLS 跳过配置
```toml
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.configs]
    [plugins."io.containerd.grpc.v1.cri".registry.configs."your.registry".tls]
      insecure_skip_verify = true
```

> **关键说明**
> `insecure_skip_verify = true`：**跳过 TLS 验证**（允许自签名证书/非 HTTPS 连接）
> `your.registry` 需替换为实际镜像仓库地址（如 `cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com`）

### 步骤 4：重启 containerd
```bash
systemctl restart containerd
```

---

## 二、清除 Kubernetes 层凭证（Master 节点）

### 步骤 1：备份默认 ServiceAccount 凭证
```bash
kubectl get sa default -o jsonpath='{.imagePullSecrets[*].name}'
# 记录输出（如：default-secret）
```

### 步骤 2：临时移除凭证
```bash
kubectl patch sa default -p '{"imagePullSecrets": []}'
```
> **影响**：所有使用 `default` ServiceAccount 的 Pod 将失去镜像拉取凭证

---

## 三、清理节点运行时层凭证（Worker 节点）

### 步骤 1：登录目标节点
```bash
ssh k8s-worker1
```

### 步骤 2：清理 containerd 配置
```bash
sudo sed -i '/$plugins.*registry.configs$/,/^$/d' /etc/containerd/config.toml
sudo systemctl restart containerd
```

### 步骤 3：清理残留认证文件
```bash
sudo rm -f /root/.docker/config.json /var/lib/kubelet/config.json
sudo systemctl restart containerd
```

### 步骤 4：验证凭证已清除
```bash
crictl info | grep -i "registry\|auth"
# 确保输出中无目标仓库认证信息
```

---

## 四、清除本地镜像缓存
```bash
crictl rmi cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
# 或（若使用 Docker 运行时）
docker rmi cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
```

---

## 验证修复

1. 重新拉取镜像：
   ```bash
   crictl pull cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
   ```
2. 检查日志：
   ```bash
   journalctl -u containerd -f | grep -i "pull\|tls"
   ```

> **重要提示**
> `insecure_skip_verify = true` **仅用于测试环境**，生产环境应使用有效证书。
> 此配置**不会影响 Kubernetes 证书管理**，仅作用于 containerd 运行时层。
