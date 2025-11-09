import React from "react";

export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

const COLOR_HEX: Record<ColorKey, string> = {
  black: "#0a0a0a",
  red: "#d10f1b",
  blue: "#1f57c3",
  green: "#0d7a3a",
  pink: "#e75480",
  rainbow: "#d10f1b", // ベース色
};

export default function NameTilePreview({
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
  const chars = Array.from(text || "");
  const useColors = (chars.length ? chars : ["あ"]).map((_, i) => colors[i] ?? "black");

  return (
    <div className="w-44 h-56 rounded-xl border bg-white shadow-inner grid place-items-center">
      <div
        style={{ fontFamily: fontStack }}
        className={`text-4xl leading-none ${layout === "vertical" ? "writing-vertical-rl" : ""}`}
      >
        {chars.length === 0 ? (
          <span className="text-neutral-400 text-base">プレビュー</span>
        ) : layout === "vertical" ? (
          <div className="flex flex-col gap-1">
            {chars.map((ch, i) => (
              <span key={i} style={{ color: COLOR_HEX[useColors[i]] }}>{ch}</span>
            ))}
          </div>
        ) : (
          <div className="flex gap-1">
            {chars.map((ch, i) => (
              <span key={i} style={{ color: COLOR_HEX[useColors[i]] }}>{ch}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
