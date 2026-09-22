<script lang="ts">
	import { Facebook, Heart, Instagram, Twitter, Youtube } from 'lucide-svelte';
</script>

<footer class="border-t border-slate-200 bg-white">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
		<div>
			<p class="font-display text-lg font-extrabold text-slate-900">
				Future<span class="text-teal-600">Fam</span>
			</p>
			<p class="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
				Media keluarga Indonesia: berita terkini, artikel inspiratif, dan tips praktis untuk
				mendampingi tumbuh kembang buah hati.
			</p>
		</div>
		<nav aria-label="Tautan footer">
			<p class="text-sm font-bold text-slate-900">Jelajah</p>
			<ul class="mt-3 space-y-2 text-sm text-slate-600">
				<li><a class="hover:text-teal-700" href="/#berita">Berita & Artikel Terbaru</a></li>
				<li><a class="hover:text-teal-700" href="/#tips">Tips Keluarga</a></li>
			</ul>
		</nav>
		<div>
			<p class="text-sm font-bold text-slate-900">Ikuti kami</p>
			<div class="mt-3 flex gap-2">
				<a aria-label="Instagram" href="/" class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-teal-100"><Instagram class="h-5 w-5" /></a>
				<a aria-label="Facebook" href="/" class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-teal-100"><Facebook class="h-5 w-5" /></a>
				<a aria-label="Twitter" href="/" class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-teal-100"><Twitter class="h-5 w-5" /></a>
				<a aria-label="Youtube" href="/" class="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-teal-100"><Youtube class="h-5 w-5" /></a>
			</div>
		</div>
	</div>
	<div class="border-t border-slate-100">
		<p class="mx-auto flex max-w-6xl items-center justify-center gap-1 px-4 py-4 text-xs text-slate-500">
			© 2026 futurefam.web.id — Dibuat dengan <Heart class="h-3.5 w-3.5 text-rose-500" /> untuk keluarga Indonesia.
		</p>
	</div>
</footer>
