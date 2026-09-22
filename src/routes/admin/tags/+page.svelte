<script lang="ts">
	import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { page as pageState } from '$app/state';
	import { getBrowserSupabase } from '$lib/supabase-browser';
	import { slugify } from '$lib/admin-utils';
	import { toast } from '$lib/toast.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { formatDateID } from '$lib/data/posts';
	import { hrefWithParams } from '$lib/utils/query';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ---------- search + pagination (URL driven, filtered in Postgres) ----------
	// Seed the input once: the URL is the source of truth for the active filter,
	// and `untrack` keeps this from being treated as a reactive read of `data`.
	let searchValue = $state(untrack(() => data.q));
	/** Tag id currently being deleted (drives the row spinner). */
	let deletingId = $state<number | null>(null);

	const currentParams = () => new URLSearchParams(pageState.url.searchParams);

	/** Pagination links keep the active `q`. */
	const hrefFor = (target: number) =>
		hrefWithParams('/admin/tags', currentParams(), { page: target > 1 ? target : null });

	/** Toolbar changes always reset to page 1. */
	function navigate(updates: Record<string, string | null>) {
		goto(hrefWithParams('/admin/tags', currentParams(), { ...updates, page: null }), {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	let modalOpen = $state(false);
	let editingId = $state<number | null>(null);
	let name = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let saving = $state(false);
	let formError = $state<string | null>(null);

	function openAdd() {
		editingId = null;
		name = '';
		slug = '';
		slugTouched = false;
		formError = null;
		modalOpen = true;
	}

	function openEdit(t: { id: number; name: string; slug: string }) {
		editingId = t.id;
		name = t.name;
		slug = t.slug;
		slugTouched = true;
		formError = null;
		modalOpen = true;
	}

	async function save(e: Event) {
		e.preventDefault();
		saving = true;
		formError = null;
		const isEdit = editingId !== null;
		try {
			const label = name.trim();
			const finalSlug = (slugTouched ? slug : slugify(name)).trim() || slugify(name);
			const payload = { name: label, slug: finalSlug };
			if (!payload.name || !payload.slug) throw new Error('Nama dan slug wajib diisi.');
			const sb = getBrowserSupabase();
			const { error } = editingId
				? await sb.from('post_tags').update(payload).eq('id', editingId)
				: await sb.from('post_tags').insert(payload);
			if (error) throw error;
			modalOpen = false;
			toast.success(isEdit ? 'Tag diperbarui' : 'Tag ditambahkan', {
				description: `${label} · /${finalSlug}`
			});
			await invalidateAll();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Gagal menyimpan tag.';
			formError = message;
			toast.error(isEdit ? 'Gagal memperbarui tag' : 'Gagal menambah tag', {
				description: message
			});
		} finally {
			saving = false;
		}
	}

	async function remove(id: number, label: string) {
		if (!confirm(`Hapus tag "${label}"?`)) return;
		deletingId = id;
		try {
			const { error } = await getBrowserSupabase().from('post_tags').delete().eq('id', id);
			if (error) throw error;
			toast.success('Tag dihapus', { description: label });
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal menghapus tag', {
				description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.'
			});
		} finally {
			deletingId = null;
		}
	}
</script>

<svelte:head>
	<title>Tags | FutureFam Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AdminCard title="Tags" subtitle={`${data.total} tag · dipakai Tag Selector di form post.`}>
	{#snippet actions()}
		<button
			type="button"
			onclick={openAdd}
			class="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
		>
			<Plus class="h-4 w-4" /> Tambah
		</button>
	{/snippet}

	<!-- Search: debounced input navigates `?q=…` so filtering happens in SQL. -->
	<div class="border-b border-slate-100 px-5 py-4">
		<SearchInput
			mode="live"
			bind:value={searchValue}
			placeholder="Cari nama atau slug tag…"
			label="Cari tag"
			delay={350}
			onSearch={(term) => navigate({ q: term || null })}
			class="sm:max-w-sm"
		/>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full min-w-160 text-left text-sm">
			<thead>
				<tr class="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wider text-slate-400">
					<th class="px-5 py-3 font-bold">Name</th>
					<th class="px-5 py-3 font-bold">Slug</th>
					<th class="px-5 py-3 font-bold">Dibuat</th>
					<th class="px-5 py-3 text-right font-bold">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each data.tags as tag (tag.id)}
					<tr class="transition hover:bg-slate-50/70">
						<td class="px-5 py-3">
							<span class="block font-bold text-slate-800">{tag.name}</span>
						</td>
						<td class="whitespace-nowrap px-5 py-3">
							<span class="font-mono text-xs text-violet-700">/{tag.slug}</span>
						</td>
						<td class="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateID(tag.created_at)}</td>
						<td class="whitespace-nowrap px-5 py-3 text-right">
							<button
								type="button"
								onclick={() => openEdit(tag)}
								aria-label={`Edit ${tag.name}`}
								class="mr-1 inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-700"
							>
								<Pencil class="h-4 w-4" />
							</button>
							<button
								type="button"
								onclick={() => remove(tag.id, tag.name)}
								aria-label={`Hapus ${tag.name}`}
								disabled={deletingId === tag.id}
								class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
							>
								{#if deletingId === tag.id}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Trash2 class="h-4 w-4" />
								{/if}
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-5 py-4">
							<EmptyState
								title={data.q ? `Tidak ada tag untuk “${data.q}”.` : 'Belum ada tag.'}
								description={data.q
									? 'Coba kata kunci lain, atau buat tag baru lewat tombol “Tambah”.'
									: 'Klik “Tambah” untuk membuat tag pertama — slug dibuat otomatis dari nama.'}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<Pagination
		page={data.page}
		totalPages={data.totalPages}
		count={data.total}
		perPage={data.perPage}
		{hrefFor}
		class="border-t border-slate-100"
	/>
</AdminCard>

{#if modalOpen}
	<div class="fixed inset-0 z-50 grid place-items-center p-4">
		<!-- Backdrop is a real button: keyboard accessible, closes on click. -->
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
			aria-label="Tutup form tag"
			onclick={() => (modalOpen = false)}
		></button>
		<div
			class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="tag-modal-title"
			tabindex="-1"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 id="tag-modal-title" class="font-display text-lg font-extrabold">{editingId ? 'Edit' : 'Tambah'} Tag</h2>
				<button type="button" onclick={() => (modalOpen = false)} aria-label="Tutup" class="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100">
					<X class="h-4 w-4" />
				</button>
			</div>
			<form class="grid gap-3" onsubmit={save}>
				<label class="grid gap-1.5 text-sm font-semibold" for="tag-name">
					Name
					<input id="tag-name" bind:value={name} oninput={() => { if (!slugTouched) slug = slugify(name); }} required placeholder="Scratch" class="h-11 rounded-xl border border-slate-200 px-4 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
				</label>
				<label class="grid gap-1.5 text-sm font-semibold" for="tag-slug">
					Slug (auto)
					<input id="tag-slug" bind:value={slug} oninput={() => (slugTouched = true)} required placeholder="scratch" class="h-11 rounded-xl border border-slate-200 px-4 font-mono text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
				</label>
				{#if formError}
					<p class="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700" role="alert">{formError}</p>
				{/if}
				<button type="submit" disabled={saving} class="flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
					{#if saving}<Loader2 class="h-4 w-4 animate-spin" /> Menyimpan…{:else}Simpan{/if}
				</button>
			</form>
		</div>
	</div>
{/if}

