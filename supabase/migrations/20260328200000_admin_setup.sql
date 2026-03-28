-- =============================================================
-- NaviosAdmin 管理画面用スキーマ
-- 既存テーブルを壊さないように追加のみ
-- =============================================================

-- ===== 1. admin_users テーブル =====
-- 管理画面のロール管理用

CREATE TABLE IF NOT EXISTS public.admin_users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role       text        NOT NULL CHECK (role IN ('admin', 'manager', 'staff')) DEFAULT 'staff',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users (user_id);

-- RLS: 管理者のみ閲覧可能
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_select" ON public.admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users)
  );

-- admin ロールのみ INSERT/UPDATE/DELETE 可能
CREATE POLICY "admin_users_insert" ON public.admin_users
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin')
  );

CREATE POLICY "admin_users_update" ON public.admin_users
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin')
  );

CREATE POLICY "admin_users_delete" ON public.admin_users
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin')
  );


-- ===== 2. reports テーブルに対応状況カラムを追加 =====

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed'));

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);


-- ===== 3. 管理者用RLSポリシー =====
-- admin_users に登録されたユーザーが全テーブルを閲覧できるポリシー

-- 管理者かどうかを判定するヘルパー関数
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- profiles: 管理者は全プロフィールを閲覧可能
CREATE POLICY "admin_profiles_select" ON public.profiles
  FOR SELECT USING (public.is_admin_user());

-- profiles: manager以上は編集可能（is_verified等）
CREATE POLICY "admin_profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE role IN ('admin', 'manager')
    )
  );

-- posts: 管理者は全投稿を閲覧可能（既存ポリシーに追加）
CREATE POLICY "admin_posts_select" ON public.posts
  FOR SELECT USING (public.is_admin_user());

-- posts: 管理者は投稿を更新可能（is_featured等）
CREATE POLICY "admin_posts_update" ON public.posts
  FOR UPDATE USING (public.is_admin_user());

-- posts: manager以上は投稿を削除可能
CREATE POLICY "admin_posts_delete" ON public.posts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE role IN ('admin', 'manager')
    )
  );

-- talks: 管理者は全トークを閲覧可能
CREATE POLICY "admin_talks_select" ON public.talks
  FOR SELECT USING (public.is_admin_user());

-- talks: 管理者はトークを更新可能（is_hall_of_fame等）
CREATE POLICY "admin_talks_update" ON public.talks
  FOR UPDATE USING (public.is_admin_user());

-- talks: manager以上はトークを削除可能
CREATE POLICY "admin_talks_delete" ON public.talks
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE role IN ('admin', 'manager')
    )
  );

-- comments: 管理者は全コメントを閲覧・削除可能
CREATE POLICY "admin_comments_select" ON public.comments
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "admin_comments_delete" ON public.comments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE role IN ('admin', 'manager')
    )
  );

-- talk_replies: 管理者は全リプライを閲覧・削除可能
CREATE POLICY "admin_talk_replies_select" ON public.talk_replies
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "admin_talk_replies_delete" ON public.talk_replies
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE role IN ('admin', 'manager')
    )
  );

-- reports: 管理者は全通報を閲覧可能
CREATE POLICY "admin_reports_select" ON public.reports
  FOR SELECT USING (public.is_admin_user());

-- reports: manager以上は通報を更新可能（ステータス変更）
CREATE POLICY "admin_reports_update" ON public.reports
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE role IN ('admin', 'manager')
    )
  );

-- likes: 管理者は全いいねを閲覧可能
CREATE POLICY "admin_likes_select" ON public.likes
  FOR SELECT USING (public.is_admin_user());

-- notifications: 管理者は全通知を閲覧可能
CREATE POLICY "admin_notifications_select" ON public.notifications
  FOR SELECT USING (public.is_admin_user());

-- user_badges: 管理者は全バッジを閲覧可能（既存ポリシーで全員閲覧可能だが念のため）
CREATE POLICY "admin_user_badges_select" ON public.user_badges
  FOR SELECT USING (public.is_admin_user());


-- ===== 4. 管理者用統計RPC =====

-- 今日の新規投稿数を取得
CREATE OR REPLACE FUNCTION public.admin_get_today_stats()
RETURNS TABLE (
  posts_today bigint,
  posts_yesterday bigint,
  talks_today bigint,
  talks_yesterday bigint,
  active_users_this_month bigint,
  active_users_last_month bigint,
  pending_reports bigint,
  hall_of_fame_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM posts WHERE created_at >= CURRENT_DATE),
    (SELECT COUNT(*) FROM posts WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE),
    (SELECT COUNT(*) FROM talks WHERE created_at >= CURRENT_DATE),
    (SELECT COUNT(*) FROM talks WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE),
    (SELECT COUNT(DISTINCT author_id) FROM (
      SELECT author_id FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE)
      UNION
      SELECT author_id FROM talks WHERE created_at >= date_trunc('month', CURRENT_DATE)
    ) active),
    (SELECT COUNT(DISTINCT author_id) FROM (
      SELECT author_id FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < date_trunc('month', CURRENT_DATE)
      UNION
      SELECT author_id FROM talks WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < date_trunc('month', CURRENT_DATE)
    ) active_last),
    (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
    (SELECT COUNT(*) FROM talks WHERE is_hall_of_fame = true);
$$;
