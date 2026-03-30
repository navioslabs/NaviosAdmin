import { useState, useCallback, type FormEvent } from "react";
import { Link } from "react-router";
import { Search, Star, Trash2, FileText, Download, CheckSquare, Square, X, Plus, Pencil } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/lib/auth";
import { fetchPosts, toggleFeatured, deletePost, createPost, updatePost } from "@/lib/services/posts";
import { bulkDeletePosts, bulkToggleFeatured } from "@/lib/services/bulk";
import { useToast } from "@/lib/toast";
import { downloadCsv } from "@/lib/csv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CAT_CONFIG } from "@/constants/categories";
import type { CategoryId } from "@/types";

export function PostsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { can } = useAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 一括操作
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "feature" | "unfeature" | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // 作成/編集フォーム
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<string>("lifeline");
  const [formLocation, setFormLocation] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const { data, loading, refetch } = useAsync(
    () => fetchPosts({ page, search, category: category || undefined }),
    [page, search, category],
  );

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("lifeline");
    setFormLocation("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (post: { id: string; title: string; content: string | null; category: string; location_text: string | null }) => {
    setEditId(post.id);
    setFormTitle(post.title);
    setFormContent(post.content ?? "");
    setFormCategory(post.category);
    setFormLocation(post.location_text ?? "");
    setShowForm(true);
  };

  const handleFormSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormLoading(true);
    try {
      if (editId) {
        await updatePost(editId, {
          title: formTitle,
          content: formContent,
          category: formCategory,
          location_text: formLocation || undefined,
        });
        toast("投稿を更新しました");
      } else {
        await createPost({
          title: formTitle,
          content: formContent,
          category: formCategory,
          location_text: formLocation || undefined,
          author_id: user.id,
        });
        toast("投稿を作成しました");
      }
      resetForm();
      refetch();
    } catch {
      toast(editId ? "更新に失敗しました" : "作成に失敗しました", "error");
    } finally {
      setFormLoading(false);
    }
  }, [editId, formTitle, formContent, formCategory, formLocation, user, toast, refetch]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    setSelected(selected.size === data.data.length ? new Set() : new Set(data.data.map((p) => p.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selected.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      if (bulkAction === "delete") {
        await bulkDeletePosts(ids);
        toast(`${ids.length}件の投稿を削除しました`);
      } else if (bulkAction === "feature") {
        await bulkToggleFeatured(ids, true);
        toast(`${ids.length}件を注目投���に設定しました`);
      } else {
        await bulkToggleFeatured(ids, false);
        toast(`${ids.length}件の注目投稿を解除しました`);
      }
      clearSelection();
      setBulkAction(null);
      refetch();
    } catch {
      toast("操作に失敗しました", "error");
    } finally {
      setBulkLoading(false);
    }
  }, [bulkAction, selected, toast, refetch]);

  const handleToggleFeatured = useCallback(async (id: string, current: boolean) => {
    try {
      await toggleFeatured(id, !current);
      toast(!current ? "注目投稿に設定しました" : "注目投稿を解除しました");
      refetch();
    } catch {
      toast("操作に失敗しま���た", "error");
    }
  }, [toast, refetch]);

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
        <div className="flex items-center gap-2">
          {can("csv.export") && data && data.data.length > 0 && (
            <Button variant="outline" size="sm" onClick={() =>
              downloadCsv(data.data.map((p) => ({
                ID: p.id, タイトル: p.title, カテゴリ: p.category,
                いいね: p.likes_count, コメント: p.comments_count,
                場所: p.location_text ?? "", 投稿日: p.created_at,
              })), `posts_${new Date().toISOString().slice(0, 10)}.csv`)
            }>
              <Download className="mr-1 size-4" />CSV
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="mr-1 size-4" />新規作成
          </Button>
        </div>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <Card className="ring-2 ring-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editId ? "投稿を編集" : "投稿を作成"}</CardTitle>
              <button onClick={resetForm} className="rounded-lg p-1 hover:bg-muted transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">タイトル *</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="投稿タイトル" required />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">カテゴリ *</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                      {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
                        <option key={id} value={id}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">場所</label>
                    <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="例: 渋谷区" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">内容</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="投稿の内容..."
                  rows={4}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>キャンセル</Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "保存中..." : editId ? "更新" : "作成"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="タイトル・内容・場所で検索" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="h-8 rounded-md border bg-background px-2 text-sm">
          <option value="">全カテゴリ</option>
          {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
            <option key={id} value={id}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* 一括操作バー */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 animate-in slide-in-from-top-2">
          <span className="text-sm font-medium">{selected.size}件を���択中</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkAction("feature")}>
              <Star className="mr-1 size-3.5" />注目設定
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkAction("unfeature")}>注目解除</Button>
            {can("posts.delete") && (
              <Button variant="destructive" size="sm" onClick={() => setBulkAction("delete")}>
                <Trash2 className="mr-1 size-3.5" />一���削除
              </Button>
            )}
            <button onClick={clearSelection} className="ml-1 rounded-md p-1 hover:bg-muted transition-colors">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={FileText} title="投稿がありません" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="flex items-center justify-center">
                      {selected.size === data.data.length && data.data.length > 0
                        ? <CheckSquare className="size-4 text-primary" />
                        : <Square className="size-4 text-muted-foreground" />}
                    </button>
                  </TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead className="w-24">カテゴリ</TableHead>
                  <TableHead className="w-24">投稿者</TableHead>
                  <TableHead className="w-16 text-right">いいね</TableHead>
                  <TableHead className="w-16 text-right">コメント</TableHead>
                  <TableHead className="w-28">投稿日</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((post) => {
                  const cat = CAT_CONFIG[post.category as CategoryId];
                  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles as { display_name: string; avatar_url: string | null } | null;
                  const isSelected = selected.has(post.id);
                  return (
                    <TableRow key={post.id} className={isSelected ? "bg-primary/5" : ""}>
                      <TableCell>
                        <button onClick={() => toggleSelect(post.id)} className="flex items-center justify-center">
                          {isSelected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4 text-muted-foreground" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Link to={`/posts/${post.id}`} className="font-medium hover:underline">{post.title}</Link>
                        {post.is_featured && <Star className="ml-1 inline size-3 fill-yellow-400 text-yellow-400" />}
                      </TableCell>
                      <TableCell>
                        {cat && <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>{cat.label}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{profile?.display_name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{post.likes_count}</TableCell>
                      <TableCell className="text-right tabular-nums">{post.comments_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleDateString("ja-JP")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(post)} title="編集">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                            title={post.is_featured ? "注目解除" : "注目設定"}>
                            <Star className={`size-3.5 ${post.is_featured ? "fill-yellow-400 text-yellow-400" : ""}`} />
                          </Button>
                          {can("posts.delete") && (
                            <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(post.id)}>
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination page={page} pageSize={20} total={data.total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}
        title="投稿を削除" description="この投稿を完全に削除します。この操作は取り消せません。"
        confirmLabel="削除する" onConfirm={handleDelete} loading={deleting} />

      <ConfirmDialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}
        title={bulkAction === "delete" ? `${selected.size}件の投稿を一括削除` : bulkAction === "feature" ? `${selected.size}件を注目投稿に設定` : `${selected.size}件の注目投稿を解除`}
        description={bulkAction === "delete" ? "選択した投稿をすべて削除します。この操作は取り消せません。" : "選択した投稿の注目設定を変更します。"}
        confirmLabel={bulkAction === "delete" ? "一括削除" : "実行"}
        onConfirm={handleBulkAction} loading={bulkLoading} />
    </div>
  );
}
