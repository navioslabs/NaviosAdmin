import { useState, useCallback, useEffect } from "react";
import { Trash2, UserPlus, Settings as SettingsIcon, Globe, Mail, Shield, AlertTriangle, Save, Loader2, Construction } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAsync } from "@/hooks/use-async";
import {
  fetchAdminUsers, addAdminUser, updateAdminRole, removeAdminUser,
} from "@/lib/services/admin";
import { fetchAppSettings, updateAppSettings, type AppSettings } from "@/lib/services/app-settings";
import { useToast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import type { AdminRole } from "@/types";

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "管理者", manager: "マネージャー", staff: "スタッフ",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  admin: "border-red-500 text-red-600",
  manager: "border-blue-500 text-blue-600",
  staff: "",
};

export function SettingsPage() {
  const { can } = useAdmin();
  const { toast } = useToast();

  // 管理者管理
  const { data: admins, loading: adminsLoading, refetch: refetchAdmins } = useAsync(() => fetchAdminUsers(), []);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("staff");
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // アプリ設定
  const { data: appSettings } = useAsync(() => fetchAppSettings(), []);
  const [appName, setAppName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [minVersion, setMinVersion] = useState("");
  const [savingApp, setSavingApp] = useState(false);

  useEffect(() => {
    if (appSettings) {
      setAppName(appSettings.app_name);
      setSupportEmail(appSettings.support_email);
      setMaintenanceMode(appSettings.maintenance_mode);
      setMaintenanceMsg(appSettings.maintenance_message);
      setTermsUrl(appSettings.terms_url);
      setPrivacyUrl(appSettings.privacy_url);
      setMinVersion(appSettings.min_app_version);
    }
  }, [appSettings]);

  const handleSaveApp = useCallback(async () => {
    setSavingApp(true);
    try {
      await updateAppSettings({
        app_name: appName,
        support_email: supportEmail,
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMsg,
        terms_url: termsUrl,
        privacy_url: privacyUrl,
        min_app_version: minVersion,
      });
      toast("設定を保存しました");
    } catch {
      toast("保存に失敗しました", "error");
    } finally {
      setSavingApp(false);
    }
  }, [appName, supportEmail, maintenanceMode, maintenanceMsg, termsUrl, privacyUrl, minVersion, toast]);

  const handleAddAdmin = useCallback(async () => {
    if (!newUserId.trim()) { toast("ユーザーIDを入力してください", "warning"); return; }
    setAdding(true);
    try {
      await addAdminUser(newUserId.trim(), newRole);
      toast("管理者を追加しました");
      setNewUserId("");
      refetchAdmins();
    } catch {
      toast("追加に失敗しました", "error");
    } finally {
      setAdding(false);
    }
  }, [newUserId, newRole, toast, refetchAdmins]);

  const handleRoleChange = useCallback(async (id: string, role: AdminRole) => {
    try {
      await updateAdminRole(id, role);
      toast("ロールを変更しました");
      refetchAdmins();
    } catch {
      toast("変更に失敗しました", "error");
    }
  }, [toast, refetchAdmins]);

  const handleDeleteAdmin = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeAdminUser(deleteId);
      toast("管理者を削除しました");
      setDeleteId(null);
      refetchAdmins();
    } catch {
      toast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteId, toast, refetchAdmins]);

  if (!can("settings.access")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground">この機能にアクセスする権限がありません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* アプリ設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <CardTitle>アプリ設定</CardTitle>
          </div>
          <CardDescription>アプリ全体の基本設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">アプリ名</label>
              <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-1">
                <Mail className="size-3.5" /> サポートメール
              </label>
              <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">利用規約URL</label>
              <Input value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">プライバシーポリシーURL</label>
              <Input value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">最低アプリバージョン</label>
              <Input value={minVersion} onChange={(e) => setMinVersion(e.target.value)} placeholder="1.0.0" />
            </div>
          </div>

          {/* メンテナンスモード */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Construction className="size-4 text-amber-500" />
                <span className="text-sm font-semibold">メンテナンスモード</span>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  maintenanceMode ? "bg-amber-500" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white transition-transform shadow-sm ${
                    maintenanceMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {maintenanceMode && (
              <div className="space-y-1 animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  メンテナンスモードが有効です。ユーザーはアプリを利用できません。
                </div>
                <label className="text-sm font-medium">メンテナンスメッセージ</label>
                <Input value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveApp} disabled={savingApp}>
              {savingApp ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
              {savingApp ? "保存中..." : "設定を保存"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 管理者追加 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <CardTitle>管理者を追加</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium">ユーザーID (UUID)</label>
              <Input placeholder="例: 507abed1-3815-4a43-8b4c-..." value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ロール</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as AdminRole)}
                className="h-8 rounded-md border bg-background px-2 text-sm">
                <option value="staff">スタッフ</option>
                <option value="manager">マネージャー</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <Button onClick={handleAddAdmin} disabled={adding}>
              <UserPlus className="mr-1 size-4" />{adding ? "追加中..." : "追加"}
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
          {adminsLoading ? (
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
                      : (admin.profiles as { display_name: string; avatar_url: string | null } | null);
                    return (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                              <AvatarFallback className="text-xs">{profile?.display_name?.charAt(0) ?? "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{profile?.display_name ?? "不明"}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{admin.user_id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select value={admin.role} onChange={(e) => handleRoleChange(admin.id, e.target.value as AdminRole)}
                            className="h-7 rounded-md border bg-background px-2 text-sm">
                            <option value="staff">スタッフ</option>
                            <option value="manager">マネージャー</option>
                            <option value="admin">管理者</option>
                          </select>
                          <Badge variant="outline" className={`ml-2 ${ROLE_COLORS[admin.role as AdminRole] ?? ""}`}>
                            {ROLE_LABELS[admin.role as AdminRole] ?? admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(admin.created_at).toLocaleDateString("ja-JP")}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(admin.id)}>
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

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}
        title="管理者を削除" description="この管理者を削除します。管理画面にアクセスできなくなります。"
        confirmLabel="削除する" onConfirm={handleDeleteAdmin} loading={deleting} />
    </div>
  );
}
