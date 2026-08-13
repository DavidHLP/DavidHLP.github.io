---
title: "Apache Dubbo 3.3.6 + Nacos 运行时注册与 smoke test 契约"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-tag-and-docs
sourceUrl: "https://github.com/apache/dubbo/tree/dubbo-3.3.6"
immutable: true
tags: [Apache Dubbo, Nacos, Service Discovery, Registry, RPC, Smoke Test]
description: "固定 Apache Dubbo dubbo-3.3.6 与 Nacos 官方注册文档，记录接口级/应用级注册名、metadata、版本分组匹配、启动失败和最小真实 Nacos smoke test 边界。"
---

# Apache Dubbo 3.3.6 + Nacos 运行时注册与 smoke test 契约

本快照固定 Apache Dubbo `dubbo-3.3.6`（commit `f1585880bee4ca7776f44380c47c994217721ffe`，2025-10-16）及官方 Nacos registry 文档：

- 源码：<https://github.com/apache/dubbo/tree/dubbo-3.3.6>
- Nacos 注册文档：<https://dubbo.apache.org/en/overview/mannual/java-sdk/reference-manual/registry/nacos/>
- 兼容性说明：文档以 Nacos 2.x 为目标，示例推荐 Dubbo 3.3.0 + Nacos 2.3.0；本快照不把示例版本外推成所有组合的兼容保证。

## 1. Provider 的接口级注册名是可预测的

接口级 provider 服务名固定为：

```text
providers:{interface}:{version}:{group}
```

这是四段由冒号分隔的名称：

- `category` 默认是 `providers`；
- `interface` 是服务接口全名；
- `version`/`group` 为空时仍保留空段；
- provider 通过 Nacos `NamingService.registerInstance(serviceName, group, instance)` 注册；
- Nacos group 默认是 `DEFAULT_GROUP`，可由 `dubbo.registry.group` 修改；
- Nacos `Instance.metadata` 包含 provider URL 的完整参数。

因此，“Nacos 有实例”不足以证明 Dubbo consumer 能发现它；必须检查服务名、group、version 和 metadata 是否同时匹配。

## 2. 默认 `register-mode=all` 可能产生两类注册

应用级注册使用 `dubbo.application.name` 作为 Nacos service name。实例 metadata 可以包含：

- `dubbo.metadata-service.url-params`；
- `meta-v`；
- `dubbo.metadata.storage-type=local`；
- `dubbo.metadata.revision`；
- 多协议场景下的 `dubbo.endpoints`。

默认 `register-mode=all` 同时保留应用级与接口级注册；`instance` 或 `interface` 模式只保留对应层级。不能用“只看到应用名服务”或“只看到 providers 服务”推断另一层没有启用，必须核对实际配置和注册记录。

## 3. Consumer 的发现有接口级和应用级两条路径

接口级 consumer 订阅同名 `providers:...` 服务，由 Nacos naming event 推送实例；version/group 必须与订阅条件一致，订阅方也可以使用 `*` 或逗号范围表达通配/范围。

应用级发现通过 Nacos Config 的 mapping 数据和 MetadataService RPC 完成：

- mapping 的 group 为 `mapping`；
- 迁移默认策略为 `APPLICATION_FIRST`；
- 应用名、接口名、metadata revision 不是同一字段，排查时不要混为一个 service name。

## 4. 启动检查和运行期 fail-fast

典型配置键及固定源码/文档默认值：

```properties
dubbo.registry.address=nacos://127.0.0.1:8848
dubbo.registry.group=DEFAULT_GROUP
dubbo.registry.register-consumer-url=false
dubbo.registry.check=true
dubbo.registry.nacos-check=true
dubbo.registry.retry.period=5000
dubbo.registry.enable-empty-protection=false
dubbo.registry.register-mode=all
```

命名空间默认是 `public` 并直传给 Nacos client。启动行为分两层：

- provider 先 `doLocalExport` 绑定端口，再向 registry 注册；Nacos 不可达且 `nacos.check=true` 时启动失败；
- consumer 的 `check=true`（默认）在启动时没有 provider 会抛 `No provider available for the service`；
- 运行期禁止或无可用实例时，默认 fail-fast 路由会抛 `FORBIDDEN No provider available from registry`；
- failback 默认按 5 秒周期重试，但重试不改变首轮启动检查的结果。

## 5. Nacos 心跳是服务端边界

官方文档给出 Nacos 服务端的保活边界：

- `preserved.heart.beat.interval=5000ms`；
- `preserved.heart.beat.timeout=15000ms` 后标记不健康；
- `preserved.ip.delete.timeout=30000ms` 后删除实例。

这些不是 Dubbo registry 模块自身实现的协议；Nacos server 版本或部署配置变化时必须重新核对。

## 最小真实 Nacos smoke test

用固定的本地 Nacos 2.x 和 Dubbo provider/consumer fixture，依次断言：

1. **启动顺序**：Nacos 未启动时 provider/consumer 的失败信息分别符合 `nacos.check`/`check` 语义；启动 Nacos 后再启动应用。
2. **注册名**：控制台或 naming API 出现精确的 `providers:{interface}:{version}:{group}`。
3. **metadata**：provider metadata 含 protocol、path、methods、version、group 等 URL 参数。
4. **双注册**：默认 `register-mode=all` 同时有应用名服务和 providers 服务；切换 `instance`/`interface` 后只保留对应层。
5. **RPC**：consumer 能完成一次真实调用。
6. **版本约束**：provider `1.1.0` 与 consumer `1.0.0` 不匹配时 fail-fast；consumer 使用 `version=*` 时可发现允许范围内实例。
7. **恢复**：provider 下线后调用快速失败；provider 重启并重新注册后调用恢复。

Dubbo registry-nacos 自带测试以 mock `NamingService` 为主，不等价于上述真实 Nacos 集成验证；本快照没有执行真实 smoke test。

## 未验证边界

- `preserved.*` 的具体行为属于 Nacos server，非 Dubbo 源码保证；
- namespace 和鉴权是 nacos-client 直通参数；
- 单协议下 `dubbo.endpoints` 不写入，多协议/多端口下有覆盖边界；
- 远程 metadata center、mapping 的完整 dataId/group 组合未纳入本批 smoke；
- `nacos.register-compatible` 与 `nacos.subscribe.legacy-name` 已核对源码键，但没有在真实 Nacos 环境运行；
- 不把本快照外的业务服务名、内网主机或凭证写入知识库。
