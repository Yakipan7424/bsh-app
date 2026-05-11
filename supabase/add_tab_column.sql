-- ═══════════════════════════════════════════════════════════════
-- sns_posts に tab カラムを追加するニャ
-- Supabase SQL Editor で実行してニャ
-- ═══════════════════════════════════════════════════════════════

-- 1. カラム追加（既存の行は 'nyad' になるニャ）
alter table public.sns_posts
  add column if not exists tab text not null default 'nyad'
  check (tab in ('nyad', 'nyat'));

-- 2. tab ごとにフィルタしやすいようにインデックスを追加
create index if not exists idx_sns_posts_tab_created_at
  on public.sns_posts (tab, created_at desc);
