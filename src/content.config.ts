import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import site from "../content/site.json";

import { profileSchema } from "./profile-schema";
import { aboutVariantSchema } from "./about-variants";

const text = z.string().trim().min(1);
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/blog", generateId: ({ entry }) => entry.replace(/\.md$/, "") }),
  schema: z.object({
    archiveId: text.regex(/^X-\d{3,}$/),
    title: text,
    en: text,
    category: text.refine(value => site.columns.includes(value), "请选择配置中的五列分类"),
    department: text,
    date: text,
    lead: text,
    clearance: text,
    abstract: text,
    findings: z.array(text).min(1),
    source: z.url().refine(value => /^https?:\/\//.test(value), "仅支持 HTTP(S)"),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(text).default([]),
    draft: z.boolean().default(false),
    lang: z.enum(["zh-CN", "en", "ja"]).default("zh-CN"),
    kind: z.enum(["concept", "entity", "synthesis"]).optional(),
    status: z.enum(["active", "provisional", "deprecated"]).optional(),
    sources: z.array(text).optional(),
    related: z.array(text).optional(),
    legacy: z.object({ path: text, revision: text, metadata: z.record(z.string(), z.unknown()) }).optional(),
    translationKey: text.optional(),
    profile: profileSchema.optional(),
  }),
});
const about = defineCollection({
  loader: glob(site.about),
  schema: z.object({ title: text, lang: z.enum(["zh-CN", "en", "ja"]), profile: profileSchema, resumeLabel: text.optional() }),
});
const aboutVariants = defineCollection({
  loader: glob({ base: "./content/about", pattern: "variants/**/*.md" }),
  schema: aboutVariantSchema,
});
export const collections = { blog, about, aboutVariants };
