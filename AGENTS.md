@/home/david/.codex/RTK.md
@/home/david/.omp/agent/RULES.md
@/home/david/.omp/agent/SYSTEM.md

# Rhine Lab Astro 博客模板

- 仅维护网页模板。Astro 管理内容、路由和静态构建；Markdown 位于 `content/blog/`，站点配置位于 `content/site.json`。
- 保留原生 Three.js 视觉、模型、材质、镜头、开场与交互，不启用前端或动效设计 Skill。五列构图保留，每列至少一篇已发布文章，编号与文章地址保持稳定。
- 保留自由平面拖动、持续惯性、循环、每列选档记忆、波浪与归位规则。档案抽取仅竖直升降，构图由相机完成；背景不能额外下沉。交互详情抬升 4.05，先转正再下降；原基线配色、材质与光照不变。
- 响应式适配不得改变模型的抽取高度及平面坐标；正常开场铺满视口。竖屏上方模型、下方独立正文。手机类型不强制降低画质；真实 iPhone 验证与 Chromium 模拟必须区分。
- 模型、字体、音频及许可和来源署名必须保留；独立许可 Novecento 字体不得进入 Git。用户已批准清理历史参考、实验和美术源工程，后续可查 Git 历史。
- 优先使用当前项目的 codebase-memory-mcp 图谱进行结构发现，确认项目、索引新鲜度及相关路径覆盖；索引不足时以源码补足。图谱未覆盖不代表源码不存在。
- 依赖安装、构建、测试和服务在 remote-dev 执行。本机用于源文件编辑与已授权 Git 操作。
- 完成正式功能验证后按既有流程提交、推送、创建 PR、检查 CI 并合并 main，无需再次询问。保留无关改动，不混入本任务。
- 基本检查：`npm run build`、`npm run check:content`、`npm run check:viewport`；部署包装变更另运行 `npm run build:cloudflare`。
