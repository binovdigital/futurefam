import type { PageServerLoad } from './$types';
import { getSupabase, isSupabaseConfigured } from '$lib/supabase';
import { getMockCards, toCardData } from '$lib/data/posts';
import { SECTION_SLUGS } from '$lib/data/navigation';
import type { PostCardData, PostWithCategory } from '$lib/types/database.types';

// Homepage SSR: one relaxed query, then group by category slug.
// DEBUG (temporary): no `.eq('status')` / ordering until rows load.
// Re-add those filters once Supabase returns real rows.

/** Normalize `post_categories` -> slug strings (handles array or object). */
function categorySlugOf(card: PostCardData): string {
	const rel = card.post_categories as unknown as
		| { slug?: string; name?: string }
		| { slug?: string; name?: string }[]
		| null;
	const first = Array.isArray(rel) ? rel[0] : rel;
	return (first?.slug ?? first?.name ?? '').toLowerCase().trim();
}

function pickBySlugs(cards: PostCardData[], slugs: readonly string[], count: number): PostCardData[] {
	const set = new Set(slugs);
	return cards.filter((c) => set.has(categorySlugOf(c))).slice(0, count);
}

export const load: PageServerLoad = async () => {
	let cards: PostCardData[] = [];
	let dataSource: 'supabase' | 'mock' = 'mock';
	let loadError: string | null = null;

	if (isSupabaseConfigured()) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase.from('posts').select('*, post_categories(name)');

			if (error) console.error('[+page.server] Supabase error:', error);
			if (error) throw error;
			const rows = (data ?? []) as unknown as PostWithCategory[];
			if (rows.length > 0) {
				cards = rows.map(toCardData);
				dataSource = 'supabase';
			} else {
				cards = getMockCards();
				loadError = 'Supabase returned 0 posts — showing mock fallback. Check RLS / table contents.';
			}
		} catch (e) {
			cards = getMockCards();
			loadError = e instanceof Error ? e.message : 'Supabase fetch failed — showing mock fallback.';
		}
	} else {
		cards = getMockCards();
		loadError = 'Supabase env not configured — showing mock fallback.';
	}

	// ---- Homepage sections (grouped by taxonomy) ----
	const [heroMain, heroSideA, heroSideB, ...rest] = cards;

	const futureSkills = pickBySlugs(cards, SECTION_SLUGS.futureSkills, 8);
	const parentingAll = pickBySlugs(cards, SECTION_SLUGS.parenting, 6);
	const tech = pickBySlugs(cards, SECTION_SLUGS.tech, 4);
	const kabar = pickBySlugs(cards, SECTION_SLUGS.kabar, 4);

	// Graceful fallbacks so sections never render empty in mock mode.
	const hero = {
		main: heroMain,
		side: [heroSideA, heroSideB].filter(Boolean) as PostCardData[]
	};
	const future = futureSkills.length > 0 ? futureSkills : cards.slice(0, 6);
	const parenting = {
		list: parentingAll.length > 0 ? parentingAll.slice(0, 4) : rest.slice(0, 4),
		popular: [...cards].slice(0, 5) // TODO: order by view_count when real
	};
	const techGrid = tech.length > 0 ? tech : rest.slice(0, 4);
	const kabarList = kabar.length > 0 ? kabar : [];

	return { hero, future, parenting, techGrid, kabarList, dataSource, loadError };
};

