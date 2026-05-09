"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Cat, Home, PawPrint, Pencil, PlusCircle, ShoppingBag } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "sns";

  const isProfile = pathname === "/profile";
  const isHome = pathname === "/";

  const createHref =
    isHome && tab === "threads"
      ? "/?tab=threads&compose=thread"
      : isHome && tab === "doodle"
        ? "/?tab=doodle&compose=doodle"
        : "/?compose=sns";

  const homeActive = isHome && !searchParams.has("tab");
  const doodleActive = isHome && tab === "doodle";
  const shopActive = isHome && tab === "shop";
  const threadsActive = isHome && tab === "threads";
  const profileActive = isProfile;

  const iconInactive = "text-[#F5EFE6] opacity-60";
  const iconActive = "text-[#F6C177] opacity-100";
  /** 親指で押しやすい最小タップ領域（約 44px） */
  const tapTarget = "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center";

  const iconSize = 24;
  const centerIconSize = 26;

  return (
    <footer className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-[min(92%,24rem)] max-w-sm -translate-x-1/2 isolate pt-2 pb-[max(14px,env(safe-area-inset-bottom,0px))]">
      {/*
        フッター全体は pointer-events-none。タップ可能なのは下の nav（pointer-events-auto）だけニャ。
        pb は丸みディスプレイ用 safe-area + 少し余白ニャ。
      */}
      <nav className="pointer-events-auto relative flex min-h-[3.25rem] items-center justify-between rounded-full bg-[#607D8B] px-4 py-2.5 shadow-xl">
        <div className="flex items-center gap-7">
          <Link
            href="/"
            scroll={false}
            onClick={(e) => {
              if (isHome && !searchParams.get("tab")) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("bsh:scroll-home"));
              }
            }}
            className={`${tapTarget} rounded-full transition-all active:scale-95 ${homeActive ? iconActive : iconInactive}`}
            aria-label="Home"
          >
            <Home size={iconSize} className={homeActive ? "fill-[#F6C177]" : ""} strokeWidth={2} />
          </Link>
          <Link
            href="/?tab=threads"
            scroll={false}
            className={`${tapTarget} rounded-full transition-all active:scale-95 ${threadsActive ? iconActive : iconInactive}`}
            aria-label="ニャット"
          >
            <PawPrint size={iconSize} className={threadsActive ? "fill-[#F6C177]/30" : ""} strokeWidth={2} />
          </Link>
        </div>

        <Link
          href={createHref}
          scroll={false}
          className="absolute left-1/2 top-1/2 z-20 flex min-h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#FAF9F6] bg-[#7A93A0] p-2 transition-all active:scale-95"
          aria-label="投稿を作成"
        >
          <PlusCircle size={centerIconSize} className="text-[#FAF9F6]" strokeWidth={2} />
        </Link>

        <div className="flex items-center gap-7">
          <Link
            href="/?tab=doodle"
            scroll={false}
            className={`${tapTarget} rounded-full transition-all active:scale-95 ${doodleActive ? iconActive : iconInactive}`}
            aria-label="ギャラリー"
          >
            <Pencil size={iconSize} strokeWidth={2} />
          </Link>
          <Link
            href="/?tab=shop"
            scroll={false}
            className={`${tapTarget} rounded-full transition-all active:scale-95 ${shopActive ? iconActive : iconInactive}`}
            aria-label="Shop"
          >
            <ShoppingBag size={iconSize} strokeWidth={2} />
          </Link>
          <Link
            href="/profile"
            scroll={false}
            className={`${tapTarget} rounded-full transition-all active:scale-95 ${profileActive ? iconActive : iconInactive}`}
            aria-label="マイページ"
          >
            <Cat
              size={iconSize}
              strokeWidth={2.35}
              className={profileActive ? "fill-[#F6C177]/35" : ""}
            />
          </Link>
        </div>
      </nav>
    </footer>
  );
}

