import { FileText, Users, AlertTriangle, Trophy } from "lucide-react";
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

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

export function KpiCards({ data }: { data: KpiData }) {
  const todayTotal = data.posts_today + data.talks_today;
  const yesterdayTotal = data.posts_yesterday + data.talks_yesterday;

  const cards = [
    {
      title: "今日の新規投稿",
      value: todayTotal,
      change: pctChange(todayTotal, yesterdayTotal),
      sub: `投稿 ${data.posts_today} / ひとこと ${data.talks_today}`,
      icon: FileText,
    },
    {
      title: "今月のアクティブユーザー",
      value: data.active_users_this_month,
      change: pctChange(data.active_users_this_month, data.active_users_last_month),
      sub: `前月 ${data.active_users_last_month}`,
      icon: Users,
    },
    {
      title: "未対応の通報",
      value: data.pending_reports,
      change: null,
      sub: data.pending_reports > 0 ? "要対応" : "なし",
      icon: AlertTriangle,
      alert: data.pending_reports > 0,
    },
    {
      title: "殿堂入りトーク",
      value: data.hall_of_fame_count,
      change: null,
      sub: "累計",
      icon: Trophy,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon
              className={`size-4 ${card.alert ? "text-destructive" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {card.change && (
                <span
                  className={
                    card.change.startsWith("+")
                      ? "text-green-600"
                      : card.change.startsWith("-")
                        ? "text-destructive"
                        : ""
                  }
                >
                  {card.change}{" "}
                </span>
              )}
              {card.sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
