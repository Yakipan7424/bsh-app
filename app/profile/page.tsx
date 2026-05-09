"use client";

import Link from "next/link";
import { Cat, Construction, Sparkles } from "lucide-react";
import { PROFILE_DEMO } from "./profile-data";

const PROFILE = PROFILE_DEMO;

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-['Zen_Maru_Gothic',sans-serif] text-[#4A4A4A]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700&display=swap');
      `}</style>

      {/* 上部バー */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-[#607D8B] bg-[#F5EFE6] px-4 py-3">
        <Link
          href="/"
          className="text-sm font-bold text-[#607D8B] transition-opacity hover:opacity-70"
        >
          ← 戻る
        </Link>
        <span className="max-w-[50%] truncate text-sm font-bold text-[#4A4A4A]">
          @{PROFILE.username}
        </span>
        <Construction size={20} className="text-[#607D8B]" aria-hidden />
      </header>

      <div className="relative mx-auto w-full max-w-md px-4 pb-28 pt-6">
        {/* 薄く残した背景（工事中演出） */}
        <div className="pointer-events-none absolute inset-x-4 top-6 rounded-3xl border-2 border-[#607D8B]/25 bg-[#FFF8EE]/55 p-6 opacity-45 blur-[1px]">
          <div className="flex items-center gap-4">
            <img
              src={PROFILE.avatar}
              alt=""
              className="h-16 w-16 rounded-full border border-[#4A4A4A]/30 object-cover"
            />
            <div className="space-y-1">
              <div className="h-3 w-28 rounded-full bg-[#607D8B]/20" />
              <div className="h-2.5 w-36 rounded-full bg-[#607D8B]/15" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-12 rounded-lg bg-[#607D8B]/15" />
            <div className="h-12 rounded-lg bg-[#607D8B]/15" />
            <div className="h-12 rounded-lg bg-[#607D8B]/15" />
          </div>
        </div>

        {/* 工事中メッセージ */}
        <section className="relative z-10 mt-10 rounded-3xl border-2 border-[#607D8B] bg-[#FFF8EE] px-5 py-8 text-center shadow-[0_8px_0_0_rgba(212,163,115,0.35)]">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-[#F5EFE6] px-4 py-2">
            <Cat size={26} className="text-[#607D8B]" />
            <Sparkles size={18} className="text-[#D4A373]" />
          </div>
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#607D8B] bg-[#F5EFE6] shadow-[3px_3px_0_0_#D4A373]">
            <span className="relative z-10 px-2 text-center text-[10px] font-bold leading-tight text-[#607D8B]">
              BSH illustration
            </span>
          </div>
          <p className="text-2xl font-bold leading-snug text-[#607D8B]">
            Coming Soon...
          </p>
          <p className="mt-3 text-sm font-bold leading-relaxed text-[#4A4A4A]">
            自分だけの猫ログ機能を準備中だニャ！
            <br />
            今は匿名でたくさん投稿してね🐾
          </p>
          <p className="mt-4 text-[11px] text-[#607D8B]">
            @{PROFILE.username}
          </p>
        </section>

        <div className="mt-6 grid grid-cols-3 gap-2 opacity-30">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-[#E8E4DC]" />
          ))}
        </div>
      </div>
    </div>
  );
}
