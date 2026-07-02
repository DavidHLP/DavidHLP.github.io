import { describe, expect, it } from "vitest";
import { getContentHash } from "./id-hash";

/**
 * The id-hash module is the only client-safe utility that touches a
 * content id (it must not transitively import `astro:content`). These
 * tests pin the truncation behaviour and the edge cases that the home
 * page and listing pages rely on.
 */
describe("getContentHash", () => {
	it("returns the first 8 characters of the id tail", () => {
		expect(getContentHash("zh-cn/some-long-slug-name")).toBe("some-lon");
	});

	it("ignores leading locale directory segments", () => {
		expect(getContentHash("en/another-article")).toBe("another-");
	});

	it("returns the id unchanged when there is no slash", () => {
		expect(getContentHash("monolocale-id")).toBe("monoloca");
	});

	it("returns an empty string for an empty id", () => {
		expect(getContentHash("")).toBe("");
	});

	it("returns the full tail when shorter than 8 characters", () => {
		expect(getContentHash("zh-cn/abc")).toBe("abc");
	});

	it("uses the last segment when the id has multiple slashes (image-post style)", () => {
		// image-post/index.md → id is "zh-cn/image-post/index" → tail "index"
		expect(getContentHash("zh-cn/image-post/index")).toBe("index");
	});
});
