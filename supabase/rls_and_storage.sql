-- ═══════════════════════════════════════════════════════════════════
-- BSH Times — RLS + Storage ポリシー一括設定
-- Supabase SQL Editor でまるごと実行するニャ
-- anon ロール（未ログインユーザー）で SELECT / INSERT を許可
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- 1. sns_posts
-- ───────────────────────────────────────────
alter table public.sns_posts enable row level security;

drop policy if exists "sns_posts select anon" on public.sns_posts;
create policy "sns_posts select anon"
  on public.sns_posts for select
  using (true);

drop policy if exists "sns_posts insert anon" on public.sns_posts;
create policy "sns_posts insert anon"
  on public.sns_posts for insert
  with check (true);

drop policy if exists "sns_posts update anon" on public.sns_posts;
create policy "sns_posts update anon"
  on public.sns_posts for update
  using (true) with check (true);

drop policy if exists "sns_posts delete anon" on public.sns_posts;
create policy "sns_posts delete anon"
  on public.sns_posts for delete
  using (true);

-- ───────────────────────────────────────────
-- 2. sns_post_likes
-- ───────────────────────────────────────────
alter table public.sns_post_likes enable row level security;

drop policy if exists "sns_post_likes select anon" on public.sns_post_likes;
create policy "sns_post_likes select anon"
  on public.sns_post_likes for select
  using (true);

drop policy if exists "sns_post_likes insert anon" on public.sns_post_likes;
create policy "sns_post_likes insert anon"
  on public.sns_post_likes for insert
  with check (true);

drop policy if exists "sns_post_likes delete anon" on public.sns_post_likes;
create policy "sns_post_likes delete anon"
  on public.sns_post_likes for delete
  using (true);

-- ───────────────────────────────────────────
-- 3. sns_post_comments
-- ───────────────────────────────────────────
alter table public.sns_post_comments enable row level security;

drop policy if exists "sns_post_comments select anon" on public.sns_post_comments;
create policy "sns_post_comments select anon"
  on public.sns_post_comments for select
  using (true);

drop policy if exists "sns_post_comments insert anon" on public.sns_post_comments;
create policy "sns_post_comments insert anon"
  on public.sns_post_comments for insert
  with check (true);

drop policy if exists "sns_post_comments delete anon" on public.sns_post_comments;
create policy "sns_post_comments delete anon"
  on public.sns_post_comments for delete
  using (true);

-- ───────────────────────────────────────────
-- 4. gallery_posts
-- ───────────────────────────────────────────
alter table public.gallery_posts enable row level security;

drop policy if exists "gallery_posts select anon" on public.gallery_posts;
create policy "gallery_posts select anon"
  on public.gallery_posts for select
  using (true);

drop policy if exists "gallery_posts insert anon" on public.gallery_posts;
create policy "gallery_posts insert anon"
  on public.gallery_posts for insert
  with check (true);

drop policy if exists "gallery_posts update anon" on public.gallery_posts;
create policy "gallery_posts update anon"
  on public.gallery_posts for update
  using (true) with check (true);

drop policy if exists "gallery_posts delete anon" on public.gallery_posts;
create policy "gallery_posts delete anon"
  on public.gallery_posts for delete
  using (true);

-- ───────────────────────────────────────────
-- 5. gallery_post_likes
-- ───────────────────────────────────────────
alter table public.gallery_post_likes enable row level security;

drop policy if exists "gallery_post_likes select anon" on public.gallery_post_likes;
create policy "gallery_post_likes select anon"
  on public.gallery_post_likes for select
  using (true);

drop policy if exists "gallery_post_likes insert anon" on public.gallery_post_likes;
create policy "gallery_post_likes insert anon"
  on public.gallery_post_likes for insert
  with check (true);

drop policy if exists "gallery_post_likes delete anon" on public.gallery_post_likes;
create policy "gallery_post_likes delete anon"
  on public.gallery_post_likes for delete
  using (true);

-- ───────────────────────────────────────────
-- 6. gallery_post_comments
-- ───────────────────────────────────────────
alter table public.gallery_post_comments enable row level security;

drop policy if exists "gallery_post_comments select anon" on public.gallery_post_comments;
create policy "gallery_post_comments select anon"
  on public.gallery_post_comments for select
  using (true);

drop policy if exists "gallery_post_comments insert anon" on public.gallery_post_comments;
create policy "gallery_post_comments insert anon"
  on public.gallery_post_comments for insert
  with check (true);

-- ───────────────────────────────────────────
-- 7. stories
-- ───────────────────────────────────────────
alter table public.stories enable row level security;

drop policy if exists "stories select anon" on public.stories;
create policy "stories select anon"
  on public.stories for select
  using (true);

drop policy if exists "stories insert anon" on public.stories;
create policy "stories insert anon"
  on public.stories for insert
  with check (true);


-- ═══════════════════════════════════════════════════════════════════
-- Storage バケットポリシー
-- ※ バケットの作成はダッシュボード > Storage で行うニャ
--   「gallery-media」「story-media」を Public bucket にチェック
--
-- 以下の SQL はそのバケットに対する object レベルの RLS ニャ
-- ═══════════════════════════════════════════════════════════════════

-- gallery-media: 誰でもアップロード（INSERT）＆閲覧（SELECT）
drop policy if exists "gallery-media public select" on storage.objects;
create policy "gallery-media public select"
  on storage.objects for select
  using ( bucket_id = 'gallery-media' );

drop policy if exists "gallery-media public insert" on storage.objects;
create policy "gallery-media public insert"
  on storage.objects for insert
  with check ( bucket_id = 'gallery-media' );

drop policy if exists "gallery-media public update" on storage.objects;
create policy "gallery-media public update"
  on storage.objects for update
  using ( bucket_id = 'gallery-media' );

-- story-media: 誰でもアップロード（INSERT）＆閲覧（SELECT）
drop policy if exists "story-media public select" on storage.objects;
create policy "story-media public select"
  on storage.objects for select
  using ( bucket_id = 'story-media' );

drop policy if exists "story-media public insert" on storage.objects;
create policy "story-media public insert"
  on storage.objects for insert
  with check ( bucket_id = 'story-media' );

drop policy if exists "story-media public update" on storage.objects;
create policy "story-media public update"
  on storage.objects for update
  using ( bucket_id = 'story-media' );
