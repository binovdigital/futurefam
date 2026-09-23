// ============================================================
// FutureFam — Client-side image optimisation (browser only).
//
// Every cover image is normalised in the admin's BROWSER before it ever
// touches the Supabase `post-images` bucket:
//   1. resize so it fits inside 1200x675 (16:9 — the ratio used by the
//      blog cover, the Open Graph image and the Twitter card),
//   2. re-encode as WebP (`canvas.toBlob('image/webp', quality)`),
//   3. wrap the blob in a `File` named `<original>.webp`.
//
// Doing it here keeps the bucket small, the public pages fast and the
// Supabase egress bill low — a 3 MB phone photo becomes ~150 KB.
//
// NOTE: this module touches `document` / `canvas`, so it must only be
// imported from client code (never from `+page.server.ts`).
// ============================================================

/** Max width of a stored cover image (px) — Open Graph recommendation. */
export const COVER_MAX_WIDTH = 1200;
/** Max height of a stored cover image (px) — 1200x675 is exactly 16:9. */
export const COVER_MAX_HEIGHT = 675;
/** WebP quality passed to `canvas.toBlob`. 0.8 ≈ visually lossless for photos. */
export const WEBP_QUALITY = 0.8;
/** MIME type we convert to. */
export const WEBP_MIME = 'image/webp';

/**
 * How the source image is mapped onto the target canvas:
 * - `contain` (default): keep the whole picture, scale down to fit the box.
 * - `cover`: fill the box exactly and centre-crop the overflow (true 16:9).
 */
export type ImageFit = 'contain' | 'cover';

/** Geometry for one `ctx.drawImage(...)` call: source rect + canvas size. */
export interface ImageDrawPlan {
	/** Source crop origin X (px). */
	sx: number;
	/** Source crop origin Y (px). */
	sy: number;
	/** Source crop width (px). */
	sw: number;
	/** Source crop height (px). */
	sh: number;
	/** Target canvas width (px). */
	width: number;
	/** Target canvas height (px). */
	height: number;
}

/** `true` when the Canvas API is available (i.e. we are in a browser). */
function isBrowser(): boolean {
	return typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined';
}

function assertBrowser(): void {
	if (!isBrowser()) throw new Error('Kompresi gambar hanya bisa dijalankan di browser.');
}

/**
 * Pure resize/crop maths — no DOM, no canvas (easy to unit test).
 *
 * `contain` never upscales: an image that already fits is kept at its own
 * resolution, otherwise it is scaled down by the limiting factor so that
 * neither side exceeds `maxWidth` / `maxHeight`.
 *
 * `cover` fills the target box and centre-crops, which is what the
 * `aspect-[16/9] object-cover` preview shows the editor; it may upscale
 * small images, so only use it when a hard 16:9 frame is required.
 */
export function planImageDraw(
	sourceWidth: number,
	sourceHeight: number,
	maxWidth = COVER_MAX_WIDTH,
	maxHeight = COVER_MAX_HEIGHT,
	fit: ImageFit = 'contain'
): ImageDrawPlan {
	if (!(sourceWidth > 0) || !(sourceHeight > 0)) {
		throw new Error('Dimensi gambar tidak valid.');
	}
	if (!(maxWidth > 0) || !(maxHeight > 0)) {
		throw new Error('Batas ukuran gambar tidak valid.');
	}

	const scale =
		fit === 'cover'
			? Math.max(maxWidth / sourceWidth, maxHeight / sourceHeight)
			: Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);

	// `contain` keeps the full source; `cover` slices the longest side.
	const sw = fit === 'cover' ? Math.round(Math.min(sourceWidth, maxWidth / scale)) : sourceWidth;
	const sh = fit === 'cover' ? Math.round(Math.min(sourceHeight, maxHeight / scale)) : sourceHeight;

	return {
		sx: Math.round((sourceWidth - sw) / 2),
		sy: Math.round((sourceHeight - sh) / 2),
		sw,
		sh,
		// Derived from the source rect (not the rounded crop) and clamped to the
		// box, so `cover` lands exactly on maxWidth x maxHeight — a true 16:9 file.
		width: Math.max(1, Math.min(maxWidth, Math.round(sourceWidth * scale))),
		height: Math.max(1, Math.min(maxHeight, Math.round(sourceHeight * scale)))
	};
}

/** Everything we need to paint a decoded image exactly once. */
interface LoadedSource {
	/** Drawable handle (`ImageBitmap` in modern browsers, `HTMLImageElement` otherwise). */
	image: CanvasImageSource;
	width: number;
	height: number;
	/** Frees the underlying resource (bitmap or object URL). */
	release: () => void;
}

/**
 * Decode the picked file.
 *
 * `createImageBitmap` is preferred: it decodes off the main thread and
 * `imageOrientation: 'from-image'` applies the EXIF rotation of phone
 * photos (otherwise portrait shots come out sideways). Older Safari does
 * not accept that options bag, so we fall back to a plain `<img>`, which
 * also honours EXIF orientation in every current engine.
 */
async function loadSource(file: File): Promise<LoadedSource> {
	if (typeof createImageBitmap === 'function') {
		try {
			const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
			return {
				image: bitmap,
				width: bitmap.width,
				height: bitmap.height,
				release: () => bitmap.close()
			};
		} catch {
			// Unsupported option bag or undecodable file — try the <img> path.
		}
	}
	return loadWithImageElement(file);
}

function loadWithImageElement(file: File): Promise<LoadedSource> {
	return new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const img = new Image();
		img.decoding = 'async';

		img.onload = () => {
			resolve({
				image: img,
				width: img.naturalWidth,
				height: img.naturalHeight,
				release: () => URL.revokeObjectURL(objectUrl)
			});
		};
		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Gambar tidak bisa dibaca. Coba file JPG/PNG lain.'));
		};

		img.src = objectUrl;
	});
}

/** Promise wrapper around the callback-based `canvas.toBlob`. */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error('Gagal meng-encode gambar ke WebP.'));
			},
			type,
			quality
		);
	});
}

/**
 * Resize + compress + convert one picked image file to WebP.
 *
 * @param file       The original file straight from the `<input type="file">`.
 * @param maxWidth   Target box width in px (default 1200 — Open Graph safe).
 * @param maxHeight  Target box height in px (default 675 — keeps 16:9).
 * @param quality    WebP quality, 0.1–1 (default 0.8).
 * @param fit        `contain` (default, keeps the whole picture) or `cover` (crop to 16:9).
 * @returns A NEW `File` (`image/webp`, named `<original>.webp`) ready to upload.
 *          The caller's original `File` is never mutated.
 *
 * @example
 * const optimized = await processImage(file);      // 4.2 MB JPG -> ~180 KB WebP
 * await uploadPostImage(optimized);
 */
export async function processImage(
	file: File,
	maxWidth = COVER_MAX_WIDTH,
	maxHeight = COVER_MAX_HEIGHT,
	quality = WEBP_QUALITY,
	fit: ImageFit = 'contain'
): Promise<File> {
	assertBrowser();
	if (!file.type.startsWith('image/')) {
		throw new Error('File harus berupa gambar (JPG/PNG/WebP).');
	}

	// Keep the quality inside the range the encoder accepts.
	const safeQuality = Math.min(1, Math.max(0.1, quality));
	const source = await loadSource(file);

	try {
		const plan = planImageDraw(source.width, source.height, maxWidth, maxHeight, fit);

		const canvas = document.createElement('canvas');
		canvas.width = plan.width;
		canvas.height = plan.height;

		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas 2D tidak tersedia di browser ini.');

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		// Flatten alpha onto white: covers are opaque art, and transparent
		// pixels read as black on some dark UIs.
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, plan.width, plan.height);
		ctx.drawImage(source.image, plan.sx, plan.sy, plan.sw, plan.sh, 0, 0, plan.width, plan.height);

		const blob = await canvasToBlob(canvas, WEBP_MIME, safeQuality);
		// Browsers that cannot encode WebP silently return PNG instead — catch
		// that here rather than storing a `.webp` file that is really a PNG.
		if (blob.type !== WEBP_MIME) {
			throw new Error(
				'Browser ini belum mendukung konversi WebP. Gunakan Chrome/Firefox/Safari terbaru.'
			);
		}

		return new File([blob], webpFileName(file.name), {
			type: WEBP_MIME,
			lastModified: Date.now()
		});
	} finally {
		source.release();
	}
}

/** `foto-cover.JPG` -> `foto-cover.webp` (falls back to `cover.webp`). */
export function webpFileName(originalName: string): string {
	const base = originalName.replace(/\.[^./\\]+$/, '').trim();
	return `${base || 'cover'}.webp`;
}

/** `184320` -> `"180 KB"`, `1835008` -> `"1.8 MB"`. */
export function formatFileSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
	if (bytes < 1024) return `${Math.round(bytes)} B`;

	const kb = bytes / 1024;
	if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;

	const mb = kb / 1024;
	return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** Rounded size in KB, e.g. `184320` -> `180` — for the compact size badge. */
export function kilobytes(bytes: number): number {
	if (!Number.isFinite(bytes) || bytes <= 0) return 0;
	return Math.max(1, Math.round(bytes / 1024));
}

/**
 * Rounded percentage saved by the compression: `(3 000 000, 150 000)` -> `95`.
 * Returns `0` when nothing was saved, so the UI can hide the hint.
 */
export function savingsPercent(originalBytes: number, optimizedBytes: number): number {
	if (!(originalBytes > 0) || optimizedBytes >= originalBytes) return 0;
	return Math.round((1 - optimizedBytes / originalBytes) * 100);
}
