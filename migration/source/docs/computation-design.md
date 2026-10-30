# 计算机科学编辑视觉

## 当前首页主视觉：扬帆启航

按用户反馈，首页已恢复原站点的 `src/icons/site-logo.svg` 帆船，保留原有路径、船身浮动与波纹动画。使用正文墨色随深浅主题变化，红色仅用于图注；遵循全站减少动态效果设置。原图直接复用，不重新生成或改绘。以下计算图生成记录保留为历史方案，不再用于首页。

首页以计算图印刷封面建立视觉主题，依次呈现身份、工程实践、开源项目与排障文章。项目问题使用原生 `details` 展开；线性请求流仅作概念说明。简历直接从正文标题生成章节导航，保留原始经历、联系方式与打印能力，将友情链接与站点历史收起。新增界面文案提供中、英、日版本；中文技术文章链接明确标记语言。

配方：Neutral White `#FAFAF7`，Charcoal `#30343A` + Signal Red `#C83232`；chromatic + black；editorial cover；Programmatic grotesk + functional mono；机械网点、轻微墨色变化。原创计算图从多个分支汇入单根，以一条红色路径强调共享计算。使用内置 imagegen 生成，原图保存在 `public/images/computation-print.png`。生成结果为 1024 × 1536，网页保持其实际比例。

## 最终生成 Prompt

Create a contemporary computer-science editorial print, flat front-facing 3:4 canvas on clean Neutral White #FAFAF7 paper, for a software engineer's portfolio. Exactly two printing inks: Charcoal #30343A carries 82% of coverage in structure, screening and typography; Signal Red #C83232 carries 18% as one selected computation path. Chromatic + black plate mode, no third ink.

Editorial cover with balanced visual tension. One focal event: an enormous branching computation graph, rising diagonally from a single lower-right root into a fan of fine routed connections and circular nodes cropped through the right edge. Graph occupies 65% of the canvas. Reserve 35% empty paper, chiefly an open upper-left release zone. Seven-percent outer margins, asymmetric two-column alignment. One small red circled junction is the sole manual gesture. Headline tightly crosses the graph at its lower-left edge; never use a detached safe headline-left/image-right split.

Depict the conceptual relationship of many concurrent requests joining one computation, not a literal architecture diagram. Identity anchors: branching tree contour, a single shared root, circular junctions, one highlighted path. Render the graph as a mechanically reproduced technical engraving with fine halftone masses concentrated around the root; crisp thin charcoal connections open into exposed paper. Paper cutouts pass through the dense root. No laptop, monitor, code wallpaper, brain, robot, circuit-board stock illustration or floating 3D blocks.

Programmatic typography: medium engineered grotesk with tiny functional monospace, 8:1 scale contrast. Exact display phrase "many paths, one result" in restrained lowercase, split into two lines, aligned against and crossing the lower graph contour. The only secondary text is "COMPUTATION / 01" in small mono. Keep lettering precise and legible. No names, invented brands, URLs or extra copy.

Clean plate separation, medium mechanical screening and only subtle ink-density variation, stable seed many-paths-one-result-charcoal-red-editorial-cover. Modern clean paper, no aging, beige cast, gradients, digital glow, shadows, mockup, 3D depth, decorative cards, UI panels, stickers, scrapbook marks or vector-flat clip art. Preserve visible printed dots at close range and a recognizable branching silhouette at thumbnail size.

## 验证

- `pnpm check`：0 errors，0 warnings；保留 Mermaid 文件的 2 个既有弃用提示。
- `pnpm build`：74 页构建成功。
- `node scripts/editorial-smoke.mjs`：74 页基础语义与资源检查；中、英、日首页的双项目入口、封面，以及简历五个章节的锚点检查通过。
- 浏览器验证：桌面与 390px 手机视口；项目说明支持点击和 Enter 展开；简历目录可跳转；手机首页与简历无横向溢出；两个 Header 组件完成水合，无新增运行时错误。
- 打印媒体样式检查：隐藏工具栏、目录与补充信息，保留简历正文的五个章节。未实际调用打印机或导出 PDF。
- 未增加前端依赖或客户端脚本；简历原始内容未修改。
