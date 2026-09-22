import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { toCardData } from '$lib/data/posts';
import type { PostCardData, PostWithCategory } from '$lib/types/database.types';
import {
	PER_PAGE_PUBLIC,
	buildIlikeOr,
	clampPage,
	parsePage,
	rangeFor,
	sanitizeSearchTerm,
	totalPagesFor
} from '$lib/utils/query';

/**
 * Public search + archive (`/cari?q=...&page=2`).
 *
 * SSR so results are crawlable and shareable. The term is matched with
 * `.ilike()` across title / excerpt / content; `sanitizeSearchTerm` removes
 * PostgREST syntax and LIKE wildcards before interpolation.
 *
 * Relaxed on purpose: no `.eq('status', 'published')` while the seed data /
 * RLS setup is still being verified (same as the homepage).
 */
export const load: PageServerLoad = async ({ url }) => {
	const q = sanitizeSearchTerm(url.searchParams.get('q') ?? '');
	const requestedPage = parsePage(url.searchParams.get('page'));
	const supabase = getSupabase();

	// One OR-group shared by the count and the page query.
	const searchOr = buildIlikeOr(['title', 'excerpt', 'content'], q);

	// 1. Total rows (head request: no payload, just the count).
	const countQuery = supabase.from('posts').select('id', { count: 'exact', head: true });
	const countRes = await (searchOr ? countQuery.or(searchOr) : countQuery);
	if (countRes.error) console.error('[cari] count error:', countRes.error);

	const total = countRes.count ?? 0;
	// Clamp so `?page=999` (or a shrunk result set) still renders rows.
	const page = clampPage(requestedPage, total, PER_PAGE_PUBLIC);
	const { from, to } = rangeFor(page, PER_PAGE_PUBLIC);

	// 2. The page of rows.
	const listQuery = supabase
		.from('posts')
		.select('*, post_categories(name)')
		.order('published_at', { ascending: false, nullsFirst: false })
		.order('created_at', { ascending: false })
		.range(from, to);

	const listRes = await (searchOr ? listQuery.or(searchOr) : listQuery);
	if (listRes.error) console.error('[cari] list error:', listRes.error);

	const posts: PostCardData[] = ((listRes.data ?? []) as unknown as PostWithCategory[]).map(
		toCardData
	);

	return {
		q,
		posts,
		page,
		perPage: PER_PAGE_PUBLIC,
		total,
		totalPages: totalPagesFor(total, PER_PAGE_PUBLIC)
	};
};
