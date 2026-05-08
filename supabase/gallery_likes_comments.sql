-- Run this in Supabase SQL Editor
-- Likes per gallery post (one like per anon_id per post)
create table if not exists public.gallery_post_likes (
  id bigserial primary key,
  post_id bigint not null references public.gallery_posts(id) on delete cascade,
  anon_id text not null,
  created_at timestamptz not null default now(),
  unique (post_id, anon_id)
);

-- Comments per gallery post
create table if not exists public.gallery_post_comments (
  id bigserial primary key,
  post_id bigint not null references public.gallery_posts(id) on delete cascade,
  user_name text not null default '@名無しのBSH',
  anon_id text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_post_likes_post_id on public.gallery_post_likes (post_id);
create index if not exists idx_gallery_post_comments_post_id_created_at on public.gallery_post_comments (post_id, created_at);

alter table public.gallery_post_likes enable row level security;
alter table public.gallery_post_comments enable row level security;

drop policy if exists "gallery likes read all" on public.gallery_post_likes;
create policy "gallery likes read all"
on public.gallery_post_likes
for select
using (true);

drop policy if exists "gallery likes insert all" on public.gallery_post_likes;
create policy "gallery likes insert all"
on public.gallery_post_likes
for insert
with check (true);

drop policy if exists "gallery likes delete all" on public.gallery_post_likes;
create policy "gallery likes delete all"
on public.gallery_post_likes
for delete
using (true);

drop policy if exists "gallery comments read all" on public.gallery_post_comments;
create policy "gallery comments read all"
on public.gallery_post_comments
for select
using (true);

drop policy if exists "gallery comments insert all" on public.gallery_post_comments;
create policy "gallery comments insert all"
on public.gallery_post_comments
for insert
with check (true);
