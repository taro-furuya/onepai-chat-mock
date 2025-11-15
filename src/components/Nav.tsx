import React from "react";

export default function Nav() {
  const navBtn = "px-3 py-2 rounded-lg text-sm hover:bg-neutral-100";
  const goto = (hash: string) => { window.location.hash = hash; };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="container-narrow flex flex-wrap items-center justify-between gap-2 py-2 sm:h-14">
        <div className="font-bold text-lg">one牌</div>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button className={navBtn} onClick={() => goto("#/")}>ショップ</button>
          <button className={navBtn} onClick={() => goto("#/cases")}>事例紹介</button>
          <button className={navBtn} onClick={() => goto("#/guidelines")}>入稿規定</button>
          <button className={navBtn} onClick={() => goto("#/corporate")}>法人問い合わせ</button>
        </nav>
      </div>
    </header>
  );
}
