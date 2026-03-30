import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";
import { AdminLayout } from "@/components/admin-layout";
import { LoginPage } from "@/pages/login";

const DashboardPage = lazy(() => import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage })));
const PostsPage = lazy(() => import("@/pages/posts").then((m) => ({ default: m.PostsPage })));
const PostDetailPage = lazy(() => import("@/pages/post-detail").then((m) => ({ default: m.PostDetailPage })));
const TalksPage = lazy(() => import("@/pages/talks").then((m) => ({ default: m.TalksPage })));
const TalkDetailPage = lazy(() => import("@/pages/talk-detail").then((m) => ({ default: m.TalkDetailPage })));
const UsersPage = lazy(() => import("@/pages/users").then((m) => ({ default: m.UsersPage })));
const UserDetailPage = lazy(() => import("@/pages/user-detail").then((m) => ({ default: m.UserDetailPage })));
const ReportsPage = lazy(() => import("@/pages/reports").then((m) => ({ default: m.ReportsPage })));
const ReportDetailPage = lazy(() => import("@/pages/report-detail").then((m) => ({ default: m.ReportDetailPage })));
const SettingsPage = lazy(() => import("@/pages/settings").then((m) => ({ default: m.SettingsPage })));
const AnalyticsPage = lazy(() => import("@/pages/analytics").then((m) => ({ default: m.AnalyticsPage })));
const AreaMapPage = lazy(() => import("@/pages/area-map").then((m) => ({ default: m.AreaMapPage })));
const RankingPage = lazy(() => import("@/pages/ranking").then((m) => ({ default: m.RankingPage })));
const AnnouncementsPage = lazy(() => import("@/pages/announcements").then((m) => ({ default: m.AnnouncementsPage })));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <span className="text-sm text-muted-foreground">読み込み中...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="Navios" className="size-12 rounded-xl animate-pulse" />
          <div className="size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="posts/:id" element={<PostDetailPage />} />
              <Route path="talks" element={<TalksPage />} />
              <Route path="talks/:id" element={<TalkDetailPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="area-map" element={<AreaMapPage />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
