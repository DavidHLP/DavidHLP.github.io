/**
 * Deep module for Open Graph image rendering.
 *
 * The two OG adapters (`graph/default.ts` and `graph/content.ts`) used to
 * repeat the same satori → font load → sharp → PNG pipeline. The only thing
 * that varied was the VDOM template; everything else (1200×630 dimensions,
 * font cache, favicon base64 embed, PNG encoding) was duplicated.
 *
 * `renderOg` absorbs the pipeline. Templates become pure data: a function
 * that turns a typed `props` object into a satori VNode tree.
 *
 * Deletion test: removing this file forces both `default.ts` and
 * `content.ts` to inline the full pipeline again. The re-spread is the
 * signal this seam is earning its keep.
 */
import satori from "satori";
import sharp from "sharp";
import icon from "$public/favicon.svg?raw";
import { loadFont } from "./index";

/** Favicon encoded once at module load and reused by every template. */
export const ICON_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}`;

/** Satori VNode tree. The template function returns this. */
export type OgTemplate = (props: Record<string, unknown>) => unknown;

/**
 * Run an OG template through the shared satori → sharp → PNG pipeline.
 * The template is the only thing that varies; this function is the seam.
 */
export async function renderOg<P extends Record<string, unknown>>(template: (props: P) => unknown, props: P): Promise<Buffer> {
	const locale = String(props.locale);
	const svg = await satori(template(props) as never, {
		width: 1200,
		height: 630,
		fonts: [{ name: "Serif", data: await loadFont(locale) }]
	});

	return sharp(Buffer.from(svg)).resize(1200).png().toBuffer();
}
