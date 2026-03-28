import { useLocation, Link } from "react-router";
import { Bell, LogOut, User } from "lucide-react";
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

/** パスからパンくずを生成 */
function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    posts: "投稿管理",
    talks: "ひとこと管理",
    users: "ユーザー管理",
    reports: "通報管理",
    settings: "設定",
  };

  const crumbs = [{ label: "ダッシュボード", path: "/" }];
  let currentPath = "";

  for (const seg of segments) {
    currentPath += `/${seg}`;
    crumbs.push({
      label: labels[seg] ?? seg,
      path: currentPath,
    });
  }

  return crumbs;
}

interface AdminHeaderProps {
  pendingReports?: number;
}

export function AdminHeader({ pendingReports = 0 }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const crumbs = useBreadcrumbs();

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* パンくずリスト */}
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* 通報アラートベル */}
        <Link to="/reports" className="relative">
          <Button variant="ghost" size="icon-sm">
            <Bell className="size-4" />
          </Button>
          {pendingReports > 0 && (
            <span className="absolute -top-0.5 right-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {pendingReports > 9 ? "9+" : pendingReports}
            </span>
          )}
        </Link>

        {/* ユーザーメニュー */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                <Avatar className="size-6">
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={8}>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/settings" />}>
              <User className="mr-2 size-4" />
              プロフィール
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
