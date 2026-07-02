import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { Feed } from "feed";
import config from "$config";
import { feedLink, getPublishedByLocale, localeStaticPaths } from "$utils/content";
import i18nit from "$i18n";

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

	// Aggregate items from specified sections
	const sections = config.feed?.section || "*";

	/** A listable collection entry plus the absolute link used by the Atom feed. */
	type FeedItem = CollectionEntry<"note" | "jotting"> & { link: string };

	const items: FeedItem[] = [];

	// Determine which sections to include
	if (sections === "*" || sections.includes("note")) {
		const notes = await getPublishedByLocale("note", language);
		// Use the listing-card seam to materialise a link, no entry mutation.
		items.push(...notes.map(note => ({ ...note, link: feedLink(note, "note", language, site!) })));
	}

	if (sections === "*" || sections.includes("jotting")) {
		const jottings = await getPublishedByLocale("jotting", language);
		items.push(...jottings.map(jotting => ({ ...jotting, link: feedLink(jotting, "jotting", language, site!) })));
	}

	// Sort all items by timestamp and limit to configured number
	const sorted = items
		.sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()) // Sort by newest first
		.slice(0, config.feed?.limit || items.length); // Limit to number of items

	// Create an Astro container for rendering content
	const container = await AstroContainer.create();
	await Promise.all(
		sorted.map(async item => {
			if (item.rendered) {
				// Render content for each item
				const content = await container.renderToString((await render(item)).Content);

				// Rewrite relative paths to absolute URLs for media assets
				item.rendered.html = content.replace(/(?<=src=")\/(?!\/)([^"]+)/g, `${site?.origin}/$1`);
			}
		})
	);

	// Add each filtered note as a feed item
	sorted.forEach(item => {
		feed.addItem({
			id: item.id, // Unique item identifier
			title: item.data.title, // Post title
			link: item.link, // URL to the post
			date: item.data.timestamp, // Publication date
			content: item.data.sensitive ? t("sensitive.feed", { link: item.link }) : item.rendered?.html, // Rendered content
			description: item.data.description, // Summary of the post
			category: item.data.tags?.map(tag => ({ term: tag })) // Tags as categories
		});
	});

	// Generate Atom 1.0 XML feed
	const xml = feed.atom1();

	return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
