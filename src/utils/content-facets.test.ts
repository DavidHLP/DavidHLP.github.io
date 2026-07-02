import { describe, expect, it, vi } from "vitest";

// Mock astro:content so this module can be loaded in a vitest environment
// where the virtual module is not available. We only exercise collectFacets
// here; totalWordCount is covered by the build pipeline.
vi.mock("astro:content", () => ({
	render: vi.fn(),
	getCollection: vi.fn(),
	getEntry: vi.fn()
}));

const { collectFacets } = await import("./content-facets");

type FakeEntry = {
	data: {
		tags?: string[];
		series?: string;
	};
};

describe("collectFacets", () => {
	it("returns deduplicated, sorted tag facets", () => {
		const entries: FakeEntry[] = [{ data: { tags: ["Guide", "Astro", "Guide"] } }, { data: { tags: ["Astro", "Content"] } }];
		const { tags, series } = collectFacets(entries as never);
		expect(tags).toEqual(["Astro", "Content", "Guide"]);
		expect(series).toEqual([]);
	});

	it("skips undefined and falsy tags", () => {
		const entries: FakeEntry[] = [{ data: { tags: [undefined, "", "Real"] as never } }];
		const { tags } = collectFacets(entries as never);
		expect(tags).toEqual(["Real"]);
	});

	it("includes series only when includeSeries is true", () => {
		const entries: FakeEntry[] = [{ data: { series: "Astro" } }, { data: { series: "Content" } }];
		expect(collectFacets(entries as never, false).series).toEqual([]);
		expect(collectFacets(entries as never, true).series).toEqual(["Astro", "Content"]);
	});

	it("deduplicates and sorts series", () => {
		const entries: FakeEntry[] = [{ data: { series: "B" } }, { data: { series: "A" } }, { data: { series: "B" } }];
		expect(collectFacets(entries as never, true).series).toEqual(["A", "B"]);
	});

	it("returns empty arrays for an empty entry list", () => {
		expect(collectFacets([], true)).toEqual({ series: [], tags: [] });
	});
});
