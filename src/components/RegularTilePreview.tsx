import React from "react";

export default function RegularTilePreview({
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
  const face =
    suit === "honor" ? honor : `${number}${suit === "manzu" ? "萬" : suit === "souzu" ? "索" : "筒"}`;
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 h-56 rounded-xl border bg-white grid place-items-center text-5xl">
        {face}
      </div>
      <div className="text-xs text-neutral-600">
        背面: {back === "yellow" ? "黄色" : "青色"}
      </div>
    </div>
  );
}
