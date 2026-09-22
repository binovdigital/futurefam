import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { toCardData } from '$lib/data/posts';
import type { PostCardData, PostCategory, PostWithCategory } from '$lib/types/database.types';
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
 * SSR: category detail + its paginated, searchable posts.
 * `/kategori/robotika?q=lego&page=2`
 *
 * Relaxed on purpose: no `.eq('status', 'published')` while the seed data /
 * RLS setup is still being verified (consistent with the homepage).
 */
export const load: PageServerLoad = async ({ params, url }) => {
	const slug = params.slug;
	const q = sanitizeSearchTerm(url.searchParams.get('q') ?? '');
	const requestedPage = parsePage(url.searchParams.get('page'));
	const supabase = getSupabase();

	// 1. Category by slug (404 if missing).
	const { data: categoryData, error: catError } = await supabase
		.from('post_categories')
		.select('id, name, slug, description')
		.eq('slug', slug)
		.maybeSingle();

	if (catError) console.error('[kategori slug] category error:', catError);
	if (catError) throw error(500, 'Gagal memuat kategori.');
	if (!categoryData) throw error(404, 'Kategori tidak ditemukan.');

	const category = categoryData as unknown as Pick<
		PostCategory,
		'id' | 'name' | 'slug' | 'description'
	>;

	// Shared in-category search filter (title + excerpt).
	const searchOr = buildIlikeOr(['title', 'excerpt'], q);

	// 2. Total posts in this category (for the pagination math).
	const countQuery = supabase
		.from('posts')
		.select('id', { count: 'exact', head: true })
		.eq('category_id', category.id);
	const countRes = await (searchOr ? countQuery.or(searchOr) : countQuery);
	if (countRes.error) console.error('[kategori slug] count error:', countRes.error);

	const total = countRes.count ?? 0;
	const page = clampPage(requestedPage, total, PER_PAGE_PUBLIC);
	const { from, to } = rangeFor(page, PER_PAGE_PUBLIC);

	// 3. One page of posts (category name included for ArticleCard).
	const listQuery = supabase
		.from('posts')
		.select('*, post_categories(name)')
		.eq('category_id', category.id)
		.order('published_at', { ascending: false, nullsFirst: false })
		.order('created_at', { ascending: false })
		.range(from, to);

	const { data: postsData, error: postsError } = await (searchOr
		? listQuery.or(searchOr)
		: listQuery);
	if (postsError) console.error('[kategori slug] posts error:', postsError);

	const posts: PostCardData[] = ((postsData ?? []) as unknown as PostWithCategory[]).map(
		toCardData
	);

	return {
		category,
		q,
		posts,
		page,
		perPage: PER_PAGE_PUBLIC,
		total,
		totalPages: totalPagesFor(total, PER_PAGE_PUBLIC)
	};
};

