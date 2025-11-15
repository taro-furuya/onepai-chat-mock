import React, { useMemo } from "react";

export type RegularTileSelection =
  | { kind: "honor"; honor: "東" | "南" | "西" | "北" | "白" | "發" | "中" }
  | { kind: "suit"; suit: "manzu" | "souzu" | "pinzu"; number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; red?: boolean }
  | { kind: "season"; season: "spring" | "summer" | "autumn" | "winter" };

const KANJI_NUMBERS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
const SUIT_SUFFIX: Record<"manzu" | "souzu" | "pinzu", string> = {
  manzu: "萬",
  souzu: "索",
  pinzu: "筒",
};

const SEASON_LABELS: Record<"spring" | "summer" | "autumn" | "winter", string> = {
  spring: "季節牌（春）",
  summer: "季節牌（夏）",
  autumn: "季節牌（秋）",
  winter: "季節牌（冬）",
};

const SEASON_GLYPHS: Record<"spring" | "summer" | "autumn" | "winter", string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

const encodeSvg = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const baseSvg = (
  glyphs: string[],
  options: { fill: string | string[]; accent?: string; fontSize?: number }
) => {
  const width = 360;
  const height = 520;
  const fontSize = options.fontSize ?? 240;
  const fillColors = Array.isArray(options.fill) ? options.fill : glyphs.map(() => options.fill);
  const verticalGap = glyphs.length > 2 ? fontSize * 0.65 : fontSize * 0.72;
  const totalHeight = verticalGap * (glyphs.length - 1);
  const startY = height / 2 - totalHeight / 2;
  const textElements = glyphs
    .map((glyph, index) => {
      const y = startY + index * verticalGap + fontSize / 2;
      const fill = fillColors[index] ?? fillColors[0] ?? "#1f2933";
      return `<text x="${width / 2}" y="${y.toFixed(2)}" text-anchor="middle" font-family="'Yu Mincho', 'Hiragino Mincho ProN', serif" font-size="${fontSize}" fill="${fill}">${glyph}</text>`;
    })
    .join("");

  const accentElement = options.accent
    ? `<circle cx="${width - 70}" cy="${height - 90}" r="26" fill="${options.accent}" opacity="0.8" />`
    : "";

  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="tileShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fefefd" />
          <stop offset="100%" stop-color="#f2ede4" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <g filter="url(#softShadow)">
        <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="36" fill="#fbf9f5" />
        <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="28" fill="url(#tileShadow)" stroke="#d6cec1" stroke-width="3" />
        ${textElements}
        ${accentElement}
      </g>
    </svg>
  `);
};

const labelFromSelection = (selection: RegularTileSelection) => {
  if (selection.kind === "honor") {
    return `通常牌（${selection.honor}）`;
  }
  if (selection.kind === "season") {
    return SEASON_LABELS[selection.season];
  }
  const numberLabel = KANJI_NUMBERS[selection.number - 1];
  if (selection.red) {
    return `${numberLabel}${SUIT_SUFFIX[selection.suit]}（赤）`;
  }
  return `${numberLabel}${SUIT_SUFFIX[selection.suit]}`;
};

const glyphFromSelection = (selection: RegularTileSelection): { glyphs: string[]; fill: string | string[]; accent?: string } => {
  if (selection.kind === "honor") {
    const fill = selection.honor === "白" ? "#0f172a" : selection.honor === "發" ? "#15803d" : "#b91c1c";
    return { glyphs: [selection.honor], fill };
  }
  if (selection.kind === "season") {
    const fillMap: Record<typeof selection.season, string> = {
      spring: "#db2777",
      summer: "#1d4ed8",
      autumn: "#b45309",
      winter: "#0f172a",
    };
    return { glyphs: [SEASON_GLYPHS[selection.season]], fill: fillMap[selection.season], accent: "#f97316" };
  }
  const glyphs = [KANJI_NUMBERS[selection.number - 1], SUIT_SUFFIX[selection.suit]];
  const fill = selection.red
    ? ["#b91c1c", "#b91c1c"]
    : selection.suit === "manzu"
    ? ["#c2410c", "#b91c1c"]
    : selection.suit === "souzu"
    ? ["#166534", "#0f5132"]
    : ["#1d4ed8", "#1e3a8a"];
  return { glyphs, fill, accent: selection.red ? "#dc2626" : undefined };
};

export default function RegularTilePreview({
  selection,
  back,
}: {
  selection: RegularTileSelection;
  back: "yellow" | "blue";
}) {
  const label = useMemo(() => labelFromSelection(selection), [selection]);
  const svgUrl = useMemo(() => {
    const { glyphs, fill, accent } = glyphFromSelection(selection);
    return baseSvg(glyphs, { fill, accent });
  }, [selection]);

  return (
    <div className="space-y-2 text-center">
      <div className="mx-auto h-56 w-44 max-w-full">
        <img
          src={svgUrl}
          alt={`${label}の牌`}
          className="h-full w-full select-none rounded-2xl border-2 border-neutral-200 object-cover shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
          draggable={false}
        />
      </div>
      <div className="text-xs text-neutral-600">背面: {back === "yellow" ? "黄色" : "青色"}</div>
      <div className="text-xs font-medium text-neutral-700">{label}</div>
    </div>
  );
}
