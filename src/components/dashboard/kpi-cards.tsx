import { FileText, Users, AlertTriangle, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiData {
  posts_today: number;
  posts_yesterday: number;
  talks_today: number;
  talks_yesterday: number;
  active_users_this_month: number;
  active_users_last_month: number;
  pending_reports: number;
  hall_of_fame_count: number;
}

function pctChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) return { text: current > 0 ? "+100%" : "0%", positive: current > 0 };
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct >= 0 };
}

export function KpiCards({ data }: { data: KpiData }) {
  const todayTotal = data.posts_today + data.talks_today;
  const yesterdayTotal = data.posts_yesterday + data.talks_yesterday;
  const postChange = pctChange(todayTotal, yesterdayTotal);
  const userChange = pctChange(data.active_users_this_month, data.active_users_last_month);

  const cards = [
    {
      title: "今日の新規投稿",
      value: todayTotal,
      change: postChange,
      sub: `投稿 ${data.posts_today} / ひとこと ${data.talks_today}`,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "アクティブユーザー",
      value: data.active_users_this_month,
      change: userChange,
      sub: `前月 ${data.active_users_last_month}`,
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      title: "未対応の通報",
      value: data.pending_reports,
      change: null,
      sub: data.pending_reports > 0 ? "要対応" : "すべて対応済み",
      icon: AlertTriangle,
      color: data.pending_reports > 0 ? "text-red-500" : "text-green-500",
      bg: data.pending_reports > 0 ? "bg-red-500/10" : "bg-green-500/10",
    },
    {
      title: "殿堂入りトーク",
      value: data.hall_of_fame_count,
      change: null,
      sub: "累計",
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              {card.value.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {card.change && (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium ${
                    card.change.positive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {card.change.positive ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {card.change.text}
                </span>
              )}
              <span className="text-muted-foreground">{card.sub}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
