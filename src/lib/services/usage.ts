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

/** Worker API経由でSupabase Usageを取得 */
export async function fetchUsage(): Promise<UsageData> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch("/api/usage", {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}
