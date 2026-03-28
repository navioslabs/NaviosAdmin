-- 初期管理者を登録（RLSポリシーが効く前に直接INSERT）
-- 注意: admin_usersテーブル作成直後、RLSが有効になる前に実行すること
-- もしくは Supabase SQL Editor（Service Role）で実行

INSERT INTO public.admin_users (user_id, role)
VALUES ('507abed1-3815-4a43-8b4c-3e48429bcb58', 'admin')
ON CONFLICT (user_id) DO NOTHING;
