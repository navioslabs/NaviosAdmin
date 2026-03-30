import { Bell, AlertTriangle, FileText, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RealtimeEvent } from "@/hooks/use-realtime";

const EVENT_ICONS: Record<string, typeof Bell> = {
  report: AlertTriangle,
  post: FileText,
  talk: MessageCircle,
};

const EVENT_COLORS: Record<string, string> = {
  report: "text-red-500 bg-red-500/10",
  post: "text-emerald-500 bg-emerald-500/10",
  talk: "text-violet-500 bg-violet-500/10",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分��`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  return `${Math.floor(hr / 24)}日前`;
}

interface NotificationPanelProps {
  events: RealtimeEvent[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export function NotificationPanel({
  events,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
}: NotificationPanelProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="relative flex size-8 items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 max-h-96 overflow-auto p-0"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">通知</span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Check className="size-3" />
              すべて既読
            </button>
          )}
        </div>

        {/* イベントリスト */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Bell className="size-5" />
            <p className="text-sm">通知はありません</p>
          </div>
        ) : (
          <div className="divide-y">
            {events.slice(0, 20).map((evt) => {
              const Icon = EVENT_ICONS[evt.type] ?? Bell;
              const colorClass = EVENT_COLORS[evt.type] ?? "text-muted-foreground bg-muted";
              return (
                <button
                  key={evt.id}
                  onClick={() => onMarkRead(evt.id)}
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                    !evt.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`mt-0.5 rounded-lg p-1.5 ${colorClass}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{evt.title}</span>
                      {!evt.read && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {evt.body}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {timeAgo(evt.timestamp)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
