import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Guard: every /admin route except /admin/login requires a session.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session && url.pathname !== '/admin/login') {
		throw redirect(303, '/admin/login');
	}
	// Logged-in users visiting login get sent to the dashboard.
	if (session && url.pathname === '/admin/login') {
		throw redirect(303, '/admin');
	}

	return { session, user };
};
