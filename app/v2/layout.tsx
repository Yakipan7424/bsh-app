import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Noto_Sans_JP, Noto_Serif_JP, Playfair_Display } from "next/font/google";
import "../bsh-lounge.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-bsh-playfair",
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-bsh-inter",
  weight: ["300", "400", "500"],
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-bsh-noto-sans-jp",
  weight: ["300", "400", "500"],
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-bsh-noto-serif-jp",
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BSH Times — Lounge Preview",
  description: "BSH Times lounge theme preview (/v2)",
};

export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${playfair.variable} ${inter.variable} ${notoSansJp.variable} ${notoSerifJp.variable} min-h-screen bg-bsh-noir text-bsh-ivory antialiased`}
    >
      {children}
    </div>
  );
}
