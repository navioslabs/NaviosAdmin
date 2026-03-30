import { FileText, Users, AlertTriangle, Trophy, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router";

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
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      ringColor: "ring-emerald-500/20",
      link: "/posts",
    },
    {
      title: "アクティブユーザー",
      value: data.active_users_this_month,
      change: userChange,
      sub: `前月 ${data.active_users_last_month}`,
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      ringColor: "ring-violet-500/20",
      link: "/users",
    },
    {
      title: "未対応の通報",
      value: data.pending_reports,
      change: null,
      sub: data.pending_reports > 0 ? "要対応" : "すべて対応済み",
      icon: AlertTriangle,
      color: data.pending_reports > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
      bg: data.pending_reports > 0 ? "bg-red-500/10" : "bg-green-500/10",
      ringColor: data.pending_reports > 0 ? "ring-red-500/20" : "ring-green-500/20",
      link: "/reports",
    },
    {
      title: "殿堂入りトーク",
      value: data.hall_of_fame_count,
      change: null,
      sub: "累計",
      icon: Trophy,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      ringColor: "ring-amber-500/20",
      link: "/talks",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.title}
          to={card.link}
          className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:${card.ringColor}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {card.title}
            </span>
            <div className={`rounded-xl p-2.5 ${card.bg} transition-transform duration-200 group-hover:scale-110`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              {card.value.toLocaleString()}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {card.change && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${
                    card.change.positive
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
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
          </div>
          <div className="absolute bottom-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-60">
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
