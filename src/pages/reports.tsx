import { useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, Download } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAsync } from "@/hooks/use-async";
import { downloadCsv } from "@/lib/csv";
import { fetchReports } from "@/lib/services/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "@/constants/reports";
import type { ReportReasonId, ReportStatus } from "@/types";

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "border-destructive text-destructive",
  resolved: "border-green-500 text-green-600",
  dismissed: "border-muted-foreground text-muted-foreground",
};

const TARGET_LABELS: Record<string, string> = {
  feed: "投稿",
  talk: "ひとこと",
  nearby: "近隣情報",
};

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState("");

  const { can } = useAdmin();

  const { data, loading } = useAsync(
    () =>
      fetchReports({
        page,
        status: (statusFilter as ReportStatus) || undefined,
        reason: reasonFilter || undefined,
      }),
    [page, statusFilter, reasonFilter],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">通報管理</h1>
        {can("csv.export") && data && data.data.length > 0 && (
          <Button variant="outline" size="sm" onClick={() =>
            downloadCsv(data.data.map((r) => ({
              ID: r.id, 対象: r.target_type, 理由: r.reason,
              詳細: r.detail ?? "", ステータス: r.status ?? "pending", 通報日: r.created_at,
            })), `reports_${new Date().toISOString().slice(0, 10)}.csv`)
          }><Download className="mr-1 size-4" />CSV出力</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">全ステータス</option>
          <option value="pending">未対応</option>
          <option value="resolved">対応済み</option>
          <option value="dismissed">却下</option>
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">全理由</option>
          {Object.entries(REPORT_REASON_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="通報がありません" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>対象</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>詳細</TableHead>
                  <TableHead className="w-24">通報者</TableHead>
                  <TableHead className="w-20">ステータス</TableHead>
                  <TableHead className="w-28">通報日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((report) => {
                  const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles as { display_name: string } | null;
                  const status = (report.status ?? "pending") as ReportStatus;
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Link to={`/reports/${report.id}`} className="hover:underline">
                          <Badge variant="outline">{TARGET_LABELS[report.target_type] ?? report.target_type}</Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {REPORT_REASON_LABELS[report.reason as ReportReasonId] ?? report.reason}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {report.detail ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{profile?.display_name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[status]}>
                          {REPORT_STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination page={page} pageSize={20} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
