import type { PageServerLoad } from './$types';
import { getAdminList } from '$lib/admin-list';
import type { PostTag } from '$lib/types/database.types';

/** Tags master table: search (`?q=`) + pagination (`?page=`). */
export const load: PageServerLoad = async ({ locals, url }) => {
	const result = await getAdminList<PostTag>({
		table: 'post_tags',
		columns: ['name', 'slug'],
		q: url.searchParams.get('q'),
		page: url.searchParams.get('page'),
		client: locals.supabase
	});

	return {
		tags: result.rows,
		q: result.q,
		page: result.page,
		perPage: result.perPage,
		total: result.total,
		totalPages: result.totalPages,
		loadError: result.loadError
	};
};

