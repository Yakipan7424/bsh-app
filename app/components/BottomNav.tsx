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

  return (
    <footer className="pointer-events-none fixed bottom-3 left-1/2 z-40 w-[86%] max-w-sm -translate-x-1/2">
      <nav className="pointer-events-auto relative flex items-center justify-between rounded-full bg-[#607D8B] px-3 py-1.5 shadow-xl">
        <div className="flex items-center gap-4">
        <Link
          href="/"
          scroll={false}
          onClick={(e) => {
            if (isHome && !searchParams.get("tab")) {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("bsh:scroll-home"));
            }
          }}
          className={`transition-all active:scale-95 ${homeActive ? iconActive : iconInactive}`}
          aria-label="Home"
        >
          <Home size={18} className={homeActive ? "fill-[#F6C177]" : ""} />
        </Link>
        <Link
          href="/?tab=threads"
          scroll={false}
          className={`transition-all active:scale-95 ${threadsActive ? iconActive : iconInactive}`}
          aria-label="ニャット"
        >
          <PawPrint size={18} className={threadsActive ? "fill-[#F6C177]/30" : ""} />
        </Link>
        </div>

        <Link
          href={createHref}
          scroll={false}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#FAF9F6] bg-[#7A93A0] p-1.5 transition-all active:scale-95"
          aria-label="Create"
        >
          <PlusCircle size={18} className="text-[#FAF9F6]" />
        </Link>

        <div className="flex items-center gap-4">
        <Link
          href="/?tab=doodle"
          scroll={false}
          className={`transition-all active:scale-95 ${doodleActive ? iconActive : iconInactive}`}
          aria-label="ギャラリー"
        >
          <Pencil size={18} />
        </Link>
        <Link
          href="/?tab=shop"
          scroll={false}
          className={`transition-all active:scale-95 ${shopActive ? iconActive : iconInactive}`}
          aria-label="Shop"
        >
          <ShoppingBag size={18} />
        </Link>
        <Link
          href="/profile"
          scroll={false}
          className={`transition-all active:scale-95 ${profileActive ? iconActive : iconInactive}`}
          aria-label="マイページ"
        >
          <Cat
            size={18}
            strokeWidth={2.25}
            className={profileActive ? "fill-[#F6C177]/35" : ""}
          />
        </Link>
        </div>
      </nav>
    </footer>
  );
}

