<script lang="ts">
	/**
	 * Reusable search box.
	 *
	 * Two modes:
	 * - "form"  : plain `<form method="get">` → works without JS, full page load
	 *             (`?q=...`), ideal for public pages which must stay shareable.
	 * - "live"  : debounced input that calls `onInput(value)` → instant filtering
	 *             for admin tables (client-side, no round trip).
	 */
	import { Loader2, Search, X } from 'lucide-svelte';

	interface Props {
		/** Current value (bindable in live mode). */
		value?: string;
		placeholder?: string;
		/** Query-string key used in form mode. */
		name?: string;
		/** URL the form submits to; omit for the current page. */
		action?: string;
		mode?: 'form' | 'live';
		/** Called with the debounced value in live mode (client-side filter). */
		onInput?: (value: string) => void;
		/**
		 * Called with the debounced value in ANY mode — used by the admin
		 * tables to navigate (`?q=…`) so filtering happens in Postgres.
		 */
		onSearch?: (value: string) => void;
		/** Debounce in ms for `onSearch`. */
		delay?: number;
		/** Shows a spinner inside the field (navigation in flight). */
		loading?: boolean;
		/** Extra params preserved as hidden inputs in form mode. */
		hiddenParams?: Record<string, string>;
		class?: string;
		label?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Cari…',
		name = 'q',
		action,
		mode = 'form',
		onInput,
		onSearch,
		delay = 350,
		loading = false,
		hiddenParams = {},
		class: className = '',
		label = 'Cari'
	}: Props = $props();

	let timer: ReturnType<typeof setTimeout> | undefined;

	function handleInput(event: Event) {
		value = (event.currentTarget as HTMLInputElement).value;
		clearTimeout(timer);
		// Debounce so we don't re-filter (or navigate) on every keystroke.
		timer = setTimeout(() => {
			if (mode === 'live') onInput?.(value);
			onSearch?.(value);
		}, delay);
	}

	function clear() {
		value = '';
		clearTimeout(timer);
		if (mode === 'live') onInput?.('');
		onSearch?.('');
	}

	/** Svelte 5 runs cleanup when the component unmounts / effect re-runs. */
	$effect(() => () => clearTimeout(timer));
</script>

{#if mode === 'live'}
	<div class="relative {className}">
		<Search class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
		<input
			type="search"
			{placeholder}
			bind:value
			oninput={handleInput}
			aria-label={label}
			class="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
		/>
		{#if loading}
			<Loader2
				class="absolute top-1/2 right-10 h-4 w-4 -translate-y-1/2 animate-spin text-teal-600"
			/>
		{/if}
		{#if value}
			<button
				type="button"
				onclick={clear}
				aria-label="Bersihkan pencarian"
				class="absolute top-1/2 right-2.5 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
			>
				<X class="h-3.5 w-3.5" />
			</button>
		{/if}
	</div>
{:else}
	<form action={action ?? ''} method="get" role="search" class="relative {className}">
		<!-- Preserve filters such as `status` when submitting. -->
		{#each Object.entries(hiddenParams) as [key, val] (key)}
			<input type="hidden" name={key} value={val} />
		{/each}
		<Search class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
		<input
			type="search"
			{name}
			{placeholder}
			bind:value
			aria-label={label}
			class="h-11 w-full rounded-xl border border-slate-200 bg-white pr-24 pl-10 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
		/>
		{#if loading}
			<Loader2
				class="absolute top-1/2 right-20 h-4 w-4 -translate-y-1/2 animate-spin text-teal-600"
			/>
		{/if}
		<button
			type="submit"
			class="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg bg-teal-600 px-3.5 text-xs font-bold text-white transition hover:bg-teal-700"
		>
			Cari
		</button>
	</form>
{/if}
