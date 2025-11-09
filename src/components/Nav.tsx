import React from "react";
import type { View } from "../App";

export default function Nav({
  active,
  onChange,
}: {
  active: View;
  onChange: (v: View) => void;
}) {
  const Btn = ({
    id,
    label,
  }: {
    id: View;
    label: string;
  }) => (
    <button
      className={`px-3 py-1 rounded ${active === id ? "bg-black text-white" : "border"}`}
      onClick={() => onChange(id)}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="font-semibold">one牌</div>
        <nav className="flex gap-2 text-sm">
          <Btn id="shop" label="ショップ" />
          <Btn id="guidelines" label="入稿規定" />
          <Btn id="corporate" label="法人お問い合わせ" />
        </nav>
      </div>
    </header>
  );
}
