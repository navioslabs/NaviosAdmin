import { useAsync } from "@/hooks/use-async";
import { fetchUsage, type UsageMetric } from "@/lib/services/usage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, HardDrive, Wifi, Users, Zap, Globe, AlertTriangle } from "lucide-react";

// メトリクス表示設定
interface MetricConfig {
  label: string;
  icon: typeof Database;
  color: string;
  format: (v: number) => string;
  limitFormat?: (v: number) => string;
}

const METRIC_CONFIG: Record<string, MetricConfig> = {
  total_db_size_bytes: {
    label: "データベース",
    icon: Database,
    color: "text-emerald-500 bg-emerald-500/10",
    format: formatBytes,
    limitFormat: formatBytes,
  },
  total_storage_size_bytes: {
    label: "ストレージ",
    icon: HardDrive,
    color: "text-blue-500 bg-blue-500/10",
    format: formatBytes,
    limitFormat: formatBytes,
  },
  total_egress_modified: {
    label: "帯域幅",
    icon: Wifi,
    color: "text-violet-500 bg-violet-500/10",
    format: formatBytes,
    limitFormat: formatBytes,
  },
  monthly_active_users: {
    label: "月間アクティブユーザー",
    icon: Users,
    color: "text-amber-500 bg-amber-500/10",
    format: (v) => v.toLocaleString(),
    limitFormat: (v) => v.toLocaleString(),
  },
  monthly_active_sso_users: {
    label: "SSO ユーザー",
    icon: Users,
    color: "text-rose-500 bg-rose-500/10",
    format: (v) => v.toLocaleString(),
    limitFormat: (v) => v.toLocaleString(),
  },
  func_invocations: {
    label: "Edge Functions 実行回数",
    icon: Zap,
    color: "text-orange-500 bg-orange-500/10",
    format: (v) => v.toLocaleString(),
    limitFormat: (v) => v.toLocaleString(),
  },
  realtime_peak_connections: {
    label: "Realtime ピーク接続数",
    icon: Globe,
    color: "text-cyan-500 bg-cyan-500/10",
    format: (v) => v.toLocaleString(),
    limitFormat: (v) => v.toLocaleString(),
  },
  realtime_message_count: {
    label: "Realtime メッセージ数",
    icon: Globe,
    color: "text-teal-500 bg-teal-500/10",
    format: (v) => v.toLocaleString(),
    limitFormat: (v) => v.toLocaleString(),
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function UsageBar({ metric }: { metric: UsageMetric }) {
  const config = METRIC_CONFIG[metric.metric];
  if (!config) return null;

  const pct = metric.limit > 0 ? Math.min((metric.usage / metric.limit) * 100, 100) : 0;
  const isWarning = pct > 80;
  const isDanger = pct > 95;

  const Icon = config.icon;
  const [iconColor, iconBg] = config.color.split(" ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className={`size-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {config.format(metric.usage)}
              {metric.limit > 0 && (
                <> / {(config.limitFormat ?? config.format)(metric.limit)}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {metric.cost > 0 && (
            <Badge variant="outline" className="text-[11px] rounded-full">
              ${metric.cost.toFixed(2)}
            </Badge>
          )}
          {isDanger ? (
            <Badge variant="destructive" className="text-[11px] rounded-full">
              {pct.toFixed(0)}%
            </Badge>
          ) : isWarning ? (
            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-[11px] rounded-full">
              {pct.toFixed(0)}%
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground tabular-nums">
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isDanger
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsagePage() {
  const { data, loading, error } = useAsync(() => fetchUsage(), []);

  const totalCost = data?.usage?.reduce((sum, m) => sum + (m.cost ?? 0), 0) ?? 0;

  // 警告が出ているメトリクスの数
  const warningCount =
    data?.usage?.filter((m) => m.limit > 0 && m.usage / m.limit > 0.8).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supabase 利用状況</h1>
        <p className="text-sm text-muted-foreground mt-1">
          プロジェクトのリソース使用量とコスト
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
          <AlertTriangle className="size-4 shrink-0" />
          <div>
            <p className="font-medium">データの取得に失敗しました</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* プロジェクト情報 */}
      {loading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : data?.project ? (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Database className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{data.project.name}</h2>
                <Badge
                  variant="outline"
                  className={`rounded-full text-[11px] ${
                    data.project.status === "ACTIVE_HEALTHY"
                      ? "border-green-500/50 text-green-600 dark:text-green-400"
                      : "border-amber-500/50 text-amber-600"
                  }`}
                >
                  {data.project.status === "ACTIVE_HEALTHY" ? "正常稼働中" : data.project.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                リージョン: {data.project.region} ・
                作成日: {new Date(data.project.created_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">今月のコスト</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* サマリーカード */}
      {!loading && data?.usage && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold tabular-nums text-primary">
                {data.usage.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">メトリクス数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className={`text-3xl font-bold tabular-nums ${warningCount > 0 ? "text-amber-500" : "text-green-500"}`}>
                {warningCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">警告（80%超）</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold tabular-nums">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">月間コスト</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* メトリクス一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>リソース使用量</CardTitle>
          <CardDescription>
            各リソースの使用量と上限
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : data?.usage ? (
            <div className="space-y-6">
              {data.usage
                .filter((m) => METRIC_CONFIG[m.metric])
                .map((metric) => (
                  <UsageBar key={metric.metric} metric={metric} />
                ))}
              {/* 未知のメトリクスも表示 */}
              {data.usage
                .filter((m) => !METRIC_CONFIG[m.metric])
                .map((metric) => (
                  <div key={metric.metric} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.metric}</span>
                    <span className="tabular-nums">
                      {metric.usage.toLocaleString()}
                      {metric.limit > 0 && <span className="text-muted-foreground"> / {metric.limit.toLocaleString()}</span>}
                    </span>
                  </div>
                ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
