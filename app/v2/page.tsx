"use client";

import { Suspense } from "react";
import { BshRetroApp } from "../page";

export default function V2HomePage() {
  return (
    <Suspense
      fallback={<div className="mx-auto min-h-screen max-w-md bg-bsh-noir shadow-none" aria-hidden />}
    >
      <BshRetroApp variant="lounge" />
    </Suspense>
  );
}
