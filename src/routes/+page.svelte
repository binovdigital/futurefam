<script lang="ts">
	import { ArrowRight, CalendarDays, Clock, Database, Eye, Sparkles } from 'lucide-svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import ArticleListItem from '$lib/components/ArticleListItem.svelte';
	import SectionHeading from '$lib/components/SectionHeading.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { FALLBACK_COVER, estimateReadMinutes, formatDateID } from '$lib/data/posts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/** Suggested keywords under the homepage search bar. */
	const quickTerms = ['coding anak', 'robotika', 'AI', 'pola asuh', 'sains'];

	let heroMain = $derived(data.hero.main);
	let heroSide = $derived(data.hero.side);
	let heroCover = $derived(heroMain.cover_image || FALLBACK_COVER);
	let heroCategory = $derived(
		(Array.isArray(heroMain.post_categories)
			? heroMain.post_categories[0]?.name
			: heroMain.post_categories?.name) ?? 'Artikel'
	);
</script>

<svelte:head>
	<title>FutureFam — Berita, Artikel & Tips Keluarga Terpercaya</title>
	<meta
		name="description"
		content="FutureFam: Future Skills anak (coding, robotika, sains), parenting, tech insight, dan kabar inspirasi untuk keluarga Indonesia."
	/>
	<meta property="og:title" content="FutureFam — Siapkan Keluarga untuk Masa Depan" />
	<meta property="og:type" content="website" />
</svelte:head>

{#if data.dataSource === 'mock'}
	<div class="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
		<p class="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800" role="status">
			<Database class="h-4 w-4 shrink-0" />
			<span>Mode pratinjau mock — {data.loadError ?? 'isi tabel posts / cek RLS.'}</span>
		</p>
	</div>
{/if}

<!-- SEARCH: submits to /cari, which filters title/excerpt/content via .ilike() -->
<section aria-label="Pencarian artikel" class="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
	<div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="lg:max-w-md">
				<h2 class="font-display text-lg font-extrabold text-slate-900">Cari artikel &amp; tips</h2>
				<p class="mt-1 text-sm leading-relaxed text-slate-500">
					Telusuri judul dan isi artikel — misalnya “robotika” atau “screen time”.
				</p>
			</div>
			<SearchInput
				action="/cari"
				placeholder="Cari: coding anak, AI, pola asuh…"
				class="w-full lg:max-w-sm"
				label="Cari artikel"
			/>
		</div>
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<span class="text-xs font-bold text-slate-400">Populer:</span>
			{#each quickTerms as term (term)}
				<a
					href={`/cari?q=${encodeURIComponent(term)}`}
					class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
				>
					{term}
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- HERO: 1 large + 2 small -->
<header class="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10" aria-label="Sorotan utama">
	<div class="grid gap-5 lg:grid-cols-3">
		<article class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
			<a href={`/post/${heroMain.slug}`} class="relative block min-h-72 overflow-hidden sm:min-h-96" aria-label={heroMain.title}>
				<img src={heroCover} alt={heroMain.title} class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
				<span class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"></span>
				<span class="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow">
					<Sparkles class="h-3.5 w-3.5" /> Sorotan
				</span>
				<span class="absolute inset-x-0 bottom-0 block p-5 sm:p-7">
					<span class="flex flex-wrap items-center gap-2 text-xs font-bold">
						<span class="rounded-full bg-white/95 px-3 py-1 text-teal-700">{heroCategory}</span>
						<span class="flex items-center gap-1 font-medium text-white/85">
							<CalendarDays class="h-3.5 w-3.5" /> {formatDateID(heroMain.published_at ?? heroMain.created_at)}
						</span>
						<span class="flex items-center gap-1 font-medium text-white/85">
							<Clock class="h-3.5 w-3.5" /> {estimateReadMinutes(heroMain.excerpt)} mnt
						</span>
					</span>
					<span class="font-display mt-2 block text-2xl font-extrabold leading-tight text-white sm:text-3xl">
						{heroMain.title}
					</span>
					{#if heroMain.excerpt}
						<span class="mt-1 line-clamp-2 block text-sm text-white/80">{heroMain.excerpt}</span>
					{/if}
				</span>
			</a>
		</article>

		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-1" aria-label="Sorotan lainnya">
			{#each heroSide as post (post.id)}
				{@const cover = post.cover_image || FALLBACK_COVER}
				{@const cat =
					(Array.isArray(post.post_categories)
						? post.post_categories[0]?.name
						: post.post_categories?.name) ?? 'Artikel'}
				<article class="group relative min-h-56 overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
					<a href={`/post/${post.slug}`} class="absolute inset-0" aria-label={post.title}>
						<img src={cover} alt={post.title} loading="lazy" class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
						<span class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"></span>
						<span class="absolute inset-x-0 bottom-0 block p-5">
							<span class="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-teal-700">{cat}</span>
							<span class="font-display mt-1.5 line-clamp-2 block text-base font-bold leading-snug text-white">
								{post.title}
							</span>
						</span>
					</a>
				</article>
			{/each}
		</div>
	</div>
</header>

<!-- JALUR MASA DEPAN horizontal scroll -->
<section id="future-skills" aria-labelledby="future-heading" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
	<SectionHeading
		kicker="Future Skills"
		title="Jalur Masa Depan"
		description="Coding, robotika, sains, matematika, astronomi — bekal praktis anak menghadapi 2030."
		id="future-heading"
	/>
	<div class="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
		{#each data.future as post (post.id)}
			<div class="w-72 shrink-0 snap-start sm:w-80">
				<ArticleCard {post} />
			</div>
		{/each}
	</div>
</section>


<!-- ZONA ORANG TUA: list + sidebar -->
<section id="parenting" aria-labelledby="parenting-heading" class="scroll-mt-20 border-y border-teal-100 bg-teal-50/60">
	<div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
		<SectionHeading
			kicker="Parenting"
			title="Zona Orang Tua"
			description="Digital parenting, psikologi, keuangan keluarga, dan special needs."
			id="parenting-heading"
		/>
		<div class="grid gap-8 lg:grid-cols-3">
			<div class="grid content-start gap-4 lg:col-span-2" role="list" aria-label="Artikel parenting">
				{#each data.parenting.list as post (post.id)}
					<div role="listitem">
						<ArticleListItem {post} />
					</div>
				{/each}
			</div>
			<aside class="space-y-5" aria-label="Sidebar parenting">
				<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<h3 class="font-display text-base font-extrabold text-slate-900">Terpopuler</h3>
					<ol class="mt-4 space-y-4">
						{#each data.parenting.popular as post, i (post.id)}
							<li class="flex items-start gap-3">
								<span class="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500">
									{i + 1}
								</span>
								<div class="min-w-0">
									<a href={`/post/${post.slug}`} class="font-display line-clamp-2 text-sm font-bold leading-snug text-slate-800 hover:text-teal-700">
										{post.title}
									</a>
									<p class="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
										<Eye class="h-3 w-3" /> {post.view_count > 0 ? `${post.view_count} dibaca` : formatDateID(post.published_at ?? post.created_at)}
									</p>
								</div>
							</li>
						{/each}
					</ol>
				</div>
				<div class="overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
					<p class="text-xs font-bold uppercase tracking-widest text-teal-300">Event & Buku</p>
					<h3 class="font-display mt-1 text-lg font-extrabold">Webinar: Anak Aman di Era AI</h3>
					<p class="mt-1 text-xs leading-relaxed text-slate-300">Sabtu, 19 Okt 2026 · 09.00 WIB · Gratis via Zoom.</p>
					<a href="#parenting" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-xs font-bold text-white hover:bg-teal-400">
						Daftar Sekarang <ArrowRight class="h-3.5 w-3.5" />
					</a>
				</div>
			</aside>
		</div>
	</div>
</section>

<!-- EKSPLORASI TEKNOLOGI grid -->
<section id="tech" aria-labelledby="tech-heading" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
	<SectionHeading
		kicker="Tech & Insight"
		title="Eksplorasi Teknologi"
		description="AI, web dev, game dev, dan cyber security — bahasa keluarga."
		id="tech-heading"
	/>
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each data.techGrid as post (post.id)}
			<ArticleCard {post} />
		{/each}
	</div>
</section>

{#if data.kabarList.length > 0}
	<section id="kabar" aria-labelledby="kabar-heading" class="mx-auto max-w-6xl scroll-mt-20 px-4 pb-10 sm:px-6">
		<SectionHeading
			kicker="Kabar & Inspirasi"
			title="Kabar & Inspirasi"
			description="Berita, opini, event, dan review pilihan redaksi."
			id="kabar-heading"
		/>
		<div class="grid gap-4 md:grid-cols-2">
			{#each data.kabarList as post (post.id)}
				<ArticleListItem {post} />
			{/each}
		</div>
	</section>
{/if}

<!-- Newsletter CTA -->
<section aria-label="Berlangganan" class="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
	<div class="rounded-3xl bg-slate-900 p-6 text-center sm:p-10">
		<h2 class="font-display text-xl font-extrabold text-white sm:text-2xl">
			Dapatkan tips keluarga tiap Minggu pagi
		</h2>
		<p class="mx-auto mt-2 max-w-md text-sm text-slate-300">
			Gratis, tanpa spam. Ringkasan Future Skills + Parenting ke email Ayah Bunda.
		</p>
		<form class="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row" onsubmit={(e) => e.preventDefault()}>
			<label for="newsletter-email" class="sr-only">Alamat email</label>
			<input
				id="newsletter-email"
				type="email"
				required
				placeholder="nama@email.com"
				autocomplete="email"
				class="h-11 flex-1 rounded-full border border-slate-700 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
			/>
			<button
				type="submit"
				class="h-11 rounded-full bg-teal-500 px-6 text-sm font-bold text-white transition hover:bg-teal-400"
			>
				Langganan
			</button>
		</form>
	</div>
</section>


