/**
 * Localise the `title` attribute of every `<time>` element in the current
 * document so hover-tooltips render in the visitor's preferred locale and
 * timezone, regardless of where the timestamp was generated at build time.
 *
 * Pure DOM mutation. No external state, no observer. Safe to call on first
 * load, after every swup page transition, and on any subtree the caller
 * passes in (e.g. a freshly swapped `<article>`).
 */
import Time from "$utils/time";

export function localizeTimes(root: ParentNode = document): void {
	root.querySelectorAll<HTMLTimeElement>("time").forEach(time => {
		if (!time.dateTime) return;
		time.title = Time.toLocaleString(time.dateTime, navigator.language, true);
	});
}
