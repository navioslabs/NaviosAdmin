import { supabase } from "@/lib/supabase";

export interface UsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isVerified?: boolean | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/** ユーザー一覧を取得 */
export async function fetchUsers({
  page = 1,
  pageSize = 20,
  search,
  isVerified,
  sortBy = "created_at",
  sortDir = "desc",
}: UsersQuery = {}) {
  let query = supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, location_text, is_verified, is_public, created_at, updated_at", {
      count: "exact",
    })
    .order(sortBy, { ascending: sortDir === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("display_name", `%${search}%`);
  }
  if (isVerified !== null && isVerified !== undefined) {
    query = query.eq("is_verified", isVerified);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

/** ユーザー詳細を取得 */
export async function fetchUser(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/** ユーザーのバッジを取得 */
export async function fetchUserBadges(userId: string) {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** ユーザーの投稿統計を取得 */
export async function fetchUserStats(userId: string) {
  const [postsRes, talksRes, likesRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
    supabase
      .from("talks")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
    supabase
      .from("posts")
      .select("likes_count")
      .eq("author_id", userId),
  ]);

  const totalLikes =
    (likesRes.data ?? []).reduce(
      (sum, p) => sum + (p.likes_count ?? 0),
      0,
    );

  return {
    postsCount: postsRes.count ?? 0,
    talksCount: talksRes.count ?? 0,
    totalLikes,
  };
}

/** is_verified を切り替え */
export async function toggleVerified(id: string, isVerified: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", id);
  if (error) throw error;
}

/** ユーザーをロック（is_locked を切り替え） */
export async function toggleLocked(id: string, isLocked: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_locked: isLocked })
    .eq("id", id);
  if (error) throw error;
}
