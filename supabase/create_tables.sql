-- Run this file in Supabase SQL Editor.
-- Gallery posts table
create table if not exists public.gallery_posts (
  id bigserial primary key,
  user_name text not null default '名無しのBSH',
  anon_id text not null,
  content text not null default '',
  image_url text not null,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stories table
create table if not exists public.stories (
  id bigserial primary key,
  user_name text not null default '名無しのBSH',
  anon_id text not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

-- Optional indexes
create index if not exists idx_gallery_posts_created_at on public.gallery_posts (created_at desc);
create index if not exists idx_stories_created_at on public.stories (created_at desc);
create index if not exists idx_stories_expires_at on public.stories (expires_at);

-- Optional RLS setup (recommended)
alter table public.gallery_posts enable row level security;
alter table public.stories enable row level security;

-- Development-friendly policies (anon can read/write)
drop policy if exists "gallery read all" on public.gallery_posts;
create policy "gallery read all"
on public.gallery_posts
for select
using (true);

drop policy if exists "gallery insert all" on public.gallery_posts;
create policy "gallery insert all"
on public.gallery_posts
for insert
with check (true);

drop policy if exists "stories read all" on public.stories;
create policy "stories read all"
on public.stories
for select
using (true);

drop policy if exists "stories insert all" on public.stories;
create policy "stories insert all"
on public.stories
for insert
with check (true);
