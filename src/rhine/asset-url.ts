/** Model and audio resources are served by Astro from public/. */
export const assetUrl = (path: string) => `/${path.replace(/^\//, "")}`;
