import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

/** バナー一覧を取得 */
export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Banner[];
}

/** バナーを作成 */
export async function createBanner(input: {
  title: string;
  image_url: string;
  link_url?: string;
  sort_order?: number;
  is_active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("banners").insert({
    title: input.title,
    image_url: input.image_url,
    link_url: input.link_url || null,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
    start_at: input.start_at || null,
    end_at: input.end_at || null,
  });
  if (error) throw error;
}

/** バナーを更新 */
export async function updateBanner(
  id: string,
  updates: Partial<Omit<Banner, "id" | "created_at">>,
): Promise<void> {
  const { error } = await supabase
    .from("banners")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

/** バナーを削除 */
export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

/** バナーの有効/無効を切り替え */
export async function toggleBannerActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("banners")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}
