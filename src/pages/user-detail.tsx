import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, ShieldCheck, Award } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { fetchUser, fetchUserBadges, fetchUserStats, toggleVerified } from "@/lib/services/users";
import { useToast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BADGE_LABELS } from "@/constants/badges";
import type { BadgeType } from "@/types";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: user, loading } = useAsync(() => fetchUser(id!), [id]);
  const { data: badges } = useAsync(() => fetchUserBadges(id!), [id]);
  const { data: stats } = useAsync(() => fetchUserStats(id!), [id]);

  const handleToggleVerified = async () => {
    if (!user) return;
    try {
      await toggleVerified(user.id, !user.is_verified);
      toast(!user.is_verified ? "認証済みに設定" : "認証を解除");
      window.location.reload();
    } catch {
      toast("操作に失敗しました", "error");
    }
  };

  if (loading) return <Skeleton className="h-64" />;
  if (!user) return <p className="text-muted-foreground">ユーザーが見つかりません</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/users")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">ユーザー詳細</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* プロフィール */}
          <Card>
            <CardHeader><CardTitle>プロフィール</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="text-lg">{user.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{user.display_name}</h2>
                    {user.is_verified && (
                      <Badge variant="secondary"><ShieldCheck className="mr-1 size-3" />認証済</Badge>
                    )}
                  </div>
                  {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}
                  {user.location_text && <p className="text-sm text-muted-foreground">{user.location_text}</p>}
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">公開設定:</span> {user.is_public ? "公開" : "非公開"}</div>
                <div><span className="text-muted-foreground">位置表示:</span> {user.show_location ? "ON" : "OFF"}</div>
                <div><span className="text-muted-foreground">登録日:</span> {new Date(user.created_at).toLocaleDateString("ja-JP")}</div>
                <div><span className="text-muted-foreground">更新日:</span> {new Date(user.updated_at).toLocaleDateString("ja-JP")}</div>
              </div>
            </CardContent>
          </Card>

          {/* バッジ一覧 */}
          <Card>
            <CardHeader><CardTitle>バッジ ({badges?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {!badges?.length ? (
                <p className="text-sm text-muted-foreground">バッジなし</p>
              ) : (
                <div className="space-y-2">
                  {badges.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-md border p-3">
                      <Award className="size-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {BADGE_LABELS[b.badge_type as BadgeType]} — {b.area_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          獲得日: {new Date(b.earned_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>統計</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>投稿数</span><span className="font-bold">{stats?.postsCount ?? 0}</span></div>
              <div className="flex justify-between"><span>ひとこと数</span><span className="font-bold">{stats?.talksCount ?? 0}</span></div>
              <div className="flex justify-between"><span>獲得いいね</span><span className="font-bold">{stats?.totalLikes ?? 0}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>操作</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleToggleVerified}>
                <ShieldCheck className={`mr-2 size-4 ${user.is_verified ? "text-blue-500" : ""}`} />
                {user.is_verified ? "認証を解除" : "認証済みに設定"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
