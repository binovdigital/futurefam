// ============================================================
// FutureFam — Shared query helpers for pagination + search.
// Pure functions only, so they are safe to import from BOTH
// `+page.server.ts` (SSR) and client components.
// ============================================================

/** Rows per page on public archive/search pages. */
export const PER_PAGE_PUBLIC = 9;
/** Rows per page in the admin master tables. */
export const PER_PAGE_ADMIN = 10;

/** `?page=abc` / `?page=-3` / missing -> 1. */
export function parsePage(raw: string | null | undefined): number {
	const n = Number.parseInt(raw ?? '', 10);
	return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Number of pages needed for `count` rows. 0 when there is no row at all. */
export function totalPagesFor(count: number, perPage: number): number {
	if (perPage <= 0 || count <= 0) return 0;
	return Math.ceil(count / perPage);
}

/** PostgREST `.range()` bounds for a 1-based page number. */
export function rangeFor(page: number, perPage: number): { from: number; to: number } {
	const safePage = page > 0 ? page : 1;
	const from = (safePage - 1) * perPage;
	return { from, to: from + perPage - 1 };
}

/**
 * Clamp a requested page into the valid range, so a deep link such as
 * `?page=999` (or a list that shrank after a delete) still renders rows.
 */
export function clampPage(page: number, count: number, perPage: number): number {
	const pages = totalPagesFor(count, perPage);
	const safePage = page > 0 ? page : 1;
	return pages === 0 ? 1 : Math.min(safePage, pages);
}

/**
 * Windowed page numbers with `'gap'` markers for the ellipsis:
 * page 8 of 20 -> [1, 'gap', 6, 7, 8, 9, 10, 'gap', 20]
 */
export function pageList(page: number, totalPages: number, span = 1): (number | 'gap')[] {
	if (totalPages <= 0) return [];
	const wanted = new Set<number>([1, totalPages]);
	for (let p = page - span; p <= page + span; p++) {
		if (p >= 1 && p <= totalPages) wanted.add(p);
	}

	const sorted = [...wanted].sort((a, b) => a - b);
	const out: (number | 'gap')[] = [];
	let previous = 0;
	for (const p of sorted) {
		if (previous !== 0 && p - previous > 1) out.push('gap');
		out.push(p);
		previous = p;
	}
	return out;
}

/**
 * Build a href for another page while preserving every other query param
 * (e.g. `?q=robotika&status=draft`). Page 1 drops the `page` param so the
 * canonical URL stays clean.
 */
export function hrefWithPage(
	pathname: string,
	searchParams: URLSearchParams,
	page: number
): string {
	return hrefWithParams(pathname, searchParams, { page: page > 1 ? page : null });
}

/**
 * General version of {@link hrefWithPage}: apply arbitrary query-param updates
 * while preserving the rest. `null` / `''` removes a param, and page 1 always
 * drops `page` so canonical URLs stay clean.
 */
export function hrefWithParams(
	pathname: string,
	searchParams: URLSearchParams,
	updates: Record<string, string | number | null | undefined> = {}
): string {
	const params = new URLSearchParams(searchParams);
	for (const [key, value] of Object.entries(updates)) {
		if (value === null || value === undefined || value === '' || (key === 'page' && value === 1)) {
			params.delete(key);
		} else {
			params.set(key, String(value));
		}
	}
	const qs = params.toString();
	return qs ? `${pathname}?${qs}` : pathname;
}


/**
 * Make a user supplied search term safe to interpolate into a PostgREST
 * filter string (`.or(...)`, `.ilike(...)`).
 *
 * Whitelist approach: keep letters (any script, so Indonesian is fine),
 * digits, whitespace and hyphen. Everything else is dropped — this removes
 * PostgREST syntax (` , . ( ) " * :` ) and SQL LIKE wildcards (`% _`) so a
 * term such as `a%,b)or(x` can never break out of the filter.
 */
export function sanitizeSearchTerm(raw: string | null | undefined): string {
	if (!raw) return '';
	return raw
		.normalize('NFKC')
		.replace(/[^\p{L}\p{N}\s-]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 80);
}

/**
 * `['title','excerpt'] + "robotika"` ->
 * `"title.ilike.%robotika%,excerpt.ilike.%robotika%"` for `.or(...)`.
 * Returns `null` when the (sanitized) term is empty.
 */
export function buildIlikeOr(columns: readonly string[], term: string): string | null {
	const clean = sanitizeSearchTerm(term);
	if (!clean) return null;
	return columns.map((column) => `${column}.ilike.%${clean}%`).join(',');
}

/**
 * Combine several OR-groups into ONE PostgREST `or` parameter.
 *
 * Calling `.or()` twice appends two `or=` params whose combination semantics
 * are version dependent, so we instead nest: PostgREST evaluates
 * `or=(and(a1,b1),and(a1,b2),…)` which is exactly the expansion of
 * `(a1 OR a2) AND (b1 OR b2)`.
 *
 * Each input group is a comma separated list of alternatives (the shape
 * produced by {@link buildIlikeOr}). Safe for our generators because
 * `sanitizeSearchTerm` strips commas from user input.
 */
export function combineOrGroups(groups: readonly (string | null | undefined)[]): string | null {
	const cleaned = groups
		.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
		.map((g) => g.split(',').map((part) => part.trim()).filter(Boolean))
		.filter((alternatives) => alternatives.length > 0);

	if (cleaned.length === 0) return null;
	if (cleaned.length === 1) return cleaned[0]!.join(',');

	// Cartesian product of the alternatives — at most a handful of combos here.
	let combos: string[][] = [[]];
	for (const alternatives of cleaned) {
		const next: string[][] = [];
		for (const combo of combos) {
			for (const alternative of alternatives) next.push([...combo, alternative]);
		}
		combos = next;
	}

	return combos.map((parts) => `and(${parts.join(',')})`).join(',');
}

/**
 * OR-group matching rows whose `cover_image` is NULL or an empty string —
 * powers the admin "Image Not Set" audit filter. Feed it to
 * {@link combineOrGroups} so it ANDs correctly with the search term.
 */
export function missingCoverFilter(column = 'cover_image'): string {
	return `${column}.is.null,${column}.eq.`;
}

