import React from "react";
import { asset } from "../utils/asset";

type Props = {
  onPrimary?: () => void;
  onSecondary?: () => void;
};

const Hero: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  return (
    <section className="w-full">
      <div className="relative w-full">
        {/* 角丸を付けない／見切れ対策に高さを拡張 */}
        <img
          src={asset("assets/hero-onepai.jpg")}
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="w-full object-cover"
          style={{ height: "520px", borderRadius: 0 }}
        />

        {/* CTA */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          <button
            onClick={onPrimary}
            className="px-6 py-3 rounded-2xl bg-black text-white shadow"
          >
            作ってみる
          </button>
          <button
            onClick={onSecondary}
            className="px-6 py-3 rounded-2xl bg-white shadow border"
          >
            法人問い合わせ
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
