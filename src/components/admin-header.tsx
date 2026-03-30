import { useLocation, Link } from "react-router";
import { LogOut, User, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { NotificationPanel } from "@/components/notification-panel";
import { useRealtime } from "@/hooks/use-realtime";

const LABELS: Record<string, string> = {
  posts: "投稿管理",
  talks: "ひとこと管理",
  users: "ユーザー管理",
  reports: "通報管理",
  settings: "設定",
  analytics: "分析",
  "area-map": "エリアマップ",
  ranking: "ランキング",
  announcements: "お知らせ配信",
  "bulk-import": "一括登録",
};

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "ダッシュボード", path: "/" }];
  let currentPath = "";
  for (const seg of segments) {
    currentPath += `/${seg}`;
    crumbs.push({ label: LABELS[seg] ?? seg, path: currentPath });
  }
  return crumbs;
}

export function AdminHeader() {
  const { user, signOut } = useAuth();
  const crumbs = useBreadcrumbs();
  const { events, unreadCount, markAllRead, markRead } = useRealtime();

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-4" />

      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <NotificationPanel
          events={events}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex size-8 items-center justify-center rounded-lg hover:bg-accent transition-colors">
                <Avatar className="size-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {user?.email?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={8}>
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/settings" />}>
              <User className="mr-2 size-4" />
              設定
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 size-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
