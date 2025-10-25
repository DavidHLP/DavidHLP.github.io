import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";

const transformer = new Transformer();

/**
 * 将 ```markmap``` 代码块转换为交互式思维导图
 */
export function initMarkmap() {
	const codeBlocks = document.querySelectorAll<HTMLElement>("pre code.language-markmap");

	codeBlocks.forEach((codeBlock) => {
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
		container.appendChild(svg);

		wrapper.replaceChild(container, pre);

		try {
			Markmap.create(svg, undefined, root);
		} catch (error) {
			console.error("[markmap] render error", error);
			const fallback = document.createElement("pre");
			fallback.textContent = markdown;
			container.replaceWith(fallback);
		}
	});
}
