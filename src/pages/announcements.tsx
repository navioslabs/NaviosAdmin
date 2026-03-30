import { useState, useCallback, type FormEvent } from "react";
import { useAsync } from "@/hooks/use-async";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import {
  fetchAnnouncements,
  createAnnouncement,
  publishAnnouncement,
  deleteAnnouncement,
} from "@/lib/services/announcements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  Megaphone,
  Plus,
  Send,
  Trash2,
  X,
  Globe,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";

export function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, loading, refetch } = useAsync(() => fetchAnnouncements(), []);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "area">("all");
  const [targetArea, setTargetArea] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [publishId, setPublishId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setTarget("all");
    setTargetArea("");
    setShowForm(false);
  };

  const handleCreate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSubmitting(true);
      try {
        await createAnnouncement(
          { title, body, target, target_area: targetArea || null, publish_now: false },
          user.id,
        );
        toast("お知らせを作成しました");
        resetForm();
        refetch();
      } catch {
        toast("作成に失敗しました", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [user, title, body, target, targetArea, toast, refetch],
  );

  const handlePublish = useCallback(async () => {
    if (!publishId) return;
    setActionLoading(true);
    try {
      await publishAnnouncement(publishId);
      toast("お知らせを配信しました");
      setPublishId(null);
      refetch();
    } catch {
      toast("配信に失敗しました", "error");
    } finally {
      setActionLoading(false);
    }
  }, [publishId, toast, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await deleteAnnouncement(deleteId);
      toast("お知らせを削除しました");
      setDeleteId(null);
      refetch();
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setActionLoading(false);
    }
  }, [deleteId, toast, refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">お知らせ配信</h1>
          <p className="text-sm text-muted-foreground mt-1">
            アプリユーザーへのお知らせを管理
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 size-4" />
            新規作成
          </Button>
        )}
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <Card className="ring-2 ring-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" />
                <CardTitle>お知らせを作成</CardTitle>
              </div>
              <button
                onClick={resetForm}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">タイトル</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="お知らせのタイトル"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">本文</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="お知らせの内容を入力..."
                  required
                  rows={4}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">配信対象</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTarget("all")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      target === "all"
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Globe className="size-3.5" />
                    全ユーザー
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget("area")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      target === "area"
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <MapPin className="size-3.5" />
                    エリア指定
                  </button>
                </div>
                {target === "area" && (
                  <Input
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                    placeholder="エリア名（例：渋谷区）"
                    required={target === "area"}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "作成中..." : "下書き保存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* お知らせ一覧 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Megaphone} title="お知らせがありません" description="「新規作成」からお知らせを作成できます" />
      ) : (
        <div className="space-y-3">
          {data.map((ann) => (
            <Card key={ann.id}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`mt-0.5 rounded-lg p-2 ${ann.published_at ? "bg-green-500/10" : "bg-amber-500/10"}`}>
                  {ann.published_at ? (
                    <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">{ann.title}</h3>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[11px] ${
                        ann.published_at
                          ? "border-green-500/50 text-green-600 dark:text-green-400"
                          : "border-amber-500/50 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {ann.published_at ? "配信済み" : "下書き"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full text-[11px]">
                      {ann.target === "all" ? "全ユーザー" : ann.target_area}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ann.body}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                    作成: {new Date(ann.created_at).toLocaleString("ja-JP")}
                    {ann.published_at && (
                      <> ・ 配信: {new Date(ann.published_at).toLocaleString("ja-JP")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!ann.published_at && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPublishId(ann.id)}
                    >
                      <Send className="mr-1 size-3.5" />
                      配信
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteId(ann.id)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 配信確認ダイアログ */}
      <ConfirmDialog
        open={!!publishId}
        onOpenChange={(open) => !open && setPublishId(null)}
        title="お知らせを配信"
        description="このお知らせをユーザーに配信します。よろしいですか？"
        confirmLabel="配信する"
        onConfirm={handlePublish}
        loading={actionLoading}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="お知らせを削除"
        description="このお知らせを完全に削除します。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
