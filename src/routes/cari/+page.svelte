<script lang="ts">
	import { ArrowLeft, Search } from 'lucide-svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { hrefWithPage } from '$lib/utils/query';
	import { page as pageState } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/** Hrefs keep `?q=` while swapping only the page number. */
	const hrefFor = (target: number) =>
		hrefWithPage('/cari', new URLSearchParams(pageState.url.searchParams), target);

	/** Suggested terms shown when the visitor hasn't searched yet. */
	const suggestions = ['coding anak', 'robotika', 'AI', 'screen time', 'pola asuh', 'sains'];
</script>

<svelte:head>
	<title>{data.q ? `Cari “${data.q}”` : 'Cari & Arsip'} | FutureFam</title>
	<meta
		name="description"
		content={data.q
			? `Hasil pencarian “${data.q}” di FutureFam — ${data.total} artikel.`
			: 'Telusuri seluruh arsip artikel FutureFam: Future Skills, parenting, tech insight, dan kabar inspirasi.'}
	/>
	<meta property="og:title" content={data.q ? `Cari “${data.q}” | FutureFam` : 'Cari & Arsip | FutureFam'} />
	<meta property="og:type" content="website" />
	<!-- Search result pages should not compete with the articles themselves. -->
	<meta name="robots" content={data.q ? 'noindex, follow' : 'index, follow'} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
	<a
		href="/"
		class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700"
	>
		<ArrowLeft class="h-4 w-4" /> Beranda
	</a>

	<header class="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-9">
		<p class="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
			<Search class="h-3.5 w-3.5" /> Pencarian
		</p>
		<h1 class="font-display mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
			{#if data.q}
				Hasil untuk “{data.q}”
			{:else}
				Cari &amp; Arsip Artikel
			{/if}
		</h1>
		<p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
			{#if data.q}
				{data.total} artikel cocok dengan kata kunci tersebut.
			{:else}
				Ketik kata kunci untuk menelusuri judul, ringkasan, dan isi artikel kami.
			{/if}
		</p>

		<!-- GET form: works without JS and produces a shareable `?q=` URL. -->
		<SearchInput
			value={data.q}
			action="/cari"
			placeholder="Cari: coding anak, robotika, pola asuh…"
			class="mt-5 w-full sm:max-w-md"
			label="Cari artikel"
		/>

		{#if !data.q}
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<span class="text-xs font-bold text-slate-400">Coba:</span>
				{#each suggestions as term (term)}
					<a
						href={`/cari?q=${encodeURIComponent(term)}`}
						class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
					>
						{term}
					</a>
				{/each}
			</div>
		{/if}
	</header>

	<section class="mt-8" aria-label="Hasil pencarian">
		{#if data.posts.length > 0}
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.posts as post (post.id)}
					<ArticleCard {post} />
				{/each}
			</div>

			<Pagination
				page={data.page}
				totalPages={data.totalPages}
				count={data.total}
				perPage={data.perPage}
				{hrefFor}
				class="mt-8"
			/>
		{:else}
			<EmptyState
				title={data.q ? `Tidak ada hasil untuk “${data.q}”.` : 'Belum ada artikel untuk ditampilkan.'}
				description={data.q
					? 'Coba kata kunci lain yang lebih umum, atau jelajahi kategori pilihan di bawah ini.'
					: 'Arsip masih kosong. Silakan kembali lagi nanti atau jelajahi beranda.'}
				class="bg-white"
			>
				{#snippet action()}
					<a
						href="/"
						class="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
					>
						<ArrowLeft class="h-4 w-4" /> Kembali ke Beranda
					</a>
				{/snippet}
			</EmptyState>
		{/if}
	</section>
</div>
