import { supabase } from "@/lib/supabase";

export interface UsageMetric {
  metric: string;
  usage: number;
  limit: number;
  cost: number;
  available_in_plan: boolean;
}

export interface ProjectInfo {
  id: string;
  name: string;
  region: string;
  status: string;
  created_at: string;
  database?: {
    host: string;
    version: string;
  };
}

export interface UsageData {
  project: ProjectInfo;
  usage: UsageMetric[];
}

const PROJECT_REF = "ozfmbckvplvyncghvgac";

/** Worker API経由でSupabase Usageを取得（フォールバック付き） */
export async function fetchUsage(): Promise<UsageData> {
  // まずWorker APIを試す
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/usage", {
      headers: {
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && res.ok) {
      return res.json();
    }
  } catch {
    // Worker失敗 → フォールバック
  }

  // フォールバック: Supabase DB から自前で集計
  return fetchUsageFallback();
}

/** Worker未稼働時のフォールバック: DBから直接統計を集計 */
async function fetchUsageFallback(): Promise<UsageData> {
  const [
    postsRes,
    talksRes,
    profilesRes,
    reportsRes,
    commentsRes,
    badgesRes,
    adminRes,
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("talks").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("user_badges").select("id", { count: "exact", head: true }),
    supabase.from("admin_users").select("id", { count: "exact", head: true }),
  ]);

  // 今月のアクティブユーザー（今月投稿したユーザー数）
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [monthPostsRes, monthTalksRes] = await Promise.all([
    supabase
      .from("posts")
      .select("author_id")
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("talks")
      .select("author_id")
      .gte("created_at", monthStart.toISOString()),
  ]);

  const activeUserIds = new Set([
    ...(monthPostsRes.data ?? []).map((r) => r.author_id),
    ...(monthTalksRes.data ?? []).map((r) => r.author_id),
  ]);

  // ストレージ使用量を推定（画像URLの数 × 平均サイズ）
  const [postImages, talkImages] = await Promise.all([
    supabase.from("posts").select("image_urls").not("image_urls", "eq", "{}"),
    supabase.from("talks").select("image_url").not("image_url", "is", null),
  ]);
  const totalImages =
    (postImages.data ?? []).reduce((sum, p) => sum + (p.image_urls?.length ?? 0), 0) +
    (talkImages.data ?? []).filter((t) => t.image_url).length;

  const usage: UsageMetric[] = [
    {
      metric: "total_db_size_bytes",
      usage: (postsRes.count ?? 0) * 2048 + (talksRes.count ?? 0) * 1024 +
             (commentsRes.count ?? 0) * 512 + (profilesRes.count ?? 0) * 1024, // 推定
      limit: 500 * 1024 * 1024, // 500MB Free tier
      cost: 0,
      available_in_plan: true,
    },
    {
      metric: "total_storage_size_bytes",
      usage: totalImages * 500 * 1024, // 推定: 画像1枚あたり500KB
      limit: 1 * 1024 * 1024 * 1024, // 1GB Free tier
      cost: 0,
      available_in_plan: true,
    },
    {
      metric: "monthly_active_users",
      usage: activeUserIds.size,
      limit: 50000,
      cost: 0,
      available_in_plan: true,
    },
    {
      metric: "func_invocations",
      usage: 0,
      limit: 500000,
      cost: 0,
      available_in_plan: true,
    },
    {
      metric: "realtime_peak_connections",
      usage: 0,
      limit: 200,
      cost: 0,
      available_in_plan: true,
    },
  ];

  return {
    project: {
      id: PROJECT_REF,
      name: "Navios",
      region: "ap-northeast-1",
      status: "ACTIVE_HEALTHY",
      created_at: new Date().toISOString(),
    },
    usage,
  };
}

/** テーブルごとのレコード数を取得（詳細表示用） */
export async function fetchTableStats(): Promise<{ table: string; count: number }[]> {
  const tables = ["posts", "talks", "profiles", "comments", "reports", "user_badges", "admin_users", "likes"];
  const results = await Promise.all(
    tables.map(async (table) => {
      const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
      return { table, count: count ?? 0 };
    }),
  );
  return results.sort((a, b) => b.count - a.count);
}
