import { supabase } from "@/lib/supabase";

export interface TalksQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isHallOfFame?: boolean | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/** ひとこと一覧を取得 */
export async function fetchTalks({
  page = 1,
  pageSize = 20,
  search,
  isHallOfFame,
  sortBy = "created_at",
  sortDir = "desc",
}: TalksQuery = {}) {
  let query = supabase
    .from("talks")
    .select(
      "id, message, image_url, image_urls, location_text, likes_count, replies_count, tags, is_hall_of_fame, created_at, author_id, profiles!talks_author_id_fkey(display_name, avatar_url)",
      { count: "exact" },
    )
    .order(sortBy, { ascending: sortDir === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("message", `%${search}%`);
  }
  if (isHallOfFame !== null && isHallOfFame !== undefined) {
    query = query.eq("is_hall_of_fame", isHallOfFame);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

/** ひとこと詳細を取得 */
export async function fetchTalk(id: string) {
  const { data, error } = await supabase
    .from("talks")
    .select("*, profiles!talks_author_id_fkey(id, display_name, avatar_url)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/** リプライ一覧を取得 */
export async function fetchTalkReplies(talkId: string) {
  const { data, error } = await supabase
    .from("talk_replies")
    .select("*, profiles!talk_replies_author_id_fkey(display_name, avatar_url)")
    .eq("talk_id", talkId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** 殿堂入りを切り替え */
export async function toggleHallOfFame(id: string, isHallOfFame: boolean) {
  const { error } = await supabase
    .from("talks")
    .update({ is_hall_of_fame: isHallOfFame })
    .eq("id", id);
  if (error) throw error;
}

/** ひとことを削除 */
export async function deleteTalk(id: string) {
  const { error } = await supabase.from("talks").delete().eq("id", id);
  if (error) throw error;
}

/** リプライを削除 */
export async function deleteReply(id: string) {
  const { error } = await supabase
    .from("talk_replies")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
