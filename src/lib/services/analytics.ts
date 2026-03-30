import { supabase } from "@/lib/supabase";

// ─── ユーザー行動ヒートマップ ──────────────────────────

export interface HeatmapCell {
  day: number; // 0=日 ~ 6=土
  hour: number; // 0~23
  count: number;
}

/** 投稿の時間帯×曜日ヒートマップデータを取得 */
export async function fetchActivityHeatmap(days = 90): Promise<HeatmapCell[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [postsRes, talksRes] = await Promise.all([
    supabase
      .from("posts")
      .select("created_at")
      .gte("created_at", since.toISOString()),
    supabase
      .from("talks")
      .select("created_at")
      .gte("created_at", since.toISOString()),
  ]);

  const allDates = [
    ...(postsRes.data ?? []),
    ...(talksRes.data ?? []),
  ].map((r) => new Date(r.created_at));

  // 7 days × 24 hours の集計マトリクス
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0),
  );

  for (const d of allDates) {
    matrix[d.getDay()][d.getHours()]++;
  }

  const result: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({ day, hour, count: matrix[day][hour] });
    }
  }
  return result;
}

// ─── エリア別分析 ───────────────────────────────────────

export interface AreaPost {
  id: string;
  title: string;
  category: string;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  likes_count: number;
  created_at: string;
}

/** 位置情報付き投稿を取得 */
export async function fetchGeoPostsAll(): Promise<AreaPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, location_text, latitude, longitude, likes_count, created_at")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;
  return (data ?? []) as AreaPost[];
}

/** location_textベースでエリア集計（位置情報がない場合のフォールバック） */
export async function fetchAreaBreakdown(): Promise<
  { area: string; count: number }[]
> {
  const { data, error } = await supabase
    .from("posts")
    .select("location_text");

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const area = row.location_text ?? "不明";
    counts[area] = (counts[area] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// ─── 投稿ランキング ─────────────────────────────────────

export type RankingSort = "likes_count" | "comments_count";
export type RankingPeriod = "all" | "month" | "week";

export interface RankedPost {
  id: string;
  title: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
}

export async function fetchPostRanking(
  sort: RankingSort = "likes_count",
  period: RankingPeriod = "all",
  limit = 30,
): Promise<RankedPost[]> {
  let query = supabase
    .from("posts")
    .select(
      "id, title, category, likes_count, comments_count, created_at, profiles!posts_author_id_fkey(display_name)",
    )
    .order(sort, { ascending: false })
    .limit(limit);

  if (period === "month") {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    query = query.gte("created_at", d.toISOString());
  } else if (period === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    query = query.gte("created_at", d.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RankedPost[];
}

// ─── ユーザーリテンション (おまけ) ──────────────────────

export async function fetchUserGrowth(
  days = 30,
): Promise<{ date: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", since.toISOString());

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }

  const result: { date: string; count: number }[] = [];
  const cursor = new Date(since);
  const today = new Date();
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, count: counts[key] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
