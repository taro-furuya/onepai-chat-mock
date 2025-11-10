import React from "react";

export default function Nav() {
  const navBtn = "px-3 py-2 rounded-lg text-sm hover:bg-neutral-100";
  const goto = (hash: string) => { window.location.hash = hash; };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="container-narrow h-14 flex items-center justify-between">
        <div className="font-bold">one牌</div>
        <nav className="flex items-center gap-1">
          <button className={navBtn} onClick={() => goto("#/")}>ショップ</button>
          <button className={navBtn} onClick={() => goto("#/guidelines")}>入稿規定</button>
          <button className={navBtn} onClick={() => goto("#/corporate")}>法人問い合わせ</button>
        </nav>
      </div>
    </header>
  );
}
