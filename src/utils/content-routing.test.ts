import { describe, expect, it, vi } from "vitest";

/**
 * `content-routing.ts` transitively imports the `astro:content` virtual
 * module (used by `localeStaticPaths` / `contentStaticPaths`). The
 * interesting logic under test lives in `buildEntryParams`, a pure
 * helper that does not touch the virtual module at runtime, but the
 * module-level import of `getCollection` is enough to need the mock.
 * Same shape as `og-paths.test.ts` and `sections.test.ts`.
 */
vi.mock("astro:content", () => ({
	getCollection: vi.fn(),
	getEntry: vi.fn(),
	render: vi.fn()
}));

const { buildEntryParams, localeStaticPaths } = await import("./content-routing");
import { monolocale } from "$config";
import type { CollectionEntry } from "astro:content";
import type { ContentCollection } from "$utils/config";

/** Build a minimal `CollectionEntry` stub for the test fixtures. */
function entry<C extends ContentCollection>(id: string): CollectionEntry<C> {
	return { id, data: {} as never } as CollectionEntry<C>;
}

/**
 * `buildEntryParams` is the shared seam that maps a content entry's
 * id to the canonical `(locale, id)` params pair consumed by every
 * per-entry `getStaticPaths` builder (the page route, the OG image
 * endpoint, and any future per-entry route). It is pure and the
 * tests below pin the locale-split + default-locale mapping
 * invariants in isolation.
 *
 * The current `site.config.ts` has 3 locales, so `monolocale` is
 * `false` and the multi-locale branch is exercised here. The
 * monolocale branch is covered by `pnpm build` when `site.config.ts`
 * is reduced to a single locale, and the multi-locale branch is
 * the only one in active use today.
 */
describe("buildEntryParams (multi-locale)", () => {
	it.skipIf(monolocale)("strips the locale prefix from the id", () => {
		expect(buildEntryParams(entry("zh-cn/my-post"))).toEqual({ locale: undefined, id: "my-post" }); // zh-cn is the default locale → undefined
	});

	it.skipIf(monolocale)("maps the default locale (zh-cn) to undefined — the URL prefix is omitted", () => {
		const { locale, id } = buildEntryParams(entry("zh-cn/my-post"));
		expect(locale).toBeUndefined();
		expect(id).toBe("my-post");
	});

	it.skipIf(monolocale)("preserves a non-default locale as a string", () => {
		expect(buildEntryParams(entry("en/my-post"))).toEqual({ locale: "en", id: "my-post" });
	});

	it.skipIf(monolocale)("preserves ja as a non-default locale", () => {
		expect(buildEntryParams(entry("ja/some-slug"))).toEqual({ locale: "ja", id: "some-slug" });
	});

	it.skipIf(monolocale)("handles ids with slashes inside the slug", () => {
		expect(buildEntryParams(entry("en/folder/nested-post"))).toEqual({ locale: "en", id: "folder/nested-post" });
	});

	it.skipIf(monolocale)("returns the id as-is for an en-locale entry (the locale segment is the configured default's complement)", () => {
		expect(buildEntryParams(entry("en/some-post"))).toEqual({ locale: "en", id: "some-post" });
	});
});

describe("buildEntryParams (monolocale)", () => {
	it.skipIf(!monolocale)("returns the id verbatim and locale: undefined", () => {
		expect(buildEntryParams(entry("my-post"))).toEqual({ locale: undefined, id: "my-post" });
	});
});

/**
 * The `getStaticPaths` builders delegate to `buildEntryParams`. These
 * tests pin the *integration* — that the `getStaticPaths` result shape
 * matches what Astro consumes at the call site.
 */
describe("localeStaticPaths", () => {
	it("maps every configured locale to a {locale, ...} pair, mapping the default to undefined", () => {
		const paths = localeStaticPaths();
		const locales = paths.map(p => p.params.locale);
		expect(locales).toContain(undefined);
		expect(locales).toContain("en");
		expect(locales).toContain("ja");
		expect(paths).toHaveLength(3);
	});

	it("produces exactly one undefined-locale entry (the default)", () => {
		const paths = localeStaticPaths();
		const undefineds = paths.filter(p => p.params.locale === undefined);
		expect(undefineds).toHaveLength(1);
	});
});
