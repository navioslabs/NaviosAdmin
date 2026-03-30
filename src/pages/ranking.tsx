import { useState } from "react";
import { Link } from "react-router";
import { useAsync } from "@/hooks/use-async";
import {
  fetchPostRanking,
  type RankingSort,
  type RankingPeriod,
} from "@/lib/services/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Heart, MessageCircle, Medal } from "lucide-react";
import { CAT_CONFIG } from "@/constants/categories";
import type { CategoryId } from "@/types";

const PERIOD_OPTIONS: { value: RankingPeriod; label: string }[] = [
  { value: "all", label: "全期間" },
  { value: "month", label: "今月" },
  { value: "week", label: "今��" },
];

const SORT_OPTIONS: { value: RankingSort; label: string; icon: typeof Heart }[] = [
  { value: "likes_count", label: "いいね順", icon: Heart },
  { value: "comments_count", label: "コメント順", icon: MessageCircle },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-600 dark:text-yellow-400">
        <Crown className="size-4" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-gray-300/20 text-gray-500">
        <Medal className="size-4" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-amber-600/20 text-amber-600 dark:text-amber-500">
        <Medal className="size-4" />
      </div>
    );
  return (
    <div className="flex size-7 items-center justify-center text-sm font-bold text-muted-foreground">
      {rank}
    </div>
  );
}

export function RankingPage() {
  const [sort, setSort] = useState<RankingSort>("likes_count");
  const [period, setPeriod] = useState<RankingPeriod>("all");

  const { data, loading } = useAsync(
    () => fetchPostRanking(sort, period, 30),
    [sort, period],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">投稿ランキング</h1>
        <p className="text-sm text-muted-foreground mt-1">
          人気投稿のランキング表示
        </p>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border p-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <opt.icon className="size-3.5" />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border p-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ランキングリスト */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-primary" />
            <CardTitle>
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}ランキング
            </CardTitle>
          </div>
          <CardDescription>
            {PERIOD_OPTIONS.find((o) => o.value === period)?.label} ・ 上位{" "}
            {data?.length ?? 0} 件
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-1">
              {data.map((post, i) => {
                const cat = CAT_CONFIG[post.category as CategoryId];
                const profile = Array.isArray(post.profiles)
                  ? post.profiles[0]
                  : post.profiles;
                return (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60 ${
                      i < 3 ? "bg-primary/3" : ""
                    }`}
                  >
                    <RankBadge rank={i + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile?.display_name ?? "不明"} ・{" "}
                        {new Date(post.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {cat && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[11px]"
                          style={{ borderColor: cat.color, color: cat.color }}
                        >
                          {cat.label}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm tabular-nums">
                        <Heart
                          className={`size-3.5 ${
                            sort === "likes_count"
                              ? "fill-red-400 text-red-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        {post.likes_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm tabular-nums">
                        <MessageCircle
                          className={`size-3.5 ${
                            sort === "comments_count"
                              ? "fill-blue-400 text-blue-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        {post.comments_count}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              この期間の投稿はありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
