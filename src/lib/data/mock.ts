// ============================================================
// FutureFam — Mock data layer
// TODO(Supabase): replace helpers with real queries
// against the `articles` table via `src/lib/supabase.ts`.
// ============================================================

export type ArticleCategory = 'Berita' | 'Artikel' | 'Tips';

export interface Article {
	id: number;
	title: string;
	slug: string;
	excerpt: string;
	/** Full body as HTML string (rendered with {@html} inside prose). */
	content: string;
	image_url: string;
	category: ArticleCategory;
	author: string;
	author_role: string;
	created_at: string;
	read_minutes: number;
	featured?: boolean;
}

export const articles: Article[] = [
	{
		id: 1,
		title: '7 Cara Membangun Rutinitas Pagi yang Menyenangkan untuk Anak',
		slug: 'rutinitas-pagi-menyenangkan-untuk-anak',
		excerpt:
			'Ubah pagi yang rusuh jadi momen bonding: checklist visual, sarapan 15 menit, dan trik bangun tanpa drama.',
		content: `<p>Membangun rutinitas pagi yang konsisten adalah hadiah terbaik untuk anak.</p><h2>1. Checklist bergambar</h2><p>Tempel checklist visual: bangun, gosok gigi, ganti baju, sarapan, sepatu, tas.</p><h2>2. Siapkan malam sebelumnya</h2><p>Pilih baju dan siapkan tas malam hari untuk pagi yang tenang.</p><blockquote>Aturan emas: tidur 30 menit lebih awal membuat anak 2x lebih kooperatif.</blockquote><p>Konsistensi 21 hari mengubah rutinitas menjadi kebiasaan.</p>`,
		image_url:
			'https://images.unsplash.com/photo-1543342384-1f1350e27861?q=80&w=1200&auto=format&fit=crop',
		category: 'Tips',
		author: 'Nadia Prameswari',
		author_role: 'Parenting Writer',
		created_at: '2026-09-18',
		read_minutes: 6,
		featured: true
	},
	{
		id: 2,
		title: 'Pemerintah Luncurkan Program Literasi Digital untuk Keluarga Indonesia',
		slug: 'program-literasi-digital-keluarga-indonesia',
		excerpt:
			'Program baru menargetkan 1 juta keluarga dengan modul keamanan anak online dan keuangan digital.',
		content: `<p>Pemerintah meluncurkan program Literasi Digital Keluarga untuk 1 juta keluarga.</p><h2>Modul utama</h2><ul><li>Keamanan anak online</li><li>Hoaks kesehatan</li><li>Keuangan digital</li></ul><p>Pendaftaran gratis via sekolah, puskesmas, dan posyandu.</p>`,
		image_url:
			'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
		category: 'Berita',
		author: 'Rizky Ramadhan',
		author_role: 'News Editor',
		created_at: '2026-09-20',
		read_minutes: 4
	},
	{
		id: 3,
		title: 'MPASI Pertama: Panduan Lengkap Tekstur per Usia 6-12 Bulan',
		slug: 'mpasi-pertama-panduan-tekstur-6-12-bulan',
		excerpt: 'Dari puree halus hingga finger food — jadwal tekstur, porsi, dan tanda siap naik level.',
		content: `<p>Prinsip MPASI: bertahap, beragam, dan responsif terhadap sinyal bayi.</p><h2>6-7 bulan</h2><p>Mulai 2-3 sdm puree halus 1x sehari, naik bertahap.</p><h2>8-12 bulan</h2><p>Nasi tim, potongan lembut, lalu menu keluarga cincang.</p>`,
		image_url:
			'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop',
		category: 'Artikel',
		author: 'dr. Ayu Lestari',
		author_role: 'Dokter Anak',
		created_at: '2026-09-15',
		read_minutes: 8
	},
	{
		id: 4,
		title: '5 Ide Weekend Hemat tapi Berkesan Bareng Keluarga di Rumah',
		slug: 'ide-weekend-hemat-berkesan-di-rumah',
		excerpt: 'Tak perlu liburan mahal: camping ruang tamu, movie night, dan masak bareng.',
		content: `<p>Anak lebih mengingat ritual kecil yang berulang daripada satu liburan besar.</p><h2>Coba ini</h2><ul><li>Camping ruang tamu</li><li>Movie night tematik</li><li>Masak bareng chef cilik</li></ul>`,
		image_url:
			'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop',
		category: 'Tips',
		author: 'Nadia Prameswari',
		author_role: 'Parenting Writer',
		created_at: '2026-09-12',
		read_minutes: 5
	},
	{
		id: 5,
		title: 'Studi Baru: 20 Menit Membaca Nyaring Dongkrak Kosakata Anak',
		slug: 'studi-membaca-nyaring-dongkrak-kosakata-anak',
		excerpt: 'Riset 2026: read-aloud rutin lebih berpengaruh daripada aplikasi belajar mahal.',
		content: `<p>Membaca nyaring 20 menit sehari melipatgandakan kosakata dalam setahun.</p><p>Kuncinya interaksi: ajak anak berdialog soal cerita.</p>`,
		image_url:
			'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
		category: 'Berita',
		author: 'Rizky Ramadhan',
		author_role: 'News Editor',
		created_at: '2026-09-10',
		read_minutes: 5
	},
	{
		id: 6,
		title: 'Mengelola Screen Time Tanpa Perang: Sistem Token Keluarga',
		slug: 'mengelola-screen-time-sistem-token-keluarga',
		excerpt: 'Tukar aktivitas fisik dan membaca dengan jatah layar yang adil.',
		content: `<p>Sistem token: aktivitas positif ditukar screen time.</p><p>1 token = 15 menit, maksimal 8 token per hari.</p>`,
		image_url:
			'https://images.unsplash.com/photo-1587616211892-f743fcca64f9?q=80&w=1200&auto=format&fit=crop',
		category: 'Tips',
		author: 'Fajar Nugroho',
		author_role: 'Family Coach',
		created_at: '2026-09-08',
		read_minutes: 7
	}
];

/** Format ISO date -> Indonesian readable date. */
export function formatDateID(iso: string): string {
	return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

export function getFeaturedArticle(): Article {
	return articles.find((a) => a.featured) ?? articles[0];
}

export function getLatestArticles(count = 4): Article[] {
	const featured = getFeaturedArticle();
	return [...articles]
		.filter((a) => a.slug !== featured.slug)
		.sort((a, b) => b.created_at.localeCompare(a.created_at))
		.slice(0, count);
}

export function getTipsArticles(count = 3): Article[] {
	return articles.filter((a) => a.category === 'Tips').slice(0, count);
}

export function getArticleBySlug(slug: string): Article | undefined {
	return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, count = 3): Article[] {
	return articles.filter((a) => a.slug !== slug).slice(0, count);
}
