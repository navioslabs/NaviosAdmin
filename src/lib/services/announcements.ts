import { supabase } from "@/lib/supabase";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  target: "all" | "area";
  target_area: string | null;
  published_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  target: "all" | "area";
  target_area?: string | null;
  publish_now?: boolean;
}

/** お知らせ一覧を取得 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Announcement[];
}

/** お知らせを作成 */
export async function createAnnouncement(
  input: CreateAnnouncementInput,
  userId: string,
): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title,
      body: input.body,
      target: input.target,
      target_area: input.target === "area" ? input.target_area : null,
      published_at: input.publish_now ? new Date().toISOString() : null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Announcement;
}

/** お知らせを配信（published_at を設定） */
export async function publishAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from("announcements")
    .update({ published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** お知らせを削除 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
