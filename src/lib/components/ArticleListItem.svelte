<script lang="ts">
	import { ArrowRight, CalendarDays, Clock, Eye } from 'lucide-svelte';
	import type { PostCardData } from '$lib/types/database.types';
	import { FALLBACK_COVER, estimateReadMinutes, formatDateID } from '$lib/data/posts';

	interface Props {
		post: PostCardData;
	}

	let { post }: Props = $props();

	let categoryName = $derived(
		(Array.isArray(post.post_categories) ? post.post_categories[0]?.name : post.post_categories?.name) ??
			'Artikel'
	);
	let cover = $derived(post.cover_image || FALLBACK_COVER);
	let dateLabel = $derived(formatDateID(post.published_at ?? post.created_at));
</script>

<article class="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
	<a
		href={`/post/${post.slug}`}
		class="block h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-40"
		aria-label={post.title}
	>
		<img
			src={cover}
			alt={post.title}
			loading="lazy"
			class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
		/>
	</a>
	<div class="flex min-w-0 flex-1 flex-col gap-1">
		<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
			<span class="rounded-full bg-teal-100 px-2.5 py-0.5 text-teal-700">{categoryName}</span>
			<span class="flex items-center gap-1 font-medium text-slate-400">
				<CalendarDays class="h-3 w-3" /> {dateLabel}
			</span>
		</p>
		<a href={`/post/${post.slug}`} class="min-w-0">
			<h3 class="font-display line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-teal-700 sm:text-base">
				{post.title}
			</h3>
		</a>
		{#if post.excerpt}
			<p class="line-clamp-1 hidden text-xs text-slate-500 sm:block">{post.excerpt}</p>
		{/if}
		<p class="flex items-center gap-2 text-[11px] font-medium text-slate-400">
			<span class="flex items-center gap-1"><Clock class="h-3 w-3" /> {estimateReadMinutes(post.excerpt)} mnt</span>
			{#if post.view_count > 0}
				<span class="flex items-center gap-1"><Eye class="h-3 w-3" /> {post.view_count}</span>
			{/if}
			<span class="ml-auto hidden items-center gap-1 font-bold text-teal-700 sm:flex">
				Baca <ArrowRight class="h-3 w-3" />
			</span>
		</p>
	</div>
</article>
