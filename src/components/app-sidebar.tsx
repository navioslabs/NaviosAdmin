import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  MessageCircle,
  Users,
  AlertTriangle,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            N
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Navios Admin
          </span>
        </div>
      </SidebarHeader>

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
                    <SidebarMenuBadge className="bg-destructive/10 text-destructive">
                      {pendingReports}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
