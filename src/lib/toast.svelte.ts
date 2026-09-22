// ============================================================
// FutureFam — Toast notification store (Svelte 5 runes, zero deps).
//
// Usage (anywhere, including inside event handlers):
//   import { toast } from '$lib/toast.svelte';
//   toast.success('Post disimpan');
//   toast.error('Gagal menghapus', { description: err.message });
//
// Rendering is done once by <Toaster /> (mounted in +layout.svelte),
// which subscribes to `toast.items`.
// ============================================================

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
	id: number;
	kind: ToastKind;
	message: string;
	/** Optional second line, e.g. the raw Supabase error message. */
	description?: string;
	/** Auto-dismiss delay in ms; 0 keeps the toast until dismissed. */
	duration: number;
}

export interface ToastOptions {
	description?: string;
	duration?: number;
}

const DEFAULT_DURATION = 3800;
/** Errors stay longer so they can actually be read. */
const ERROR_DURATION = 6500;
/** Max toasts on screen at once (older ones are dropped). */
const MAX_VISIBLE = 4;

class ToastStore {
	/** Live list rendered by <Toaster />. */
	items = $state<ToastItem[]>([]);

	#nextId = 1;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	/** Green toast — CRUD succeeded. Returns the toast id. */
	success(message: string, options: ToastOptions = {}): number {
		return this.#push('success', message, options);
	}

	/** Red toast — CRUD failed. */
	error(message: string, options: ToastOptions = {}): number {
		return this.#push('error', message, options);
	}

	/** Neutral toast — context, e.g. "Mode pratinjau". */
	info(message: string, options: ToastOptions = {}): number {
		return this.#push('info', message, options);
	}

	/** Remove a single toast (also used by the auto-dismiss timer). */
	dismiss(id: number): void {
		const timer = this.#timers.get(id);
		if (timer) {
			clearTimeout(timer);
			this.#timers.delete(id);
		}
		this.items = this.items.filter((t) => t.id !== id);
	}

	/** Remove everything (called on logout, navigation resets, etc.). */
	clear(): void {
		for (const timer of this.#timers.values()) clearTimeout(timer);
		this.#timers.clear();
		this.items = [];
	}

	#push(kind: ToastKind, message: string, { description, duration }: ToastOptions): number {
		const id = this.#nextId++;
		const delay = duration ?? (kind === 'error' ? ERROR_DURATION : DEFAULT_DURATION);

		this.items = [...this.items, { id, kind, message, description, duration: delay }];

		// Own the 4 visible slots: drop the oldest toast when overflowing.
		while (this.items.length > MAX_VISIBLE) {
			const oldest = this.items[0];
			if (!oldest) break;
			this.dismiss(oldest.id);
		}

		if (delay > 0) {
			this.#timers.set(
				id,
				setTimeout(() => this.dismiss(id), delay)
			);
		}

		return id;
	}
}

export const toast = new ToastStore();
