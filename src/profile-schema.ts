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
    href: text.refine(value => {
      if (/\s|\\/.test(value)) return false;
      try {
        const url = new URL(value, "https://local.invalid");
        return (/^\/(?!\/)/.test(value) || /^https?:\/\//.test(value)) && ["http:", "https:"].includes(url.protocol)
          || ["mailto:", "tel:"].includes(url.protocol) && url.pathname.length > 0;
      } catch { return false; }
    }, "Use a valid HTTP(S), mailto, tel or site URL").optional(),
  })).default([]),
}).default({ contacts: [] });
