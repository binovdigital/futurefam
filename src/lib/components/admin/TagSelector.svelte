<script lang="ts">
	import { Plus, Tag as TagIcon, X } from 'lucide-svelte';
	import type { PostTag } from '$lib/types/database.types';

	interface Props {
		/** All available tags (from post_tags). */
		allTags: PostTag[];
		/** Selected tag IDs (bindable). */
		selected?: number[];
		placeholder?: string;
	}

	let { allTags, selected = $bindable<number[]>([]), placeholder = 'Ketik untuk tambah tag…' }: Props = $props();

	let query = $state('');

	let suggestions = $derived(
		query.trim()
			? allTags
					.filter(
						(t) =>
							!selected.includes(t.id) &&
							(t.name.toLowerCase().includes(query.toLowerCase()) ||
								t.slug.toLowerCase().includes(query.toLowerCase()))
					)
					.slice(0, 6)
			: allTags.filter((t) => !selected.includes(t.id)).slice(0, 8)
	);

	let selectedTags = $derived(allTags.filter((t) => selected.includes(t.id)));

	function toggle(id: number) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
	}

	function addByQuery() {
		const q = query.trim().toLowerCase();
		if (!q) return;
		// Exact match on name/slug selects existing; otherwise caller creates via admin.
		const found = allTags.find(
			(t) => t.name.toLowerCase() === q || t.slug.toLowerCase() === q
		);
		if (found && !selected.includes(found.id)) selected = [...selected, found.id];
		query = '';
	}
</script>

<div>
	{#if selectedTags.length > 0}
		<ul class="mb-2 flex flex-wrap gap-2" aria-label="Tag terpilih">
			{#each selectedTags as tag (tag.id)}
				<li class="flex items-center gap-1.5 rounded-full bg-teal-100 py-1 pl-3 pr-1.5 text-xs font-bold text-teal-800">
					<TagIcon class="h-3 w-3" /> {tag.name}
					<button
						type="button"
						onclick={() => toggle(tag.id)}
						aria-label={`Hapus tag ${tag.name}`}
						class="grid h-5 w-5 place-items-center rounded-full hover:bg-teal-200"
					>
						<X class="h-3 w-3" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="relative">
		<input
			type="text"
			bind:value={query}
			{placeholder}
			aria-label="Cari atau pilih tag"
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					if (suggestions.length === 1) toggle(suggestions[0].id);
					else addByQuery();
				}
			}}
			class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
		/>
		{#if query.trim() || suggestions.length > 0}
			<ul class="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="listbox" aria-label="Saran tag">
				{#each suggestions as tag (tag.id)}
					<li>
						<button
							type="button"
							role="option"
							aria-selected={selected.includes(tag.id)}
							onclick={() => {
								toggle(tag.id);
								query = '';
							}}
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-teal-50"
						>
							<Plus class="h-3.5 w-3.5 text-teal-600" /> {tag.name}
							<span class="ml-auto text-xs text-slate-400">/{tag.slug}</span>
						</button>
					</li>
				{/each}
				{#if suggestions.length === 0}
					<li class="px-3 py-2 text-xs text-slate-400">
						Tidak ada tag cocok. Buat dulu di halaman Tags.
					</li>
				{/if}
			</ul>
		{/if}
	</div>
	<p class="mt-1.5 text-xs text-slate-400">{selected.length} tag dipilih · tersimpan ke post_tag_relations.</p>
</div>
