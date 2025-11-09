import React from "react";

const Hero: React.FC<{ onPrimary: () => void; onSecondary: () => void }> = ({
  onPrimary,
  onSecondary,
}) => {
  return (
    <section className="rounded-2xl border shadow-sm overflow-hidden mt-4">
      <div className="relative">
        {/* 透けずに必ず見える濃色バック */}
        <div
          className="h-40 md:h-56"
          style={{
            background:
              "radial-gradient(1200px 420px at 15% -20%, #4b5563 0%, #23272f 55%, #0b0b0c 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
          <div className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">
            <h1 className="text-xl md:text-3xl font-bold">one牌｜AIチャット購入体験 モック</h1>
            <p className="text-neutral-200/95 text-xs md:text-sm mt-1">
              チャットの流れで、そのままオリジナル麻雀牌を注文できるUIの試作です。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrimary}
              className="px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white text-neutral-900 shadow text-xs md:text-base font-medium"
            >
              オリジナル麻雀牌を作ってみる
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className="hidden md:inline-block px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white/95 text-neutral-900 shadow text-xs md:text-base font-medium"
            >
              法人お問い合わせ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
