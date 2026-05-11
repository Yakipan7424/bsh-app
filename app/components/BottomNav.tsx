"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Cat, Home, PawPrint, Pencil, PlusCircle, ShoppingBag } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "sns";

  const isV2 = pathname === "/v2" || pathname.startsWith("/v2/");
  const homeRoot = isV2 ? "/v2" : "/";
  const isProfile = pathname === "/profile" || pathname === "/v2/profile";
  const isHome = pathname === "/" || pathname === "/v2";

  const createHref =
    isHome && tab === "threads"
      ? `${homeRoot}?tab=threads&compose=thread`
      : isHome && tab === "doodle"
        ? `${homeRoot}?tab=doodle&compose=doodle`
        : `${homeRoot}?compose=sns`;

  const homeActive = isHome && !searchParams.has("tab");
  const doodleActive = isHome && tab === "doodle";
  const shopActive = isHome && tab === "shop";
  const threadsActive = isHome && tab === "threads";
  const profileActive = isProfile;

  const iconInactive = isV2
    ? "text-bsh-ivory/55 transition-opacity duration-300 ease-out"
    : "text-[#F5EFE6] opacity-60";
  const iconActive = isV2
    ? "text-bsh-gold opacity-100 transition-opacity duration-300 ease-out"
    : "text-[#F6C177] opacity-100";
  const tapTarget = "inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center";

  const iconSize = isV2 ? 17 : 19;
  const centerIconSize = isV2 ? 18 : 20;

  const threadsHref = `${homeRoot}?tab=threads`;
  const doodleHref = `${homeRoot}?tab=doodle`;
  const shopHref = `${homeRoot}?tab=shop`;

  return (
    <footer className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-[min(89%,22rem)] max-w-sm -translate-x-1/2 isolate pt-0.5 pb-[max(7px,env(safe-area-inset-bottom,0px))]">
      {/*
        フッター全体は pointer-events-none。タップ可能なのは下の nav（pointer-events-auto）だけニャ。
        pb は丸みディスプレイ用 safe-area + 少し余白ニャ。
      */}
      <nav
        className={
          isV2
            ? "bsh-bottom-nav pointer-events-auto relative flex min-h-[1.85rem] items-center justify-between rounded-full px-2 py-0.5 transition-colors duration-300 ease-out"
            : "pointer-events-auto relative flex min-h-[2rem] items-center justify-between rounded-full bg-[#607D8B] px-2.5 py-0.5 shadow-xl"
        }
      >
        <div className={`flex items-center ${isV2 ? "gap-3" : "gap-4"}`}>
          <Link
            href={homeRoot}
            scroll={false}
            onClick={(e) => {
              if (isHome && !searchParams.get("tab")) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("bsh:scroll-home"));
              }
            }}
            className={`${tapTarget} rounded-full transition-all duration-300 ease-out active:opacity-80 ${homeActive ? iconActive : iconInactive}`}
            aria-label="Home"
          >
            <Home
              size={iconSize}
              className={homeActive ? (isV2 ? "fill-bsh-gold/25" : "fill-[#F6C177]") : ""}
              strokeWidth={2}
            />
          </Link>
          <Link
            href={threadsHref}
            scroll={false}
            className={`${tapTarget} rounded-full transition-all duration-300 ease-out active:opacity-80 ${threadsActive ? iconActive : iconInactive}`}
            aria-label="ニャット"
          >
            <PawPrint
              size={iconSize}
              className={threadsActive ? (isV2 ? "fill-bsh-gold/20" : "fill-[#F6C177]/30") : ""}
              strokeWidth={2}
            />
          </Link>
        </div>

        <Link
          href={createHref}
          scroll={false}
          className={
            isV2
              ? "bsh-nav-center-btn absolute left-1/2 top-1/2 z-20 flex min-h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full p-0.5"
              : "absolute left-1/2 top-1/2 z-20 flex min-h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#FAF9F6] bg-[#7A93A0] p-1 transition-all active:scale-95"
          }
          aria-label="投稿を作成"
        >
          <PlusCircle
            size={centerIconSize}
            className={isV2 ? "text-bsh-gold" : "text-[#FAF9F6]"}
            strokeWidth={2}
          />
        </Link>

        <div className={`flex items-center ${isV2 ? "gap-3" : "gap-4"}`}>
          <Link
            href={doodleHref}
            scroll={false}
            className={`${tapTarget} rounded-full transition-all duration-300 ease-out active:opacity-80 ${doodleActive ? iconActive : iconInactive}`}
            aria-label="ギャラリー"
          >
            <Pencil size={iconSize} strokeWidth={2} />
          </Link>
          <Link
            href={shopHref}
            scroll={false}
            className={`${tapTarget} rounded-full transition-all duration-300 ease-out active:opacity-80 ${shopActive ? iconActive : iconInactive}`}
            aria-label="Shop"
          >
            <ShoppingBag size={iconSize} strokeWidth={2} />
          </Link>
          <Link
            href={isV2 ? "/v2/profile" : "/profile"}
            scroll={false}
            className={`${tapTarget} rounded-full transition-all duration-300 ease-out active:opacity-80 ${profileActive ? iconActive : iconInactive}`}
            aria-label="マイページ"
          >
            <Cat
              size={iconSize}
              strokeWidth={2.35}
              className={profileActive ? (isV2 ? "fill-bsh-gold/22" : "fill-[#F6C177]/35") : ""}
            />
          </Link>
        </div>
      </nav>
    </footer>
  );
}

