/*
  one牌｜AIチャット購入体験 モック（プレビュー改善版 v7.7.0 移植版）
  - 既定テキスト「麻雀」
  - 2文字以上・2行時の文字サイズを最大約1.5倍まで拡大（はみ出し防止上限あり）
  - 縦：2行時は右→左（縦書き）、横：上→下（横書き）
  - レインボーは上下グラデーション（vertical）
  - 色一括/個別 両対応
  - 簡易スモークテスト付き
*/

import React, { useEffect, useMemo } from "react";

// ===== 色パレット =====
const PALETTE = [
  { key: "black", label: "ブラック", css: "#0a0a0a" },
  { key: "red", label: "レッド", css: "#d10f1b" },
  { key: "blue", label: "ブルー", css: "#1f57c3" },
  { key: "green", label: "グリーン", css: "#0d7a3a" },
  { key: "pink", label: "ピンク", css: "#e75480" },
  // レインボーは上下グラデーション
  { key: "rainbow", label: "レインボー", css: "linear-gradient(180deg,#d10f1b,#ff7a00,#ffd400,#1bb34a,#1f57c3,#7a2bc2)" },
] as const;

export type ColorKey = (typeof PALETTE)[number]["key"];
const colorCss = (k: ColorKey) => PALETTE.find((p) => p.key === k)!.css as string;

// ===== ユーティリティ =====
const splitChars = (s: string) => Array.from(s || "");

// 4超で自動2行/2列
function splitForTwoLines(chars: string[]) {
  if (chars.length <= 4) return [chars];
  const half = Math.ceil(chars.length / 2);
  return [chars.slice(0, half), chars.slice(half)];
}

// ===== スモークテスト =====
function runSmokeTests() {
  try {
    console.assert(
      JSON.stringify(splitForTwoLines(["一", "二", "三", "四"])) ===
        JSON.stringify([["一", "二", "三", "四"]]),
      "split: <=4 stays one group"
    );
    const s2 = splitForTwoLines(["一", "二", "三", "四", "五"]);
    console.assert(s2.length === 2 && s2[0].length === 3 && s2[1].length === 2, "split: 5 -> 3/2");
    console.assert(colorCss("black").length > 0 && colorCss("rainbow").includes("linear-gradient"), "palette css ok");
  } catch (e) {
    console.warn("Smoke tests raised:", e);
  }
}

// ===== Props =====
export type Layout = "vertical" | "horizontal";

export interface NameTilePreviewProps {
  text: string;                           // 表示文字
  layout: Layout;                         // 縦 or 横
  useUnifiedColor: boolean;               // 色一括指定か
  unifiedColor: ColorKey;                 // 一括指定の色
  perCharColors: ColorKey[];              // 1文字ずつの色
  fontKey?: "ta-fuga-fude" | "gothic" | "mincho"; // 任意。既定は ta-fuga-fude
}

// フォントスタック
const FONT_STACKS: Record<NonNullable<NameTilePreviewProps["fontKey"]>, string> = {
  "ta-fuga-fude": 'ta-fuga-fude, "TA風雅筆", "Yu Mincho", serif',
  gothic: 'system-ui, -apple-system, "Noto Sans JP", sans-serif',
  mincho: '"Yu Mincho", "Hiragino Mincho ProN", serif',
};

// Typekit ローダ（重複起動ガード）
function useTypekitOnce() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__onepai_typekit_loaded__) return;
    (window as any).__onepai_typekit_loaded__ = true;

    (function (d: Document) {
      const config = { kitId: "xew3lay", scriptTimeout: 3000, async: true } as const;
      const h = d.documentElement;
      const t = window.setTimeout(() => {
        h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
      }, config.scriptTimeout);
      const tk = d.createElement("script");
      let f = false as boolean;
      const s = d.getElementsByTagName("script")[0];
      let a: string | undefined;
      h.className += " wf-loading";
      tk.src = "https://use.typekit.net/" + config.kitId + ".js";
      (tk as any).async = true;
      (tk.onload = tk.onreadystatechange = function () {
        // @ts-ignore
        a = this.readyState;
        if (f || (a && a !== "complete" && a !== "loaded")) return;
        f = true;
        clearTimeout(t);
        try {
          // @ts-ignore
          (window as any).Typekit.load(config);
        } catch {}
      }) as any;
      s.parentNode?.insertBefore(tk, s);
    })(document);
  }, []);
}

// ===== 本体コンポーネント =====
const NameTilePreview: React.FC<NameTilePreviewProps> = ({
  text,
  layout,
  useUnifiedColor,
  unifiedColor,
  perCharColors,
  fontKey = "ta-fuga-fude",
}) => {
  useTypekitOnce();

  useEffect(() => {
    runSmokeTests();
  }, []);

  const chars = useMemo(() => splitChars(text || "麻雀"), [text]);
  const groups = useMemo(() => splitForTwoLines(chars), [chars]);

  // 牌のサイズ（固定で安定表示）
  const width = layout === "vertical" ? 360 : 580; // px
  const aspect = layout === "vertical" ? 21 / 28 : 28 / 21; // width/height
  const height = Math.round(width / aspect);
  const padding = 10;
  const shortSide = Math.min(width, height) - padding * 2;

  // フォントサイズ算出
  const maxLenInGroup = groups.reduce((m, g) => Math.max(m, g.length), 0) || 1;
  const columnCount = groups.length; // 1 or 2
  const singleMax = Math.floor(shortSide * 0.85);
  let fontSize: number;

  if (chars.length === 1) {
    fontSize = singleMax; // 1字は最大
  } else if (columnCount === 1) {
    const coeff = layout === "vertical" ? 0.86 : 0.82;
    const base = (shortSide * coeff) / maxLenInGroup;
    fontSize = Math.floor(Math.min(base * 1.5, singleMax)); // 最大1.5倍、上限は単字サイズ
  } else {
    const coeff = layout === "vertical" ? 0.86 : 0.8;
    const base = (shortSide * coeff) / maxLenInGroup;
    fontSize = Math.floor(Math.min(base * 1.5, singleMax * 0.9)); // 2列時は90%上限
  }

  // 色配列を決定（不足は黒で埋める）
  const colorArray: ColorKey[] = useMemo(() => {
    if (useUnifiedColor) return new Array(Math.max(1, chars.length)).fill(unifiedColor) as ColorKey[];
    const need = Math.max(1, chars.length);
    const out = (perCharColors || []).slice();
    while (out.length < need) out.push("black");
    return out.slice(0, need);
  }, [useUnifiedColor, unifiedColor, perCharColors, chars.length]);

  // CSS ヘルパ（レインボー塗り）
  const colorStyle = (k: ColorKey): React.CSSProperties =>
    k === "rainbow"
      ? { background: colorCss(k), WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
      : { color: colorCss(k) };

  const colorAt = (index: number): ColorKey => (colorArray[index] ? colorArray[index] : "black");
  const fontFamily = FONT_STACKS[fontKey];

  return (
    <div
      className="mx-auto select-none shadow-[0_8px_20px_rgba(0,0,0,.08)] bg-white"
      style={{
        width,
        aspectRatio: `${aspect}`,
        borderRadius: 18,
        border: "3px solid #111", // 単一の枠線のみ
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
      }}
    >
      {layout === "vertical" ? (
        // 右→左の列順（row-reverse）
        <div style={{ display: "flex", gap: 8, flexDirection: "row-reverse" }}>
          {groups.map((col, ci) => (
            <div
              key={ci}
              style={{
                writingMode: "vertical-rl",
                textOrientation: "upright",
                fontFamily,
                fontSize,
                lineHeight: 1.05,
                display: "flex",
                alignItems: "center",
              }}
            >
              {col.map((ch, i) => (
                <span key={i} style={colorStyle(colorAt(ci * (groups[0].length || 0) + i))}>
                  {ch}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        // 横は上→下に行（flex column）
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "92%", textAlign: "center" }}>
          {groups.map((row, ri) => (
            <div
              key={ri}
              style={{
                fontFamily,
                fontSize,
                lineHeight: 1.0,
                display: "flex",
                justifyContent: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              {row.map((ch, i) => (
                <span key={i} style={colorStyle(colorAt(ri * (groups[0].length || 0) + i))}>
                  {ch}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* フォント埋め込み（簡易） */}
      <style>{`
        @font-face {
          font-family: 'ta-fuga-fude';
          src: url('/assets/TA-Fugafude.woff2') format('woff2'),
               url('/assets/TA-Fugafude.woff') format('woff');
          font-weight: 400; font-style: normal; font-display: swap;
        }
      `}</style>
    </div>
  );
};

export default NameTilePreview;
