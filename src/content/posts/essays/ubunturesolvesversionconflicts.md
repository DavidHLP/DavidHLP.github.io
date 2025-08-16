---
title: Ubuntu 24.04 安装旧软件报错“缺少 `libcups2`”的解决方案
published: 2025-07-09
tags: [Ubuntu, T64 ABI]
category: Ubuntu
description: 本文记录了在 Ubuntu 24.04 LTS 环境下，由于 T64 ABI 迁移导致旧软件依赖报错的诊断过程和解决方案。
draft: false
---

## 问题背景

- 从 **Ubuntu 24.04 (Noble)** 开始，许多库包进入 **T64 ABI** 迁移。
- `libcups2` 被替换成了 **`libcups2t64`**。
- 许多旧 `.deb` 软件（如 Kiro）仍然写死依赖 `libcups2`，导致安装时报错：

  ```
  依赖关系无法满足：需要 libcups2
  ```

## 解决思路

通过 `equivs` 创建一个 **虚拟的 `libcups2` 包**，依赖系统现有的 `libcups2t64`，从而绕过依赖错误。

## 步骤

1. **安装 `equivs` 工具**

   ```bash
   sudo apt update
   sudo apt install equivs -y
   ```

2. **生成控制文件**

   ```bash
   equivs-control libcups2
   ```

3. **编辑 `libcups2` 文件，内容示例：**

   ```text
   Package: libcups2
   Version: 9.9.9
   Architecture: amd64
   Maintainer: You <you@example.com>
   Depends: libcups2t64
   Description: Dummy package to satisfy libcups2 dependency
    This package is a dummy package that depends on libcups2t64.
   ```

   > 注意：
   >
   > - `Version` 一定要设置得 **高于** 系统里的 `libcups2t64` 破坏阈值（推荐 `9.9.9`）。
   > - `Depends` 写成 `libcups2t64`。

4. **构建虚拟包**

   ```bash
   equivs-build libcups2
   ```

   输出类似：

   ```
   The package has been created in the /home/USER/tmp directory
   ```

5. **安装虚拟包**

   ```bash
   sudo dpkg -i ~/tmp/libcups2_9.9.9_amd64.deb
   ```

6. **验证安装**

   ```bash
   dpkg -l | grep libcups2
   ```

   应该能看到：

   ```
   ii  libcups2          9.9.9   amd64   Dummy package to satisfy libcups2 dependency
   ii  libcups2t64:amd64 2.4.7   amd64   Common UNIX Printing System(tm) - Core library
   ```

7. **重新安装目标软件**

   ```bash
   sudo apt install ./kiro.deb
   ```

   这时依赖关系会被正确满足。

---

## 移除虚拟包

```bash
sudo dpkg --purge libcups2
sudo apt autoremove -y
```
