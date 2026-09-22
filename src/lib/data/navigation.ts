// ============================================================
// FutureFam — Site taxonomy (single source of truth for nav +
// homepage sections). Child `slug` refers to `post_categories.slug`.
// Group `href` points to homepage section anchors (no dead links).
// ============================================================

export interface NavChild {
	label: string;
	/** category slug in DB (lowercase, e.g. 'coding') */
	slug: string;
	href: string;
}

export interface NavGroup {
	label: string;
	tagline: string;
	href: string; // section anchor
	children: NavChild[];
}

function child(label: string, slug: string, sectionHref: string): NavChild {
	return { label, slug, href: `${sectionHref}` };
}

export const NAV_GROUPS: NavGroup[] = [
	{
		label: 'Future Skills',
		tagline: 'Bekal anak masa depan',
		href: '/#future-skills',
		children: [
			child('Coding', 'coding', '/#future-skills'),
			child('Robotika', 'robotika', '/#future-skills'),
			child('Sains', 'sains', '/#future-skills'),
			child('Matematika', 'matematika', '/#future-skills'),
			child('Astronomi', 'astronomi', '/#future-skills')
		]
	},
	{
		label: 'Parenting',
		tagline: 'Zona orang tua',
		href: '/#parenting',
		children: [
			child('Digital Parenting', 'digital-parenting', '/#parenting'),
			child('Psikologi', 'psikologi', '/#parenting'),
			child('Keuangan', 'keuangan', '/#parenting'),
			child('Special Needs', 'special-needs', '/#parenting')
		]
	},
	{
		label: 'Tech & Insight',
		tagline: 'Eksplorasi teknologi',
		href: '/#tech',
		children: [
			child('AI', 'ai', '/#tech'),
			child('Web Dev', 'web-dev', '/#tech'),
			child('Game Dev', 'game-dev', '/#tech'),
			child('Cyber Security', 'cyber-security', '/#tech')
		]
	},
	{
		label: 'Kabar & Inspirasi',
		tagline: 'Berita & cerita baik',
		href: '/#kabar',
		children: [
			child('Berita', 'berita', '/#kabar'),
			child('Opini', 'opini', '/#kabar'),
			child('Event', 'event', '/#kabar'),
			child('Review', 'review', '/#kabar')
		]
	}
];

/** slug sets per homepage section (normalized, lowercase). */
export const SECTION_SLUGS = {
	futureSkills: ['coding', 'robotika', 'sains', 'matematika', 'astronomi'],
	parenting: ['digital-parenting', 'psikologi', 'keuangan', 'special-needs', 'tips', 'parenting'],
	tech: ['ai', 'web-dev', 'game-dev', 'cyber-security', 'artikel', 'teknologi'],
	kabar: ['berita', 'opini', 'event', 'review', 'kabar']
} as const;

// ---------- Flat top-5 nav (high-converting "edu-hype" categories) ----------

export interface TopCategoryLink {
	label: string;
	slug: string;
	href: string;
}

export const TOP_CATEGORY_LINKS: TopCategoryLink[] = [
	{ label: 'Coding Anak', slug: 'coding-anak', href: '/kategori/coding-anak' },
	{ label: 'Robotika', slug: 'robotika', href: '/kategori/robotika' },
	{ label: 'Digital Parenting', slug: 'digital-parenting', href: '/kategori/digital-parenting' },
	{ label: 'Sains & Eksperimen', slug: 'sains-eksperimen', href: '/kategori/sains-eksperimen' },
	{ label: 'Pola Asuh', slug: 'psikologi-pola-asuh', href: '/kategori/psikologi-pola-asuh' }
];
