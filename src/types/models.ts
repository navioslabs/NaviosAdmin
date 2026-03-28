// ─── カテゴリ ─────────────────────────────────────────

export type CategoryId = "lifeline" | "event" | "help";

// ─── プロフィール ─────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location_text: string | null;
  is_verified: boolean;
  is_public: boolean;
  show_location: boolean;
  show_checkins: boolean;
  created_at: string;
  updated_at: string;
}

// ─── 投稿 ─────────────────────────────────────────────

export interface Post {
  id: string;
  author_id: string;
  category: CategoryId;
  title: string;
  content: string | null;
  image_url: string | null;
  image_urls: string[];
  location_text: string | null;
  deadline: string | null;
  crowd: "crowded" | "moderate" | "empty" | null;
  is_featured: boolean;
  likes_count: number;
  comments_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  /** JOINで取得 */
  author?: Profile;
}

// ─── ひとこと ─────────────────────────────────────────

export interface Talk {
  id: string;
  author_id: string;
  message: string;
  image_url: string | null;
  image_urls: string[];
  location_text: string | null;
  likes_count: number;
  replies_count: number;
  tags: string[];
  is_hall_of_fame: boolean;
  created_at: string;
  /** JOINで取得 */
  author?: Profile;
}

// ─── コメント ─────────────────────────────────────────

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
}

// ─── リプライ ─────────────────────────────────────────

export interface TalkReply {
  id: string;
  talk_id: string;
  author_id: string;
  body: string;
  likes_count: number;
  created_at: string;
  author?: Profile;
}

// ─── いいね ───────────────────────────────────────────

export interface Like {
  id: string;
  user_id: string;
  target_type: "post" | "talk" | "comment" | "reply";
  target_id: string;
  created_at: string;
}

// ─── 通報 ─────────────────────────────────────────────

export type ReportReasonId =
  | "spam"
  | "inappropriate"
  | "misleading"
  | "harassment"
  | "dangerous"
  | "other";

export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "feed" | "talk" | "nearby";
  target_id: string;
  reason: ReportReasonId;
  detail: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  /** JOINで取得 */
  reporter?: Profile;
}

// ─── バッジ ───────────────────────────────────────────

export type BadgeType = "resident" | "face" | "legend";

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  area_name: string;
  earned_at: string;
}

// ─── 通知 ─────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "reply" | "hall_of_fame";
  title: string;
  body: string;
  target_type: "post" | "talk" | "comment";
  target_id: string;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── 管理者 ───────────────────────────────────────────

export type AdminRole = "admin" | "manager" | "staff";

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
  /** JOINで取得 */
  profile?: Profile;
}
