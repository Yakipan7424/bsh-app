-- SNS タイムライン（ニャード）用 — Supabase SQL Editor で実行するニャ
-- gallery と同様に anon キーで開発しやすいポリシーにしてあるニャ

create table if not exists public.sns_posts (
  id bigserial primary key,
  user_name text not null default '名無しのBSH',
  anon_id text not null,
  content text not null default '',
  lang text not null default 'ja',
  translated text not null default '',
  image_url text not null,
  images_urls jsonb not null default '[]'::jsonb,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sns_post_likes (
  id bigserial primary key,
  post_id bigint not null references public.sns_posts(id) on delete cascade,
  anon_id text not null,
  created_at timestamptz not null default now(),
  unique (post_id, anon_id)
);

create table if not exists public.sns_post_comments (
  id bigserial primary key,
  post_id bigint not null references public.sns_posts(id) on delete cascade,
  user_name text not null default '@名無しのBSH',
  anon_id text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sns_posts_created_at on public.sns_posts (created_at desc);
create index if not exists idx_sns_post_likes_post_id on public.sns_post_likes (post_id);
create index if not exists idx_sns_post_comments_post_id_created_at on public.sns_post_comments (post_id, created_at);

alter table public.sns_posts enable row level security;
alter table public.sns_post_likes enable row level security;
alter table public.sns_post_comments enable row level security;

drop policy if exists "sns posts read all" on public.sns_posts;
create policy "sns posts read all"
on public.sns_posts
for select
using (true);

drop policy if exists "sns posts insert all" on public.sns_posts;
create policy "sns posts insert all"
on public.sns_posts
for insert
with check (true);

drop policy if exists "sns posts update all" on public.sns_posts;
create policy "sns posts update all"
on public.sns_posts
for update
using (true)
with check (true);

drop policy if exists "sns posts delete all" on public.sns_posts;
create policy "sns posts delete all"
on public.sns_posts
for delete
using (true);

drop policy if exists "sns likes read all" on public.sns_post_likes;
create policy "sns likes read all"
on public.sns_post_likes
for select
using (true);

drop policy if exists "sns likes insert all" on public.sns_post_likes;
create policy "sns likes insert all"
on public.sns_post_likes
for insert
with check (true);

drop policy if exists "sns likes delete all" on public.sns_post_likes;
create policy "sns likes delete all"
on public.sns_post_likes
for delete
using (true);

drop policy if exists "sns comments read all" on public.sns_post_comments;
create policy "sns comments read all"
on public.sns_post_comments
for select
using (true);

drop policy if exists "sns comments insert all" on public.sns_post_comments;
create policy "sns comments insert all"
on public.sns_post_comments
for insert
with check (true);

drop policy if exists "sns comments delete all" on public.sns_post_comments;
create policy "sns comments delete all"
on public.sns_post_comments
for delete
using (true);

-- ─────────────────────────────────────────────────────────────
-- Step 2: Realtime（ダッシュボードの Replication でも同じことができるニャ）
-- すでにテーブルが publication に入っている場合はエラーになるので、その行はスキップしてニャ
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.sns_posts;
alter publication supabase_realtime add table public.sns_post_likes;
alter publication supabase_realtime add table public.sns_post_comments;
