import React, { useEffect, useMemo, useRef, useState } from "react";

export type Layout = "vertical" | "horizontal";
export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

const COLORS: Record<ColorKey, { css: string; gradient?: boolean }> = {
  black: { css: "#0a0a0a" },
  red: { css: "#d10f1b" },
  blue: { css: "#1e5ad7" },
  green: { css: "#2e7d32" },
  pink: { css: "#e24a86" },
  rainbow: {
    css:
      "linear-gradient(180deg,#ff2a2a 0%,#ff7a00 16%,#ffd400 33%,#00d06c 50%,#00a0ff 66%,#7a3cff 83%,#b400ff 100%)",
    gradient: true,
  },
};

const splitChars = (s: string) => Array.from(s || "");
const ensureLen = (arr: ColorKey[], need: number): ColorKey[] => {
  const out = arr.slice();
  while (out.length < need) out.push("black");
  return out.slice(0, need);
};

// 右→左の2段（縦：2列、横：2行）
const splitToLines = (chars: string[]): [string[], string[]] => {
  if (chars.length <= 4) return [chars, []];
  const mid = Math.ceil(chars.length / 2);
  return [chars.slice(0, mid), chars.slice(mid)];
};

type Props = {
  text: string;
  layout: Layout;
  perCharColors: ColorKey[];
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
};

const DEFAULT_TEXT = "麻雀";

const NameTilePreview: React.FC<Props> = ({
  text,
  layout,
  perCharColors,
  useUnifiedColor,
  unifiedColor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const chars = useMemo(() => splitChars(text || DEFAULT_TEXT), [text]);
  const [lineR, lineL] = useMemo(() => splitToLines(chars), [chars]);

  // 色配列（行ごとに切り出し）
  const colorsBase = useUnifiedColor
    ? new Array(chars.length).fill(unifiedColor) as ColorKey[]
    : ensureLen(perCharColors, chars.length);

  const colorsR = colorsBase.slice(0, lineR.length);
  const colorsL = colorsBase.slice(lineR.length, lineR.length + lineL.length);

  // 文字サイズ：枠の90%以内で自動調整（1文字時ははみ出し防止係数を強めに）
  const fontSizePx = useMemo(() => {
    const pad = 24; // 内側余白
    const w = Math.max(0, box.w - pad * 2);
    const h = Math.max(0, box.h - pad * 2);
    if (!w || !h) return 48;

    const oneLine = chars.length <= 4;
    if (layout === "vertical") {
      const columns = oneLine ? 1 : 2;
      const colW = w / columns;
      const perColChars = oneLine ? chars.length : Math.ceil(chars.length / 2);
      let size = Math.min(colW * 0.9, (h / perColChars) * 0.9);
      if (chars.length === 1) size *= 0.85; // 1文字のはみ出し保険
      if (!oneLine) size *= 0.95; // 2列時に少し余裕
      return Math.floor(size);
    } else {
      const rows = oneLine ? 1 : 2;
      const rowH = h / rows;
      const perRowChars = oneLine ? chars.length : Math.ceil(chars.length / 2);
      let size = Math.min((w / perRowChars) * 0.9, rowH * 0.9);
      if (chars.length === 1) size *= 0.85;
      if (!oneLine) size *= 0.95;
      return Math.floor(size);
    }
  }, [box, layout, chars.length]);

  // 牌のアスペクト比
  const ratio = layout === "vertical" ? 28 / 21 : 21 / 28; // width / height
  const renderChar = (ch: string, key: string | number, color: ColorKey) => {
    const c = COLORS[color];
    const style: React.CSSProperties = c.gradient
      ? { backgroundImage: c.css, WebkitBackgroundClip: "text", color: "transparent" }
      : { color: c.css };
    return (
      <span key={key} style={style}>
        {ch}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="mx-auto bg-white shadow-xl"
        style={{
          aspectRatio: `${ratio} / 1`,
          borderRadius: 18,
          border: "2px solid #111",
          overflow: "hidden",
        }}
      >
        <div className="h-full w-full" style={{ padding: 18 }}>
          {layout === "vertical" ? (
            <div className="h-full w-full flex flex-row-reverse gap-2">
              {/* 右列 */}
              <div
                className="flex-1 h-full flex items-center justify-center"
                style={{
                  writingMode: "vertical-rl",
                  fontSize: fontSizePx,
                  lineHeight: 1,
                  fontFamily: "'Hiragino Mincho ProN','Yu Mincho',serif",
                }}
              >
                {lineR.map((ch, i) => renderChar(ch, i, colorsR[i] || "black"))}
              </div>
              {/* 左列 */}
              {lineL.length > 0 && (
                <div
                  className="flex-1 h-full flex items-center justify-center"
                  style={{
                    writingMode: "vertical-rl",
                    fontSize: fontSizePx,
                    lineHeight: 1,
                    fontFamily: "'Hiragino Mincho ProN','Yu Mincho',serif",
                  }}
                >
                  {lineL.map((ch, i) => renderChar(ch, `L-${i}`, colorsL[i] || "black"))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col justify-center gap-2">
              {/* 1行目（右→左で画面上は普通に並べる） */}
              <div
                className="w-full text-center"
                style={{ fontSize: fontSizePx, lineHeight: 1, fontFamily: "'Hiragino Mincho ProN','Yu Mincho',serif" }}
              >
                {lineR.map((ch, i) => renderChar(ch, i, colorsR[i] || "black"))}
              </div>
              {/* 2行目 */}
              {lineL.length > 0 && (
                <div
                  className="w-full text-center"
                  style={{ fontSize: fontSizePx, lineHeight: 1, fontFamily: "'Hiragino Mincho ProN','Yu Mincho',serif" }}
                >
                  {lineL.map((ch, i) => renderChar(ch, `H-${i}`, colorsL[i] || "black"))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameTilePreview;
