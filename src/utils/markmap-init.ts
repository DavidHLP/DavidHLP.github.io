import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";

const transformer = new Transformer();

/**
 * 将 ```markmap``` 代码块转换为交互式思维导图
 */
export function initMarkmap() {
	const codeBlocks = document.querySelectorAll<HTMLElement>("pre code.language-markmap");

	codeBlocks.forEach(codeBlock => {
		const pre = codeBlock.parentElement;
		if (!pre) return;

		const wrapper = pre.parentElement;
		if (!wrapper) return;

		const markdown = codeBlock.textContent ?? "";
		const { root } = transformer.transform(markdown.trim());

		const container = document.createElement("div");
		container.className = "markmap-container";

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.classList.add("markmap");
		// 设置 SVG 为响应式，移除固定尺寸
		svg.style.width = "100%";
		svg.style.height = "400px";
		svg.removeAttribute("width");
		svg.removeAttribute("height");
		container.appendChild(svg);

		wrapper.replaceChild(container, pre);

		try {
			const mm = Markmap.create(
				svg,
				{
					duration: 500,
					maxWidth: 0, // 禁用最大宽度限制，让节点自动扩展
					initialExpandLevel: -1, // 展开所有层级
					spacingHorizontal: 120, // 进一步增加水平间距
					spacingVertical: 10, // 垂直间距
					paddingX: 20, // 增加左右内边距
					autoFit: true, // 自动适配
					fitRatio: 0.9 // 让图表占据 90% 的可用空间
				},
				root
			);
			// 手动调整初始缩放，让图表更大
			setTimeout(() => mm.fit(), 100);
		} catch (error) {
			console.error("[markmap] render error", error);
			const fallback = document.createElement("pre");
			fallback.textContent = markdown;
			container.replaceWith(fallback);
		}
	});
}
