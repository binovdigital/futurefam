<script lang="ts">
	import { ArrowLeft, CalendarDays, Clock, Eye, Tag } from 'lucide-svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import ShareButtons from '$lib/components/ShareButtons.svelte';
	import { FALLBACK_COVER, estimateReadMinutes, formatDateID } from '$lib/data/posts';
	import type { PageData } from './$types';

	// Post detail data comes from `+page.server.ts` (Supabase SSR, mock fallback).
	let { data }: { data: PageData } = $props();
	let post = $derived(data.post);
	let categoryName = $derived(
		(Array.isArray(post.post_categories)
			? post.post_categories[0]?.name
			: post.post_categories?.name) ?? 'Artikel'
	);
	let cover = $derived(post.cover_image || FALLBACK_COVER);
	let dateLabel = $derived(formatDateID(post.published_at ?? post.created_at));
	let excerptText = $derived(post.excerpt ?? post.title);
</script>

<svelte:head>
	<title>{post.title} | FutureFam</title>
	<meta name="description" content={excerptText} />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={excerptText} />
	<meta property="og:image" content={cover} />
	<meta property="og:type" content="article" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">
	<a
		href="/"
		class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
	>
		<ArrowLeft class="h-4 w-4" /> Kembali
	</a>

	<article class="mt-6">
		<header>
			<p class="flex flex-wrap items-center gap-2">
				<span class="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
					{categoryName}
				</span>
				<span class="flex items-center gap-1 text-xs font-medium text-slate-500">
					<CalendarDays class="h-3.5 w-3.5" /> {dateLabel}
				</span>
				<span class="flex items-center gap-1 text-xs font-medium text-slate-500">
					<Clock class="h-3.5 w-3.5" /> {estimateReadMinutes(post.content)} mnt baca
				</span>
				{#if post.view_count > 0}
					<span class="flex items-center gap-1 text-xs font-medium text-slate-400">
						<Eye class="h-3.5 w-3.5" /> {post.view_count} dibaca
					</span>
				{/if}
			</p>
			<h1 class="font-display mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
				{post.title}
			</h1>
			{#if post.excerpt}
				<p class="mt-3 text-base leading-relaxed text-slate-600">{post.excerpt}</p>
			{/if}

			{#if data.tags.length > 0}
				<ul class="mt-4 flex flex-wrap gap-2" aria-label="Tag artikel">
					{#each data.tags as tag (tag.id)}
						<li
							class="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
						>
							<Tag class="h-3.5 w-3.5 text-teal-600" /> {tag.name}
						</li>
					{/each}
				</ul>
			{/if}

			<div class="mt-5 border-y border-slate-200 py-4">
				<div class="flex items-center gap-3">
					<span class="font-display grid h-11 w-11 place-items-center rounded-full bg-teal-600 text-sm font-extrabold text-white">
						{categoryName.charAt(0)}
					</span>
					<div>
						<p class="text-sm font-bold text-slate-900">Redaksi FutureFam</p>
						<p class="text-xs text-slate-500">{categoryName} · {dateLabel}</p>
					</div>
				</div>
				<!-- Social share: WhatsApp / Facebook / X / Copy Link -->
				<div class="mt-4">
					<ShareButtons url={`https://futurefam.web.id/post/${post.slug}`} title={post.title} excerpt={post.excerpt} />
				</div>
			</div>
		</header>

		<figure class="mt-6">
			<img
				src={cover}
				alt={post.title}
				class="aspect-[16/9] w-full rounded-2xl object-cover shadow-sm"
			/>
		</figure>

		<div class="prose prose-slate prose-headings:font-display prose-a:text-teal-700 mt-8 max-w-none lg:prose-lg">
			{@html post.content ?? '<p>Konten belum tersedia.</p>'}
		</div>
	</article>

	<section aria-labelledby="related-heading" class="mt-12 border-t border-slate-200 pt-8">
		<h2 id="related-heading" class="font-display text-xl font-extrabold text-slate-900">
			Baca juga
		</h2>
		<div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.related as rel (rel.id)}
				<ArticleCard post={rel} />
			{/each}
		</div>
	</section>
</div>

<div class="h-12"></div>
