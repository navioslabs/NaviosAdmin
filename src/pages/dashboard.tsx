import { useAsync } from "@/hooks/use-async";
import {
  fetchDashboardStats,
  fetchPostsTrend,
  fetchCategoryBreakdown,
  fetchRecentPosts,
  fetchRecentReports,
} from "@/lib/services/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PostsTrendChart } from "@/components/dashboard/posts-trend-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentPostsList } from "@/components/dashboard/recent-posts-list";
import { RecentReportsList } from "@/components/dashboard/recent-reports-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Activity } from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const stats = useAsync(() => fetchDashboardStats(), []);
  const trend = useAsync(() => fetchPostsTrend(30), []);
  const categories = useAsync(() => fetchCategoryBreakdown(), []);
  const recentPosts = useAsync(() => fetchRecentPosts(5), []);
  const recentReports = useAsync(() => fetchRecentReports(5), []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "おはようございます";
    if (h < 18) return "こんにちは";
    return "お疲れさまです";
  })();

  return (
    <div className="space-y-6">
      {/* ウェルカムバナー */}
      <div className="relative overflow-hidden rounded-2xl glass glow-primary-sm p-6">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-20 -right-20 size-52 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-1">
            <Activity className="size-4" />
            <span className="text-glow">DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}、{user?.email?.split("@")[0] ?? "管理者"}さん
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Navios の最新状況をご確認ください
          </p>
        </div>
      </div>

      {/* KPI カード */}
      {stats.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : stats.data ? (
        <KpiCards data={stats.data} />
      ) : null}

      {/* チャートエリア */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {trend.loading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : trend.data ? (
            <PostsTrendChart data={trend.data} />
          ) : null}
        </div>
        <div>
          {categories.loading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : categories.data ? (
            <CategoryChart data={categories.data} />
          ) : null}
        </div>
      </div>

      {/* 最新データ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentPostsList
          data={recentPosts.data ?? []}
          loading={recentPosts.loading}
        />
        <RecentReportsList
          data={recentReports.data ?? []}
          loading={recentReports.loading}
        />
      </div>
    </div>
  );
}
