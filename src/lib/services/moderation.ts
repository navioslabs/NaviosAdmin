import { supabase } from "@/lib/supabase";

// ─── NGワード辞書 ───────────────────────────────────

export interface NgWord {
  id: string;
  word: string;
  severity: "low" | "medium" | "high";
  category: string;
  created_at: string;
}

/** NGワード一覧を取得 */
export async function fetchNgWords(): Promise<NgWord[]> {
  const { data, error } = await supabase
    .from("ng_words")
    .select("*")
    .order("severity", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NgWord[];
}

/** NGワードを追加 */
export async function addNgWord(
  word: string,
  severity: "low" | "medium" | "high",
  category: string,
): Promise<void> {
  const { error } = await supabase
    .from("ng_words")
    .insert({ word, severity, category });
  if (error) throw error;
}

/** NGワードを削除 */
export async function removeNgWord(id: string): Promise<void> {
  const { error } = await supabase.from("ng_words").delete().eq("id", id);
  if (error) throw error;
}

/** NGワードを一括追加 */
export async function bulkAddNgWords(
  words: { word: string; severity: "low" | "medium" | "high"; category: string }[],
): Promise<void> {
  const { error } = await supabase.from("ng_words").insert(words);
  if (error) throw error;
}

// ─── フラグ付き投稿 ─────────────────────────────────

export interface FlaggedPost {
  id: string;
  post_id: string;
  post_title: string;
  matched_words: string[];
  severity: "low" | "medium" | "high";
  status: "pending" | "approved" | "removed";
  created_at: string;
}

/** フラグ付き投稿一覧を取得 */
export async function fetchFlaggedPosts(
  status?: string,
): Promise<FlaggedPost[]> {
  let query = supabase
    .from("flagged_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FlaggedPost[];
}

/** フラグのステータスを更新 */
export async function updateFlagStatus(
  id: string,
  status: "approved" | "removed",
): Promise<void> {
  const { error } = await supabase
    .from("flagged_posts")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

/** 投稿をNGワードでスキャン（フロント側プレビュー用） */
export function scanText(
  text: string,
  ngWords: NgWord[],
): { matched: NgWord[]; clean: boolean } {
  const lower = text.toLowerCase();
  const matched = ngWords.filter((nw) => lower.includes(nw.word.toLowerCase()));
  return { matched, clean: matched.length === 0 };
}

// ─── 初期NGワードデータ ──────────────────────────────

export const INITIAL_NG_WORDS: { word: string; severity: "low" | "medium" | "high"; category: string }[] = [
  // 高: 即時対応が必要
  { word: "殺す", severity: "high", category: "暴力" },
  { word: "死ね", severity: "high", category: "暴力" },
  { word: "爆破", severity: "high", category: "危険" },
  { word: "テロ", severity: "high", category: "危険" },
  { word: "児童ポルノ", severity: "high", category: "違法" },
  { word: "麻薬", severity: "high", category: "違法" },
  { word: "覚醒剤", severity: "high", category: "違法" },
  { word: "大麻販売", severity: "high", category: "違法" },

  // 中: 確認が必要
  { word: "バカ", severity: "medium", category: "侮辱" },
  { word: "アホ", severity: "medium", category: "侮辱" },
  { word: "クソ", severity: "medium", category: "侮辱" },
  { word: "うざい", severity: "medium", category: "侮辱" },
  { word: "キモい", severity: "medium", category: "侮辱" },
  { word: "消えろ", severity: "medium", category: "嫌がらせ" },
  { word: "出て行け", severity: "medium", category: "嫌がらせ" },
  { word: "詐欺", severity: "medium", category: "犯罪" },
  { word: "闇金", severity: "medium", category: "犯罪" },

  // 低: 要注意
  { word: "出会い系", severity: "low", category: "スパム" },
  { word: "副業", severity: "low", category: "スパム" },
  { word: "稼げる", severity: "low", category: "スパム" },
  { word: "LINE交換", severity: "low", category: "スパム" },
  { word: "儲かる", severity: "low", category: "スパム" },
  { word: "無料配布", severity: "low", category: "スパム" },
  { word: "アフィリエイト", severity: "low", category: "スパム" },
  { word: "ネットワークビジネス", severity: "low", category: "スパム" },
  { word: "マルチ商法", severity: "low", category: "スパム" },
];
