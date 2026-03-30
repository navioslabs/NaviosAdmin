import { supabase } from "@/lib/supabase";
import type { AdminRole, CategoryId, BadgeType } from "@/types";

// ─── 共通 ────────────────────────────────────────────

export interface BulkResult {
  success: number;
  failed: number;
  errors: string[];
}

// ─── ユーザー一括登録 ────────────────────────────────

export interface UserImportRow {
  display_name: string;
  bio?: string;
  location_text?: string;
}

export async function bulkImportUsers(
  rows: UserImportRow[],
): Promise<BulkResult> {
  const result: BulkResult = { success: 0, failed: 0, errors: [] };

  // profilesテーブルに直接insert（auth.usersとの紐づけはなし＝プレースホルダ）
  const insertData = rows.map((r) => ({
    display_name: r.display_name,
    bio: r.bio || null,
    location_text: r.location_text || null,
    is_verified: false,
    is_public: true,
    show_location: true,
    show_checkins: true,
  }));

  // バッチ処理（50件ずつ）
  for (let i = 0; i < insertData.length; i += 50) {
    const batch = insertData.slice(i, i + 50);
    const { error, data } = await supabase.from("profiles").insert(batch).select("id");
    if (error) {
      result.failed += batch.length;
      result.errors.push(`行 ${i + 1}～${i + batch.length}: ${error.message}`);
    } else {
      result.success += data?.length ?? 0;
    }
  }

  return result;
}

// ─── 投稿一括登録 ────────────────────────────────────

export interface PostImportRow {
  title: string;
  content?: string;
  category: string;
  location_text?: string;
  author_id?: string;
}

export async function bulkImportPosts(
  rows: PostImportRow[],
  defaultAuthorId: string,
): Promise<BulkResult> {
  const result: BulkResult = { success: 0, failed: 0, errors: [] };
  const validCategories: CategoryId[] = ["lifeline", "event", "help"];

  const insertData = rows.map((r, i) => {
    const cat = r.category?.toLowerCase() as CategoryId;
    if (!validCategories.includes(cat)) {
      result.errors.push(`行 ${i + 1}: カテゴリ "${r.category}" が不正です（lifeline/event/help）`);
      result.failed++;
      return null;
    }
    return {
      title: r.title,
      content: r.content || null,
      category: cat,
      location_text: r.location_text || null,
      author_id: r.author_id || defaultAuthorId,
      image_urls: [],
      tags: [],
      is_featured: false,
      likes_count: 0,
      comments_count: 0,
    };
  }).filter(Boolean);

  for (let i = 0; i < insertData.length; i += 50) {
    const batch = insertData.slice(i, i + 50);
    const { error, data } = await supabase.from("posts").insert(batch).select("id");
    if (error) {
      result.failed += batch.length;
      result.errors.push(`バッチ ${Math.floor(i / 50) + 1}: ${error.message}`);
    } else {
      result.success += data?.length ?? 0;
    }
  }

  return result;
}

// ─── お知らせ一括登録 ────────────────────────────────

export interface AnnouncementImportRow {
  title: string;
  body: string;
  target?: string;
  target_area?: string;
}

export async function bulkImportAnnouncements(
  rows: AnnouncementImportRow[],
  createdBy: string,
): Promise<BulkResult> {
  const result: BulkResult = { success: 0, failed: 0, errors: [] };

  const insertData = rows.map((r) => ({
    title: r.title,
    body: r.body,
    target: r.target === "area" ? "area" : "all",
    target_area: r.target === "area" ? (r.target_area || null) : null,
    published_at: null,
    created_by: createdBy,
  }));

  for (let i = 0; i < insertData.length; i += 50) {
    const batch = insertData.slice(i, i + 50);
    const { error, data } = await supabase.from("announcements").insert(batch).select("id");
    if (error) {
      result.failed += batch.length;
      result.errors.push(`バッチ ${Math.floor(i / 50) + 1}: ${error.message}`);
    } else {
      result.success += data?.length ?? 0;
    }
  }

  return result;
}

// ─── バッジ一括付与 ──────────────────────────────────

export interface BadgeImportRow {
  user_id: string;
  badge_type: string;
  area_name?: string;
}

export async function bulkImportBadges(
  rows: BadgeImportRow[],
): Promise<BulkResult> {
  const result: BulkResult = { success: 0, failed: 0, errors: [] };
  const validTypes: BadgeType[] = ["resident", "face", "legend"];

  const insertData = rows.map((r, i) => {
    const type = r.badge_type?.toLowerCase() as BadgeType;
    if (!validTypes.includes(type)) {
      result.errors.push(`行 ${i + 1}: バッジタイプ "${r.badge_type}" が不正です（resident/face/legend）`);
      result.failed++;
      return null;
    }
    return {
      user_id: r.user_id,
      badge_type: type,
      area_name: r.area_name || "",
    };
  }).filter(Boolean);

  for (let i = 0; i < insertData.length; i += 50) {
    const batch = insertData.slice(i, i + 50);
    const { error, data } = await supabase.from("user_badges").insert(batch).select("id");
    if (error) {
      result.failed += batch.length;
      result.errors.push(`バッチ ${Math.floor(i / 50) + 1}: ${error.message}`);
    } else {
      result.success += data?.length ?? 0;
    }
  }

  return result;
}

// ─── 管理者一括登録 ──────────────────────────────────

export interface AdminImportRow {
  user_id: string;
  role: string;
}

export async function bulkImportAdmins(
  rows: AdminImportRow[],
): Promise<BulkResult> {
  const result: BulkResult = { success: 0, failed: 0, errors: [] };
  const validRoles: AdminRole[] = ["admin", "manager", "staff"];

  const insertData = rows.map((r, i) => {
    const role = r.role?.toLowerCase() as AdminRole;
    if (!validRoles.includes(role)) {
      result.errors.push(`行 ${i + 1}: ロール "${r.role}" が不正です（admin/manager/staff）`);
      result.failed++;
      return null;
    }
    return {
      user_id: r.user_id,
      role,
    };
  }).filter(Boolean);

  for (let i = 0; i < insertData.length; i += 50) {
    const batch = insertData.slice(i, i + 50);
    const { error, data } = await supabase.from("admin_users").insert(batch).select("id");
    if (error) {
      result.failed += batch.length;
      result.errors.push(`バッチ ${Math.floor(i / 50) + 1}: ${error.message}`);
    } else {
      result.success += data?.length ?? 0;
    }
  }

  return result;
}
