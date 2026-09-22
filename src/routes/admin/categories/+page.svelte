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
	import type { PostCategory } from '$lib/types/database.types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inputCls =
		'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

	// ---------- search + pagination (URL driven, filtered in Postgres) ----------
	// Seed the input once: the URL is the source of truth for the active filter,
	// and `untrack` keeps this from being treated as a reactive read of `data`.
	let searchValue = $state(untrack(() => data.q));

	const currentParams = () => new URLSearchParams(pageState.url.searchParams);

	/** Pagination links keep the active `q`. */
	const hrefFor = (target: number) =>
		hrefWithParams('/admin/categories', currentParams(), { page: target > 1 ? target : null });

	/** Toolbar changes always reset to page 1. */
	function navigate(updates: Record<string, string | null>) {
		goto(hrefWithParams('/admin/categories', currentParams(), { ...updates, page: null }), {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	// ---------- modal state ----------
	let modalOpen = $state(false);
	let editingId = $state<number | null>(null);
	let name = $state('');
	let slug = $state('');
	let description = $state('');
	/** Once the user edits the slug manually we stop auto-generating it. */
	let slugTouched = $state(false);
	let saving = $state(false);
	let formError = $state<string | null>(null);

	function openAdd() {
		editingId = null;
		name = '';
		slug = '';
		description = '';
		slugTouched = false;
		formError = null;
		modalOpen = true;
	}

	function openEdit(cat: PostCategory) {
		editingId = cat.id;
		name = cat.name;
		slug = cat.slug;
		description = cat.description ?? '';
		slugTouched = true;
		formError = null;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		formError = null;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		formError = null;
		// Capture the id in a local so TypeScript narrows it to `number`
		// (a `$state` read is not a stable reference for control-flow analysis).
		const editId = editingId;
		const isEdit = editId !== null;
		const label = name.trim();
		try {
			const finalSlug = (slugTouched ? slug : slugify(name)).trim() || slugify(name);
			const payload = {
				name: label,
				slug: finalSlug,
				description: description.trim() || null
			};
			if (!payload.name || !payload.slug) throw new Error('Nama dan slug wajib diisi.');

			const sb = getBrowserSupabase();
			const { error } = editId !== null
				? await sb.from('post_categories').update(payload).eq('id', editId)
				: await sb.from('post_categories').insert(payload);
			if (error) throw error;

			closeModal();
			toast.success(isEdit ? 'Kategori diperbarui' : 'Kategori ditambahkan', {
				description: `${label} · /kategori/${finalSlug}`
			});
			await invalidateAll();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Gagal menyimpan kategori.';
			formError = message;
			toast.error(isEdit ? 'Gagal memperbarui kategori' : 'Gagal menambah kategori', {
				description: message
			});
		} finally {
			saving = false;
		}
	}

	async function remove(id: number, label: string) {
		if (!confirm(`Hapus kategori "${label}"?`)) return;
		try {
			const { error } = await getBrowserSupabase()
				.from('post_categories')
				.delete()
				.eq('id', id);
			if (error) throw error;
			toast.success('Kategori dihapus', { description: label });
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal menghapus kategori', {
				description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.'
			});
		}
	}
</script>
<svelte:head>
	<title>Categories | FutureFam Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AdminCard
	title="Categories"
	subtitle={data.q
		? `${data.total} hasil untuk “${data.q}” · halaman ${data.page}/${Math.max(data.totalPages, 1)}`
		: `${data.total} kategori · slug dipakai di URL /kategori/[slug].`}
>
	{#snippet actions()}
		<button
			type="button"
			onclick={openAdd}
			class="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
		>
			<Plus class="h-4 w-4" /> Tambah
		</button>
	{/snippet}

	<!-- Toolbar: debounced instant search (navigates the URL) -->
	<div class="border-b border-slate-100 px-5 py-4">
		<SearchInput
			mode="live"
			bind:value={searchValue}
			placeholder="Cari nama atau slug kategori…"
			label="Cari kategori"
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
				{#each data.categories as cat (cat.id)}
					<tr class="transition hover:bg-slate-50/70">
						<td class="max-w-80 px-5 py-3">
							<span class="block truncate font-bold text-slate-800">{cat.name}</span>
							{#if cat.description}
								<span class="mt-0.5 block truncate text-xs text-slate-400">{cat.description}</span>
							{/if}
						</td>
						<td class="whitespace-nowrap px-5 py-3">
							<a
								href={`/kategori/${cat.slug}`}
								target="_blank"
								rel="noopener"
								class="font-mono text-xs text-teal-700 hover:underline"
							>
								/kategori/{cat.slug}
							</a>
						</td>
						<td class="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateID(cat.created_at)}</td>
						<td class="whitespace-nowrap px-5 py-3 text-right">
							<button
								type="button"
								onclick={() => openEdit(cat)}
								aria-label={`Edit ${cat.name}`}
								class="mr-1 inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-700"
							>
								<Pencil class="h-4 w-4" />
							</button>
							<button
								type="button"
								onclick={() => remove(cat.id, cat.name)}
								aria-label={`Hapus ${cat.name}`}
								class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-5 py-6">
							<EmptyState
								title={data.q ? `Tidak ada kategori cocok “${data.q}”.` : 'Belum ada kategori.'}
								description={data.q
									? 'Coba kata kunci lain, atau kosongkan pencarian untuk melihat semuanya.'
									: 'Klik “Tambah” untuk membuat kategori pertama.'}
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
		label="Navigation kategori"
	/>

</AdminCard>

{#if modalOpen}
	<div class="fixed inset-0 z-50 grid place-items-center p-4">
		<!-- Backdrop is a real button: keyboard accessible and closes on click. -->
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
			aria-label="Tutup form kategori"
			onclick={closeModal}
		></button>
		<div
			class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="cat-modal-title"
			tabindex="-1"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 id="cat-modal-title" class="font-display text-lg font-extrabold text-slate-900">
					{editingId ? 'Edit' : 'Tambah'} Kategori
				</h2>
				<button
					type="button"
					onclick={closeModal}
					aria-label="Tutup"
					class="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<form class="grid gap-3" onsubmit={save}>
				<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="cat-name">
					Name
					<input
						id="cat-name"
						bind:value={name}
						oninput={() => {
							if (!slugTouched) slug = slugify(name);
						}}
						required
						placeholder="Coding Anak"
						class={inputCls}
					/>
				</label>

				<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="cat-slug">
					Slug (auto)
					<input
						id="cat-slug"
						bind:value={slug}
						oninput={() => (slugTouched = true)}
						required
						placeholder="coding-anak"
						class={`${inputCls} font-mono`}
					/>
				</label>
				{#if slug}
					<p class="-mt-1 font-mono text-xs text-slate-400">Preview URL: /kategori/{slug}</p>
				{/if}

				<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="cat-desc">
					Description
					<textarea
						id="cat-desc"
						bind:value={description}
						rows="3"
						placeholder="Belajar coding seru untuk anak usia 6-12 tahun…"
						class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
					></textarea>
				</label>

				{#if formError}
					<p class="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700" role="alert">
						{formError}
					</p>
				{/if}

				<div class="mt-1 flex gap-2">
					<button
						type="button"
						onclick={closeModal}
						class="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={saving}
						class="flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
					>
						{#if saving}<Loader2 class="h-4 w-4 animate-spin" /> Menyimpan…{:else}Simpan{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

