import { useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { fetchMapsUsage } from "@/lib/services/maps-usage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MapPin, DollarSign, Zap, CalendarDays, AlertTriangle, Clock } from "lucide-react";

/** $200/月 の無料枠 */
const FREE_TIER_LIMIT = 200;

export function MapsUsagePage() {
  const { data, loading, error } = useAsync(() => fetchMapsUsage(), []);
  const [showAll, setShowAll] = useState(false);

  const budgetPct = data ? Math.min((data.totalCost / FREE_TIER_LIMIT) * 100, 100) : 0;
  const isBudgetWarning = budgetPct > 60;
  const isBudgetDanger = budgetPct > 80;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Maps API 利用状況</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Places Autocomplete の使用量とコスト（無料枠: $200/月）
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

      {/* サマリーカード */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Zap}
            iconColor="text-blue-500 bg-blue-500/10"
            label="今月のリクエスト数"
            value={data.totalRequests.toLocaleString()}
            sub="回"
          />
          <KpiCard
            icon={DollarSign}
            iconColor="text-emerald-500 bg-emerald-500/10"
            label="今月の推定コスト"
            value={`$${data.totalCost.toFixed(2)}`}
            sub={`/ $${FREE_TIER_LIMIT} 無料枠`}
          />
          <KpiCard
            icon={CalendarDays}
            iconColor="text-violet-500 bg-violet-500/10"
            label="今日のリクエスト数"
            value={data.todayRequests.toLocaleString()}
            sub="回"
          />
          <KpiCard
            icon={MapPin}
            iconColor="text-amber-500 bg-amber-500/10"
            label="単価"
            value="$2.83"
            sub="/ 1,000 リクエスト"
          />
        </div>
      ) : null}

      {/* 予算バー */}
      {!loading && data && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">無料枠の消費</p>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">${data.totalCost.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">/ ${FREE_TIER_LIMIT}</span>
                {isBudgetDanger ? (
                  <Badge variant="destructive" className="text-[11px] rounded-full">
                    {budgetPct.toFixed(0)}%
                  </Badge>
                ) : isBudgetWarning ? (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-[11px] rounded-full">
                    {budgetPct.toFixed(0)}%
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 text-[11px] rounded-full">
                    {budgetPct.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isBudgetDanger ? "bg-red-500" : isBudgetWarning ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日別チャート */}
      {loading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : data ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <CardTitle>日別リクエスト数</CardTitle>
            </div>
            <CardDescription>過去30日間の推移</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(v) => String(v)}
                  formatter={(value) => [`${value} 回`, "リクエスト"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    background: "var(--card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="リクエスト"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#gradRequests)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* ステータス別 + 直近ログ */}
      {!loading && data && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ステータス別 */}
          <Card>
            <CardHeader>
              <CardTitle>ステータス別</CardTitle>
              <CardDescription>今月のレスポンス内訳</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">データなし</p>
              ) : (
                <div className="space-y-3">
                  {data.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${s.status === "OK" ? "bg-emerald-500" : s.status === "ZERO_RESULTS" ? "bg-amber-500" : "bg-red-500"}`} />
                        <span className="text-sm font-mono">{s.status}</span>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground">{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 直近ログ */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <CardTitle>直近のリクエスト</CardTitle>
              </div>
              <CardDescription>最新50件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">日時</th>
                      <th className="pb-2 font-medium text-muted-foreground">クエリ</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">結果数</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAll ? data.recentLogs : data.recentLogs.slice(0, 10)).map((log) => (
                      <tr key={log.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2 text-muted-foreground tabular-nums whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("ja-JP", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 max-w-48 truncate">{log.query ?? "-"}</td>
                        <td className="py-2 text-right tabular-nums">{log.results}</td>
                        <td className="py-2 text-right">
                          <Badge
                            variant="outline"
                            className={`text-[10px] rounded-full ${
                              log.status === "OK"
                                ? "border-green-500/50 text-green-600 dark:text-green-400"
                                : log.status === "ZERO_RESULTS"
                                  ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
                                  : "border-red-500/50 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.recentLogs.length > 10 && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    すべて表示（{data.recentLogs.length}件）
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: typeof MapPin;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  const [iconText, iconBg] = iconColor.split(" ");
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className={`size-4 ${iconText}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
