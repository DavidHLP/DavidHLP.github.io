import { readFileSync } from "node:fs";
import { generate, parse, walk, type Rule } from "css-tree";
import { describe, expect, it } from "vitest";
import { viewportLayout } from "../rhine/viewport-layout";

const styles = parse(readFileSync(new URL("../rhine/style.css", import.meta.url), "utf8"));
const responsive = parse(readFileSync(new URL("../rhine/responsive.css", import.meta.url), "utf8"));

function declaration(sheet: typeof styles, selector: string, property: string) {
	let value: string | undefined;
	walk(sheet, {
		visit: "Rule",
		enter(rule: Rule) {
			if (!rule.prelude || generate(rule.prelude) !== selector) return;
			rule.block.children.forEach(node => {
				if (node.type === "Declaration" && node.property === property) value = generate(node.value);
			});
		}
	});
	if (!value) throw new Error(`Missing ${selector} { ${property} }`);
	return value;
}

describe("archive rail spacing budget", () => {
	// CSS-contract guard, not a replacement for browser/font rendering checks.
	const railBottom = Number.parseFloat(declaration(styles, ".category-rail", "bottom"));
	const counterTop =
		Number.parseFloat(declaration(styles, ".archive-counter", "bottom")) +
		Number.parseFloat(declaration(styles, ".archive-counter>div", "font-size")) *
			Number.parseFloat(declaration(styles, ".archive-counter>div", "line-height")) +
		Number.parseFloat(declaration(styles, ".archive-counter>div", "margin-top")) +
		19; // Reserve a full label line, including CJK font ascent/descent.

	it("leaves a gap above the complete counter, including its label", () => {
		expect(railBottom - counterTop).toBeGreaterThanOrEqual(16);
	});

	it("keeps the hover caption above the rail and its padding", () => {
		const hoverBottom = Number.parseFloat(declaration(styles, ".hover-label", "bottom"));
		const railHeight = 1 + 8 + Number.parseFloat(declaration(styles, ".category-rail button", "min-height")) + 7;
		expect(hoverBottom - railBottom - railHeight).toBeGreaterThanOrEqual(24);
	});

	it.each([
		[1892, 853],
		[1920, 1080],
		[1366, 768],
		[1100, 768]
	])("preserves the spacing at desktop viewport %i × %i", (width, height) => {
		const layout = viewportLayout(width, height, false);
		expect(layout.kind).toBe("desktop");
		const percentage = Number.parseFloat(declaration(responsive, '[data-layout="desktop"] .category-rail', "bottom"));
		const responsiveBottom = (percentage / 100) * layout.height;
		expect(responsiveBottom).toBeCloseTo(railBottom, 4);
		expect((responsiveBottom - counterTop) * layout.scale).toBeGreaterThan(11);
	});

	it.each([
		[1099, 768],
		[390, 844],
		[844, 390]
	])("keeps the rail hidden in compact/portrait viewport %i × %i", (width, height) => {
		expect(["compact", "portrait"]).toContain(viewportLayout(width, height, false).kind);
		expect(declaration(responsive, ':is([data-layout="compact"],[data-layout="portrait"]) .category-rail', "display")).toBe("none");
	});
});
