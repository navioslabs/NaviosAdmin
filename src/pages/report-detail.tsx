import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { fetchReport, updateReportStatus } from "@/lib/services/reports";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "@/constants/reports";
import type { ReportReasonId, ReportStatus } from "@/types";

const TARGET_LABELS: Record<string, string> = {
  feed: "投稿",
  talk: "ひとこと",
  nearby: "近隣情報",
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "border-destructive text-destructive",
  resolved: "border-green-500 text-green-600",
  dismissed: "border-muted-foreground text-muted-foreground",
};

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [action, setAction] = useState<"resolved" | "dismissed" | null>(null);
  const [processing, setProcessing] = useState(false);

  const { data: report, loading } = useAsync(() => fetchReport(id!), [id]);

  const handleUpdateStatus = useCallback(async () => {
    if (!id || !action || !user) return;
    setProcessing(true);
    try {
      await updateReportStatus(id, action, user.id);
      toast(
        action === "resolved" ? "通報を対応済みにしました" : "通報を却下しました",
      );
      setAction(null);
      window.location.reload();
    } catch {
      toast("操作に失敗しました", "error");
    } finally {
      setProcessing(false);
    }
  }, [id, action, user, toast]);

  if (loading) return <Skeleton className="h-64" />;
  if (!report) return <p className="text-muted-foreground">通報が見つかりません</p>;

  const profile = report.profiles as { id: string; display_name: string } | null;
  const status = (report.status ?? "pending") as ReportStatus;

  // 対象コンテンツへのリンク
  const targetLink =
    report.target_type === "feed"
      ? `/posts/${report.target_id}`
      : report.target_type === "talk"
        ? `/talks/${report.target_id}`
        : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/reports")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">通報詳細</h1>
        <Badge variant="outline" className={STATUS_COLORS[status]}>
          {REPORT_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>通報内容</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">対象タイプ: </span>
                  {TARGET_LABELS[report.target_type] ?? report.target_type}
                </div>
                <div>
                  <span className="text-muted-foreground">理由: </span>
                  {REPORT_REASON_LABELS[report.reason as ReportReasonId] ?? report.reason}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">詳細</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {report.detail ?? "（詳細なし）"}
                </p>
              </div>
              <Separator />
              <div className="text-sm">
                <span className="text-muted-foreground">通報者: </span>
                {profile ? (
                  <Link to={`/users/${profile.id}`} className="font-medium hover:underline">
                    {profile.display_name}
                  </Link>
                ) : "不明"}
              </div>
              <div className="text-sm text-muted-foreground">
                通報日: {new Date(report.created_at).toLocaleString("ja-JP")}
              </div>
              {report.resolved_at && (
                <div className="text-sm text-muted-foreground">
                  対応日: {new Date(report.resolved_at).toLocaleString("ja-JP")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 対象コンテンツへのリンク */}
          {targetLink && (
            <Card>
              <CardHeader><CardTitle>対象コンテンツ</CardTitle></CardHeader>
              <CardContent>
                <Link to={targetLink} className="text-sm font-medium text-primary hover:underline">
                  対象の{TARGET_LABELS[report.target_type]}を確認する →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 操作 */}
        <div>
          <Card>
            <CardHeader><CardTitle>操作</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {status === "pending" ? (
                <>
                  <Button variant="outline" onClick={() => setAction("resolved")}>
                    <CheckCircle className="mr-2 size-4 text-green-500" />
                    対応済みにする
                  </Button>
                  <Button variant="outline" onClick={() => setAction("dismissed")}>
                    <XCircle className="mr-2 size-4 text-muted-foreground" />
                    却下する
                  </Button>
                  {targetLink && (
                    <Link
                      to={targetLink}
                      className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                    >
                      <Trash2 className="mr-2 size-4" />
                      対象コンテンツを確認・削除
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  この通報は{REPORT_STATUS_LABELS[status]}です
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!action}
        onOpenChange={(open) => !open && setAction(null)}
        title={action === "resolved" ? "通報を対応済みに" : "通報を却下"}
        description={
          action === "resolved"
            ? "この通報を対応済みに変更します。"
            : "この通報を却下します。対象コンテンツはそのまま残ります。"
        }
        confirmLabel={action === "resolved" ? "対応済みにする" : "却下する"}
        variant={action === "dismissed" ? "default" : "default"}
        onConfirm={handleUpdateStatus}
        loading={processing}
      />
    </div>
  );
}
