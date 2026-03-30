import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  MessageCircle,
  Users,
  AlertTriangle,
  Settings,
  Moon,
  Sun,
  BarChart3,
  MapPin,
  Crown,
  Megaphone,
  Upload,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";

const MAIN_NAV = [
  { title: "ダッシュボード", path: "/", icon: LayoutDashboard, badge: false },
  { title: "投稿管理", path: "/posts", icon: FileText, badge: false },
  { title: "ひとこと管理", path: "/talks", icon: MessageCircle, badge: false },
  { title: "ユーザー管理", path: "/users", icon: Users, badge: false },
  { title: "通報管理", path: "/reports", icon: AlertTriangle, badge: true },
];

const INSIGHTS_NAV = [
  { title: "分析", path: "/analytics", icon: BarChart3 },
  { title: "エリアマップ", path: "/area-map", icon: MapPin },
  { title: "ランキング", path: "/ranking", icon: Crown },
];

const TOOLS_NAV = [
  { title: "お知らせ配信", path: "/announcements", icon: Megaphone },
  { title: "一括登録", path: "/bulk-import", icon: Upload },
  { title: "設定", path: "/settings", icon: Settings },
];

interface AppSidebarProps {
  pendingReports?: number;
}

export function AppSidebar({ pendingReports = 0 }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src="/logo.svg"
            alt="Navios"
            className="size-9 rounded-xl shadow-md shadow-primary/20"
          />
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold tracking-tight">Navios Admin</p>
            <p className="text-[11px] text-muted-foreground">管理画面</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* メイン */}
        <SidebarGroup>
          <SidebarGroupLabel>管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    render={<Link to={item.path} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.badge && pendingReports > 0 && (
                    <SidebarMenuBadge className="bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {pendingReports}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* インサイト */}
        <SidebarGroup>
          <SidebarGroupLabel>インサイト</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {INSIGHTS_NAV.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    render={<Link to={item.path} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ツール */}
        <SidebarGroup>
          <SidebarGroupLabel>ツール</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TOOLS_NAV.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    render={<Link to={item.path} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        {/* ダークモードトグル */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === "dark" ? "ライトモード" : "ダークモード"}
              onClick={toggle}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
              <span>{theme === "dark" ? "ライトモード" : "ダークモード"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* ユーザー情報 */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {user?.email}
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
