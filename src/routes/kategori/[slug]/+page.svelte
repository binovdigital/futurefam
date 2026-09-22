<script lang="ts">
	import { ArrowLeft, FolderOpen, Search } from 'lucide-svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { hrefWithPage } from '$lib/utils/query';
	import { page as pageState } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const basePath = '/kategori';
	/** Keep `?q=` while only swapping the page number. */
	const hrefFor = (target: number) =>
		hrefWithPage(
			`${basePath}/${data.category.slug}`,
			new URLSearchParams(pageState.url.searchParams),
			target
		);

	/** Derived so it stays in sync if `data` re-runs (navigation/invalidation). */
	const fallbackDesc = $derived(`Kumpulan artikel pilihan di kategori ${data.category.name}.`);
</script>

<svelte:head>
	<title>{data.q
			? `${data.category.name} — “${data.q}”`
			: data.category.name}{data.page > 1 ? ` (Hal. ${data.page})` : ''} | FutureFam</title>
	<meta name="description" content={data.category.description ?? fallbackDesc} />
	<meta property="og:title" content={`${data.category.name} | FutureFam`} />
	<meta property="og:description" content={data.category.description ?? fallbackDesc} />
	<meta property="og:type" content="website" />
	<!-- Paginated / filtered views: index the canonical first page only. -->
	{#if data.q || data.page > 1}
		<meta name="robots" content="noindex, follow" />
	{/if}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
	<a
		href="/"
		class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
	>
		<ArrowLeft class="h-4 w-4" /> Beranda
	</a>

	<!-- Category header -->
	<header class="mt-6 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-10">
		<p class="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
			<FolderOpen class="h-3.5 w-3.5" /> Kategori
		</p>
		<h1 class="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
			{data.category.name}
		</h1>
		<p class="mt-2 max-w-2xl leading-relaxed text-slate-600">
			{data.category.description ?? fallbackDesc}
		</p>

		<!-- GET form: shareable `?q=` URL, works without JS. -->
		<SearchInput
			value={data.q}
			action={`${basePath}/${data.category.slug}`}
			placeholder={`Cari di ${data.category.name}…`}
			class="mt-5 w-full sm:max-w-sm"
			label={`Cari artikel di kategori ${data.category.name}`}
		/>

		<p class="mt-4 text-xs font-semibold text-slate-400" aria-live="polite">
			{#if data.q}
				{data.total} artikel cocok untuk “{data.q}”
			{:else}
				{data.total} artikel
			{/if}
		</p>
	</header>

	<!-- Posts grid: 1 col mobile, 2 tablet, 3 desktop -->
	<section aria-label={`Artikel kategori ${data.category.name}`} class="mt-8">
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
				title={data.q
					? `Tidak ada artikel cocok “${data.q}” di ${data.category.name}.`
					: 'Belum ada artikel di kategori ini.'}
				description={data.q
					? 'Coba kata kunci lain, atau lihat semua artikel di kategori ini.'
					: `Tim redaksi sedang menyiapkan konten terbaik untuk ${data.category.name}. Yuk jelajahi beranda dulu!`}
				class="bg-white"
			>
				{#snippet action()}
					{#if data.q}
						<a
							href={`${basePath}/${data.category.slug}`}
							class="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
						>
							<Search class="h-4 w-4" /> Lihat semua di kategori ini
						</a>
					{:else}
						<a
							href="/"
							class="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
						>
							<ArrowLeft class="h-4 w-4" /> Kembali ke Beranda
						</a>
					{/if}
				{/snippet}
			</EmptyState>
		{/if}
	</section>
</div>
