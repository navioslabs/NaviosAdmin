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

export function DashboardPage() {
  const stats = useAsync(() => fetchDashboardStats(), []);
  const trend = useAsync(() => fetchPostsTrend(30), []);
  const categories = useAsync(() => fetchCategoryBreakdown(), []);
  const recentPosts = useAsync(() => fetchRecentPosts(5), []);
  const recentReports = useAsync(() => fetchRecentReports(5), []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {stats.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats.data ? (
        <KpiCards data={stats.data} />
      ) : null}

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
