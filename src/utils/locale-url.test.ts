import { describe, expect, it, vi } from "vitest";

vi.mock("astro:i18n", () => ({
	getRelativeLocaleUrl: vi.fn((locale: string, path = "/") => `${locale === "zh-cn" ? "" : `/${locale}`}${path}`)
}));

import { localeUrl, withoutTrailingSlash } from "./locale-url";

describe("localeUrl", () => {
	it("removes the generated trailing slash from locale roots", () => {
		expect(localeUrl("ja")).toBe("/ja");
		expect(localeUrl("zh-cn", "/")).toBe("/");
	});

	it("preserves the configured shape for non-root paths", () => {
		expect(localeUrl("ja", "/note")).toBe("/ja/note");
	});

	it("normalizes request paths without turning the site root into an empty path", () => {
		expect(withoutTrailingSlash("/ja/")).toBe("/ja");
		expect(withoutTrailingSlash("/")).toBe("/");
	});
});
