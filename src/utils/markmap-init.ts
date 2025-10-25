import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";

const transformer = new Transformer();

/**
 * 创建全屏模态框显示放大的 markmap
 */
function createFullscreenModal(originalSvg: SVGSVGElement, markdown: string, root: any) {
	// 创建模态框容器
	const modal = document.createElement("div");
	modal.className = "markmap-modal";
	modal.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.9);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: zoom-out;
	`;

	// 创建关闭按钮
	const closeBtn = document.createElement("button");
	closeBtn.innerHTML = "✕";
	closeBtn.style.cssText = `
		position: absolute;
		top: 20px;
		right: 20px;
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 24px;
		cursor: pointer;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	`;
	closeBtn.onmouseenter = () => (closeBtn.style.background = "rgba(255, 255, 255, 1)");
	closeBtn.onmouseleave = () => (closeBtn.style.background = "rgba(255, 255, 255, 0.9)");

	// 创建 SVG 容器
	const svgContainer = document.createElement("div");
	svgContainer.style.cssText = `
		width: 95vw;
		height: 90vh;
		background: white;
		border-radius: 8px;
		padding: 20px;
		overflow: auto;
		cursor: default;
	`;

	// 创建放大的 SVG
	const enlargedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	enlargedSvg.style.cssText = `
		width: 100%;
		height: 100%;
		display: block;
	`;

	svgContainer.appendChild(enlargedSvg);
	modal.appendChild(closeBtn);
	modal.appendChild(svgContainer);

	// 阻止点击 SVG 容器时关闭模态框
	svgContainer.onclick = e => e.stopPropagation();

	// 关闭模态框
	const closeModal = () => {
		modal.remove();
		document.body.style.overflow = "";
	};

	closeBtn.onclick = closeModal;
	modal.onclick = closeModal;

	// 按 ESC 键关闭
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			closeModal();
			document.removeEventListener("keydown", handleEscape);
		}
	};
	document.addEventListener("keydown", handleEscape);

	// 添加到页面
	document.body.appendChild(modal);
	document.body.style.overflow = "hidden";

	// 渲染放大的 markmap
	try {
		const mm = Markmap.create(
			enlargedSvg,
			{
				duration: 500,
				maxWidth: 0,
				initialExpandLevel: -1,
				spacingHorizontal: 150,
				spacingVertical: 15,
				paddingX: 30,
				autoFit: true,
				fitRatio: 0.95
			},
			root
		);
		setTimeout(() => mm.fit(), 100);
	} catch (error) {
		console.error("[markmap] modal render error", error);
	}
}

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
		svg.style.cursor = "zoom-in"; // 添加放大光标提示
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

			// 添加点击放大功能
			svg.addEventListener("click", e => {
				// 检查是否点击的是节点，如果是则不触发放大
				const target = e.target as HTMLElement;
				if (target.tagName === "foreignObject" || target.closest("foreignObject")) {
					return; // 点击节点时不放大，保持节点的交互功能
				}
				createFullscreenModal(svg, markdown, root);
			});
		} catch (error) {
			console.error("[markmap] render error", error);
			const fallback = document.createElement("pre");
			fallback.textContent = markdown;
			container.replaceWith(fallback);
		}
	});
}
