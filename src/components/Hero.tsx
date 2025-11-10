import React from "react";

type Props = {
  onPrimary?: () => void;
  onSecondary?: () => void;
};

const Hero: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  // ★ GitHub Pages でも壊れないパス生成
  const heroSrc = `${import.meta.env.BASE_URL}assets/onepai-hero.jpg`;

  return (
    <section className="card overflow-hidden mb-6">
      <div className="relative">
        <img
          src={heroSrc}
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="w-full h-[220px] md:h-[320px] object-cover"
          onError={(e) => {
            // 画像が無い場合のフェールセーフ
            const el = e.currentTarget as HTMLImageElement;
            const parent = el.parentElement as HTMLElement;
            el.style.display = "none";
            parent.style.background =
              "linear-gradient(90deg,#0ea5e9 0%, #22c55e 50%, #f59e0b 100%)";
            parent.style.filter = "saturate(0.9)";
          }}
        />
        <div className="absolute inset-x-0 bottom-3 md:bottom-6 flex justify-center gap-2">
          <button className="btn-primary" onClick={onPrimary}>作ってみる</button>
          <button className="btn-ghost" onClick={onSecondary}>法人問い合わせ</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
