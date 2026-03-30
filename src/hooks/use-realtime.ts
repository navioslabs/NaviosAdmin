import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface RealtimeEvent {
  id: string;
  type: "report" | "post" | "talk" | "user";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

const MAX_EVENTS = 50;

export function useRealtime() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const evt: RealtimeEvent = {
            id: payload.new.id,
            type: "report",
            title: "新規通報",
            body: `通報理由: ${payload.new.reason}`,
            timestamp: payload.new.created_at,
            read: false,
          };
          setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
          setUnreadCount((c) => c + 1);

          if (Notification.permission === "granted") {
            new Notification("Navios Admin - 新規通報", {
              body: evt.body,
              icon: "/logo.svg",
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const evt: RealtimeEvent = {
            id: payload.new.id,
            type: "post",
            title: "新規投稿",
            body: payload.new.title ?? "新しい投稿が作成されました",
            timestamp: payload.new.created_at,
            read: false,
          };
          setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
          setUnreadCount((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "talks" },
        (payload) => {
          const evt: RealtimeEvent = {
            id: payload.new.id,
            type: "talk",
            title: "新規ひとこと",
            body: (payload.new.message ?? "").slice(0, 60),
            timestamp: payload.new.created_at,
            read: false,
          };
          setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
          setUnreadCount((c) => c + 1);
        },
      )
      .subscribe();

    channelRef.current = channel;

    // ブラウザ通知許可をリクエスト
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const markAllRead = useCallback(() => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  return { events, unreadCount, markAllRead, markRead };
}
