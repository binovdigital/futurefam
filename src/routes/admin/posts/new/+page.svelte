<script lang="ts">
	import { ArrowLeft, Loader2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getBrowserSupabase } from '$lib/supabase-browser';
	import { toast } from '$lib/toast.svelte';
	import { slugify } from '$lib/admin-utils';
	import ImageUploader from '$lib/components/admin/ImageUploader.svelte';
	import TagSelector from '$lib/components/admin/TagSelector.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let title = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let categoryId = $state<string>('');
	let tagIds = $state<number[]>([]);
	let coverImage = $state<string | null>(null);
	let excerpt = $state('');
	let content = $state('');
	let status = $state('draft');
	let saving = $state(false);
	let formError = $state<string | null>(null);
	let okMsg = $state<string | null>(null);

	const inputCls =
		'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

	async function save() {
		saving = true;
		formError = null;
		okMsg = null;
		try {
			const finalSlug = (slugTouched ? slug : slugify(title)).trim() || slugify(title);
			if (!title.trim() || !finalSlug) throw new Error('Judul dan slug wajib diisi.');
			const sb = getBrowserSupabase();
			const { data: userData } = await sb.auth.getUser();
			const payload = {
				title: title.trim(),
				slug: finalSlug,
				excerpt: excerpt.trim() || null,
				content: content.trim() || null,
				cover_image: coverImage,
				category_id: categoryId ? Number(categoryId) : null,
				author_id: userData.user?.id ?? null,
				status,
				published_at: status === 'published' ? new Date().toISOString() : null
			};
			const { data: inserted, error } = await sb.from('posts').insert(payload).select('id').single();
			if (error) throw error;
			if (tagIds.length > 0) {
				const { error: relError } = await sb
					.from('post_tag_relations')
					.insert(tagIds.map((tag_id) => ({ post_id: inserted.id, tag_id })));
				if (relError) throw relError;
			}
			okMsg = 'Post tersimpan! Mengalihkan…';
			toast.success(status === 'published' ? 'Post berhasil dipublikasikan' : 'Draft tersimpan', {
				description: title.trim()
			});
			setTimeout(() => goto('/admin/posts'), 600);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Gagal menyimpan post.';
			formError = message;
			toast.error('Gagal menyimpan post', { description: message });
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Post Baru | FutureFam Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<a href="/admin/posts" class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:text-teal-700">
	<ArrowLeft class="h-4 w-4" /> Semua Post
</a>

<h1 class="font-display mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Post Baru</h1>
<p class="mt-1 text-sm text-slate-500">Tulis, beri kategori + tag, unggah cover, lalu terbitkan.</p>

<div class="mt-6 grid gap-6 lg:grid-cols-3">
	<div class="grid content-start gap-5 lg:col-span-2">
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label class="grid gap-1.5 text-sm font-semibold" for="post-title">
				Judul
				<input id="post-title" bind:value={title} oninput={() => { if (!slugTouched) slug = slugify(title); }} placeholder="7 Cara Seru Belajar Coding" class={inputCls} />
			</label>
			<label class="mt-3 grid gap-1.5 text-sm font-semibold" for="post-slug">
				Slug (auto)
				<input id="post-slug" bind:value={slug} oninput={() => (slugTouched = true)} placeholder="7-cara-seru-belajar-coding" class={`${inputCls} font-mono`} />
			</label>
			<label class="mt-3 grid gap-1.5 text-sm font-semibold" for="post-excerpt">
				Excerpt
				<textarea id="post-excerpt" bind:value={excerpt} rows="2" placeholder="Ringkasan 1-2 kalimat…" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"></textarea>
			</label>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label class="grid gap-1.5 text-sm font-semibold" for="post-content">
				Konten (HTML)
				<textarea id="post-content" bind:value={content} rows="12" placeholder="<p>Paragraf pembuka…</p>" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"></textarea>
			</label>
			{#if content.trim()}
				<p class="mb-1.5 mt-4 text-sm font-semibold text-slate-700">Preview</p>
				<div class="prose prose-slate max-w-none rounded-xl bg-slate-50 p-4">{@html content}</div>
			{/if}
		</div>
	</div>
	<div class="grid content-start gap-5">
		<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<label class="grid gap-1.5 text-sm font-semibold" for="post-cat">
				Kategori
				<select id="post-cat" bind:value={categoryId} class={inputCls}>
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
			<p class="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700" role="alert">{formError}</p>
		{/if}
		{#if okMsg}
			<p class="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700" role="status">{okMsg}</p>
		{/if}
		<button type="button" onclick={save} disabled={saving} class="flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60">
			{#if saving}<Loader2 class="h-4 w-4 animate-spin" /> Menyimpan…{:else}Simpan Post{/if}
		</button>
	</div>
</div>
