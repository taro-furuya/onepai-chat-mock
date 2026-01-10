// src/components/Hero.tsx
import React from "react";
import { asset } from "../utils/asset";

export default function Hero() {
  return (
    <div className="relative w-full bg-white">
      <div className="block w-full md:hidden">
        <div className="relative w-full aspect-[56/21]">
          <img
            src={asset("hero-onepai.jpg")}   // ← ここだけ
            alt="オンリーワンなオリジナル麻雀牌なら、one牌"
            className="absolute inset-0 block h-full w-full object-contain"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
      <div className="hidden h-[560px] w-full md:block">
        <img
          src={asset("hero-onepai.jpg")}   // ← ここだけ
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="block h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}
