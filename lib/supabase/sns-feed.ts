import type { SupabaseClient } from "@supabase/supabase-js";

/** Step 3: ニャード用の Supabase クエリをまとめるニャ */
export const SNS_POST_COLUMNS =
  "id,user_name,anon_id,content,lang,translated,image_url,images_urls,media_type,likes_count,created_at" as const;

export type SnsPostRow = {
  id: number;
  user_name: string;
  anon_id: string;
  content: string;
  lang: string;
  translated: string;
  image_url: string;
  images_urls: unknown;
  media_type: "image" | "video";
  likes_count: number;
  created_at: string;
};

export type SnsCommentRow = {
  id: number;
  post_id: number;
  user_name: string;
  anon_id: string;
  text: string;
  created_at: string;
};

export function parseSnsImagesUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export function listSnsPosts(supabase: SupabaseClient) {
  return supabase.from("sns_posts").select(SNS_POST_COLUMNS).order("created_at", { ascending: false });
}

export function fetchSnsCommentsForPosts(supabase: SupabaseClient, postIds: number[]) {
  if (postIds.length === 0) {
    return Promise.resolve({ data: [] as SnsCommentRow[], error: null });
  }
  return supabase
    .from("sns_post_comments")
    .select("id,post_id,user_name,anon_id,text,created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
}

export function fetchSnsLikesForPosts(supabase: SupabaseClient, anonId: string, postIds: number[]) {
  if (postIds.length === 0) {
    return Promise.resolve({ data: [] as Array<{ post_id: number }>, error: null });
  }
  return supabase.from("sns_post_likes").select("post_id").eq("anon_id", anonId).in("post_id", postIds);
}

export function insertSnsPost(
  supabase: SupabaseClient,
  payload: {
    user_name: string;
    anon_id: string;
    content: string;
    lang: string;
    translated: string;
    image_url: string;
    images_urls: string[];
    media_type: "image" | "video";
    likes_count: number;
  },
) {
  return supabase.from("sns_posts").insert(payload).select(SNS_POST_COLUMNS).single();
}

export function deleteSnsPost(supabase: SupabaseClient, id: number) {
  return supabase.from("sns_posts").delete().eq("id", id);
}

export function insertSnsPostComment(
  supabase: SupabaseClient,
  payload: { post_id: number; user_name: string; anon_id: string; text: string },
) {
  return supabase
    .from("sns_post_comments")
    .insert(payload)
    .select("id,post_id,user_name,anon_id,text,created_at")
    .single();
}

export function deleteSnsPostComment(supabase: SupabaseClient, postId: number, commentId: number) {
  return supabase.from("sns_post_comments").delete().eq("id", commentId).eq("post_id", postId);
}

export function insertSnsPostLike(supabase: SupabaseClient, postId: number, anonId: string) {
  return supabase.from("sns_post_likes").insert({ post_id: postId, anon_id: anonId });
}

export function deleteSnsPostLike(supabase: SupabaseClient, postId: number, anonId: string) {
  return supabase.from("sns_post_likes").delete().eq("post_id", postId).eq("anon_id", anonId);
}

export function updateSnsPostLikeCount(supabase: SupabaseClient, postId: number, likesCount: number) {
  return supabase
    .from("sns_posts")
    .update({ likes_count: likesCount, updated_at: new Date().toISOString() })
    .eq("id", postId);
}
