/**
 * Client-side enhancers mounted by `Base.astro` on every page.
 *
 * The order is important: time localisation and image viewer are
 * theme-invariant, so they run first. Mermaid is last because it can
 * inject new images, and the viewer has to be re-run to pick them up.
 *
 * The same set runs on first load and after every swup page transition.
 * The theme observer re-runs Mermaid on `<html data-theme>` mutations —
 * no other enhancer is theme-dependent.
 *
 * The window-attached shims (`window.zoom`, `window.initializeMermaid`)
 * are preserved for back-compat with `Sensitive.svelte`; new code should
 * import the named exports below directly.
 */
import { initImageViewer } from "./photoswipe-init";
import { initMermaid } from "./mermaid-init";
import { localizeTimes } from "./time-localize";
import { watchThemeChanges } from "./theme-observer";

export { initImageViewer, initMermaid, localizeTimes, watchThemeChanges };

if (typeof window !== "undefined") {
	window.zoom = initImageViewer;
	window.initializeMermaid = initMermaid;
}

/** Run every enhancer once. Safe to call on first load and on every swup transition. */
export function initializeClient(): void {
	localizeTimes();
	initImageViewer();
	void initMermaid();
}

// First mount.
initializeClient();

// Re-render Mermaid when the active theme changes.
watchThemeChanges(initMermaid);

// Re-mount after every swup page transition.
document.addEventListener("astro:page-load", initializeClient);
