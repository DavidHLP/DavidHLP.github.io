/**
 * Shared content-collection type aliases.
 *
 * The listable subset (`note` and `jotting`) is what the homepage,
 * the listing pages, and the Atom feed all operate on. The full set
 * also includes `preface` and `information`, which have their own
 * shapes and never appear in the paginated list view.
 *
 * `Section` is the public name for the listable pair; it is re-exported
 * from `$utils/config` because that file owns the site-config shape.
 */
import type { Section } from "$utils/config";

export type { Section };

/** Site-managed content collections. */
export type ContentCollection = "note" | "jotting" | "preface" | "information";

/** Collections that carry the listing-card shape. */
export type ListableCollection = "note" | "jotting";
