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

import type { CollectionEntry } from "astro:content";
import type { ListableCollection } from "$utils/config";

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

/**
 * The `listBySections(selector, locale, shape?)` shape adapter is the
 * deepening introduced alongside the universal-listable-shape decision
 * (ADR 0005). The default shape projects to `ContentCard`; the Atom
 * feed and the footer project to feed- and word-count-specific
 * shapes via the same seam. These tests pin the adapter contract:
 *
 *   - the default projection matches `toCard` exactly;
 *   - a custom projection runs per entry with the right (entry,
 *     section, locale) tuple;
 *   - the order is "newest first" across sections, *always*, even
 *     when the projection is the identity function or any custom
 *     shape that does not preserve the timestamp at `data.timestamp`;
 *   - the locale + selector contract is unchanged.
 */
describe("listBySections — shape adapter", () => {
	it("defaults the shape to the toCard projection (ContentCard with section field set)", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/post", "P", new Date("2025-04-01T00:00:00Z"))] as never;
			return [];
		});

		const cards = await listBySections(["note"], en);

		expect(cards).toHaveLength(1);
		// `toCard` sets `section` so the homepage's <LatestCard /> can
		// branch on it. The default shape must preserve that contract.
		expect(cards[0]?.section).toBe("note");
		expect(cards[0]?.id).toBe("en/post");
	});

	it("passes (entry, section, locale) into the shape adapter", async () => {
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/note-1", "N1", new Date("2025-04-01T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/jot-1", "J1", new Date("2025-04-02T00:00:00Z"))] as never;
			return [];
		});

		const captured: Array<{ section: string; locale: string; id: string }> = [];
		await listBySections("*", en, (entry, section, locale) => {
			captured.push({ section, locale, id: entry.id });
			return { id: entry.id, section, locale };
		});

		expect(captured).toHaveLength(2);
		// Both fetches went through with the right (section, locale).
		const noteCall = captured.find(c => c.id === "en/note-1");
		const jotCall = captured.find(c => c.id === "en/jot-1");
		expect(noteCall).toEqual({ section: "note", locale: en, id: "en/note-1" });
		expect(jotCall).toEqual({ section: "jotting", locale: en, id: "en/jot-1" });
	});

	it("sorts by the original entry's timestamp even when the projection drops the field", async () => {
		// A custom shape that returns a plain `string` is the strictest
		// possible projection — no `data` field at all. The seam must
		// still sort by the entry's timestamp, so the post-sort is
		// "newest first" regardless of the projection's shape.
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/note-old", "N-Old", new Date("2025-04-01T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/jot-new", "J-New", new Date("2025-04-09T00:00:00Z"))] as never;
			return [];
		});

		// Identity-style projection returning just the id (no timestamp).
		const ids = await listBySections<string>("*", en, entry => entry.id);

		// The jotting is newer; the seam sorts by the original entry's
		// timestamp so the jotting comes first despite being in the
		// second section.
		expect(ids).toEqual(["en/jot-new", "en/note-old"]);
	});

	it("supports a FeedItem-shaped projection (entry + absolute link) the same way the Atom feed uses it", async () => {
		// This is the shape the Atom feed uses after the deepening:
		// each item is the raw entry plus an absolute link computed
		// by the section-aware `feedLink` adapter. The test types the
		// feed item against the seam's own listable entry type so the
		// projection contract matches the real Atom feed adapter.
		type FeedItem = CollectionEntry<ListableCollection> & { link: string };
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/note-1", "N1", new Date("2025-04-01T00:00:00Z"))] as never;
			return [];
		});

		const items = await listBySections<FeedItem>(["note"], en, (e, section, locale) => ({
			...e,
			link: `https://example.test/${locale}/${section}/${e.id}`
		}));

		expect(items).toHaveLength(1);
		expect(items[0]?.link).toBe("https://example.test/en/note/en/note-1");
		// The original entry's data is preserved (the spread).
		expect(items[0]?.data.title).toBe("N1");
	});

	it("supports an identity projection (raw entry pool) the same way the footer uses it", async () => {
		// The footer needs the raw `CollectionEntry` to call
		// `totalWordCount`. The identity projection returns the entry
		// unchanged; the sort still works because the seam sorts by
		// the original entry's timestamp before the projection.
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return [entry("en/note-1", "N1", new Date("2025-04-05T00:00:00Z"))] as never;
			if (collection === "jotting") return [entry("en/jot-1", "J1", new Date("2025-04-01T00:00:00Z"))] as never;
			return [];
		});

		// The identity projection returns the raw listable entry so
		// the footer can call `totalWordCount` on the merged pool. The
		// type is the seam's own listable entry type, not the test
		// helper's narrower `entry(...)` shape.
		const entries = await listBySections<CollectionEntry<ListableCollection>>("*", en, e => e);

		// Newest first across sections.
		expect(entries[0]?.id).toBe("en/note-1");
		expect(entries[1]?.id).toBe("en/jot-1");
	});
});

describe("listBySections — purity contract", () => {
	it("does not reorder the input arrays returned by getCollection (seam is pure over the fetcher's input)", async () => {
		// The mock returns the same input array reference per call.
		// `listBySections` must leave the array in its original order
		// even when the projection is a custom shape that drops the
		// timestamp — sorting happens on the new `tuples` array, not
		// on the fetcher's input.
		const noteInput = [entry("en/note-1", "N1", new Date("2025-04-05T00:00:00Z")), entry("en/note-2", "N2", new Date("2025-04-01T00:00:00Z"))];
		const jottingInput = [entry("en/jot-1", "J1", new Date("2025-04-09T00:00:00Z")), entry("en/jot-2", "J2", new Date("2025-04-02T00:00:00Z"))];
		vi.mocked(getCollection).mockImplementation(async (collection: string) => {
			if (collection === "note") return noteInput as never;
			if (collection === "jotting") return jottingInput as never;
			return [];
		});

		await listBySections("*", en, e => e.id);

		// Both input arrays must remain in their original order.
		expect(noteInput.map(e => e.id)).toEqual(["en/note-1", "en/note-2"]);
		expect(jottingInput.map(e => e.id)).toEqual(["en/jot-1", "en/jot-2"]);
	});
});
