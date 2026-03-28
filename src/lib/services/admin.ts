import { supabase } from "@/lib/supabase";
import type { AdminRole } from "@/types";

/** 現在のユーザーの管理者ロールを取得 */
export async function fetchCurrentAdminRole(
  userId: string,
): Promise<AdminRole | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data?.role as AdminRole;
}

/** 管理者一覧を取得 */
export async function fetchAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select(
      "id, user_id, role, created_at, profiles!admin_users_user_id_fkey(display_name, avatar_url)",
    )
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** 管理者を追加 */
export async function addAdminUser(userId: string, role: AdminRole) {
  const { error } = await supabase
    .from("admin_users")
    .insert({ user_id: userId, role });
  if (error) throw error;
}

/** 管理者のロールを変更 */
export async function updateAdminRole(id: string, role: AdminRole) {
  const { error } = await supabase
    .from("admin_users")
    .update({ role })
    .eq("id", id);
  if (error) throw error;
}

/** 管理者を削除 */
export async function removeAdminUser(id: string) {
  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
