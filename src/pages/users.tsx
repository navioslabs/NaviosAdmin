import { useState, useCallback } from "react";
import { Link } from "react-router";
import { Download, Search, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useAsync } from "@/hooks/use-async";
import { fetchUsers, toggleVerified } from "@/lib/services/users";
import { downloadCsv } from "@/lib/csv";
import { useToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function UsersPage() {
  const { toast } = useToast();
  const { can } = useAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");

  const isVerified =
    verifiedFilter === "true" ? true : verifiedFilter === "false" ? false : undefined;

  const { data, loading, refetch } = useAsync(
    () => fetchUsers({ page, search, isVerified }),
    [page, search, verifiedFilter],
  );

  const handleToggleVerified = useCallback(
    async (id: string, current: boolean) => {
      try {
        await toggleVerified(id, !current);
        toast(!current ? "認証済みに設定" : "認証を解除");
        refetch();
      } catch {
        toast("操作に失敗しました", "error");
      }
    },
    [toast, refetch],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        {can("csv.export") && data && data.data.length > 0 && (
          <Button variant="outline" size="sm" onClick={() =>
            downloadCsv(data.data.map((u) => ({
              ID: u.id, 表示名: u.display_name, 認証済み: u.is_verified ? "○" : "",
              公開: u.is_public ? "○" : "", 場所: u.location_text ?? "", 登録日: u.created_at,
            })), `users_${new Date().toISOString().slice(0, 10)}.csv`)
          }><Download className="mr-1 size-4" />CSV出力</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="表示名で検索"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <select
          value={verifiedFilter}
          onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">すべて</option>
          <option value="true">認証済みのみ</option>
          <option value="false">未認証のみ</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={UsersIcon} title="ユーザーがいません" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー</TableHead>
                  <TableHead className="w-24">認証</TableHead>
                  <TableHead className="w-24">公開</TableHead>
                  <TableHead className="w-32">登録日</TableHead>
                  <TableHead className="w-16">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link to={`/users/${user.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="size-8">
                          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                          <AvatarFallback className="text-xs">
                            {user.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.display_name}</p>
                          {user.location_text && (
                            <p className="text-xs text-muted-foreground">{user.location_text}</p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {user.is_verified && (
                        <Badge variant="secondary">
                          <ShieldCheck className="mr-1 size-3" />認証済
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.is_public ? "公開" : "非公開"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell>
                      {can("users.edit") && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggleVerified(user.id, user.is_verified)}
                          title={user.is_verified ? "認証解除" : "認証する"}
                        >
                          <ShieldCheck className={`size-3.5 ${user.is_verified ? "text-blue-500" : ""}`} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination page={page} pageSize={20} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
