import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import type { Code } from "mdast";

const mermaid: RemarkPlugin = () => {
	return tree => {
		visit(tree, "code", (node: Code) => {
			if (node.lang === "mermaid") {
				// Change the node type to html to prevent Shiki from highlighting it
				// and wrap it in the format mermaid expects
				(node as any).type = "html";
				(node as any).value = `<div class="mermaid">${node.value}</div>`;
			}
		});
	};
};

export default mermaid;
