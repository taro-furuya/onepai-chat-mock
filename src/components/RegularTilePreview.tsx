import React, { useMemo, useState } from "react";
import { getHonorTileSrc, getNumberTileSrc, HonorKey } from "../utils/asset";

// 互換用の型（従来の呼び出しシグネチャを許容）
export type RegularTileSelection =
  | { suit: "honor"; number: 1; honor: HonorKey; aka5?: boolean }
  | { suit: "manzu" | "souzu" | "pinzu"; number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; honor: HonorKey; aka5?: boolean };

export default function RegularTilePreview(props: {
  back: "yellow" | "blue"; // 背面色は今は使わず、将来用（写真は表のみ）
  suit: "honor" | "manzu" | "souzu" | "pinzu";
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  honor: HonorKey; // suit==="honor" のときに参照
  aka5?: boolean; // 5 のとき赤牌にする
  width?: number; // 表示幅（任意）
}) {
  const { suit, number, honor, aka5 = false, width = 220 } = props;
  const [useFallback, setUseFallback] = useState(false);

  const label = useMemo(() => {
    if (suit === "honor") return honor;
    if (aka5 && number === 5) return `赤5${suit === "manzu" ? "m" : suit === "pinzu" ? "p" : "s"}`;
    const suitLabel = suit === "manzu" ? "萬" : suit === "pinzu" ? "筒" : "索";
    const kanjiNumbers = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
    return `${kanjiNumbers[number - 1]}${suitLabel}`;
  }, [aka5, honor, number, suit]);

  const fallbackSrc = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">
        <defs>
          <linearGradient id="tileBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fdfcf9"/>
            <stop offset="100%" stop-color="#f2ece3"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="rgba(0,0,0,0.18)" />
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <rect x="20" y="20" width="380" height="520" rx="32" fill="#fbf7f0" />
          <rect x="32" y="32" width="356" height="496" rx="28" fill="url(#tileBg)" stroke="#d7cebf" stroke-width="3"/>
          <text x="50%" y="55%" text-anchor="middle" font-family="'Yu Mincho','Hiragino Mincho ProN',serif" font-size="180" fill="#0f172a">${label}</text>
        </g>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [label]);

  // 写真のパスを決定
  const src = useMemo(
    () =>
      useFallback
        ? fallbackSrc
        : suit === "honor"
        ? getHonorTileSrc(honor)
        : getNumberTileSrc(suit, number, aka5),
    [aka5, fallbackSrc, honor, number, suit, useFallback]
  );

  const srcSet = useMemo(() => {
    if (!src.endsWith(".jpg")) return undefined;
    return `${src} 1x, ${src.replace(".jpg", "@2x.jpg")} 2x`;
  }, [src]);

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
        srcSet={srcSet}
        alt="mahjong tile"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        loading="eager"
        decoding="async"
        onError={() => {
          if (!useFallback) {
            setUseFallback(true);
          }
        }}
      />
    </div>
  );
}
