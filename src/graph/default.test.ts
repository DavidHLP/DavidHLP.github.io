import { describe, expect, it } from "vitest";
import { template } from "./default";

/**
 * The default OG template is a pure data function: it takes a typed
 * `DefaultProps` object and returns a satori-compatible VNode tree.
 * The interesting logic is the structure: the favicon, the title,
 * the description, the author — all rendered into a 1200×630 card.
 * Tests pin the structural contract; satori rendering itself is the
 * pipeline's concern (see `render.test.ts`).
 */

/** A permissive VNode shape used by the assertion helpers. */
type VNode = {
	type?: string;
	props?: {
		style?: Record<string, unknown>;
		children?: unknown;
		src?: string;
		alt?: string;
	};
};

/** Find the first child whose `style` matches the given predicate. */
function findChildWithStyle(vnode: VNode, predicate: (style: Record<string, unknown>) => boolean): VNode | undefined {
	const children = (vnode.props?.children as VNode[] | undefined) ?? [];
	return children.find((c: VNode) => {
		const s = c.props?.style;
		return !!s && predicate(s);
	});
}

/** Find the first child whose `style.fontSize` equals the given size. */
function findChildByFontSize(vnode: VNode, size: string): VNode | undefined {
	return findChildWithStyle(vnode, s => s.fontSize === size);
}

/** Find the first child whose `style.borderBottom` equals the given value. */
function findChildByBorderBottom(vnode: VNode, border: string): VNode | undefined {
	return findChildWithStyle(vnode, s => s.borderBottom === border);
}

const baseProps = {
	locale: "en",
	title: "Test Title",
	description: "Test description for the card.",
	author: "Test Author"
};

describe("default OG template", () => {
	it("returns a div root with full-card layout", () => {
		const vnode = template(baseProps) as VNode;
		expect(vnode.type).toBe("div");
		expect(vnode.props?.style?.width).toBe("100%");
		expect(vnode.props?.style?.height).toBe("100%");
	});

	it("embeds the site favicon (data URL)", () => {
		const vnode = template(baseProps) as VNode;
		const children = (vnode.props?.children as VNode[]) ?? [];
		const img = children.find((c: VNode) => c.type === "img");
		expect(img).toBeDefined();
		// ICON_DATA_URL is a base64-encoded SVG.
		expect(img?.props?.src).toMatch(/^data:image\/svg\+xml;base64,/);
		expect(img?.props?.alt).toBe("LOGO");
	});

	it("renders the title as the dominant span", () => {
		const vnode = template(baseProps) as VNode;
		const titleSpan = findChildByFontSize(vnode, "4rem");
		expect(titleSpan).toBeDefined();
		expect(titleSpan?.props?.children).toBe("Test Title");
	});

	it("renders the description as a secondary span", () => {
		const vnode = template(baseProps) as VNode;
		const descSpan = findChildByFontSize(vnode, "1.75rem");
		expect(descSpan).toBeDefined();
		expect(descSpan?.props?.children).toBe("Test description for the card.");
	});

	it("renders the author with an underline border", () => {
		const vnode = template(baseProps) as VNode;
		const authorSpan = findChildByBorderBottom(vnode, "2px solid");
		expect(authorSpan).toBeDefined();
		expect(authorSpan?.props?.children).toBe("Test Author");
	});

	it("uses the configured background colour", () => {
		const vnode = template(baseProps) as VNode;
		expect(vnode.props?.style?.background).toBe("#fffffd");
	});

	it("substitutes different props without mutating the input", () => {
		const propsA = { ...baseProps, title: "A" };
		const propsB = { ...baseProps, title: "B" };
		const vnodeA = template(propsA) as VNode;
		const vnodeB = template(propsB) as VNode;
		const titleA = findChildByFontSize(vnodeA, "4rem");
		const titleB = findChildByFontSize(vnodeB, "4rem");
		expect(titleA?.props?.children).toBe("A");
		expect(titleB?.props?.children).toBe("B");
	});
});
