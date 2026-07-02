import { describe, expect, it } from "vitest";
import { sectionLabel } from "./labels";

/**
 * `sectionLabel` is a pure formatter over the i18n `t()` translator.
 *
 * The seam returns `string | undefined` on a miss (ADR 0004). The
 * formatter must handle both miss shapes:
 *   - the legacy sentinel (`t` returns the key) — still supported so
 *     the seam can keep its dual interface;
 *   - the modern undefined return — what the real i18n seam produces.
 */
describe("sectionLabel", () => {
	it("formats the index as [ NN / SUFFIX ] with two-digit padding", () => {
		const t = (k: string) => (k === "home.section.activity" ? "活动" : k);
		expect(sectionLabel(t, 1, "home.section.activity")).toBe("[ 01 / 活动 ]");
		expect(sectionLabel(t, 12, "home.section.activity")).toBe("[ 12 / 活动 ]");
	});

	it("falls back to the uppercased last dot-segment of the key when the dictionary returns the key as a sentinel", () => {
		const t = (k: string) => k; // legacy miss shape
		expect(sectionLabel(t, 3, "home.section.latest")).toBe("[ 03 / LATEST ]");
	});

	it("falls back when the dictionary returns undefined (the modern i18n miss shape)", () => {
		const t = (_k: string) => undefined; // what the real i18n seam produces on a miss
		expect(sectionLabel(t, 5, "home.section.activity")).toBe("[ 05 / ACTIVITY ]");
	});

	it("uses the key verbatim when the key has no dots and the dictionary is missing", () => {
		const t = (k: string) => k;
		expect(sectionLabel(t, 7, "noDotsKey")).toBe("[ 07 / NODOTSKEY ]");
	});
});
