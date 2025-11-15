// src/components/Hero.tsx
import React from "react";
import { asset } from "../utils/asset";

export default function Hero({
  onPrimary,
  onSecondary,
}: { onPrimary: () => void; onSecondary: () => void }) {
  return (
    <div className="relative w-full bg-white overflow-hidden">
      <div className="w-full h-[420px] md:h-[560px]">
        <img
          src={asset("hero-onepai.jpg")}   // ← ここだけ
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="w-full h-full object-cover rounded-none"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4 pointer-events-none sm:bottom-6 sm:flex-row sm:justify-center sm:gap-3">
        <button
          onClick={onPrimary}
          className="w-full max-w-[320px] px-6 py-3 rounded-2xl bg-black text-white shadow pointer-events-auto sm:w-auto"
        >
          作ってみる
        </button>
        <button
          onClick={onSecondary}
          className="w-full max-w-[320px] px-6 py-3 rounded-2xl bg-white shadow pointer-events-auto sm:w-auto"
        >
          法人問い合わせ
        </button>
      </div>
    </div>
  );
}
