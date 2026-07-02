import type { Swup } from "@swup/astro/client";

declare global {
	interface Window {
		swup: Swup;
		zoom: () => void;
		initializeMermaid?: () => Promise<void> | void;
	}

	declare module "*.yaml" {
		const content: Record<string, any>;
		export default content;
	}
}
