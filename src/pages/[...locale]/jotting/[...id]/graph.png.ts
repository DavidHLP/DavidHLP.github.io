import { defineContentGraphEndpoint } from "$utils/og-endpoint";
import graph from "$graph/content";

/**
 * Per-entry Open Graph image for Jotting entries. The factory owns the
 * `getStaticPaths` + `GET` shape so this file is a one-liner; adding
 * a new listable section is the same one-liner.
 */
export const { getStaticPaths, GET } = defineContentGraphEndpoint("jotting", "navigation.jotting", graph);
