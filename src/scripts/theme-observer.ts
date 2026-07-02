/**
 * Watch `<html data-theme>` for changes and re-run the theme-aware enhancers.
 *
 * Encapsulating the observer here keeps the orchestrator free of DOM-mutation
 * concerns. Only enhancers that actually depend on the theme should be passed
 * in — image and time enhancers are theme-invariant and do not need to be
 * re-run on every toggle.
 */
export type ThemeAwareEnhancer = () => unknown | Promise<unknown>;

export function watchThemeChanges(...enhancers: ThemeAwareEnhancer[]): MutationObserver {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
				for (const enhancer of enhancers) void enhancer();
			}
		}
	});
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
	return observer;
}
