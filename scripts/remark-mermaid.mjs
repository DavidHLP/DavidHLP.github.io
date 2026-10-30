import { visit } from "unist-util-visit";
import { escapeHtml } from "../src/html.ts";

export default function remarkMermaid() {
  return tree => visit(tree, "code", node => {
    if (node.lang !== "mermaid") return;
    node.type = "html";
    node.value = `<pre class="mermaid">${escapeHtml(node.value)}</pre>`;
  });
}
