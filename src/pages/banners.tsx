import { useState, useCallback, type FormEvent } from "react";
import { useAsync } from "@/hooks/use-async";
import { useToast } from "@/lib/toast";
import {
  fetchBanners,
  createBanner,
  deleteBanner,
  toggleBannerActive,
} from "@/lib/services/banners";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Image,
  Plus,
  Trash2,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  GripVertical,
} from "lucide-react";

export function BannersPage() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAsync(() => fetchBanners(), []);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setLinkUrl("");
    setShowForm(false);
  };

  const handleCreate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBanner({
        title,
        image_url: imageUrl,
        link_url: linkUrl || undefined,
        sort_order: (data?.length ?? 0) + 1,
        is_active: true,
      });
      toast("バナーを作成しました");
      resetForm();
      refetch();
    } catch {
      toast("作成に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  }, [title, imageUrl, linkUrl, data, toast, refetch]);

  const handleToggle = useCallback(async (id: string, current: boolean) => {
    try {
      await toggleBannerActive(id, !current);
      toast(!current ? "バナーを有効にしました" : "バナーを無効にしました");
      refetch();
    } catch {
      toast("操作に失敗しました", "error");
    }
  }, [toast, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteBanner(deleteId);
      toast("バナーを削除しました");
      setDeleteId(null);
      refetch();
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteId, toast, refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">バナー管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            アプリ内トップバナーの管理
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
                <Image className="size-4 text-primary" />
                <CardTitle>バナーを作成</CardTitle>
              </div>
              <button onClick={resetForm} className="rounded-lg p-1 hover:bg-muted transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">タイトル</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="バナーのタイトル" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">画像URL</label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." required />
                {imageUrl && (
                  <div className="mt-2 rounded-lg border overflow-hidden">
                    <img src={imageUrl} alt="プレビュー" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">リンクURL（任意）</label>
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="タップ時の遷移先URL" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>キャンセル</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "作成中..." : "作成"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* バナー一覧 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Image} title="バナーがありません" description="「新規作成」からバナーを追加できます" />
      ) : (
        <div className="space-y-3">
          {data.map((banner, i) => (
            <Card key={banner.id} className={!banner.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex items-center text-muted-foreground/30">
                  <GripVertical className="size-4" />
                  <span className="text-xs font-bold ml-0.5">{i + 1}</span>
                </div>

                {/* サムネイル */}
                <div className="shrink-0 w-28 h-16 rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>" }}
                  />
                </div>

                {/* 情報 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{banner.title}</h3>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[11px] ${
                        banner.is_active
                          ? "border-green-500/50 text-green-600 dark:text-green-400"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {banner.is_active ? "有効" : "無効"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {banner.link_url ? (
                      <span className="inline-flex items-center gap-0.5">
                        <ExternalLink className="size-3" />
                        {banner.link_url}
                      </span>
                    ) : "リンクなし"}
                  </p>
                  {(banner.start_at || banner.end_at) && (
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {banner.start_at && `開始: ${new Date(banner.start_at).toLocaleDateString("ja-JP")}`}
                      {banner.start_at && banner.end_at && " ・ "}
                      {banner.end_at && `終了: ${new Date(banner.end_at).toLocaleDateString("ja-JP")}`}
                    </p>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleToggle(banner.id, banner.is_active)}
                    title={banner.is_active ? "無効にする" : "有効にする"}
                  >
                    {banner.is_active ? (
                      <EyeOff className="size-3.5 text-muted-foreground" />
                    ) : (
                      <Eye className="size-3.5 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteId(banner.id)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="バナーを削除"
        description="このバナーを完全に削除します。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
