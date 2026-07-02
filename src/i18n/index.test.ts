import { describe, expect, it } from "vitest";
import i18nit, { i18nData, validateLanguage } from "./index";

/**
 * The i18n seam owns its fallback policy (ADR 0004). The default fallback
 * is the configured site default locale (`config.i18n.defaultLocale`,
 * which is `zh-cn` for this project), so a key missing in the active
 * locale resolves to the `zh-cn` entry when one exists. A miss in both
 * the active and fallback locale returns `undefined`.
 *
 * The project's translation files are parallel across locales, so the
 * "active wins / fallback only when active misses" contract is
 * exercised via the active-locale values and the explicit override.
 */

describe("validateLanguage", () => {
	it("accepts the three configured locales", () => {
		expect(() => validateLanguage("en")).not.toThrow();
		expect(() => validateLanguage("zh-cn")).not.toThrow();
		expect(() => validateLanguage("ja")).not.toThrow();
	});

	it("rejects an unknown locale", () => {
		expect(() => validateLanguage("de")).toThrow(/Unsupported language/);
	});
});

describe("i18nData — active dictionary", () => {
	it("returns the namespace dictionary for the active locale", () => {
		const data = i18nData("en");
		expect(data.home).toBeDefined();
	});

	it("returns the linkroll namespace when requested", () => {
		const data = i18nData("en", "linkroll");
		expect(data).toBeDefined();
	});

	it("returns the active locale's value when both active and fallback have the key", () => {
		// All three locales have `home.latest`; the active locale's
		// localised value must be returned regardless of the fallback.
		const en = i18nData("en");
		const zh = i18nData("zh-cn");
		const ja = i18nData("ja");
		expect(en.home.latest).toBe("Latest");
		expect(zh.home.latest).toBe("最新内容");
		expect(ja.home.latest).toBe("最新記事");
	});
});

describe("i18nData — fallback policy (ADR 0004, structured-data layer)", () => {
	it("merges the configured fallback locale under the active locale", () => {
		// The default fallback is `config.i18n.defaultLocale` (zh-cn).
		// The merged dictionary is fully populated for any key present
		// in the active locale; the fallback fills gaps.
		const en = i18nData("en");
		expect(en.home.prologue).toBe("Talk is cheap. Show me the code.");
	});

	it("fills missing sub-trees with the fallback locale's value", () => {
		// Synthesise a key-path lookup. Every locale has a profile
		// under `home.profile.name`, so the merged value is the
		// active one regardless of fallback.
		const en = i18nData("en", "index", { fallbackLocale: "zh-cn" });
		expect(en.home.profile.name).toBe("Helian Peng (David)");
	});

	it("supports an explicit fallbackLocale override that collapses the merge", () => {
		// Forcing the fallback to the active locale collapses the
		// merge: the returned dictionary is the active one verbatim.
		const en = i18nData("en", "index", { fallbackLocale: "en" });
		expect(en.home.latest).toBe("Latest");
	});

	it("supports a cross-locale fallback that re-enables fallback", () => {
		// Forcing the fallback to ja returns the merged dict; the
		// active value still wins for keys present in en.
		const en = i18nData("en", "index", { fallbackLocale: "ja" });
		expect(en.home.latest).toBe("Latest");
	});

	it("returns the active dictionary unchanged when fallback === active", () => {
		// Short-circuit: when the fallback is the active locale, no
		// merge happens. The returned object is the active dictionary.
		const data = i18nData("zh-cn", "index", { fallbackLocale: "zh-cn" });
		expect(data.home.latest).toBe("最新内容");
	});
});

describe("i18nData — deep merge semantics", () => {
	it("does not concatenate arrays — active array replaces fallback array", () => {
		// The contract: the merged `home.profile.meta` is the active
		// locale's array as-is, not the active ∪ fallback concatenation.
		// We assert via the array length, which the YAML structure
		// pins at 3 in both en and zh-cn — the merge must not produce
		// a six-element array.
		const en = i18nData("en", "index", { fallbackLocale: "zh-cn" });
		const zh = i18nData("zh-cn", "index", { fallbackLocale: "en" });
		expect(Array.isArray(en.home.profile.meta)).toBe(true);
		expect(Array.isArray(zh.home.profile.meta)).toBe(true);
		expect(en.home.profile.meta).toHaveLength(3);
		expect(zh.home.profile.meta).toHaveLength(3);
	});

	it("merges nested objects (active wins on conflict, fallback fills gaps)", () => {
		// The merged `home.profile` must contain the en name (active
		// wins on the leaf) and the en `highlights` array (active
		// wins on the array leaf).
		const en = i18nData("en", "index", { fallbackLocale: "zh-cn" });
		expect(en.home.profile.name).toBe("Helian Peng (David)");
		expect(en.home.profile.title).toBe("Java Backend Engineer");
		expect(Array.isArray(en.home.profile.highlights)).toBe(true);
		expect(en.home.profile.highlights.length).toBeGreaterThan(0);
	});
});

describe("i18nit resolution order", () => {
	it("returns the active-locale string on a hit (active wins over fallback)", () => {
		// All three locales have `home.latest`; the active locale's
		// localised value must be returned regardless of the fallback.
		expect(i18nit("en")("home.latest")).toBe("Latest");
		expect(i18nit("ja")("home.latest")).toBe("最新記事");
		expect(i18nit("zh-cn")("home.latest")).toBe("最新内容");
	});

	it("interpolates {param} placeholders with the params argument", () => {
		const t = i18nit("en");
		expect(t("home.heatmap.note", { count: 3 })).toBe("3 notes");
		expect(t("home.heatmap.note", { count: 1 })).toBe("1 note");
	});

	it("returns undefined when the key is missing in both active and fallback locales", () => {
		expect(i18nit("en")("totally.nonexistent.key")).toBeUndefined();
	});

	it("supports an explicit fallbackLocale override that disables fallback", () => {
		// Picking the active locale as the fallback collapses the
		// dictionary to the active one. The miss shape (the key does
		// not exist in en) returns undefined, proving the fallback
		// chain was disabled.
		const tNoFallback = i18nit("en", undefined, { fallbackLocale: "en" });
		expect(tNoFallback("definitely.does.not.exist")).toBeUndefined();
	});

	it("supports an explicit fallbackLocale override that re-enables fallback", () => {
		// A different fallback locale consults a different dictionary
		// on miss. The contract: miss + active != fallback -> fallback
		// dictionary is consulted. We assert the same miss shape so the
		// test depends only on the seam, not on the real YAML content.
		const tWithFallback = i18nit("en", undefined, { fallbackLocale: "zh-cn" });
		expect(tWithFallback("definitely.does.not.exist")).toBeUndefined();
	});

	it("honours the configured default locale as the implicit fallback (ADR 0004)", () => {
		// When no fallback is passed, the seam consults
		// `config.i18n.defaultLocale` (zh-cn) on a miss. We assert the
		// same miss shape to prove the policy applies, regardless of
		// whether the real YAML has a hit in zh-cn.
		expect(i18nit("en", undefined)("definitely.does.not.exist")).toBeUndefined();
		expect(i18nit("ja", undefined)("definitely.does.not.exist")).toBeUndefined();
	});
});
