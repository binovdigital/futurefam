// ============================================================
// FutureFam — Database types (manual, matches Supabase schema)
// Regenerate with `supabase gen types` when schema changes.
// ============================================================

export type PostCategory = {
	id: number; // bigint
	name: string; // varchar
	slug: string; // varchar
	description: string | null; // text, nullable
	created_at: string; // timestamptz (ISO string)
}

export type PostTag = {
	id: number; // bigint
	name: string; // varchar
	slug: string; // varchar
	created_at: string; // timestamptz
}

export type PostTagRelation = {
	post_id: string; // uuid
	tag_id: number; // bigint
}

export type Post = {
	id: string; // uuid
	title: string; // varchar
	slug: string; // varchar (unique)
	content: string | null; // text (HTML/Markdown rendered as HTML)
	excerpt: string | null; // text
	cover_image: string | null; // text (URL)
	category_id: number | null; // bigint FK -> post_categories.id
	author_id: string | null; // uuid (FK -> auth.users or profiles)
	status: string; // varchar: 'draft' | 'published' | 'archived'
	view_count: number; // int
	published_at: string | null; // timestamptz
	created_at: string; // timestamptz
	updated_at: string; // timestamptz
}

// ---------- Joined / view shapes ----------

/** `posts` + embedded category (via `post_categories(name, slug)`). */
export type PostWithCategory = Post & {
	post_categories: Pick<PostCategory, 'id' | 'name' | 'slug'> | null;
}

/** Tag joined through `post_tag_relations` -> `post_tags`. */
export type PostTagRelationWithTag = PostTagRelation & {
	post_tags: Pick<PostTag, 'id' | 'name' | 'slug'> | null;
}

/** Full detail shape: post + category + tags. */
export type PostDetail = PostWithCategory & {
	tags: Pick<PostTag, 'id' | 'name' | 'slug'>[];
}

/** Minimal shape the UI cards need (keeps components decoupled). */
export type PostCardData = {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	cover_image: string | null;
	view_count: number;
	published_at: string | null;
	created_at: string;
	post_categories: { name: string; slug: string } | null;
}

// ---------- Supabase-js Database generic ----------
// Full shape so generated `$types` infer real Rows (not `never`).
export type Database = {
	public: {
		Tables: {
			post_categories: {
				Row: PostCategory;
				Insert: {
					id?: number;
					name: string;
					slug: string;
					description?: string | null;
					created_at?: string;
				};
				Update: {
					id?: number;
					name?: string;
					slug?: string;
					description?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			post_tags: {
				Row: PostTag;
				Insert: {
					id?: number;
					name: string;
					slug: string;
					created_at?: string;
				};
				Update: {
					id?: number;
					name?: string;
					slug?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			post_tag_relations: {
				Row: PostTagRelation;
				Insert: {
					post_id: string;
					tag_id: number;
				};
				Update: {
					post_id?: string;
					tag_id?: number;
				};
				Relationships: [];
			};
			posts: {
				Row: Post;
				Insert: {
					id?: string;
					title: string;
					slug: string;
					content?: string | null;
					excerpt?: string | null;
					cover_image?: string | null;
					category_id?: number | null;
					author_id?: string | null;
					status?: string;
					view_count?: number;
					published_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					title?: string;
					slug?: string;
					content?: string | null;
					excerpt?: string | null;
					cover_image?: string | null;
					category_id?: number | null;
					author_id?: string | null;
					status?: string;
					view_count?: number;
					published_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: { [_ in never]: never };
		Functions: { [_ in never]: never };
		Enums: { [_ in never]: never };
		CompositeTypes: { [_ in never]: never };
	};
};
