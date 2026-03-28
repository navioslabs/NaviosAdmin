import { supabase } from "@/lib/supabase";

/** ダッシュボードKPI統計を取得 */
export async function fetchDashboardStats() {
  const { data, error } = await supabase.rpc("admin_get_today_stats");
  if (error) throw error;
  // RPCは1行返す
  return data?.[0] ?? data;
}

/** 投稿数推移を取得（日別） */
export async function fetchPostsTrend(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: posts, error: postsErr } = await supabase
    .from("posts")
    .select("created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const { data: talks, error: talksErr } = await supabase
    .from("talks")
    .select("created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (postsErr) throw postsErr;
  if (talksErr) throw talksErr;

  // 日別に集計
  const map = new Map<string, { posts: number; talks: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    map.set(key, { posts: 0, talks: 0 });
  }

  for (const p of posts ?? []) {
    const key = p.created_at.slice(0, 10);
    const entry = map.get(key);
    if (entry) entry.posts++;
  }
  for (const t of talks ?? []) {
    const key = t.created_at.slice(0, 10);
    const entry = map.get(key);
    if (entry) entry.talks++;
  }

  return Array.from(map.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

/** カテゴリ別投稿数を取得 */
export async function fetchCategoryBreakdown() {
  const { data, error } = await supabase
    .from("posts")
    .select("category");
  if (error) throw error;

  const counts: Record<string, number> = { lifeline: 0, event: 0, help: 0 };
  for (const row of data ?? []) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }

  return Object.entries(counts).map(([category, count]) => ({
    category,
    count,
  }));
}

/** 最新投稿5件を取得 */
export async function fetchRecentPosts(limit = 5) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, author_id, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** 最新通報5件を取得 */
export async function fetchRecentReports(limit = 5) {
  const { data, error } = await supabase
    .from("reports")
    .select("id, target_type, reason, detail, created_at, status, reporter_id, profiles!reports_reporter_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
