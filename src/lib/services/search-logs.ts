import { supabase } from "@/lib/supabase";

export interface SearchLogEntry {
  query: string;
  count: number;
}

export interface SearchTrend {
  date: string;
  count: number;
}

/** 検索キーワードランキングを取得 */
export async function fetchSearchRanking(
  days = 30,
  limit = 30,
): Promise<SearchLogEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("search_logs")
    .select("query")
    .gte("created_at", since.toISOString());

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const q = (row.query ?? "").trim().toLowerCase();
    if (q) counts[q] = (counts[q] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** 検索数の日別推移を取得 */
export async function fetchSearchTrend(days = 30): Promise<SearchTrend[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("search_logs")
    .select("created_at")
    .gte("created_at", since.toISOString());

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }

  const result: SearchTrend[] = [];
  const cursor = new Date(since);
  const today = new Date();
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, count: counts[key] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/** 検索ログの総数を取得 */
export async function fetchSearchCount(days = 30): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { count, error } = await supabase
    .from("search_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since.toISOString());

  if (error) throw error;
  return count ?? 0;
}
