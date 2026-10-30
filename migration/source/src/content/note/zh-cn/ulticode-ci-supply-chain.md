---
title: "UltiCode 验证与供应链门禁：从 static contract 到可验证发布"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, CI, StaticCheck, IntegrationTest, Trivy, SBOM, Cosign, Provenance, LLM]
description: "提炼 UltiCode 如何将 zero-infra static contract、分层验证、Trivy、SBOM、provenance 与 Cosign 组织成可追溯的交付门禁。"
toc: true
---

> **证据状态**：本文描述 UltiCode 当前 workflow、测试文档和脚本中声明的验证层级。配置存在不等于本轮或每次 CI 都已经成功执行；生产安全、性能和发布凭据仍需运行记录。

很多项目把“测试”理解成一个命令，把“发布安全”理解成镜像构建后的人工检查。UltiCode 的一个工程亮点，是把验证按成本和真实性分层，并把一部分供应链要求直接放进发布门禁。

## Static 先检查契约，不启动整个世界

仓库提供 [`scripts/dev/test.sh`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/dev/test.sh) 的多档入口：

```text
static       -> zero-infra contract checks
unit         -> unit tests, exclude IT/IntegrationTest
quick/full   -> progressively heavier local checks
integration  -> Testcontainers, DB/Redis, sandbox and owner migration
```

CI 中的静态契约入口是：

```bash
bash scripts/test/zero-infra-validation-contract.sh --static-only
```

文档明确说明这条路径不启动 Docker、数据库、服务、Testcontainers、Maven 或 pnpm install。它适合快速检查脚本、路径、配置、owner 迁移和安全约束；真正需要数据库、Redis、沙箱或跨服务行为的部分留给更重的阶段。

这是一种成本分层，而不是用 static 替代 integration：静态检查便宜但不证明运行时行为，集成测试更接近真实但不证明生产流量。

## Backend workflow 把边界继续展开

[`_backend.yml`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/_backend.yml) 还组合了编译、unit/full/integration、coverage、owner migration、Redis ACL/TLS、lease、graceful drain、Streams、拓扑和 sandbox 等契约门禁。设计重点是把“架构约束”变成可失败的检查，而不是停留在 architecture.md 的文字里。

## 镜像发布不是最后一步复制文件

当前 [`docker-publish.yml`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml) 从服务矩阵构建 GHCR 镜像，并包含：

- 镜像名统一小写，减少 registry 引用差异；
- Buildx SBOM 和 provenance；
- Trivy 对 HIGH/CRITICAL OS/library 漏洞采用阻断式 exit code；
- 按 digest 校验镜像；
- Cosign 签名；
- 对 SPDX 和 SLSA provenance 做 attestation、签名和验证；
- 生成不可变发布清单。

这样发布结果至少带有“构建了什么、摘要是什么、由谁签名、证明是否通过”的可追溯信息。它不是安全的终点，但比“镜像能拉下来”多了一条可以审计的证据链。

## 为什么这对 LLM/Agent 更重要

LLM 系统的变化速度快，工具、模型和 prompt 经常被替换。若没有便宜的静态契约，任何小改动都要等完整环境启动；若没有重验证和发布证明，模型服务的依赖变化就会悄悄进入生产。

可以复用 UltiCode 的分层思路：先用 zero-infra 检查 schema、权限、状态转换和配置边界，再用 integration 验证真实 provider/queue/sandbox，最后在发布时绑定 digest、SBOM 和签名证明。

## 不能过度解释的地方

workflow 中存在 Trivy、Cosign 或 provenance 配置，只能说明仓库建立了这些门禁；不能直接推出当前生产镜像无漏洞、签名凭据可用、所有 job 已通过或系统已经达到 HA。真实结论必须引用具体 run、镜像 digest 和部署环境。

## 最小验证路径

先读 [testing.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/development/testing.md) 和 [`zero-infra-validation-contract.sh`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/test/zero-infra-validation-contract.sh)，再读 [_backend.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/_backend.yml) 与 [docker-publish.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml)。
