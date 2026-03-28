import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Star, Trash2, MapPin, Clock, Users } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import {
  fetchPost,
  fetchPostComments,
  toggleFeatured,
  deletePost,
  deleteComment,
} from "@/lib/services/posts";
import { useToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CAT_CONFIG } from "@/constants/categories";
import type { CategoryId } from "@/types";

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const { data: post, loading } = useAsync(
    () => fetchPost(id!),
    [id],
  );
  const {
    data: comments,
    loading: commentsLoading,
    refetch: refetchComments,
  } = useAsync(() => fetchPostComments(id!), [id]);

  const handleToggleFeatured = useCallback(async () => {
    if (!post) return;
    try {
      await toggleFeatured(post.id, !post.is_featured);
      toast(
        !post.is_featured ? "注目投稿に設定しました" : "注目投稿を解除しました",
      );
      window.location.reload();
    } catch {
      toast("操作に失敗しました", "error");
    }
  }, [post, toast]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deletePost(id);
      toast("投稿を削除しました");
      navigate("/posts");
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [id, toast, navigate]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteComment(commentId);
        toast("コメントを削除しました");
        setDeletingCommentId(null);
        refetchComments();
      } catch {
        toast("削除に失敗しました", "error");
      }
    },
    [toast, refetchComments],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!post) {
    return <p className="text-muted-foreground">投稿が見つかりません</p>;
  }

  const cat = CAT_CONFIG[post.category as CategoryId];
  const profile = post.profiles as {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/posts")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">{post.title}</h1>
        {cat && (
          <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>
            {cat.label}
          </Badge>
        )}
        {post.is_featured && (
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* メインコンテンツ */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>内容</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {post.content ?? "（内容なし）"}
              </p>

              {/* 画像 */}
              {(post.image_urls?.length > 0 || post.image_url) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(post.image_urls?.length > 0
                    ? post.image_urls
                    : [post.image_url]
                  )
                    .filter(Boolean)
                    .map((url: string | null, i: number) => (
                      <img
                        key={i}
                        src={url!}
                        alt={`画像${i + 1}`}
                        className="size-32 rounded-md border object-cover"
                      />
                    ))}
                </div>
              )}

              {/* タグ */}
              {post.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* コメント一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>コメント ({comments?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {commentsLoading ? (
                <Skeleton className="h-20" />
              ) : !comments?.length ? (
                <p className="text-sm text-muted-foreground">コメントなし</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => {
                    const cProfile = c.profiles as {
                      display_name: string;
                    } | null;
                    return (
                      <div key={c.id} className="flex items-start justify-between rounded-md border p-3">
                        <div>
                          <p className="text-xs font-medium">
                            {cProfile?.display_name ?? "不明"}
                            <span className="ml-2 text-muted-foreground">
                              {new Date(c.created_at).toLocaleString("ja-JP")}
                            </span>
                          </p>
                          <p className="mt-1 text-sm">{c.body}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeletingCommentId(c.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* サイドバー情報 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>メタ情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span>投稿者: </span>
                {profile ? (
                  <Link
                    to={`/users/${profile.id}`}
                    className="font-medium hover:underline"
                  >
                    {profile.display_name}
                  </Link>
                ) : (
                  "不明"
                )}
              </div>
              {post.location_text && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  {post.location_text}
                </div>
              )}
              {post.deadline && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  期限: {new Date(post.deadline).toLocaleString("ja-JP")}
                </div>
              )}
              {post.crowd && (
                <div className="flex items-center gap-2">
                  混雑度:{" "}
                  {{ crowded: "混雑", moderate: "普通", empty: "空き" }[post.crowd as "crowded" | "moderate" | "empty"]}
                </div>
              )}
              <Separator />
              <div>いいね: {post.likes_count}</div>
              <div>コメント: {post.comments_count}</div>
              <div>
                投稿日: {new Date(post.created_at).toLocaleString("ja-JP")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleToggleFeatured}>
                <Star
                  className={`mr-2 size-4 ${post.is_featured ? "fill-yellow-400 text-yellow-400" : ""}`}
                />
                {post.is_featured ? "注目解除" : "注目に設定"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 size-4" />
                投稿を削除
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="投稿を削除"
        description="この投稿を完全に削除します。関連するコメント・いいねも削除されます。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!deletingCommentId}
        onOpenChange={(open) => !open && setDeletingCommentId(null)}
        title="コメントを削除"
        description="このコメントを削除します。"
        confirmLabel="削除する"
        onConfirm={() => deletingCommentId && handleDeleteComment(deletingCommentId)}
      />
    </div>
  );
}
