import { supabase } from "@/lib/supabase";

export interface PostsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isFeatured?: boolean | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/** 投稿一覧を取得 */
export async function fetchPosts({
  page = 1,
  pageSize = 20,
  search,
  category,
  isFeatured,
  sortBy = "created_at",
  sortDir = "desc",
}: PostsQuery = {}) {
  let query = supabase
    .from("posts")
    .select(
      "id, title, category, content, image_url, image_urls, location_text, deadline, crowd, is_featured, likes_count, comments_count, tags, created_at, updated_at, author_id, profiles!posts_author_id_fkey(display_name, avatar_url)",
      { count: "exact" },
    )
    .order(sortBy, { ascending: sortDir === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,content.ilike.%${search}%,location_text.ilike.%${search}%`,
    );
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (isFeatured !== null && isFeatured !== undefined) {
    query = query.eq("is_featured", isFeatured);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

/** 投稿詳細を取得 */
export async function fetchPost(id: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, profiles!posts_author_id_fkey(id, display_name, avatar_url)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/** 投稿のコメント一覧を取得 */
export async function fetchPostComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** is_featured を切り替え */
export async function toggleFeatured(id: string, isFeatured: boolean) {
  const { error } = await supabase
    .from("posts")
    .update({ is_featured: isFeatured })
    .eq("id", id);
  if (error) throw error;
}

/** 投稿を削除 */
export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

/** コメントを削除 */
export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

/** 投稿を作成 */
export interface CreatePostInput {
  title: string;
  content: string;
  category: string;
  location_text?: string;
  author_id: string;
}

export async function createPost(input: CreatePostInput) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title,
      content: input.content,
      category: input.category,
      location_text: input.location_text || null,
      author_id: input.author_id,
      image_urls: [],
      tags: [],
      is_featured: false,
      likes_count: 0,
      comments_count: 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

/** 投稿を更新 */
export interface UpdatePostInput {
  title?: string;
  content?: string;
  category?: string;
  location_text?: string;
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const { error } = await supabase
    .from("posts")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}
