import React from "react";

export type View = "shop" | "guidelines" | "corporate";

export default function Nav({ active, goto }: { active: View; goto: (v: View) => void }) {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="font-semibold">one牌</div>
        <nav className="flex items-center gap-2 text-sm">
          <button
            type="button"
            className={`px-3 py-1 rounded ${active === "shop" ? "bg-black text-white" : "border"}`}
            onClick={() => goto("shop")}
          >
            ショップ
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded ${active === "guidelines" ? "bg-black text-white" : "border"}`}
            onClick={() => goto("guidelines")}
          >
            入稿規定
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded ${active === "corporate" ? "bg-black text-white" : "border"}`}
            onClick={() => goto("corporate")}
          >
            法人お問い合わせ
          </button>
        </nav>
      </div>
    </header>
  );
}
