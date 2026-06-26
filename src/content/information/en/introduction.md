<div class="not-prose flex flex-col md:flex-row justify-between items-start border-b border-weak/20 pb-6 mb-8 gap-4 select-text">
  <div>
    <h1 class="text-3xl font-serif font-light mb-1">Helian Peng (David)</h1>
    <p class="text-xs font-mono text-weak uppercase tracking-wider">// Junior Java Backend Engineer</p>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-mono text-secondary">
    <div>Chongqing, China / Age: 23</div>
    <div>WeChat: B1372998589</div>
    <div>Email: <a href="mailto:lysf15520112973@163.com" class="hover:underline">lysf15520112973@163.com</a></div>
    <div>Phone: +86 15520112973</div>
    <div>GitHub: <a href="https://github.com/DavidHLP" target="_blank" class="hover:underline">github.com/DavidHLP</a></div>
    <div>Blog: <a href="https://davidhlp.github.io/" target="_blank" class="hover:underline">davidhlp.github.io</a></div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 01 ]</span> Internship Experience

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-6">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary">Alibaba Cloud · Aegis Host Security (Beyondsoft Delivery)</div>
      <div class="text-xs font-mono text-weak">// 2026.01 - 2026.06</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase tracking-wider">Backend Developer Intern</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>Business Context</strong>: Participated in server-side R&D for Alibaba Cloud's private host security product (Aegis), focusing on cluster-side resource management, AI asset identification, complex query optimization, and online troubleshooting.</li>
      <li><strong>Cluster Resource Integration</strong>: Independently linked GPU resource stats across Platform, Cluster, ECS, BMS, and BMCP layers, supporting aggregate statistics, multi-criteria filtering, and complex query APIs.</li>
      <li><strong>AI Asset Identification</strong>: Designed and implemented test containers for Ollama, OpenClaw, etc., to simulate runtime environments; analyzed running states, GPU associations, and vulnerability metrics to display risks.</li>
      <li><strong>Query Performance Tuning</strong>: Analyzed SQL execution plans and rebuilt index structures, optimizing core statistical query latency from seconds to milliseconds.</li>
      <li><strong>containerd/Harbor Troubleshooting</strong>: Debugged TLS cert verification issues in containerd and CA trust chains, creating troubleshooting checklists and diagnostics scripts.</li>
      <li><strong>Online Defect Resolution</strong>: Resolved 20+ defects using Arthas commands (<code>watch</code>, <code>trace</code>, <code>stack</code>) to analyze stack traces and parameters in live environments.</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 02 ]</span> Project Experience

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-8">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>ResiCache: Cache Protection Middleware</span>
        <a href="https://github.com/DavidHLP/ResiCache" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.01 - Present</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">Tech Stack: Spring Boot 3 / Redis / Redisson / Caffeine / SPI / Micrometer</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>Declarative Cache</strong>: Built custom <code>@RedisCacheable</code> annotations using Spring AOP, decoupling cache read, empty value write-back, pre-refresh, and TTL jitter.</li>
      <li><strong>Handler Chain Defense</strong>: Designed <code>CacheHandlerChain</code> to break down BloomFilter, SyncLock, PreRefresh, and TTL jitter into independent Handlers, supporting SPI plugins.</li>
      <li><strong>Penetration & Avalanche Protection</strong>: Implemented JVM BitSet + Redis Pipeline layered Bloom filtering for penetration protection; combined TTL random jitter and async pre-refresh for avalanche defense.</li>
      <li><strong>Breakdown Prevention</strong>: Leveraged local JVM lock and Redisson distributed lock to enforce double synchronization, avoiding database surge upon hot key expiration.</li>
      <li><strong>Observability & Tests</strong>: Exposed hit rates and latencies via Micrometer; containerized Redis testing with Testcontainers.</li>
    </ul>
  </div>
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>UltiCode: Online Programming Judge</span>
        <a href="https://github.com/DavidHLP/UltiCode" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.10 - Present</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">Tech Stack: Spring Boot 3 / Security / Redis / JWT / MeiliSearch / Docker / Vue 3</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>Isolated Judge Sandbox</strong>: Executed Python, Java, C/C++ code inside isolated Docker containers, leveraging seccomp privilege dropping, resource limits, and non-root users to mitigate execution risks.</li>
      <li><strong>Async Judge Flow</strong>: Dispatched tasks via Redis Stream & Consumer Groups for rate limiting and load balancing; monitored workers with heartbeats and retry policies.</li>
      <li><strong>Leaderboard Aggregate</strong>: Optimized ICPC/IOI standings computation, restructuring loops into multi-dimensional aggregation queries to lower database and CPU overhead.</li>
      <li><strong>Multi-level Caching</strong>: Implemented a two-level cache using Caffeine + Redis; integrated MeiliSearch for high-throughput full-text search.</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 03 ]</span> Professional Skills

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// Backend & Databases</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>Proficient in Java / JVM and enterprise frameworks (Spring Boot, Security, MyBatis-Plus).</li>
      <li>Familiar with MySQL schema design and query optimization; experienced with execution plan analysis and index tuning.</li>
      <li>Experienced with Redis, Redisson distributed locks, and multi-level cache design.</li>
    </ul>
  </div>
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// Devops & Troubleshooting</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>Familiar with Docker networking and sandbox isolation; experienced with containerd, Harbor, K8s image pulling, and CA cert setup.</li>
      <li>Skilled in online debugging with Arthas (watch, trace, stack) to profile method latency and exception flows.</li>
      <li>Familiar with Git, Maven, Flyway migrations, and Micrometer/Prometheus monitoring.</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 04 ]</span> Education & Honors

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// Education</h3>
    <div class="border-l border-weak/20 pl-4 py-1">
      <div class="font-serif font-medium text-base text-primary">Luoyang Normal University</div>
      <div class="text-xs text-secondary">B.S. in Data Science and Big Data Technology</div>
      <div class="text-xs font-mono text-remark mt-1">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// Honors & Awards</h3>
    <div class="border-l border-weak/20 pl-4 py-1 text-xs text-secondary space-y-1.5">
      <div>🏆 National 3rd Prize · <strong>2025 Blue Bridge Cup Java Software Design Group B</strong></div>
      <div>🏆 National 3rd Prize · <strong>2024 Teddy Cup Data Analysis Challenge</strong></div>
      <div>🏆 National 3rd Prize · <strong>2023 National College Computer Skill Challenge</strong></div>
    </div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 05 ]</span> Personal Value

<div class="border-t border-weak/10 pt-6 mt-8 flex flex-col gap-6 select-text">
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// Core Competencies</h3>
    <p class="text-sm text-secondary leading-relaxed">
      Equipped with real-world server-side development and troubleshooting experience in private cloud environments. Capable of analyzing complex workloads and implementing targeted optimizations for caching and query operations. Proven track record of delivering end-to-end bug fixes and diagnostic scripts, accompanied by active open-source contributions focusing on system observability and sandbox security.
    </p>
  </div>
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// Personal Statement</h3>
    <p class="text-sm text-secondary leading-relaxed font-light">
      Dedicated to Java backend engineering and system stability. Advocate for writing clean, readable, highly cohesive, and decoupled code. Through production internships and complex side projects, I have established solid monitoring and profiling skills. Eager to tackle challenges in complex business domains and large-scale systems to craft high-performance, high-availability backend foundations.
    </p>
  </div>
</div>
