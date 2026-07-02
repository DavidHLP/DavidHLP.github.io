import { describe, expect, it, vi } from "vitest";

/**
 * `renderOg` is the shared satori → sharp → PNG pipeline (ADR 0002).
 * It depends on three external modules — satori, sharp, and the
 * font loader — that we mock here so the test can run in a vitest
 * environment. The interesting logic is the contract:
 *  - locale is coerced to a string from `props.locale`;
 *  - the pipeline uses 1200×630 dimensions and the "Serif" font;
 *  - the returned value is a Buffer (the PNG bytes).
 *
 * The `?raw` import of the favicon SVG is handled by Vite's
 * transform pipeline, which vitest inherits. We don't exercise the
 * actual rasterisation — that's a job for `astro build`.
 */

const mockLoadFont = vi.fn(async () => new ArrayBuffer(8));
const mockSatori = vi.fn(async (_vnode: unknown, _opts?: unknown) => "<svg></svg>");
const mockSharpInstance = {
	resize: vi.fn().mockReturnThis(),
	png: vi.fn().mockReturnThis(),
	toBuffer: vi.fn(async () => Buffer.from("png-bytes"))
};
const mockSharp = vi.fn(() => mockSharpInstance);

vi.mock("./index", () => ({
	loadFont: mockLoadFont
}));

vi.mock("satori", () => ({
	default: mockSatori
}));

vi.mock("sharp", () => ({
	default: mockSharp
}));

const { renderOg } = await import("./render");

const stubTemplate = vi.fn((props: Record<string, unknown>) => ({
	type: "div",
	props: { children: props.title }
}));

describe("renderOg", () => {
	it("returns a Buffer (the PNG bytes)", async () => {
		const result = await renderOg(stubTemplate, { locale: "en", title: "Hello" });
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it("passes the props through to the template function", async () => {
		stubTemplate.mockClear();
		await renderOg(stubTemplate, { locale: "en", title: "Propagate" });
		expect(stubTemplate).toHaveBeenCalledWith({ locale: "en", title: "Propagate" });
	});

	it("uses 1200×630 dimensions in the satori call", async () => {
		mockSatori.mockClear();
		await renderOg(stubTemplate, { locale: "en" });
		expect(mockSatori).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				width: 1200,
				height: 630
			})
		);
	});

	it("loads the font for the given locale", async () => {
		mockLoadFont.mockClear();
		await renderOg(stubTemplate, { locale: "zh-cn" });
		expect(mockLoadFont).toHaveBeenCalledWith("zh-cn");
	});

	it("uses the Serif font family", async () => {
		mockSatori.mockClear();
		await renderOg(stubTemplate, { locale: "en" });
		const satoriArg = mockSatori.mock.calls[0]?.[1] as unknown as { fonts: Array<{ name: string }> };
		expect(satoriArg.fonts).toHaveLength(1);
		expect(satoriArg.fonts[0].name).toBe("Serif");
	});

	it("coerces a non-string locale to a string before loading the font", async () => {
		// The signature declares `props: P`, so a non-string locale is
		// allowed at the call site but is normalised inside the seam.
		mockLoadFont.mockClear();
		await renderOg(stubTemplate, { locale: 42 as unknown as string });
		expect(mockLoadFont).toHaveBeenCalledWith("42");
	});

	it("resizes to 1200 and encodes as PNG", async () => {
		mockSharpInstance.resize.mockClear();
		mockSharpInstance.png.mockClear();
		await renderOg(stubTemplate, { locale: "en" });
		expect(mockSharpInstance.resize).toHaveBeenCalledWith(1200);
		expect(mockSharpInstance.png).toHaveBeenCalled();
	});
});
