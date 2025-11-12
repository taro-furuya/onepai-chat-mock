import React from "react";
import { asset } from "../utils/asset";

export default function Hero({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* 高さは画面幅で伸縮／最小320〜最大560px。角丸なし */}
      <div
        className="w-full"
        style={{
          height: "clamp(320px, 38vw, 560px)",
        }}
      >
        <img
          src={asset("assets/hero-onepai.jpg")}
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="w-full object-cover"
          style={{
            height: "520px",        // 以前より少し高く（見切れ防止）
            borderRadius: 0         // 角丸をなくす
              }}
          />
      </div>

      {/* CTA */}
      <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={onPrimary}
            className="px-6 py-3 rounded-xl bg-black text-white shadow-lg hover:opacity-90"
          >
            作ってみる
          </button>
          <button
            onClick={onSecondary}
            className="px-6 py-3 rounded-xl bg-white text-black shadow hover:bg-neutral-50"
          >
            法人問い合わせ
          </button>
        </div>
      </div>
    </section>
  );
}
