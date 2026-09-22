-- ============================================================
-- FutureFam — Supabase SQL: RLS + Storage bucket `post-images`
-- Jalankan di Supabase Dashboard → SQL Editor (sekali saja).
-- ============================================================

-- --- 1. Public read untuk konten published (situs publik) ---
alter table post_categories enable row level security;
alter table post_tags enable row level security;
alter table post_tag_relations enable row level security;
alter table posts enable row level security;

drop policy if exists "public read categories" on post_categories;
create policy "public read categories" on post_categories
  for select to anon using (true);

drop policy if exists "public read tags" on post_tags;
create policy "public read tags" on post_tags
  for select to anon using (true);

drop policy if exists "public read relations" on post_tag_relations;
create policy "public read relations" on post_tag_relations
  for select to anon using (true);

drop policy if exists "public read published" on posts;
create policy "public read published" on posts
  for select to anon using (status = 'published');

-- --- 2. Admin (authenticated) full access ---
-- Sesuaikan jika kamu punya tabel roles; default: semua user login = admin.
drop policy if exists "admin all categories" on post_categories;
create policy "admin all categories" on post_categories
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all tags" on post_tags;
create policy "admin all tags" on post_tags
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all relations" on post_tag_relations;
create policy "admin all relations" on post_tag_relations
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all posts" on posts;
create policy "admin all posts" on posts
  for all to authenticated using (true) with check (true);

-- --- 3. Storage bucket `post-images` (public read, admin write) ---
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read post-images" on storage.objects;
create policy "public read post-images" on storage.objects
  for select to anon using (bucket_id = 'post-images');

drop policy if exists "admin write post-images" on storage.objects;
create policy "admin write post-images" on storage.objects
  for all to authenticated using (bucket_id = 'post-images')
  with check (bucket_id = 'post-images');
