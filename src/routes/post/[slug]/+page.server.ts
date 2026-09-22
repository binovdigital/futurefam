import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSupabase, isSupabaseConfigured } from '$lib/supabase';
import { articles } from '$lib/data/mock';
import { toCardData } from '$lib/data/posts';
import type {
	PostCardData,
	PostDetail,
	PostWithCategory
} from '$lib/types/database.types';

// Detail SSR: single `published` post by slug + category + tags.
// Falls back to legacy mock when Supabase misses (dev-safe).
export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;

	if (isSupabaseConfigured()) {
		try {
			const supabase = getSupabase();

			const { data, error: dbError } = await supabase
				.from('posts')
				.select(
					'*, post_categories(id, name, slug), post_tag_relations(tag_id, post_tags(id, name, slug))'
				)
				.eq('slug', slug)
				.eq('status', 'published')
				.maybeSingle();

			if (dbError) console.error('[post slug] Supabase error:', dbError);
			if (dbError) throw dbError;

			if (data) {
				const row = data as unknown as PostWithCategory & {
					post_tag_relations: { post_tags: { id: number; name: string; slug: string } | null }[];
				};
				const tags =
					row.post_tag_relations
						?.map((r) => r.post_tags)
						.filter((t): t is { id: number; name: string; slug: string } => Boolean(t)) ?? [];

				const post: PostDetail = {
					...(row as PostWithCategory),
					post_categories: row.post_categories ?? null,
					tags
				};

				// Related: latest published in same category first, else latest overall.
				let related: PostCardData[] = [];
				const { data: relData } = await supabase
					.from('posts')
					.select('*, post_categories(id, name, slug)')
					.eq('status', 'published')
					.neq('id', row.id)
					.order('published_at', { ascending: false, nullsFirst: false })
					.limit(3);
				related = ((relData ?? []) as unknown as PostWithCategory[]).map(toCardData);

				return { post, tags, related, dataSource: 'supabase' as const };
			}
			// else: fall through to mock fallback below
		} catch (e) {
			// Log server-side; client still gets mock fallback with notice.
			console.error('[post slug] Supabase error:', e);
		}
	}

	// ---- Mock fallback (keeps UI working before DB seeding) ----
	const mock = articles.find((a) => a.slug === slug);
	if (!mock) throw error(404, 'Artikel tidak ditemukan');

	const post = {
		id: String(mock.id),
		title: mock.title,
		slug: mock.slug,
		content: mock.content,
		excerpt: mock.excerpt,
		cover_image: mock.image_url,
		category_id: null,
		author_id: null,
		status: 'published',
		view_count: 0,
		published_at: mock.created_at,
		created_at: mock.created_at,
		updated_at: mock.created_at,
		post_categories: { id: 0, name: mock.category, slug: mock.category.toLowerCase() },
		tags: [{ id: 0, name: mock.category, slug: mock.category.toLowerCase() }]
	} satisfies PostDetail & { post_categories: { id: number; name: string; slug: string } };

	const related: PostCardData[] = articles
		.filter((a) => a.slug !== slug)
		.slice(0, 3)
		.map((a) => ({
			id: String(a.id),
			title: a.title,
			slug: a.slug,
			excerpt: a.excerpt,
			cover_image: a.image_url,
			view_count: 0,
			published_at: a.created_at,
			created_at: a.created_at,
			post_categories: { name: a.category, slug: a.category.toLowerCase() }
		}));

	return { post, tags: post.tags, related, dataSource: 'mock' as const };
};
