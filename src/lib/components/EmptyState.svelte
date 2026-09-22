<script lang="ts">
	/**
	 * Generic empty / zero-result state.
	 * Uses a `snippet` for the optional call-to-action so callers can pass
	 * arbitrary markup (buttons, links, …) without new props.
	 */
	import { SearchX } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		action?: Snippet;
		class?: string;
	}

	let { title, description, action, class: className = '' }: Props = $props();
</script>

<div
	class="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center {className}"
>
	<span class="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-300 shadow-sm">
		<SearchX class="h-5 w-5" />
	</span>
	<p class="mt-4 font-display text-base font-extrabold text-slate-700">{title}</p>
	{#if description}
		<p class="mt-1 max-w-md text-sm text-slate-500">{description}</p>
	{/if}
	{#if action}
		<div class="mt-5">{@render action()}</div>
	{/if}
</div>
