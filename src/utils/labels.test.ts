import { describe, expect, it } from "vitest";
import { sectionLabel } from "./labels";

/**
 * `sectionLabel` is a pure formatter over a `t()` translator. The
 * `tOr` helper that used to live here was removed in ADR 0004 because
 * the i18n seam now returns `string | undefined` directly.
 */
describe("sectionLabel", () => {
	it("formats the index as [ NN / SUFFIX ] with two-digit padding", () => {
		const t = (k: string) => (k === "home.section.activity" ? "活动" : k);
		expect(sectionLabel(t, 1, "home.section.activity")).toBe("[ 01 / 活动 ]");
		expect(sectionLabel(t, 12, "home.section.activity")).toBe("[ 12 / 活动 ]");
	});

	it("falls back to the uppercased last dot-segment of the key when the dictionary has no entry", () => {
		const t = (k: string) => k; // returns key on miss
		expect(sectionLabel(t, 3, "home.section.latest")).toBe("[ 03 / LATEST ]");
	});

	it("uses the key verbatim when the key has no dots and the dictionary is missing", () => {
		const t = (k: string) => k;
		expect(sectionLabel(t, 7, "noDotsKey")).toBe("[ 07 / NODOTSKEY ]");
	});
});
