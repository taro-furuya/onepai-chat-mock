import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type Layout = "vertical" | "horizontal";
export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "gold" | "silver" | "rainbow";

const PALETTE: { key: ColorKey; css: string }[] = [
  { key: "black", css: "#0a0a0a" },
  { key: "red", css: "#d10f1b" },
  { key: "blue", css: "#1f57c3" },
  { key: "green", css: "#0d7a3a" },
  { key: "pink", css: "#e75480" },
  { key: "gold", css: "#d8ad3d" },
  { key: "silver", css: "#b4bcc2" },
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
  maxWidth?: number;
  minWidth?: number;
  downloadable?: boolean;
}) {
  const {
    text,
    layout,
    useUnifiedColor,
    unifiedColor,
    perCharColors,
    fontKey = "ta-fuga-fude",
    maxWidth,
    minWidth = 200,
    downloadable = false,
  } = props;

  // === Typekit を onload で読み込み（onreadystatechange は使用しない） ===
  useEffect(() => {
    const d = document;
    const w = window as any;
    const config = { kitId: "xew3lay", scriptTimeout: 3000, async: true } as const;

    // すでに Typekit がある場合はロード呼び出しだけ
    if (w.Typekit) {
      try {
        w.Typekit.load({ async: true });
      } catch {}
      return;
    }

    const h = d.documentElement;
    const timer = window.setTimeout(() => {
      h.classList.remove("wf-loading");
      h.classList.add("wf-inactive");
    }, config.scriptTimeout);

    const firstScript = d.getElementsByTagName("script")[0] ?? null;
    const tk = d.createElement("script");

    h.classList.add("wf-loading");
    tk.src = `https://use.typekit.net/${config.kitId}.js`;
    tk.async = true;

    tk.onload = () => {
      clearTimeout(timer);
      try {
        w.Typekit?.load(config);
      } catch {}
    };

    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(tk, firstScript);
    } else {
      d.head?.appendChild(tk);
    }
  }, []);

  const chars = useMemo(() => Array.from(text || ""), [text]);
  const groups = useMemo(() => splitTwoLines(chars), [chars]);
  const groupOffsets = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    groups.forEach((group) => {
      offsets.push(running);
      running += group.length;
    });
    return offsets;
  }, [groups]);

  const baseWidth = layout === "vertical" ? 360 : 580;
  const widthCeiling = Math.max(minWidth, Math.min(maxWidth ?? baseWidth, baseWidth));
  const aspect = layout === "vertical" ? 21 / 28 : 28 / 21;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(widthCeiling);
  const tileInnerRef = useRef<HTMLDivElement | null>(null);
  const textContentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setWidth((prev) => Math.min(prev, widthCeiling));
  }, [widthCeiling]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = (nextWidth: number) => {
      const clamped = Math.max(minWidth, Math.min(widthCeiling, Math.round(nextWidth)));
      setWidth(clamped);
    };

    update(el.clientWidth || widthCeiling);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        update(entry.contentRect.width);
      });
      observer.observe(el);
      return () => observer.disconnect();
    }

    const handle = () => update(el.clientWidth || baseWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [widthCeiling, minWidth, baseWidth]);

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
  const colorSignature = colors.join(",");
  const textSignature = chars.join("");

  useEffect(() => {
    setScale(1);
  }, [textSignature, layout, fontKey, colorSignature]);

  useLayoutEffect(() => {
    const measure = () => {
      const inner = tileInnerRef.current;
      const content = textContentRef.current;
      if (!inner || !content) return;

      const innerWidth = inner.clientWidth;
      const innerHeight = inner.clientHeight;
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;

      if (!innerWidth || !innerHeight || !contentWidth || !contentHeight) {
        setScale(1);
        return;
      }

      const next = Math.min(innerWidth / contentWidth, innerHeight / contentHeight, 1);
      setScale((prev) => (Math.abs(prev - next) > 0.01 ? next : prev));
    };

    let raf = requestAnimationFrame(measure);

    const inner = tileInnerRef.current;
    const content = textContentRef.current;
    if (!inner || !content) {
      return () => cancelAnimationFrame(raf);
    }

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(measure);
      });
      observer.observe(inner);
      observer.observe(content);
      return () => {
        observer.disconnect();
        cancelAnimationFrame(raf);
      };
    }

    const handle = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("resize", handle);
      cancelAnimationFrame(raf);
    };
  }, [textSignature, layout, fontKey, colorSignature, width, height]);

  const downloadPreview = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const currentWidth = Math.max(1, width || widthCeiling);
      const aspectRatio = aspect;
      const deviceScale = Math.max(2, Math.round((window.devicePixelRatio || 1) * 2));
      const exportWidth = Math.round(currentWidth * deviceScale);
      const exportHeight = Math.round(exportWidth / aspectRatio);
      const effectiveScale = exportWidth / currentWidth;
      const exportPadding = Math.round(padding * effectiveScale);
      const borderThickness = Math.max(2, Math.round(3 * effectiveScale));

      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("preview export not supported");

      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = borderThickness;
      ctx.strokeRect(
        borderThickness / 2,
        borderThickness / 2,
        exportWidth - borderThickness,
        exportHeight - borderThickness
      );

      const textAreaX = borderThickness + exportPadding;
      const textAreaY = borderThickness + exportPadding;
      const textAreaWidth = exportWidth - (borderThickness + exportPadding) * 2;
      const textAreaHeight = exportHeight - (borderThickness + exportPadding) * 2;

      if ((document as any).fonts?.ready) {
        try {
          await (document as any).fonts.ready;
        } catch {
          // フォント読み込み失敗時も既定フォントで続行
        }
      }

      const canvasFontSize = fontSize * effectiveScale;
      const fontFamily = FONT_STACKS[fontKey];
      ctx.font = `${canvasFontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const horizontalRowGap = 6 * effectiveScale;
      const horizontalCharGap = 8 * effectiveScale;
      const horizontalLineHeight = canvasFontSize;
      const verticalColumnGap = 8 * effectiveScale;
      const verticalCharGap = 6 * effectiveScale;
      const verticalLineHeight = canvasFontSize * 1.05;

      const rainbowStops = [
        "#d10f1b",
        "#ff7a00",
        "#ffd400",
        "#1bb34a",
        "#1f57c3",
        "#7a2bc2",
      ];

      const drawRainbow = (x: number, y: number, height: number) => {
        const gradient = ctx.createLinearGradient(0, y - height / 2, 0, y + height / 2);
        const step = 1 / Math.max(1, rainbowStops.length - 1);
        rainbowStops.forEach((color, index) => gradient.addColorStop(step * index, color));
        ctx.fillStyle = gradient;
      };

      if (layout === "horizontal") {
        const rowMetrics = groups.map((row) => {
          const widths = row.map((ch) => {
            const m = ctx.measureText(ch);
            return Math.max(m.width, canvasFontSize * 0.6);
          });
          const totalWidth = widths.reduce((sum, w) => sum + w, 0) + horizontalCharGap * Math.max(0, row.length - 1);
          return { widths, totalWidth };
        });

        const totalHeight =
          groups.length * horizontalLineHeight + horizontalRowGap * Math.max(0, groups.length - 1);
        let rowY = textAreaY + textAreaHeight / 2 - totalHeight / 2 + horizontalLineHeight / 2;

        groups.forEach((row, rowIndex) => {
          const metrics = rowMetrics[rowIndex];
          let rowX = textAreaX + textAreaWidth / 2 - metrics.totalWidth / 2;

          row.forEach((ch, charIndex) => {
            const charWidth = metrics.widths[charIndex];
            const charCenterX = rowX + charWidth / 2;
            const colorKey = colors[groupOffsets[rowIndex] + charIndex] ?? "black";
            if (colorKey === "rainbow") {
              drawRainbow(charCenterX, rowY, horizontalLineHeight);
            } else {
              ctx.fillStyle = cssOf(colorKey);
            }
            ctx.fillText(ch, charCenterX, rowY);
            rowX += charWidth + horizontalCharGap;
          });

          rowY += horizontalLineHeight + horizontalRowGap;
        });
      } else {
        const columnMetrics = groups.map((column) => {
          const widths = column.map((ch) => {
            const m = ctx.measureText(ch);
            return Math.max(m.width, canvasFontSize * 0.7);
          });
          const columnWidth = Math.max(...widths, canvasFontSize * 0.85);
          const columnHeight =
            column.length * verticalLineHeight + verticalCharGap * Math.max(0, column.length - 1);
          return { widths, columnWidth, columnHeight };
        });

        const totalWidth =
          columnMetrics.reduce((sum, metric, index) => sum + metric.columnWidth + (index > 0 ? verticalColumnGap : 0), 0);
        let cursorX = textAreaX + textAreaWidth / 2 + totalWidth / 2;

        groups.forEach((column, columnIndex) => {
          const metric = columnMetrics[columnIndex];
          cursorX -= metric.columnWidth / 2;
          let columnY =
            textAreaY +
            textAreaHeight / 2 -
            metric.columnHeight / 2 +
            verticalLineHeight / 2;

          column.forEach((ch, charIndex) => {
            const colorKey = colors[groupOffsets[columnIndex] + charIndex] ?? "black";
            if (colorKey === "rainbow") {
              drawRainbow(cursorX, columnY, verticalLineHeight);
            } else {
              ctx.fillStyle = cssOf(colorKey);
            }
            ctx.fillText(ch, cursorX, columnY);
            columnY += verticalLineHeight;
            if (charIndex < column.length - 1) {
              columnY += verticalCharGap;
            }
          });

          cursorX -= metric.columnWidth / 2;
          if (columnIndex < groups.length - 1) {
            cursorX -= verticalColumnGap;
          }
        });
      }

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `onepai-preview-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error(error);
      window.alert("プレビューの画像化に失敗しました。お手数ですが再度お試しください。");
    } finally {
      setDownloading(false);
    }
  }, [aspect, colors, downloading, fontKey, fontSize, groupOffsets, groups, padding, width, widthCeiling]);

  return (
    <div className="space-y-3" ref={containerRef} style={{ width: "100%", maxWidth: widthCeiling, margin: "0 auto" }}>
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
        <div
          ref={tileInnerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div ref={textContentRef}>
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
                      {col.map((ch, i) => {
                        const color = colorStyle(colorAt(groupOffsets[ci] + i));
                        return (
                          <span key={i} style={color}>
                            {ch}
                          </span>
                        );
                      })}
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
                      {row.map((ch, i) => {
                        const color = colorStyle(colorAt(groupOffsets[ri] + i));
                        return (
                          <span key={i} style={color}>
                            {ch}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-500 text-center">
        プレビューはイメージです。色味などは実際と異なる可能性がございます。
      </p>

      {downloadable && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={downloadPreview}
            disabled={downloading}
            className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "画像生成中..." : "プレビューを画像で保存"}
          </button>
        </div>
      )}

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
