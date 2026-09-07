<script lang="ts">
import Icon from "./Icon.svelte";

let { pages = $bindable(), page = $bindable() }: { pages: number; page: number } = $props();
</script>

{#if pages > 1}
	<nav class="pagination no-print sticky bottom-0 flex items-center justify-center gap-3 mt-auto pb-1 text-weak bg-background font-mono" aria-label="Pagination">
		<button aria-label="Previous page" disabled={page === 1} onclick={() => (page = Math.max(1, page - 1))}><Icon name="lucide--arrow-left" class="rtl:-scale-x-100" /></button>
		<button aria-current={page === 1 ? "page" : undefined} onclick={() => (page = 1)}>{1}</button>

		{#if pages > 7 && page > 4}<Icon name="lucide--ellipsis" />{/if}

		{#each Array.from({ length: Math.min(5, pages - 2) }, (_, i) => i + Math.max(2, Math.min(pages - 5, page - 2))) as P (P)}
			<button aria-current={page === P ? "page" : undefined} onclick={() => (page = P)}>{P}</button>
		{/each}

		{#if pages > 7 && page < pages - 3}<Icon name="lucide--ellipsis" />{/if}

		<button aria-current={page === pages ? "page" : undefined} onclick={() => (page = pages)}>{pages}</button>
		<button aria-label="Next page" disabled={page === pages} onclick={() => (page = Math.min(pages, page + 1))}><Icon name="lucide--arrow-right" class="rtl:-scale-x-100" /></button>
	</nav>
{/if}

<style>
	nav button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		margin-block: 0.25rem 0.5rem;
		border-bottom: 2px solid;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		transition: color 0.15s ease-in-out;
	}
	nav button:hover, nav button[aria-current="page"] { color: var(--accent-color); }
</style>
