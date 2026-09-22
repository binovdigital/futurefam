<script lang="ts">
	/**
	 * "Image Not Set" flag.
	 *
	 * Surfaced in admin tables so the editor immediately sees which posts still
	 * lack a `cover_image` — those would render an empty `og:image` tag, which
	 * hurts social/SEO previews.
	 *
	 * `compact` renders an icon-only variant for dense tables (still exposes the
	 * full label to screen readers via `aria-label` + `title`).
	 */
	import { ImageOff } from 'lucide-svelte';

	interface Props {
		/** Raw `cover_image` value from the database. */
		value?: string | null;
		compact?: boolean;
	}

	let { value, compact = false }: Props = $props();

	/** Whitespace-only and empty strings count as "not set". */
	const isMissing = $derived(!value || value.trim() === '');
	const label = 'Gambar cover belum diatur — OG image akan kosong';
</script>

{#if isMissing}
	{#if compact}
		<span
			class="inline-grid h-6 w-6 place-items-center rounded-md border border-amber-300 bg-amber-50 text-amber-600"
			title={label}
			aria-label={label}
			role="img"
		>
			<ImageOff class="h-3.5 w-3.5" />
		</span>
	{:else}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-amber-700"
			title={label}
			role="img"
			aria-label={label}
		>
			⚠️ Image Not Set
		</span>
	{/if}
{:else}
	<span
		class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-emerald-700"
		role="img"
		aria-label="Gambar cover sudah diatur"
	>
		✓ OK
	</span>
{/if}
