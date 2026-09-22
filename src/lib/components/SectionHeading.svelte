<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		kicker: string;
		title: string;
		description?: string;
		id?: string;
		action?: Snippet;
	}

	let { kicker, title, description, id, action }: Props = $props();
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div class="max-w-2xl">
		<p class="text-xs font-bold uppercase tracking-widest text-teal-600">{kicker}</p>
		<h2 {id} class="font-display scroll-mt-24 text-2xl font-extrabold text-slate-900 sm:text-3xl">
			{title}
		</h2>
		{#if description}
			<p class="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
		{/if}
	</div>
	{#if action}
		<div class="shrink-0">{@render action()}</div>
	{/if}
</div>
