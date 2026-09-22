<script lang="ts">
	/**
	 * Toast viewport — mounted once in `+layout.svelte`.
	 * Renders the shared `toast` store; no props needed.
	 */
	import { fly } from 'svelte/transition';
	import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-svelte';
	import { toast, type ToastKind } from '$lib/toast.svelte';

	/** Icon + colour per kind (kept in sync with `ToastKind`). */
	const styles: Record<ToastKind, { ring: string; icon: typeof Info; tint: string }> = {
		success: { ring: 'border-emerald-200', icon: CheckCircle2, tint: 'text-emerald-600' },
		error: { ring: 'border-rose-200', icon: AlertTriangle, tint: 'text-rose-600' },
		info: { ring: 'border-slate-200', icon: Info, tint: 'text-slate-500' }
	};
</script>

<!--
	Live region: `aria-live="polite"` announces success/info, while errors are
	visually distinct. `pointer-events-none` on the wrapper keeps the page
	clickable around the stack; each card re-enables pointer events.
-->
<div
	class="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
	aria-live="polite"
	aria-atomic="false"
>
	{#each toast.items as item (item.id)}
		{@const Icon = styles[item.kind].icon}
		<div
			class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white/95 p-3.5 shadow-lg shadow-slate-900/5 backdrop-blur {styles[
				item.kind
			].ring}"
			role={item.kind === 'error' ? 'alert' : 'status'}
			transition:fly={{ y: 12, duration: 220 }}
		>
			<Icon class="mt-0.5 h-5 w-5 shrink-0 {styles[item.kind].tint}" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-bold text-slate-800">{item.message}</p>
				{#if item.description}
					<p class="mt-0.5 text-xs leading-relaxed break-words text-slate-500">{item.description}</p>
				{/if}
			</div>
			<button
				type="button"
				onclick={() => toast.dismiss(item.id)}
				aria-label="Tutup notifikasi"
				class="-mr-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
			>
				<X class="h-3.5 w-3.5" />
			</button>
		</div>
	{/each}
</div>
