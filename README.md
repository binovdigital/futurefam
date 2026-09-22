# FutureFam — futurefam.web.id

Modern news, article & family-tips frontend. **SvelteKit 2 + Svelte 5 + TypeScript + Tailwind CSS v4 + lucide-svelte**, deployed on Vercel, Supabase-ready.

## Quickstart

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck
npm run build    # production build (adapter-vercel)
```

## Structure

- `src/routes/+layout.svelte` — Navbar + Footer shell
- `src/routes/+page.svelte` — hero + Berita grid + Tips section
- `src/routes/post/[slug]/+page.server.ts` + `+page.svelte` — detail SSR with `prose`
- `src/lib/components/` — Navbar, Footer, ArticleCard
- `src/lib/data/mock.ts` — 6 dummy articles (swap with Supabase)
- `src/lib/supabase.ts` — placeholder client

## Supabase next steps

1. Create `articles` table (see SQL in `supabase.ts` comments).
2. Copy `.env.example` → `.env`, set keys in Vercel too.
3. Replace helpers in `mock.ts` with queries via `getSupabase()`.
