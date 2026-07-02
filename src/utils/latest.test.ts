import { describe, expect, it } from "vitest";
import { latestByTimestamp } from "./latest";
import type { ContentCard } from "./content-card";

/**
 * The "what is the latest" decision lives in `latestByTimestamp`.
 *
 * The function is pure over its input: it never mutates the array,
 * never fetches anything, never consults the filesystem. The page
 * wires the result straight into the `<LatestCard>` component, so
 * any regression in the pick lands in the homepage's most visible
 * panel. These tests pin the contract.
 */

function card(timestamp: Date, id = "x", section: "note" | "jotting" = "note"): ContentCard {
	return {
		id,
		section,
		url: `/${section}/${id}`,
		data: {
			title: `T-${id}`,
			timestamp,
			top: 0
		}
	};
}

describe("latestByTimestamp", () => {
	it("returns undefined for an empty pool", () => {
		expect(latestByTimestamp([])).toBeUndefined();
	});

	it("returns the single card for a one-element pool", () => {
		const only = card(new Date("2025-04-04T00:00:00Z"));
		expect(latestByTimestamp([only])).toBe(only);
	});

	it("returns the most recent card by timestamp", () => {
		const a = card(new Date("2025-04-01T00:00:00Z"), "a");
		const b = card(new Date("2025-04-09T00:00:00Z"), "b");
		const c = card(new Date("2025-04-05T00:00:00Z"), "c");
		expect(latestByTimestamp([a, b, c])?.id).toBe("b");
	});

	it("preserves the first card when all timestamps are equal (stable, but pick is the first)", () => {
		// Equal timestamps are a degenerate case; the implementation
		// returns the first one it sees because `>` is strict. Pin the
		// behaviour so a future refactor that switches to `>=` is a
		// conscious decision.
		const a = card(new Date("2025-04-04T00:00:00Z"), "a");
		const b = card(new Date("2025-04-04T00:00:00Z"), "b");
		expect(latestByTimestamp([a, b])?.id).toBe("a");
	});

	it("does not mutate the input array", () => {
		const a = card(new Date("2025-04-01T00:00:00Z"), "a");
		const b = card(new Date("2025-04-09T00:00:00Z"), "b");
		const c = card(new Date("2025-04-05T00:00:00Z"), "c");
		const before = [a, b, c];
		const snapshot = before.slice();
		latestByTimestamp(before);
		expect(before).toEqual(snapshot);
	});

	it("preserves the `section` field of the winning card", () => {
		// The homepage branches on `entry.section` to render the
		// "NOTE" or "JOTTING" badge in the latest card. The
		// aggregation must round-trip the field.
		const note = card(new Date("2025-04-01T00:00:00Z"), "n1", "note");
		const jotting = card(new Date("2025-04-09T00:00:00Z"), "j1", "jotting");
		const winner = latestByTimestamp([note, jotting]);
		expect(winner?.section).toBe("jotting");
	});

	it("works for a mixed pool of notes and jottings", () => {
		const note1 = card(new Date("2025-04-01T00:00:00Z"), "n1", "note");
		const jotting1 = card(new Date("2025-04-02T00:00:00Z"), "j1", "jotting");
		const note2 = card(new Date("2025-04-10T00:00:00Z"), "n2", "note");
		const jotting2 = card(new Date("2025-04-05T00:00:00Z"), "j2", "jotting");
		const winner = latestByTimestamp([note1, jotting1, note2, jotting2]);
		expect(winner?.id).toBe("n2");
		expect(winner?.section).toBe("note");
	});
});
