import { useState } from "react";
import { useAsync } from "@/hooks/use-async";
import {
  fetchActivityHeatmap,
  fetchUserGrowth,
  type HeatmapCell,
} from "@/lib/services/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Flame, Users } from "lucide-react";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function HeatmapGrid({ data }: { data: HeatmapCell[] }) {
  const maxCount = Math.max(...data.map((c) => c.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-emerald-200 dark:bg-emerald-900/50";
    if (intensity < 0.5) return "bg-emerald-300 dark:bg-emerald-700/60";
    if (intensity < 0.75) return "bg-emerald-400 dark:bg-emerald-600/70";
    return "bg-emerald-500 dark:bg-emerald-500";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* 時間ヘッダー */}
        <div className="flex items-center gap-0.5 mb-1 pl-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] text-muted-foreground"
            >
              {h % 3 === 0 ? `${h}時` : ""}
            </div>
          ))}
        </div>

        {/* グリッド */}
        {DAY_LABELS.map((label, day) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <div className="w-9 text-right text-xs text-muted-foreground pr-1.5">
              {label}
            </div>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = data.find(
                (c) => c.day === day && c.hour === hour,
              );
              const count = cell?.count ?? 0;
              return (
                <div
                  key={hour}
                  className={`flex-1 aspect-square rounded-sm transition-colors ${getColor(count)}`}
                  title={`${label}曜 ${hour}時: ${count}件`}
                />
              );
            })}
          </div>
        ))}

        {/* 凡例 */}
        <div className="flex items-center gap-2 mt-3 pl-10">
          <span className="text-[11px] text-muted-foreground">少</span>
          <div className="flex gap-0.5">
            <div className="size-3 rounded-sm bg-muted" />
            <div className="size-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
            <div className="size-3 rounded-sm bg-emerald-300 dark:bg-emerald-700/60" />
            <div className="size-3 rounded-sm bg-emerald-400 dark:bg-emerald-600/70" />
            <div className="size-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
          </div>
          <span className="text-[11px] text-muted-foreground">多</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [heatmapDays] = useState(90);
  const heatmap = useAsync(() => fetchActivityHeatmap(heatmapDays), [heatmapDays]);
  const growth = useAsync(() => fetchUserGrowth(30), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ユーザー行動とトレンドの可視化
        </p>
      </div>

      {/* ヒートマップ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-primary" />
            <CardTitle>アクティビティヒートマップ</CardTitle>
          </div>
          <CardDescription>
            過去{heatmapDays}日間の投稿アクティビティ（曜日 × 時間帯）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heatmap.loading ? (
            <Skeleton className="h-56" />
          ) : heatmap.data ? (
            <HeatmapGrid data={heatmap.data} />
          ) : null}
        </CardContent>
      </Card>

      {/* ユーザー増加推移 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <CardTitle>新規ユーザー推移</CardTitle>
          </div>
          <CardDescription>過去30日間の新規登録者数</CardDescription>
        </CardHeader>
        <CardContent>
          {growth.loading ? (
            <Skeleton className="h-64" />
          ) : growth.data ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={growth.data}>
                <defs>
                  <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4A1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00D4A1" stopOpacity={0} />
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
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    background: "var(--card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="新規ユーザー"
                  stroke="#00D4A1"
                  strokeWidth={2}
                  fill="url(#gradGrowth)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
