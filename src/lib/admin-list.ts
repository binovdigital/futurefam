// ============================================================
// FutureFam — shared admin list options.
// Use with `getSupabaseList({ q, page, columns })` in any admin
// `+page.server.ts` that renders a searchable, paginated table.
// Keeps the PostgREST filter/range logic in exactly one place.
// ============================================================

import { getSupabase } from '$lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import {
	PER_PAGE_ADMIN,
	buildIlikeOr,
	clampPage,
	parsePage,
	rangeFor,
	sanitizeSearchTerm,
	totalPagesFor
} from '$lib/utils/query';

export interface AdminListOptions {
	/** Table to query, e.g. `'post_categories'`. */
	table: 'post_categories' | 'post_tags';
	/** Columns matched by the search term (`.ilike`). */
	columns: readonly string[];
	/** Raw `?q=` value from the URL. */
	q: string | null | undefined;
	/** Raw `?page=` value from the URL. */
	page: string | null | undefined;
	/** Extra `.order()` clause, defaults to newest first. */
	orderBy?: { column: string; ascending?: boolean };
	/**
	 * Pass `locals.supabase` from admin `+page.server.ts` so the query runs as
	 * the logged-in user (RLS `authenticated` policies apply). Defaults to the
	 * shared anon client.
	 */
	client?: SupabaseClient<Database>;
}

export interface AdminListResult<T> {
	rows: T[];
	q: string;
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
	loadError: string | null;
}

/**
 * One round trip for the count + one for the page rows.
 * The search term is sanitized inside `buildIlikeOr`, so it cannot break out
 * of the PostgREST filter string.
 */
export async function getAdminList<T>({
	table,
	columns,
	q,
	page,
	orderBy = { column: 'created_at', ascending: false },
	client
}: AdminListOptions): Promise<AdminListResult<T>> {
	const term = q ?? '';
	const searchOr = buildIlikeOr(columns, term);
	const supabase = client ?? getSupabase();

	// 1. Count, so pagination math is exact even mid-navigation.
	const countQuery = supabase.from(table).select('id', { count: 'exact', head: true });
	const countRes = await (searchOr ? countQuery.or(searchOr) : countQuery);
	if (countRes.error) console.error(`[admin/${table}] count error:`, countRes.error);

	const total = countRes.count ?? 0;
	const safePage = clampPage(parsePage(page), total, PER_PAGE_ADMIN);
	const { from, to } = rangeFor(safePage, PER_PAGE_ADMIN);

	// 2. The requested page of rows.
	const listQuery = supabase
		.from(table)
		.select('*')
		.order(orderBy.column, { ascending: orderBy.ascending ?? false })
		.range(from, to);

	const { data, error } = await (searchOr ? listQuery.or(searchOr) : listQuery);
	if (error) console.error(`[admin/${table}] list error:`, error);

	return {
		rows: (data ?? []) as T[],
		// Sanitized term, so the UI reflects what was actually searched.
		q: sanitizeSearchTerm(term),
		page: safePage,
		perPage: PER_PAGE_ADMIN,
		total,
		totalPages: totalPagesFor(total, PER_PAGE_ADMIN),
		loadError: error ? error.message : null
	};
}
