<script lang="ts">
	import { CalendarDays, Clock, Eye } from 'lucide-svelte';
	import type { PostCardData } from '$lib/types/database.types';
	import { FALLBACK_COVER, estimateReadMinutes, formatDateID } from '$lib/data/posts';

	interface Props {
		post: PostCardData;
	}

	let { post }: Props = $props();

	// Category label comes from the `post_categories` relation (SSR join).
	// Handles object, single-item array (relaxed join), or null.
	let categoryName = $derived(
		(Array.isArray(post.post_categories)
			? post.post_categories[0]?.name
			: post.post_categories?.name) ?? 'Artikel'
	);
	let cover = $derived(post.cover_image || FALLBACK_COVER);
	let dateLabel = $derived(formatDateID(post.published_at ?? post.created_at));

	const badgeColors: Record<string, string> = {
		Berita: 'bg-sky-100 text-sky-700',
		Artikel: 'bg-violet-100 text-violet-700',
		Tips: 'bg-teal-100 text-teal-700'
	};
	let badgeClass = $derived(badgeColors[categoryName] ?? 'bg-slate-100 text-slate-700');
</script>

<article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
	<a href={`/post/${post.slug}`} class="block overflow-hidden" aria-label={post.title}>
		<img
			src={cover}
			alt={post.title}
			loading="lazy"
			class="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-105"
		/>
	</a>
	<div class="flex flex-1 flex-col gap-2.5 p-5">
		<div class="flex flex-wrap items-center gap-2">
			<span class={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass}`}>
				{categoryName}
			</span>
			<span class="flex items-center gap-1 text-xs text-slate-500">
				<Clock class="h-3.5 w-3.5" /> {estimateReadMinutes(post.excerpt)} mnt
			</span>
			{#if post.view_count > 0}
				<span class="flex items-center gap-1 text-xs text-slate-400">
					<Eye class="h-3.5 w-3.5" /> {post.view_count}
				</span>
			{/if}
		</div>
		<a href={`/post/${post.slug}`}>
			<h3 class="font-display line-clamp-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-teal-700">
				{post.title}
			</h3>
		</a>
		{#if post.excerpt}
			<p class="line-clamp-2 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
		{/if}
		<p class="mt-auto flex items-center gap-1.5 pt-2 text-xs font-medium text-slate-500">
			<CalendarDays class="h-4 w-4" /> {dateLabel}
		</p>
	</div>
</article>

