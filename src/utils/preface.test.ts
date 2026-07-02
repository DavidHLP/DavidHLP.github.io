import { beforeEach, describe, expect, it, vi } from "vitest";

// `preface.ts` transitively loads the `astro:content` and `astro:i18n`
// virtual modules through `getPublishedByLocale`. Both are mocked
// here so the test can run in a vitest environment; the interesting
// logic is the locale-filter delegation + sort by timestamp desc, not
// the draft filter.
vi.mock("astro:content", () => ({
	getCollection: vi.fn(),
	getEntry: vi.fn(),
	render: vi.fn()
}));

vi.mock("astro:i18n", () => ({
	getRelativeLocaleUrl: vi.fn((_locale: string, path: string) => path)
}));

const { getCollection } = await import("astro:content");
const { listPrefaces, latestPreface } = await import("./preface");

const en = "en";
const zh = "zh-cn";

function entry(id: string, timestamp: Date, author?: string) {
	return {
		id,
		data: { timestamp, author, draft: false }
	};
}

beforeEach(() => {
	vi.mocked(getCollection).mockReset();
});

describe("listPrefaces", () => {
	it("returns an empty array when the collection is empty", async () => {
		vi.mocked(getCollection).mockResolvedValue([] as never);
		expect(await listPrefaces(en)).toEqual([]);
	});

	it("sorts the preface entries by data.timestamp descending", async () => {
		vi.mocked(getCollection).mockResolvedValue([
			entry("en/old", new Date("2024-01-01T00:00:00Z")),
			entry("en/newest", new Date("2026-01-01T00:00:00Z")),
			entry("en/middle", new Date("2025-06-01T00:00:00Z"))
		] as never);

		const prefaces = await listPrefaces(en);

		expect(prefaces.map(p => p.id)).toEqual(["en/newest", "en/middle", "en/old"]);
	});

	it("preserves the first entry when timestamps are equal (stable sort)", async () => {
		// Equal timestamps are a degenerate case. The implementation
		// uses `>` (strict), so the first-encountered entry wins.
		// Pin the behaviour so a future refactor that switches to `>=`
		// is a conscious decision.
		vi.mocked(getCollection).mockResolvedValue([
			entry("en/first", new Date("2025-04-04T00:00:00Z")),
			entry("en/second", new Date("2025-04-04T00:00:00Z"))
		] as never);

		const prefaces = await listPrefaces(en);
		expect(prefaces.map(p => p.id)).toEqual(["en/first", "en/second"]);
	});

	it("does not mutate the input array", async () => {
		const input = [entry("en/old", new Date("2024-01-01T00:00:00Z")), entry("en/new", new Date("2026-01-01T00:00:00Z"))];
		vi.mocked(getCollection).mockResolvedValue(input as never);

		await listPrefaces(en);

		// The original input must not have been touched.
		expect(input[0]?.id).toBe("en/old");
		expect(input[1]?.id).toBe("en/new");
	});

	it("passes the locale through to getPublishedByLocale (covered by the locale-filter seam)", async () => {
		vi.mocked(getCollection).mockResolvedValue([] as never);
		await listPrefaces(zh);
		expect(getCollection).toHaveBeenCalledWith("preface", expect.any(Function));
	});
});

describe("latestPreface", () => {
	it("returns the most recent preface for the given locale", async () => {
		vi.mocked(getCollection).mockResolvedValue([
			entry("en/old", new Date("2024-01-01T00:00:00Z")),
			entry("en/newest", new Date("2026-01-01T00:00:00Z"))
		] as never);

		const preface = await latestPreface(en);
		expect(preface?.id).toBe("en/newest");
	});

	it("returns undefined when the collection is empty", async () => {
		vi.mocked(getCollection).mockResolvedValue([] as never);
		expect(await latestPreface(en)).toBeUndefined();
	});

	it("returns the only entry when there is exactly one preface", async () => {
		vi.mocked(getCollection).mockResolvedValue([entry("en/solo", new Date("2025-04-04T00:00:00Z"), "Author Name")] as never);
		const preface = await latestPreface(en);
		expect(preface?.id).toBe("en/solo");
		expect(preface?.data.author).toBe("Author Name");
	});
});
