export async function renderDiagrams(root: ParentNode) {
  if (!root.querySelector('pre[data-language="mermaid"]:not([data-processed])')) return;
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, fontFamily: "MiSans, sans-serif" });
  const nodes = [...root.querySelectorAll<HTMLElement>('pre[data-language="mermaid"]:not([data-processed])')].filter(node => node.isConnected);
  if (nodes.length) await mermaid.run({ nodes });
}
