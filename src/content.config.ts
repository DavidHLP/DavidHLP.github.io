import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import site from "../content/site.json";

const text = z.string().trim().min(1);
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/blog" }),
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
    source: z.string().url().refine(value => /^https?:\/\//.test(value), "仅支持 HTTP(S)"),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(text).default([]),
    draft: z.boolean().default(false),
  }),
});
export const collections = { blog };
