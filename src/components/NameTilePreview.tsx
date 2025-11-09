import React, { useMemo } from "react";

export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

const mapColor = (c: ColorKey): string => {
  switch (c) {
    case "black": return "#0a0a0a";
    case "red": return "#d10f1b";
    case "blue": return "#1f57c3";
    case "green": return "#0d7a3a";
    case "pink": return "#e75480";
    case "rainbow": return "#d10f1b"; // プレビュー基準色
    default: return "#0a0a0a";
  }
};

const clampChars = (s: string) => Array.from(s || "");
const splitTwoLines = (chars: string[]) => {
  // 全角4文字を上限として 2行に分割（5文字目以降は2行目へ）
  const line1 = chars.slice(0, 4).join("");
  const line2 = chars.slice(4).join("");
  return [line1, line2] as const;
};

export function NameTilePreview({
  text,
  layout,            // "vertical" | "horizontal"
  fontStack,
  colors,            // 文字ごとの色（単一色の場合は同じ色の配列でOK）
  size = 1.0,        // 1.0=標準（縦: 240x360、横: 360x240）
}: {
  text: string;
  layout: "vertical" | "horizontal";
  fontStack: string;
  colors: ColorKey[];
  size?: number;
}) {
  // 牌サイズ（横向き時は幅＞高さ）
  const portrait = { w: Math.round(240 * size), h: Math.round(360 * size) };
  const landscape = { w: Math.round(360 * size), h: Math.round(240 * size) };
  const dim = layout === "vertical" ? portrait : landscape;

  const chars = useMemo(() => clampChars(text), [text]);
  const [l1, l2] = useMemo(() => splitTwoLines(chars), [chars]);

  // 各行の色配列（行の文字数ぶん切り出す）
  const colorsL1 = colors.slice(0, l1.length);
  const colorsL2 = colors.slice(l1.length, l1.length + l2.length);

  // 牌のスタイル（アイボリー、面取り、インナーシャドウ風）
  const tileStyle: React.CSSProperties = {
    width: dim.w,
    height: dim.h,
    borderRadius: Math.round(24 * size),
    background: "linear-gradient(160deg, #fffffb 0%, #f6f2e9 60%, #e8e2d4 100%)",
    border: "1px solid #d7d2c6",
    boxShadow:
      "0 10px 24px rgba(0,0,0,.18), inset 0 2px 0 rgba(255,255,255,.8), inset 0 -4px 8px rgba(0,0,0,.06)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const innerStyle: React.CSSProperties = {
    position: "absolute",
    inset: Math.round(18 * size),
    borderRadius: Math.round(16 * size),
    background:
      "linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,.25))",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,.06)",
  };

  const textCommon: React.CSSProperties = {
    fontFamily: fontStack || "system-ui, 'Noto Sans JP', sans-serif",
    fontWeight: 700,
    letterSpacing: layout === "horizontal" ? "0.02em" : "0.05em",
  };

  const lineWrap: React.CSSProperties =
    layout === "vertical"
      ? {
          display: "flex",
          gap: Math.round(10 * size),
          writingMode: "vertical-rl",
          textOrientation: "upright",
          alignItems: "center",
          justifyContent: "center",
          height: "80%",
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(8 * size),
          width: "80%",
        };

  const lineStyle: React.CSSProperties =
    layout === "vertical"
      ? { fontSize: Math.round(48 * size), lineHeight: 1.3, ...textCommon }
      : { fontSize: Math.round(46 * size), lineHeight: 1.15, ...textCommon };

  // 1文字ずつ色適用
  const renderColoredText = (line: string, cols: ColorKey[]) => (
    <span aria-label={line}>
      {Array.from(line).map((ch, i) => (
        <span key={i} style={{ color: mapColor(cols[i] || "black") }}>
          {ch}
        </span>
      ))}
    </span>
  );

  return (
    <div
      className="rounded-2xl shadow"
      style={{
        padding: Math.round(8 * size),
        background: "transparent",
        display: "inline-block",
      }}
    >
      <div style={tileStyle} aria-label="mahjong tile preview">
        <div style={innerStyle} />
        <div style={lineWrap}>
          {/* 縦＝2列（右→左）／横＝2行（上→下） */}
          {layout === "vertical" ? (
            <>
              {/* 1列目（右側） */}
              <div style={lineStyle}>{renderColoredText(l1, colorsL1)}</div>
              {/* 2列目（左側／空なら非表示） */}
              {l2 && <div style={lineStyle}>{renderColoredText(l2, colorsL2)}</div>}
            </>
          ) : (
            <>
              {/* 1行目（上段） */}
              <div style={lineStyle}>{renderColoredText(l1, colorsL1)}</div>
              {/* 2行目（下段／空なら非表示） */}
              {l2 && <div style={lineStyle}>{renderColoredText(l2, colorsL2)}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NameTilePreview;
