import React from "react";

export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

export const mapColor = (c: ColorKey) =>
  c === "black" ? "#0a0a0a" :
  c === "red"   ? "#d10f1b" :
  c === "blue"  ? "#1f57c3" :
  c === "green" ? "#0d7a3a" :
  c === "pink"  ? "#e75480" :
  /* rainbow */   "#d10f1b";

export function NameTilePreview({
  text,
  layout,
  fontStack,
  colors,
}: {
  text: string;
  layout: "vertical" | "horizontal";
  fontStack: string;
  colors: ColorKey[];
}) {
  // 1牌に全文字を入れる（要望）
  const display = text || "一刀";
  const color = colors[0] ?? "black";

  return (
    <div className="w-36 h-48 rounded-xl border bg-white shadow-inner grid place-items-center">
      <div
        style={{ fontFamily: fontStack, color: mapColor(color) }}
        className={`text-4xl leading-none ${layout === "vertical" ? "writing-vertical-rl" : ""}`}
      >
        {display}
      </div>
      <style>{`
        .writing-vertical-rl{
          writing-mode: vertical-rl;
          text-orientation: upright;
        }
      `}</style>
    </div>
  );
}

export function RegularTilePreview({
  suit,
  number,
  honor,
  back,
}: {
  suit: "honor" | "manzu" | "souzu" | "pinzu";
  number: number;
  honor: "東" | "南" | "西" | "北" | "白" | "發" | "中";
  back: "yellow" | "blue";
}) {
  const label =
    suit === "honor" ? honor : `${number}${suit === "manzu" ? "萬" : suit === "souzu" ? "索" : "筒"}`;
  return (
    <div className="w-36 h-48 rounded-xl border bg-white shadow-inner grid place-items-center relative">
      <div className="absolute inset-0 rounded-xl" style={{ boxShadow: `inset 0 0 0 8px ${back === "yellow" ? "#f5e056" : "#4ea0ff"}66` }} />
      <div className="text-5xl">{label}</div>
    </div>
  );
}
