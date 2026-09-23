<script lang="ts">
	/**
	 * Admin cover-image uploader.
	 *
	 * The picked image is optimised BEFORE the upload: `processImage()`
	 * resizes it to fit 1200x675 (16:9 — Open Graph ready), compresses it and
	 * converts it to WebP right in the browser, so only the small `.webp`
	 * file ever reaches the Supabase `post-images` bucket.
	 */
	import { ImagePlus, Loader2, X } from 'lucide-svelte';
	import { uploadPostImage } from '$lib/admin-utils';
	import { toast } from '$lib/toast.svelte';
	import {
		COVER_MAX_HEIGHT,
		COVER_MAX_WIDTH,
		formatFileSize,
		kilobytes,
		processImage,
		savingsPercent
	} from '$lib/utils/image';

	interface Props {
		value?: string | null;
		label?: string;
		onUploaded?: (url: string) => void;
	}

	let { value = $bindable<string | null>(null), label = 'Cover Image', onUploaded }: Props = $props();

	/** Max size accepted from the file picker, checked BEFORE compression. */
	const MAX_INPUT_BYTES = 5 * 1024 * 1024;

	/** `processing` = canvas work in the browser, `uploading` = network round-trip. */
	type Stage = 'idle' | 'processing' | 'uploading';

	let stage = $state<Stage>('idle');
	let dragging = $state(false);
	let errorMsg = $state<string | null>(null);
	let inputEl: HTMLInputElement | null = $state(null);

	/** Object URL of the freshly compressed WebP — instant local preview. */
	let previewUrl = $state<string | null>(null);
	/** Size of the raw pick, shown while the canvas is working. */
	let originalSize = $state(0);
	/** Result of the last compression: drives the KB badge + savings hint. */
	let optimized = $state<{ size: number; name: string; originalSize: number } | null>(null);

	const busy = $derived(stage !== 'idle');
	const savedPercent = $derived(
		optimized ? savingsPercent(optimized.originalSize, optimized.size) : 0
	);
	const sizeHint = $derived(optimized ? `${kilobytes(optimized.size)} KB` : '');

	// Never leak blob URLs: revoke whenever the preview is replaced or the
	// component unmounts.
	$effect(() => {
		const url = previewUrl;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	/** Forget the previous result (used before a new pick and on remove). */
	function resetOptimization() {
		previewUrl = null;
		optimized = null;
		originalSize = 0;
	}

	/** Remove the cover and clear every local trace of the last upload. */
	function handleRemove() {
		value = null;
		onUploaded?.('');
		resetOptimization();
	}

	/**
	 * Full pipeline for one pick:
	 * validate → compress + convert to WebP → local preview → upload → toast.
	 */
	async function handleFile(file: File | undefined) {
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			errorMsg = 'File harus berupa gambar (JPG/PNG/WebP).';
			return;
		}
		if (file.size > MAX_INPUT_BYTES) {
			errorMsg = 'Ukuran maksimal 5 MB.';
			return;
		}

		errorMsg = null;
		resetOptimization();
		originalSize = file.size;
		stage = 'processing';

		// 1. Resize + compress + convert to WebP, all inside the browser.
		let webp: File;
		try {
			webp = await processImage(file);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Gambar gagal diproses.';
			errorMsg = message;
			stage = 'idle';
			toast.error('Gagal mengompres gambar', { description: message });
			return;
		}

		const saved = savingsPercent(file.size, webp.size);
		previewUrl = URL.createObjectURL(webp);
		optimized = { size: webp.size, name: webp.name, originalSize: file.size };
		stage = 'uploading';

		// 2. Only the small WebP file is sent to Supabase Storage.
		try {
			const { publicUrl } = await uploadPostImage(webp);
			value = publicUrl;
			onUploaded?.(publicUrl);
			toast.success('Cover berhasil diunggah', {
				description: `${webp.name} · WebP ${formatFileSize(webp.size)}${
					saved > 0 ? ` (−${saved}% dari ${formatFileSize(file.size)})` : ''
				}`
			});
		} catch (e) {
			const message =
				e instanceof Error ? e.message : 'Upload gagal. Cek policy bucket post-images.';
			errorMsg = message;
			toast.error('Gagal mengunggah cover', { description: message });
		} finally {
			stage = 'idle';
		}
	}
</script>

<div>
	<p class="mb-1.5 text-sm font-semibold text-slate-700">{label}</p>

	{#if busy}
		<!-- Compressing/uploading: show the fresh WebP preview + estimated size. -->
		<div class="relative overflow-hidden rounded-2xl border border-teal-300 shadow-sm">
			{#if previewUrl}
				<img
					src={previewUrl}
					alt="Pratinjau hasil kompresi WebP"
					class="aspect-[16/9] w-full object-cover"
				/>
			{:else if value}
				<img src={value} alt="Cover saat ini" class="aspect-[16/9] w-full object-cover opacity-40" />
			{:else}
				<div class="aspect-[16/9] w-full bg-slate-100"></div>
			{/if}
			<div
				class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/60 px-4 text-center"
			>
				<Loader2 class="h-8 w-8 animate-spin text-white" />
				{#if stage === 'processing'}
					<span class="block text-sm font-semibold text-white">Mengompres gambar…</span>
					<span class="block text-xs text-slate-200">
						Resize maks {COVER_MAX_WIDTH}×{COVER_MAX_HEIGHT} · konversi WebP · {formatFileSize(
							originalSize
						)}
					</span>
				{:else}
					<span class="block text-sm font-semibold text-white">Mengunggah ke post-images…</span>
					{#if optimized}
						<span class="block text-xs text-slate-200">WebP · ≈ {sizeHint}</span>
					{/if}
				{/if}
			</div>
		</div>
	{:else if value}
		<div class="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
			<img src={value} alt="Pratinjau cover" class="aspect-[16/9] w-full object-cover" />
			{#if optimized}
				<span
					class="absolute bottom-2 left-2 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-bold text-white"
				>
					WebP · ≈ {sizeHint}
				</span>
			{/if}
			<button
				type="button"
				onclick={handleRemove}
				aria-label="Hapus gambar"
				class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
		<div class="mt-2 flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => inputEl?.click()}
				class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-teal-700"
			>
				Ganti gambar
			</button>
			{#if optimized && savedPercent > 0}
				<span class="text-xs font-medium text-emerald-700">
					−{savedPercent}% · {formatFileSize(optimized.originalSize)} → {formatFileSize(
						optimized.size
					)}
				</span>
			{/if}
		</div>
	{:else}
		<button
			type="button"
			onclick={() => inputEl?.click()}
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={(e) => {
				e.preventDefault();
				dragging = false;
				handleFile(e.dataTransfer?.files?.[0]);
			}}
			class={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
				dragging ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50'
			}`}
			aria-label="Unggah cover (klik atau drag & drop)"
		>
			<ImagePlus class="h-8 w-8 text-slate-400" />
			<span class="block text-sm font-semibold text-slate-600">Klik atau drag &amp; drop gambar ke sini</span>
			<span class="block text-xs text-slate-400">
				JPG / PNG / WebP · maks 5 MB · otomatis dikompres ke WebP {COVER_MAX_WIDTH}×{COVER_MAX_HEIGHT}
				· bucket post-images
			</span>
		</button>
	{/if}

	{#if errorMsg}
		<p class="mt-2 text-xs font-medium text-rose-600" role="alert">{errorMsg}</p>
	{/if}

	<input
		bind:this={inputEl}
		type="file"
		accept="image/*"
		class="hidden"
		aria-label="Pilih file gambar"
		onchange={(e) => {
			const file = (e.currentTarget as HTMLInputElement).files?.[0];
			// Reset so picking the same file twice still fires `change`.
			(e.currentTarget as HTMLInputElement).value = '';
			handleFile(file);
		}}
	/>
</div>
