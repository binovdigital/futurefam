import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Post, PostCategory, PostTag } from '$lib/types/database.types';

// Edit-post lookups: post row + its tag IDs + all categories/tags.
export const load: PageServerLoad = async ({ locals, params }) => {
	const [postRes, cats, tags, rels] = await Promise.all([
		locals.supabase.from('posts').select('*').eq('id', params.id).maybeSingle(),
		locals.supabase.from('post_categories').select('id, name, slug').order('name'),
		locals.supabase.from('post_tags').select('id, name, slug').order('name'),
		locals.supabase.from('post_tag_relations').select('tag_id').eq('post_id', params.id)
	]);

	if (postRes.error) console.error('[admin posts/edit] post error:', postRes.error);
	if (!postRes.data) throw error(404, 'Post tidak ditemukan.');

	return {
		post: postRes.data as Post,
		tagIds: ((rels.data ?? []) as { tag_id: number }[]).map((r) => r.tag_id),
		categories: (cats.data ?? []) as PostCategory[],
		tags: (tags.data ?? []) as PostTag[]
	};
};
