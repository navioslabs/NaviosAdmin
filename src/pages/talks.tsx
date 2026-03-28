import { useState, useCallback } from "react";
import { Link } from "react-router";
import { Search, Trophy, Trash2, MessageCircle, Download } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAsync } from "@/hooks/use-async";
import { fetchTalks, toggleHallOfFame, deleteTalk } from "@/lib/services/talks";
import { downloadCsv } from "@/lib/csv";
import { useToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function TalksPage() {
  const { toast } = useToast();
  const { can } = useAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hofFilter, setHofFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isHallOfFame =
    hofFilter === "true" ? true : hofFilter === "false" ? false : undefined;

  const { data, loading, refetch } = useAsync(
    () => fetchTalks({ page, search, isHallOfFame }),
    [page, search, hofFilter],
  );

  const handleToggleHof = useCallback(
    async (id: string, current: boolean) => {
      try {
        await toggleHallOfFame(id, !current);
        toast(!current ? "殿堂入りに設定しました" : "殿堂入りを解除しました");
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
      await deleteTalk(deleteId);
      toast("ひとことを削除しました");
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
        <h1 className="text-2xl font-bold">ひとこと管理</h1>
        {can("csv.export") && data && data.data.length > 0 && (
          <Button variant="outline" size="sm" onClick={() =>
            downloadCsv(data.data.map((t) => ({
              ID: t.id, メッセージ: t.message, いいね: t.likes_count,
              リプライ: t.replies_count, 殿堂入り: t.is_hall_of_fame ? "○" : "",
              場所: t.location_text ?? "", 投稿日: t.created_at,
            })), `talks_${new Date().toISOString().slice(0, 10)}.csv`)
          }><Download className="mr-1 size-4" />CSV出力</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="メッセージで検索"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <select
          value={hofFilter}
          onChange={(e) => { setHofFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">すべて</option>
          <option value="true">殿堂入りのみ</option>
          <option value="false">通常のみ</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={MessageCircle} title="ひとことがありません" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メッセージ</TableHead>
                  <TableHead className="w-24">投稿者</TableHead>
                  <TableHead className="w-16 text-right">いいね</TableHead>
                  <TableHead className="w-16 text-right">リプライ</TableHead>
                  <TableHead className="w-20">殿堂</TableHead>
                  <TableHead className="w-28">投稿日</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((talk) => {
                  const profile = Array.isArray(talk.profiles) ? talk.profiles[0] : talk.profiles as { display_name: string } | null;
                  return (
                    <TableRow key={talk.id}>
                      <TableCell>
                        <Link
                          to={`/talks/${talk.id}`}
                          className="line-clamp-1 text-sm hover:underline"
                        >
                          {talk.message}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {profile?.display_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {talk.likes_count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {talk.replies_count}
                      </TableCell>
                      <TableCell>
                        {talk.is_hall_of_fame && (
                          <Badge variant="secondary">
                            <Trophy className="mr-1 size-3" />
                            殿堂
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(talk.created_at).toLocaleDateString("ja-JP")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleToggleHof(talk.id, talk.is_hall_of_fame)}
                            title={talk.is_hall_of_fame ? "殿堂解除" : "殿堂入り"}
                          >
                            <Trophy className={`size-3.5 ${talk.is_hall_of_fame ? "text-yellow-500" : ""}`} />
                          </Button>
                          {can("talks.delete") && (
                            <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(talk.id)}>
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="ひとことを削除"
        description="このひとことを完全に削除します。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
