import { beforeEach, describe, expect, it, vi } from "vitest";

// `sections.ts` transitively loads the `astro:content` and `astro:i18n`
// virtual modules through `getPublishedByLocale` and `contentUrl`. Both
// are mocked here so the test can run in a vitest environment.
//
// `getPublishedByLocale` is the only mock we re-program per case; the
// other helpers (`toCard`, `feedLink`, `latestByTimestamp`) are real.
vi.mock("astro:content", () => ({
	getCollection: vi.fn(),
	getEntry: vi.fn(),
	render: vi.fn()
}));

vi.mock("astro:i18n", () => ({
	getRelativeLocaleUrl: vi.fn((_locale: string, path: string) => path)
}));

const { getCollection } = await import("astro:content");
const { LISTABLE_SECTIONS, latestCard, listBySections, resolveSections } = await import("./sections");

const en = "en";
const zh = "zh-cn";

function entry(id: string, title: string, timestamp: Date) {
	return { id, data: { title, timestamp, tags: [], top: 0, draft: false } };
}

beforeEach(() => {
	vi.mocked(getCollection).mockReset();
});

describe("LISTABLE_SECTIONS", () => {
	it("is the canonical, order-stable list of listable sections", () => {
		expect(LISTABLE_SECTIONS).toEqual(["note", "jotting"]);
	});
});

describe("resolveSections", () => {
	it("expands '*' to LISTABLE_SECTIONS", () => {
		expect(resolveSections("*")).toEqual(["note", "jotting"]);
	});

	it("returns the explicit subset as-is when the selector is an array", () => {
		expect(resolveSections(["note"])).toEqual(["note"]);
		expect(resolveSections(["jotting", "note"])).toEqual(["jotting", "note"]);
	});

	it("returns an empty array for an empty explicit subset", () => {
		expect(resolveSections([])).toEqual([]);
	});
});

describe("listBySections", () => {
	it("returns an empty array when the selector resolves to no sections", async () => {
		// No fetches happen, no cards are produced.
		const cards = await listBySections([], en);
		expect(cards).toEqual([]);
		expect(getCollection).not.toHaveBeenCalled();
	});

	it("fetches every section in '*' and shapes entries to ContentCard sorted by timestamp desc", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") {
				return [
					entry("en/note-a", "Note A", new Date("2025-04-01T00:00:00Z")),
					entry("en/note-b", "Note B", new Date("2025-04-09T00:00:00Z"))
				] as never;
			}
			if (collection === "jotting") {
				return [entry("en/jot-c", "Jot C", new Date("2025-04-05T00:00:00Z"))] as never;
			}
			return [];
		});

		const cards = await listBySections("*", en);

		// Every fetch happened in parallel for the two listable sections.
		expect(getCollection).toHaveBeenCalledTimes(2);
		expect(getCollection).toHaveBeenCalledWith("note", expect.any(Function));
		expect(getCollection).toHaveBeenCalledWith("jotting", expect.any(Function));

		// Three cards, sorted by timestamp descending: note-b (Apr 9), jot-c (Apr 5), note-a (Apr 1).
		expect(cards).toHaveLength(3);
		expect(cards.map(c => c.id)).toEqual(["en/note-b", "en/jot-c", "en/note-a"]);
		expect(cards[0]?.data.timestamp.toISOString()).toBe("2025-04-09T00:00:00.000Z");
		expect(cards[2]?.data.timestamp.toISOString()).toBe("2025-04-01T00:00:00.000Z");
	});

	it("stamps the `section` field on every card so callers can branch on it", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/note-a", "Note A", new Date("2025-04-01T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/jot-b", "Jot B", new Date("2025-04-02T00:00:00Z"))] as never;
			return [];
		});

		const cards = await listBySections("*", en);

		const noteCard = cards.find(c => c.id === "en/note-a");
		const jotCard = cards.find(c => c.id === "en/jot-b");
		expect(noteCard?.section).toBe("note");
		expect(jotCard?.section).toBe("jotting");
	});

	it("builds the relative URL via the contentUrl seam (no absolute origin in the card)", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/post", "P", new Date("2025-04-01T00:00:00Z"))] as never;
			return [];
		});

		const cards = await listBySections(["note"], en);

		expect(cards).toHaveLength(1);
		expect(cards[0]?.url).toContain("/note/post");
	});

	it("respects an explicit subset: only the requested section is fetched", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/n1", "N1", new Date("2025-04-01T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/j1", "J1", new Date("2025-04-02T00:00:00Z"))] as never;
			return [];
		});

		const cards = await listBySections(["note"], en);

		expect(getCollection).toHaveBeenCalledTimes(1);
		expect(getCollection).toHaveBeenCalledWith("note", expect.any(Function));
		expect(cards).toHaveLength(1);
		expect(cards[0]?.section).toBe("note");
	});

	it("passes the locale through to getPublishedByLocale (covered by the locale-filter seam)", async () => {
		// The monolocale shortcut is owned by `getPublishedByLocale`, so we
		// only need to assert that the fetches go through with the right
		// collection name. The locale-filter contract is exercised by
		// the existing content-fetch tests.
		vi.mocked(getCollection).mockResolvedValue([] as never);
		await listBySections("*", zh);
		expect(getCollection).toHaveBeenCalledWith("note", expect.any(Function));
		expect(getCollection).toHaveBeenCalledWith("jotting", expect.any(Function));
	});

	it("returns a stable, pure result (does not mutate the fetcher's input)", async () => {
		const input = [entry("en/n1", "N1", new Date("2025-04-01T00:00:00Z"))];
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return input as never;
			return [] as never;
		});

		const cards = await listBySections("*", en);

		// Two snapshots of the same call must be deeply equal.
		const again = await listBySections("*", en);
		expect(again).toEqual(cards);

		// The original input entry object must not have been touched.
		expect(input[0]?.data.title).toBe("N1");
	});

	it("keeps the stable order for equal timestamps (matches the inner `latestByTimestamp` policy)", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/n1", "N1", new Date("2025-04-04T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/j1", "J1", new Date("2025-04-04T00:00:00Z"))] as never;
			return [];
		});

		const cards = await listBySections("*", en);
		expect(cards).toHaveLength(2);
		// Sort is stable for equal keys — the first-encountered card
		// (note, fetched first) wins.
		expect(cards[0]?.id).toBe("en/n1");
		expect(cards[1]?.id).toBe("en/j1");
	});
});

describe("latestCard", () => {
	it("returns the most recent card across the requested sections", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/n1", "N1", new Date("2025-04-01T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/j1", "J1", new Date("2025-04-09T00:00:00Z"))] as never;
			return [];
		});

		const card = await latestCard("*", en);
		expect(card?.id).toBe("en/j1");
		expect(card?.section).toBe("jotting");
	});

	it("returns undefined when the resolved sections are empty", async () => {
		expect(await latestCard([], en)).toBeUndefined();
	});

	it("returns undefined when the resolved sections have no entries", async () => {
		vi.mocked(getCollection).mockResolvedValue([] as never);
		expect(await latestCard("*", en)).toBeUndefined();
	});

	it("returns undefined when only an explicit subset has entries and that subset is empty", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "jotting") return [entry("en/j1", "J1", new Date("2025-04-09T00:00:00Z"))] as never;
			return [];
		});

		// Asking for the note subset when only jottings exist returns undefined.
		expect(await latestCard(["note"], en)).toBeUndefined();
	});
});
