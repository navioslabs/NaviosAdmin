import { useState, useCallback } from "react";
import { Trash2, UserPlus, Settings as SettingsIcon } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAsync } from "@/hooks/use-async";
import {
  fetchAdminUsers,
  addAdminUser,
  updateAdminRole,
  removeAdminUser,
} from "@/lib/services/admin";
import { useToast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import type { AdminRole } from "@/types";

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  admin: "border-red-500 text-red-600",
  manager: "border-blue-500 text-blue-600",
  staff: "",
};

export function SettingsPage() {
  const { can } = useAdmin();
  const { toast } = useToast();
  const { data: admins, loading, refetch } = useAsync(
    () => fetchAdminUsers(),
    [],
  );

  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("staff");
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newUserId.trim()) {
      toast("ユーザーIDを入力してください", "warning");
      return;
    }
    setAdding(true);
    try {
      await addAdminUser(newUserId.trim(), newRole);
      toast("管理者を追加しました");
      setNewUserId("");
      refetch();
    } catch {
      toast("追加に失敗しました。ユーザーIDを確認してください。", "error");
    } finally {
      setAdding(false);
    }
  }, [newUserId, newRole, toast, refetch]);

  const handleRoleChange = useCallback(
    async (id: string, role: AdminRole) => {
      try {
        await updateAdminRole(id, role);
        toast("ロールを変更しました");
        refetch();
      } catch {
        toast("変更に失敗しました", "error");
      }
    },
    [toast, refetch],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeAdminUser(deleteId);
      toast("管理者を削除しました");
      setDeleteId(null);
      refetch();
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteId, toast, refetch]);

  if (!can("admin.manage")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground">
          この機能にアクセスする権限がありません。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* 管理者追加 */}
      <Card>
        <CardHeader>
          <CardTitle>管理者を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium">
                ユーザーID (UUID)
              </label>
              <Input
                placeholder="例: 507abed1-3815-4a43-8b4c-..."
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ロール</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AdminRole)}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                <option value="staff">スタッフ</option>
                <option value="manager">マネージャー</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <Button onClick={handleAdd} disabled={adding}>
              <UserPlus className="mr-1 size-4" />
              {adding ? "追加中..." : "追加"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 管理者一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>管理者一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : !admins?.length ? (
            <EmptyState icon={SettingsIcon} title="管理者が登録されていません" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー</TableHead>
                    <TableHead className="w-32">ロール</TableHead>
                    <TableHead className="w-28">登録日</TableHead>
                    <TableHead className="w-16">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => {
                    const profile = Array.isArray(admin.profiles)
                      ? admin.profiles[0]
                      : (admin.profiles as {
                          display_name: string;
                          avatar_url: string | null;
                        } | null);
                    return (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              {profile?.avatar_url && (
                                <AvatarImage src={profile.avatar_url} />
                              )}
                              <AvatarFallback className="text-xs">
                                {profile?.display_name?.charAt(0) ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {profile?.display_name ?? "不明"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {admin.user_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={admin.role}
                            onChange={(e) =>
                              handleRoleChange(
                                admin.id,
                                e.target.value as AdminRole,
                              )
                            }
                            className="h-7 rounded-md border bg-background px-2 text-sm"
                          >
                            <option value="staff">スタッフ</option>
                            <option value="manager">マネージャー</option>
                            <option value="admin">管理者</option>
                          </select>
                          <Badge
                            variant="outline"
                            className={`ml-2 ${ROLE_COLORS[admin.role as AdminRole] ?? ""}`}
                          >
                            {ROLE_LABELS[admin.role as AdminRole] ??
                              admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(admin.created_at).toLocaleDateString(
                            "ja-JP",
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(admin.id)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="管理者を削除"
        description="この管理者を削除します。管理画面にアクセスできなくなります。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
