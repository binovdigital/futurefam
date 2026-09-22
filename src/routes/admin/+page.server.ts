import type { PageServerLoad } from './$types';
import type { PostWithCategory } from '$lib/types/database.types';

// Dashboard stats: counts + latest posts. RLS: admin must have
// SELECT on posts/post_categories/post_tags (authenticated policy).
export const load: PageServerLoad = async ({ locals }) => {
	const sb = locals.supabase;

	const [posts, categories, tags, latest] = await Promise.all([
		sb.from('posts').select('id', { count: 'exact', head: true }),
		sb.from('post_categories').select('id', { count: 'exact', head: true }),
		sb.from('post_tags').select('id', { count: 'exact', head: true }),
		sb
			.from('posts')
			.select('id, title, slug, status, published_at, created_at, post_categories(name)')
			.order('created_at', { ascending: false })
			.limit(5)
	]);

	return {
		stats: {
			posts: posts.count ?? 0,
			categories: categories.count ?? 0,
			tags: tags.count ?? 0
		},
		latest: (latest.data ?? []) as unknown as PostWithCategory[]
	};
};
