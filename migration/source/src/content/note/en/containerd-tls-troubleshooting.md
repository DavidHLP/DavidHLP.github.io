---
title: "containerd TLS: Choosing a Trusted Chain or Temporary Verification Bypass"
timestamp: 2026-02-25 00:00:00+08:00
series: "System Operations & Infrastructure"
kind: concept
status: active
draft: true
sources: ["legacy-containerd-tls-troubleshooting"]
related: ["intranet-penetration-ssh-guide", "mysql-performance-troubleshooting"]
tags: [Kubernetes, containerd, TLS, Harbor, Operations, Troubleshooting]
description: "A layer-by-layer decision model for private-registry pull failures: separate certificate trust, containerd configuration, Kubernetes credentials, and node cache, then choose a production CA or a temporary skip_verify probe."
toc: true
---

This page answers one decision: when a private registry reports an `x509` pull failure, should the node and containerd trust a CA, or should verification be skipped only long enough to isolate the fault? It separates containerd configuration, the node OS trust store, Kubernetes Secret/ServiceAccount credentials, and cached image state so that failures from different layers are not conflated.

## Core mechanism

### 1. Pull path and ownership boundaries

```text
Pod → kubelet → imagePullSecrets/ServiceAccount → CRI → containerd
    → config_path in config.toml → certs.d/<registry>/hosts.toml
    → Registry TLS → manifest/layer
```

| Observation                                     | First layer               | Reusable interpretation                                                                            |
| ----------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `x509: certificate signed by unknown authority` | Registry TLS / containerd | Check the certificate chain, SAN, `config_path`, and the node's `ca.crt`.                          |
| `certificate is valid for xxx, not yyy`         | Registry address          | The image address must match the certificate SAN; do not substitute an uncovered IP.               |
| TLS succeeds but `unauthorized` remains         | Kubernetes credentials    | Inspect Pod `imagePullSecrets` and the ServiceAccount inherited when none is explicit.             |
| `crictl pull` succeeds but the Pod fails        | Kubernetes or cache       | Check Secret, ServiceAccount, namespace, image name, and stale layers before changing CA settings. |

### 2. The two TLS choices

| Choice                       | Minimal setting                   | Decision                                                                                          | Cost                                                                                                      |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Trusted CA (production path) | `hosts.toml` uses `ca = "ca.crt"` | The private registry must run long term and the node must authenticate its server                 | Every Worker node that pulls images needs the certificate and configuration.                              |
| Temporary bypass             | `skip_verify = true`              | Test, demo, or temporary internal registry; useful to prove the fault is certificate verification | It bypasses certificate-origin checks and carries man-in-the-middle risk; it is not a production default. |

The `skip_verify` switch changes only TLS verification. It does not repair a wrong hostname, port, credential, DNS path, or proxy path. The minimal production fragment is:

```toml
server = "https://harbor.example.com"

[host."https://harbor.example.com"]
  capabilities = ["pull", "resolve", "push"]
  ca = "ca.crt"
```

For a temporary diagnostic, replace only the last setting with `skip_verify = true`. With a port, `harbor.example.com:8443` must appear both in the registry address and in the `certs.d` directory name.

### 3. containerd, node CA, Kubernetes credentials, and cache are different

- **containerd layer**: newer configuration reads `hosts.toml` under `/etc/containerd/certs.d`. The source examples use `version = 2` and `io.containerd.grpc.v1.cri` for containerd 1.x, and `version = 3` with `io.containerd.cri.v1.images` for 2.x. This is version-sensitive; confirm with `containerd --version`.
- **Node OS CA layer**: placing `ca.crt` in the Debian/Ubuntu, RHEL-family, or Arch trust location mainly lets `curl`, `openssl`, and other system services trust it. It does not replace a working containerd `config_path` and `hosts.toml`.
- **Kubernetes credential layer**: `imagePullSecrets` or a ServiceAccount solves registry authentication. If TLS passes but the result is `unauthorized`, rebuild or bind the correct `docker-registry` Secret instead of changing TLS.
- **Cache layer**: a failed image or stale layer on a node can make a direct pull and a Pod appear inconsistent. Cache removal is a verification step, not a trust-chain fix.

## Applicable conditions

1. Use a trusted CA for a production registry; keep `hosts.toml`, `ca.crt`, and `config.toml` consistent on every Worker that can pull images.
2. Use `skip_verify` only to isolate a test or demonstration failure, record that it is temporary, and return to `ca = "ca.crt"` afterward.
3. Preserve the exact path for a port-bearing registry, for example `/etc/containerd/certs.d/harbor.example.com:8443/`.
4. Decide the Kubernetes layer only after `crictl pull` succeeds. If it fails, return to TLS, CA, hosts, DNS, proxy, or network checks.
5. Prefer `certs.d/hosts.toml` over the older `registry.configs` examples for newer releases; compatibility of the old form depends on the unconfirmed version.

## Not applicable and risks

- Do not leave `skip_verify = true` in a production cluster: it accepts a server without authenticating its certificate origin.
- Do not treat “the OS CA was updated” as “containerd has reloaded it”; confirm the correct `config_path` and restart the service.
- Do not replace CA files in response to `unauthorized`; that is a Secret, ServiceAccount, or registry-account boundary.
- Do not delete `/root/.docker/config.json` or `/var/lib/kubelet/config.json` without checking the environment. The raw source lists them only as possible historical residue.
- The containerd 1.x/2.x plugin paths and distribution-specific CA commands are source-scoped version/platform claims, not guarantees for an unverified environment.

## Minimal verification

Keep only checks that distinguish the layers:

```bash
containerd --version
sudo systemctl status containerd --no-pager
sudo crictl pull harbor.example.com/project/app:v1
```

- An `x509` result from `crictl pull` points back to `hosts.toml`, CA, SAN, and the port directory; inspect with `sudo journalctl -u containerd -n 200 --no-pager`.
- An authentication result points to the Pod's ServiceAccount and Secret:

```bash
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.serviceAccountName}'
kubectl get sa <service-account> -n <namespace> -o yaml
```

- Verify the CA's subject, issuer, and dates with:

```bash
openssl x509 -in /etc/containerd/certs.d/harbor.example.com/ca.crt -noout -subject -issuer -dates
```

- If `crictl pull` succeeds while the Pod fails, inspect `kubectl describe pod` Events and, only if needed, use `crictl images`/`crictl rmi` to rule out stale cache.

## Evidence and uncertainty

- **Source facts**: `legacy-containerd-tls-troubleshooting` records the x509/SAN/port/credential/cache symptoms, containerd 1.x/2.x examples, both `certs.d` TLS choices, ServiceAccount/Secret checks, and the `crictl pull` split.
- **Synthesis in this page**: the source is compressed into “classify the failing layer, then choose a CA or a temporary bypass”; “OS CA is not containerd configuration” is an explicit boundary derived from that chain.
- **Unconfirmed**: the current cluster's exact containerd version, complete Registry CA, certificate SAN, node proxy/NO_PROXY, Secret bindings, and cache state still require live checks.

## Related pages

- [SSH intranet access options](/note/intranet-penetration-ssh-guide)
- [MySQL performance problem model](/note/mysql-performance-troubleshooting)
