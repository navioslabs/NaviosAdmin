import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CAT_CONFIG } from "@/constants/categories";
import { FileText, ArrowRight } from "lucide-react";
import type { CategoryId } from "@/types";

interface RecentPost {
  id: string;
  title: string;
  category: string;
  created_at: string;
  profiles: { display_name: string }[] | { display_name: string } | null;
}

export function RecentPostsList({
  data,
  loading,
}: {
  data: RecentPost[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <CardTitle>最新投稿</CardTitle>
          </div>
          <Link
            to="/posts"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            すべて見る
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <CardDescription>直近の投稿 {data.length} 件</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((post) => {
              const cat = CAT_CONFIG[post.category as CategoryId];
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              return (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {profile?.display_name ?? "不明"} ・{" "}
                      {new Date(post.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  {cat && (
                    <Badge
                      variant="outline"
                      className="ml-2 shrink-0 rounded-full text-[11px]"
                      style={{ borderColor: cat.color, color: cat.color }}
                    >
                      {cat.label}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
