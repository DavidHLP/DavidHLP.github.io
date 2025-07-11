---
title: Ubuntu 上通过 APT 安装 VsCode
published: 2025-06-17
tags: [Ubuntu, VsCode]
category: Ubuntu
description: Ubuntu 上通过 APT 安装 Visual Studio Code 权威指南
draft: false
---

## **在 Ubuntu 上通过 APT 安装 Visual Studio Code 权威指南**

**文档版本:** 1.0
**最后更新:** 2025 年 7 月 11 日

### **简介**

本指南将详细介绍在 Ubuntu 及其他基于 Debian 的 Linux 发行版上，通过 `APT` 包管理器安装 **Visual Studio Code (VS Code)** 的官方推荐方法。

**重要概念澄清：**

- **Visual Studio** 是微软的重量级集成开发环境 (IDE)，主要用于 Windows。它**无法**在 Ubuntu 上安装。
- **Visual Studio Code (VS Code)** 是一个轻量级、免费且跨平台的代码编辑器，功能强大，扩展丰富，是 Linux 开发者的首选工具之一。我们将在本文中安装它。

使用官方源和 `APT` 进行安装是最佳实践，因为它可以确保你获得及时的软件更新，并与系统更新无缝集成。

### **前提条件**

- 一台运行 Ubuntu 或其衍生版（如 Linux Mint, Pop\!\_OS）的计算机。
- 拥有 `sudo` 权限的用户账户。
- 稳定的互联网连接。

---

## **安装步骤**

我们将通过配置微软官方的 `apt` 软件源来安装 VS Code。

### **步骤 1: 更新系统并安装依赖**

打开终端（Terminal），首先更新你的包列表，并安装一些必要的工具软件，以确保后续步骤能顺利进行。

```bash
sudo apt update
sudo apt install software-properties-common apt-transport-https wget -y
```

- **说明**:
  - `apt-transport-https`: 允许 `apt` 通过安全的 HTTPS 协议下载软件包。
  - `wget`: 一个用于从网络下载文件的命令行工具。
  - `software-properties-common`: 提供管理软件源的辅助工具。

### **步骤 2: 导入微软官方 GPG 密钥**

GPG 密钥用于验证从软件源下载的软件包确实来自微软，且未经篡改，是保障软件安全的重要一步。

```bash
# 1. 下载微软GPG密钥并解密
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg

# 2. 将密钥安装到推荐的密钥环目录中
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg

# 3. 删除下载的临时密钥文件
rm packages.microsoft.gpg
```

- **说明**: 此方法将密钥存储在 `/etc/apt/keyrings/` 目录中，这是当前 `apt` 推荐的、更安全的密钥管理方式，避免了全局信任的问题。

### **步骤 3: 添加 VS Code 官方软件源**

现在，我们将微软的软件源地址添加到你的系统中，这样 `apt` 才能知道去哪里下载 VS Code。

```bash
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
```

- **说明**:
  - 此命令会创建一个新的软件源列表文件 `/etc/apt/sources.list.d/vscode.list`。
  - `signed-by=` 部分明确指定了只使用我们在上一步中添加的密钥来验证这个源，提高了安全性。

### **步骤 4: 更新并安装 VS Code**

最后，再次更新包列表以包含来自新添加源的软件信息，然后安装 VS Code。

```bash
# 再次更新包列表
sudo apt update

# 安装VS Code（其包名为 code）
sudo apt install code
```

安装完成后，VS Code 已经成功地集成到你的系统中了。

---

## **安装后操作**

### **如何启动 VS Code?**

- **图形界面**: 在你的应用程序菜单中找到 "Visual Studio Code" 并点击启动。
- **终端**: 在任何目录下打开终端，输入 `code` 并按回车。
  ```bash
  code
  # 或者用 code . 在当前目录打开VS Code
  code .
  ```

### **如何更新 VS Code?**

由于我们使用了官方软件源，你无需手动更新 VS Code。当你运行标准的系统更新命令时，VS Code 会自动一起更新。

```bash
sudo apt update
sudo apt upgrade
```

### **如何卸载 VS Code?**

如果你想卸载 VS Code，可以执行以下命令：

```bash
# 仅卸载软件，保留配置文件
sudo apt remove code

# 如果想彻底清除，包括软件源和GPG密钥
sudo apt remove code
sudo rm /etc/apt/sources.list.d/vscode.list
sudo rm /etc/apt/keyrings/packages.microsoft.gpg
sudo apt update # 刷新配置
```

---

## **常见问题与排错 (Troubleshooting)**

如果你在安装过程中遇到问题，很可能是因为系统中存在旧的或冲突的配置。

### **问题 1: `Signed-By` 冲突错误**

- **错误信息**: `E: ... 的选项 Signed-By 中含有互相冲突的值 ...`
- **原因**: 系统中存在多个指向 VS Code 源的配置文件，且它们指定的 GPG 密钥位置不同。
- **解决方案**:
  1.  使用 `grep` 命令找到所有相关的配置文件：
      ```bash
      grep -r "packages.microsoft.com/repos/code" /etc/apt/
      ```
  2.  根据 `grep` 的输出，删除所有找到的配置文件（例如 `/etc/apt/sources.list.d/vscode.sources`, `/etc/apt/sources.list.d/vscode.list` 或主文件 `/etc/apt/sources.list` 中的相关行）。
  3.  然后从本文的**安装步骤**从头开始。

### **问题 2: `NO_PUBKEY` 公钥缺失错误**

- **错误信息**: `W: ... 由于没有公钥，无法验证下列签名： NO_PUBKEY ...`
- **原因**: 系统知道软件源的地址，但找不到用于验证它的 GPG 密钥。这通常发生在清理不彻底之后。
- **解决方案**: 这同样意味着有残留的配置文件。请参照**问题 1**的解决方案，使用 `grep` 找到并删除所有残留配置，然后再重新开始安装。
