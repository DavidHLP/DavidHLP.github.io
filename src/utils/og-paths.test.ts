import { describe, expect, it, vi } from "vitest";

/**
 * `og-paths.ts` transitively imports `astro:content` (mocked here)
 * and `$i18n` (which loads YAML via the vitest config). The
 * interesting logic is in the path-building pipeline, not the
 * draft-filter (one-liner tested by the Astro build), so the
 * fixtures are pre-filtered: drafts are excluded before the
 * mock returns the array.
 */
vi.mock("astro:content", () => ({
	getCollection: vi.fn(),
	getEntry: vi.fn(),
	render: vi.fn()
}));

const { toDisplayDate, contentGraphStaticPaths } = await import("./og-paths");
const { getCollection } = await import("astro:content");

/**
 * `toDisplayDate` formats a Date as `YYYY/MM/DD` in UTC for OG image
 * metadata. The format is the seam's contract — slashes, not dashes,
 * and always UTC (the locale's day-rollover is irrelevant for an image
 * meant to be scraped by social platforms).
 */
describe("toDisplayDate", () => {
	it("formats a Date as YYYY/MM/DD in UTC", () => {
		expect(toDisplayDate(new Date("2025-04-04T15:30:00Z"))).toBe("2025/04/04");
	});

	it("does not roll the day forward in a non-UTC timezone — the format is always UTC", () => {
		// 2025-04-03T18:00:00Z is 2025-04-04T02:00:00 in Asia/Shanghai
		// (UTC+8). The OG image format pins UTC, so the rendered
		// string is still 2025/04/03, not 2025/04/04.
		expect(toDisplayDate(new Date("2025-04-03T18:00:00Z"))).toBe("2025/04/03");
	});

	it("uses four-digit year, two-digit month, two-digit day", () => {
		expect(toDisplayDate(new Date("2025-01-01T00:00:00Z"))).toBe("2025/01/01");
		expect(toDisplayDate(new Date("1999-12-31T23:59:59Z"))).toBe("1999/12/31");
	});
});

/**
 * `contentGraphStaticPaths` mirrors `contentStaticPaths` but adds the
 * props the OG endpoint needs: the localised type label, title, date,
 * series, and tags. The shape is the seam consumed by every
 * `graph.png.ts` file in the per-entry routes.
 *
 * `home.latest` is a key that exists in all three locales' `index`
 * namespace (en: "Latest", zh-cn: "最新内容", ja: "最新記事"), so
 * the localised type label resolves predictably across the fixtures.
 */
describe("contentGraphStaticPaths", () => {
	it("returns a getStaticPaths-shaped array with locale split and OG props", async () => {
		const entries = [
			{ id: "zh-cn/post-1", data: { title: "文记 1", timestamp: new Date("2025-04-04T00:00:00Z"), tags: ["A"], draft: false } },
			{ id: "en/post-1", data: { title: "Note 1", timestamp: new Date("2025-04-04T00:00:00Z"), tags: ["A"], draft: false } }
		];
		(getCollection as ReturnType<typeof vi.fn>).mockResolvedValueOnce(entries);

		const paths = await contentGraphStaticPaths("note", "home.latest");

		expect(paths).toHaveLength(2);

		// Each path has the OG props.
		for (const p of paths) {
			expect(p.props).toHaveProperty("type");
			expect(p.props).toHaveProperty("title");
			expect(p.props).toHaveProperty("time");
			expect(p.props).toHaveProperty("series");
			expect(p.props).toHaveProperty("tags");
			// time is YYYY/MM/DD in UTC.
			expect(p.props.time).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
		}
	});

	it("localises the type label for the entry's locale", async () => {
		const entries = [
			// Order matters: en, zh-cn (default → undefined), ja.
			{ id: "en/post-1", data: { title: "Note 1", timestamp: new Date("2025-04-04T00:00:00Z"), tags: [], draft: false } },
			{ id: "zh-cn/post-1", data: { title: "文记 1", timestamp: new Date("2025-04-04T00:00:00Z"), tags: [], draft: false } },
			{ id: "ja/post-1", data: { title: "文記 1", timestamp: new Date("2025-04-04T00:00:00Z"), tags: [], draft: false } }
		];
		(getCollection as ReturnType<typeof vi.fn>).mockResolvedValueOnce(entries);

		const paths = await contentGraphStaticPaths("note", "home.latest");

		// Find each path by the (locale, id) pair.
		const en = paths.find(p => p.params.id === "post-1" && p.params.locale === "en");
		const zh = paths.find(p => p.params.id === "post-1" && p.params.locale === undefined);
		const ja = paths.find(p => p.params.id === "post-1" && p.params.locale === "ja");

		expect(en?.props.type).toBe("Latest");
		expect(zh?.props.type).toBe("最新内容");
		expect(ja?.props.type).toBe("最新記事");
	});

	it("splits the entry id into locale and id segments, mapping default locale to undefined", async () => {
		const entries = [
			{ id: "zh-cn/some-slug", data: { title: "T", timestamp: new Date("2025-04-04T00:00:00Z"), tags: [], draft: false } },
			{ id: "en/another-slug", data: { title: "T", timestamp: new Date("2025-04-04T00:00:00Z"), tags: [], draft: false } }
		];
		(getCollection as ReturnType<typeof vi.fn>).mockResolvedValueOnce(entries);

		const paths = await contentGraphStaticPaths("note", "home.latest");

		// Default locale (zh-cn) -> locale: undefined, id: "some-slug"
		const zh = paths.find(p => p.params.id === "some-slug");
		expect(zh?.params.locale).toBeUndefined();

		// Non-default locale (en) -> locale: "en", id: "another-slug"
		const en = paths.find(p => p.params.id === "another-slug");
		expect(en?.params.locale).toBe("en");
	});

	it("passes series and tags through to the props", async () => {
		const entries = [
			{
				id: "zh-cn/post-1",
				data: { title: "T", timestamp: new Date("2025-04-04T00:00:00Z"), series: "Astro", tags: ["guide", "deep"], draft: false }
			}
		];
		(getCollection as ReturnType<typeof vi.fn>).mockResolvedValueOnce(entries);

		const paths = await contentGraphStaticPaths("note", "home.latest");
		const path = paths[0];

		expect(path.props.series).toBe("Astro");
		expect(path.props.tags).toEqual(["guide", "deep"]);
		expect(path.props.title).toBe("T");
	});
});
