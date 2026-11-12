---
title: 解决 Ubuntu 24.04 下 Chrome 无法使用 Fcitx5 搜狗输入法的问题
published: 2025-07-09
tags: [Chrome, Ubuntu, Sogou, Fcitx5]
category: Ubuntu
description: 本文记录了在 Ubuntu 24.04 LTS 环境下，由于 GTK4 前端模块缺失导致 Chrome 浏览器无法正常调用 Fcitx5 输入法（如搜狗输入法）的诊断过程和解决方案。
draft: false
---

### 问题背景

在 Ubuntu 24.04 LTS 上，部分用户报告在 Chrome 浏览器及其他基于 GTK4 的应用程序中无法激活 Fcitx5 输入法。本文将对此问题进行分析并提供解决方案。

### 环境信息

问题复现环境如下：

- **OS**: `Ubuntu 24.04 LTS`
- **Chrome Version**: `138.0.7204.92` (或更高版本)
- **Input Method Framework**: `Fcitx5`
- **Sogou Pinyin**: `sogoupinyin_4.2.1.145_amd64.deb` (或其他版本)

### 症结所在

问题根源在于 Chrome 浏览器（及其他应用）更新其 UI 工具包至 GTK4。Fcitx5 输入法框架需要 `fcitx5-frontend-gtk4` 模块作为其与 GTK4 应用程序通信的前端。若系统缺少该模块，Fcitx5 将无法在这些应用中正常工作。

### 解决方案

解决方案是安装 Fcitx5 缺失的 GTK4 前端模块。

执行以下命令：

```bash
sudo apt update
sudo apt install fcitx5-frontend-gtk4
```

**命令说明:**

- `sudo apt update`: 同步 `apt` 软件包索引，确保获取最新的软件包版本。
- `sudo apt install fcitx5-frontend-gtk4`: 安装 Fcitx5 的 GTK4 前端支持模块。

安装完成后，需**完全退出并重启 Chrome 浏览器**以加载新的模块。

重启 Chrome 后，输入法应恢复正常。此方法同样适用于其他因缺少 GTK 前端而无法使用输入法的 GTK4/GTK3/Qt 应用程序，只需安装对应的 `fcitx5-frontend-gtk3` 或 `fcitx5-frontend-qt5` 等包即可。
