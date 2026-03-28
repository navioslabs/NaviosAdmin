import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "@/constants/reports";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>最新通報</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((report) => {
              const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
              return (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {REPORT_REASON_LABELS[report.reason as ReportReasonId] ??
                      report.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.display_name ?? "不明"} ・{" "}
                    {new Date(report.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    report.status === "pending"
                      ? "border-destructive text-destructive"
                      : ""
                  }
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
