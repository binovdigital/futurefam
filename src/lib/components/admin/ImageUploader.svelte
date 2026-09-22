<script lang="ts">
	import { ImagePlus, Loader2, X } from 'lucide-svelte';
	import { uploadPostImage } from '$lib/admin-utils';
	import { toast } from '$lib/toast.svelte';

	interface Props {
		value?: string | null;
		label?: string;
		onUploaded?: (url: string) => void;
	}

	let { value = $bindable<string | null>(null), label = 'Cover Image', onUploaded }: Props = $props();

	let uploading = $state(false);
	let dragging = $state(false);
	let errorMsg = $state<string | null>(null);
	let inputEl: HTMLInputElement | null = $state(null);

	async function handleFile(file: File | undefined) {
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			errorMsg = 'File harus berupa gambar (JPG/PNG/WebP).';
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			errorMsg = 'Ukuran maksimal 5 MB.';
			return;
		}
		uploading = true;
		errorMsg = null;
		try {
			const { publicUrl } = await uploadPostImage(file);
			value = publicUrl;
			onUploaded?.(publicUrl);
			toast.success('Cover berhasil diunggah', { description: file.name });
		} catch (e) {
			const message =
				e instanceof Error ? e.message : 'Upload gagal. Cek policy bucket post-images.';
			errorMsg = message;
			toast.error('Gagal mengunggah cover', { description: message });
		} finally {
			uploading = false;
		}
	}
</script>

<div>
	<p class="mb-1.5 text-sm font-semibold text-slate-700">{label}</p>

	{#if value}
		<div class="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
			<img src={value} alt="Pratinjau cover" class="aspect-[16/9] w-full object-cover" />
			<button
				type="button"
				onclick={() => {
					value = null;
					onUploaded?.('');
				}}
				aria-label="Hapus gambar"
				class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
		<div class="mt-2 flex gap-2">
			<button
				type="button"
				onclick={() => inputEl?.click()}
				disabled={uploading}
				class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 disabled:opacity-50"
			>
				Ganti gambar
			</button>
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
			{#if uploading}
				<Loader2 class="h-8 w-8 animate-spin text-teal-600" />
				<span class="block text-sm font-semibold text-slate-600">Mengunggah ke post-images…</span>
			{:else}
				<ImagePlus class="h-8 w-8 text-slate-400" />
				<span class="block text-sm font-semibold text-slate-600">Klik atau drag &amp; drop gambar ke sini</span>
				<span class="block text-xs text-slate-400">
					JPG / PNG / WebP · maks 5 MB · tersimpan di bucket post-images
				</span>
			{/if}
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
		onchange={(e) => handleFile((e.currentTarget as HTMLInputElement).files?.[0])}
	/>
</div>
