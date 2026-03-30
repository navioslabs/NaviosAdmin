import { useEffect, useRef } from "react";
import { useAsync } from "@/hooks/use-async";
import { fetchGeoPostsAll, fetchAreaBreakdown } from "@/lib/services/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, BarChart3 } from "lucide-react";
import { CAT_CONFIG } from "@/constants/categories";
import type { CategoryId } from "@/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function LeafletMap({ posts }: { posts: { id: string; title: string; category: string; latitude: number | null; longitude: number | null; likes_count: number }[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // デフォルト: 日本の中心付近
    const map = L.map(mapRef.current).setView([35.68, 139.76], 11);
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const catColors: Record<string, string> = {
      lifeline: "#00D4A1",
      event: "#F5A623",
      help: "#F0425C",
    };

    const validPosts = posts.filter((p) => p.latitude != null && p.longitude != null);

    if (validPosts.length > 0) {
      const bounds = L.latLngBounds(
        validPosts.map((p) => [p.latitude!, p.longitude!] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    for (const post of validPosts) {
      const color = catColors[post.category] ?? "#888";
      const marker = L.circleMarker([post.latitude!, post.longitude!], {
        radius: Math.min(6 + post.likes_count * 0.5, 16),
        fillColor: color,
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      const catLabel = CAT_CONFIG[post.category as CategoryId]?.label ?? post.category;
      marker.bindPopup(
        `<div style="font-size:13px"><strong>${post.title}</strong><br/><span style="color:${color}">${catLabel}</span> ・ ${post.likes_count}いいね</div>`,
      );
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [posts]);

  return (
    <div
      ref={mapRef}
      className="h-[500px] w-full rounded-lg"
      style={{ zIndex: 0 }}
    />
  );
}

export function AreaMapPage() {
  const geoPosts = useAsync(() => fetchGeoPostsAll(), []);
  const areaBreakdown = useAsync(() => fetchAreaBreakdown(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">エリア別分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          投稿の地理的分布とエリア別集計
        </p>
      </div>

      {/* 地図 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <CardTitle>投稿マップ</CardTitle>
          </div>
          <CardDescription>
            位置情報付きの投稿 {geoPosts.data?.length ?? 0} 件を表示（円の大きさ = いいね数）
          </CardDescription>
          <div className="flex gap-2 mt-2">
            {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
              <Badge key={id} variant="outline" style={{ borderColor: cfg.color, color: cfg.color }}>
                {cfg.label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {geoPosts.loading ? (
            <Skeleton className="h-[500px] rounded-lg" />
          ) : geoPosts.data ? (
            <LeafletMap posts={geoPosts.data} />
          ) : (
            <div className="flex h-[500px] items-center justify-center text-muted-foreground">
              位置情報付きの投稿がありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* エリア別テーブル */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <CardTitle>エリア別投稿数</CardTitle>
          </div>
          <CardDescription>location_textごとの集計（上位20件）</CardDescription>
        </CardHeader>
        <CardContent>
          {areaBreakdown.loading ? (
            <Skeleton className="h-64" />
          ) : areaBreakdown.data && areaBreakdown.data.length > 0 ? (
            <div className="space-y-2">
              {areaBreakdown.data.map((item, i) => {
                const maxCount = areaBreakdown.data![0].count;
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={item.area} className="flex items-center gap-3">
                    <span className="w-5 text-right text-xs text-muted-foreground font-medium">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="truncate text-sm font-medium">{item.area}</span>
                        <span className="text-sm tabular-nums text-muted-foreground ml-2">
                          {item.count}件
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              エリアデータがありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
