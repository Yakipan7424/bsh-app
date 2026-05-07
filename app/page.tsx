"use client";

import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, ShoppingBag, Languages, Send, Repeat, PlusCircle, Globe, Star } from 'lucide-react';

// Google Fontsの 'Zen Maru Gothic' を適用するためのスタイル設定
// ※実際には layout.tsx 等で読み込むのが理想ですが、まずは動かすためにここにスタイルを入れます。

const POSTS = [
  { id: 1, user: "British_Lord", content: "Today's roundness is 100%. 🐱", lang: "en", translated: "今日の丸まり度は100%です。", likes: 124, image: "https://images.unsplash.com/photo-1513245533132-aa7f7058274a" },
  { id: 2, user: "ねこマニア", content: "この毛並み、もはや絨毯。 #BSH", lang: "ja", translated: "This fur is basically a rug now.", likes: 98, image: "https://images.unsplash.com/photo-1548247416-ec66f4900b2e" }
];

const STORIES = [
  { id: 1, name: "チョコ", image: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4" },
  { id: 2, name: "ルナ", image: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d" },
  { id: 3, name: "レオ", image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce" },
  { id: 4, name: "モカ", image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5" },
  { id: 5, name: "ココ", image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987" },
];

type Post = (typeof POSTS)[number];

export default function BshRetroApp() {
  const [activeTab, setActiveTab] = useState('sns');
  const [feedPosts, setFeedPosts] = useState<Post[]>(POSTS);
  const [translated, setTranslated] = useState<Record<number, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
  const [likedThread, setLikedThread] = useState(false);
  const [activeBottomMenu, setActiveBottomMenu] = useState('heart');
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [poppingStory, setPoppingStory] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<(typeof STORIES)[number] | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  const toggleTranslate = (id: number) => {
    setTranslated(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePostLike = (id: number) => {
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStoryClick = (id: number) => {
    const story = STORIES.find((item) => item.id === id) ?? null;
    setActiveStory(id);
    setPoppingStory(id);
    setSelectedStory(story);
  };

  useEffect(() => {
    if (poppingStory === null) return;
    const timer = setTimeout(() => setPoppingStory(null), 420);
    return () => clearTimeout(timer);
  }, [poppingStory]);

  const submitPost = () => {
    const message = newPostMessage.trim();
    if (!message) return;

    const newPost: Post = {
      id: Date.now(),
      user: "あなた",
      content: message,
      lang: "ja",
      translated: message,
      likes: 0,
      image: newPostImage ?? "https://images.unsplash.com/photo-1513245543132-31f507417b26",
    };

    setFeedPosts((prev) => [newPost, ...prev]);
    setNewPostMessage("");
    setNewPostImage(null);
    setIsComposerOpen(false);
    setActiveTab("sns");
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewPostImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-md mx-auto bg-[#FAF9F6] min-h-screen pb-24 shadow-2xl font-['Zen_Maru_Gothic',sans-serif] text-[#4A4A4A]">
      {/* 共通スタイル（丸ゴシック） */}
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

      {/* ヘッダー：レトロな雑誌風 */}
      <header className="sticky top-0 bg-[#F5EFE6] border-b-4 border-[#607D8B] px-6 py-4 flex justify-between items-center z-30">
        <h1 className="text-2xl font-bold text-[#607D8B] italic tracking-tighter">BSH Times 🐾</h1>
        <div className="flex gap-4">
          <Globe className="text-[#D4A373]" size={24} />
          <PlusCircle className="text-[#607D8B]" size={26} />
        </div>
      </header>

      {/* ナビゲーションタブ */}
      <nav className="flex sticky top-[72px] z-20 bg-white border-b-2 border-[#607D8B]">
        {['sns', 'threads', 'shop'].map((t) => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === t ? 'bg-[#607D8B] text-white' : 'text-[#607D8B] hover:bg-[#F5EFE6]'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* ストーリー */}
      <section className="px-4 py-4 bg-[#FFF8EE] border-b-2 border-[#EADBC8]">
        <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {STORIES.map((story) => (
            <button
              key={story.id}
              onClick={() => handleStoryClick(story.id)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
              aria-label={`${story.name}のストーリー`}
            >
              <span
                className={`p-[3px] rounded-full bg-gradient-to-tr from-[#F6B36A] via-[#E56B6F] to-[#8E7DBE] shadow-sm transition-all duration-300 ${activeStory === story.id ? 'shadow-[0_0_0_2px_rgba(250,249,246,0.95)]' : ''}`}
              >
                <span
                  className={`block w-16 h-16 rounded-full p-[2px] bg-[#FAF9F6] transition-transform duration-300 ${poppingStory === story.id ? 'animate-[storyPop_420ms_ease-out] scale-105' : 'group-hover:scale-105'}`}
                >
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full rounded-full object-cover border-2 border-[#FAF9F6]"
                  />
                </span>
              </span>
              <span className={`text-xs font-bold transition-colors ${activeStory === story.id ? 'text-[#E56B6F]' : 'text-[#607D8B]'}`}>
                {story.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <main className="p-5">
        {/* SNS FEED */}
        {activeTab === 'sns' && feedPosts.map(post => (
          <div key={post.id} className="bg-white border-3 border-[#4A4A4A] rounded-[30px] mb-8 shadow-[8px_8px_0px_0px_rgba(212,163,115,0.5)] overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b-2 border-[#FAF9F6]">
              <div className="w-10 h-10 rounded-full bg-[#D4A373] border-2 border-[#4A4A4A]" />
              <span className="font-bold text-lg">{post.user}</span>
            </div>
            <img src={post.image} alt="cat" className="w-full border-b-2 border-[#4A4A4A]" />
            <div className="p-4 bg-[#FFFDFB]">
              <div className="flex gap-5 mb-3">
                <button
                  onClick={() => togglePostLike(post.id)}
                  className="transition-transform hover:scale-125 active:scale-95"
                  aria-label="Like post"
                >
                  <Heart
                    size={28}
                    className={`cursor-pointer transition-colors ${likedPosts[post.id] ? 'text-red-500 fill-red-500' : 'text-[#E56B6F]'}`}
                  />
                </button>
                <MessageCircle size={28} />
                <Send size={28} />
              </div>
              <p className="text-md leading-relaxed">
                <span className="font-bold text-[#607D8B]">@{post.user}</span> {translated[post.id] ? post.translated : post.content}
              </p>
              <button onClick={() => toggleTranslate(post.id)} className="mt-3 flex items-center gap-1 text-xs font-bold text-[#D4A373] border-b border-[#D4A373]">
                <Languages size={14} /> {translated[post.id] ? "Original" : "日本語に翻訳"}
              </button>
            </div>
          </div>
        ))}

        {/* THREADS (TEXT FEED) */}
        {activeTab === 'threads' && (
          <div className="space-y-4">
            <div className="bg-[#FEF9EF] border-2 border-[#607D8B] p-5 rounded-2xl shadow-sm relative">
              <div className="flex justify-between font-bold text-[#607D8B] mb-2">
                <span>@BlueCat_Fan</span>
                <span className="text-xs opacity-60">2h ago</span>
              </div>
              <p className="text-md">ブリティッシュショートヘアの「虚無」の表情、一生見てられるよね。同意する人？</p>
              <div className="flex gap-6 mt-4 text-[#D4A373]">
                <button
                  onClick={() => setLikedThread(prev => !prev)}
                  className="transition-transform hover:scale-110 active:scale-95"
                  aria-label="Like thread"
                >
                  <Heart size={20} className={`transition-colors ${likedThread ? 'text-red-500 fill-red-500' : ''}`} />
                </button>
                <MessageCircle size={20} />
                <Repeat size={20} />
              </div>
            </div>
          </div>
        )}

        {/* SHOP (GOODS) */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border-2 border-[#4A4A4A] rounded-2xl p-3 shadow-[4px_4px_0px_0px_#607D8B]">
                <div className="aspect-square bg-[#F5EFE6] rounded-xl mb-3 flex items-center justify-center">
                  <Star className="text-[#D4A373]" />
                </div>
                <h3 className="text-xs font-bold h-8">BSH専用ふかふかベッド</h3>
                <p className="text-[#E56B6F] font-bold mt-1">¥4,800</p>
                <button className="w-full bg-[#607D8B] text-white text-[10px] py-2 mt-2 rounded-full font-bold shadow-md">BUY NOW</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 固定フッター */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#4A4A4A] rounded-full p-4 flex justify-around items-center shadow-2xl z-40">
        <button
          onClick={() => setActiveBottomMenu('heart')}
          className={`transition-all active:scale-95 ${activeBottomMenu === 'heart' ? 'text-red-500 opacity-100' : 'text-white opacity-50'}`}
          aria-label="Favorites"
        >
          <Heart size={24} className={activeBottomMenu === 'heart' ? 'fill-red-500' : ''} />
        </button>
        <button
          onClick={() => setActiveBottomMenu('shop')}
          className={`transition-all active:scale-95 ${activeBottomMenu === 'shop' ? 'text-red-500 opacity-100' : 'text-white opacity-50'}`}
          aria-label="Shop"
        >
          <ShoppingBag size={24} />
        </button>
        <button
          onClick={() => {
            setActiveBottomMenu('create');
            setIsComposerOpen(true);
          }}
          className={`p-3 rounded-full -translate-y-2 border-4 border-[#FAF9F6] transition-all active:scale-95 ${activeBottomMenu === 'create' ? 'bg-red-500' : 'bg-[#D4A373]'}`}
          aria-label="Create"
        >
          <PlusCircle size={24} className="text-white" />
        </button>
        <button
          onClick={() => setActiveBottomMenu('star')}
          className={`transition-all active:scale-95 ${activeBottomMenu === 'star' ? 'text-red-500 opacity-100' : 'text-white opacity-50'}`}
          aria-label="Featured"
        >
          <Star size={24} />
        </button>
        <button
          onClick={() => setActiveBottomMenu('globe')}
          className={`transition-all active:scale-95 ${activeBottomMenu === 'globe' ? 'text-red-500 opacity-100' : 'text-white opacity-50'}`}
          aria-label="Global"
        >
          <Globe size={24} />
        </button>
      </footer>

      {selectedStory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => setSelectedStory(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedStory.name}のストーリー`}
        >
          <div
            className="relative w-full max-w-md rounded-[28px] border-4 border-[#FAF9F6] shadow-2xl overflow-hidden animate-[modalZoomIn_260ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedStory.image}
              alt={selectedStory.name}
              className="w-full h-[70vh] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent p-5">
              <p className="text-[#FFF8EE] text-xl font-bold tracking-wide">{selectedStory.name}</p>
            </div>
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-[#FFF8EE]/95 text-[#4A4A4A] text-2xl leading-none flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
              aria-label="ストーリーを閉じる"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isComposerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4 animate-[modalFadeIn_220ms_ease-out]"
          onClick={() => setIsComposerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="投稿作成"
        >
          <div
            className="w-full max-w-md bg-[#FFF8EE] border-4 border-[#607D8B] rounded-[26px] p-5 shadow-2xl animate-[modalZoomIn_260ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#607D8B] mb-3">新しい投稿</h2>
            <label className="block mb-3 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="w-full rounded-2xl border-2 border-dashed border-[#D4A373] bg-[#FFFCF7] p-4 text-center text-sm font-bold text-[#607D8B] transition-colors hover:bg-[#FFF5E8]">
                画像を選択する
              </div>
            </label>
            {newPostImage && (
              <div className="mb-3">
                <img
                  src={newPostImage}
                  alt="選択した画像プレビュー"
                  className="w-full h-40 rounded-2xl border-2 border-[#D4A373] object-cover"
                />
              </div>
            )}
            <textarea
              value={newPostMessage}
              onChange={(e) => setNewPostMessage(e.target.value)}
              placeholder="今日のねこ日記を書いてみよう..."
              className="w-full h-36 resize-none rounded-2xl border-2 border-[#D4A373] bg-[#FFFCF7] p-4 text-sm outline-none focus:border-[#607D8B]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setIsComposerOpen(false);
                  setNewPostImage(null);
                }}
                className="px-4 py-2 rounded-full text-sm font-bold border-2 border-[#607D8B] text-[#607D8B] bg-white"
              >
                閉じる
              </button>
              <button
                onClick={submitPost}
                className="px-5 py-2 rounded-full text-sm font-bold bg-[#E56B6F] text-white disabled:opacity-50"
                disabled={!newPostMessage.trim()}
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}