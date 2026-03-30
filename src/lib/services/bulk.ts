import { supabase } from "@/lib/supabase";

/** 投稿を一括削除 */
export async function bulkDeletePosts(ids: string[]): Promise<void> {
  const { error } = await supabase.from("posts").delete().in("id", ids);
  if (error) throw error;
}

/** 投稿を一括で注目設定/解除 */
export async function bulkToggleFeatured(
  ids: string[],
  isFeatured: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .update({ is_featured: isFeatured })
    .in("id", ids);
  if (error) throw error;
}

/** ひとことを一括削除 */
export async function bulkDeleteTalks(ids: string[]): Promise<void> {
  const { error } = await supabase.from("talks").delete().in("id", ids);
  if (error) throw error;
}

/** ユーザーを一括認証済みに設定 */
export async function bulkVerifyUsers(
  ids: string[],
  isVerified: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .in("id", ids);
  if (error) throw error;
}
