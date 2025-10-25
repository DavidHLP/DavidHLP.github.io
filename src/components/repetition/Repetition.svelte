<style lang="less">
	article {
		footer {
			button {
				display: flex;
				align-items: center;
				justify-content: center;

				width: 30px;
				height: 30px;

				margin-top: 0.25rem 0rem 0.5rem;
				border-bottom: 2px solid;

				font-style: var(--monospace);
				font-size: 0.875rem;

				transition: color 0.15s ease-in-out;

				&:hover,
				&.location {
					color: var(--primary-color);
				}
			}
		}
	}

	aside {
		section {
			display: flex;
			flex-direction: column;
			gap: 5px;

			p {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
				gap: 5px;

				button {
					border-bottom: 1px solid var(--primary-color);
					padding: 0rem 0.2rem;

					font-size: 0.9rem;
					transition:
						color 0.1s ease-in-out,
						background-color 0.1s ease-in-out;

					&.selected {
						color: var(--background-color);
						background-color: var(--primary-color);
					}
				}
			}
		}
	}
</style>

<main class="flex flex-col-reverse sm:flex-row gap-10 grow">
	<article class="flex flex-col gap-4 grow">
		{#each list as repetition (repetition.id)}
			<section animate:flip={{ duration: 150 }} class="flex flex-col sm:flex-row">
				<div class="flex flex-col gap-1">
					<div class="flex gap-1 items-center">
						{#if repetition.data.top > 0}<span>{@render top()}</span>{/if}
						{#if repetition.data.sensitive}<span>{@render sensitive()}</span>{/if}
						{#if repetition.data.series}<button onclick={() => choose_series(repetition.data.series, true)}>{repetition.data.series}</button><b>|</b>{/if}
						<a href={getRelativeLocaleUrl(locale, `/repetition/${repetition.id.split("/").slice(1).join("/")}`)} class="link">{repetition.data.title}</a>
					</div>
					<time title={Time.full(repetition.data.timestamp)} class="font-mono text-2.6 c-remark">{Time(repetition.data.timestamp)}</time>
				</div>
				<span class="flex items-center gap-1 sm:ml-a c-remark">
					{#each repetition.data.tags as tag}
						<button onclick={() => switch_tag(tag, true)} class="text-3.5 sm:text-sm">#{tag}</button>
					{/each}
				</span>
			</section>
		{/each}

		{#if pages > 1}
			<footer class="sticky bottom-0 flex items-center justify-center gap-3 mt-a pb-1 c-weak bg-background font-mono">
				<button onclick={() => (page = Math.max(1, page - 1))}>{@render left()}</button>
				<button class:location={1 == page} onclick={() => (page = 1)}>{1}</button>

				{#if pages > 7 && page > 4}{@render dots()}{/if}

				{#each Array.from({ length: Math.min(5, pages - 2) }, (_, i) => i + Math.max(2, Math.min(pages - 5, page - 2))) as P (P)}
					<button class:location={P == page} onclick={() => (page = P)} animate:flip={{ duration: 150 }} transition:fade={{ duration: 150 }}>{P}</button>
				{/each}

				{#if pages > 7 && page < pages - 3}{@render dots()}{/if}

				<button class:location={pages == page} onclick={() => (page = pages)}>{pages}</button>
				<button onclick={() => (page = Math.min(pages, page + 1))}>{@render right()}</button>
			</footer>
		{/if}
	</article>

	<aside class="sm:flex-basis-200px flex flex-col gap-5">
		<section>
			<h3>{t("repetition.series")}</h3>
			<p>
				{#each series_list as series_item (series_item)}
					<button class:selected={series_item == series} onclick={() => choose_series(series_item)}>{series_item}</button>
				{/each}
			</p>
		</section>

		<section>
			<h3>{t("repetition.tag")}</h3>
			<p>
				{#each tag_list as tag (tag)}
					<button class:selected={tags.includes(tag)} onclick={() => switch_tag(tag)}>{tag}</button>
				{/each}
			</p>
		</section>
	</aside>
</main>

<script lang="ts">
	import { getRelativeLocaleUrl } from "astro:i18n";
	import { type Snippet } from "svelte";
	import { flip } from "svelte/animate";
	import { fade } from "svelte/transition";
	import Time from "$utils/time";
	import i18nit from "$i18n";

	let {
		locale,
		allRepetitions,
		series_list,
		tag_list,
		top,
		sensitive,
		left,
		right,
		dots
	}: {
		locale: string;
		allRepetitions: any[];
		series_list: string[];
		tag_list: string[];
		top: Snippet;
		sensitive: Snippet;
		left: Snippet;
		right: Snippet;
		dots: Snippet;
	} = $props();

	const t = i18nit(locale);

	const size = 20;
	let page = $state(1);
	let series: string | undefined = $state(undefined);
	let tags: string[] = $state([]);

	function switch_tag(tag: string, turn?: boolean) {
		let included = tags.includes(tag);
		if (turn === undefined) turn = !included;

		tags = turn ? (included ? tags : [...tags, tag]) : tags.filter(item => item !== tag);
		page = 1;
	}

	function choose_series(series_choice: string, turn?: boolean) {
		if (turn === undefined) turn = series !== series_choice;
		series = turn ? series_choice : undefined;
		page = 1;
	}

	let list = $derived.by(() => {
		let filtered = allRepetitions.filter(item => {
			let match_series = !series || item.data.series === series;
			let match_tags = tags.length === 0 || tags.every(tag => item.data.tags?.includes(tag));
			return match_series && match_tags;
		});

		const totalPages = Math.ceil(filtered.length / size);
		const currentPage = Math.max(1, Math.min(page, totalPages || 1));

		return filtered.slice((currentPage - 1) * size, currentPage * size);
	});

	let pages = $derived(
		Math.max(
			1,
			Math.ceil(
				allRepetitions.filter(item => {
					let match_series = !series || item.data.series === series;
					let match_tags = tags.length === 0 || tags.every(tag => item.data.tags?.includes(tag));
					return match_series && match_tags;
				}).length / size
			)
		)
	);

	$effect(() => {
		let url = getRelativeLocaleUrl(
			locale,
			`/repetition?page=${page}${series ? `&series=${series}` : ""}${tags.map(tag => `&tag=${tag}`).join("")}`
		);

		window.history.replaceState({ url, random: Math.random(), source: "swup" }, "", url);
	});
</script>
