import { Temporal } from "temporal-polyfill";
import { describe, expect, it, vi } from "vitest";

// `heatmap-bins` imports `contentUrl` from `$utils/content-fetch`, which
// transitively loads the `astro:content` and `astro:i18n` virtual modules.
// Both are mocked here so the test can run in a vitest environment.
vi.mock("astro:content", () => ({
	getCollection: vi.fn(),
	getEntry: vi.fn(),
	render: vi.fn()
}));

vi.mock("astro:i18n", () => ({
	getRelativeLocaleUrl: vi.fn((_locale: string, path: string) => path)
}));

const { getStrategy, toHeatmapEntries } = await import("./heatmap-bins");
type HeatmapEntry = import("./heatmap-bins").HeatmapEntry;

/**
 * The strategy pattern keeps the bin-building pipeline testable per
 * adapter. Each adapter takes a fixed `now` and a config, builds the
 * bin array, and distributes entries. The `en` locale keeps the date
 * formatting deterministic across hosts.
 */

const en = "en";
const now = Temporal.PlainDate.from("2025-04-09");

function entry(date: string, section: "note" | "jotting" = "note", title = "Test"): HeatmapEntry {
	return { section, title, date: Temporal.PlainDate.from(date), link: `/${section}/${date}` };
}

describe("getStrategy", () => {
	it("dispatches to the day strategy for unit=day", () => {
		const strategy = getStrategy("day");
		expect(strategy.unit).toBe("day");
		expect(strategy.gridClass).toBe("grid-flow-col grid-rows-7");
		expect(strategy.cellSizeClass).toBe("w-2.5 h-2.5");
	});

	it("dispatches to the week strategy for unit=week", () => {
		const strategy = getStrategy("week");
		expect(strategy.unit).toBe("week");
		expect(strategy.gridClass).toBe("grid-cols-13");
		expect(strategy.cellSizeClass).toBe("w-4 h-4");
	});

	it("dispatches to the month strategy for unit=month", () => {
		const strategy = getStrategy("month");
		expect(strategy.unit).toBe("month");
		expect(strategy.gridClass).toBe("grid-cols-12");
		expect(strategy.cellSizeClass).toBe("w-4.5 h-4.5");
	});
});

describe("day strategy", () => {
	it("produces weeks × 7 bins ending on the Saturday of `now`'s week", () => {
		const strategy = getStrategy("day");
		// 2025-04-09 is a Wednesday; ISO dayOfWeek=3, so the bin range ends at
		// now + (7 - 3) = 2025-04-13 (Sunday).
		// 20 weeks × 7 days = 140 bins.
		const bins = strategy.buildBins([], now, { unit: "day", weeks: 20 }, en);
		expect(bins.length).toBe(140);
		expect(bins[bins.length - 1].target).toContain("13");
	});

	it("honours a custom `weeks` option", () => {
		const strategy = getStrategy("day");
		const bins = strategy.buildBins([], now, { unit: "day", weeks: 4 }, en);
		expect(bins.length).toBe(28);
	});

	it("places an entry dated within the window into the matching day bin", () => {
		const strategy = getStrategy("day");
		const bins = strategy.buildBins([entry("2025-04-09")], now, { unit: "day", weeks: 20 }, en);
		const filled = bins.filter(b => b.contents.length > 0);
		expect(filled.length).toBe(1);
		expect(filled[0].contents[0].title).toBe("Test");
	});

	it("drops entries dated before the window", () => {
		const strategy = getStrategy("day");
		const bins = strategy.buildBins([entry("2020-01-01")], now, { unit: "day", weeks: 20 }, en);
		expect(bins.every(b => b.contents.length === 0)).toBe(true);
	});

	it("drops entries dated after the window", () => {
		const strategy = getStrategy("day");
		const bins = strategy.buildBins([entry("2099-12-31")], now, { unit: "day", weeks: 20 }, en);
		expect(bins.every(b => b.contents.length === 0)).toBe(true);
	});
});

describe("week strategy", () => {
	it("produces 52 bins covering the past year from `now`", () => {
		const strategy = getStrategy("week");
		const bins = strategy.buildBins([], now, { unit: "week" }, en);
		expect(bins.length).toBe(52);
	});

	it("labels bins with a `start - end` date range", () => {
		const strategy = getStrategy("week");
		const bins = strategy.buildBins([], now, { unit: "week" }, en);
		for (const bin of bins) expect(bin.target).toMatch(/ - /);
	});
});

describe("month strategy", () => {
	it("produces years × 12 bins covering Jan 1 of (now.year - years + 1) through Dec 31 of now.year", () => {
		const strategy = getStrategy("month");
		// 4 years × 12 months = 48 bins.
		const bins = strategy.buildBins([], now, { unit: "month", years: 4 }, en);
		expect(bins.length).toBe(48);
		expect(bins[0].target).toMatch(/2022/);
		expect(bins[bins.length - 1].target).toMatch(/2025/);
	});

	it("honours a custom `years` option", () => {
		const strategy = getStrategy("month");
		const bins = strategy.buildBins([], now, { unit: "month", years: 2 }, en);
		expect(bins.length).toBe(24);
	});

	it("places an entry into the matching month bin", () => {
		const strategy = getStrategy("month");
		const bins = strategy.buildBins([entry("2025-03-15", "jotting")], now, { unit: "month", years: 4 }, en);
		const filled = bins.filter(b => b.contents.length > 0);
		expect(filled.length).toBe(1);
		expect(filled[0].contents[0].section).toBe("jotting");
	});
});

describe("toHeatmapEntries", () => {
	it("normalises note and jotting entries into the bin-ready shape", () => {
		// Pin the site timezone so the Temporal conversion is deterministic
		// across hosts (CI, dev machine, GitHub Actions).
		import.meta.env.PUBLIC_TIMEZONE = "UTC";
		const notes = [{ id: "zh-cn/abc", data: { title: "Note 1", timestamp: new Date("2025-04-09T00:00:00Z") } }];
		const jottings = [{ id: "zh-cn/def", data: { title: "Jot 1", timestamp: new Date("2025-04-08T00:00:00Z") } }];
		const entries = toHeatmapEntries(notes, jottings, "en");
		expect(entries).toHaveLength(2);
		expect(entries[0]).toMatchObject({ section: "note", title: "Note 1", link: expect.stringContaining("/note/") });
		expect(entries[1]).toMatchObject({ section: "jotting", title: "Jot 1", link: expect.stringContaining("/jotting/") });
	});
});
