<script lang="ts">
	import { FileText, FolderOpen, Plus, Tags } from 'lucide-svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import { formatDateID } from '$lib/data/posts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let totalPosts = $derived(data.stats.posts);
	let totalCategories = $derived(data.stats.categories);
	let totalTags = $derived(data.stats.tags);

	const cards = $derived([
		{ label: 'Total Posts', value: totalPosts, icon: FileText, href: '/admin/posts', tint: 'bg-sky-100 text-sky-700' },
		{ label: 'Categories', value: totalCategories, icon: FolderOpen, href: '/admin/categories', tint: 'bg-teal-100 text-teal-700' },
		{ label: 'Tags', value: totalTags, icon: Tags, href: '/admin/tags', tint: 'bg-violet-100 text-violet-700' }
	]);
</script>

<svelte:head>
	<title>Dashboard | FutureFam Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="font-display text-2xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
		<p class="mt-1 text-sm text-slate-500">Ringkasan konten futurefam.web.id hari ini.</p>
	</div>
	<a
		href="/admin/posts/new"
		class="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
	>
		<Plus class="h-4 w-4" /> Tulis Post
	</a>
</div>

<div class="grid gap-4 sm:grid-cols-3">
	{#each cards as card (card.label)}
		<a
			href={card.href}
			class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<span class={`grid h-12 w-12 place-items-center rounded-2xl ${card.tint}`}>
				<card.icon class="h-6 w-6" />
			</span>
			<span>
				<span class="font-display block text-2xl font-extrabold text-slate-900">{card.value}</span>
				<span class="text-sm font-medium text-slate-500">{card.label}</span>
			</span>
		</a>
	{/each}
</div>

<AdminCard title="Post terbaru" subtitle="5 post dengan created_at paling baru.">
	<ul class="divide-y divide-slate-100">
		{#each data.latest as post (post.id)}
			<li class="flex items-center justify-between gap-3 px-5 py-3.5">
				<div class="min-w-0">
					<a href={`/admin/posts/${post.id}/edit`} class="block truncate text-sm font-bold text-slate-800 hover:text-teal-700">
						{post.title}
					</a>
					<p class="mt-0.5 text-xs text-slate-400">
						{Array.isArray(post.post_categories) ? post.post_categories[0]?.name : post.post_categories?.name ?? '—'}
						· {formatDateID(post.published_at ?? post.created_at)}
					</p>
				</div>
				<span class={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
					{post.status}
				</span>
			</li>
		{:else}
			<li class="px-5 py-8 text-center text-sm text-slate-400">Belum ada post. Klik “Tulis Post”.</li>
		{/each}
	</ul>
</AdminCard>
