import { supabase } from "@/lib/supabase";

export type SegmentType = "active" | "dormant" | "new" | "power" | "at_risk";

export interface UserSegment {
  id: string;
  display_name: string;
  avatar_url: string | null;
  segment: SegmentType;
  posts_count: number;
  talks_count: number;
  last_activity: string | null;
  created_at: string;
}

export interface SegmentSummary {
  segment: SegmentType;
  count: number;
  label: string;
  description: string;
  color: string;
}

const SEGMENT_DEFS: Omit<SegmentSummary, "count">[] = [
  { segment: "power", label: "パワーユーザー", description: "月10件以上投稿", color: "#8B5CF6" },
  { segment: "active", label: "アクティブ", description: "過去30日以内に投稿", color: "#00D4A1" },
  { segment: "new", label: "新規", description: "登録30日以内", color: "#3B82F6" },
  { segment: "at_risk", label: "離脱リスク", description: "30〜60日投稿なし", color: "#F59E0B" },
  { segment: "dormant", label: "休眠", description: "60日以上投稿なし", color: "#EF4444" },
];

/** ユーザーセグメント集計を取得 */
export async function fetchSegmentSummary(): Promise<SegmentSummary[]> {
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);

  // 全ユーザーと投稿データを取得
  const [profilesRes, postsRes, talksRes] = await Promise.all([
    supabase.from("profiles").select("id, created_at"),
    supabase.from("posts").select("author_id, created_at"),
    supabase.from("talks").select("author_id, created_at"),
  ]);

  const profiles = profilesRes.data ?? [];
  const posts = postsRes.data ?? [];
  const talks = talksRes.data ?? [];

  // ユーザーごとの最終投稿日と月間投稿数を集計
  const userActivity: Record<string, { lastActivity: Date | null; monthCount: number }> = {};

  for (const p of profiles) {
    userActivity[p.id] = { lastActivity: null, monthCount: 0 };
  }

  for (const post of [...posts, ...talks]) {
    const uid = post.author_id;
    if (!userActivity[uid]) continue;
    const date = new Date(post.created_at);
    if (!userActivity[uid].lastActivity || date > userActivity[uid].lastActivity!) {
      userActivity[uid].lastActivity = date;
    }
    if (date >= d30) {
      userActivity[uid].monthCount++;
    }
  }

  // セグメント振り分け
  const counts: Record<SegmentType, number> = {
    power: 0, active: 0, new: 0, at_risk: 0, dormant: 0,
  };

  for (const p of profiles) {
    const act = userActivity[p.id];
    const createdAt = new Date(p.created_at);

    if (act.monthCount >= 10) {
      counts.power++;
    } else if (act.lastActivity && act.lastActivity >= d30) {
      counts.active++;
    } else if (createdAt >= d30) {
      counts.new++;
    } else if (act.lastActivity && act.lastActivity >= d60) {
      counts.at_risk++;
    } else {
      counts.dormant++;
    }
  }

  return SEGMENT_DEFS.map((def) => ({
    ...def,
    count: counts[def.segment],
  }));
}

/** セグメント別ユーザー一覧を取得 */
export async function fetchSegmentUsers(
  segment: SegmentType,
  limit = 50,
): Promise<UserSegment[]> {
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);

  const [profilesRes, postsRes, talksRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, created_at"),
    supabase.from("posts").select("author_id, created_at"),
    supabase.from("talks").select("author_id, created_at"),
  ]);

  const profiles = profilesRes.data ?? [];
  const allActivity = [...(postsRes.data ?? []), ...(talksRes.data ?? [])];

  // ユーザーごと集計
  const userStats: Record<string, { lastActivity: Date | null; postsCount: number; talksCount: number; monthCount: number }> = {};
  for (const p of profiles) {
    userStats[p.id] = { lastActivity: null, postsCount: 0, talksCount: 0, monthCount: 0 };
  }

  for (const item of postsRes.data ?? []) {
    if (!userStats[item.author_id]) continue;
    userStats[item.author_id].postsCount++;
    const d = new Date(item.created_at);
    if (!userStats[item.author_id].lastActivity || d > userStats[item.author_id].lastActivity!) {
      userStats[item.author_id].lastActivity = d;
    }
    if (d >= d30) userStats[item.author_id].monthCount++;
  }
  for (const item of talksRes.data ?? []) {
    if (!userStats[item.author_id]) continue;
    userStats[item.author_id].talksCount++;
    const d = new Date(item.created_at);
    if (!userStats[item.author_id].lastActivity || d > userStats[item.author_id].lastActivity!) {
      userStats[item.author_id].lastActivity = d;
    }
    if (d >= d30) userStats[item.author_id].monthCount++;
  }

  // フィルタ
  const result: UserSegment[] = [];
  for (const p of profiles) {
    const s = userStats[p.id];
    const createdAt = new Date(p.created_at);
    let userSegment: SegmentType;

    if (s.monthCount >= 10) userSegment = "power";
    else if (s.lastActivity && s.lastActivity >= d30) userSegment = "active";
    else if (createdAt >= d30) userSegment = "new";
    else if (s.lastActivity && s.lastActivity >= d60) userSegment = "at_risk";
    else userSegment = "dormant";

    if (userSegment === segment) {
      result.push({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        segment: userSegment,
        posts_count: s.postsCount,
        talks_count: s.talksCount,
        last_activity: s.lastActivity?.toISOString() ?? null,
        created_at: p.created_at,
      });
    }
    if (result.length >= limit) break;
  }

  return result;
}
