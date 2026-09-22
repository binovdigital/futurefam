// ============================================================
// FutureFam — Browser Supabase client (auth-aware, SSR-safe).
// Session is stored in cookies by @supabase/ssr (see hooks.server.ts),
// so login in the browser is visible to `+layout.server.ts` guards.
// `getSupabase()` (anon, no auth persistence) is still used for
// public reads. Use `getBrowserSupabase()` for admin/auth flows.
// ============================================================
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/types/database.types';

let _browser: SupabaseClient<Database> | null = null;

/** Auth-aware browser client (singleton). Call only in browser code. */
export function getBrowserSupabase(): SupabaseClient<Database> {
	if (_browser) return _browser;
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error('Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY.');
	}
	_browser = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	return _browser;
}
