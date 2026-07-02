/**
 * PhotoSwipe image viewer. Walks the current document for `.markdown img`
 * elements, wraps each in a PhotoSwipe trigger anchor, and (re)initialises
 * a single lightbox instance scoped to `.markdown`.
 *
 * Calling this more than once is safe: previously-wrapped images are
 * skipped, and any existing lightbox is destroyed before the new one is
 * built. This matters because Mermaid re-renders can introduce new images
 * that need to be picked up without rebuilding the whole page.
 */
import PhotoSwipeLightbox from "photoswipe/lightbox";
import PhotoSwipe from "photoswipe";

let lightbox: PhotoSwipeLightbox | null = null;

export function initImageViewer(root: ParentNode = document): void {
	const images = root.querySelectorAll<HTMLImageElement>(".markdown img:not([data-nozoom])");

	images.forEach(img => {
		if (img.closest("a[data-pswp-trigger]")) return;

		const w = img.naturalWidth || img.width || 800;
		const h = img.naturalHeight || img.height || 600;

		const anchor = document.createElement("a");
		anchor.href = img.src;
		anchor.dataset.pswpTrigger = "";
		anchor.dataset.pswpWidth = String(w);
		anchor.dataset.pswpHeight = String(h);
		anchor.className = "pswp-trigger";

		img.parentNode!.insertBefore(anchor, img);
		anchor.appendChild(img);
	});

	lightbox?.destroy();
	lightbox = new PhotoSwipeLightbox({
		gallery: ".markdown",
		children: "a[data-pswp-trigger]",
		pswpModule: PhotoSwipe,
		zoom: true,
		closeOnVerticalDrag: true,
		bgOpacity: 0.75,
		padding: { top: 20, bottom: 20, left: 20, right: 20 },
		showHideAnimationType: "zoom"
	});
	lightbox.init();
}
