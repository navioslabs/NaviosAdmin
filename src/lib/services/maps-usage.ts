import { supabase } from "@/lib/supabase";

export interface MapsApiLog {
  id: number;
  user_id: string | null;
  api_type: string;
  query: string | null;
  results: number;
  status: string;
  created_at: string;
}

export interface DailyCount {
  date: string;
  count: number;
  cost: number;
}

export interface MapsUsageSummary {
  /** 今月の合計リクエスト数 */
  totalRequests: number;
  /** 今月の推定コスト */
  totalCost: number;
  /** 今日のリクエスト数 */
  todayRequests: number;
  /** 日別リクエスト数（過去30日） */
  daily: DailyCount[];
  /** ステータス別の件数 */
  byStatus: { status: string; count: number }[];
  /** 直近のログ */
  recentLogs: MapsApiLog[];
}

/** Places Autocomplete の単価（$2.83/1000リクエスト） */
const COST_PER_REQUEST = 2.83 / 1000;

/** Google Maps API使用状況を取得 */
export async function fetchMapsUsage(): Promise<MapsUsageSummary> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [monthRes, recentRes] = await Promise.all([
    supabase
      .from("maps_api_logs")
      .select("id, status, created_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
    supabase
      .from("maps_api_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const logs = monthRes.data ?? [];
  const recentLogs = (recentRes.data ?? []) as MapsApiLog[];

  // 今月のリクエスト数
  const monthLogs = logs.filter((l) => l.created_at >= monthStart);
  const totalRequests = monthLogs.length;
  const totalCost = totalRequests * COST_PER_REQUEST;

  // 今日のリクエスト数
  const todayRequests = logs.filter((l) => l.created_at >= todayStart).length;

  // 日別集計
  const dailyMap = new Map<string, number>();
  for (const log of logs) {
    const date = log.created_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
  }

  // 過去30日分の日付を埋める
  const daily: DailyCount[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const count = dailyMap.get(date) ?? 0;
    daily.push({ date, count, cost: count * COST_PER_REQUEST });
  }

  // ステータス別集計
  const statusMap = new Map<string, number>();
  for (const log of monthLogs) {
    statusMap.set(log.status, (statusMap.get(log.status) ?? 0) + 1);
  }
  const byStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return { totalRequests, totalCost, todayRequests, daily, byStatus, recentLogs };
}
