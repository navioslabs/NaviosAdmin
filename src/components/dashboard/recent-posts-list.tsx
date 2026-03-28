import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CAT_CONFIG } from "@/constants/categories";
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
        <CardTitle>最新投稿</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((post) => {
              const cat = CAT_CONFIG[post.category as CategoryId];
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              return (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.display_name ?? "不明"} ・{" "}
                      {new Date(post.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  {cat && (
                    <Badge
                      variant="outline"
                      className="ml-2 shrink-0"
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
