<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import '../app.css';

	let { children } = $props();

	// The admin area brings its own chrome (sidebar + topbar), so the public
	// Navbar/Footer are suppressed there — including on the standalone login page.
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	<title>FutureFam — Berita, Artikel & Tips Keluarga</title>
</svelte:head>

{#if !isAdmin}
	<Navbar />
{/if}

<main class={isAdmin ? '' : 'min-h-[70vh]'}>
	{@render children()}
</main>

{#if !isAdmin}
	<Footer />
{/if}

<!-- Global toast viewport — every CRUD action reports through the `toast` store. -->
<Toaster />

