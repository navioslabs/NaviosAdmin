import { useAsync } from "@/hooks/use-async";
import { fetchSearchRanking, fetchSearchTrend, fetchSearchCount } from "@/lib/services/search-logs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, TrendingUp, Hash } from "lucide-react";

export function SearchLogsPage() {
  const ranking = useAsync(() => fetchSearchRanking(30, 30), []);
  const trend = useAsync(() => fetchSearchTrend(30), []);
  const totalCount = useAsync(() => fetchSearchCount(30), []);

  const uniqueKeywords = ranking.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">検索ログ分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ユーザーの検索行動を可視化
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-primary">
              {totalCount.loading ? "..." : (totalCount.data ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">過去30日の検索回数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold tabular-nums">
              {uniqueKeywords}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ユニークキーワード数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold tabular-nums">
              {ranking.data?.[0]?.count ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">最多キーワード検索回数</p>
          </CardContent>
        </Card>
      </div>

      {/* 検索数推移 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <CardTitle>検索数推移</CardTitle>
          </div>
          <CardDescription>過去30日間の日別検索回数</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.loading ? (
            <Skeleton className="h-56" />
          ) : trend.data && trend.data.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend.data}>
                <defs>
                  <linearGradient id="gradSearch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4A1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00D4A1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", fontSize: "12px", background: "var(--card)" }} />
                <Area type="monotone" dataKey="count" name="検索回数" stroke="#00D4A1" strokeWidth={2} fill="url(#gradSearch)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Search} title="検索データがありません" description="ユーザーが検索を行うとここに表示されます" />
          )}
        </CardContent>
      </Card>

      {/* キーワードランキング */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hash className="size-4 text-primary" />
            <CardTitle>検索キーワードランキング</CardTitle>
          </div>
          <CardDescription>過去30日間 ・ 上位{ranking.data?.length ?? 0}件</CardDescription>
        </CardHeader>
        <CardContent>
          {ranking.loading ? (
            <Skeleton className="h-64" />
          ) : !ranking.data || ranking.data.length === 0 ? (
            <EmptyState icon={Search} title="検索データがありません" />
          ) : (
            <div className="space-y-2">
              {ranking.data.map((entry, i) => {
                const maxCount = ranking.data![0].count;
                const pct = (entry.count / maxCount) * 100;
                return (
                  <div key={entry.query} className="flex items-center gap-3">
                    <span className="w-6 text-right text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {entry.query}
                        </span>
                        <Badge variant="secondary" className="text-[11px] rounded-full ml-2">
                          {entry.count}回
                        </Badge>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
