import React from "react";

const Hero: React.FC<{ onPrimary?: () => void; onSecondary?: () => void }> = ({ onPrimary, onSecondary }) => {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: 240 }}
    >
      {/* 背景：濃いグラデ＋放射（視認性重視） */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,10,10,.92) 0%, rgba(10,10,10,.86) 40%, rgba(10,10,10,.82) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-20 -right-24 w-[560px] h-[560px] rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(255,255,255,.08), transparent 70%)",
          filter: "blur(16px)",
        }}
      />
      <div className="relative container-narrow px-4 py-10">
        <h1 className="text-white text-[clamp(28px,3.2vw,36px)] font-semibold tracking-tight">
          オンリーワンなオリジナル麻雀牌をつくるなら、one牌
        </h1>
        <p className="text-neutral-200 mt-2 text-sm">
          名前入れ・デザイン持ち込み・フルセット制作まで、シンプルな流れで。
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary border-white" onClick={onPrimary}>作ってみる</button>
          <button className="btn-ghost" onClick={onSecondary}>法人問い合わせ</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
