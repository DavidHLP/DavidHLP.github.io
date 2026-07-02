/**
 * `getStaticPaths` + `GET` factory for per-entry Open Graph image endpoints.
 *
 * The two per-content OG endpoints (`[...locale]/note/[...id]/graph.png.ts`
 * and `[...locale]/jotting/[...id]/graph.png.ts`) used to repeat the same
 * shape: `import graph`, `getStaticPaths = contentGraphStaticPaths(...)`,
 * `GET = async ({ params, props }) => { ... }`. The only varying pieces
 * were the collection id, the i18n type-label key, and the renderer.
 *
 * `defineContentGraphEndpoint` absorbs the duplication. Each per-content
 * page is now a one-liner: `export const { getStaticPaths, GET } =
 * defineContentGraphEndpoint("note", "navigation.note", graph);`.
 * Adding a new listable section is one import — the OG endpoint shape
 * is owned here, not re-derived per file.
 *
 * The factory is generic over the renderer's prop shape so the call site
 * gets full type-safety from the renderer it passes. The pre-deepening
 * shape was untyped (`props: any`) at the call site; the factory narrows
 * it to whatever `graph` declares.
 *
 * Deletion test: removing this file forces every per-content page to
 * re-inline the same `getStaticPaths` + `GET` body. The re-spread is
 * the signal this seam is earning its keep.
 */
import type { APIRoute } from "astro";
import config from "$config";
import { contentGraphStaticPaths } from "$utils/content";
import type { ContentCollection } from "$utils/config";

/** The shape every per-entry OG renderer accepts. Generic so the caller narrows. */
type Renderer<P> = (props: P) => Promise<Buffer>;

/**
 * Build the `getStaticPaths` + `GET` pair for a content collection's
 * per-entry OG endpoint. Pass the collection id, the i18n type-label
 * key (e.g. `navigation.note`), and the renderer that turns the props
 * into a PNG.
 *
 * The locale split + default-locale mapping is delegated to
 * `contentGraphStaticPaths` (the shared seam in `$utils/content`);
 * this factory only owns the endpoint shape.
 */
export function defineContentGraphEndpoint<C extends ContentCollection, P extends Record<string, unknown>>(
	collection: C,
	typeLabelKey: string,
	renderer: Renderer<P>
): {
	getStaticPaths: typeof contentGraphStaticPaths;
	GET: APIRoute;
} {
	return {
		getStaticPaths: () => contentGraphStaticPaths(collection, typeLabelKey),
		GET: async ({ params, props }) => {
			const image = await renderer({
				locale: params.locale || config.i18n.defaultLocale,
				type: props.type as string,
				site: config.title,
				author: config.author.name,
				title: props.title as string,
				time: props.time as string,
				series: props.series as string | undefined,
				tags: props.tags as string[] | undefined
			} as unknown as P);
			return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
		}
	};
}
