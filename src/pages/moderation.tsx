import { useState, useCallback, type FormEvent } from "react";
import { useAsync } from "@/hooks/use-async";
import { useToast } from "@/lib/toast";
import {
  fetchNgWords,
  addNgWord,
  removeNgWord,
  bulkAddNgWords,
  fetchFlaggedPosts,
  updateFlagStatus,
  INITIAL_NG_WORDS,
  type NgWord,
} from "@/lib/services/moderation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Eye,
} from "lucide-react";

const SEVERITY_CONFIG = {
  high: { label: "高", color: "border-red-500/50 text-red-600 dark:text-red-400" },
  medium: { label: "中", color: "border-amber-500/50 text-amber-600 dark:text-amber-400" },
  low: { label: "低", color: "border-blue-500/50 text-blue-600 dark:text-blue-400" },
};

const FLAG_STATUS_CONFIG = {
  pending: { label: "未確認", color: "border-amber-500 text-amber-600" },
  approved: { label: "承認済", color: "border-green-500 text-green-600" },
  removed: { label: "削除済", color: "border-red-500 text-red-600" },
};

export function ModerationPage() {
  const { toast } = useToast();
  const ngWords = useAsync(() => fetchNgWords(), []);
  const flagged = useAsync(() => fetchFlaggedPosts(), []);

  // NGワード追加フォーム
  const [newWord, setNewWord] = useState("");
  const [newSeverity, setNewSeverity] = useState<"low" | "medium" | "high">("medium");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const handleAdd = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setAdding(true);
    try {
      await addNgWord(newWord.trim(), newSeverity, newCategory.trim() || "その他");
      toast("NGワードを追加しました");
      setNewWord("");
      setNewCategory("");
      ngWords.refetch();
    } catch {
      toast("追加に失敗しました", "error");
    } finally {
      setAdding(false);
    }
  }, [newWord, newSeverity, newCategory, toast, ngWords]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeNgWord(deleteId);
      toast("NGワードを削除しました");
      setDeleteId(null);
      ngWords.refetch();
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteId, toast, ngWords]);

  const handleInitData = useCallback(async () => {
    setInitLoading(true);
    try {
      await bulkAddNgWords(INITIAL_NG_WORDS);
      toast(`${INITIAL_NG_WORDS.length}件の初期NGワードを登録しました`);
      ngWords.refetch();
    } catch {
      toast("登録に失敗しました（重複がある可能性があります）", "error");
    } finally {
      setInitLoading(false);
    }
  }, [toast, ngWords]);

  const handleFlagAction = useCallback(async (id: string, status: "approved" | "removed") => {
    try {
      await updateFlagStatus(id, status);
      toast(status === "approved" ? "承認しました" : "削除しました");
      flagged.refetch();
    } catch {
      toast("操作に失敗しました", "error");
    }
  }, [toast, flagged]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">自動モデレーション</h1>
        <p className="text-sm text-muted-foreground mt-1">
          NGワード辞書の管理とフラグ付き投稿の確認
        </p>
      </div>

      {/* NGワード辞書 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              <CardTitle>NGワード辞書</CardTitle>
            </div>
            <div className="flex gap-2">
              {(!ngWords.data || ngWords.data.length === 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInitData}
                  disabled={initLoading}
                >
                  <Upload className="mr-1 size-3.5" />
                  {initLoading ? "登録中..." : "初期データを登録"}
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            登録済み: {ngWords.data?.length ?? 0} ワード
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 追加フォーム */}
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-40">
              <label className="text-xs font-medium text-muted-foreground">ワード</label>
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="NGワードを入力"
                required
                className="mt-1"
              />
            </div>
            <div className="w-28">
              <label className="text-xs font-medium text-muted-foreground">重要度</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as "low" | "medium" | "high")}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs font-medium text-muted-foreground">カテゴリ</label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="例: スパム"
                className="mt-1"
              />
            </div>
            <Button type="submit" size="sm" disabled={adding}>
              <Plus className="mr-1 size-3.5" />追加
            </Button>
          </form>

          {/* ワードリスト */}
          {ngWords.loading ? (
            <Skeleton className="h-40" />
          ) : !ngWords.data || ngWords.data.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="NGワードが未登録です"
              description="「初期データを登録」で一般的なNGワードを一括登録できます"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {ngWords.data.map((nw) => {
                const sev = SEVERITY_CONFIG[nw.severity];
                return (
                  <div
                    key={nw.id}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${sev.color}`}
                  >
                    <span>{nw.word}</span>
                    <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0">
                      {nw.category}
                    </Badge>
                    <button
                      onClick={() => setDeleteId(nw.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* フラグ付き投稿 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-primary" />
            <CardTitle>フラグ付き投稿</CardTitle>
          </div>
          <CardDescription>
            NGワードにマッチした投稿 {flagged.data?.length ?? 0} 件
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flagged.loading ? (
            <Skeleton className="h-40" />
          ) : !flagged.data || flagged.data.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="フラグ付き投稿はありません"
              description="NGワードにマッチする投稿がここに表示されます"
            />
          ) : (
            <div className="space-y-2">
              {flagged.data.map((fp) => {
                const statusCfg = FLAG_STATUS_CONFIG[fp.status as keyof typeof FLAG_STATUS_CONFIG];
                return (
                  <div
                    key={fp.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{fp.post_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {fp.matched_words.map((w) => (
                          <Badge key={w} variant="destructive" className="text-[10px] rounded-full">
                            {w}
                          </Badge>
                        ))}
                        <Badge variant="outline" className={`text-[10px] rounded-full ${SEVERITY_CONFIG[fp.severity]?.color}`}>
                          {SEVERITY_CONFIG[fp.severity]?.label}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className={`rounded-full text-[11px] ${statusCfg?.color}`}>
                      {statusCfg?.label ?? fp.status}
                    </Badge>
                    {fp.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleFlagAction(fp.id, "approved")}
                          title="承認"
                        >
                          <Eye className="size-3.5 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleFlagAction(fp.id, "removed")}
                          title="削除"
                        >
                          <XCircle className="size-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="NGワードを削除"
        description="このNGワードを辞書から削除します。"
        confirmLabel="削除"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
