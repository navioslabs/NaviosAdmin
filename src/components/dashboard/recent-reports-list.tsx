import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "@/constants/reports";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ReportReasonId, ReportStatus } from "@/types";

interface RecentReport {
  id: string;
  target_type: string;
  reason: string;
  detail: string | null;
  status: string | null;
  created_at: string;
  profiles: { display_name: string }[] | { display_name: string } | null;
}

export function RecentReportsList({
  data,
  loading,
}: {
  data: RecentReport[];
  loading: boolean;
}) {
  const pendingCount = data.filter((r) => r.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-primary" />
            <CardTitle>最新通報</CardTitle>
            {pendingCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            すべて見る
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <CardDescription>直近の通報 {data.length} 件</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((report) => {
              const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
              return (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {REPORT_REASON_LABELS[report.reason as ReportReasonId] ??
                        report.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {profile?.display_name ?? "不明"} ・{" "}
                      {new Date(report.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full text-[11px] ${
                      report.status === "pending"
                        ? "border-destructive text-destructive"
                        : ""
                    }`}
                  >
                    {REPORT_STATUS_LABELS[(report.status ?? "pending") as ReportStatus]}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
