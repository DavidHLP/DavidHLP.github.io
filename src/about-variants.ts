import { z } from "astro/zod";

const text = z.string().trim().min(1);
export const aboutVariantSchema = z.object({
  variant: text.regex(/^[a-z][a-z0-9-]*$/, "Use a lowercase path segment"),
  title: text,
  lang: z.enum(["zh-CN", "en", "ja"]),
  role: text.optional(),
  summary: text.optional(),
});

export function validateAboutVariants(entries: readonly { data: Pick<z.infer<typeof aboutVariantSchema>, "variant" | "lang"> }[]) {
  for (const variant of new Set(entries.map(entry => entry.data.variant))) {
    for (const lang of ["zh-CN", "en", "ja"]) {
      if (entries.filter(entry => entry.data.variant === variant && entry.data.lang === lang).length !== 1)
        throw new Error(`About variant ${variant} requires exactly one ${lang} document`);
    }
  }
}

