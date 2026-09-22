<script lang="ts">
	/**
	 * Reusable pagination control.
	 *
	 * Renders real `<a href>` links (built from the current URL, so every other
	 * query param survives) — this keeps pagination crawlable, shareable and
	 * fully functional without JavaScript.
	 */
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { pageList } from '$lib/utils/query';

	interface Props {
		/** 1-based current page. */
		page: number;
		totalPages: number;
		/** Builds the href for a target page. Defaults to preserving `?page=`. */
		hrefFor?: (page: number) => string;
		/** Total row count, only used for the "x–y dari n" caption. */
		count?: number;
		perPage?: number;
		/** Accessible name for the `<nav>` landmark. */
		label?: string;
		class?: string;
	}

	let {
		page,
		totalPages,
		hrefFor = (p) => (p > 1 ? `?page=${p}` : '?'),
		count,
		perPage,
		label = 'Navigasi halaman',
		class: className = ''
	}: Props = $props();

	const pages = $derived(pageList(page, totalPages));
	const from = $derived(count != null && perPage != null ? (page - 1) * perPage + 1 : null);
	const to = $derived(
		count != null && perPage != null ? Math.min(page * perPage, count) : null
	);

	const linkCls =
		'inline-grid h-9 min-w-9 place-items-center rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-600 transition hover:border-teal-300 hover:text-teal-700';
	const disabledCls =
		'inline-grid h-9 min-w-9 place-items-center rounded-xl border border-slate-100 bg-slate-50 px-2 text-slate-300';
</script>

{#if totalPages > 1}
	<nav class="flex flex-wrap items-center justify-between gap-3 {className}" aria-label={label}>
		{#if from != null && to != null && count != null}
			<p class="text-xs font-medium text-slate-400">
				Menampilkan {from}–{to} dari {count}
			</p>
		{:else}
			<span></span>
		{/if}

		<div class="flex flex-wrap items-center gap-1.5">
			{#if page > 1}
				<a href={hrefFor(page - 1)} class={linkCls} rel="prev" aria-label="Halaman sebelumnya">
					<ChevronLeft class="h-4 w-4" />
				</a>
			{:else}
				<span class={disabledCls} aria-hidden="true"><ChevronLeft class="h-4 w-4" /></span>
			{/if}

			{#each pages as item, i (item === 'gap' ? `gap-${i}` : item)}
				{#if item === 'gap'}
					<span class="px-1 text-sm font-bold text-slate-300" aria-hidden="true">…</span>
				{:else if item === page}
					<span class="inline-grid h-9 min-w-9 place-items-center rounded-xl bg-teal-600 px-2 text-sm font-bold text-white shadow-sm" aria-current="page">
						{item}
					</span>
				{:else}
					<a href={hrefFor(item)} class={linkCls} aria-label={`Halaman ${item}`}>{item}</a>
				{/if}
			{/each}

			{#if page < totalPages}
				<a href={hrefFor(page + 1)} class={linkCls} rel="next" aria-label="Halaman berikutnya">
					<ChevronRight class="h-4 w-4" />
				</a>
			{:else}
				<span class={disabledCls} aria-hidden="true"><ChevronRight class="h-4 w-4" /></span>
			{/if}
		</div>
	</nav>
{/if}
