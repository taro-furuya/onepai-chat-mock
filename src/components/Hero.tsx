import React from "react";

export default function Hero() {
  return (
    <section className="rounded-2xl border shadow-sm overflow-hidden">
      <div className="relative">
        <div className="h-40 md:h-56 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700" />
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
          <div className="text-white">
            <h1 className="text-xl md:text-3xl font-bold drop-shadow">
              one牌｜AIチャット購入体験 モック
            </h1>
            <p className="text-neutral-200 text-xs md:text-sm mt-1">
              デプロイ確認 → 分割実装の第一歩です。ここから機能を積み上げます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
