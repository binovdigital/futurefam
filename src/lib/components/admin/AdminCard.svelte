<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		actions?: Snippet;
		children: Snippet;
	}

	let { title, subtitle, actions, children }: Props = $props();
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="font-display text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
		{#if subtitle}
			<p class="mt-1 text-sm text-slate-500">{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex gap-2">{@render actions()}</div>
	{/if}
</div>

<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
	{@render children()}
</div>
