# Mono-color 全站设计

配方：Neutral White `#FAFAF7` 纸白、Charcoal `#30343A` 主墨、Signal Red `#C83232` 导航与注释；Editorial cover；Literary serif + functional mono；机械网点、轻微墨色密度变化。原创对象为书页弧线，无参考图临摹。

全站共用 `src/styles/editorial.css`，保留三语言、深浅主题、知识库内容和简历打印。首页图像保留原始生成文件，正文图表不做会影响事实识别的双色转换。

## 验证

- `pnpm check`：0 errors，0 warnings；2 条既有 Mermaid API 弃用提示。
- `pnpm test:run`：140 passed，1 skipped。
- `pnpm build` + `node scripts/editorial-smoke.mjs`：74 个页面构建并通过标题、main 地标、服务端导航、样式和封面资源检查。
- 浏览器检查：中英日首页与列表、知识库、文章、关于、序文、政策、404/500；手机与平板宽度无横向溢出；桌面目录、手机菜单、标签筛选和深浅色切换正常。
- 生产构建保留既有 PhotoSwipe 静态/动态导入提示；本次未改其加载方式。

## 最终生成 Prompt

Create an original contemporary editorial print for a personal engineering and reading journal. Flat front-facing 3:4 canvas, Neutral White #FAFAF7 clean substrate, selected for crisp reading. Exactly two inks: Charcoal #30343A carries 82% of printed coverage in the object and main typography; Signal Red #C83232 carries 18% in one page edge and short annotation. No other inks. Complementary duotone.

Editorial cover, relaxed tension. One focal event: an enormous cropped open book viewed from its fore-edge, fanned pages forming an architectural curve across the lower two thirds, cropping through the right edge. 7% margins, asymmetric two-column alignment, 40% empty paper especially upper right. One tiny red hand-drawn underline is the sole manual gesture. No other decorative marks.

The subject is an ordinary thick open reference book: retain the spine, fanned page edges, and one folded page corner. Mechanical medium halftone screening in charcoal, with exposed white paper cutting through the page stack; no legible text on the book itself. Red only on one narrow folded leaf, supporting the same focal event. Observational, tactile but contemporary, no historical props.

Literary typography: characterful serif paired with tiny functional mono, at least 8:1 scale contrast. Exact display phrase “notes in progress” in three natural lowercase lines aligned upper left, the last line locks tightly against and slightly crosses the top book contour. No other words, invented labels, logo, URL, or branding.

Clean plate separation with subtle 6% uneven ink density only within the image, stable imperfection seed notes-in-progress-charcoal-red-cover. Fine visible screening, clean neutral paper. No aging, yellowing, grunge, torn paper, glossy mockup, cast shadow, gradients, 3D advertising render, full-color photography, centered symmetry, UI cards, stickers, or decorative blobs.
