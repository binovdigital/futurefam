<script lang="ts">
	import { FolderOpen, LayoutDashboard, LogOut, Newspaper, Tags } from 'lucide-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getBrowserSupabase } from '$lib/supabase-browser';

	let { children, data } = $props();

	const links = [
		{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
		{ label: 'Posts', href: '/admin/posts', icon: Newspaper },
		{ label: 'Categories', href: '/admin/categories', icon: FolderOpen },
		{ label: 'Tags', href: '/admin/tags', icon: Tags }
	];

	let current = $derived(page.url.pathname);
	let sidebarOpen = $state(false);

	function isActive(href: string) {
		return href === '/admin' ? current === '/admin' : current.startsWith(href);
	}

	async function logout() {
		await getBrowserSupabase().auth.signOut();
		await goto('/admin/login', { invalidateAll: true });
	}
</script>

{#if current === '/admin/login'}
	<!-- Login renders standalone (no sidebar) -->
	{@render children()}
{:else}
	<div class="min-h-screen bg-slate-100">
		<div class="mx-auto flex max-w-7xl">
			<!-- Sidebar (desktop) -->
			<aside class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex" aria-label="Menu admin">
				<a href="/admin" class="flex items-center gap-2 rounded-xl px-2 py-3">
					<span class="font-display grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-lg font-extrabold text-white">F</span>
					<span class="font-display text-lg font-extrabold text-slate-900">Future<span class="text-teal-600">Fam</span>
						<span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-slate-500">Admin</span>
					</span>
				</a>
				<nav class="mt-4 grid gap-1" aria-label="Navigasi admin">
					{#each links as link (link.href)}
						<a
							href={link.href}
							aria-current={isActive(link.href) ? 'page' : undefined}
							class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
								isActive(link.href)
									? 'bg-teal-600 text-white shadow-sm'
									: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
							}`}
						>
							<link.icon class="h-4 w-4" /> {link.label}
						</a>
					{/each}
				</nav>
				<div class="mt-auto border-t border-slate-100 pt-4">
					<p class="truncate px-3 text-xs text-slate-400">{data.user?.email ?? ''}</p>
					<button
						type="button"
						onclick={logout}
						class="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
					>
						<LogOut class="h-4 w-4" /> Logout
					</button>
				</div>
			</aside>

			<!-- Main column -->
			<div class="min-w-0 flex-1">
				<!-- Mobile topbar -->
				<header class="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
					<span class="font-display text-base font-extrabold">Future<span class="text-teal-600">Fam</span> Admin</span>
					<button
						type="button"
						onclick={() => (sidebarOpen = !sidebarOpen)}
						aria-expanded={sidebarOpen}
						aria-label="Menu admin"
						class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"
					>
						{sidebarOpen ? 'Tutup' : 'Menu'}
					</button>
				</header>
				{#if sidebarOpen}
					<nav class="grid gap-1 border-b border-slate-200 bg-white p-3 md:hidden" aria-label="Navigasi admin mobile">
						{#each links as link (link.href)}
							<a
								href={link.href}
								onclick={() => (sidebarOpen = false)}
								class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
									isActive(link.href) ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
								}`}
							>
								<link.icon class="h-4 w-4" /> {link.label}
							</a>
						{/each}
						<button
							type="button"
							onclick={logout}
							class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
						>
							<LogOut class="h-4 w-4" /> Logout
						</button>
					</nav>
				{/if}
				<main class="p-4 sm:p-6 lg:p-8">
					{@render children()}
				</main>
			</div>
		</div>
	</div>
{/if}
