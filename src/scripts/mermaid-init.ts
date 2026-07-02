/**
 * Mermaid renderer. Re-renders every `.mermaid` element on the page using
 * the active theme, normalises the resulting SVG (viewBox, dimensions, CJK
 * font fallback), and wires up the dblclick → PhotoSwipe zoom preview.
 *
 * Safe to call repeatedly: previously-rendered diagrams are reset from the
 * cached `data-original-content` so the re-render is faithful. Calls
 * `initImageViewer` at the end so any embedded images Mermaid produces
 * are wrapped for PhotoSwipe without the caller having to coordinate.
 */
import mermaid from "mermaid";
import { initImageViewer } from "./photoswipe-init";

/** Lazily-open a single SVG inside PhotoSwipe, with a theme-aware backdrop. */
async function openMermaidPreview(svg: SVGSVGElement, width: number, height: number): Promise<void> {
	const { default: PhotoSwipe } = await import("photoswipe");

	const clone = svg.cloneNode(true) as SVGSVGElement;
	if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	clone.setAttribute("width", String(width));
	clone.setAttribute("height", String(height));
	clone.setAttribute("style", `max-width: ${width}px;`);

	const viewBox = clone.getAttribute("viewBox")?.split(/\s+/).map(Number);
	const rectX = viewBox && viewBox.length === 4 ? viewBox[0] : 0;
	const rectY = viewBox && viewBox.length === 4 ? viewBox[1] : 0;
	const rectW = viewBox && viewBox.length === 4 ? viewBox[2] : width;
	const rectH = viewBox && viewBox.length === 4 ? viewBox[3] : height;
	const background = document.documentElement.dataset.theme === "dark" ? "#0f2a3d" : "#fffffd";

	const backgroundRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	backgroundRect.setAttribute("x", String(rectX));
	backgroundRect.setAttribute("y", String(rectY));
	backgroundRect.setAttribute("width", String(rectW));
	backgroundRect.setAttribute("height", String(rectH));
	backgroundRect.setAttribute("fill", background);
	clone.insertBefore(backgroundRect, clone.firstChild);

	const svgString = new XMLSerializer().serializeToString(clone);
	const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

	const preview = new PhotoSwipe({
		dataSource: [{ src: dataUrl, width, height, alt: "Mermaid diagram" }],
		index: 0,
		bgOpacity: 1,
		padding: { top: 20, bottom: 20, left: 20, right: 20 },
		showHideAnimationType: "zoom"
	});
	preview.init();
}

/**
 * Resolve explicit pixel dimensions from a Mermaid SVG's viewBox (Mermaid
 * emits `width="100%"` which makes repeated theme renders harder to size
 * consistently) and patch the CJK font fallback into the embedded <style>.
 */
function normalizeSvg(svg: SVGElement): void {
	const vb = svg.getAttribute("viewBox")?.split(/\s+/);
	const svgW = vb && vb.length === 4 ? parseFloat(vb[2]) : parseFloat(svg.getAttribute("width") || "800");
	const svgH = vb && vb.length === 4 ? parseFloat(vb[3]) : parseFloat(svg.getAttribute("height") || "600");
	const vbX = vb && vb.length === 4 ? parseFloat(vb[0]) : 0;
	const vbY = vb && vb.length === 4 ? parseFloat(vb[1]) : 0;

	if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	svg.setAttribute("viewBox", `${vbX} ${vbY} ${svgW} ${svgH}`);
	svg.setAttribute("width", String(svgW));
	svg.setAttribute("height", String(svgH));
	svg.setAttribute("style", `max-width: ${svgW}px; width: 100%; height: auto;`);

	// Append CJK font fallbacks to the embedded <style> block so labels render
	// correctly when Mermaid injects its own font stack.
	svg.querySelectorAll("style").forEach(styleEl => {
		const text = styleEl.textContent || "";
		if (!/Noto Serif CJK|Noto Sans CJK|Source Han|PingFang|Microsoft YaHei/.test(text)) {
			styleEl.textContent = text.replace(
				/font-family\s*:\s*([^;}]+)/g,
				(_, families) =>
					`font-family:${families},"Noto Serif CJK SC","Source Han Serif SC","Source Han Sans SC","Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif`
			);
		}
	});

	svg.style.cursor = "zoom-in";
	svg.addEventListener("dblclick", event => {
		event.preventDefault();
		void openMermaidPreview(svg as SVGSVGElement, svgW, svgH);
	});
}

export async function initMermaid(root: ParentNode = document): Promise<void> {
	const elements = root.querySelectorAll<HTMLElement>(".mermaid");
	if (elements.length === 0) return;

	// Clear existing rendered diagrams to force a faithful re-render.
	for (const el of Array.from(elements)) {
		if (el.getAttribute("data-processed")) {
			el.removeAttribute("data-processed");
			el.innerHTML = el.getAttribute("data-original-content") || el.innerHTML;
		} else {
			el.setAttribute("data-original-content", el.innerHTML);
		}
	}

	mermaid.initialize({
		startOnLoad: false,
		theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
		securityLevel: "loose"
	});
	await mermaid.run();

	document.querySelectorAll<SVGElement>(".mermaid svg").forEach(normalizeSvg);

	// Keep the image viewer current for any new images Mermaid may have produced.
	initImageViewer();
}
