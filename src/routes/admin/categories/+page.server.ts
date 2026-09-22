import type { PageServerLoad } from './$types';
import { getAdminList } from '$lib/admin-list';
import type { PostCategory } from '$lib/types/database.types';

/** Categories master table: search (`?q=`) + pagination (`?page=`). */
export const load: PageServerLoad = async ({ locals, url }) => {
	const result = await getAdminList<PostCategory>({
		table: 'post_categories',
		columns: ['name', 'slug', 'description'],
		q: url.searchParams.get('q'),
		page: url.searchParams.get('page'),
		client: locals.supabase
	});

	return {
		categories: result.rows,
		q: result.q,
		page: result.page,
		perPage: result.perPage,
		total: result.total,
		totalPages: result.totalPages,
		loadError: result.loadError
	};
};

