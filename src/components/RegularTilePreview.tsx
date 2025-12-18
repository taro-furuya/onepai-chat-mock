import React from "react";
import { getHonorTileSrc, getNumberTileSrc, HonorKey } from "../utils/asset";

export default function RegularTilePreview(props: {
  back: "yellow" | "blue"; // 背面色は今は使わず、将来用（写真は表のみ）
  suit: "honor" | "manzu" | "souzu" | "pinzu";
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  honor: HonorKey; // suit==="honor" のときに参照
  aka5?: boolean; // 5 のとき赤牌にする
  width?: number; // 表示幅（任意）
}) {
  const { suit, number, honor, aka5 = false, width = 220 } = props;

  // 写真のパスを決定
  const src =
    suit === "honor"
      ? getHonorTileSrc(honor)
      : getNumberTileSrc(suit, number, aka5);

  return (
    <div
      style={{
        width,
        aspectRatio: "21/28",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 10px 24px rgba(0,0,0,.12)",
        background: "#fff",
      }}
      aria-label="tile-preview"
    >
      {/* 画像はオリジナル解像度を保ちつつ全体にフィット */}
      <img
        src={src}
        alt="mahjong tile"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover", // 牌全面を見せたい時は 'contain' に変更
          display: "block",
        }}
      />
    </div>
  );
}
