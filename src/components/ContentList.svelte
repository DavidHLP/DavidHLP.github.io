<script lang="ts">
import { untrack } from "svelte";
import { flip } from "svelte/animate";
import config from "$config";
import { type ContentCard, type Section } from "$utils/content";
import { getContentHash } from "$utils/id-hash";
import Time from "$utils/time";
import Icon from "$components/Icon.svelte";
import Pagination from "$components/Pagination.svelte";
import i18nit from "$i18n";
import { ts } from "$utils/labels";
import { tagOptions } from "$utils/tag-options";

/**
 * The two content publications the site renders as paginated lists.
 * Drives every feature flag below (series support, pagination size, i18n prefix).
 *
 * `Section` is the canonical publication type re-exported from `$utils/content`
 * (which itself imports it from `$utils/config`); keep this comment as the
 * pointer future readers need to trace the seam.
 */

let {
	locale,
	section,
	items,
	series: seriesList = [],
	tags: tagList
}: { locale: string; section: Section; items: ContentCard[]; series?: string[]; tags: string[] } = $props();

const t = i18nit(locale);
const supportsSeries = section === "note";
const size: number = config.pagination?.[section] ?? (section === "note" ? 15 : 24);

/** Track initial load to parse URL parameters */
let initial = $state(true);

let pages: number = $state(1);
let page: number = $state(1);
let pageParam: boolean = $state(false);
let series: string | null = $state(null);
let tags: string[] = $state([]);
let tagQuery = $state("");
let tagsExpanded = $state(false);
const tagListId = $props.id();
const matchingTags = $derived(tagOptions(tagList, items, tagQuery));
const visibleTags = $derived(tagsExpanded || tagQuery.trim() ? matchingTags : matchingTags.slice(0, 12));

/**
 * Toggle tag inclusion/exclusion in the filter list
 * @param tag Tag to toggle
 * @param turn whether to include or exclude the tag
 */
function switchTag(tag: string, turn?: boolean) {
	const included = tags.includes(tag);
	if (turn === undefined) turn = !included;

	// Add tag if turning on and not included, or remove if turning off
	tags = turn ? (included ? tags : [...tags, tag]) : tags.filter(item => item !== tag);

	// Reset page parameter
	pageParam = false;
	page = 1;
}

/**
 * Select or deselect a series filter (only one series can be active at a time)
 * @param seriesChoice the series to select or deselect
 * @param turn whether to include or exclude the series
 */
function chooseSeries(seriesChoice: string, turn?: boolean) {
	if (turn === undefined) turn = series !== seriesChoice;
	// Set series if turning on, or clear if turning off
	series = turn ? seriesChoice : null;

	// Reset page parameter
	pageParam = false;
	page = 1;
}

/** Filtered and paginated list of cards */
let list: ContentCard[] = $derived.by(() => {
	let filtered: ContentCard[] = items
		.filter(item => {
			// Check if item matches the specified series (only for sections that support series)
			const matchSeries = !supportsSeries || !series || item.data.series === series;

			// Check if item contains all specified tags
			const matchTags = tags.every(tag => item.data.tags?.includes(tag));

			return matchSeries && matchTags;
		})
		.sort((a, b) => {
			// Pinned (`top > 0`) items always lead
			if (a.data.top !== b.data.top) return b.data.top - a.data.top;
			// Newer first
			return b.data.timestamp.getTime() - a.data.timestamp.getTime();
		});

	untrack(() => {
		// Ensure page is within valid range
		pages = Math.max(1, Math.ceil(filtered.length / size));
		page = Math.max(1, Math.min(Math.floor(page), pages));
	});

	// Apply pagination by slicing the array
	return filtered.slice((page - 1) * size, page * size);
});

$effect(() => {
	if (initial) {
		// Parse URL parameters when component is first mounted
		const params = new URLSearchParams(window.location.search);

		if (params.get("page") !== null) {
			pageParam = true;
			const value = Number(params.get("page"));
			page = Number.isNaN(value) ? 1 : value;
		}

		if (supportsSeries) series = params.get("series");
		tags = params.getAll("tag");

		initial = false;
	} else {
		// Build URL with current page, series, and tag filters using URLSearchParams
		const url = new URL(window.location.href);
		url.searchParams.delete("series");
		url.searchParams.delete("tag");
		url.searchParams.delete("page");

		if (supportsSeries && series) url.searchParams.set("series", series);
		for (const tag of tags) url.searchParams.append("tag", tag);

		if (page > 1) pageParam = true;
		if (pageParam) url.searchParams.set("page", String(page));

		// Match https://github.com/swup/swup/blob/main/src/helpers/history.ts#L22
		window.history.replaceState({ url: url.toString(), random: Math.random(), source: "swup" }, "", url);
	}
});
</script>

<div class="flex flex-col-reverse sm:flex-row gap-10 grow relative">
	<article class="flex flex-col grow min-w-0">
		{#each list as item (item.id)}
			<section animate:flip={{ duration: 150 }} class="flex flex-col gap-2 border-b border-weak/10 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0 relative select-text">
				<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
					<div class="leading-[1.55] font-serif font-light text-lg">
						{#if item.data.top > 0}
							<span class="text-remark inline-block align-middle mr-1" title="Pinned"><Icon name="lucide--flag-triangle-right" class="rtl:-scale-x-100" /></span>
						{/if}
						{#if item.data.sensitive}
							<span class="text-remark inline-block align-middle mr-1" title={ts(t, "sensitive.icon")}><Icon name="lucide--siren" /></span>
						{/if}
						{#if supportsSeries && item.data.series}
							<button onclick={() => chooseSeries(item.data.series!, true)} class="font-mono text-xs text-weak hover:text-primary mr-1 transition-colors">// {item.data.series}</button>
							<span aria-hidden="true" class="text-weak/30 mr-1">|</span>
						{/if}
						<a href={item.url} class="text-primary hover:text-secondary transition-colors duration-150 link align-middle">{item.data.title}</a>
					</div>
					<span class="inline-flex items-center sm:justify-end gap-1.5 flex-wrap content-start">
						{#each item.data.tags ?? [] as tag}
							<button onclick={() => switchTag(tag, true)} class="text-[10px] font-mono text-remark hover:text-primary transition-colors bg-block px-2 py-0.5 rounded-sm">#{tag}</button>
						{/each}
					</span>
				</div>
				<div class="flex items-center justify-between mt-1">
					<time datetime={item.data.timestamp.toISOString()} class="font-mono text-[10px] text-remark">{Time.toString(item.data.timestamp)}</time>
					<span class="text-[8px] font-mono text-weak/40 select-none">[HASH.{getContentHash(item.id)}]</span>
				</div>
			</section>
		{:else}
			<div class="pt-[10vh] text-center text-secondary font-bold text-xl">{t(`${section}.empty`)}</div>
		{/each}

		<div class="mt-8">
			<Pagination bind:pages bind:page />
		</div>
	</article>

	<aside class="sm:basis-60 shrink-0 flex flex-col gap-6 sm:border-l sm:border-weak/10 sm:pl-8 no-print">
		{#if supportsSeries && seriesList.length > 0}
			<section>
				<h4>[ {t(`${section}.series`)} ]</h4>
				<p>
					{#each seriesList as seriesItem (seriesItem)}
						<button aria-pressed={seriesItem == series} class:selected={seriesItem == series} onclick={() => chooseSeries(seriesItem)}>{seriesItem}</button>
					{/each}
				</p>
			</section>
		{/if}
		<section class="tag-filter" aria-label={ts(t, "filters.tags")}>
			<div class="tag-heading">
				<h4>[ {t(`${section}.tag`)} ]</h4>
				<span class="tag-total">{tagList.length}</span>
			</div>
			<label class="tag-search">
				<Icon name="lucide--search" />
				<input type="search" bind:value={tagQuery} placeholder={ts(t, "filters.searchTags")} aria-label={ts(t, "filters.searchTags")} aria-controls={tagListId} />
			</label>
			{#if tags.length > 0}
				<div class="tag-selection">
					<div class="tag-heading">
						<span>{t("filters.selected", { count: tags.length })}</span>
						<button class="tag-action" onclick={() => { tags = []; page = 1; pageParam = false; }}>{t("filters.clear")}</button>
					</div>
					<div class="selected-tags">
						{#each tags as tag (tag)}
							<button aria-label={ts(t, "filters.remove", { tag })} onclick={() => switchTag(tag, false)}>{tag}<span aria-hidden="true">×</span></button>
						{/each}
					</div>
				</div>
			{/if}
			<div class="tag-options" id={tagListId}>
				{#each visibleTags as { tag, count } (tag)}
					<button class="tag-option" aria-pressed={tags.includes(tag)} onclick={() => switchTag(tag)}>
						<span class="tag-name">{tag}</span><span class="tag-count">{count}</span>
					</button>
				{:else}
					<span class="tag-empty" role="status">{t("filters.noTags")}</span>
				{/each}
			</div>
			{#if !tagQuery.trim() && matchingTags.length > 12}
				<button class="tag-expand" aria-expanded={tagsExpanded} aria-controls={tagListId} onclick={() => tagsExpanded = !tagsExpanded}>
					{tagsExpanded ? t("filters.collapse") : t("filters.showAll", { count: tagList.length })}
					<span aria-hidden="true">{tagsExpanded ? "−" : "+"}</span>
				</button>
			{/if}
		</section>
	</aside>
</div>

<style>
	.tag-filter { min-width: 0; }
	.tag-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
	.tag-heading h4 { margin: 0; }
	.tag-total, .tag-count { font-variant-numeric: tabular-nums; color: var(--remark-color); }
	.tag-total { font: 0.7rem var(--font-mono); }
	.tag-search { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border: 1px solid var(--rule-color); background: var(--block-color); color: var(--remark-color); }
	.tag-search:focus-within { outline: 2px solid var(--accent-color); outline-offset: 2px; }
	.tag-search input { width: 100%; min-width: 0; padding: 0; border: 0; outline: none; background: transparent; color: var(--primary-color); font-size: 0.8rem; }
	.tag-search input::placeholder { color: var(--remark-color); opacity: 1; }
	.tag-options { display: flex; flex-wrap: wrap; align-content: start; gap: 6px; max-height: 320px; overflow-y: auto; padding: 3px; margin: 0 -3px; scrollbar-width: thin; scrollbar-color: var(--weak-color) transparent; }
	.tag-option { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; min-height: 32px; padding: 5px 8px; border: 1px solid var(--rule-color); border-radius: 3px; color: var(--secondary-color); font: 0.7rem/1.4 var(--font-mono); text-align: start; }
	.tag-name { overflow-wrap: anywhere; }
	.tag-count { flex-shrink: 0; font-size: 0.65rem; }
	.tag-option:hover { background: var(--block-color); border-color: var(--weak-color); }
	.tag-option[aria-pressed="true"] { color: var(--accent-color); border-color: var(--accent-color); background: color-mix(in srgb, var(--accent-color) 8%, transparent); }
	.tag-option[aria-pressed="true"] .tag-count { color: inherit; }
	.tag-selection { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--rule-color); color: var(--remark-color); font-size: 0.75rem; }
	.selected-tags { display: flex; flex-wrap: wrap; gap: 6px; }
	.selected-tags button { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; padding: 5px 8px; border-radius: 3px; background: color-mix(in srgb, var(--accent-color) 12%, transparent); color: var(--accent-color); overflow-wrap: anywhere; }
	.tag-action { color: var(--accent-color); text-decoration: underline; text-underline-offset: 3px; }
	.tag-expand { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--rule-color); color: var(--secondary-color); font: 0.75rem var(--font-mono); }
	.tag-expand:hover { color: var(--accent-color); }
	.tag-empty { padding: 12px 0; color: var(--remark-color); font-size: 0.8rem; }
	@media (max-width: 639px) { .tag-options { max-height: 240px; } .tag-option, .selected-tags button { min-height: 40px; } }
	aside {
		section {
			display: flex;
			flex-direction: column;
			gap: 8px;

			h4 {
				font-family: var(--font-mono);
				font-size: 0.75rem;
				color: var(--weak-color);
				text-transform: uppercase;
				letter-spacing: 0.1em;
				margin-bottom: 4px;
			}

			p {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
				gap: 6px;

				button {
					border: 1px solid color-mix(in srgb, var(--weak-color) 20%, transparent);
					border-radius: 2px;
					padding: 0.15rem 0.5rem;
					font-size: 0.75rem;
					font-family: var(--font-mono);
					color: var(--secondary-color);
					transition: all 0.15s ease-in-out;

					&.selected {
						color: var(--background-color);
						background-color: var(--primary-color);
						border-color: var(--primary-color);
					}

					@media (min-width: 640px) {
						&:hover:not(.selected) {
							color: var(--primary-color);
							background-color: var(--block-color);
							border-color: var(--secondary-color);
						}
					}
				}
			}
		}
	}
</style>
