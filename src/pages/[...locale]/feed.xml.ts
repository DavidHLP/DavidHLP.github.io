import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { Feed } from "feed";
import config from "$config";
import { feedLink, listBySections, localeStaticPaths } from "$utils/content";
import i18nit from "$i18n";
import { ts } from "$utils/labels";

export const getStaticPaths = localeStaticPaths;

/**
 * GET endpoint for generating feeds
 * Supports filtering by language, series, and tags
 */
export const GET: APIRoute = async ({ site, params }) => {
	const { locale: language = config.i18n.defaultLocale } = params;
	const t = i18nit(language);

	// Initialize feed with site metadata and configuration
	const feed = new Feed({
		title: config.title,
		description: config.description,
		author: config.author,
		// Handle copyright based on license type - CC0 has special formatting
		copyright:
			config.copyright.type === "CC0 1.0"
				? "CC0 1.0 – No Rights Reserved"
				: `${config.copyright.type} © ${config.copyright.year} ${config.author.name}`,
		image: new URL("favicon-96x96.png", site).toString(), // Feed image/logo
		favicon: new URL("favicon.ico", site).toString(), // Feed favicon
		id: site!.toString(), // Unique feed identifier
		link: site!.toString(), // Feed's associated website
		stylesheet: "feed.xsl" // XSL stylesheet for feed
	});

	// The section-iteration pattern (turn "*" into the canonical list,
	// iterate, fetch per section) lives in `src/utils/sections.ts`;
	// the per-section fetch + parallel merge is now shared with the
	// homepage. The feed owns the feed-specific projection (entry +
	// absolute link) via the `shape` adapter, and the per-entry
	// `render(item)` rendering pass below.
	const sectionSelector = config.feed?.section || "*";

	/** A listable collection entry plus the absolute link used by the Atom feed. */
	type FeedItem = CollectionEntry<"note" | "jotting"> & { link: string };

	const items: FeedItem[] = await listBySections<FeedItem>(sectionSelector, language, (entry, section, locale) => ({
		...entry,
		link: feedLink(entry, section, locale, site!)
	}));

	// Limit to the configured number of items; the sort is owned by
	// `listBySections` (newest first) so the slice is a straight take.
	const limit = config.feed?.limit || items.length;
	const top = items.slice(0, limit);

	// Create an Astro container for rendering content
	const container = await AstroContainer.create();
	await Promise.all(
		top.map(async item => {
			if (item.rendered) {
				// Render content for each item
				const content = await container.renderToString((await render(item)).Content);

				// Rewrite relative paths to absolute URLs for media assets
				item.rendered.html = content.replace(/(?<=src=")\/(?!\/)([^"]+)/g, `${site?.origin}/$1`);
			}
		})
	);

	// Add each filtered note as a feed item
	top.forEach(item => {
		feed.addItem({
			id: item.id, // Unique item identifier
			title: item.data.title, // Post title
			link: item.link, // URL to the post
			date: item.data.timestamp, // Publication date
			content: item.data.sensitive ? ts(t, "sensitive.feed", { link: item.link }) : item.rendered?.html, // Rendered content
			description: item.data.description, // Summary of the post
			category: item.data.tags?.map(tag => ({ term: tag })) // Tags as categories
		});
	});

	// Generate Atom 1.0 XML feed
	const xml = feed.atom1();

	return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
