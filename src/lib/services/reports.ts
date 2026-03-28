import { supabase } from "@/lib/supabase";
import type { ReportStatus } from "@/types";

export interface ReportsQuery {
  page?: number;
  pageSize?: number;
  targetType?: string;
  reason?: string;
  status?: ReportStatus;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/** 通報一覧を取得 */
export async function fetchReports({
  page = 1,
  pageSize = 20,
  targetType,
  reason,
  status,
  sortBy = "created_at",
  sortDir = "desc",
}: ReportsQuery = {}) {
  let query = supabase
    .from("reports")
    .select(
      "id, target_type, target_id, reason, detail, status, resolved_by, resolved_at, created_at, reporter_id, profiles!reports_reporter_id_fkey(display_name, avatar_url)",
      { count: "exact" },
    )
    .order(sortBy, { ascending: sortDir === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (targetType) query = query.eq("target_type", targetType);
  if (reason) query = query.eq("reason", reason);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

/** 通報詳細を取得 */
export async function fetchReport(id: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "*, profiles!reports_reporter_id_fkey(id, display_name, avatar_url)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/** 通報のステータスを更新 */
export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  resolvedBy: string,
) {
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** 未対応通報件数を取得 */
export async function fetchPendingReportsCount() {
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}
