import { useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { fetchAuditLogs, type AuditLogEntry } from "@/lib/services/audit-log";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  ScrollText,
  Search,
  Trash2,
  Star,
  Shield,
  UserCheck,
  Ban,
  AlertTriangle,
  Megaphone,
  FileText,
  Image,
  Upload,
} from "lucide-react";

const ACTION_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  "post.delete": { label: "投稿削除", icon: Trash2, color: "text-red-500 bg-red-500/10" },
  "post.feature": { label: "注目設定", icon: Star, color: "text-yellow-500 bg-yellow-500/10" },
  "post.unfeature": { label: "注目解除", icon: Star, color: "text-muted-foreground bg-muted" },
  "post.bulk_delete": { label: "一括削除", icon: Trash2, color: "text-red-500 bg-red-500/10" },
  "talk.delete": { label: "ひとこと削除", icon: Trash2, color: "text-red-500 bg-red-500/10" },
  "talk.hall_of_fame": { label: "殿堂入り", icon: Star, color: "text-amber-500 bg-amber-500/10" },
  "user.verify": { label: "認証付与", icon: UserCheck, color: "text-green-500 bg-green-500/10" },
  "user.unverify": { label: "認証解除", icon: UserCheck, color: "text-muted-foreground bg-muted" },
  "user.ban": { label: "BAN", icon: Ban, color: "text-red-600 bg-red-600/10" },
  "user.unban": { label: "BAN解除", icon: Ban, color: "text-green-500 bg-green-500/10" },
  "report.resolve": { label: "通報解決", icon: AlertTriangle, color: "text-green-500 bg-green-500/10" },
  "report.dismiss": { label: "通報却下", icon: AlertTriangle, color: "text-muted-foreground bg-muted" },
  "admin.add": { label: "管理者追加", icon: Shield, color: "text-violet-500 bg-violet-500/10" },
  "admin.remove": { label: "管理者削除", icon: Shield, color: "text-red-500 bg-red-500/10" },
  "admin.role_change": { label: "権限変更", icon: Shield, color: "text-blue-500 bg-blue-500/10" },
  "announcement.create": { label: "お知らせ作成", icon: Megaphone, color: "text-blue-500 bg-blue-500/10" },
  "announcement.publish": { label: "お知らせ配信", icon: Megaphone, color: "text-green-500 bg-green-500/10" },
  "announcement.delete": { label: "お知らせ削除", icon: Megaphone, color: "text-red-500 bg-red-500/10" },
  "moderation.flag": { label: "自動フラグ", icon: AlertTriangle, color: "text-orange-500 bg-orange-500/10" },
  "banner.create": { label: "バナー作成", icon: Image, color: "text-blue-500 bg-blue-500/10" },
  "banner.update": { label: "バナー更新", icon: Image, color: "text-blue-500 bg-blue-500/10" },
  "banner.delete": { label: "バナー削除", icon: Image, color: "text-red-500 bg-red-500/10" },
  "bulk_import": { label: "一括登録", icon: Upload, color: "text-violet-500 bg-violet-500/10" },
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const { data, loading } = useAsync(
    () =>
      fetchAuditLogs({
        page,
        action: actionFilter || undefined,
        adminEmail: emailFilter || undefined,
      }),
    [page, actionFilter, emailFilter],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">監査ログ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理者のすべての操作履歴
        </p>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="管理者メールで検索"
            value={emailFilter}
            onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">すべてのアクション</option>
          {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* ログ一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScrollText className="size-4 text-primary" />
            <CardTitle>操作履歴</CardTitle>
          </div>
          <CardDescription>全 {data?.total ?? 0} 件</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState icon={ScrollText} title="ログがありません" description="管理者の操作がここに記録されます" />
          ) : (
            <div className="space-y-1">
              {data.data.map((log) => {
                const cfg = ACTION_CONFIG[log.action];
                const Icon = cfg?.icon ?? FileText;
                const [iconColor, iconBg] = (cfg?.color ?? "text-muted-foreground bg-muted").split(" ");
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className={`rounded-lg p-2 ${iconBg}`}>
                      <Icon className={`size-3.5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full text-[11px]">
                          {cfg?.label ?? log.action}
                        </Badge>
                        <span className="text-sm font-medium truncate">{log.detail}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.admin_email} ・ {formatTime(log.created_at)}
                      </p>
                    </div>
                    {log.target_id && (
                      <span className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-24">
                        {log.target_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.total > 30 && (
        <DataTablePagination
          page={page}
          pageSize={30}
          total={data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
