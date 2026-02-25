---
title: "Solving containerd TLS Certificate Verification Issues: Configuration and Credential Cleanup Guide"
timestamp: 2026-02-25 00:00:00+08:00
tags: [Kubernetes, containerd, TLS, Operations, Troubleshooting]
description: A comprehensive guide on resolving TLS certificate verification errors during containerd image pulls, including configuring TLS skip verification, cleaning up Kubernetes layer credentials, and cleaning up node runtime credentials.
toc: true
---

The `tls: failed to verify certificate: x509` error is typically caused by:
- Image registry using self-signed certificates or non-HTTPS connections
- containerd enforces TLS verification by default without configured trust

---

## 1. Modify containerd Configuration (Skip TLS Verification)

### Step 1: Locate Configuration Items
```bash
cat /etc/containerd/config.toml | grep -n 'plugins."io.containerd.grpc.v1.cri".registry.configs'
```

### Step 2: Edit Configuration File
```bash
vim /etc/containerd/config.toml
```

### Step 3: Add TLS Skip Configuration
```toml
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.configs]
    [plugins."io.containerd.grpc.v1.cri".registry.configs."your.registry".tls]
      insecure_skip_verify = true
```

> **Key Explanation**
> `insecure_skip_verify = true`: **Skips TLS verification** (allows self-signed certificates/non-HTTPS connections)
> `your.registry` needs to be replaced with the actual image registry address (e.g., `cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com`)

### Step 4: Restart containerd
```bash
systemctl restart containerd
```

---

## 2. Clear Kubernetes Layer Credentials (Master Node)

### Step 1: Backup Default ServiceAccount Credentials
```bash
kubectl get sa default -o jsonpath='{.imagePullSecrets[*].name}'
# Record output (e.g., default-secret)
```

### Step 2: Temporarily Remove Credentials
```bash
kubectl patch sa default -p '{"imagePullSecrets": []}'
```
> **Impact**: All Pods using the `default` ServiceAccount will lose image pull credentials

---

## 3. Clean Node Runtime Layer Credentials (Worker Node)

### Step 1: Login to Target Node
```bash
ssh k8s-worker1
```

### Step 2: Clean containerd Configuration
```bash
sudo sed -i '/$plugins.*registry.configs$/,/^$/d' /etc/containerd/config.toml
sudo systemctl restart containerd
```

### Step 3: Clean Residual Authentication Files
```bash
sudo rm -f /root/.docker/config.json /var/lib/kubelet/config.json
sudo systemctl restart containerd
```

### Step 4: Verify Credentials are Cleared
```bash
crictl info | grep -i "registry\|auth"
# Ensure output contains no target registry authentication information
```

---

## 4. Clear Local Image Cache
```bash
crictl rmi cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
# Or (if using Docker runtime)
docker rmi cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
```

---

## Verify the Fix

1. Re-pull the image:
   ```bash
   crictl pull cr-ee.registry.cn-wulan-env1-d01.inter.env1.shuguang.com/aegis/aegis-hc-install:latest
   ```
2. Check logs:
   ```bash
   journalctl -u containerd -f | grep -i "pull\|tls"
   ```

> **Important Note**
> `insecure_skip_verify = true` **should only be used in test environments**, production environments should use valid certificates.
> This configuration **does not affect Kubernetes certificate management**, it only affects the containerd runtime layer.
