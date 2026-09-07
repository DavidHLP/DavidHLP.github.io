<div class="not-prose flex flex-col md:flex-row justify-between items-start border-b border-weak/20 pb-6 mb-8 gap-4 select-text">
  <div>
    <h1 class="text-3xl font-serif font-light mb-1">贺恋棚</h1>
    <p class="text-xs font-mono text-weak uppercase tracking-wider">// Java 后端开发工程师</p>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-mono text-secondary">
    <div>城市: 重庆 / 23岁</div>
    <div>微信: B1372998589</div>
    <div>邮箱: <a href="mailto:lysf15520112973@163.com" class="hover:underline">lysf15520112973@163.com</a></div>
    <div>电话: 15520112973</div>
    <div>GitHub: <a href="https://github.com/DavidHLP" target="_blank" class="hover:underline">github.com/DavidHLP</a></div>
    <div>知识库: <a href="https://davidhlp.github.io/kb/" target="_blank" class="hover:underline">davidhlp.github.io/kb</a></div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 01 ]</span> 实习经历

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-6">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary">博彦科技</div>
      <div class="text-xs font-mono text-weak">// 2026.01 - 2026.06</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase tracking-wider">后端开发实习生｜阿里云专有云 · 安骑士主机安全项目</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>业务背景</strong>：参与安骑士主机安全产品服务端研发，负责集群资源数据接入、AI 资产识别、资源查询优化与线上问题排查。</li>
      <li><strong>GPU 资源接入</strong>：对接平台侧、ECS、BMS、BMCP 等团队，独立完成集群侧 GPU 信息接入与聚合，支撑资源统计、条件筛选与关联查询。</li>
      <li><strong>AI 资产识别</strong>：参与功能建设，独立搭建 OpenClaw、Ollama 测试容器环境；结合容器状态、GPU 关系与漏洞数据，实现资产状态判断、GPU 关联及风险展示逻辑。</li>
      <li><strong>复杂查询优化</strong>：针对资源查询接口延迟，分析 SQL 执行计划，调整索引、查询条件与覆盖字段，降低资源列表及统计接口的查询耗时。</li>
      <li><strong>线上问题定位</strong>：使用 Arthas <code>watch</code> / <code>trace</code> / <code>stack</code> 分析调用链、耗时、异常堆栈与关键参数，独立完成缺陷定位、修复及回归验证。</li>
      <li><strong>容器镜像排障</strong>：定位 containerd 拉取 Harbor 私有镜像时的 TLS 证书校验与信任链问题，排查 CA、<code>certs.d</code>、<code>hosts.toml</code>、<code>imagePullSecrets</code> 与节点缓存，沉淀诊断脚本和排查清单。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 02 ]</span> 项目经历

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-8">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>在线编程评测系统 UltiCode</span>
        <a href="https://github.com/DavidHLP/UltiCode" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.10 - 至今</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">技术栈: Java 17 / Spring Boot 3 / Spring Security / MyBatis-Plus / MySQL / Redis Streams / Dubbo / Flyway / Docker</div>
    <p class="text-sm text-secondary leading-relaxed mb-3">个人开源在线编程评测平台，覆盖练习、竞赛、代码提交、沙箱评测与后台管理。Submission 服务持有提交数据，独立 Judge Worker 执行判题，重点处理任务投递故障、重复执行与重判结果竞争。</p>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>事务 Outbox 投递</strong>：在本地事务内写入提交记录与判题 Outbox，后台向 Redis Streams 投递并更新发送状态，失败后退避重试；通过 Lua 合并去重标记与入队操作，处理标记已写入但消息未入队的故障窗口。</li>
      <li><strong>任务回收与死信</strong>：结合 <code>XPENDING</code> / <code>XCLAIM</code> 回收超时未确认任务，按处理容量和重试次数控制重新投递；耗尽预算后转入死信，避免无效任务反复占用判题资源。</li>
      <li><strong>重判结果竞争控制</strong>：以 <code>generation</code> + <code>attemptId</code> 标识有效执行，配合租约与心跳续租；结果写回使用带双条件的 SQL CAS，拒绝过期执行结果覆盖新一轮判题。</li>
      <li><strong>不可信代码执行约束</strong>：通过 Docker 配置禁网、非 root、只读根文件系统、Capabilities 裁剪及 Seccomp，结合 CPU、内存、PID 与文件句柄限额，限制用户代码权限和资源占用。</li>
      <li><strong>刷新令牌防重放</strong>：Refresh Token 仅以 SHA-256 哈希入库；轮换时校验用途、归属与有效期，通过条件更新限制旧令牌仅成功消费一次，并在同一事务内签发新令牌，处理并发刷新竞争。</li>
    </ul>
  </div>
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>ResiCache 缓存防护中间件</span>
        <a href="https://github.com/DavidHLP/ResiCache" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.01 - 至今</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">技术栈（当前开发线）: Java 21 / Spring Boot 4 / Spring Cache / Redis / Redisson / Micrometer / Testcontainers</div>
    <p class="text-sm text-secondary leading-relaxed mb-3">个人开源 Spring Cache 防护扩展，通过增强注解与责任链组合缓存防护策略，重点实现同 Key 请求合并、分布式加载协调、版本化提前过期与安全反序列化。</p>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>同 Key 请求合并</strong>：基于 <code>ConcurrentHashMap</code> + <code>CompletableFuture</code> 实现 JVM 内 Single-flight，由 Leader 获取分布式锁并加载数据，Follower 共享结果；锁内二次检查缓存，减少重复回源与锁竞争。</li>
      <li><strong>分层布隆过滤</strong>：组合本地过滤器与 Redis 过滤器，本地命中时跳过远端检查，本地未命中时查询远端并按结果回填；避免仅因本地未命中就拒绝有效业务加载。</li>
      <li><strong>版本化提前过期</strong>：通过 Redis Lua 原子校验缓存值版本并缩短 TTL，避免旧异步任务修改新值有效期；缓存到期后由后续请求触发加载，处理提前过期与更新、删除交错的竞态。</li>
      <li><strong>反序列化边界防护</strong>：使用 Jackson 流式扫描校验类型白名单，再解析版本化缓存封装；通过回归测试覆盖恶意类型标记与缓存元数据往返，校验阶段不构建完整 JSON 树。</li>
      <li><strong>异步任务去重</strong>：按 Key 维护 in-flight Future，避免重复调度；使用有界线程池队列与 <code>CallerRunsPolicy</code> 控制积压，处理任务完成与 Future 登记交错产生的清理竞态。</li>
      <li><strong>故障语义与验证</strong>：区分业务加载异常与缓存写回失败，加载成功后写回失败仍返回业务值；通过并发测试及真实 Redis 集成测试覆盖结果共享、异常传播、新值 TTL 保护与删除后不复活。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 03 ]</span> 专业技能

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// Java 后端与数据处理</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>熟悉 Java、Spring Boot、Spring MVC、Spring Security、MyBatis-Plus，具备接口设计、认证鉴权及异常处理实践。</li>
      <li>熟悉 MySQL 索引设计、执行计划分析与慢 SQL 优化；具有 Redis 缓存防护、分布式锁及并发加载实践。</li>
      <li>具有 Dubbo、Redis Streams、Outbox 项目实践，理解事务边界、重复消费、失败重试及最终一致性。</li>
    </ul>
  </div>
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// 故障排查与工程验证</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>能够结合 Arthas、Linux 进程信息、容器日志与 SQL 执行计划定位问题，并完成修复及回归验证。</li>
      <li>熟悉 Docker 镜像、网络、资源限制与基本隔离机制；具有 containerd、Harbor 及私有镜像 TLS 排障经验。</li>
      <li>熟悉 Git、Maven、Docker Compose、Flyway、Micrometer；使用 Testcontainers 及并发测试验证故障与竞态场景。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 04 ]</span> 教育背景 & 荣誉

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// 教育背景</h3>
    <div class="border-l border-weak/20 pl-4 py-1">
      <div class="font-serif font-medium text-base text-primary">洛阳师范学院</div>
      <div class="text-xs text-secondary">数据科学与大数据技术 · 本科</div>
      <div class="text-xs font-mono text-remark mt-1">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// 荣誉奖项</h3>
    <div class="border-l border-weak/20 pl-4 py-1 text-xs text-secondary space-y-1.5">
      <div>🏆 2025 蓝桥杯 Java 软件设计 B 组 · <strong>国家级三等奖</strong></div>
      <div>🏆 2024 泰迪杯数据分析技能赛 · <strong>国家级三等奖</strong></div>
      <div>🏆 2023 全国高校计算机能力挑战赛 · <strong>国家级三等奖</strong></div>
    </div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 05 ]</span> 开源贡献与技术沉淀

<div class="border-t border-weak/10 pt-6 mt-8 flex flex-col gap-6 select-text">
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// 开源贡献</h3>
    <p class="text-sm text-secondary leading-relaxed">
      <strong>codebase-memory-mcp</strong>：<a href="https://github.com/DeusData/codebase-memory-mcp/pull/1229" target="_blank" rel="noopener noreferrer" class="hover:underline">PR #1229</a> <strong>已合并</strong>。新增 Oh My Pi（OMP）客户端接入，支持配置目录识别、MCP 注册、Skill 安装及安装/卸载流程，补充配置隔离与用户内容保留测试。
    </p>
  </div>
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// 代表性技术知识页</h3>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><a href="https://davidhlp.github.io/note/java-online-performance-debug/" class="hover:underline">Java 线上性能排障：从症状到证据的最小决策树</a>：串联进程、线程栈、GC 与 Arthas 观测，整理止损、存证、定位及恢复流程。</li>
      <li><a href="https://davidhlp.github.io/note/containerd-tls-troubleshooting/" class="hover:underline">containerd TLS：证书信任链与临时跳过验证的决策</a>：区分运行时 CA、节点信任、Registry 认证与镜像缓存，整理分层诊断路径。</li>
    </ul>
  </div>
</div>
