// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import yaml from "@rollup/plugin-yaml";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

import GFM from "remark-gfm";
import ins from "remark-ins";
import mark from "remark-flexible-markers";
import spoiler from "@tuyuritio/remark-spoiler";
import CJK from "remark-cjk-friendly";
import CJKStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import ruby from "@tuyuritio/remark-ruby";
import attr from "@tuyuritio/remark-attribute";
import math from "remark-math";
import gemoji from "remark-gemoji";
import footnote from "remark-footnotes-extra";
import abbr from "@tuyuritio/remark-abbreviation";
import { remarkExtendedTable as table, extendedTableHandlers as tableHandler } from "remark-extended-table";
import alerts from "@tuyuritio/remark-github-alert";
import mermaid from "./src/utils/mermaid";
import { rehypeHeadingIds as ids } from "@astrojs/markdown-remark";
import anchor from "rehype-autolink-headings";
import links from "rehype-external-links";
import katex from "rehype-katex";
import figure from "@tuyuritio/rehype-image-figure";
import wrapper from "@tuyuritio/rehype-table-wrapper";
import sectionize from "@hbsnow/rehype-sectionize";
import copy from "@tuyuritio/shiki-code-copy";

import reading from "./src/utils/reading";

import siteConfig from "./site.config";

// Syntax uses the same two inks as the publication; weight and italics retain token hierarchy.
const editorialSyntax = (name: string, foreground: string, background: string, accent: string, comment: string) => ({
	name,
	colors: { "editor.foreground": foreground, "editor.background": background },
	tokenColors: [
		{ scope: ["comment", "punctuation.definition.comment"], settings: { foreground: comment, fontStyle: "italic" } },
		{ scope: ["keyword", "storage", "entity.name.tag"], settings: { foreground: accent, fontStyle: "bold" } },
		{ scope: ["entity.name.function", "entity.name.type", "support.function"], settings: { foreground, fontStyle: "bold" } },
		{ scope: ["string", "constant"], settings: { foreground: accent } }
	]
});

// https://astro.build/config
export default defineConfig({
	site: "https://davidhlp.github.io",
	// Accept legacy slash URLs while localeUrl emits the canonical no-slash form.
	trailingSlash: "ignore",
	i18n: {
		...siteConfig.i18n,
		routing: {
			redirectToDefaultLocale: false,
			prefixDefaultLocale: false
		}
	},
	markdown: {
		remarkPlugins: [
			[GFM, { singleTilde: false }],
			ins,
			mark,
			spoiler,
			CJK,
			[CJKStrikethrough, { singleTilde: false }],
			ruby,
			attr,
			math,
			gemoji,
			footnote,
			abbr,
			[table, { colspanWithEmpty: true }],
			[alerts, { typeFormat: "capitalize" }],
			mermaid,
			reading
		],
		remarkRehype: {
			footnoteLabel: null,
			footnoteLabelTagName: "p",
			footnoteLabelProperties: {
				className: ["hidden"]
			},
			handlers: {
				...tableHandler
			}
		},
		rehypePlugins: [
			ids,
			[anchor, { behavior: "wrap" }],
			[links, { target: "_blank", rel: ["nofollow", "noopener", "noreferrer"] }],
			katex,
			figure,
			wrapper,
			sectionize
		],
		smartypants: false,
		shikiConfig: {
			themes: {
				light: editorialSyntax("editorial-light", "#30343a", "#eeefeb", "#c83232", "#63666b"),
				dark: editorialSyntax("editorial-dark", "#f0f0e9", "#2d3136", "#ed817a", "#afb1ac")
			},
			transformers: [copy({ duration: 1500 })]
		}
	},
	vite: {
		define: { __RHINE_NOVECENTO__: "false" },
		// @ts-expect-error
		plugins: [yaml(), tailwindcss()],
		resolve: {
			alias: {
				$config: fileURLToPath(new URL("./site.config.ts", import.meta.url)),
				$public: fileURLToPath(new URL("./public", import.meta.url)),
				$assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
				$icons: fileURLToPath(new URL("./src/icons", import.meta.url)),
				$graph: fileURLToPath(new URL("./src/graph", import.meta.url)),
				$utils: fileURLToPath(new URL("./src/utils", import.meta.url)),
				$components: fileURLToPath(new URL("./src/components", import.meta.url)),
				$i18n: fileURLToPath(new URL("./src/i18n", import.meta.url)),
				$layouts: fileURLToPath(new URL("./src/layouts", import.meta.url)),
				$scripts: fileURLToPath(new URL("./src/scripts/index.ts", import.meta.url)),
				$styles: fileURLToPath(new URL("./src/styles", import.meta.url))
			}
		}
	},
	integrations: [svelte(), mdx(), sitemap()]
});
