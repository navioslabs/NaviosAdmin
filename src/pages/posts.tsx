import { useState, useCallback } from "react";
import { Link } from "react-router";
import { Search, Star, Trash2, FileText } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { fetchPosts, toggleFeatured, deletePost } from "@/lib/services/posts";
import { useToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CAT_CONFIG } from "@/constants/categories";
import type { CategoryId } from "@/types";

export function PostsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, refetch } = useAsync(
    () => fetchPosts({ page, search, category: category || undefined }),
    [page, search, category],
  );

  const handleToggleFeatured = useCallback(
    async (id: string, current: boolean) => {
      try {
        await toggleFeatured(id, !current);
        toast(!current ? "注目投稿に設定しました" : "注目投稿を解除しました");
        refetch();
      } catch {
        toast("操作に失敗しました", "error");
      }
    },
    [toast, refetch],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deletePost(deleteId);
      toast("投稿を削除しました");
      setDeleteId(null);
      refetch();
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteId, toast, refetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">投稿管理</h1>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="タイトル・内容・場所で検索"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">全カテゴリ</option>
          {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
            <option key={id} value={id}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={FileText} title="投稿がありません" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead className="w-24">カテゴリ</TableHead>
                  <TableHead className="w-24">投稿者</TableHead>
                  <TableHead className="w-16 text-right">いいね</TableHead>
                  <TableHead className="w-16 text-right">コメント</TableHead>
                  <TableHead className="w-28">投稿日</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((post) => {
                  const cat = CAT_CONFIG[post.category as CategoryId];
                  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles as { display_name: string; avatar_url: string | null } | null;
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Link
                          to={`/posts/${post.id}`}
                          className="font-medium hover:underline"
                        >
                          {post.title}
                        </Link>
                        {post.is_featured && (
                          <Star className="ml-1 inline size-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {cat && (
                          <Badge
                            variant="outline"
                            style={{ borderColor: cat.color, color: cat.color }}
                          >
                            {cat.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {profile?.display_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {post.likes_count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {post.comments_count}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("ja-JP")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              handleToggleFeatured(post.id, post.is_featured)
                            }
                            title={post.is_featured ? "注目解除" : "注目設定"}
                          >
                            <Star
                              className={`size-3.5 ${post.is_featured ? "fill-yellow-400 text-yellow-400" : ""}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={page}
            pageSize={20}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="投稿を削除"
        description="この投稿を完全に削除します。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
