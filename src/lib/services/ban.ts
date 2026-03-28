import { supabase } from "@/lib/supabase";

/** Hono API経由でユーザーをBAN */
export async function banUser(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("未認証です");

  const res = await fetch(`/api/users/${userId}/ban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "BAN処理に失敗しました");
  }
}

/** Hono API経由でユーザーのBANを解除 */
export async function unbanUser(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("未認証です");

  const res = await fetch(`/api/users/${userId}/unban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "BAN解除に失敗しました");
  }
}
