import { describe, expect, it } from "vitest";
import { template } from "./content";

/**
 * The content OG template is a pure data function: it takes a typed
 * `ContentProps` object (locale, type, site, author, title, time,
 * series, tags) and returns a satori-compatible VNode tree. Tests
 * pin the structural contract: the type label, the series (when
 * present), the title, the date + tags row, the divider, the site
 * footer. satori rendering itself is the pipeline's concern.
 */

/** A permissive VNode shape used by the assertion helpers. */
type VNode = {
	type?: string;
	props?: {
		style?: Record<string, unknown>;
		children?: unknown;
		src?: string;
	};
};

/** Get the array of children of a VNode, treating missing children as []. */
function getChildren(vnode: VNode): VNode[] {
	return (vnode.props?.children as VNode[] | undefined) ?? [];
}

/** Get the Nth child of a VNode (0-indexed). */
function getChild(vnode: VNode, index: number): VNode | undefined {
	return getChildren(vnode)[index];
}

const baseProps = {
	locale: "en",
	type: "Note",
	site: "Test Site",
	author: "Test Author",
	title: "Test Title",
	time: "2025/04/04"
};

/**
 * Tree shape (matches the template in `./content`):
 *
 *   div (root, full-card padding)
 *     div (inner column)
 *       span (type label, borderLeft)
 *       span (title, 4rem)
 *       div (date row)
 *         time
 *         [separator, ...tag spans]  (when tags present)
 *     hr (divider)
 *     div (footer row)
 *       div (logo + site)
 *         img
 *         span (site)
 *       div (author)
 */

describe("content OG template", () => {
	it("returns a div root with full-card padding", () => {
		const vnode = template(baseProps) as VNode;
		expect(vnode.type).toBe("div");
		expect(vnode.props?.style?.width).toBe("100%");
		expect(vnode.props?.style?.height).toBe("100%");
		expect(vnode.props?.style?.padding).toBe("3rem");
	});

	it("renders the type label with a left border accent in the inner column", () => {
		const vnode = template(baseProps) as VNode;
		const inner = getChild(vnode, 0);
		const typeSpan = getChild(inner!, 0);
		expect(typeSpan?.props?.style?.borderLeft).toBe("0.5rem solid black");
		// The type text is the first child of the type span's children.
		const typeChildren = getChildren(typeSpan!);
		expect(typeChildren[0]).toBe("Note");
	});

	it("renders the title as a 4rem span in the inner column", () => {
		const vnode = template(baseProps) as VNode;
		const inner = getChild(vnode, 0);
		const titleSpan = getChild(inner!, 1);
		expect(titleSpan?.type).toBe("span");
		expect(titleSpan?.props?.style?.fontSize).toBe("4rem");
		expect(titleSpan?.props?.children).toBe("Test Title");
	});

	it("renders the date and tags in a single row at the bottom of the inner column", () => {
		const propsWithTags = { ...baseProps, tags: ["guide", "deep"] };
		const vnode = template(propsWithTags) as VNode;
		const inner = getChild(vnode, 0);
		const dateRow = getChild(inner!, 2);
		const dateChildren = getChildren(dateRow!);

		// First child is the <time> element.
		expect(dateChildren[0]?.type).toBe("time");
		expect(dateChildren[0]?.props?.children).toBe("2025/04/04");

		// After the separator, the tags are rendered as spans.
		const tagSpans = dateChildren.slice(2);
		expect(tagSpans).toHaveLength(2);
		expect(tagSpans[0]?.props?.children).toBe("#guide");
		expect(tagSpans[1]?.props?.children).toBe("#deep");
	});

	it("omits the tag separator and tags when no tags are provided", () => {
		const vnode = template(baseProps) as VNode;
		const inner = getChild(vnode, 0);
		const dateRow = getChild(inner!, 2);
		// Without tags, the date row is exactly one element (the <time>),
		// not three.
		const dateChildren = getChildren(dateRow!);
		expect(dateChildren).toHaveLength(1);
	});

	it("renders series in the type label when present", () => {
		const propsWithSeries = { ...baseProps, series: "Astro" };
		const vnode = template(propsWithSeries) as VNode;
		const inner = getChild(vnode, 0);
		const typeSpan = getChild(inner!, 0);
		// Type span children: [type, series-span-with-dot]
		const typeChildren = getChildren(typeSpan!);
		// The series is the second child, a span containing the dot and series name.
		const seriesNode = typeChildren[1];
		expect(seriesNode).toBeDefined();
		// The series span contains: [dot-span, series-name]
		const seriesChildren = getChildren(seriesNode!);
		expect(seriesChildren[1]).toBe("Astro");
	});

	it("renders the site logo and author in a footer row at the root", () => {
		const vnode = template(baseProps) as VNode;
		// The third top-level child is the footer row
		// (type-row, title, date-row, then hr, then footer).
		const topLevelChildren = getChildren(vnode);
		const footerRow = topLevelChildren[2];
		const footerStr = JSON.stringify(footerRow);
		expect(footerStr).toContain("Test Site");
		expect(footerStr).toContain("Test Author");
		expect(footerStr).toMatch(/data:image\/svg\+xml;base64,/);
	});

	it("uses the configured background colour", () => {
		const vnode = template(baseProps) as VNode;
		expect(vnode.props?.style?.background).toBe("#fffffd");
	});
});
