"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export type BshVariant = "classic" | "lounge";

const BshVariantContext = createContext<BshVariant>("classic");

export function BshVariantProvider({ value, children }: { value: BshVariant; children: ReactNode }) {
  return <BshVariantContext.Provider value={value}>{children}</BshVariantContext.Provider>;
}

export function useBshVariant() {
  return useContext(BshVariantContext);
}
