import React, { useEffect, useMemo } from "react";

export type Layout = "vertical" | "horizontal";
export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

const PALETTE: { key: ColorKey; css: string }[] = [
  { key: "black", css: "#0a0a0a" },
  { key: "red", css: "#d10f1b" },
  { key: "blue", css: "#1f57c3" },
  { key: "green", css: "#0d7a3a" },
  { key: "pink", css: "#e75480" },
  { key: "rainbow", css: "linear-gradient(180deg,#d10f1b,#ff7a00,#ffd400,#1bb34a,#1f57c3,#7a2bc2)" },
];

const cssOf = (k: ColorKey) => PALETTE.find((p) => p.key === k)!.css;

function splitTwoLines(chars: string[]) {
  if (chars.length <= 4) return [chars];
  const half = Math.ceil(chars.length / 2);
  return [chars.slice(0, half), chars.slice(half)];
}

const colorStyle = (k: ColorKey): React.CSSProperties =>
  k === "rainbow"
    ? { background: cssOf(k), WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
    : { color: cssOf(k) };

const FONT_STACKS: Record<string, string> = {
  "ta-fuga-fude": 'ta-fuga-fude, "TA風雅筆", "Yu Mincho", serif',
  gothic: 'system-ui, -apple-system, "Noto Sans JP", sans-serif',
  mincho: '"Yu Mincho", "Hiragino Mincho ProN", serif',
};

export default function NameTilePreview(props: {
  text: string;
  layout: Layout;
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
  perCharColors: ColorKey[];
  fontKey?: "ta-fuga-fude" | "gothic" | "mincho";
}) {
  const { text, layout, useUnifiedColor, unifiedColor, perCharColors, fontKey = "ta-fuga-fude" } = props;

  // Typekit
  useEffect(() => {
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

  const chars = useMemo(() => Array.from(text || ""), [text]);
  const groups = useMemo(() => splitTwoLines(chars), [chars]);

  const width = layout === "vertical" ? 360 : 580;
  const aspect = layout === "vertical" ? 21 / 28 : 28 / 21;
  const height = Math.round(width / aspect);
  const padding = 10;
  const shortSide = Math.min(width, height) - padding * 2;

  const maxLenInGroup = groups.reduce((m, g) => Math.max(m, g.length), 0) || 1;
  const columnCount = groups.length;
  const singleMax = Math.floor(shortSide * 0.85);

  let fontSize: number;
  if (chars.length === 1) {
    fontSize = singleMax;
  } else if (columnCount === 1) {
    const coeff = layout === "vertical" ? 0.86 : 0.82;
    const base = (shortSide * coeff) / maxLenInGroup;
    fontSize = Math.floor(Math.min(base * 1.5, singleMax));
  } else {
    const coeff = layout === "vertical" ? 0.86 : 0.8;
    const base = (shortSide * coeff) / maxLenInGroup;
    fontSize = Math.floor(Math.min(base * 1.5, singleMax * 0.9));
  }

  const colors = useUnifiedColor
    ? (new Array(Math.max(1, chars.length)).fill(unifiedColor) as ColorKey[])
    : (() => {
        const need = Math.max(1, chars.length);
        const out = perCharColors.slice();
        while (out.length < need) out.push("black");
        return out.slice(0, need);
      })();

  const colorAt = (index: number): ColorKey => (colors[index] ? colors[index] : "black");

  return (
    <div className="space-y-2">
      <div
        className="mx-auto select-none shadow-[0_8px_20px_rgba(0,0,0,.08)] bg-white"
        style={{
          width,
          aspectRatio: `${aspect}`,
          borderRadius: 18,
          border: "3px solid #111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding,
        }}
      >
        {layout === "vertical" ? (
          <div style={{ display: "flex", gap: 8, flexDirection: "row-reverse" }}>
            {groups.map((col, ci) => (
              <div
                key={ci}
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "upright",
                  fontFamily: FONT_STACKS[fontKey],
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "92%", textAlign: "center" }}>
            {groups.map((row, ri) => (
              <div
                key={ri}
                style={{
                  fontFamily: FONT_STACKS[fontKey],
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
      </div>

      <p className="text-xs text-neutral-500 text-center">
        プレビューはイメージです。色味などは実際と異なる可能性がございます。
      </p>

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
}
