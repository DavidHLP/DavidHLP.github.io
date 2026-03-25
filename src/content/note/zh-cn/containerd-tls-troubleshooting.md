---
title: 解决 containerd TLS 证书验证问题：从跳过验证到受信配置
timestamp: 2026-02-25 00:00:00+08:00
tags: [Kubernetes, containerd, TLS, 运维, 问题排查]
description: 深度解析 containerd 镜像拉取时的 TLS 验证机制，提供从“临时跳过”到“生产级 CA 配置”的完整解决方案，并涵盖凭证清理与缓存重置流程。
toc: true
---

在 Kubernetes 环境中，使用私有镜像仓库（如 Harbor、Nexus）或自签名证书仓库时，常会遇到 `tls: failed to verify certificate: x509: certificate signed by unknown authority` 错误。

这类问题通常涉及两个层面：**信任链路未建立**（证书不被信任）或**配置路径不匹配**（containerd 未读取到配置）。本文将带你从底层配置到上层凭证清理，彻底解决这一顽疾。

---

## 一、 快速止血：修改 containerd 配置（跳过 TLS 验证）

如果你处于测试环境，或者急于拉取镜像，可以通过修改 `config.toml` 直接跳过证书验证。

### 1. 定位配置项
`containerd` 的插件配置通常位于 `/etc/containerd/config.toml`。首先确认 CRI 插件是否启用了注册表配置：
```bash
grep -n "registry.configs" /etc/containerd/config.toml
```

### 2. 编辑配置（区分版本）
根据你使用的 `containerd` 版本，配置路径略有不同。

**对于常用版本：**
```toml
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.configs]
    [plugins."io.containerd.grpc.v1.cri".registry.configs."your.registry.addr".tls]
      insecure_skip_verify = true
```

> [!CAUTION]
> **注意：** `your.registry.addr` 必须与镜像地址中的域名完全一致。如果地址带端口，配置中也必须带端口。

### 3. 重启生效
```bash
sudo systemctl restart containerd
```

---

## 二、 生产推荐：配置受信 CA 证书

直接跳过验证存在中间人攻击风险。生产环境建议将仓库的 CA 证书分发到节点。

### 1. 证书放置路径
Containerd 会默认搜索特定目录下的证书。将你的 `ca.crt` 放入：
`/etc/containerd/certs.d/your.registry.addr/ca.crt`

### 2. 更新主机信任列表（可选但推荐）
```bash
cp ca.crt /usr/local/share/ca-certificates/my-registry.crt
update-ca-certificates
```

### 3. 验证证书有效性
使用 `openssl` 模拟 containerd 握手：
```bash
openssl s_client -showcerts -connect your.registry.addr:443 < /dev/null
```

---

## 三、 清除 Kubernetes 层凭证（Master 节点）

有时证书配置正确，但 K8s 内部缓存了旧的 `imagePullSecrets` 或错误的 `default` SA 凭证，导致拉取失败。

### 1. 检查 ServiceAccount
```bash
kubectl get sa default -o yaml
```
如果发现 `imagePullSecrets` 列表中存在过期的 Secret，需将其移除。

### 2. 补丁操作
```bash
kubectl patch sa default -p '{"imagePullSecrets": []}'
```
> **提示：** 这一步是“清空”，随后你需要确保 Pod 的 YAML 中显式声明了正确的 `imagePullSecrets`，或者重新给 SA 绑定正确的 Secret。

---

## 四、 清理节点运行时层凭证（Worker 节点）

Containerd 可能会持久化认证信息在 `/var/lib/kubelet/config.json` 或环境变量中。

### 1. 深度清理
```bash
# 停止服务
sudo systemctl stop containerd

# 清理可能存在的 Docker 残留配置（CRI 有时会参考）
rm -f /root/.docker/config.json
rm -f /var/lib/kubelet/config.json

# 检查环境变量
env | grep -i "proxy\|auth"
```

### 2. 验证凭证状态
使用 `crictl` 检查运行时是否还存有旧的 Auth 信息：
```bash
crictl info | jq '.config.registry'
```

---

## 五、 清理本地镜像缓存与重试

如果之前拉取失败，本地可能残留了损坏的镜像层。

```bash
# 获取损坏镜像的 ID
crictl images | grep "your.registry.addr"

# 强制删除
crictl rmi <IMAGE_ID>

# 重新拉取并查看实时日志
crictl pull your.registry.addr/repo/image:tag
journalctl -u containerd -f -n 100
```

---

## 避坑指南总结

1. **域名 vs IP**：证书颁发给域名时，`config.toml` 中必须写域名，写 IP 会导致 SNI 校验失败。
2. **端口号**：`certs.d` 下的文件夹名称必须包含端口（如果不是 443/80）。
3. **Containerd 1.5+ 变化**：新版本推荐使用 `config_path` 模式管理证书，将证书逻辑与主配置文件解耦。
4. **Proxy 干扰**：检查是否配置了系统代理（`HTTP_PROXY`），导致内网镜像仓库请求被转发到了外网代理。

