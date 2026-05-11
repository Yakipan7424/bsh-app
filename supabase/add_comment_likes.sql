-- ═══════════════════════════════════════════════════════════════
-- sns_post_comments にいいね機能を追加するニャ
-- Supabase SQL Editor で実行してニャ
-- ═══════════════════════════════════════════════════════════════

-- 1. コメントに likes_count カラムを追加
alter table public.sns_post_comments
  add column if not exists likes_count integer not null default 0;

-- 2. コメントいいねの記録テーブル
create table if not exists public.sns_comment_likes (
  id bigint generated always as identity primary key,
  comment_id bigint not null references public.sns_post_comments(id) on delete cascade,
  anon_id text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, anon_id)
);

-- 3. インデックス
create index if not exists idx_sns_comment_likes_comment
  on public.sns_comment_likes (comment_id);
create index if not exists idx_sns_comment_likes_anon
  on public.sns_comment_likes (anon_id, comment_id);

-- 4. RLS ポリシー（anon OK）
alter table public.sns_comment_likes enable row level security;

drop policy if exists "anon_select_comment_likes" on public.sns_comment_likes;
create policy "anon_select_comment_likes" on public.sns_comment_likes
  for select using (true);

drop policy if exists "anon_insert_comment_likes" on public.sns_comment_likes;
create policy "anon_insert_comment_likes" on public.sns_comment_likes
  for insert with check (true);

drop policy if exists "anon_delete_comment_likes" on public.sns_comment_likes;
create policy "anon_delete_comment_likes" on public.sns_comment_likes
  for delete using (true);
