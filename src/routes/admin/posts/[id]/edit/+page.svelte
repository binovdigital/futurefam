<script lang="ts">
	import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { getBrowserSupabase } from '$lib/supabase-browser';
	import { toast } from '$lib/toast.svelte';
	import { slugify } from '$lib/admin-utils';
	import ImageUploader from '$lib/components/admin/ImageUploader.svelte';
	import TagSelector from '$lib/components/admin/TagSelector.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The server payload is the *initial* state only. `untrack` reads it exactly
	// once so the fields stay user-owned: a re-run of `load` must never silently
	// overwrite unsaved edits, and the snapshot must not be reactive.
	const initial = untrack(() => ({
		title: data.post.title ?? '',
		slug: data.post.slug ?? '',
		categoryId: data.post.category_id != null ? String(data.post.category_id) : '',
		tagIds: [...data.tagIds],
		coverImage: data.post.cover_image,
		excerpt: data.post.excerpt ?? '',
		content: data.post.content ?? '',
		status: data.post.status ?? 'draft',
		publishedAt: data.post.published_at
	}));

	let title = $state(initial.title);
	let slug = $state(initial.slug);
	let categoryId = $state(initial.categoryId);
	let tagIds = $state<number[]>(initial.tagIds);
	let coverImage = $state<string | null>(initial.coverImage);
	let excerpt = $state(initial.excerpt);
	let content = $state(initial.content);
	let status = $state(initial.status);
	/** Existing posts already have a hand-made slug: don't clobber it. */
	let slugTouched = $state(true);
	let saving = $state(false);
	let formError = $state<string | null>(null);
	let okMsg = $state<string | null>(null);

	const inputCls =
		'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100';
	const areaCls =
		'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

	async function save() {
		saving = true;
		formError = null;
		okMsg = null;
		try {
			const finalSlug = (slugTouched ? slug : slugify(title)).trim() || slugify(title);
			if (!title.trim() || !finalSlug) throw new Error('Judul dan slug wajib diisi.');

			const sb = getBrowserSupabase();
			const payload = {
				title: title.trim(),
				slug: finalSlug,
				excerpt: excerpt.trim() || null,
				content: content.trim() || null,
				cover_image: coverImage,
				category_id: categoryId ? Number(categoryId) : null,
				status,
				// First publish stamps the date; unpublishing clears it.
				published_at:
					status === 'published' ? (initial.publishedAt ?? new Date().toISOString()) : null,
				updated_at: new Date().toISOString()
			};

			const { error } = await sb.from('posts').update(payload).eq('id', data.post.id);
			if (error) throw error;

			// Re-sync the join table: delete + insert is the simplest reliable diff.
			const { error: deleteError } = await sb
				.from('post_tag_relations')
				.delete()
				.eq('post_id', data.post.id);
			if (deleteError) throw deleteError;

			if (tagIds.length > 0) {
				const { error: relError } = await sb
					.from('post_tag_relations')
					.insert(tagIds.map((tag_id) => ({ post_id: data.post.id, tag_id })));
				if (relError) throw relError;
			}

			okMsg = 'Perubahan tersimpan! Mengalihkan…';
			toast.success('Perubahan tersimpan', { description: title.trim() });
			setTimeout(() => goto('/admin/posts'), 600);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Gagal menyimpan perubahan.';
			formError = message;
			toast.error('Gagal memperbarui post', { description: message });
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Edit: {data.post.title} | FutureFam Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<a
	href="/admin/posts"
	class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700"
>
	<ArrowLeft class="h-4 w-4" /> Semua Post
</a>

<div class="mt-4 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="font-display text-2xl font-extrabold tracking-tight text-slate-900">Edit Post</h1>
		<p class="mt-1 font-mono text-xs text-slate-400">/{data.post.slug}</p>
	</div>
	{#if status === 'published'}
		<a
			href={`/post/${slug}`}
			target="_blank"
			rel="noopener"
			class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:text-teal-700"
		>
			<ExternalLink class="h-4 w-4" /> Lihat di situs
		</a>
	{/if}
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-3">
	<!-- Main column: text content -->
	<div class="grid content-start gap-5 lg:col-span-2">
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="edit-title">
				Judul
				<input
					id="edit-title"
					bind:value={title}
					oninput={() => {
						if (!slugTouched) slug = slugify(title);
					}}
					class={inputCls}
				/>
			</label>

			<label class="mt-3 grid gap-1.5 text-sm font-semibold text-slate-700" for="edit-slug">
				<span class="flex items-center justify-between">
					Slug
					<button
						type="button"
						onclick={() => {
							slug = slugify(title);
							slugTouched = true;
						}}
						class="text-xs font-bold text-teal-700 hover:underline"
					>
						Generate dari judul
					</button>
				</span>
				<input
					id="edit-slug"
					bind:value={slug}
					oninput={() => (slugTouched = true)}
					class={`${inputCls} font-mono`}
				/>
			</label>

			<label class="mt-3 grid gap-1.5 text-sm font-semibold text-slate-700" for="edit-excerpt">
				Excerpt
				<textarea id="edit-excerpt" bind:value={excerpt} rows="2" class={areaCls}></textarea>
			</label>
		</div>

		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="edit-content">
				Konten (HTML)
				<textarea
					id="edit-content"
					bind:value={content}
					rows="14"
					class={`${areaCls} font-mono`}
				></textarea>
			</label>
			{#if content.trim()}
				<p class="mb-1.5 mt-4 text-sm font-semibold text-slate-700">Preview</p>
				<div class="prose prose-slate max-w-none rounded-xl bg-slate-50 p-4">{@html content}</div>
			{/if}
		</div>
	</div>

	<!-- Sidebar: publishing controls -->
	<div class="grid content-start gap-5">
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="edit-status">
				Status
				<select id="edit-status" bind:value={status} class={inputCls}>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
					<option value="archived">Archived</option>
				</select>
			</label>
			<label class="mt-3 grid gap-1.5 text-sm font-semibold text-slate-700" for="edit-cat">
				Kategori
				<select id="edit-cat" bind:value={categoryId} class={inputCls}>
					<option value="">— Tanpa kategori —</option>
					{#each data.categories as cat (cat.id)}
						<option value={String(cat.id)}>{cat.name}</option>
					{/each}
				</select>
			</label>
			<div class="mt-3">
				<p class="mb-1.5 text-sm font-semibold text-slate-700">Tags</p>
				<TagSelector allTags={data.tags} bind:selected={tagIds} />
			</div>
		</div>

		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<ImageUploader bind:value={coverImage} />
		</div>

		{#if formError}
			<p class="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700" role="alert">
				{formError}
			</p>
		{/if}
		{#if okMsg}
			<p class="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700" role="status">
				{okMsg}
			</p>
		{/if}

		<button
			type="button"
			onclick={save}
			disabled={saving}
			class="flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
		>
			{#if saving}<Loader2 class="h-4 w-4 animate-spin" /> Menyimpan…{:else}Simpan Perubahan{/if}
		</button>
	</div>

</div>

