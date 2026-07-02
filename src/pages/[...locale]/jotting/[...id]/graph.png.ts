import type { APIRoute } from "astro";
import config from "$config";
import { contentGraphStaticPaths } from "$utils/content";
import graph from "$graph/content";

export async function getStaticPaths() {
	return contentGraphStaticPaths("jotting", "navigation.jotting");
}

/**
 * GET handler that generates and returns the Open Graph image for a jotting.
 */
export const GET: APIRoute = async ({ params, props }) => {
	const image = await graph({
		locale: params.locale || config.i18n.defaultLocale,
		type: props.type,
		site: config.title,
		author: config.author.name,
		title: props.title,
		time: props.time,
		tags: props.tags
	});

	return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
};
