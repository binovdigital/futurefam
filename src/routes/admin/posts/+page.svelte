<script lang="ts">
	import { ImageOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { page as pageState } from '$app/state';
	import { getBrowserSupabase } from '$lib/supabase-browser';
	import { toast } from '$lib/toast.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import CoverFlag from '$lib/components/admin/CoverFlag.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { formatDateID } from '$lib/data/posts';
	import { hrefWithParams } from '$lib/utils/query';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusFilters = [
		{ value: 'all', label: 'Semua' },
		{ value: 'published', label: 'Published' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'archived', label: 'Archived' }
	];

	/**
	 * Live input value; the URL stays the source of truth for the filter.
	 * `untrack` reads the initial server value once — the input is then
	 * user-owned and a re-run of `load` cannot fight the typing.
	 */
	let searchValue = $state(untrack(() => data.q));
	/** Post id currently being deleted (drives the row spinner). */
	let deletingId = $state<string | null>(null);

	const currentParams = () => new URLSearchParams(pageState.url.searchParams);

	/** Pagination links keep the active `q` / `status` / `image` filters. */
	const hrefFor = (target: number) =>
		hrefWithParams('/admin/posts', currentParams(), { page: target > 1 ? target : null });

	/** Toolbar navigation: always resets to page 1. */
	function navigate(updates: Record<string, string | null>) {
		goto(hrefWithParams('/admin/posts', currentParams(), { ...updates, page: null }), {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	function catName(post: (typeof data.posts)[number]): string {
		const rel = post.post_categories as unknown as { name?: string } | { name?: string }[] | null;
		return (Array.isArray(rel) ? rel[0]?.name : rel?.name) ?? '—';
	}

	async function remove(id: string, title: string) {
		if (!confirm(`Hapus post "${title}"? Relasi tag ikut terhapus.`)) return;
		deletingId = id;
		try {
			const sb = getBrowserSupabase();
			// Clean relations first (in case there is no ON DELETE CASCADE).
			const { error: relError } = await sb
				.from('post_tag_relations')
				.delete()
				.eq('post_id', id);
			if (relError) throw relError;

			const { error } = await sb.from('posts').delete().eq('id', id);
			if (error) throw error;

			toast.success('Post dihapus', { description: title });
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal menghapus post', {
				description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.'
			});
		} finally {
			deletingId = null;
		}
	}
</script>
<svelte:head>
	<title>Posts | FutureFam Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AdminCard
	title="Posts"
	subtitle={`${data.total} post${data.q ? ` cocok dengan “${data.q}”` : ''} · halaman ${data.page}/${Math.max(data.totalPages, 1)}`}
>
	{#snippet actions()}
		<a
			href="/admin/posts/new"
			class="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
		>
			<Plus class="h-4 w-4" /> Post Baru
		</a>
	{/snippet}

	<!-- Toolbar: instant search (debounced) + status & image filters -->
	<div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
		<SearchInput
			action="/admin/posts"
			bind:value={searchValue}
			placeholder="Cari judul atau slug…"
			class="w-full sm:max-w-xs"
			label="Cari post"
			onSearch={(q) => navigate({ q: q || null })}
		/>

		<div class="flex flex-wrap items-center gap-2">
			<div class="flex rounded-xl border border-slate-200 p-0.5" role="group" aria-label="Filter status">
				{#each statusFilters as filter (filter.value)}
					<button
						type="button"
						onclick={() => navigate({ status: filter.value === 'all' ? null : filter.value })}
						aria-pressed={data.status === filter.value}
						class={`rounded-[10px] px-3 py-1.5 text-xs font-bold transition ${
							data.status === filter.value
								? 'bg-slate-900 text-white'
								: 'text-slate-500 hover:text-slate-800'
						}`}
					>
						{filter.label}
					</button>
				{/each}
			</div>

			<button
				type="button"
				onclick={() => navigate({ image: data.image === 'missing' ? null : 'missing' })}
				aria-pressed={data.image === 'missing'}
				title="Tampilkan hanya post tanpa cover image"
				class={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
					data.image === 'missing'
						? 'border-amber-300 bg-amber-100 text-amber-800'
						: 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-700'
				}`}
			>
				<ImageOff class="h-3.5 w-3.5" /> Tanpa Cover
			</button>
		</div>
	</div>

	{#if data.missingCover > 0 && data.image !== 'missing'}
		<p class="flex flex-wrap items-center gap-2 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
			<ImageOff class="h-4 w-4 shrink-0" />
			{data.missingCover} post belum punya cover image — penting untuk OG tag saat dibagikan.
			<button type="button" onclick={() => navigate({ image: 'missing' })} class="underline">
				Lihat
			</button>
		</p>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full min-w-200 text-left text-sm">
			<thead>
				<tr class="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wider text-slate-400">
					<th class="px-5 py-3 font-bold">Judul</th>
					<th class="px-5 py-3 font-bold">Kategori</th>
					<th class="px-5 py-3 font-bold">Status</th>
					<th class="px-5 py-3 font-bold">Tanggal</th>
					<th class="px-5 py-3 font-bold">Dilihat</th>
					<th class="px-5 py-3 text-right font-bold">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each data.posts as post (post.id)}
					{@const cat = catName(post)}
					<tr class="transition hover:bg-slate-50/70">
						<td class="max-w-96 px-5 py-3">
							<span class="flex items-center gap-2">
								<span class="truncate font-bold text-slate-800">{post.title}</span>
								{#if !post.cover_image || post.cover_image.trim() === ''}
									<CoverFlag />
								{/if}
							</span>
							<a
								href={`/post/${post.slug}`}
								target="_blank"
								rel="noopener"
								class="mt-0.5 block truncate font-mono text-xs text-teal-700 hover:underline"
							>
								/post/{post.slug}
							</a>
						</td>
						<td class="whitespace-nowrap px-5 py-3 text-slate-600">{cat}</td>
						<td class="whitespace-nowrap px-5 py-3">
							<span
								class={`rounded-full px-2.5 py-1 text-xs font-bold ${
									post.status === 'published'
										? 'bg-emerald-100 text-emerald-700'
										: post.status === 'draft'
											? 'bg-slate-100 text-slate-600'
											: 'bg-amber-100 text-amber-700'
								}`}
							>
								{post.status}
							</span>
						</td>
						<td class="whitespace-nowrap px-5 py-3 text-slate-500">
							{formatDateID(post.published_at ?? post.created_at)}
						</td>
						<td class="whitespace-nowrap px-5 py-3 text-slate-500">{post.view_count ?? 0}</td>
						<td class="whitespace-nowrap px-5 py-3 text-right">
							<a
								href={`/admin/posts/${post.id}/edit`}
								aria-label={`Edit ${post.title}`}
								class="mr-1 inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-700"
							>
								<Pencil class="h-4 w-4" />
							</a>
							<button
								type="button"
								onclick={() => remove(post.id, post.title)}
								disabled={deletingId === post.id}
								aria-label={`Hapus ${post.title}`}
								class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
							>
								{#if deletingId === post.id}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Trash2 class="h-4 w-4" />
								{/if}
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="p-0">
							<EmptyState
								title={data.q ? `Tidak ada post cocok dengan “${data.q}”.` : 'Belum ada post.'}
								description={data.q
									? 'Coba kata kunci lain, atau reset filter yang aktif.'
									: 'Mulai tulis artikel pertama untuk situs.'}
								class="rounded-none border-0"
							>
								{#snippet action()}
									{#if data.q || data.status !== 'all' || data.image === 'missing'}
										<button
											type="button"
											onclick={() => navigate({ q: null, status: null, image: null })}
											class="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:text-teal-700"
										>
											Reset filter
										</button>
									{:else}
										<a
											href="/admin/posts/new"
											class="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
										>
											Tulis Post
										</a>
									{/if}
								{/snippet}
							</EmptyState>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.totalPages > 1}
		<div class="border-t border-slate-100 p-4">
			<Pagination
				page={data.page}
				totalPages={data.totalPages}
				count={data.total}
				perPage={data.perPage}
				{hrefFor}
			/>
		</div>
	{/if}
</AdminCard>

