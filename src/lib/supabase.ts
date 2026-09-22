// ============================================================
// FutureFam — Supabase client (singleton, SSR + browser safe)
// Uses PUBLIC_ vars so it works in `+page.server.ts` (SSR)
// and in browser components. Anon key + RLS `SELECT` policy
// on `posts` (status = 'published') required for public reads.
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/types/database.types';

let _client: SupabaseClient<Database> | null = null;

/** Reusable browser/SSR Supabase client (anon key, RLS applies). */
export function getSupabase(): SupabaseClient<Database> {
	if (_client) return _client;
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error(
			'Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and set values (also in Vercel Project Settings).'
		);
	}
	_client = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	return _client;
}

/** True when env vars look configured (used for graceful fallback). */
export function isSupabaseConfigured(): boolean {
	return Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
}

