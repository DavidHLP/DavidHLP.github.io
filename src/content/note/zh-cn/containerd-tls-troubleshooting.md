---
title: "containerd TLS：证书信任链与临时跳过验证的决策"
timestamp: 2026-02-25 00:00:00+08:00
series: "系统运维与基础设施"
kind: concept
status: active
sources: ["legacy-containerd-tls-troubleshooting"]
related: ["intranet-penetration-ssh-guide", "mysql-performance-troubleshooting"]
tags: [Kubernetes, containerd, TLS, Harbor, Operations, Troubleshooting]
description: "用一条可验证的链路判断私有镜像拉取失败属于证书信任、Kubernetes 凭证还是节点缓存，并比较生产 CA 信任与临时 skip_verify 的边界。"
toc: true
---

本页回答一个具体决策：私有 Registry 出现 `x509` 拉取错误时，何时让节点和 containerd 信任 CA，何时只能把跳过验证当作短期诊断手段。它把 containerd 配置、节点系统 CA、Kubernetes Secret/ServiceAccount 与缓存分开，避免把不同层的失败混为一谈。

## 核心机制

### 1. 拉取链路与责任边界

```text
Pod → kubelet → imagePullSecrets/ServiceAccount → CRI → containerd
    → config.toml 的 config_path → certs.d/<registry>/hosts.toml
    → Registry TLS → manifest/layer
```

| 观察到的现象 | 首要层 | 可复用判断 |
| --- | --- | --- |
| `x509: certificate signed by unknown authority` | Registry TLS / containerd | 先核对证书链、SAN、`config_path` 和节点上的 `ca.crt`。 |
| `certificate is valid for xxx, not yyy` | Registry 地址 | 镜像地址必须与证书 SAN 匹配；不要用未被证书覆盖的 IP 替代域名。 |
| TLS 已通过但 `unauthorized` | Kubernetes 凭证 | 检查 Pod 的 `imagePullSecrets`，以及未显式指定时继承的 ServiceAccount。 |
| `crictl pull` 成功而 Pod 失败 | Kubernetes 或缓存 | 先看 Secret、ServiceAccount、namespace、镜像名和旧镜像层；不要继续改 CA。 |

### 2. 两种 TLS 选择

| 选择 | 最小配置 | 适用决策 | 代价 |
| --- | --- | --- | --- |
| 受信 CA（生产路径） | `hosts.toml` 使用 `ca = "ca.crt"` | 私有仓库要长期运行，节点应验证服务端身份 | 每个实际拉取镜像的 Worker 节点都要分发证书和配置。 |
| 临时跳过验证 | `skip_verify = true` | 测试、演示或内网临时仓库，用来确认故障确实在证书校验 | 绕过证书来源校验，有中间人风险；不能作为生产默认值。 |

`skip_verify` 只改变 TLS 校验，不会修复错误的域名、端口、凭证、DNS 或代理路径。生产配置的最小片段是：

```toml
server = "https://harbor.example.com"

[host."https://harbor.example.com"]
  capabilities = ["pull", "resolve", "push"]
  ca = "ca.crt"
```

临时诊断只把最后一项替换为 `skip_verify = true`。带端口时，`harbor.example.com:8443` 必须同时出现在 Registry 地址和 `certs.d` 目录名中。

### 3. containerd、节点 CA 与 Kubernetes 凭证不是同一件事

- **containerd 层**：较新的配置通过 `/etc/containerd/certs.d` 的 `hosts.toml` 读取仓库 CA。containerd 1.x 的来源示例使用 `version = 2` 与 `io.containerd.grpc.v1.cri`；2.x 使用 `version = 3` 与 `io.containerd.cri.v1.images`。这是版本敏感结论，先用 `containerd --version` 确认。
- **节点系统 CA 层**：把 `ca.crt` 放入 Debian/Ubuntu、RHEL 系或 Arch 的系统信任目录，主要让 `curl`、`openssl` 和其他系统服务统一信任；它不能替代 containerd 正确读取 `config_path` 与 `hosts.toml`。
- **Kubernetes 凭证层**：`imagePullSecrets` 或 ServiceAccount 的 Secret 只解决 Registry 认证。证书校验通过后仍 `unauthorized`，应重建/绑定正确的 `docker-registry` Secret，而不是改 TLS。
- **缓存层**：节点已有失败镜像或旧镜像层会让手动 pull 与 Pod 结果看起来不一致。缓存清理是验证手段，不是信任链修复。

## 适用条件

1. 生产仓库使用受信 CA；证书、`hosts.toml` 和 `config.toml` 在每个承担拉取任务的 Worker 节点一致。
2. 测试仓库可以先用 `skip_verify` 做故障隔离，但必须记录临时性并在验证后换回 `ca = "ca.crt"`。
3. 端口仓库使用精确路径，例如 `/etc/containerd/certs.d/harbor.example.com:8443/`，不能省略端口。
4. `crictl pull` 成功后再判断 Kubernetes 层；若它失败，优先回到 TLS、CA、hosts、DNS、代理或网络。
5. 新版本优先 `registry.configs` 之外的 `certs.d/hosts.toml`；旧 `registry.configs` 只保留为兼容线索，是否可用取决于版本。

## 不适用与风险

- 不要把 `skip_verify = true` 长期放在生产集群；它没有身份验证保护，中间人可被接受。
- 不要把“系统 CA 已更新”当作“containerd 已生效”；必须确认它读取了正确的 `config_path`，并重启服务让配置生效。
- 不要因 `unauthorized` 反复替换 CA；这是 Secret、ServiceAccount 或仓库账号边界的问题。
- 不要未经确认删除 `/root/.docker/config.json` 或 `/var/lib/kubelet/config.json`；raw 只把它们列为可能的历史残留，清理应先核对环境。
- `containerd 1.x/2.x` 的插件路径、发行版 CA 更新命令和 `EXPLAIN` 类似，都属于来源中的版本/平台条件，不应外推到未确认环境。

## 最小验证

按顺序只保留能区分层次的检查：

```bash
containerd --version
sudo systemctl status containerd --no-pager
sudo crictl pull harbor.example.com/project/app:v1
```

- `crictl pull` 报 `x509`：检查 `hosts.toml`、CA、SAN 和端口目录；日志可用 `sudo journalctl -u containerd -n 200 --no-pager`。
- `crictl pull` 报认证错误：检查当前 Pod 的 ServiceAccount 和 Secret：

```bash
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.serviceAccountName}'
kubectl get sa <service-account> -n <namespace> -o yaml
```

- 证书路径需要核对主题、签发者和有效期：

```bash
openssl x509 -in /etc/containerd/certs.d/harbor.example.com/ca.crt -noout -subject -issuer -dates
```

- `crictl pull` 成功而 Pod 仍失败，再查看 `kubectl describe pod` 的 Events，并按需用 `crictl images`/`crictl rmi` 排除旧缓存。

## 证据与不确定性

- **来源事实**：`legacy-containerd-tls-troubleshooting` 记录了 x509/SAN/端口/凭证/缓存现象、containerd 1.x/2.x 示例、`certs.d` 两种 TLS 配置、ServiceAccount/Secret 排查和 `crictl pull` 分流。
- **本页综合**：把这些事实压缩为“先判错误层，再选 CA 或临时跳过验证”的决策表；“系统 CA 不等于 containerd 配置”是对来源链路的边界归纳。
- **未确认项**：当前集群的 containerd 精确版本、Registry CA 是否完整、证书 SAN、节点代理/NO_PROXY、Secret 的实际绑定关系和缓存状态，均需现场命令确认。

## 相关页面

- [内网穿透 SSH 方案](/note/intranet-penetration-ssh-guide)
- [MySQL 性能问题模型](/note/mysql-performance-troubleshooting)
