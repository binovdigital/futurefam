// ============================================================
// FutureFam — Post helpers: mapping Supabase rows -> UI shape,
// fallbacks when DB is empty/unreachable (dev keeps working).
// ============================================================
import type { PostCardData, PostWithCategory } from '$lib/types/database.types';
import { articles, type Article } from '$lib/data/mock';

export const FALLBACK_COVER =
	'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop';

/** Indonesian date, tolerant of null. */
export function formatDateID(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Rough reading time from text content. */
export function estimateReadMinutes(content: string | null | undefined): number {
	if (!content) return 3;
	const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

/** Map a Supabase post row -> card shape used by ArticleCard. */
export function toCardData(post: PostWithCategory): PostCardData {
	// Relaxed join `post_categories(name)` may return object, array, or null.
	const rel = post.post_categories as unknown as
		| { name?: string; slug?: string }
		| { name?: string; slug?: string }[]
		| null;
	const first = Array.isArray(rel) ? rel[0] : rel;
	return {
		id: post.id,
		title: post.title,
		slug: post.slug,
		excerpt: post.excerpt,
		cover_image: post.cover_image,
		view_count: post.view_count ?? 0,
		published_at: post.published_at,
		created_at: post.created_at,
		post_categories: first?.name ? { name: first.name, slug: first.slug ?? first.name.toLowerCase() } : null
	};
}

/** Legacy mock Article -> same card shape (fallback path). */
export function mockToCardData(a: Article): PostCardData {
	return {
		id: String(a.id),
		title: a.title,
		slug: a.slug,
		excerpt: a.excerpt,
		cover_image: a.image_url,
		view_count: 0,
		published_at: a.created_at,
		created_at: a.created_at,
		post_categories: { name: a.category, slug: a.category.toLowerCase() }
	};
}

/** Mock cards when Supabase returns empty/error. */
export function getMockCards(): PostCardData[] {
	return articles.map(mockToCardData);
}
