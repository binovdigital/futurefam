<script lang="ts">
	import { Loader2, Lock } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getBrowserSupabase } from '$lib/supabase-browser';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);

	async function login(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = null;
		try {
			const { error } = await getBrowserSupabase().auth.signInWithPassword({ email, password });
			if (error) throw error;
			await goto('/admin', { invalidateAll: true });
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Login gagal. Coba lagi.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login Admin | FutureFam</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="grid min-h-screen place-items-center bg-slate-100 px-4">
	<div class="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
		<div class="bg-slate-900 p-6 text-center">
			<p class="font-display text-xl font-extrabold text-white">Future<span class="text-teal-400">Fam</span></p>
			<p class="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Admin Dashboard</p>
		</div>
		<form class="grid gap-3 p-6" onsubmit={login}>
			<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="admin-email">
				Email
				<input
					id="admin-email"
					type="email"
					required
					autocomplete="email"
					bind:value={email}
					placeholder="admin@futurefam.web.id"
					class="h-11 rounded-xl border border-slate-200 px-4 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
				/>
			</label>
			<label class="grid gap-1.5 text-sm font-semibold text-slate-700" for="admin-password">
				Password
				<input
					id="admin-password"
					type="password"
					required
					autocomplete="current-password"
					bind:value={password}
					placeholder="••••••••"
					class="h-11 rounded-xl border border-slate-200 px-4 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
				/>
			</label>

			{#if errorMsg}
				<p class="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700" role="alert">
					{errorMsg}
				</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
			>
				{#if loading}
					<Loader2 class="h-4 w-4 animate-spin" /> Masuk…
				{:else}
					<Lock class="h-4 w-4" /> Masuk Dashboard
				{/if}
			</button>
			<a href="/" class="text-center text-xs font-semibold text-slate-400 hover:text-teal-700">
				← Kembali ke situs
			</a>
		</form>
	</div>
</div>
