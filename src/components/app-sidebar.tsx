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

const NAV_ITEMS = [
  { title: "ダッシュボード", path: "/", icon: LayoutDashboard, badge: false },
  { title: "投稿管理", path: "/posts", icon: FileText, badge: false },
  { title: "ひとこと管理", path: "/talks", icon: MessageCircle, badge: false },
  { title: "ユーザー管理", path: "/users", icon: Users, badge: false },
  { title: "通報管理", path: "/reports", icon: AlertTriangle, badge: true },
  { title: "設定", path: "/settings", icon: Settings, badge: false },
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
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md shadow-primary/20">
            N
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold tracking-tight">Navios Admin</p>
            <p className="text-[11px] text-muted-foreground">管理画面</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
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
