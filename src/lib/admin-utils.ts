// ============================================================
// FutureFam — Shared admin helpers: slugify + storage upload.
// Storage bucket: `post-images` (public).
// ============================================================
import { getBrowserSupabase } from '$lib/supabase-browser';

export const POST_IMAGES_BUCKET = 'post-images';

/** "Digital Parenting 101!" -> "digital-parenting-101" */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export interface UploadResult {
	path: string;
	publicUrl: string;
}

/**
 * Upload a file to `post-images` and return its public URL.
 * Path: `<yyyy>/<mm>/<timestamp>-<sanitized-name>`.
 * Requires a public-read policy on the bucket, e.g.:
 *   create policy "public read" on storage.objects
 *   for select to anon using (bucket_id = 'post-images');
 * ...plus an authenticated INSERT policy for the admin role.
 */
export async function uploadPostImage(file: File): Promise<UploadResult> {
	const supabase = getBrowserSupabase();
	const now = new Date();
	const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-');
	const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${safeName}`;

	const { error } = await supabase.storage.from(POST_IMAGES_BUCKET).upload(path, file, {
		cacheControl: '3600',
		upsert: false,
		contentType: file.type || 'image/jpeg'
	});
	if (error) throw error;

	const {
		data: { publicUrl }
	} = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path);

	return { path, publicUrl };
}
