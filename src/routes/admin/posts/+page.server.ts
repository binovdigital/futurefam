import type { PageServerLoad } from './$types';
import type { PostWithCategory } from '$lib/types/database.types';
import {
	PER_PAGE_ADMIN,
	buildIlikeOr,
	clampPage,
	combineOrGroups,
	missingCoverFilter,
	parsePage,
	rangeFor,
	sanitizeSearchTerm,
	totalPagesFor
} from '$lib/utils/query';

/** Values accepted for the `?status=` filter. */
const STATUSES = ['published', 'draft', 'archived'] as const;
type Status = (typeof STATUSES)[number];

/**
 * Admin post list: search (`?q=`), status filter (`?status=`), cover-image
 * audit (`?image=missing`) and pagination (`?page=`).
 *
 * Runs on `locals.supabase`, so the `authenticated` RLS policies apply —
 * drafts are visible here even though the public site only reads published
 * rows. Filtering happens in SQL (not in the browser) so `total` stays exact.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;

	const term = sanitizeSearchTerm(url.searchParams.get('q') ?? '');

	const statusParam = url.searchParams.get('status');
	const status: Status | 'all' = STATUSES.includes(statusParam as Status)
		? (statusParam as Status)
		: 'all';

	const image = url.searchParams.get('image') === 'missing' ? 'missing' : 'all';

	// ONE PostgREST `or` param: (title/slug match) AND (cover missing).
	// `combineOrGroups` nests the groups with `and(...)` so the two filters
	// never overwrite each other.
	const orFilter = combineOrGroups([
		buildIlikeOr(['title', 'slug'], term),
		image === 'missing' ? missingCoverFilter('cover_image') : null
	]);

	// --- 1. Exact count, for the pagination math (head request: no payload) ---
	const countBase = sb.from('posts').select('id', { count: 'exact', head: true });
	const countScoped = status === 'all' ? countBase : countBase.eq('status', status);
	const countRes = await (orFilter ? countScoped.or(orFilter) : countScoped);
	if (countRes.error) console.error('[admin/posts] count error:', countRes.error);

	const total = countRes.count ?? 0;
	const page = clampPage(parsePage(url.searchParams.get('page')), total, PER_PAGE_ADMIN);
	const { from, to } = rangeFor(page, PER_PAGE_ADMIN);

	// --- 2. The requested page of rows (category name for the table) ---
	const listBase = sb
		.from('posts')
		.select('*, post_categories(name)')
		.order('created_at', { ascending: false })
		.range(from, to);
	const listScoped = status === 'all' ? listBase : listBase.eq('status', status);
	const { data, error } = await (orFilter ? listScoped.or(orFilter) : listScoped);
	if (error) console.error('[admin/posts] list error:', error);

	// --- 3. Cover-image audit tally, drives the "N posts need a cover" banner.
	// Scoped to the whole table (not the active filters) so the warning stays
	// visible while the editor is looking at a filtered slice.
	const missingRes = await sb
		.from('posts')
		.select('id', { count: 'exact', head: true })
		.or(missingCoverFilter('cover_image'));
	if (missingRes.error) console.error('[admin/posts] missing-cover count error:', missingRes.error);
	const missingCover = missingRes.count ?? 0;

	return {
		posts: (data ?? []) as unknown as PostWithCategory[],
		q: term,
		status,
		image,
		page,
		perPage: PER_PAGE_ADMIN,
		total,
		totalPages: totalPagesFor(total, PER_PAGE_ADMIN),
		missingCover,
		loadError: error ? error.message : null
	};
};
