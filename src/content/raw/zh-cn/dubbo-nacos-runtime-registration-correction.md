---
title: "Dubbo 3.3.6 + Nacos 配置键更正：registry URL 参数边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-tag-correction
sourceUrl: "https://github.com/apache/dubbo/tree/dubbo-3.3.6"
immutable: true
correctionOf: "dubbo-nacos-runtime-registration"
tags: [Apache Dubbo, Nacos, Registry, Configuration, RPC]
description: "对 Dubbo 3.3.6 + Nacos 初始 raw 校正 registry URL 参数：nacos.check、retry.period 与 register-consumer-url 应通过 Nacos registry URL 或 parameters 注入；enable-empty-protection 另有已核实的 flat 声明。"
---

# Dubbo 3.3.6 + Nacos 配置键更正

本文件是 `dubbo-nacos-runtime-registration` 的独立 correction raw，不覆盖、不删除初始快照。

## 配置键边界

在固定 Dubbo `dubbo-3.3.6` 源码中：

- `nacos.check` 是 Nacos registry URL 参数，示例：`dubbo.registry.address=nacos://host:8848?nacos.check=false`；
- `retry.period` 是 registry URL 参数，可写在 address query 或 `dubbo.registry.parameters.retry.period`；
- `register-consumer-url` 也从 registry URL 参数读取，应写成 address query 或 `dubbo.registry.parameters.register-consumer-url`，不要把未声明的 `dubbo.registry.register-consumer-url` flat 键当作通用语法；
- `enable-empty-protection` 从 registry URL 参数读取，同时 `RegistryConfig` 有 `@Parameter(key = ENABLE_EMPTY_PROTECTION_KEY)`，所以 `dubbo.registry.enable-empty-protection` flat 形式有源码依据。

可复现的示例是：

```properties
dubbo.registry.address=nacos://127.0.0.1:8848?nacos.check=true&retry.period=5000&register-consumer-url=false
dubbo.registry.group=DEFAULT_GROUP
dubbo.registry.check=true
dubbo.registry.enable-empty-protection=false
dubbo.registry.register-mode=all
```

## 固定来源

- Dubbo 固定 tag：<https://github.com/apache/dubbo/tree/dubbo-3.3.6>
- Nacos registry 源码目录：<https://github.com/apache/dubbo/tree/dubbo-3.3.6/dubbo-registry/dubbo-registry-nacos>
- Nacos registry 官方文档：<https://dubbo.apache.org/en/overview/mannual/java-sdk/reference-manual/registry/nacos/>

本 correction 只校正配置键读取路径；文档页面的兼容版本和真实 Nacos smoke test 仍按主 raw 的边界处理。
