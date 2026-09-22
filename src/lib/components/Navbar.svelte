<script lang="ts">
	import { Menu, Search, X } from 'lucide-svelte';
	import { TOP_CATEGORY_LINKS } from '$lib/data/navigation';

	let mobileOpen = $state(false);

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}
</script>

<nav class="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur" aria-label="Navigasi utama">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
		<a href="/" class="flex shrink-0 items-center gap-2" aria-label="FutureFam beranda">
			<span class="font-display grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-lg font-extrabold text-white">F</span>
			<span class="font-display text-xl font-extrabold tracking-tight text-slate-900">
				Future<span class="text-teal-600">Fam</span>
			</span>
		</a>

		<!-- Desktop: flat top-5 category links -->
		<div class="hidden items-center gap-1 lg:flex">
			{#each TOP_CATEGORY_LINKS as link (link.slug)}
				<a
					href={link.href}
					class="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<!-- Search entry point: navigates to the dedicated /cari page (?q=...) -->
			<a
				href="/cari"
				aria-label="Cari artikel"
				class="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
			>
				<Search class="h-5 w-5" />
			</a>
			<button
				type="button"
				onclick={toggleMobile}
				aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
				aria-expanded={mobileOpen}
				class="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 lg:hidden"
			>
				{#if mobileOpen}<X class="h-5 w-5" />{:else}<Menu class="h-5 w-5" />{/if}
			</button>
		</div>
	</div>

	<!-- Mobile: flat stacked links (same 5 categories) -->
	{#if mobileOpen}
		<div class="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
			{#each TOP_CATEGORY_LINKS as link (link.slug)}
				<a
					href={link.href}
					onclick={() => (mobileOpen = false)}
					class="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
				>
					{link.label}
				</a>
			{/each}
			<a
				href="/cari"
				onclick={() => (mobileOpen = false)}
				class="mt-1 flex items-center gap-2 rounded-xl border-t border-slate-100 px-3 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
			>
				<Search class="h-4 w-4" /> Cari &amp; Arsip Artikel
			</a>
		</div>
	{/if}
</nav>

