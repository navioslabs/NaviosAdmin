import { useState } from "react";
import { Link } from "react-router";
import { useAsync } from "@/hooks/use-async";
import { fetchSegmentSummary, fetchSegmentUsers, type SegmentType } from "@/lib/services/segments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { UsersRound, Zap, UserCheck, UserPlus, AlertTriangle, UserX } from "lucide-react";

const SEGMENT_ICONS: Record<SegmentType, typeof Zap> = {
  power: Zap,
  active: UserCheck,
  new: UserPlus,
  at_risk: AlertTriangle,
  dormant: UserX,
};

export function SegmentsPage() {
  const [activeSegment, setActiveSegment] = useState<SegmentType | null>(null);
  const summary = useAsync(() => fetchSegmentSummary(), []);
  const users = useAsync(
    () => (activeSegment ? fetchSegmentUsers(activeSegment) : Promise.resolve([])),
    [activeSegment],
  );

  const totalUsers = summary.data?.reduce((s, seg) => s + seg.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ユーザーセグメント</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ユーザーを行動パターンで自動分類
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 円グラフ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UsersRound className="size-4 text-primary" />
              <CardTitle>セグメント分布</CardTitle>
            </div>
            <CardDescription>全 {totalUsers.toLocaleString()} ユーザー</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.loading ? (
              <Skeleton className="h-64" />
            ) : summary.data ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={summary.data.filter((s) => s.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="label"
                    onClick={(_, i) => {
                      const seg = summary.data!.filter((s) => s.count > 0)[i];
                      setActiveSegment(seg.segment);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {summary.data.filter((s) => s.count > 0).map((s) => (
                      <Cell key={s.segment} fill={s.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}人`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        {/* セグメントカード */}
        <div className="space-y-3">
          {summary.loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            : summary.data?.map((seg) => {
                const Icon = SEGMENT_ICONS[seg.segment];
                const isActive = activeSegment === seg.segment;
                const pct = totalUsers > 0 ? ((seg.count / totalUsers) * 100).toFixed(1) : "0";
                return (
                  <button
                    key={seg.segment}
                    onClick={() => setActiveSegment(seg.segment)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                      isActive ? "ring-2 ring-primary/30 bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${seg.color}15` }}
                    >
                      <Icon className="size-4" style={{ color: seg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{seg.label}</span>
                        <span className="text-xs text-muted-foreground">{seg.description}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: seg.color }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums">{seg.count.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">{pct}%</p>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* セグメント別ユーザー一覧 */}
      {activeSegment && (
        <Card>
          <CardHeader>
            <CardTitle>
              {summary.data?.find((s) => s.segment === activeSegment)?.label} ユーザー
            </CardTitle>
            <CardDescription>
              {summary.data?.find((s) => s.segment === activeSegment)?.description} ・
              最大50件表示
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : users.data && users.data.length > 0 ? (
              <div className="space-y-1">
                {users.data.map((u) => (
                  <Link
                    key={u.id}
                    to={`/users/${u.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {u.display_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        投稿 {u.posts_count} ・ ひとこと {u.talks_count}
                        {u.last_activity && (
                          <> ・ 最終: {new Date(u.last_activity).toLocaleDateString("ja-JP")}</>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[11px]">
                      {new Date(u.created_at).toLocaleDateString("ja-JP")}登録
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={UsersRound} title="該当ユーザーがいません" />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
