// src/components/Hero.tsx
import React from "react";

const HERO_SRC = "public/assets/hero-onepai.jpg"; // public/assets/hero-onepai.jpg

export default function Hero({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="relative w-full bg-white">
      {/* 画像を「見切れない（トリミングしない）」= object-contain */}
      <div className="w-full h-[420px] md:h-[560px]">
        <img
          src={HERO_SRC}
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="w-full h-full object-contain rounded-none"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* CTA */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3 pointer-events-none">
        <button
          onClick={onPrimary}
          className="px-6 py-3 rounded-2xl bg-black text-white shadow pointer-events-auto"
        >
          作ってみる
        </button>
        <button
          onClick={onSecondary}
          className="px-6 py-3 rounded-2xl bg-white shadow pointer-events-auto"
        >
          法人問い合わせ
        </button>
      </div>
    </div>
  );
}
