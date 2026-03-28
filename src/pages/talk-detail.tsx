import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Trophy, Trash2, MapPin } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import {
  fetchTalk, fetchTalkReplies, toggleHallOfFame, deleteTalk, deleteReply,
} from "@/lib/services/talks";
import { useToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function TalkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  const { data: talk, loading } = useAsync(() => fetchTalk(id!), [id]);
  const { data: replies, loading: repliesLoading, refetch: refetchReplies } = useAsync(
    () => fetchTalkReplies(id!), [id],
  );

  const handleToggleHof = useCallback(async () => {
    if (!talk) return;
    try {
      await toggleHallOfFame(talk.id, !talk.is_hall_of_fame);
      toast(!talk.is_hall_of_fame ? "殿堂入りに設定" : "殿堂入りを解除");
      window.location.reload();
    } catch {
      toast("操作に失敗しました", "error");
    }
  }, [talk, toast]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteTalk(id);
      toast("ひとことを削除しました");
      navigate("/talks");
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [id, toast, navigate]);

  const handleDeleteReply = useCallback(async (replyId: string) => {
    try {
      await deleteReply(replyId);
      toast("リプライを削除しました");
      setDeletingReplyId(null);
      refetchReplies();
    } catch {
      toast("削除に失敗しました", "error");
    }
  }, [toast, refetchReplies]);

  if (loading) return <Skeleton className="h-64" />;
  if (!talk) return <p className="text-muted-foreground">ひとことが見つかりません</p>;

  const profile = talk.profiles as { id: string; display_name: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/talks")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">ひとこと詳細</h1>
        {talk.is_hall_of_fame && (
          <Badge variant="secondary"><Trophy className="mr-1 size-3" />殿堂</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>メッセージ</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{talk.message}</p>
              {(talk.image_urls?.length > 0 || talk.image_url) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(talk.image_urls?.length > 0 ? talk.image_urls : [talk.image_url])
                    .filter(Boolean)
                    .map((url: string | null, i: number) => (
                      <img key={i} src={url!} alt="" className="size-32 rounded-md border object-cover" />
                    ))}
                </div>
              )}
              {talk.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {talk.tags.map((tag: string) => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>リプライ ({replies?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {repliesLoading ? <Skeleton className="h-20" /> : !replies?.length ? (
                <p className="text-sm text-muted-foreground">リプライなし</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((r) => {
                    const rp = r.profiles as { display_name: string } | null;
                    return (
                      <div key={r.id} className="flex items-start justify-between rounded-md border p-3">
                        <div>
                          <p className="text-xs font-medium">
                            {rp?.display_name ?? "不明"}
                            <span className="ml-2 text-muted-foreground">
                              {new Date(r.created_at).toLocaleString("ja-JP")}
                            </span>
                          </p>
                          <p className="mt-1 text-sm">{r.body}</p>
                        </div>
                        <Button variant="ghost" size="icon-xs" onClick={() => setDeletingReplyId(r.id)}>
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

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>メタ情報</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>投稿者: {profile ? (
                <Link to={`/users/${profile.id}`} className="font-medium hover:underline">{profile.display_name}</Link>
              ) : "不明"}</div>
              {talk.location_text && (
                <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{talk.location_text}</div>
              )}
              <Separator />
              <div>いいね: {talk.likes_count}</div>
              <div>リプライ: {talk.replies_count}</div>
              <div>投稿日: {new Date(talk.created_at).toLocaleString("ja-JP")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>操作</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleToggleHof}>
                <Trophy className={`mr-2 size-4 ${talk.is_hall_of_fame ? "text-yellow-500" : ""}`} />
                {talk.is_hall_of_fame ? "殿堂解除" : "殿堂入りに設定"}
              </Button>
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="mr-2 size-4" />削除
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={showDelete} onOpenChange={setShowDelete} title="ひとことを削除"
        description="このひとことを完全に削除します。" confirmLabel="削除する" onConfirm={handleDelete} loading={deleting} />
      <ConfirmDialog open={!!deletingReplyId} onOpenChange={(open) => !open && setDeletingReplyId(null)}
        title="リプライを削除" description="このリプライを削除します。" confirmLabel="削除する"
        onConfirm={() => deletingReplyId && handleDeleteReply(deletingReplyId)} />
    </div>
  );
}
