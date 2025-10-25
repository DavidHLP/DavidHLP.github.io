import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

/**
 * Note collection configuration
 * Represents main blog articles with comprehensive metadata
 */
const note = defineCollection({
	// Load all markdown files except those starting with underscore (private/draft files)
	loader: glob({ pattern: ["**/*.md", "!**/_*.md", "!**/_*/*.md"], base: "./src/content/note" }),
	schema: z.object({
		title: z.string(),								// Post title (required)
		timestamp: z.date(),							// Publication date (required)
		series: z.string().optional(),					// Series name for grouped posts
		tags: z.array(z.string()).optional(),			// Array of topic tags
		description: z.string().optional(),				// Post description/excerpt
		sensitive: z.boolean().default(false),			// Marks content as sensitive
		contents: z.boolean().default(false),			// Whether to show table of contents
		top: z.number().int().nonnegative().default(0),	// Top priority for sorting (higher is more important)
		draft: z.boolean().default(false)				// Draft status (excludes from public listing)
	})
});

/**
 * Repetition collection configuration
 * Mirrors note structure for dedicated repetition entries
 */
const repetition = defineCollection({
	loader: glob({ pattern: ["**/*.md", "!**/_*.md", "!**/_*/*.md"], base: "./src/content/repetition" }),
	schema: z.object({
		title: z.string(),
		timestamp: z.date(),
		series: z.string().optional(),
		tags: z.array(z.string()).optional(),
		description: z.string().optional(),
		sensitive: z.boolean().default(false),
		contents: z.boolean().default(false),
		top: z.number().int().nonnegative().default(0),
		draft: z.boolean().default(false)
	})
});

/**
 * Jotting collection configuration
 * Represents shorter posts, quick thoughts, or micro-blog entries
 */
const jotting = defineCollection({
	// Load all markdown files except those starting with underscore
	loader: glob({ pattern: ["**/*.md", "!**/_*.md", "!**/_*/*.md"], base: "./src/content/jotting" }),
	schema: z.object({
		title: z.string(),								// Jotting title (required)
		timestamp: z.date(),							// Publication date (required)
		tags: z.array(z.string()).optional(),			// Array of topic tags
		description: z.string().optional(),				// Brief description
		sensitive: z.boolean().default(false),			// Marks content as sensitive
		top: z.number().int().nonnegative().default(0),	// Top priority for sorting (higher is more important)
		draft: z.boolean().default(false)				// Draft status
	})
});

/**
 * Preface collection configuration
 * Represents introductory content, site announcements, or special pages
 */
const preface = defineCollection({
	// Load all markdown files
	loader: glob({ pattern: "**/*.md", base: "./src/content/preface" }),
	schema: z.object({
		timestamp: z.date(),		// Creation timestamp
		random: z.boolean().default(false),	// Whether to randomly display this preface
		title: z.string().optional()		// Quote author/source
	})
});

/**
 * Information collection configuration
 * Represents static content like about pages, policies, or site information
 */
const information = defineCollection({
	// Load both markdown and YAML files for mixed content types
	loader: glob({ pattern: "**/*.(md|yaml)", base: "./src/content/information" })
});

export const collections = { note, repetition, jotting, preface, information };
