"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, MessageCircle, ShoppingBag, Send, PlusCircle, Plus, Globe, Star, Cat, PawPrint, Play, Type, Smile, Sticker, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { supabase } from "@/lib/supabase/client";
import {
  deleteSnsPost,
  deleteSnsPostComment,
  deleteSnsPostLike,
  fetchSnsCommentsForPosts,
  deleteCommentLike,
  fetchCommentLikesForUser,
  fetchSnsLikesForPosts,
  insertCommentLike,
  insertSnsPost,
  insertSnsPostComment,
  insertSnsPostLike,
  listSnsPosts,
  parseSnsImagesUrls,
  type SnsCommentRow,
  type SnsPostRow,
  updateCommentLikeCount,
  updateSnsPostLikeCount,
} from "@/lib/supabase/sns-feed";
import { BshVariantProvider, useBshVariant } from "@/app/context/bsh-variant-context";

// Google Fontsの 'Zen Maru Gothic' を適用するためのスタイル設定
// ※実際には layout.tsx 等で読み込むのが理想ですが、まずは動かすためにここにスタイルを入れます。
/** デモ投稿（Supabase の id と被らないよう負の値） */
const POSTS = [
  {
    id: -100001,
    user: "丸顔のBSH",
    content: "Today's roundness is 100%. 🐱",
    lang: "en",
    translated: "今日の丸まり度は100%です。",
    likes: 124,
    image: "https://images.unsplash.com/photo-1513245533132-aa7f7058274a",
    anonId: "49VD88",
    createdAt: "2026-05-08T19:25:00+09:00",
  },
  {
    id: -100002,
    user: "ブルーの飼い主",
    content: "この毛並み、もはや絨毯。 #BSH",
    lang: "ja",
    translated: "This fur is basically a rug now.",
    likes: 98,
    image: "https://images.unsplash.com/photo-1548247416-ec66f4900b2e",
    anonId: "A82KQ1",
    createdAt: "2026-05-08T18:52:00+09:00",
  }
];

const DOODLE_POSTS = [
  {
    id: 100,
    user: "名無しのBSH",
    content: "うちのBSHを魔法使いにしてあげましたニャ",
    lang: "ja",
    translated: "うちのBSHを魔法使いにしてあげましたニャ",
    likes: 88,
    image: "/images/sample-doodle.png",
    anonId: "aB8j9Kf2",
    createdAt: "2026-05-08T19:30:00+09:00",
  },
  {
    id: 101,
    user: "名無しのBSH",
    content: "お昼寝ポーズをクレヨンで。 #doodle",
    lang: "ja",
    translated: "お昼寝ポーズをクレヨンで。 #doodle",
    likes: 41,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
    anonId: "aB8j9Kf2",
    createdAt: "2026-05-08T19:12:00+09:00",
  },
  {
    id: 102,
    user: "名無しのBSH",
    content: "まるねこ線画の習作です。",
    lang: "ja",
    translated: "まるねこ線画の習作です。",
    likes: 27,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
    anonId: "f2Qm7Xc9",
    createdAt: "2026-05-08T19:27:00+09:00",
  },
];

/** ストーリー帯の「自分」アイコン（プロフィールと同じ画像） */
const ME_STORY_AVATAR =
  "https://images.unsplash.com/photo-1513245533132-aa7f7058274a";

type FeedPost = {
  id: number;
  user: string;
  content: string;
  lang: string;
  translated: string;
  likes: number;
  image: string;
  images?: string[];
  // 将来の動画投稿対応用（Supabase Storage導入後に有効化）
  mediaType?: "image" | "video";
  anonId?: string;
  createdAt?: string;
};
type DoodlePost = FeedPost & { anonId: string; createdAt: string };

type ThreadItem = {
  id: number;
  user: string;
  text: string;
  timeLabel: string;
  anonId?: string;
  createdAt?: string;
};

type ThreadComment = {
  id: number;
  user: string;
  text: string;
  anonId?: string;
  createdAt?: string;
  likesCount?: number;
};

type StoryItem = {
  id: number;
  name: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
};

type StoryTextStyle = "Modern" | "Strong" | "Neon";
type StoryTextAlign = "left" | "center" | "right";
type StoryLayer = {
  id: number;
  kind: "text" | "emoji" | "sticker";
  text: string;
  x: number; // %
  y: number; // %
  scale: number;
  rotation: number; // deg
  color?: string;
  style?: StoryTextStyle;
  align?: StoryTextAlign;
};

const STORY_FONT_MAP: Record<StoryTextStyle, string> = {
  Modern: "'Inter', 'Zen Maru Gothic', sans-serif",
  Strong: "'Arial Black', 'Zen Maru Gothic', sans-serif",
  Neon: "'Trebuchet MS', 'Zen Maru Gothic', sans-serif",
};

const STORY_EMOJI_PICKER = ["😻", "🐾", "❤️", "✨", "😺", "🐱", "🧶", "🫶", "😽", "🌟", "🎀", "😸"];

const INITIAL_STORIES: StoryItem[] = [
  { id: 1, name: "チョコ", mediaUrl: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4", mediaType: "image", createdAt: "2026-05-08T18:45:00+09:00" },
  { id: 2, name: "ルナ", mediaUrl: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d", mediaType: "image", createdAt: "2026-05-08T18:50:00+09:00" },
  { id: 3, name: "レオ", mediaUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce", mediaType: "image", createdAt: "2026-05-08T18:55:00+09:00" },
  { id: 4, name: "モカ", mediaUrl: "https://images.unsplash.com/photo-1573865526739-10659fec78a5", mediaType: "image", createdAt: "2026-05-08T19:00:00+09:00" },
  { id: 5, name: "ココ", mediaUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987", mediaType: "image", createdAt: "2026-05-08T19:05:00+09:00" },
];


const LS_BROWSER_ANON_ID = "bsh-times.browser-anon-id";
const ANON_DEFAULT_NAME = "名無しのBSH";
const ANON_NAME_CANDIDATES = [
  "丸顔のBSH",
  "ブルーの飼い主",
  ANON_DEFAULT_NAME,
];
const NYAT_ANON_NAME_CANDIDATES = ["@名無しのBSH", "@匿名BSH"];
const UPDATE_LOGS = [
  {
    date: "2026/05/08",
    items: [
      "NYAT・落書き・SNSの匿名ID/投稿時間表示を追加",
      "プロフィール画面をComing Soonデザインに変更",
      "下部ナビの構成を再編（NYAT/落書き/SHOP/中央投稿）",
    ],
  },
  {
    date: "2026/05/07",
    items: [
      "落書き（DOODLE GALLERY）タブを追加",
      "投稿データのlocalStorage保存を導入",
    ],
  },
];

const SNS_PAW_STAMP_BG = {
  backgroundColor: "#FBFDF9",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='140' viewBox='0 0 180 140'%3E%3Cg fill='none' stroke='%23BFDABD' stroke-width='1.7' opacity='0.22'%3E%3Cellipse cx='22' cy='28' rx='7.5' ry='9.5'/%3E%3Cellipse cx='37' cy='20' rx='6.5' ry='8.5'/%3E%3Cellipse cx='52' cy='28' rx='7.5' ry='9.5'/%3E%3Cellipse cx='37' cy='41' rx='12' ry='10'/%3E%3C/g%3E%3Cg fill='none' stroke='%23BFDABD' stroke-width='1.6' opacity='0.18'%3E%3Cellipse cx='96' cy='18' rx='6.5' ry='8.5'/%3E%3Cellipse cx='108' cy='11' rx='5.5' ry='7.5'/%3E%3Cellipse cx='120' cy='18' rx='6.5' ry='8.5'/%3E%3Cellipse cx='108' cy='30' rx='10.5' ry='9'/%3E%3C/g%3E%3Cg fill='none' stroke='%23BFDABD' stroke-width='1.6' opacity='0.16'%3E%3Cellipse cx='64' cy='86' rx='6.5' ry='8.5'/%3E%3Cellipse cx='76' cy='79' rx='5.5' ry='7'/%3E%3Cellipse cx='88' cy='86' rx='6.5' ry='8.5'/%3E%3Cellipse cx='76' cy='98' rx='10.5' ry='9'/%3E%3C/g%3E%3Cg fill='none' stroke='%23BFDABD' stroke-width='1.5' opacity='0.14'%3E%3Cellipse cx='144' cy='88' rx='5.5' ry='7.5'/%3E%3Cellipse cx='154' cy='82' rx='4.8' ry='6.5'/%3E%3Cellipse cx='164' cy='88' rx='5.5' ry='7.5'/%3E%3Cellipse cx='154' cy='98' rx='9' ry='7.8'/%3E%3C/g%3E%3Cg fill='none' stroke='%23BFDABD' stroke-width='1.5' opacity='0.13'%3E%3Cellipse cx='26' cy='118' rx='5.3' ry='7.2'/%3E%3Cellipse cx='36' cy='112' rx='4.7' ry='6.2'/%3E%3Cellipse cx='46' cy='118' rx='5.3' ry='7.2'/%3E%3Cellipse cx='36' cy='128' rx='8.8' ry='7.5'/%3E%3C/g%3E%3C/svg%3E\")",
  backgroundRepeat: "repeat",
  backgroundSize: "180px 140px",
} as const;

const SUPABASE_GALLERY_BUCKET = "gallery-media";
const SUPABASE_STORY_BUCKET = "story-media";

/** `/object/public/{bucket}/{path...}` 形式の Storage URL からバケットとオブジェクトキーを取り出す */
function parseSupabaseStoragePublicUrl(url: string): { bucket: string; objectPath: string } | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: m[1], objectPath: m[2] };
  } catch {
    return null;
  }
}

/**
 * private バケットでも読めるよう署名付き URL を試す。失敗時は元 URL（public 想定）のまま。
 * 同一セッション内は sessionStorage で短時間キャッシュして再読込の負荷を抑える。
 */
async function resolveStorageUrlForDisplay(url: string): Promise<string> {
  if (!url || typeof url !== "string") return url;
  const parsed = parseSupabaseStoragePublicUrl(url);
  if (!parsed) return url;

  const cacheKey = `bsh-storage-sign:${parsed.bucket}:${parsed.objectPath}`;
  const ttlMs = 5 * 60 * 60 * 1000; // 署名は最大6h想定で、5hでキャッシュ切れ扱い
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const { signedUrl, exp } = JSON.parse(raw) as { signedUrl: string; exp: number };
      if (typeof signedUrl === "string" && typeof exp === "number" && Date.now() < exp - 60_000) {
        return signedUrl;
      }
    }
  } catch {
    /* 壊れたキャッシュは無視 */
  }

  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.objectPath, 60 * 60 * 6);
  if (error || !data?.signedUrl) return url;

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ signedUrl: data.signedUrl, exp: Date.now() + ttlMs }));
  } catch {
    /* 容量超過など */
  }
  return data.signedUrl;
}

type GalleryRow = {
  id: number;
  user_name: string;
  anon_id: string;
  content: string;
  image_url: string;
  likes_count: number;
  created_at: string;
};

type StoryRow = {
  id: number;
  user_name: string;
  anon_id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
  expires_at: string;
};

type GalleryCommentRow = {
  id: number;
  post_id: number;
  user_name: string;
  anon_id: string;
  text: string;
  created_at: string;
};

function isPostRecord(x: unknown): x is FeedPost {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.user === "string" &&
    typeof o.content === "string" &&
    typeof o.lang === "string" &&
    typeof o.translated === "string" &&
    typeof o.likes === "number" &&
    typeof o.image === "string" &&
    (o.images === undefined || (Array.isArray(o.images) && o.images.every((item) => typeof item === "string"))) &&
    (o.anonId === undefined || typeof o.anonId === "string") &&
    (o.createdAt === undefined || typeof o.createdAt === "string")
  );
}

function isDoodleRecord(x: unknown): x is DoodlePost {
  if (!isPostRecord(x)) return false;
  const o = x as Record<string, unknown>;
  return typeof o.anonId === "string" && typeof o.createdAt === "string";
}

function isStoryRecord(x: unknown): x is StoryItem {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.name === "string" &&
    typeof o.mediaUrl === "string" &&
    (o.mediaType === "image" || o.mediaType === "video") &&
    typeof o.createdAt === "string"
  );
}

function getRandomAnonName() {
  return ANON_NAME_CANDIDATES[
    Math.floor(Math.random() * ANON_NAME_CANDIDATES.length)
  ];
}

function getRandomNyatAnonName() {
  return NYAT_ANON_NAME_CANDIDATES[
    Math.floor(Math.random() * NYAT_ANON_NAME_CANDIDATES.length)
  ];
}

function createPersistentAnonId(length = 8) {
  if (typeof window === "undefined") return "GUEST000".slice(0, length);
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < length; i += 1) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function formatDoodleTime(isoTime: string) {
  const ts = new Date(isoTime).getTime();
  if (Number.isNaN(ts)) return "時刻不明";
  const diffMs = Date.now() - ts;
  if (diffMs >= 0 && diffMs < 60 * 60 * 1000) {
    const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return `${mins}分前`;
  }
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

function formatNyatTime(isoTime?: string, fallback = "今") {
  if (!isoTime) return fallback;
  const ts = new Date(isoTime).getTime();
  if (Number.isNaN(ts)) return fallback;
  const diffMs = Date.now() - ts;
  if (diffMs >= 0 && diffMs < 60 * 60 * 1000) {
    const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return `${mins}分前`;
  }
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

async function shareBshPost(showToast: (message: string, isError?: boolean) => void) {
  const shareUrl = window.location.href;
  const shareText = `BSH Timesで見つけた可愛いブリティッシュショートヘアを見てニャ！ ${shareUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "BSH Times",
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch {
      return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("URLをコピーしたニャ！");
  } catch {
    showToast("URLコピーに失敗したニャ...", true);
  }
}

function PawAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const lounge = useBshVariant() === "lounge";
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 15 : 18;
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${
        lounge
          ? "border-bsh-gold/55 bg-bsh-graphite"
          : "border-[#4A4A4A] bg-[#F7C6CF]"
      }`}
      aria-hidden
    >
      <PawPrint size={iconSize} className={lounge ? "text-bsh-gold" : "text-[#9E5C67]"} />
    </div>
  );
}

function mapGalleryRowToDoodlePost(row: GalleryRow): DoodlePost {
  return {
    id: row.id,
    user: row.user_name,
    content: row.content,
    lang: "ja",
    translated: row.content,
    likes: row.likes_count,
    image: row.image_url,
    anonId: row.anon_id,
    createdAt: row.created_at,
  };
}

function mapStoryRowToStoryItem(row: StoryRow): StoryItem {
  return {
    id: row.id,
    name: row.user_name,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    createdAt: row.created_at,
  };
}

function mapSnsRowToFeedPost(row: SnsPostRow, resolvedImage: string, resolvedCarousel?: string[]): FeedPost {
  const imgs = resolvedCarousel && resolvedCarousel.length > 1 ? resolvedCarousel : undefined;
  return {
    id: row.id,
    user: row.user_name,
    content: row.content,
    lang: row.lang,
    translated: row.translated,
    likes: row.likes_count,
    image: resolvedImage,
    images: imgs,
    mediaType: row.media_type === "video" ? "video" : undefined,
    anonId: row.anon_id,
    createdAt: row.created_at,
  };
}

function mapGalleryCommentRowToThreadComment(row: GalleryCommentRow): ThreadComment {
  return {
    id: row.id,
    user: row.user_name,
    text: row.text,
    anonId: row.anon_id,
    createdAt: row.created_at,
    likesCount: (row as { likes_count?: number }).likes_count ?? 0,
  };
}

function getFileExtension(name: string, mimeType?: string) {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (!mimeType) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  return "jpg";
}

export function BshRetroApp({ variant = "classic" }: { variant?: "classic" | "lounge" }) {
  /** ホーム押下時：ストーリー帯〜最新投稿が見える位置へスクロール */
  const homeScrollRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLounge = variant === "lounge";
  const basePath = isLounge ? "/v2" : "";
  const [activeTab, setActiveTab] = useState('sns');
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(POSTS);
  const [doodlePosts, setDoodlePosts] = useState<DoodlePost[]>(DOODLE_POSTS);
  const [stories, setStories] = useState<StoryItem[]>(INITIAL_STORIES);
  const [feedComments, setFeedComments] = useState<Record<number, ThreadComment[]>>({});
  const [feedCommentTargetId, setFeedCommentTargetId] = useState<number | null>(null);
  const [newFeedCommentText, setNewFeedCommentText] = useState("");
  const [feedCommentsModalPostId, setFeedCommentsModalPostId] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
  const [feedLikeCounts, setFeedLikeCounts] = useState<Record<number, number>>({});
  const [threadPosts, setThreadPosts] = useState<ThreadItem[]>([]);
  const [likedThreads, setLikedThreads] = useState<Record<number, boolean>>({});
  const [threadLikeCounts, setThreadLikeCounts] = useState<Record<number, number>>({});
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [poppingStory, setPoppingStory] = useState<number | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState<string | null>(null);
  const [newStoryMediaType, setNewStoryMediaType] = useState<"image" | "video" | null>(null);
  const [storyLayers, setStoryLayers] = useState<StoryLayer[]>([]);
  const [storyTool, setStoryTool] = useState<"none" | "text" | "emoji" | "sticker">("none");
  const [storyDraftText, setStoryDraftText] = useState("");
  const [storyTextStyle, setStoryTextStyle] = useState<StoryTextStyle>("Modern");
  const [storyTextColor, setStoryTextColor] = useState("#FFFFFF");
  const [storyTextAlign, setStoryTextAlign] = useState<StoryTextAlign>("center");
  const [activeStoryLayerId, setActiveStoryLayerId] = useState<number | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState("");
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newPostImageFiles, setNewPostImageFiles] = useState<File[]>([]);
  const [feedCarouselIndex, setFeedCarouselIndex] = useState<Record<number, number>>({});
  const [isThreadComposerOpen, setIsThreadComposerOpen] = useState(false);
  const [newThreadText, setNewThreadText] = useState("");
  const [threadComments, setThreadComments] = useState<Record<number, ThreadComment[]>>({});
  const [commentTargetThreadId, setCommentTargetThreadId] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [browserAnonId, setBrowserAnonId] = useState("GUEST0000");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIsError, setToastIsError] = useState(false);

  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastIsError(isError);
  };
  /** 写真タップで拡大 */
  const [feedLightboxSrc, setFeedLightboxSrc] = useState<string | null>(null);
  const [doodleLightboxSrc, setDoodleLightboxSrc] = useState<string | null>(null);
  const [doodleLiked, setDoodleLiked] = useState<Record<number, boolean>>({});
  const [doodleLikeCounts, setDoodleLikeCounts] = useState<Record<number, number>>({});
  const [commentLiked, setCommentLiked] = useState<Record<number, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<number, number>>({});
  const [doodleComments, setDoodleComments] = useState<Record<number, ThreadComment[]>>({});
  const [doodleCommentTargetId, setDoodleCommentTargetId] = useState<number | null>(null);
  const [newDoodleCommentText, setNewDoodleCommentText] = useState("");
  const feedCarouselRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const feedDragStateRef = useRef({
    postId: -1,
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });
  /** カルーセルスクロール直後は click でライトボックスを開かない（スワイプと競合させない） */
  const feedCarouselScrollAtRef = useRef<Record<number, number>>({});
  const storyDragStateRef = useRef<{ startX: number | null; dragged: boolean }>({ startX: null, dragged: false });
  const storyStripRef = useRef<HTMLDivElement | null>(null);
  const storyStripDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0 });
  const storyEditorRef = useRef<HTMLDivElement | null>(null);
  const storyLayerMouseDragRef = useRef<{ layerId: number | null; startX: number; startY: number; baseX: number; baseY: number }>({
    layerId: null,
    startX: 0,
    startY: 0,
    baseX: 50,
    baseY: 35,
  });
  const storyLayerTouchRef = useRef<
    | { layerId: number; mode: "drag"; startX: number; startY: number; baseX: number; baseY: number }
    | { layerId: number; mode: "gesture"; startDist: number; startAngle: number; startScale: number; startRotation: number; centerStartX: number; centerStartY: number; baseX: number; baseY: number }
    | null
  >(null);
  /** loadFromSupabase の多重起動時、古いレスポンスで state を上書きしない */
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_BROWSER_ANON_ID);
      if (saved) {
        setBrowserAnonId(saved);
        return;
      }
      const generated = createPersistentAnonId(8);
      localStorage.setItem(LS_BROWSER_ANON_ID, generated);
      setBrowserAnonId(generated);
    } catch {
      setBrowserAnonId(createPersistentAnonId(8));
    }
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const duration = toastIsError ? 3500 : 1800;
    const timer = window.setTimeout(() => { setToastMessage(""); setToastIsError(false); }, duration);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (feedLightboxSrc === null && doodleLightboxSrc === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFeedLightboxSrc(null); setDoodleLightboxSrc(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedLightboxSrc, doodleLightboxSrc]);

  useEffect(() => {
    setFeedLikeCounts((prev) => {
      const next = { ...prev };
      feedPosts.forEach((post) => {
        if (next[post.id] === undefined) next[post.id] = post.likes ?? 0;
      });
      return next;
    });
  }, [feedPosts]);

  useEffect(() => {
    setThreadLikeCounts((prev) => {
      const next = { ...prev };
      threadPosts.forEach((post) => {
        if (next[post.id] === undefined) next[post.id] = 0;
      });
      return next;
    });
  }, [threadPosts]);

  useEffect(() => {
    setDoodleLikeCounts((prev) => {
      const next = { ...prev };
      doodlePosts.forEach((post) => {
        if (next[post.id] === undefined) next[post.id] = post.likes ?? 0;
      });
      return next;
    });
  }, [doodlePosts]);

  const scrollToHomeAnchor = useCallback(() => {
    requestAnimationFrame(() => {
      homeScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const togglePostLike = async (id: number) => {
    if (id < 0) {
      const nextLiked = !likedPosts[id];
      setLikedPosts((prev) => ({ ...prev, [id]: nextLiked }));
      setFeedLikeCounts((prev) => ({
        ...prev,
        [id]: Math.max(0, (prev[id] ?? feedPosts.find((p) => p.id === id)?.likes ?? 0) + (nextLiked ? 1 : -1)),
      }));
      return;
    }

    const currentlyLiked = !!likedPosts[id];
    const currentCount = feedLikeCounts[id] ?? feedPosts.find((p) => p.id === id)?.likes ?? 0;
    const targetCount = Math.max(0, currentCount + (currentlyLiked ? -1 : 1));

    setLikedPosts((prev) => ({ ...prev, [id]: !currentlyLiked }));
    setFeedLikeCounts((prev) => ({ ...prev, [id]: targetCount }));

    try {
      if (!currentlyLiked) {
        const likeInsert = await insertSnsPostLike(supabase, id, browserAnonId);
        if (likeInsert.error) throw likeInsert.error;
      } else {
        const likeDelete = await deleteSnsPostLike(supabase, id, browserAnonId);
        if (likeDelete.error) throw likeDelete.error;
      }

      const updateRes = await updateSnsPostLikeCount(supabase, id, targetCount);
      if (updateRes.error) throw updateRes.error;

      setFeedPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: targetCount } : p)),
      );
    } catch {
      setLikedPosts((prev) => ({ ...prev, [id]: currentlyLiked }));
      setFeedLikeCounts((prev) => ({ ...prev, [id]: currentCount }));
      showToast("いいね保存に失敗したニャ...", true);
    }
  };

  const handleStoryClick = (index: number) => {
    const visible = stories.filter((story) => {
      const created = new Date(story.createdAt).getTime();
      return Number.isFinite(created) && Date.now() - created < 24 * 60 * 60 * 1000;
    });
    const story = visible[index];
    if (!story) return;
    setActiveStory(story.id);
    setPoppingStory(story.id);
    setSelectedStoryIndex(index);
  };

  useEffect(() => {
    if (poppingStory === null) return;
    const timer = setTimeout(() => setPoppingStory(null), 420);
    return () => clearTimeout(timer);
  }, [poppingStory]);

  /** URL の ?tab= と同期 */
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "shop" || t === "threads" || t === "doodle") {
      setActiveTab(t);
    } else {
      setActiveTab("sns");
    }
  }, [searchParams]);

  /** 下部ナビからの ?compose= でモーダルを開ぁE*/
  useEffect(() => {
    const compose = searchParams.get("compose");
    if (!compose) return;

    if (compose === "sns") {
      setIsComposerOpen(true);
      setIsThreadComposerOpen(false);
    } else if (compose === "doodle") {
      setIsComposerOpen(true);
      setIsThreadComposerOpen(false);
      setActiveTab("doodle");
    } else if (compose === "thread") {
      setIsThreadComposerOpen(true);
      setIsComposerOpen(false);
      setActiveTab("threads");
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("compose");
    const qs = next.toString();
    const dest = qs ? (basePath ? `${basePath}?${qs}` : `/?${qs}`) : basePath || "/";
    router.replace(dest, { scroll: false });
  }, [searchParams, router, basePath]);

  useEffect(() => {
    const onScrollHome = () => scrollToHomeAnchor();
    window.addEventListener("bsh:scroll-home", onScrollHome);
    return () => window.removeEventListener("bsh:scroll-home", onScrollHome);
  }, [scrollToHomeAnchor]);

  const loadFromSupabase = useCallback(async () => {
    const gen = ++loadGenerationRef.current;
    const stale = () => gen !== loadGenerationRef.current;

    try {
      const now = new Date().toISOString();
      const [galleryRes, storiesRes, snsRes, nyatRes] = await Promise.all([
        supabase
          .from("gallery_posts")
          .select("id,user_name,anon_id,content,image_url,likes_count,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select("id,user_name,anon_id,media_url,media_type,created_at,expires_at")
          .gt("expires_at", now)
          .order("created_at", { ascending: false }),
        listSnsPosts(supabase, "nyad"),
        listSnsPosts(supabase, "nyat"),
      ]);

      if (stale()) return;

      if (!galleryRes.error && galleryRes.data != null) {
        const rows = galleryRes.data as GalleryRow[];
        const rowsForDisplay = await Promise.all(
          rows.map(async (row) => ({
            ...row,
            image_url: await resolveStorageUrlForDisplay(row.image_url),
          })),
        );
        if (stale()) return;

        setDoodlePosts(rowsForDisplay.map(mapGalleryRowToDoodlePost));
        setDoodleLikeCounts(
          rowsForDisplay.reduce<Record<number, number>>((acc, row) => {
            acc[row.id] = row.likes_count ?? 0;
            return acc;
          }, {}),
        );
        const postIds = rowsForDisplay.map((row) => row.id);
        if (postIds.length > 0) {
          const [commentsRes, likesRes] = await Promise.all([
            supabase
              .from("gallery_post_comments")
              .select("id,post_id,user_name,anon_id,text,created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true }),
            supabase
              .from("gallery_post_likes")
              .select("post_id")
              .eq("anon_id", browserAnonId)
              .in("post_id", postIds),
          ]);

          if (stale()) return;

          if (!commentsRes.error && commentsRes.data) {
            const grouped = (commentsRes.data as GalleryCommentRow[]).reduce<Record<number, ThreadComment[]>>((acc, row) => {
              const key = row.post_id;
              if (!acc[key]) acc[key] = [];
              acc[key].push(mapGalleryCommentRowToThreadComment(row));
              return acc;
            }, {});
            setDoodleComments(grouped);
          } else if (commentsRes.error) {
            showToast("ギャラリーコメントの読込に失敗したニャ...", true);
          }

          if (!likesRes.error && likesRes.data) {
            const likedMap = (likesRes.data as Array<{ post_id: number }>).reduce<Record<number, boolean>>((acc, row) => {
              acc[row.post_id] = true;
              return acc;
            }, {});
            setDoodleLiked(likedMap);
          } else if (likesRes.error) {
            showToast("いいね状態の読込に失敗したニャ...", true);
          }
        } else {
          setDoodleComments({});
          setDoodleLiked({});
        }
      } else if (galleryRes.error) {
        showToast("ギャラリーの読込に失敗したニャ...", true);
      }

      if (stale()) return;

      if (!storiesRes.error && storiesRes.data != null) {
        const sRows = storiesRes.data as StoryRow[];
        const storiesForDisplay = await Promise.all(
          sRows.map(async (row) => ({
            ...row,
            media_url: await resolveStorageUrlForDisplay(row.media_url),
          })),
        );
        if (stale()) return;
        setStories(storiesForDisplay.map(mapStoryRowToStoryItem));
      } else if (storiesRes.error) {
        showToast("ストーリーの読込に失敗したニャ...", true);
      }

      if (stale()) return;

      if (!snsRes.error && snsRes.data != null) {
        const snsRows = snsRes.data as SnsPostRow[];
        const rowsForDisplay = await Promise.all(
          snsRows.map(async (row) => {
            const multi = parseSnsImagesUrls(row.images_urls);
            if (multi.length >= 2) {
              const resolved = await Promise.all(multi.map((u) => resolveStorageUrlForDisplay(u)));
              return mapSnsRowToFeedPost(row, resolved[0], resolved);
            }
            const primary = await resolveStorageUrlForDisplay(row.image_url);
            return mapSnsRowToFeedPost(row, primary);
          }),
        );
        if (stale()) return;

        const snsIds = rowsForDisplay.map((p) => p.id);
        let snsCommentsGrouped: Record<number, ThreadComment[]> = {};
        let snsLikedMap: Record<number, boolean> = {};

        if (snsIds.length > 0) {
          const [snsCommentsRes, snsLikesRes] = await Promise.all([
            fetchSnsCommentsForPosts(supabase, snsIds),
            fetchSnsLikesForPosts(supabase, browserAnonId, snsIds),
          ]);

          if (stale()) return;

          if (!snsCommentsRes.error && snsCommentsRes.data) {
            snsCommentsGrouped = (snsCommentsRes.data as GalleryCommentRow[]).reduce<Record<number, ThreadComment[]>>((acc, row) => {
              const key = row.post_id;
              if (!acc[key]) acc[key] = [];
              acc[key].push(mapGalleryCommentRowToThreadComment(row));
              return acc;
            }, {});
          } else if (snsCommentsRes.error) {
            showToast("ニャードのコメント読込に失敗したニャ...", true);
          }

          if (!snsLikesRes.error && snsLikesRes.data) {
            snsLikedMap = (snsLikesRes.data as Array<{ post_id: number }>).reduce<Record<number, boolean>>((acc, row) => {
              acc[row.post_id] = true;
              return acc;
            }, {});
          } else if (snsLikesRes.error) {
            showToast("ニャードのいいね状態の読込に失敗したニャ...", true);
          }
        }

        setFeedPosts([...rowsForDisplay, ...POSTS]);

        setFeedComments((prev) => {
          const next: Record<number, ThreadComment[]> = {};
          for (const [k, v] of Object.entries(prev)) {
            const num = Number(k);
            if (num < 0 && Array.isArray(v)) next[num] = v;
          }
          snsIds.forEach((id) => {
            next[id] = snsCommentsGrouped[id] ?? [];
          });
          return next;
        });

        setLikedPosts((prev) => {
          const next: Record<number, boolean> = {};
          for (const [k, v] of Object.entries(prev)) {
            const num = Number(k);
            if (num < 0 && v) next[num] = true;
          }
          snsIds.forEach((id) => {
            next[id] = !!snsLikedMap[id];
          });
          return next;
        });

        setFeedLikeCounts((prev) => {
          const next = { ...prev };
          rowsForDisplay.forEach((p) => {
            next[p.id] = p.likes ?? 0;
          });
          return next;
        });
      } else if (snsRes.error) {
        const code = (snsRes.error as { code?: string }).code;
        const msg = snsRes.error.message ?? "";
        if (code === "42P01" || msg.includes("does not exist") || msg.includes("schema cache")) {
          showToast("ニャード用テーブルが無いニャ…Supabase で sns_feed.sql を実行してほしいニャ", true);
        } else {
          showToast("ニャードの読込に失敗したニャ...", true);
        }
      }

      if (stale()) return;

      if (!nyatRes.error && nyatRes.data != null) {
        const nyatRows = nyatRes.data as SnsPostRow[];
        const nyatItems: ThreadItem[] = nyatRows.map((row) => ({
          id: row.id,
          user: row.user_name.startsWith("@") ? row.user_name : `@${row.user_name}`,
          text: row.content,
          timeLabel: formatNyatTime(row.created_at, "今"),
          anonId: row.anon_id,
          createdAt: row.created_at,
        }));
        setThreadPosts(nyatItems);

        const nyatIds = nyatItems.map((t) => t.id);
        let nyatLikedMap: Record<number, boolean> = {};
        let nyatLikeCounts: Record<number, number> = {};

        nyatRows.forEach((row) => { nyatLikeCounts[row.id] = row.likes_count ?? 0; });

        if (nyatIds.length > 0) {
          const likesRes = await fetchSnsLikesForPosts(supabase, browserAnonId, nyatIds);
          if (stale()) return;
          if (!likesRes.error && likesRes.data) {
            nyatLikedMap = (likesRes.data as Array<{ post_id: number }>).reduce<Record<number, boolean>>((acc, row) => {
              acc[row.post_id] = true;
              return acc;
            }, {});
          }

          const commentsRes = await fetchSnsCommentsForPosts(supabase, nyatIds);
          if (stale()) return;
          if (!commentsRes.error && commentsRes.data) {
            const grouped = (commentsRes.data as SnsCommentRow[]).reduce<Record<number, ThreadComment[]>>((acc, row) => {
              if (!acc[row.post_id]) acc[row.post_id] = [];
              acc[row.post_id].push({ id: row.id, user: row.user_name, text: row.text, anonId: row.anon_id, createdAt: row.created_at, likesCount: row.likes_count ?? 0 });
              return acc;
            }, {});
            setThreadComments(grouped);
          }
        }

        setLikedThreads(nyatLikedMap);
        setThreadLikeCounts(nyatLikeCounts);
      } else if (nyatRes.error) {
        showToast("ニャットの読込に失敗したニャ...", true);
      }

      /* ─── Load comment likes for all visible comments ─── */
      if (stale()) return;
      const allCommentIds: number[] = [];
      const allCommentLikeCounts: Record<number, number> = {};
      const collectComments = (comments: Record<number, ThreadComment[]>) => {
        for (const arr of Object.values(comments)) {
          for (const c of arr) {
            allCommentIds.push(c.id);
            allCommentLikeCounts[c.id] = c.likesCount ?? 0;
          }
        }
      };
      collectComments(feedComments);
      collectComments(threadComments);
      collectComments(doodleComments);
      setCommentLikeCounts((prev) => ({ ...prev, ...allCommentLikeCounts }));

      if (allCommentIds.length > 0) {
        const clRes = await fetchCommentLikesForUser(supabase, browserAnonId, allCommentIds);
        if (stale()) return;
        if (!clRes.error && clRes.data) {
          const likedMap = (clRes.data as Array<{ comment_id: number }>).reduce<Record<number, boolean>>((acc, row) => {
            acc[row.comment_id] = true;
            return acc;
          }, {});
          setCommentLiked((prev) => ({ ...prev, ...likedMap }));
        }
      }
    } catch {
      if (!stale()) {
        showToast("サーバーとの同期に失敗したニャ…（通信を確認してほしいニャ）", true);
      }
    }
  }, [browserAnonId]);

  useEffect(() => {
    void loadFromSupabase();
  }, [loadFromSupabase]);

  /** タブを閉じたりバックグラウンドに長く置いたあと、再表示時に Supabase へ取りにいく */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadFromSupabase();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [loadFromSupabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`bsh-realtime-${browserAnonId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery_posts" }, () => {
        void loadFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery_post_comments" }, () => {
        void loadFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery_post_likes" }, () => {
        void loadFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {
        void loadFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sns_posts" }, () => {
        void loadFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sns_post_comments" }, () => {
        void loadFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sns_post_likes" }, () => {
        void loadFromSupabase();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [browserAnonId, loadFromSupabase]);

  const submitPost = async () => {
    try {
      const message = newPostMessage.trim();
      if (!message) return;
      const anonName = getRandomAnonName();
      const selectedImages = newPostImages.slice(0, 4);

      if (activeTab === "doodle") {
        const firstFile = newPostImageFiles[0];
        if (!firstFile) {
          showToast("ギャラリー投稿には画像が必要だニャ！", true);
          return;
        }
        const ext = getFileExtension(firstFile.name, firstFile.type);
        const path = `gallery/${browserAnonId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const uploadRes = await supabase.storage
          .from(SUPABASE_GALLERY_BUCKET)
          .upload(path, firstFile, { cacheControl: "3600", upsert: false });
        if (uploadRes.error) {
          showToast(`投稿に失敗したニャ！（画像アップロード: ${uploadRes.error.message}）`, true);
          return;
        }
        const { data: publicData } = supabase.storage.from(SUPABASE_GALLERY_BUCKET).getPublicUrl(path);
        const insertRes = await supabase
          .from("gallery_posts")
          .insert({
            user_name: ANON_DEFAULT_NAME,
            anon_id: browserAnonId,
            content: message,
            image_url: publicData.publicUrl,
            likes_count: 0,
          })
          .select("id,user_name,anon_id,content,image_url,likes_count,created_at")
          .single();

        if (insertRes.error || !insertRes.data) {
          showToast(`投稿に失敗したニャ！（DB保存: ${insertRes.error?.message ?? "データなし"}）`, true);
          return;
        }
        const row = insertRes.data as GalleryRow;
        setDoodlePosts((prev) => [mapGalleryRowToDoodlePost(row), ...prev]);
      } else {
        const fallbackImg = "https://images.unsplash.com/photo-1513245543132-31f507417b26";
        const uploadedUrls: string[] = [];
        for (let i = 0; i < newPostImageFiles.length; i++) {
          const file = newPostImageFiles[i];
          const ext = getFileExtension(file.name, file.type);
          const path = `sns/${browserAnonId}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
          const uploadRes = await supabase.storage.from(SUPABASE_GALLERY_BUCKET).upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
          if (uploadRes.error) {
            showToast(`投稿に失敗したニャ！（画像${i + 1}枚目: ${uploadRes.error.message}）`, true);
            return;
          }
          const { data: pub } = supabase.storage.from(SUPABASE_GALLERY_BUCKET).getPublicUrl(path);
          uploadedUrls.push(pub.publicUrl);
        }

        const primaryFromPreview =
          selectedImages.length > 0 ? selectedImages[0] : undefined;
        const primary = uploadedUrls[0] ?? primaryFromPreview ?? fallbackImg;
        const imagesUrlsPayload = uploadedUrls.length >= 2 ? uploadedUrls : [];

        const insertRes = await insertSnsPost(supabase, {
          user_name: anonName,
          anon_id: browserAnonId,
          content: message,
          lang: "ja",
          translated: message,
          image_url: primary,
          images_urls: imagesUrlsPayload,
          media_type: "image",
          likes_count: 0,
        });

        if (insertRes.error || !insertRes.data) {
          showToast(`投稿に失敗したニャ！（DB保存: ${insertRes.error?.message ?? "データなし"}）`, true);
          return;
        }

        const row = insertRes.data as SnsPostRow;
        const multi = parseSnsImagesUrls(row.images_urls);
        let displayImage: string;
        let displayCarousel: string[] | undefined;
        if (multi.length >= 2) {
          const resolved = await Promise.all(multi.map((u) => resolveStorageUrlForDisplay(u)));
          displayImage = resolved[0];
          displayCarousel = resolved;
        } else {
          displayImage = await resolveStorageUrlForDisplay(row.image_url);
          displayCarousel = undefined;
        }

        const mapped = mapSnsRowToFeedPost(row, displayImage, displayCarousel);
        setFeedPosts((prev) => [mapped, ...prev.filter((p) => p.id !== mapped.id)]);
      }
      setNewPostMessage("");
      setNewPostImages([]);
      setNewPostImageFiles([]);
      setIsComposerOpen(false);
      setActiveTab(activeTab === "doodle" ? "doodle" : "sns");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "原因不明";
      showToast(`投稿に失敗したニャ！（${msg}）`, true);
    }
  };

  const submitThread = async () => {
    const text = newThreadText.trim();
    if (!text) return;
    const anonName = getRandomNyatAnonName();

    setNewThreadText("");
    setIsThreadComposerOpen(false);
    setActiveTab("threads");

    try {
      const { data, error } = await insertSnsPost(supabase, {
        user_name: anonName,
        anon_id: browserAnonId,
        content: text,
        lang: "ja",
        translated: "",
        image_url: "",
        images_urls: [],
        media_type: "image",
        likes_count: 0,
        tab: "nyat",
      });

      if (error) {
        showToast(`ニャットの投稿に失敗したニャ！(${error.message})`, true);
        return;
      }

      if (data) {
        const row = data as SnsPostRow;
        const item: ThreadItem = {
          id: row.id,
          user: row.user_name.startsWith("@") ? row.user_name : `@${row.user_name}`,
          text: row.content,
          timeLabel: "今",
          anonId: row.anon_id,
          createdAt: row.created_at,
        };
        setThreadPosts((prev) => [item, ...prev]);
      }
    } catch {
      showToast("ニャットの投稿に失敗したニャ！", true);
    }
  };

  const toggleThreadLike = async (id: number) => {
    const nextLiked = !likedThreads[id];
    setLikedThreads((prev) => ({ ...prev, [id]: nextLiked }));
    const newCount = Math.max(0, (threadLikeCounts[id] ?? 0) + (nextLiked ? 1 : -1));
    setThreadLikeCounts((prev) => ({ ...prev, [id]: newCount }));
    try {
      if (nextLiked) {
        await insertSnsPostLike(supabase, id, browserAnonId);
      } else {
        await deleteSnsPostLike(supabase, id, browserAnonId);
      }
      await updateSnsPostLikeCount(supabase, id, newCount);
    } catch {
      /* revert on error */
      setLikedThreads((prev) => ({ ...prev, [id]: !nextLiked }));
      setThreadLikeCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (nextLiked ? -1 : 1) }));
    }
  };

  const toggleCommentLike = async (commentId: number) => {
    const nextLiked = !commentLiked[commentId];
    setCommentLiked((prev) => ({ ...prev, [commentId]: nextLiked }));
    const newCount = Math.max(0, (commentLikeCounts[commentId] ?? 0) + (nextLiked ? 1 : -1));
    setCommentLikeCounts((prev) => ({ ...prev, [commentId]: newCount }));
    try {
      if (nextLiked) {
        await insertCommentLike(supabase, commentId, browserAnonId);
      } else {
        await deleteCommentLike(supabase, commentId, browserAnonId);
      }
      await updateCommentLikeCount(supabase, commentId, newCount);
    } catch {
      setCommentLiked((prev) => ({ ...prev, [commentId]: !nextLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: (prev[commentId] ?? 0) + (nextLiked ? -1 : 1) }));
    }
  };

  const removeFeedPost = async (id: number) => {
    if (id < 0) {
      setFeedPosts((prev) => prev.filter((post) => post.id !== id));
      setLikedPosts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setFeedLikeCounts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setFeedComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    const prevPosts = feedPosts;
    const prevLiked = likedPosts;
    const prevCounts = feedLikeCounts;
    const prevComments = feedComments;

    setFeedPosts((prev) => prev.filter((post) => post.id !== id));
    setLikedPosts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFeedLikeCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFeedComments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const { error } = await deleteSnsPost(supabase, id);
    if (error) {
      setFeedPosts(prevPosts);
      setLikedPosts(prevLiked);
      setFeedLikeCounts(prevCounts);
      setFeedComments(prevComments);
      showToast("投稿の削除に失敗したニャ...", true);
    }
  };

  const submitFeedComment = async (postId: number) => {
    const text = newFeedCommentText.trim();
    if (!text) return;

    if (postId < 0) {
      const item: ThreadComment = {
        id: Date.now(),
        user: "@名無しのBSH",
        text,
        anonId: browserAnonId,
        createdAt: new Date().toISOString(),
      };
      setFeedComments((prev) => {
        const existing = prev[postId] ?? [];
        return { ...prev, [postId]: [...existing, item] };
      });
      setNewFeedCommentText("");
      setFeedCommentTargetId(null);
      return;
    }

    const insertRes = await insertSnsPostComment(supabase, {
      post_id: postId,
      user_name: "@名無しのBSH",
      anon_id: browserAnonId,
      text,
    });

    if (insertRes.error || !insertRes.data) {
      showToast("コメントの保存に失敗したニャ...", true);
      return;
    }

    const item = mapGalleryCommentRowToThreadComment(insertRes.data as GalleryCommentRow);
    setFeedComments((prev) => {
      const existing = prev[postId] ?? [];
      return { ...prev, [postId]: [...existing, item] };
    });
    setNewFeedCommentText("");
    setFeedCommentTargetId(null);
  };

  const removeFeedComment = async (postId: number, commentId: number) => {
    if (postId < 0) {
      setFeedComments((prev) => {
        const existing = prev[postId] ?? [];
        return { ...prev, [postId]: existing.filter((comment) => comment.id !== commentId) };
      });
      return;
    }

    const prevComments = feedComments;
    setFeedComments((prevMap) => {
      const existing = prevMap[postId] ?? [];
      return { ...prevMap, [postId]: existing.filter((comment) => comment.id !== commentId) };
    });

    const { error } = await deleteSnsPostComment(supabase, postId, commentId);
    if (error) {
      setFeedComments(prevComments);
      showToast("コメント削除に失敗したニャ...", true);
    }
  };

  const removeThreadPost = (id: number) => {
    setThreadPosts((prev) => prev.filter((thread) => thread.id !== id));
    setLikedThreads((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setThreadLikeCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setThreadComments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const removeDoodlePost = async (id: number) => {
    const prevPosts = doodlePosts;
    setDoodlePosts((prev) => prev.filter((post) => post.id !== id));
    const { error } = await supabase.from("gallery_posts").delete().eq("id", id);
    if (error) {
      setDoodlePosts(prevPosts);
      showToast("ギャラリー投稿の削除に失敗したニャ...", true);
      return;
    }
    setDoodleLiked((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDoodleLikeCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleDoodleLike = async (id: number) => {
    const currentlyLiked = !!doodleLiked[id];
    const currentCount = doodleLikeCounts[id] ?? doodlePosts.find((post) => post.id === id)?.likes ?? 0;
    const targetCount = Math.max(0, currentCount + (currentlyLiked ? -1 : 1));

    setDoodleLiked((prev) => ({ ...prev, [id]: !currentlyLiked }));
    setDoodleLikeCounts((prev) => ({ ...prev, [id]: targetCount }));

    try {
      if (!currentlyLiked) {
        const likeInsert = await supabase.from("gallery_post_likes").insert({
          post_id: id,
          anon_id: browserAnonId,
        });
        if (likeInsert.error) throw likeInsert.error;
      } else {
        const likeDelete = await supabase
          .from("gallery_post_likes")
          .delete()
          .eq("post_id", id)
          .eq("anon_id", browserAnonId);
        if (likeDelete.error) throw likeDelete.error;
      }

      const updateRes = await supabase
        .from("gallery_posts")
        .update({
          likes_count: targetCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateRes.error) throw updateRes.error;
    } catch {
      setDoodleLiked((prev) => ({ ...prev, [id]: currentlyLiked }));
      setDoodleLikeCounts((prev) => ({ ...prev, [id]: currentCount }));
      showToast("いいね保存に失敗したニャ...", true);
    }
  };

  const openDoodleCommentModal = (postId: number) => {
    setDoodleCommentTargetId(postId);
    setNewDoodleCommentText("");
  };

  const submitDoodleComment = async () => {
    const targetPostId = doodleCommentTargetId;
    if (targetPostId === null) return;
    const text = newDoodleCommentText.trim();
    if (!text) return;

    const item: ThreadComment = {
      id: Date.now(),
      user: "@名無しのBSH",
      text,
      anonId: browserAnonId,
      createdAt: new Date().toISOString(),
    };

    const insertRes = await supabase
      .from("gallery_post_comments")
      .insert({
        post_id: targetPostId,
        user_name: item.user,
        anon_id: item.anonId ?? browserAnonId,
        text: item.text,
      })
      .select("id,post_id,user_name,anon_id,text,created_at")
      .single();

    if (insertRes.error || !insertRes.data) {
      showToast("コメント保存に失敗したニャ...", true);
      return;
    }

    const saved = mapGalleryCommentRowToThreadComment(insertRes.data as GalleryCommentRow);
    setDoodleComments((prev) => {
      const existing = prev[targetPostId] ?? [];
      return {
        ...prev,
        [targetPostId]: [...existing, saved],
      };
    });
    setNewDoodleCommentText("");
    setDoodleCommentTargetId(null);
  };

  const handleStoryMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // TODO(video): Supabase連携後に動画プレビュー/保存を有効化する
    if (file.type.startsWith("video/")) {
      showToast("動画投稿は準備中ニャ。今は画像のみ対応してるニャ！");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewStoryMediaUrl(reader.result);
        setNewStoryMediaType("image");
        setStoryLayers([]);
        setActiveStoryLayerId(null);
        setStoryTool("none");
      }
    };
    reader.onerror = () => showToast("ストーリー素材の読み込みに失敗したニャ...", true);
    reader.readAsDataURL(file);
  };

  const addStoryTextLayer = () => {
    const text = storyDraftText.trim();
    if (!text) return;
    const item: StoryLayer = {
      id: Date.now(),
      kind: "text",
      text,
      x: 50,
      y: 22,
      scale: 1,
      rotation: 0,
      color: storyTextColor,
      style: storyTextStyle,
      align: storyTextAlign,
    };
    setStoryLayers((prev) => [...prev, item]);
    setActiveStoryLayerId(item.id);
    setStoryDraftText("");
  };

  const addStoryEmojiLayer = (emoji: string) => {
    const item: StoryLayer = {
      id: Date.now() + Math.floor(Math.random() * 999),
      kind: "emoji",
      text: emoji,
      x: 50,
      y: 34,
      scale: 1,
      rotation: 0,
    };
    setStoryLayers((prev) => [...prev, item]);
    setActiveStoryLayerId(item.id);
  };

  const updateStoryLayer = (layerId: number, patch: Partial<StoryLayer>) => {
    setStoryLayers((prev) => prev.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)));
  };

  const getEditorPointAsPercent = (clientX: number, clientY: number) => {
    const rect = storyEditorRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const getTouchesDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const getTouchesAngle = (touches: React.TouchList) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const startStoryLayerMouseDrag = (layer: StoryLayer, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveStoryLayerId(layer.id);
    storyLayerMouseDragRef.current = {
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      baseX: layer.x,
      baseY: layer.y,
    };
  };

  const moveStoryLayerMouseDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const drag = storyLayerMouseDragRef.current;
    if (drag.layerId === null) return;
    const rect = storyEditorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxPercent = ((e.clientX - drag.startX) / rect.width) * 100;
    const dyPercent = ((e.clientY - drag.startY) / rect.height) * 100;
    updateStoryLayer(drag.layerId, {
      x: Math.min(100, Math.max(0, drag.baseX + dxPercent)),
      y: Math.min(100, Math.max(0, drag.baseY + dyPercent)),
    });
  };

  const endStoryLayerMouseDrag = () => {
    storyLayerMouseDragRef.current.layerId = null;
  };

  const onStoryLayerWheel = (layer: StoryLayer, e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    updateStoryLayer(layer.id, { scale: Math.min(3, Math.max(0.4, layer.scale + delta)) });
  };

  const startStoryLayerTouch = (layer: StoryLayer, e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActiveStoryLayerId(layer.id);
    if (e.touches.length === 1) {
      storyLayerTouchRef.current = {
        layerId: layer.id,
        mode: "drag",
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        baseX: layer.x,
        baseY: layer.y,
      };
      return;
    }
    if (e.touches.length >= 2) {
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      storyLayerTouchRef.current = {
        layerId: layer.id,
        mode: "gesture",
        startDist: getTouchesDistance(e.touches),
        startAngle: getTouchesAngle(e.touches),
        startScale: layer.scale,
        startRotation: layer.rotation,
        centerStartX: centerX,
        centerStartY: centerY,
        baseX: layer.x,
        baseY: layer.y,
      };
    }
  };

  const moveStoryLayerTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = storyLayerTouchRef.current;
    if (!state) return;
    e.preventDefault();
    if (state.mode === "drag" && e.touches.length === 1) {
      const rect = storyEditorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dxPercent = ((e.touches[0].clientX - state.startX) / rect.width) * 100;
      const dyPercent = ((e.touches[0].clientY - state.startY) / rect.height) * 100;
      updateStoryLayer(state.layerId, {
        x: Math.min(100, Math.max(0, state.baseX + dxPercent)),
        y: Math.min(100, Math.max(0, state.baseY + dyPercent)),
      });
      return;
    }
    if (state.mode === "gesture" && e.touches.length >= 2) {
      const nowDist = getTouchesDistance(e.touches);
      const nowAngle = getTouchesAngle(e.touches);
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const center = getEditorPointAsPercent(centerX, centerY);
      const startCenter = getEditorPointAsPercent(state.centerStartX, state.centerStartY);
      updateStoryLayer(state.layerId, {
        scale: Math.min(3, Math.max(0.4, state.startScale * (nowDist / state.startDist))),
        rotation: state.startRotation + (nowAngle - state.startAngle),
        x: Math.min(100, Math.max(0, state.baseX + (center.x - startCenter.x))),
        y: Math.min(100, Math.max(0, state.baseY + (center.y - startCenter.y))),
      });
    }
  };

  const endStoryLayerTouch = () => {
    storyLayerTouchRef.current = null;
  };

  const finalizeStoryComposition = async (applyToPreview = true) => {
    if (!newStoryMediaUrl || newStoryMediaType !== "image") return null;
    if (storyLayers.length === 0) return newStoryMediaUrl;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("image load error"));
        el.src = newStoryMediaUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      storyLayers.forEach((layer) => {
        const px = (layer.x / 100) * canvas.width;
        const py = (layer.y / 100) * canvas.height;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scale, layer.scale);
        if (layer.kind === "text") {
          ctx.fillStyle = layer.color ?? "#FFFFFF";
          ctx.font = `bold ${Math.max(26, Math.round(canvas.width * 0.055))}px ${STORY_FONT_MAP[layer.style ?? "Modern"]}`;
          ctx.textAlign = layer.align ?? "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "rgba(0,0,0,0.25)";
          ctx.lineWidth = 4;
          ctx.strokeText(layer.text, 0, 0);
          ctx.fillText(layer.text, 0, 0);
        } else {
          ctx.font = `${Math.max(38, Math.round(canvas.width * 0.07))}px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(layer.text, 0, 0);
        }
        ctx.restore();
      });

      const composedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      if (applyToPreview) {
        setNewStoryMediaUrl(composedDataUrl);
        setStoryLayers([]);
        setActiveStoryLayerId(null);
        setStoryTool("none");
        showToast("編集内容を画像に合成したニャ！");
      }
      return composedDataUrl;
    } catch {
      showToast("ストーリー編集の合成に失敗したニャ...", true);
      return null;
    }
  };

  const submitStory = async () => {
    try {
      if (!newStoryMediaUrl || !newStoryMediaType) return;
      let mediaDataUrl = newStoryMediaUrl;
      if (newStoryMediaType === "image" && storyLayers.length > 0) {
        const composed = await finalizeStoryComposition(false);
        if (!composed) return;
        mediaDataUrl = composed;
      }

      const blobRes = await fetch(mediaDataUrl);
      const blob = await blobRes.blob();
      const ext = getFileExtension("story-image.jpg", blob.type);
      const path = `stories/${browserAnonId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const uploadRes = await supabase.storage
        .from(SUPABASE_STORY_BUCKET)
        .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: blob.type || "image/jpeg" });

      if (uploadRes.error) {
        showToast("ストーリー画像のアップロードに失敗したニャ...", true);
        return;
      }

      const { data: publicData } = supabase.storage.from(SUPABASE_STORY_BUCKET).getPublicUrl(path);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const insertRes = await supabase
        .from("stories")
        .insert({
          user_name: "名無しのBSH",
          anon_id: browserAnonId,
          media_url: publicData.publicUrl,
          media_type: "image",
          caption: "",
          expires_at: expiresAt,
        })
        .select("id,user_name,anon_id,media_url,media_type,created_at,expires_at")
        .single();

      if (insertRes.error || !insertRes.data) {
        showToast("ストーリー保存に失敗したニャ...", true);
        return;
      }

      const item = mapStoryRowToStoryItem(insertRes.data as StoryRow);
      setStories((prev) => [item, ...prev]);
      setNewStoryMediaUrl(null);
      setNewStoryMediaType(null);
      setStoryLayers([]);
      setActiveStoryLayerId(null);
      setStoryTool("none");
      setIsStoryComposerOpen(false);
    } catch {
      showToast("ストーリー投稿に失敗したニャ...", true);
    }
  };

  const closeStoryViewer = () => {
    setSelectedStoryIndex(null);
  };

  const goNextStory = () => {
    setSelectedStoryIndex((prev) => {
      if (prev === null) return prev;
      const visibleCount = stories.filter((story) => {
        const created = new Date(story.createdAt).getTime();
        return Number.isFinite(created) && Date.now() - created < 24 * 60 * 60 * 1000;
      }).length;
      if (prev >= visibleCount - 1) return null;
      return prev + 1;
    });
  };

  const goPrevStory = () => {
    setSelectedStoryIndex((prev) => {
      if (prev === null) return prev;
      return Math.max(0, prev - 1);
    });
  };

  const scrollFeedCarouselTo = (postId: number, targetIndex: number) => {
    const container = feedCarouselRefs.current[postId];
    if (!container) return;
    const width = container.clientWidth;
    container.scrollTo({ left: width * targetIndex, behavior: "smooth" });
  };

  const startFeedDrag = (postId: number, e: React.MouseEvent<HTMLDivElement>) => {
    const container = feedCarouselRefs.current[postId];
    if (!container) return;
    feedDragStateRef.current = {
      postId,
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: container.scrollLeft,
    };
  };

  const onFeedDragMove = (postId: number, e: React.MouseEvent<HTMLDivElement>) => {
    const drag = feedDragStateRef.current;
    if (!drag.isDragging || drag.postId !== postId) return;
    const container = feedCarouselRefs.current[postId];
    if (!container) return;
    const delta = e.clientX - drag.startX;
    container.scrollLeft = drag.startScrollLeft - delta;
  };

  const endFeedDrag = () => {
    feedDragStateRef.current.isDragging = false;
    feedDragStateRef.current.postId = -1;
  };

  const startStoryStripDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = storyStripRef.current;
    if (!container) return;
    storyStripDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: container.scrollLeft,
    };
  };

  const moveStoryStripDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const drag = storyStripDragRef.current;
    if (!drag.isDragging) return;
    const container = storyStripRef.current;
    if (!container) return;
    const delta = e.clientX - drag.startX;
    container.scrollLeft = drag.startScrollLeft - delta;
  };

  const endStoryStripDrag = () => {
    storyStripDragRef.current.isDragging = false;
  };

  const removeThreadComment = async (threadId: number, commentId: number) => {
    setThreadComments((prev) => {
      const target = prev[threadId] ?? [];
      return { ...prev, [threadId]: target.filter((c) => c.id !== commentId) };
    });
    try {
      await deleteSnsPostComment(supabase, threadId, commentId);
    } catch { /* best-effort */ }
  };

  const openThreadCommentModal = (threadId: number) => {
    setCommentTargetThreadId(threadId);
    setNewCommentText("");
  };

  const submitThreadComment = async () => {
    if (commentTargetThreadId === null) return;
    const text = newCommentText.trim();
    if (!text) return;
    const anonName = getRandomNyatAnonName();
    const targetId = commentTargetThreadId;
    setNewCommentText("");
    setCommentTargetThreadId(null);

    try {
      const { data, error } = await insertSnsPostComment(supabase, {
        post_id: targetId,
        user_name: anonName,
        anon_id: browserAnonId,
        text,
      });
      if (error) {
        showToast(`コメント投稿に失敗したニャ！(${error.message})`, true);
        return;
      }
      if (data) {
        const row = data as SnsCommentRow;
        const item: ThreadComment = {
          id: row.id,
          user: row.user_name,
          text: row.text,
          anonId: row.anon_id,
          createdAt: row.created_at,
        };
        setThreadComments((prev) => ({
          ...prev,
          [targetId]: [...(prev[targetId] ?? []), item],
        }));
      }
    } catch {
      showToast("コメント投稿に失敗したニャ！", true);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    if (files.length === 0) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("invalid image result"));
              }
            };
            reader.onerror = () => reject(reader.error ?? new Error("failed to read image"));
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((images) => {
        setNewPostImages(images);
        setNewPostImageFiles(files);
      })
      .catch(() => {
        showToast("画像の読み込みに失敗したニャ...", true);
      });
  };

  const visibleStories = stories.filter((story) => {
    const created = new Date(story.createdAt).getTime();
    return Number.isFinite(created) && Date.now() - created < 24 * 60 * 60 * 1000;
  });
  const selectedStory = selectedStoryIndex !== null ? visibleStories[selectedStoryIndex] ?? null : null;

  useEffect(() => {
    if (selectedStoryIndex === null || !selectedStory) return;
    setActiveStory(selectedStory.id);
    if (selectedStory.mediaType === "video") return;
    const timer = window.setTimeout(() => {
      goNextStory();
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [selectedStoryIndex, selectedStory]);

  return (
    <BshVariantProvider value={variant}>
      <div
        className={
          isLounge
            ? "bsh-v2-lounge relative z-0 mx-auto min-h-screen max-w-md bg-lounge-night pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] font-[family-name:var(--font-bsh-inter),ui-sans-serif,system-ui,sans-serif] font-light text-bsh-ivory shadow-none transition-colors duration-300 ease-out"
            : "relative z-0 mx-auto min-h-screen max-w-md bg-[#FAF9F6] pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] font-['Zen_Maru_Gothic',sans-serif] text-[#4A4A4A] shadow-2xl"
        }
      >
        {/* 共通スタイル（丸ゴシック）— /v2 ではレイアウト側フォントを使用 */}
        {!isLounge && (
          <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700&display=swap');
            @keyframes storyPop {
              0% { transform: scale(1); }
              55% { transform: scale(1.14); }
              100% { transform: scale(1.06); }
            }
            @keyframes modalFadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            @keyframes modalZoomIn {
              0% { opacity: 0; transform: scale(0.9); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        )}
        {isLounge && (
          <style jsx global>{`
            @keyframes storyPop {
              0% { transform: scale(1); }
              55% { transform: scale(1.14); }
              100% { transform: scale(1.06); }
            }
            @keyframes modalFadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            @keyframes modalZoomIn {
              0% { opacity: 0; transform: scale(0.9); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        )}

        {/* ヘッダー */}
        <header
          className={
            isLounge
              ? "sticky top-0 z-30 flex items-center justify-between border-b border-bsh-gold/20 bg-gradient-to-r from-bsh-noir via-bsh-velvet to-bsh-noir px-5 py-3 backdrop-blur-md transition-colors duration-300 ease-out"
              : "sticky top-0 z-30 flex items-center justify-between border-b-4 border-[#607D8B] bg-[#F5EFE6] px-5 py-3"
          }
        >
          <h1
            className={
              isLounge
                ? "font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-2xl font-semibold italic tracking-[0.05em] text-bsh-gold transition-opacity duration-300 ease-out"
                : "text-2xl font-bold italic tracking-tighter text-[#607D8B]"
            }
          >
            BSH Times <span className={isLounge ? "text-bsh-gold" : ""}>🐾</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className={
                isLounge
                  ? "bsh-update-btn rounded-full px-3 py-1 text-[10px] font-bold tracking-wide text-[#D9C0A3]"
                  : "rounded-full border border-[#607D8B] bg-[#FFF8EE] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#607D8B] transition-opacity hover:opacity-80"
              }
            >
              Update
            </button>
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className={
                isLounge
                  ? "text-bsh-amber transition-opacity duration-300 ease-out hover:opacity-80"
                  : "text-[#D4A373] transition-opacity hover:opacity-70"
              }
              aria-label="Google を別タブで開く"
            >
              <Globe size={24} aria-hidden />
            </a>
          </div>
        </header>

      {isUpdateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => setIsUpdateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="更新履歴"
        >
          <div
            className={
              isLounge
                ? "bsh-lounge-card bsh-lounge-card-surface w-full max-w-md max-h-[86vh] overflow-y-auto rounded-xl p-4 shadow-[0_20px_50px_-15px_rgba(90,20,30,0.6)] animate-[modalZoomIn_260ms_ease-out]"
                : "w-full max-w-md max-h-[86vh] overflow-y-auto rounded-2xl border-2 border-[#607D8B] bg-[#FFF8EE] p-4 shadow-xl animate-[modalZoomIn_260ms_ease-out]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                className={
                  isLounge
                    ? "font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-base font-semibold tracking-wide text-bsh-gold"
                    : "text-base font-bold text-[#607D8B]"
                }
              >
                Update History
              </h2>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-gold/40 px-2 py-0.5 text-[11px] font-semibold text-bsh-gold transition-opacity duration-300 ease-out hover:opacity-85"
                    : "rounded-full border border-[#607D8B] px-2 py-0.5 text-[11px] font-bold text-[#607D8B]"
                }
              >
                閉じる
              </button>
            </div>
            <div className="space-y-3">
              {UPDATE_LOGS.map((log) => (
                <section
                  key={log.date}
                  className={
                    isLounge
                      ? "rounded-lg border border-bsh-gold/15 bg-bsh-noir/60 px-3 py-2 backdrop-blur-sm"
                      : "rounded-xl border border-[#D4A373] bg-[#FFFCF7] px-3 py-2"
                  }
                >
                  <p className={isLounge ? "text-xs font-semibold text-bsh-amber" : "text-xs font-bold text-[#607D8B]"}>{log.date}</p>
                  <ul className={isLounge ? "mt-1 space-y-1 text-[11px] leading-snug text-bsh-ivory/90" : "mt-1 space-y-1 text-[11px] leading-snug text-[#4A4A4A]"}>
                    {log.items.map((item) => (
                      <li key={item}>・{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ナビゲーションタブ */}
      <nav
        className={
          isLounge
            ? "sticky top-[64px] z-20 flex border-b border-bsh-gold/15 bg-bsh-noir/95 backdrop-blur-md transition-colors duration-300 ease-out"
            : "sticky top-[64px] z-20 flex border-b-2 border-[#607D8B] bg-white"
        }
      >
        {[
          { key: "sns", label: "ニャード" },
          { key: "threads", label: "ニャット" },
          { key: "doodle", label: "ギャラリー" },
          { key: "shop", label: "SHOP" },
        ].map((tab) => (
          <button 
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "sns") {
                router.replace(basePath || "/", { scroll: false });
              } else {
                const q = `tab=${tab.key}`;
                router.replace(basePath ? `${basePath}?${q}` : `/?${q}`, { scroll: false });
              }
            }}
            className={`flex-1 py-1.5 text-[11px] font-bold tracking-tight transition-all duration-300 ease-out ${
              activeTab === tab.key
                ? isLounge
                  ? "bg-gradient-to-b from-bsh-wine to-bsh-bordeaux text-bsh-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "bg-[#607D8B] text-white"
                : isLounge
                  ? "text-bsh-ivory/90 hover:bg-white/5"
                  : "text-[#607D8B] hover:bg-[#F5EFE6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ストーリー（ホームスクロールの先頭） */}
      <section
        ref={homeScrollRef}
        className={
          isLounge
            ? "scroll-mt-28 border-b border-bsh-gold/15 bg-gradient-to-b from-bsh-velvet to-bsh-noir px-4 py-2 transition-colors duration-300 ease-out"
            : "scroll-mt-28 border-b-2 border-[#EADBC8] bg-[#FFF8EE] px-4 py-2"
        }
      >
        <div
          ref={storyStripRef}
          className="flex cursor-grab gap-4 overflow-x-auto overscroll-x-contain pb-1 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x_pan-y] active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: "touch" }}
          onMouseDown={startStoryStripDrag}
          onMouseMove={moveStoryStripDrag}
          onMouseUp={endStoryStripDrag}
          onMouseLeave={endStoryStripDrag}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedStoryIndex(null);
              setIsThreadComposerOpen(false);
              setIsStoryComposerOpen(true);
            }}
            className="touch-manipulation flex flex-shrink-0 flex-col items-center pt-1 transition-transform active:scale-95"
            aria-label="ストーリーを追加"
          >
            <span className="relative block h-11 w-11 shrink-0">
              <img
                src={ME_STORY_AVATAR}
                alt=""
                className={
                  isLounge
                    ? "h-full w-full rounded-full border-2 border-bsh-gold/40 bg-bsh-graphite object-cover"
                    : "h-full w-full rounded-full border-2 border-[#DBDBDB] bg-[#FAF9F6] object-cover"
                }
              />
              <span
                className={
                  isLounge
                    ? "absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[2.5px] border-bsh-noir bg-gradient-to-br from-bsh-wine to-bsh-bordeaux text-bsh-gold shadow-sm"
                    : "absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[2.5px] border-[#FFF8EE] bg-[#0095F6] text-white shadow-sm"
                }
                aria-hidden
              >
                <Plus size={11} strokeWidth={3} className={isLounge ? "text-bsh-gold" : "text-white"} />
              </span>
            </span>
          </button>
          {visibleStories.map((story, idx) => (
            <button
              key={story.id}
              type="button"
              onClick={() => handleStoryClick(idx)}
              className="touch-manipulation flex-shrink-0 flex flex-col items-center pt-1 group"
              aria-label={`${story.name}のストーリー`}
            >
              <span
                className={`p-[3px] rounded-full bg-gradient-to-tr shadow-sm transition-all duration-300 ease-out ${
                  isLounge
                    ? "from-bsh-gold via-bsh-amber to-bsh-bordeaux"
                    : "from-[#F6B36A] via-[#E56B6F] to-[#8E7DBE]"
                } ${activeStory === story.id ? "shadow-[0_0_0_2px_rgba(250,249,246,0.95)]" : ""}`}
              >
                <span
                  className={`block h-11 w-11 overflow-hidden rounded-full p-[2px] transition-transform duration-300 ease-out ${
                    isLounge ? "bg-bsh-graphite" : "bg-[#FAF9F6]"
                  } ${poppingStory === story.id ? "animate-[storyPop_420ms_ease-out] scale-105" : "group-hover:scale-105"}`}
                >
                  {story.mediaType === "video" ? (
                    <video
                      src={story.mediaUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className={
                        isLounge
                          ? "h-full w-full rounded-full border-2 border-bsh-graphite object-cover"
                          : "h-full w-full rounded-full border-2 border-[#FAF9F6] object-cover"
                      }
                    />
                  ) : (
                    <img
                      src={story.mediaUrl}
                      alt={story.name}
                      className={
                        isLounge
                          ? "h-full w-full rounded-full border-2 border-bsh-graphite object-cover"
                          : "h-full w-full rounded-full border-2 border-[#FAF9F6] object-cover"
                      }
                    />
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <main className={isLounge ? "px-0 pb-12 pt-3" : "px-0 pb-12 pt-3"}>
        {/* SNS FEED */}
        {activeTab === "sns" &&
          feedPosts.map((post) => (
            <div
              key={post.id}
              className={
                isLounge
                  ? "bsh-lounge-card bsh-lounge-card-surface relative z-0 mx-3 mb-5 overflow-hidden rounded-xl shadow-[0_20px_50px_-10px_rgba(58,3,21,0.7),0_10px_24px_-6px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out"
                  : "mb-5 overflow-hidden border-y-2 border-[#4A4A4A] bg-white shadow-[0_6px_0_0_rgba(212,163,115,0.35)]"
              }
            >
              <div
                className={
                  isLounge
                    ? "flex items-start justify-between gap-2 border-b border-[#BFA173]/20 bg-black/30 px-3 py-2"
                    : "flex items-start justify-between gap-2 border-b-2 border-[#FAF9F6] px-3 py-1.5"
                }
                style={isLounge ? undefined : SNS_PAW_STAMP_BG}
              >
                <div className="flex items-center gap-2">
                  <PawAvatar />
                  <div>
                    <span
                      className={
                        isLounge
                          ? "block text-[11px] font-semibold leading-none text-[#D9C0A3]"
                          : "block text-[11px] font-bold leading-none text-[#607D8B]"
                      }
                    >
                      {post.user}
                    </span>
                    <span
                      className={
                        isLounge
                          ? "block text-[8px] leading-none text-[#BFA173]/80"
                          : "block text-[8px] leading-none text-[#7D7D7D]"
                      }
                    >
                      {formatNyatTime(post.createdAt, "たった今")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={
                      isLounge
                        ? "text-[8px] leading-none text-[#BFA173]/60"
                        : "text-[8px] leading-none text-[#8A8A8A]"
                    }
                  >
                    ID:{post.anonId ?? "GUEST00"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFeedPost(post.id)}
                    className={
                      isLounge
                        ? "h-4 w-4 rounded-full border border-bsh-gold/30 text-[10px] leading-none text-bsh-ivory/70 transition-colors duration-300 ease-out hover:bg-white/5"
                        : "h-4 w-4 rounded-full border border-[#607D8B]/35 text-[10px] leading-none text-[#607D8B]/70 transition-colors hover:bg-[#607D8B]/10"
                    }
                    aria-label="投稿を削除"
                  >
                    ×
                  </button>
                </div>
              </div>
            {(() => {
              const postImages = post.images && post.images.length > 0 ? post.images : [post.image];
              const activeIdx = Math.min(feedCarouselIndex[post.id] ?? 0, postImages.length - 1);
              const isVideoPost = post.mediaType === "video";
              return (
                <div
                  className={
                    isLounge
                      ? "group relative z-0 border-b border-bsh-gold/20"
                      : "group relative z-0 border-b-2 border-[#4A4A4A]"
                  }
                >
                  <div
                    ref={(node) => {
                      feedCarouselRefs.current[post.id] = node;
                    }}
                    className="flex cursor-grab overflow-x-auto overscroll-x-contain snap-x snap-mandatory select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x_pan-y] active:cursor-grabbing"
                    style={{ WebkitOverflowScrolling: "touch" }}
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      feedCarouselScrollAtRef.current[post.id] = Date.now();
                      if (postImages.length <= 1) return;
                      const idx = Math.round(target.scrollLeft / target.clientWidth);
                      setFeedCarouselIndex((prev) => ({ ...prev, [post.id]: idx }));
                    }}
                    onMouseDown={(e) => startFeedDrag(post.id, e)}
                    onMouseMove={(e) => onFeedDragMove(post.id, e)}
                    onMouseUp={endFeedDrag}
                    onMouseLeave={endFeedDrag}
                  >
                    {postImages.map((src, idx) => (
                      <div
                        key={`${post.id}-${idx}`}
                        role={isVideoPost ? undefined : "button"}
                        aria-label={isVideoPost ? undefined : `写真 ${idx + 1} を拡大表示`}
                        tabIndex={isVideoPost ? undefined : 0}
                        onKeyDown={
                          isVideoPost
                            ? undefined
                            : (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setFeedLightboxSrc(src);
                                }
                              }
                        }
                        className="relative h-[46vh] w-full shrink-0 snap-center [touch-action:inherit]"
                        onClick={() => {
                          if (isVideoPost) return;
                          const t = feedCarouselScrollAtRef.current[post.id] ?? 0;
                          if (Date.now() - t < 280) return;
                          setFeedLightboxSrc(src);
                        }}
                      >
                        <img
                          src={src}
                          alt={`post image ${idx + 1}`}
                          draggable={false}
                          className="pointer-events-none h-full w-full select-none object-cover [-webkit-touch-callout:none]"
                        />
                        {isVideoPost && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-black/35 text-white shadow-md backdrop-blur-[1px]">
                              <Play size={24} className="ml-0.5 fill-white text-white" />
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {postImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => scrollFeedCarouselTo(post.id, Math.max(0, activeIdx - 1))}
                        className="touch-manipulation absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 px-2 py-1 text-sm font-bold text-white opacity-100 pointer-events-auto transition-opacity sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100"
                        aria-label="前の写真"
                      >
                        ＜
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollFeedCarouselTo(post.id, Math.min(postImages.length - 1, activeIdx + 1))}
                        className="touch-manipulation absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 px-2 py-1 text-sm font-bold text-white opacity-100 pointer-events-auto transition-opacity sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100"
                        aria-label="次の写真"
                      >
                        ＞
                      </button>
                      <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white">
                        {activeIdx + 1}/{postImages.length}
                      </div>
                      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1">
                        {postImages.map((_, idx) => (
                          <button
                            key={`${post.id}-dot-${idx}`}
                            type="button"
                            onClick={() => scrollFeedCarouselTo(post.id, idx)}
                            className={`touch-manipulation h-2.5 w-2.5 shrink-0 rounded-full transition-transform active:scale-125 ${idx === activeIdx ? "bg-white" : "bg-white/45"}`}
                            aria-label={`写真 ${idx + 1} へ`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            <div
              className={isLounge ? "relative z-[1] px-3 py-1.5" : "px-3 py-1.5"}
              style={isLounge ? undefined : SNS_PAW_STAMP_BG}
            >
              <div className="mb-1 flex gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void togglePostLike(post.id);
                  }}
                  className={
                    isLounge
                      ? "touch-manipulation flex items-center gap-1 transition-opacity duration-300 ease-out active:opacity-75"
                      : "touch-manipulation flex items-center gap-1 transition-transform hover:scale-110 active:scale-95"
                  }
                  aria-label="Like post"
                >
                  <Heart
                    size={20}
                    className={`cursor-pointer transition-colors duration-300 ease-out ${
                      likedPosts[post.id]
                        ? isLounge
                          ? "fill-bsh-wine text-bsh-wine drop-shadow-[0_0_6px_rgba(107,29,42,0.6)]"
                          : "fill-red-500 text-red-500"
                        : isLounge
                          ? "text-bsh-ivory/70 hover:text-bsh-gold/80"
                          : "text-[#E56B6F]"
                    }`}
                  />
                  <span
                    className={
                      isLounge
                        ? "text-[10px] font-semibold leading-none text-[#BFA173]/80"
                        : "text-[10px] font-bold leading-none text-[#6C5A49]"
                    }
                  >
                    {feedLikeCounts[post.id] ?? post.likes ?? 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeedCommentTargetId((prev) => (prev === post.id ? null : post.id));
                    setNewFeedCommentText("");
                  }}
                  className={
                    isLounge
                      ? "touch-manipulation text-bsh-ivory/85 transition-opacity duration-300 ease-out active:text-bsh-gold active:opacity-90"
                      : "touch-manipulation transition-transform hover:scale-110 active:scale-95"
                  }
                  aria-label="投稿にコメント"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => shareBshPost(showToast)}
                  className={
                    isLounge
                      ? "touch-manipulation text-bsh-ivory/85 transition-opacity duration-300 ease-out active:text-bsh-gold active:opacity-90"
                      : "touch-manipulation transition-transform hover:scale-110 active:scale-95"
                  }
                  aria-label="投稿をシェア"
                >
                  <Send size={20} />
                </button>
              </div>
              <p
                className={
                  isLounge
                    ? "text-[12px] leading-relaxed text-[#D9C0A3]/90"
                    : "text-[12px] leading-snug"
                }
              >
                <span className={isLounge ? "font-semibold text-[#D9C0A3]" : "font-bold text-[#607D8B]"}>
                  {post.user}
                </span>{" "}
                {post.content}
              </p>
              {(feedComments[post.id]?.length ?? 0) > 0 && (
                <div className="mt-1 space-y-1">
                  {(feedComments[post.id] ?? []).slice(-2).map((comment) => (
                    <div
                      key={comment.id}
                      className={
                        isLounge
                          ? "bsh-comment-box ml-1.5 px-1.5 py-0.5"
                          : "ml-1.5 rounded-md bg-[#FFFCF7] px-1.5 py-0.5"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={
                            isLounge
                              ? "truncate text-[9px] font-semibold leading-none text-bsh-ivory"
                              : "truncate text-[9px] font-bold leading-none text-[#607D8B]"
                          }
                        >
                          {comment.user}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFeedComment(post.id, comment.id)}
                          className={
                            isLounge
                              ? "h-4 w-4 shrink-0 rounded-full border border-bsh-gold/25 text-[10px] leading-none text-bsh-ivory/65"
                              : "h-4 w-4 shrink-0 rounded-full border border-[#607D8B]/30 text-[10px] leading-none text-[#607D8B]/65"
                          }
                          aria-label="コメントを削除"
                        >
                          ×
                        </button>
                      </div>
                      <p
                        className={
                          isLounge
                            ? "text-[8px] leading-none text-bsh-amber/80"
                            : "text-[8px] leading-none text-[#7D7D7D]"
                        }
                      >
                        {formatNyatTime(comment.createdAt, "たった今")} · ID:{comment.anonId ?? "GUEST00"}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={
                            isLounge ? "text-[9px] leading-tight text-bsh-ivory/90" : "text-[9px] leading-tight text-[#4A4A4A]"
                          }
                        >
                          {comment.text}
                        </p>
                        <button type="button" onClick={() => toggleCommentLike(comment.id)} className="shrink-0 flex items-center gap-0.5 transition-opacity active:opacity-75" aria-label="コメントにいいね">
                          <Heart size={10} className={`transition-colors duration-200 ${commentLiked[comment.id] ? (isLounge ? "fill-bsh-wine text-bsh-wine" : "fill-red-400 text-red-400") : (isLounge ? "text-bsh-ivory/40" : "text-[#C0C0C0]")}`} />
                          {(commentLikeCounts[comment.id] ?? 0) > 0 && <span className={isLounge ? "text-[7px] text-bsh-amber/60" : "text-[7px] text-[#AAA]"}>{commentLikeCounts[comment.id]}</span>}
                        </button>
                      </div>
                    </div>
                  ))}
                  {(feedComments[post.id]?.length ?? 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => setFeedCommentsModalPostId(post.id)}
                      className={
                        isLounge
                          ? "text-[9px] font-semibold text-bsh-amber underline underline-offset-2 transition-opacity duration-300 ease-out hover:opacity-85"
                          : "text-[9px] font-bold text-[#607D8B] underline underline-offset-2"
                      }
                    >
                      すべてのコメントを見る
                    </button>
                  )}
                </div>
              )}
              {feedCommentTargetId === post.id && (
                <div
                  className={
                    isLounge
                      ? "mt-1 rounded-xl border border-bsh-gold/30 bg-bsh-graphite/80 p-1.5"
                      : "mt-1 rounded-lg border border-[#D4A373]/45 bg-[#FFF8EE] p-1.5"
                  }
                >
                  <textarea
                    value={newFeedCommentText}
                    onChange={(e) => setNewFeedCommentText(e.target.value)}
                    placeholder="コメントを書くニャ..."
                    className={
                      isLounge
                        ? "h-14 w-full resize-none rounded-xl border border-bsh-gold/35 bg-bsh-noir/60 p-1.5 text-[10px] leading-snug text-bsh-ivory outline-none transition-colors duration-300 ease-out placeholder:text-bsh-ivory/35 focus:border-bsh-gold/55"
                        : "h-14 w-full resize-none rounded-md border border-[#D4A373] bg-[#FFFCF7] p-1.5 text-[10px] leading-snug outline-none focus:border-[#607D8B]"
                    }
                  />
                  <div className="mt-1.5 flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedCommentTargetId(null);
                        setNewFeedCommentText("");
                      }}
                      className={
                        isLounge
                          ? "rounded-full border border-bsh-gold/40 px-2.5 py-1 text-[10px] font-semibold text-bsh-gold transition-opacity duration-300 ease-out hover:opacity-85"
                          : "rounded-full border border-[#607D8B] px-2.5 py-1 text-[10px] font-bold text-[#607D8B]"
                      }
                    >
                      閉じる
                    </button>
                    <button
                      type="button"
                      onClick={() => submitFeedComment(post.id)}
                      className={
                        isLounge
                          ? "rounded-full border border-bsh-bordeaux bg-bsh-bordeaux/90 px-3 py-1 text-[10px] font-semibold text-bsh-ivory transition-opacity duration-300 ease-out disabled:opacity-50 hover:opacity-90"
                          : "rounded-full bg-[#E56B6F] px-3 py-1 text-[10px] font-bold text-white disabled:opacity-50"
                      }
                      disabled={!newFeedCommentText.trim()}
                    >
                      投稿
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* NYAT (TEXT FEED) */}
        {activeTab === "threads" && (
          <div className="space-y-2.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className={
                  isLounge
                    ? "font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-[11px] font-semibold tracking-[0.12em] text-bsh-gold"
                    : "text-[11px] font-bold tracking-tight text-[#607D8B]"
                }
              >
                NYAT
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsThreadComposerOpen(true);
                }}
                className={
                  isLounge
                    ? "bsh-glass-btn flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-bsh-gold shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]"
                    : "flex items-center gap-1 rounded-full bg-[#607D8B] px-2 py-1 text-[10px] font-bold text-white shadow-sm transition-transform active:scale-95"
                }
                aria-label="NYATを投稿"
              >
                <PlusCircle size={14} className={isLounge ? "text-bsh-gold" : "text-[#FAF9F6]"} />
                投稿
              </button>
            </div>
            {threadPosts.map((thread, idx) => (
              <React.Fragment key={thread.id}>
                {idx > 0 && (
                  <div
                    className={
                      isLounge
                        ? "py-1 text-center text-[10px] tracking-[0.35em] text-bsh-gold/35"
                        : "py-1 text-center text-[10px] tracking-[0.35em] text-[#D4A373]/40"
                    }
                    aria-hidden
                  >
                    🐾 🐾 🐾
                  </div>
                )}
                <div
                  className={
                    isLounge
                      ? "bsh-lounge-card bsh-lounge-card-surface relative rounded-xl px-2.5 py-2 shadow-[0_18px_45px_-10px_rgba(58,3,21,0.65),0_8px_20px_-6px_rgba(0,0,0,0.6)]"
                      : "relative rounded-lg border border-[#607D8B] bg-[#FEF9EF] px-2.5 py-2 shadow-sm"
                  }
                >
                  <div
                    className={
                      isLounge
                        ? "mb-1 flex items-start justify-between gap-2 font-semibold text-[#D9C0A3]"
                        : "mb-1 flex items-start justify-between gap-2 font-bold text-[#607D8B]"
                    }
                  >
                    <div className="flex items-start gap-2">
                      <PawAvatar size="sm" />
                      <div>
                        <span className="block text-[11px]">{thread.user}</span>
                        <span
                          className={
                            isLounge
                              ? "block text-[9px] font-normal text-[#BFA173]/75"
                              : "block text-[9px] font-normal opacity-65"
                          }
                        >
                          {formatNyatTime(thread.createdAt, thread.timeLabel)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={
                          isLounge ? "text-[9px] font-normal text-[#BFA173]/55" : "text-[9px] font-normal opacity-75"
                        }
                      >
                        ID:{thread.anonId ?? "GUEST00"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeThreadPost(thread.id)}
                        className={
                          isLounge
                            ? "h-4 w-4 rounded-full border border-bsh-gold/30 text-[10px] leading-none text-bsh-ivory/70 transition-colors duration-300 ease-out hover:bg-white/5"
                            : "h-4 w-4 rounded-full border border-[#607D8B]/35 text-[10px] leading-none text-[#607D8B]/70 transition-colors hover:bg-[#607D8B]/10"
                        }
                        aria-label="NYAT投稿を削除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p
                    className={
                      isLounge
                        ? "text-[11px] leading-relaxed text-[#D9C0A3]/88"
                        : "text-[11px] leading-snug text-[#4A4A4A]"
                    }
                  >
                    {thread.text}
                  </p>
                  <div
                    className={
                      isLounge ? "mt-1.5 flex gap-3 text-[#D9C0A3]/70" : "mt-1.5 flex gap-3 text-[#D4A373]"
                    }
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleThreadLike(thread.id);
                      }}
                      className={
                        isLounge
                          ? "flex items-center gap-1 transition-opacity duration-300 ease-out active:opacity-75"
                          : "flex items-center gap-1 transition-transform hover:scale-110 active:scale-95"
                      }
                      aria-label="NYATにいいね"
                    >
                      <Heart
                        size={15}
                        className={`transition-colors duration-300 ease-out ${
                          likedThreads[thread.id]
                            ? isLounge
                              ? "fill-bsh-wine text-bsh-wine drop-shadow-[0_0_6px_rgba(107,29,42,0.6)]"
                              : "fill-red-500 text-red-500"
                            : isLounge
                              ? "text-bsh-ivory/70 hover:text-bsh-gold/80"
                              : ""
                        }`}
                      />
                      <span
                        className={
                          isLounge
                            ? "text-[10px] font-semibold text-bsh-amber/85"
                            : "text-[10px] font-bold text-[#6C5A49]"
                        }
                      >
                        {threadLikeCounts[thread.id] ?? 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openThreadCommentModal(thread.id)}
                      className={
                        isLounge
                          ? "transition-opacity duration-300 ease-out active:text-bsh-gold active:opacity-90"
                          : "transition-transform hover:scale-110 active:scale-95"
                      }
                      aria-label="NYATにコメント"
                    >
                      <MessageCircle size={15} />
                    </button>
                  </div>
                  {(threadComments[thread.id]?.length ?? 0) > 0 && (
                    <div
                      className={
                        isLounge
                          ? "mt-1.5 border-t border-bsh-gold/20 pt-1.5"
                          : "mt-1.5 border-t border-[#D4A373]/35 pt-1.5"
                      }
                    >
                      <p
                        className={
                          isLounge
                            ? "mb-1 text-[9px] font-semibold tracking-wide text-bsh-gold/90"
                            : "mb-1 text-[9px] font-bold tracking-wide text-[#607D8B]"
                        }
                      >
                        COMMENTS ({threadComments[thread.id].length})
                      </p>
                      <div className="space-y-1.5">
                        {threadComments[thread.id].map((comment) => (
                          <div
                            key={comment.id}
                            className={
                              isLounge
                                ? "bsh-comment-box ml-3 px-2 py-1"
                                : "ml-3 rounded-md border border-[#D4A373]/35 bg-[#FFFDF8] px-2 py-1"
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={
                                    isLounge
                                      ? "truncate text-[10px] font-semibold text-bsh-ivory"
                                      : "truncate text-[10px] font-bold text-[#607D8B]"
                                  }
                                >
                                  {comment.user}
                                </p>
                                <p
                                  className={
                                    isLounge ? "text-[9px] text-bsh-amber/85" : "text-[9px] text-[#7D7D7D]"
                                  }
                                >
                                  {formatNyatTime(comment.createdAt, "たった今")} · ID:{comment.anonId ?? "GUEST00"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeThreadComment(thread.id, comment.id)}
                                className={
                                  isLounge
                                    ? "h-4 w-4 shrink-0 rounded-full border border-bsh-gold/25 text-[10px] leading-none text-bsh-ivory/65 transition-colors duration-300 ease-out hover:bg-white/5"
                                    : "h-4 w-4 shrink-0 rounded-full border border-[#607D8B]/35 text-[10px] leading-none text-[#607D8B]/70 transition-colors hover:bg-[#607D8B]/10"
                                }
                                aria-label="コメントを削除"
                              >
                                ×
                              </button>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-1">
                              <p
                                className={
                                  isLounge
                                    ? "text-[10px] leading-snug text-bsh-ivory/92"
                                    : "text-[10px] leading-snug text-[#4A4A4A]"
                                }
                              >
                                {comment.text}
                              </p>
                              <button type="button" onClick={() => toggleCommentLike(comment.id)} className="shrink-0 flex items-center gap-0.5 transition-opacity active:opacity-75" aria-label="コメントにいいね">
                                <Heart size={10} className={`transition-colors duration-200 ${commentLiked[comment.id] ? (isLounge ? "fill-bsh-wine text-bsh-wine" : "fill-red-400 text-red-400") : (isLounge ? "text-bsh-ivory/40" : "text-[#C0C0C0]")}`} />
                                {(commentLikeCounts[comment.id] ?? 0) > 0 && <span className={isLounge ? "text-[7px] text-bsh-amber/60" : "text-[7px] text-[#AAA]"}>{commentLikeCounts[comment.id]}</span>}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* SHOP (GOODS) */}
        {activeTab === "shop" && (
          <div className="px-4">
            <div
              className={
                isLounge
                  ? "bsh-lounge-card bsh-lounge-card-surface rounded-xl border border-dashed border-bsh-gold/35 px-6 py-10 text-center shadow-[0_14px_32px_-14px_rgba(90,20,30,0.45)]"
                  : "rounded-3xl border-2 border-dashed border-[#607D8B] bg-[#FFF8EE] px-6 py-10 text-center shadow-[0_8px_0_0_rgba(212,163,115,0.35)]"
              }
            >
              <div
                className={
                  isLounge
                    ? "mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-bsh-gold/25 bg-bsh-burgundy/40 px-4 py-2"
                    : "mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-[#F5EFE6] px-4 py-2"
                }
              >
                <Cat size={24} className={isLounge ? "text-bsh-gold" : "text-[#607D8B]"} />
                <Star size={20} className={isLounge ? "text-bsh-amber" : "text-[#D4A373]"} />
                <ShoppingBag size={22} className={isLounge ? "text-bsh-gold/90" : "text-[#E56B6F]"} />
              </div>
              <p
                className={
                  isLounge
                    ? "font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-xl font-semibold tracking-[0.08em] text-bsh-gold"
                    : "text-xl font-bold tracking-wide text-[#607D8B]"
                }
              >
                Coming Soon...
              </p>
              <p className={isLounge ? "mt-3 text-sm leading-relaxed text-bsh-ivory/85" : "mt-3 text-sm leading-relaxed text-[#4A4A4A]"}>
                BSH専用の厳選ショップを準備中だニャ！
              </p>
            </div>
          </div>
        )}

        {/* DOODLE (ART GALLERY) */}
        {activeTab === "doodle" && (
          <div className="px-4">
            <div
              className={
                isLounge
                  ? "bsh-lounge-card bsh-lounge-card-surface mb-3 flex items-center justify-between rounded-xl px-3 py-2 shadow-[0_14px_32px_-12px_rgba(90,20,30,0.4)]"
                  : "mb-3 flex items-center justify-between rounded-2xl border-2 border-[#607D8B] bg-[#F4EEE2] px-3 py-2 shadow-[4px_4px_0_0_#D4A373]"
              }
            >
              <div>
                <p
                  className={
                    isLounge
                      ? "font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-[11px] font-semibold tracking-[0.14em] text-bsh-gold"
                      : "text-[11px] font-bold tracking-wide text-[#607D8B]"
                  }
                >
                  DOODLE GALLERY
                </p>
                <p className={isLounge ? "text-[10px] text-bsh-ivory/70" : "text-[10px] text-[#6C5A49]"}>
                  みんなの猫イラストを飾ろう
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className={
                  isLounge
                    ? "flex items-center gap-1 rounded-full border border-bsh-bordeaux bg-transparent px-2.5 py-1 text-[10px] font-semibold text-bsh-gold transition-opacity duration-300 ease-out active:opacity-80"
                    : "flex items-center gap-1 rounded-full border border-[#607D8B] bg-white px-2.5 py-1 text-[10px] font-bold text-[#607D8B] transition-transform active:scale-95"
                }
                aria-label="落書きを投稿"
              >
                <PlusCircle size={13} className={isLounge ? "text-bsh-gold" : undefined} />
                投稿
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-1">
              {doodlePosts.map((post, idx) => (
                <article
                  key={post.id}
                  className={
                    isLounge
                      ? `bsh-lounge-card bsh-lounge-card-surface rounded-xl p-1 shadow-[0_18px_40px_-10px_rgba(58,3,21,0.6),0_8px_18px_-6px_rgba(0,0,0,0.55)] ${idx % 2 === 0 ? "-rotate-[0.5deg]" : "rotate-[0.5deg]"}`
                      : `rounded-[14px] border border-[#4A4A4A] bg-[#EADBC8] p-1.5 shadow-[5px_5px_0_0_rgba(74,74,74,0.35)] ${
                          idx % 2 === 0 ? "-rotate-[0.8deg]" : "rotate-[0.8deg]"
                        }`
                  }
                >
                  <div
                    className={
                      isLounge
                        ? "overflow-hidden rounded-[3px] border border-bsh-gold/35 bg-bsh-graphite/90"
                        : "overflow-hidden rounded-[10px] border-2 border-[#4A4A4A] bg-[#FFFDF8]"
                    }
                  >
                    <img
                      src={post.image}
                      alt={`${post.user}の落書き`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDoodleLightboxSrc(post.image)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDoodleLightboxSrc(post.image); } }}
                      className={
                        isLounge
                          ? "h-72 w-full cursor-pointer border-b border-bsh-gold/25 object-cover transition-opacity duration-300 ease-out active:opacity-90"
                          : "h-72 w-full cursor-pointer border-b-2 border-[#4A4A4A] object-cover transition-opacity active:opacity-90"
                      }
                    />
                    <div
                      className={
                        isLounge
                          ? "space-y-0.5 bg-gradient-to-b from-bsh-graphite to-bsh-noir/80 px-1.5 py-1"
                          : "space-y-0.5 bg-[repeating-linear-gradient(0deg,#FFFDF8,#FFFDF8_18px,#F4EEE2_19px)] px-1.5 py-1"
                      }
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex min-w-0 items-center gap-1">
                          <PawAvatar size="sm" />
                          <p
                            className={
                              isLounge
                                ? "truncate text-[8px] font-semibold leading-none text-bsh-ivory"
                                : "truncate text-[8px] font-bold leading-none text-[#607D8B]"
                            }
                          >
                            {post.user}
                            <span
                              className={
                                isLounge
                                  ? "ml-0.5 text-[6px] font-normal text-bsh-gold/75"
                                  : "ml-0.5 text-[6px] font-normal text-[#6C5A49]"
                              }
                            >
                              [ID: {post.anonId}]
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoodlePost(post.id)}
                          className={
                            isLounge
                              ? "h-4 w-4 shrink-0 rounded-full border border-bsh-gold/28 text-[10px] leading-none text-bsh-ivory/70 transition-colors duration-300 ease-out hover:bg-white/5"
                              : "h-4 w-4 shrink-0 rounded-full border border-[#607D8B]/35 text-[10px] leading-none text-[#607D8B]/70 transition-colors hover:bg-[#607D8B]/10"
                          }
                          aria-label="落書き投稿を削除"
                        >
                          ×
                        </button>
                      </div>
                      <p className={isLounge ? "text-[6px] leading-none text-bsh-amber/85" : "text-[6px] leading-none text-[#7B6B5E]"}>
                        {formatDoodleTime(post.createdAt)}
                      </p>
                      <p
                        className={
                          isLounge
                            ? "line-clamp-1 text-[7px] leading-snug text-bsh-ivory/92"
                            : "line-clamp-1 text-[7px] leading-snug text-[#4A4A4A]"
                        }
                      >
                        {post.content}
                      </p>
                      <div
                        className={
                          isLounge ? "mt-1 flex items-center gap-2 text-bsh-ivory/80" : "mt-1 flex items-center gap-2 text-[#C08C5A]"
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void toggleDoodleLike(post.id);
                          }}
                          className={
                            isLounge
                              ? "flex items-center gap-1 transition-opacity duration-300 ease-out active:opacity-75"
                              : "flex items-center gap-1 transition-transform hover:scale-105 active:scale-95"
                          }
                          aria-label="落書きにいいね"
                        >
                          <Heart
                            size={12}
                            className={
                              doodleLiked[post.id]
                                ? isLounge
                                  ? "fill-bsh-bordeaux text-bsh-bordeaux"
                                  : "fill-red-500 text-red-500"
                                : isLounge
                                  ? "text-bsh-ivory/85"
                                  : ""
                            }
                          />
                          <span
                            className={
                              isLounge ? "text-[7px] font-semibold text-bsh-amber/85" : "text-[7px] font-bold"
                            }
                          >
                            {doodleLikeCounts[post.id] ?? post.likes ?? 0}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDoodleCommentModal(post.id)}
                          className={
                            isLounge
                              ? "transition-opacity duration-300 ease-out active:text-bsh-gold active:opacity-90"
                              : "transition-transform hover:scale-105 active:scale-95"
                          }
                          aria-label="落書きにコメント"
                        >
                          <MessageCircle size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => shareBshPost(showToast)}
                          className={
                            isLounge
                              ? "transition-opacity duration-300 ease-out active:text-bsh-gold active:opacity-90"
                              : "transition-transform hover:scale-105 active:scale-95"
                          }
                          aria-label="落書きをシェア"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                      {(doodleComments[post.id]?.length ?? 0) > 0 && (
                        <div
                          className={
                            isLounge
                              ? "mt-1 space-y-0.5 border-t border-bsh-gold/22 pt-1"
                              : "mt-1 space-y-0.5 border-t border-[#D4A373]/35 pt-1"
                          }
                        >
                          {doodleComments[post.id].map((comment) => (
                            <div
                              key={comment.id}
                              className={
                                isLounge
                                  ? "bsh-comment-box ml-1.5 px-1.5 py-0.5"
                                  : "ml-1.5 rounded-md bg-[#FFF8EE] px-1.5 py-0.5"
                              }
                            >
                              <p
                                className={
                                  isLounge
                                    ? "text-[6px] font-semibold leading-none text-bsh-ivory"
                                    : "text-[6px] font-bold leading-none text-[#607D8B]"
                                }
                              >
                                {comment.user}
                              </p>
                              <p
                                className={
                                  isLounge ? "text-[6px] leading-none text-bsh-amber/80" : "text-[6px] leading-none text-[#7D7D7D]"
                                }
                              >
                                {formatNyatTime(comment.createdAt, "たった今")} · ID:{comment.anonId ?? "GUEST00"}
                              </p>
                              <div className="flex items-center justify-between gap-0.5">
                                <p
                                  className={
                                    isLounge
                                      ? "text-[6px] leading-tight text-bsh-ivory/90"
                                      : "text-[6px] leading-tight text-[#4A4A4A]"
                                  }
                                >
                                  {comment.text}
                                </p>
                                <button type="button" onClick={() => toggleCommentLike(comment.id)} className="shrink-0 transition-opacity active:opacity-75" aria-label="コメントにいいね">
                                  <Heart size={8} className={`transition-colors duration-200 ${commentLiked[comment.id] ? (isLounge ? "fill-bsh-wine text-bsh-wine" : "fill-red-400 text-red-400") : (isLounge ? "text-bsh-ivory/35" : "text-[#C0C0C0]")}`} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedStory && (
        <div
          className="fixed inset-0 z-50 bg-black animate-[modalFadeIn_220ms_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedStory.name}のストーリー`}
        >
          <div
            className="relative h-full w-full cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              storyDragStateRef.current.startX = e.clientX;
              storyDragStateRef.current.dragged = false;
            }}
            onMouseUp={(e) => {
              const start = storyDragStateRef.current.startX;
              storyDragStateRef.current.startX = null;
              if (start === null) return;
              const delta = e.clientX - start;
              if (Math.abs(delta) < 45) return;
              storyDragStateRef.current.dragged = true;
              if (delta < 0) {
                goNextStory();
              } else {
                goPrevStory();
              }
            }}
            onClick={(e) => {
              if (storyDragStateRef.current.dragged) {
                storyDragStateRef.current.dragged = false;
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeft = e.clientX < rect.left + rect.width / 2;
              if (isLeft) {
                goPrevStory();
              } else {
                goNextStory();
              }
            }}
          >
            {selectedStory.mediaType === "video" ? (
              <video
                src={selectedStory.mediaUrl}
                className="h-full w-full object-contain"
                autoPlay
                playsInline
                controls={false}
                onEnded={goNextStory}
              />
            ) : (
              <img
                src={selectedStory.mediaUrl}
                alt={selectedStory.name}
                className="h-full w-full object-contain"
              />
            )}

            <div className="pointer-events-none absolute left-0 right-0 top-0 bg-gradient-to-b from-black/55 to-transparent p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#FFF8EE]">{selectedStory.name}</p>
                <p className="text-xs text-[#FFF8EE]/85">
                  {selectedStoryIndex !== null ? `${selectedStoryIndex + 1}/${visibleStories.length}` : ""}
                </p>
              </div>
            </div>

            <button
              onClick={closeStoryViewer}
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-[#FFF8EE]/95 text-[#4A4A4A] text-2xl leading-none flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
              aria-label="ストーリーを閉じる"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isThreadComposerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => {
            setIsThreadComposerOpen(false);
            setNewThreadText("");
          }}
          role="dialog"
          aria-modal="true"
          aria-label="NYAT投稿"
        >
          <div
            className={
              isLounge
                ? "bsh-lounge-card bsh-lounge-card-surface w-full max-w-sm rounded-xl p-3.5 shadow-[0_20px_50px_-15px_rgba(90,20,30,0.6)] animate-[modalZoomIn_260ms_ease-out]"
                : "w-full max-w-sm rounded-2xl border-2 border-[#607D8B] bg-[#FFF8EE] p-3.5 shadow-xl animate-[modalZoomIn_260ms_ease-out]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={
                isLounge
                  ? "mb-2 font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-base font-semibold text-bsh-gold"
                  : "mb-2 text-base font-bold text-[#607D8B]"
              }
            >
              NYATを投稿
            </h2>
            <textarea
              value={newThreadText}
              onChange={(e) => setNewThreadText(e.target.value)}
              placeholder="今なにしてるニャ？ 猫の独り言を投稿するニャ"
              className={
                isLounge
                  ? "h-28 w-full resize-none rounded-lg border border-bsh-gold/20 bg-bsh-noir/70 p-2.5 text-xs leading-snug text-bsh-ivory outline-none backdrop-blur-sm transition-colors duration-300 ease-out placeholder:text-bsh-ivory/30 focus:border-bsh-gold/45"
                  : "h-28 w-full resize-none rounded-xl border border-[#D4A373] bg-[#FFFCF7] p-2.5 text-xs leading-snug outline-none focus:border-[#607D8B]"
              }
            />
            <div className="mt-3 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsThreadComposerOpen(false);
                  setNewThreadText("");
                }}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-gold/40 px-3 py-1.5 text-[11px] font-semibold text-bsh-gold transition-opacity duration-300 ease-out hover:opacity-85"
                    : "rounded-full border border-[#607D8B] bg-white px-3 py-1.5 text-[11px] font-bold text-[#607D8B]"
                }
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={submitThread}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-bordeaux bg-bsh-bordeaux/90 px-3.5 py-1.5 text-[11px] font-semibold text-bsh-ivory transition-opacity duration-300 ease-out disabled:opacity-50 hover:opacity-90"
                    : "rounded-full bg-[#E56B6F] px-3.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                }
                disabled={!newThreadText.trim()}
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}

      {commentTargetThreadId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => {
            setCommentTargetThreadId(null);
            setNewCommentText("");
          }}
          role="dialog"
          aria-modal="true"
          aria-label="NYATコメント"
        >
          <div
            className={
              isLounge
                ? "bsh-lounge-card bsh-lounge-card-surface w-full max-w-sm rounded-xl p-3.5 shadow-[0_20px_50px_-15px_rgba(90,20,30,0.6)] animate-[modalZoomIn_260ms_ease-out]"
                : "w-full max-w-sm rounded-2xl border-2 border-[#607D8B] bg-[#FFF8EE] p-3.5 shadow-xl animate-[modalZoomIn_260ms_ease-out]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={isLounge ? "mb-2 text-base font-semibold text-bsh-gold" : "mb-2 text-base font-bold text-[#607D8B]"}>コメントする</h2>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="コメントを書くニャ..."
              className={
                isLounge
                  ? "h-24 w-full resize-none rounded-xl border border-bsh-gold/35 bg-bsh-noir/60 p-2.5 text-xs leading-snug text-bsh-ivory outline-none placeholder:text-bsh-ivory/35 focus:border-bsh-gold/55"
                  : "h-24 w-full resize-none rounded-xl border border-[#D4A373] bg-[#FFFCF7] p-2.5 text-xs leading-snug outline-none focus:border-[#607D8B]"
              }
            />
            <div className="mt-3 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCommentTargetThreadId(null);
                  setNewCommentText("");
                }}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-gold/40 px-3 py-1.5 text-[11px] font-semibold text-bsh-gold hover:opacity-85"
                    : "rounded-full border border-[#607D8B] bg-white px-3 py-1.5 text-[11px] font-bold text-[#607D8B]"
                }
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={submitThreadComment}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-bordeaux bg-bsh-bordeaux/90 px-3.5 py-1.5 text-[11px] font-semibold text-bsh-ivory disabled:opacity-50 hover:opacity-90"
                    : "rounded-full bg-[#E56B6F] px-3.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                }
                disabled={!newCommentText.trim()}
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}

      {feedCommentsModalPostId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => setFeedCommentsModalPostId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="SNSコメント一覧"
        >
          <div
            className={
              isLounge
                ? "bsh-lounge-card bsh-lounge-card-surface w-full max-w-sm max-h-[78vh] overflow-y-auto rounded-xl p-3.5 shadow-[0_20px_50px_-15px_rgba(90,20,30,0.6)] animate-[modalZoomIn_260ms_ease-out]"
                : "w-full max-w-sm max-h-[78vh] overflow-y-auto rounded-2xl border-2 border-[#607D8B] bg-[#FFF8EE] p-3.5 shadow-xl animate-[modalZoomIn_260ms_ease-out]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className={isLounge ? "text-base font-semibold text-bsh-gold" : "text-base font-bold text-[#607D8B]"}>すべてのコメント</h2>
              <button
                type="button"
                onClick={() => setFeedCommentsModalPostId(null)}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-gold/40 px-2 py-0.5 text-[11px] font-semibold text-bsh-gold hover:opacity-85"
                    : "rounded-full border border-[#607D8B] px-2 py-0.5 text-[11px] font-bold text-[#607D8B]"
                }
              >
                閉じる
              </button>
            </div>
            <div className="space-y-1.5">
              {(feedComments[feedCommentsModalPostId] ?? []).map((comment) => (
                <div
                  key={comment.id}
                  className={
                    isLounge
                      ? "bsh-comment-box px-2 py-1.5"
                      : "rounded-md border border-[#D4A373]/35 bg-[#FFFCF7] px-2 py-1.5"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={isLounge ? "truncate text-[10px] font-semibold text-bsh-ivory" : "truncate text-[10px] font-bold text-[#607D8B]"}>{comment.user}</p>
                    <button
                      type="button"
                      onClick={() => removeFeedComment(feedCommentsModalPostId, comment.id)}
                      className={
                        isLounge
                          ? "h-4 w-4 shrink-0 rounded-full border border-bsh-gold/25 text-[10px] leading-none text-bsh-ivory/65"
                          : "h-4 w-4 shrink-0 rounded-full border border-[#607D8B]/30 text-[10px] leading-none text-[#607D8B]/65"
                      }
                      aria-label="コメントを削除"
                    >
                      ×
                    </button>
                  </div>
                  <p className={isLounge ? "text-[9px] text-bsh-amber/80" : "text-[9px] text-[#7D7D7D]"}>
                    {formatNyatTime(comment.createdAt, "たった今")} · ID:{comment.anonId ?? "GUEST00"}
                  </p>
                  <p className={isLounge ? "text-[10px] leading-snug text-bsh-ivory/90" : "text-[10px] leading-snug text-[#4A4A4A]"}>{comment.text}</p>
                  <button
                    type="button"
                    onClick={() => toggleCommentLike(comment.id)}
                    className="mt-0.5 flex items-center gap-0.5 transition-opacity active:opacity-75"
                    aria-label="コメントにいいね"
                  >
                    <Heart
                      size={12}
                      className={`transition-colors duration-200 ${
                        commentLiked[comment.id]
                          ? isLounge ? "fill-bsh-wine text-bsh-wine" : "fill-red-400 text-red-400"
                          : isLounge ? "text-bsh-ivory/50 hover:text-bsh-gold/70" : "text-[#B0B0B0] hover:text-red-300"
                      }`}
                    />
                    {(commentLikeCounts[comment.id] ?? 0) > 0 && (
                      <span className={isLounge ? "text-[8px] text-bsh-amber/70" : "text-[8px] text-[#999]"}>{commentLikeCounts[comment.id]}</span>
                    )}
                  </button>
                </div>
              ))}
              {(feedComments[feedCommentsModalPostId] ?? []).length === 0 && (
                <p className={isLounge ? "text-[11px] text-bsh-ivory/65" : "text-[11px] text-[#607D8B]"}>コメントはまだないニャ。</p>
              )}
            </div>
          </div>
        </div>
      )}

      {doodleCommentTargetId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => {
            setDoodleCommentTargetId(null);
            setNewDoodleCommentText("");
          }}
          role="dialog"
          aria-modal="true"
          aria-label="落書きコメント"
        >
          <div
            className={
              isLounge
                ? "bsh-lounge-card bsh-lounge-card-surface w-full max-w-sm rounded-xl p-3.5 shadow-[0_20px_50px_-15px_rgba(90,20,30,0.6)] animate-[modalZoomIn_260ms_ease-out]"
                : "w-full max-w-sm rounded-2xl border-2 border-[#607D8B] bg-[#FFF8EE] p-3.5 shadow-xl animate-[modalZoomIn_260ms_ease-out]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={isLounge ? "mb-2 text-base font-semibold text-bsh-gold" : "mb-2 text-base font-bold text-[#607D8B]"}>落書きにコメント</h2>
            <textarea
              value={newDoodleCommentText}
              onChange={(e) => setNewDoodleCommentText(e.target.value)}
              placeholder="この作品の感想を書くニャ..."
              className={
                isLounge
                  ? "h-24 w-full resize-none rounded-xl border border-bsh-gold/35 bg-bsh-noir/60 p-2.5 text-xs leading-snug text-bsh-ivory outline-none placeholder:text-bsh-ivory/35 focus:border-bsh-gold/55"
                  : "h-24 w-full resize-none rounded-xl border border-[#D4A373] bg-[#FFFCF7] p-2.5 text-xs leading-snug outline-none focus:border-[#607D8B]"
              }
            />
            <div className="mt-3 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setDoodleCommentTargetId(null);
                  setNewDoodleCommentText("");
                }}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-gold/40 px-3 py-1.5 text-[11px] font-semibold text-bsh-gold hover:opacity-85"
                    : "rounded-full border border-[#607D8B] bg-white px-3 py-1.5 text-[11px] font-bold text-[#607D8B]"
                }
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={submitDoodleComment}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-bordeaux bg-bsh-bordeaux/90 px-3.5 py-1.5 text-[11px] font-semibold text-bsh-ivory disabled:opacity-50 hover:opacity-90"
                    : "rounded-full bg-[#E56B6F] px-3.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                }
                disabled={!newDoodleCommentText.trim()}
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}

      {feedLightboxSrc !== null && (
        <div
          className="fixed inset-0 z-[55] flex touch-none items-center justify-center bg-black/92 p-3"
          onClick={() => setFeedLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="写真を拡大表示"
        >
          <button
            type="button"
            className={
              isLounge
                ? "touch-manipulation absolute right-3 top-3 z-10 rounded-full border border-bsh-gold/50 bg-bsh-graphite/90 px-3 py-1.5 text-[11px] font-semibold text-bsh-gold shadow-md"
                : "touch-manipulation absolute right-3 top-3 z-10 rounded-full border-2 border-white/80 bg-[#4A4A4A]/90 px-3 py-1.5 text-[11px] font-bold text-[#FFF8EE] shadow-md"
            }
            onClick={() => setFeedLightboxSrc(null)}
          >
            閉じる
          </button>
          <img
            src={feedLightboxSrc}
            alt=""
            className="max-h-[min(92vh,100%)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}

      {doodleLightboxSrc !== null && (
        <div
          className="fixed inset-0 z-[55] flex touch-none items-center justify-center bg-black/92 p-3"
          onClick={() => setDoodleLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="ギャラリー画像を拡大表示"
        >
          <button
            type="button"
            className={
              isLounge
                ? "touch-manipulation absolute right-3 top-3 z-10 rounded-full border border-bsh-gold/50 bg-bsh-graphite/90 px-3 py-1.5 text-[11px] font-semibold text-bsh-gold shadow-md"
                : "touch-manipulation absolute right-3 top-3 z-10 rounded-full border-2 border-white/80 bg-[#4A4A4A]/90 px-3 py-1.5 text-[11px] font-bold text-[#FFF8EE] shadow-md"
            }
            onClick={() => setDoodleLightboxSrc(null)}
          >
            閉じる
          </button>
          <img
            src={doodleLightboxSrc}
            alt=""
            className="max-h-[min(92vh,100%)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}

      {toastMessage && (
        <div
          className={`pointer-events-none fixed left-1/2 z-[60] max-w-[85vw] -translate-x-1/2 rounded-full px-4 py-1.5 text-center text-[11px] font-bold shadow-lg transition-colors duration-300 ease-out bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] ${
            toastIsError
              ? isLounge
                ? "border border-bsh-bordeaux bg-bsh-bordeaux/95 text-bsh-ivory shadow-[0_8px_24px_-8px_rgba(90,20,30,0.65)]"
                : "bg-[#C62828]/90 text-white"
              : isLounge
                ? "border border-bsh-gold/40 bg-bsh-graphite/95 text-bsh-gold shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
                : "bg-[#4A4A4A]/90 text-[#FFF8EE]"
          }`}
        >
          {toastMessage}
        </div>
      )}

      {isStoryComposerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => {
            setIsStoryComposerOpen(false);
            setNewStoryMediaUrl(null);
            setNewStoryMediaType(null);
            setStoryLayers([]);
            setActiveStoryLayerId(null);
            setStoryTool("none");
            setStoryDraftText("");
          }}
          role="dialog"
          aria-modal="true"
          aria-label="ストーリー投稿"
        >
          <div
            className="w-full max-w-md bg-[#FFF8EE] border-4 border-[#607D8B] rounded-[26px] p-5 shadow-2xl animate-[modalZoomIn_260ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#607D8B] mb-3">ストーリーを追加</h2>
            <label className="block mb-3 cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleStoryMediaSelect}
                className="hidden"
              />
              <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#D4A373] bg-[#FFFCF7] px-3 py-2.5 text-center text-xs font-bold text-[#607D8B] transition-colors hover:bg-[#FFF5E8]">
                1枚の画像 or 動画を選択（動画は準備中ニャ）
              </div>
            </label>
            {newStoryMediaUrl && (
              <div className="mb-3 space-y-2">
                <div
                  ref={storyEditorRef}
                  className="relative h-[360px] w-full overflow-hidden rounded-2xl border-2 border-[#D4A373] bg-black"
                  onMouseMove={moveStoryLayerMouseDrag}
                  onMouseUp={endStoryLayerMouseDrag}
                  onMouseLeave={endStoryLayerMouseDrag}
                  onTouchMove={moveStoryLayerTouch}
                  onTouchEnd={endStoryLayerTouch}
                  onTouchCancel={endStoryLayerTouch}
                >
                  <img
                    src={newStoryMediaUrl}
                    alt="ストーリープレビュー"
                    className="h-full w-full object-cover"
                  />

                  {storyLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`absolute cursor-move select-none ${activeStoryLayerId === layer.id ? "ring-1 ring-white/70" : ""}`}
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                        transformOrigin: "center",
                        touchAction: "none",
                      }}
                      onMouseDown={(e) => startStoryLayerMouseDrag(layer, e)}
                      onWheel={(e) => onStoryLayerWheel(layer, e)}
                      onTouchStart={(e) => startStoryLayerTouch(layer, e)}
                    >
                      {layer.kind === "text" ? (
                        <p
                          style={{
                            color: layer.color ?? "#FFFFFF",
                            fontFamily: STORY_FONT_MAP[layer.style ?? "Modern"],
                            textAlign: layer.align ?? "center",
                            textShadow: "0 1px 3px rgba(0,0,0,0.35)",
                          }}
                          className="min-w-[80px] whitespace-pre-wrap break-words px-1 text-[26px] font-bold leading-tight"
                        >
                          {layer.text}
                        </p>
                      ) : (
                        <p className="px-1 text-[36px] leading-none">{layer.text}</p>
                      )}
                    </div>
                  ))}

                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-white backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setStoryTool((prev) => (prev === "text" ? "none" : "text"))}
                      className={`rounded-full p-1 ${storyTool === "text" ? "bg-white/25" : ""}`}
                      aria-label="テキスト編集"
                    >
                      <Type size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryTool((prev) => (prev === "emoji" ? "none" : "emoji"))}
                      className={`rounded-full p-1 ${storyTool === "emoji" ? "bg-white/25" : ""}`}
                      aria-label="絵文字スタンプ"
                    >
                      <Smile size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryTool("sticker")}
                      className={`rounded-full p-1 ${storyTool === "sticker" ? "bg-white/25" : ""}`}
                      aria-label="ステッカー（準備中）"
                    >
                      <Sticker size={15} />
                    </button>
                  </div>
                </div>

                {storyTool === "text" && (
                  <div className="rounded-xl border border-[#D4A373] bg-white/90 p-2">
                    <input
                      value={storyDraftText}
                      onChange={(e) => setStoryDraftText(e.target.value)}
                      placeholder="テキストを入力（日本語・英語・絵文字OK）"
                      className="w-full rounded-md border border-[#D4A373]/60 px-2 py-1 text-sm"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {(["Modern", "Strong", "Neon"] as StoryTextStyle[]).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setStoryTextStyle(style)}
                          className={`rounded-md border px-2 py-1 text-xs font-bold ${storyTextStyle === style ? "border-[#607D8B] bg-[#607D8B] text-white" : "border-[#D4A373] bg-white text-[#607D8B]"}`}
                        >
                          {style}
                        </button>
                      ))}
                      <div className="relative h-8 w-28 overflow-hidden rounded-md border border-[#D4A373] bg-gradient-to-r from-red-500 via-green-400 to-blue-500">
                        <input
                          type="color"
                          value={storyTextColor}
                          onChange={(e) => setStoryTextColor(e.target.value)}
                          className="h-full w-full cursor-pointer opacity-0"
                          aria-label="テキスト色"
                        />
                      </div>
                      <button type="button" onClick={() => setStoryTextAlign("left")} className={`rounded border p-1 ${storyTextAlign === "left" ? "bg-[#607D8B] text-white" : "bg-white text-[#607D8B]"}`}><AlignLeft size={14} /></button>
                      <button type="button" onClick={() => setStoryTextAlign("center")} className={`rounded border p-1 ${storyTextAlign === "center" ? "bg-[#607D8B] text-white" : "bg-white text-[#607D8B]"}`}><AlignCenter size={14} /></button>
                      <button type="button" onClick={() => setStoryTextAlign("right")} className={`rounded border p-1 ${storyTextAlign === "right" ? "bg-[#607D8B] text-white" : "bg-white text-[#607D8B]"}`}><AlignRight size={14} /></button>
                      <button
                        type="button"
                        onClick={addStoryTextLayer}
                        className="ml-auto rounded-md bg-[#E56B6F] px-2 py-1 text-xs font-bold text-white"
                        disabled={!storyDraftText.trim()}
                      >
                        テキスト追加
                      </button>
                    </div>
                  </div>
                )}

                {storyTool === "emoji" && (
                  <div className="rounded-xl border border-[#D4A373] bg-white/90 p-2">
                    <div className="grid grid-cols-6 gap-1.5">
                      {STORY_EMOJI_PICKER.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addStoryEmojiLayer(emoji)}
                          className="rounded-md bg-[#FFF8EE] p-1 text-xl transition-transform hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {storyTool === "sticker" && (
                  <div className="rounded-xl border border-dashed border-[#D4A373] bg-[#FFFDF8] p-2 text-xs font-bold text-[#607D8B]">
                    ステッカー機能は準備中ニャ（将来ここに猫ステッカー一覧を追加）
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsStoryComposerOpen(false);
                  setNewStoryMediaUrl(null);
                  setNewStoryMediaType(null);
                  setStoryLayers([]);
                  setActiveStoryLayerId(null);
                  setStoryTool("none");
                  setStoryDraftText("");
                }}
                className="px-4 py-2 rounded-full text-sm font-bold border-2 border-[#607D8B] text-[#607D8B] bg-white"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={() => {
                  void finalizeStoryComposition();
                }}
                className="px-4 py-2 rounded-full text-sm font-bold border-2 border-[#607D8B] text-[#607D8B] bg-[#F2F8FF] disabled:opacity-50"
                disabled={!newStoryMediaUrl || storyLayers.length === 0}
              >
                完了
              </button>
              <button
                type="button"
                onClick={submitStory}
                className="px-5 py-2 rounded-full text-sm font-bold bg-[#E56B6F] text-white disabled:opacity-50"
                disabled={!newStoryMediaUrl}
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}

      {isComposerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => {
            setIsComposerOpen(false);
            setNewPostImages([]);
            setNewPostImageFiles([]);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="投稿作成"
        >
          <div
            className={
              isLounge
                ? "bsh-lounge-card bsh-lounge-card-surface w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl p-5 pb-[calc(1.25rem+5rem+env(safe-area-inset-bottom,0px))] shadow-[0_20px_50px_-15px_rgba(90,20,30,0.6)] animate-[modalZoomIn_260ms_ease-out]"
                : "w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[26px] border-4 border-[#607D8B] bg-[#FFF8EE] p-5 pb-[calc(1.25rem+5rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-[modalZoomIn_260ms_ease-out]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={
                isLounge
                  ? "mb-3 font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-xl font-semibold text-bsh-gold"
                  : "mb-3 text-xl font-bold text-[#607D8B]"
              }
            >
              {activeTab === "doodle" ? "新しい落書き投稿" : "新しい投稿"}
            </h2>
            <label className="mb-3 block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                multiple
                className="hidden"
              />
              <div
                className={
                  isLounge
                    ? "flex w-full items-center justify-center rounded-xl border border-dashed border-bsh-gold/40 bg-bsh-noir/40 px-3 py-2.5 text-center text-xs font-semibold text-bsh-gold transition-colors duration-300 ease-out hover:bg-bsh-noir/60"
                    : "flex w-full items-center justify-center rounded-xl border border-dashed border-[#D4A373] bg-[#FFFCF7] px-3 py-2.5 text-center text-xs font-bold text-[#607D8B] transition-colors hover:bg-[#FFF5E8]"
                }
              >
                {activeTab === "doodle" ? "描いた絵の画像を選択する" : "画像を選択する（最大4枚）"}
              </div>
            </label>
            <button
              type="button"
              disabled
              className={
                isLounge
                  ? "mb-3 flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-bsh-ivory/20 bg-bsh-noir/25 px-3 py-2.5 text-center text-xs font-semibold text-bsh-ivory/40 opacity-85"
                  : "mb-3 flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-[#B7C9D1] bg-[#F5F8FA] px-3 py-2.5 text-center text-xs font-bold text-[#7F98A5] opacity-85"
              }
              aria-label="動画をアップロード（準備中）"
            >
              動画をアップロード（準備中）
            </button>
            {newPostImages.length > 0 && (
              <div className="mb-3">
                {newPostImages.length === 1 ? (
                  <img
                    src={newPostImages[0]}
                    alt="選択した画像プレビュー"
                    className={
                      isLounge
                        ? "h-[min(52vh,360px)] min-h-[220px] w-full rounded-xl border border-bsh-gold/35 object-cover"
                        : "h-[min(52vh,360px)] min-h-[220px] w-full rounded-2xl border-2 border-[#D4A373] object-cover"
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {newPostImages.map((src, idx) => (
                      <img
                        key={`preview-${idx}`}
                        src={src}
                        alt={`選択画像 ${idx + 1}`}
                        className={
                          isLounge
                            ? "h-28 w-full rounded-xl border border-bsh-gold/35 object-cover"
                            : "h-28 w-full rounded-xl border-2 border-[#D4A373] object-cover"
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea
              value={newPostMessage}
              onChange={(e) => setNewPostMessage(e.target.value)}
              placeholder={activeTab === "doodle" ? "作品タイトルや一言を添えよう..." : "今日のねこ日記を書いてみよう..."}
              className={
                isLounge
                  ? "h-36 w-full resize-none rounded-xl border border-bsh-gold/35 bg-bsh-noir/60 p-4 text-sm text-bsh-ivory outline-none transition-colors duration-300 ease-out placeholder:text-bsh-ivory/35 focus:border-bsh-gold/55"
                  : "h-36 w-full resize-none rounded-2xl border-2 border-[#D4A373] bg-[#FFFCF7] p-4 text-sm outline-none focus:border-[#607D8B]"
              }
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsComposerOpen(false);
                  setNewPostImages([]);
                  setNewPostImageFiles([]);
                }}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-gold/40 px-4 py-2 text-sm font-semibold text-bsh-gold transition-opacity duration-300 ease-out hover:opacity-85"
                    : "rounded-full border-2 border-[#607D8B] bg-white px-4 py-2 text-sm font-bold text-[#607D8B]"
                }
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={submitPost}
                className={
                  isLounge
                    ? "rounded-full border border-bsh-bordeaux bg-bsh-bordeaux/90 px-5 py-2 text-sm font-semibold text-bsh-ivory transition-opacity duration-300 ease-out disabled:opacity-50 hover:opacity-90"
                    : "rounded-full bg-[#E56B6F] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                }
                disabled={!newPostMessage.trim() || (activeTab === "doodle" && newPostImageFiles.length === 0)}
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </BshVariantProvider>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-screen max-w-md bg-[#FAF9F6] shadow-2xl" />
      }
    >
      <BshRetroApp />
    </Suspense>
  );
}
