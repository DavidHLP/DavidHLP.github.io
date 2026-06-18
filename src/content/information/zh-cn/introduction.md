<div class="not-prose flex flex-col md:flex-row justify-between items-start border-b border-weak/20 pb-6 mb-8 gap-4 select-text">
  <div>
    <h1 class="text-3xl font-serif font-light mb-1">贺恋棚</h1>
    <p class="text-xs font-mono text-weak uppercase tracking-wider">// 初级 Java 后端开发工程师</p>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-mono text-secondary">
    <div>城市: 重庆 / 22岁</div>
    <div>微信: b1372998589</div>
    <div>邮箱: <a href="mailto:lysf15520112973@163.com" class="hover:underline">lysf15520112973@163.com</a></div>
    <div>电话: 15520112973</div>
    <div>GitHub: <a href="https://github.com/DavidHLP" target="_blank" class="hover:underline">github.com/DavidHLP</a></div>
    <div>博客: <a href="https://davidhlp.github.io/" target="_blank" class="hover:underline">davidhlp.github.io</a></div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 01 ]</span> 实习经历

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-6">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary">阿里云 · 安骑士主机安全客户端（博彦交付）</div>
      <div class="text-xs font-mono text-weak">// 2026.01 - 2026.06</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase tracking-wider">后端开发实习生</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>业务背景</strong>：参与专有云安全产品安骑士服务端研发，负责集群侧资源管理、AI 资产识别、复杂查询调优与线上问题排查。</li>
      <li><strong>集群侧数据接入</strong>：独立打通平台侧、集群侧、ECS、BMS 多数据源 GPU 资源链条，支撑上层资源的高效统计、组合筛选与复杂查询。</li>
      <li><strong>AI 资产识别能力</strong>：设计实现 OpenClaw、Ollama 测试容器，基于运行状态、GPU 关联及漏洞数据，完成 AI 运行环境的风险识别与安全展示。</li>
      <li><strong>慢 SQL 性能优化</strong>：分析复杂 SQL 的执行计划并重构索引，将部分资源统计及筛选接口耗时从秒级优化至毫秒级。</li>
      <li><strong>containerd/Harbor 排障</strong>：排查 TLS 证书链及 CA 信任、ServiceAccount 凭证拉取等集群底座故障，编写沉淀排障诊断脚本与清单。</li>
      <li><strong>线上缺陷修复</strong>：熟练通过 Arthas <code>watch</code> / <code>trace</code> / <code>stack</code> 诊断工具捕获堆栈及入参，独立排查并闭环修复 20+ 个线上故障与缺陷。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 02 ]</span> 项目经历

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-8">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>ResiCache 缓存防护中间件</span>
        <a href="https://github.com/DavidHLP/ResiCache" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.01 - 至今</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">技术栈: Spring Boot 3 / Redis / Redisson / Caffeine / SPI / Micrometer</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>声明式缓存封装</strong>：基于 Spring AOP 拦截，自研 <code>@RedisCacheable</code> 等注解，解耦缓存读取、空值写入、预刷新及 TTL 扰动。</li>
      <li><strong>责任链防线设计</strong>：利用 <code>CacheHandlerChain</code> 将布隆过滤器、多级同步锁、预刷新、防雪崩 TTL 随机抖动模块进行解耦和 SPI 化。</li>
      <li><strong>穿透与雪崩防御</strong>：引入 JVM BitSet 结合 Redis Pipeline 分层布隆过滤防御穿透，引入 TTL 随机扰动结合异步预刷新抵御雪崩。</li>
      <li><strong>击穿两级锁控制</strong>：应用本地并发锁与 Redisson 分布式锁，避免热点 Key 过期瞬间大量请求穿透数据库。</li>
      <li><strong>可观测与集成测试</strong>：接入 Micrometer 暴露命中率、延时等度量指标，通过 Testcontainers 容器化技术保证 Redis 测试一致性。</li>
    </ul>
  </div>
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>在线编程评测系统 UltiCode</span>
        <a href="https://github.com/DavidHLP/UltiCode" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.10 - 至今</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">技术栈: Spring Boot 3 / Security / Redis / JWT / MeiliSearch / Docker / Vue 3</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>多语言隔离沙箱</strong>：基于 Docker 隔离，应用 seccomp 权限裁剪、资源限额保障判题执行安全性，防止用户代码恶意逃逸。</li>
      <li><strong>异步评测流转</strong>：以 Redis Stream 与 Consumer Group 传递任务流，保障判题接口削峰，配合心跳监控与重试确保评测高可用。</li>
      <li><strong>排行榜聚合优化</strong>：将 ICPC/IOI 排行榜高频计算，由重复遍历重构为多维度聚合计算，降低高频刷新时的 CPU 占用。</li>
      <li><strong>多级缓存与搜索</strong>：基于 Caffeine + Redis 构建本地与分布式两级缓存，接入 MeiliSearch 满足高吞吐文本检索。</li>
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
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// 后端开发与数据库</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>掌握 Java / JVM 及企业级开发框架 (Spring Boot, Security, MyBatis-Plus)。</li>
      <li>熟悉 MySQL 关系型数据库设计与优化，能进行慢 SQL 排障、执行计划分析与索引调整。</li>
      <li>熟悉 Redis 缓存机制、Redisson 分布式锁及多级缓存设计。</li>
    </ul>
  </div>
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// 容器架构与运维排障</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>掌握 Docker 容器网络、安全隔离；熟悉 containerd, Harbor, K8s 镜像 TLS 证书排障。</li>
      <li>熟练使用 Arthas 诊断命令（watch, trace, stack）在线分析方法耗时与异常堆栈。</li>
      <li>熟悉 Git 版本控制、Maven、Flyway 数据迁移与 Micrometer 监控组件。</li>
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

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 05 ]</span> 个人价值

<div class="border-t border-weak/10 pt-6 mt-8 flex flex-col gap-6 select-text">
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// 个人优势</h3>
    <p class="text-sm text-secondary leading-relaxed">
      拥有真实专有云安全产品线上功能开发及排障实习经验，能够针对业务痛点进行缓存、查询等专项性能优化；具备高标准排障闭环能力，能够独立编写自动排障清单与检测工具；拥有良好的架构学习热忱，通过两个完整开源项目沉淀落地可观测及沙箱安全。
    </p>
  </div>
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// 自我评价</h3>
    <p class="text-sm text-secondary leading-relaxed font-light">
      专注于 Java 开发与系统稳定性调优，崇尚编写干净、可读性强、职责解耦的高内聚代码。在真实的业务和个人项目中沉淀了较好的监控排障手段。希望能够在复杂的业务和大规模后台场景中，进一步打磨高性能和高可用服务底座。
    </p>
  </div>
</div>
