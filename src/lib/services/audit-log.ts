import { supabase } from "@/lib/supabase";

export type AuditAction =
  | "post.delete"
  | "post.feature"
  | "post.unfeature"
  | "post.bulk_delete"
  | "talk.delete"
  | "talk.hall_of_fame"
  | "user.verify"
  | "user.unverify"
  | "user.ban"
  | "user.unban"
  | "report.resolve"
  | "report.dismiss"
  | "admin.add"
  | "admin.remove"
  | "admin.role_change"
  | "announcement.create"
  | "announcement.publish"
  | "announcement.delete"
  | "moderation.flag"
  | "banner.create"
  | "banner.update"
  | "banner.delete"
  | "bulk_import";

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: AuditAction;
  target_type: string;
  target_id: string | null;
  detail: string;
  created_at: string;
}

/** 監査ログを記録 */
export async function writeAuditLog(
  adminId: string,
  adminEmail: string,
  action: AuditAction,
  targetType: string,
  targetId: string | null,
  detail: string,
): Promise<void> {
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    detail,
  });
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  adminEmail?: string;
}

/** 監査ログ一覧を取得 */
export async function fetchAuditLogs({
  page = 1,
  pageSize = 30,
  action,
  adminEmail,
}: AuditLogQuery = {}): Promise<{ data: AuditLogEntry[]; total: number }> {
  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (action) query = query.eq("action", action);
  if (adminEmail) query = query.ilike("admin_email", `%${adminEmail}%`);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data ?? []) as AuditLogEntry[], total: count ?? 0 };
}
