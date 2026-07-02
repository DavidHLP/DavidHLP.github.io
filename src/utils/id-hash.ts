/**
 * Pure ID utilities safe to import from both server and client modules.
 *
 * Kept in its own file so client-side bundles (Svelte components) do not
 * transitively pull in the server-only `astro:content` virtual module
 * imported by `src/utils/content.ts`.
 */

/** Short, stable display hash derived from the tail of a content entry id. */
export function getContentHash(id: string): string {
	return (id.split("/").pop() || "").slice(0, 8);
}
