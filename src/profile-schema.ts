import { z } from "astro/zod";

const text = z.string().trim().min(1);
const localFile = text.regex(/^\/(?!\/)(?!.*(?:\.\.|[?#\\])).+$/, "Use a file under public/");
export const profileSchema = z.object({
  role: text.optional(),
  summary: text.optional(),
  location: text.optional(),
  avatar: localFile.optional(),
  resume: localFile.optional(),
  contacts: z.array(z.object({
    label: text,
    href: text.refine(value => /^(https?:\/\/|mailto:|tel:|\/(?!\/))/.test(value), "Use HTTP(S), mailto, tel or a site path").optional(),
  })).default([]),
}).default({ contacts: [] });
