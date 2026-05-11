"use client";

import Link from "next/link";
import { Cat, Construction, Sparkles } from "lucide-react";
import { PROFILE_DEMO } from "@/app/profile/profile-data";

export default function V2ProfilePage() {
  const p = PROFILE_DEMO;

  return (
    <div className="bsh-v2-lounge mx-auto min-h-screen max-w-md bg-lounge-night pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] font-[family-name:var(--font-bsh-inter),ui-sans-serif,system-ui,sans-serif] font-light text-bsh-ivory antialiased">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-bsh-gold/20 bg-gradient-to-r from-bsh-noir via-bsh-velvet to-bsh-noir px-4 py-3 backdrop-blur-md transition-colors duration-300 ease-out">
        <Link
          href="/v2"
          scroll={false}
          className="text-sm font-semibold text-bsh-ivory transition-opacity duration-300 ease-out hover:opacity-80"
        >
          ← 戻る
        </Link>
        <span className="max-w-[50%] truncate text-sm font-semibold text-bsh-amber">@{p.username}</span>
        <Construction size={20} className="shrink-0 text-bsh-gold/85" aria-hidden />
      </header>

      <div className="relative w-full px-4 pb-8 pt-6">
        <div className="pointer-events-none absolute inset-x-4 top-6 rounded-xl border border-bsh-gold/10 bg-bsh-graphite/35 p-6 opacity-50 blur-[1px]">
          <div className="flex items-center gap-4">
            <img
              src={p.avatar}
              alt=""
              className="h-16 w-16 rounded-full border border-bsh-gold/30 object-cover"
            />
            <div className="space-y-1">
              <div className="h-3 w-28 rounded-full bg-bsh-gold/15" />
              <div className="h-2.5 w-36 rounded-full bg-bsh-gold/10" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-12 rounded-xl bg-bsh-bordeaux/20" />
            <div className="h-12 rounded-xl bg-bsh-bordeaux/20" />
            <div className="h-12 rounded-xl bg-bsh-bordeaux/20" />
          </div>
        </div>

        <section className="bsh-lounge-card bsh-lounge-card-surface relative z-10 mt-10 rounded-xl px-5 py-8 text-center shadow-[0_20px_50px_-15px_rgba(90,20,30,0.5),0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-shadow duration-300 ease-out">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-bsh-gold/30 bg-bsh-burgundy/35 px-4 py-2">
            <Cat size={26} className="text-bsh-gold" />
            <Sparkles size={18} className="text-bsh-amber" />
          </div>
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-bsh-gold/60 bg-gradient-to-br from-bsh-wine to-bsh-bordeaux shadow-[0_12px_30px_-10px_rgba(90,20,30,0.6)]">
            <span className="relative z-10 px-2 text-center text-[10px] font-semibold leading-tight text-bsh-gold">
              BSH illustration
            </span>
          </div>
          <p className="font-[family-name:var(--font-bsh-playfair),ui-serif,Georgia,serif] text-2xl font-semibold tracking-[0.06em] text-bsh-gold">
            Coming Soon...
          </p>
          <p className="mt-3 text-sm font-normal leading-relaxed text-bsh-ivory/95">
            自分だけの猫ログ機能を準備中だニャ！
            <br />
            今は匿名でたくさん投稿してね🐾
          </p>
          <p className="mt-4 text-[11px] font-medium text-bsh-amber">@{p.username}</p>
        </section>

        <div className="mt-6 grid grid-cols-3 gap-2 opacity-[0.35]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl border border-bsh-gold/8 bg-bsh-graphite/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
