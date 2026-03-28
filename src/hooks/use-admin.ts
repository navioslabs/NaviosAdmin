import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchCurrentAdminRole } from "@/lib/services/admin";
import type { AdminRole } from "@/types";

/** 権限テーブル */
const PERMISSIONS: Record<string, AdminRole[]> = {
  "posts.delete": ["admin", "manager"],
  "talks.delete": ["admin", "manager"],
  "users.edit": ["admin", "manager"],
  "users.ban": ["admin"],
  "reports.resolve": ["admin", "manager"],
  "csv.export": ["admin", "manager"],
  "admin.manage": ["admin"],
  "settings.access": ["admin"],
};

export function useAdmin() {
  const { user } = useAuth();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    fetchCurrentAdminRole(user.id).then((r) => {
      setRole(r);
      setLoading(false);
    });
  }, [user]);

  /** 指定の権限を持っているか */
  const can = (permission: string): boolean => {
    if (!role) return false;
    const allowed = PERMISSIONS[permission];
    if (!allowed) return true; // 定義されていない権限は全ロールOK
    return allowed.includes(role);
  };

  return { role, loading, can };
}
