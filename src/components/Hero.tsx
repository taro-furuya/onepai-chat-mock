import React from "react";

type Props = {
  onPrimary?: () => void;
  onSecondary?: () => void;
};

const Hero: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  return (
    <section className="card overflow-hidden mb-6">
      <div className="relative">
        {/* バナー画像 */}
        <img
          src="/assets/onepai-hero.jpg"
          alt="オンリーワンなオリジナル麻雀牌なら、one牌"
          className="w-full h-[220px] md:h-[320px] object-cover"
        />
        {/* 行動ボタン */}
        <div className="absolute inset-x-0 bottom-3 md:bottom-6 flex justify-center gap-2">
          <button className="btn-primary" onClick={onPrimary}>作ってみる</button>
          <button className="btn-ghost" onClick={onSecondary}>法人問い合わせ</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
