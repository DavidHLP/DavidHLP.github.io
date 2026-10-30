/** Match browser pathname encoding, including Chinese and nested article slugs. */
export const postPath = (slug: string) =>
  `/blog/${slug.split("/").map(encodeURIComponent).join("/")}/`;
