<script lang="ts">
	import { Check, Link2 } from 'lucide-svelte';

	interface Props {
		/** Absolute canonical URL of the post (passed from page for SSR-safe sharing). */
		url: string;
		title: string;
		excerpt?: string | null;
	}

	let { url, title, excerpt }: Props = $props();

	let copied = $state(false);

	// Encode once per render for safe `href` sharing links.
	let text = $derived(`${title}${excerpt ? ` — ${excerpt}` : ''}`);
	let waHref = $derived(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`);
	let fbHref = $derived(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
	let xHref = $derived(
		`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
	);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			copied = false;
		}
	}
</script>

<div class="flex flex-wrap items-center gap-2" aria-label="Bagikan artikel">
	<span class="mr-1 text-xs font-bold uppercase tracking-widest text-slate-400">Bagikan</span>
	<a
		href={waHref}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-600"
		aria-label="Bagikan ke WhatsApp"
	>
		WhatsApp
	</a>
	<a
		href={fbHref}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
		aria-label="Bagikan ke Facebook"
	>
		Facebook
	</a>
	<a
		href={xHref}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
		aria-label="Bagikan ke X (Twitter)"
	>
		X
	</a>
	<button
		type="button"
		onclick={copyLink}
		class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
		aria-label="Salin tautan artikel"
		aria-live="polite"
	>
		{#if copied}
			<Check class="h-3.5 w-3.5" />
			Tersalin!
		{:else}
			<Link2 class="h-3.5 w-3.5" /> Salin Link
		{/if}
	</button>
</div>
