import type { PageServerLoad } from './$types';
import type { PostCategory, PostTag } from '$lib/types/database.types';

// Shared lookups for the create-post form.
export const load: PageServerLoad = async ({ locals }) => {
	const [cats, tags] = await Promise.all([
		locals.supabase.from('post_categories').select('id, name, slug').order('name'),
		locals.supabase.from('post_tags').select('id, name, slug').order('name')
	]);

	if (cats.error) console.error('[admin posts/new] categories error:', cats.error);
	if (tags.error) console.error('[admin posts/new] tags error:', tags.error);

	return {
		categories: (cats.data ?? []) as PostCategory[],
		tags: (tags.data ?? []) as PostTag[]
	};
};
