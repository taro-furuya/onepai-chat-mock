/*
  one牌｜AIチャット購入体験 モック（プレビュー改善版 v7.7.0）
  - 変更: 既定テキストを「麻雀」に変更。
  - 改善: 2文字以上・2行時の文字サイズを約1.5倍まで拡大（はみ出し防止の上限付き）。
  - 維持: 牌プレビュー、色一括/個別、縦横レイアウト、上下レインボー、2行時は右→左の縦書き。
  - 追加: 軽いスモークテストの継続。
*/

import React, { useMemo, useState, useEffect } from "react";

// ===== 色ユーティリティ =====
const PALETTE = [
  { key: "black", label: "ブラック", css: "#0a0a0a" },
  { key: "red", label: "レッド", css: "#d10f1b" },
  { key: "blue", label: "ブルー", css: "#1f57c3" },
  { key: "green", label: "グリーン", css: "#0d7a3a" },
  { key: "pink", label: "ピンク", css: "#e75480" },
  // レインボーは上下グラデーション
  { key: "rainbow", label: "レインボー", css: "linear-gradient(180deg,#d10f1b,#ff7a00,#ffd400,#1bb34a,#1f57c3,#7a2bc2)" },
] as const;

type ColorKey = (typeof PALETTE)[number]["key"];
const colorCss = (k: ColorKey) => PALETTE.find((p) => p.key === k)!.css as string;

// ====== 文字分割（4超で自動2行/2列） ======
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

// ====== 色スウォッチ（●ブラック などのUI） ======
function ColorOption({
  swatch,
  active,
  onClick,
}: {
  swatch: (typeof PALETTE)[number];
  active: boolean;
  onClick: () => void;
}) {
  const bulletStyle: React.CSSProperties =
    swatch.key === "rainbow"
      ? { background: swatch.css, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
      : { color: swatch.css };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded border text-sm flex items-center gap-1 hover:bg-neutral-50 ${
        active ? "ring-2 ring-black" : ""
      }`}
    >
      <span style={bulletStyle}>●</span>
      <span>{swatch.label}</span>
    </button>
  );
}

// ====== 牌プレビュー ======
function TilePreview({
  text,
  layout, // "vertical" | "horizontal"
  font,
  colors,
}: {
  text: string;
  layout: "vertical" | "horizontal";
  font: string;
  colors: ColorKey[];
}) {
  const chars = useMemo(() => Array.from(text || ""), [text]);
  const groups = useMemo(() => splitForTwoLines(chars), [chars]);

  // 牌のサイズ（固定値で安定表示）
  const width = layout === "vertical" ? 360 : 580; // px
  const aspect = layout === "vertical" ? 21 / 28 : 28 / 21; // width / height
  const height = Math.round(width / aspect);
  const padding = 10; // コンテナの内側余白
  const shortSide = Math.min(width, height) - padding * 2;

  // フォントサイズ計算
  const maxLenInGroup = groups.reduce((m, g) => Math.max(m, g.length), 0) || 1;
  const columnCount = groups.length; // 1 または 2
  let fontSize: number;
  const singleMax = Math.floor(shortSide * 0.85);
  if (chars.length === 1) {
    fontSize = singleMax; // はみ出さない
  } else if (columnCount === 1) {
    const coeff = layout === "vertical" ? 0.86 : 0.82;
    const base = (shortSide * coeff) / maxLenInGroup;
    fontSize = Math.floor(Math.min(base * 1.5, singleMax)); // 1.5倍まで拡大、上限は単字サイズ
  } else {
    const coeff = layout === "vertical" ? 0.86 : 0.8;
    const base = (shortSide * coeff) / maxLenInGroup;
    fontSize = Math.floor(Math.min(base * 1.5, singleMax * 0.9)); // 2行時も拡大（90%上限）
  }

  // CSS ヘルパ（レインボー塗り）
  const colorStyle = (k: ColorKey): React.CSSProperties =>
    k === "rainbow"
      ? { background: colorCss(k), WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
      : { color: colorCss(k) };

  // 1文字ごとの色取得（不足時は黒）
  const colorAt = (index: number): ColorKey => (colors[index] ? colors[index] : "black");

  return (
    <div
      className="mx-auto select-none shadow-[0_8px_20px_rgba(0,0,0,.08)] bg-white"
      style={{
        width,
        aspectRatio: `${aspect}`,
        borderRadius: 18,
        border: "3px solid #111", // 単一の枠線
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
      }}
    >
      {layout === "vertical" ? (
        // 右から左に改行（右列→左列の順で表示）
        <div style={{ display: "flex", gap: 8, flexDirection: "row-reverse" }}>
          {groups.map((col, ci) => (
            <div
              key={ci}
              style={{
                writingMode: "vertical-rl",
                textOrientation: "upright",
                fontFamily: font,
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
                fontFamily: font,
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
  );
}

// ====== アプリ本体 ======
export default function App() {
  // Typekit ロード
  useEffect(() => {
    (function (d: Document) {
      const config = { kitId: "xew3lay", scriptTimeout: 3000, async: true } as const;
      const h = d.documentElement;
      const t = window.setTimeout(() => {
        h.className = h.className.replace(/wf-loading/g, "") + " wf-inactive";
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
        } catch (e) {}
      }) as any;
      s.parentNode?.insertBefore(tk, s);
    })(document);
  }, []);

  useEffect(() => {
    runSmokeTests();
  }, []);

  const [text, setText] = useState("麻雀");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [fontKey, setFontKey] = useState("ta-fuga-fude");

  const FONT_STACKS: Record<string, string> = {
    "ta-fuga-fude": 'ta-fuga-fude, "TA風雅筆", "Yu Mincho", serif',
    gothic: 'system-ui, -apple-system, "Noto Sans JP", sans-serif',
    mincho: '"Yu Mincho", "Hiragino Mincho ProN", serif',
  };

  // 色指定モード
  const [colorMode, setColorMode] = useState<"global" | "perChar">("perChar");
  const [globalColor, setGlobalColor] = useState<ColorKey>("black");

  // 1文字ごとの色（不足分は黒で埋める）
  const [colors, setColors] = useState<ColorKey[]>(["black", "black", "black", "black", "black", "black"]);
  const setColorAt = (i: number, c: ColorKey) =>
    setColors((prev) => {
      const next = prev.slice();
      next[i] = c;
      return next;
    });

  const chars = Array.from(text || "");
  const colorArray = useMemo(() => {
    if (colorMode === "global") return new Array(Math.max(1, chars.length)).fill(globalColor) as ColorKey[];
    const need = Math.max(1, chars.length);
    const out = colors.slice();
    while (out.length < need) out.push("black");
    return out.slice(0, need);
  }, [colors, chars.length, colorMode, globalColor]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">one牌</div>
          <nav className="text-sm text-neutral-600">AIチャット購入体験｜プレビュー改善版</nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* 入力 */}
        <section className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3">入力</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm mb-1">文字</div>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="例）麻雀"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm">レイアウト</div>
                <button
                  className={`px-3 py-1 rounded-lg border ${layout === "vertical" ? "bg-black text-white" : ""}`}
                  onClick={() => setLayout("vertical")}
                >
                  縦
                </button>
                <button
                  className={`px-3 py-1 rounded-lg border ${layout === "horizontal" ? "bg-black text-white" : ""}`}
                  onClick={() => setLayout("horizontal")}
                >
                  横
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm">フォント</div>
                <button
                  className={`px-3 py-1 rounded-lg border ${fontKey === "ta-fuga-fude" ? "bg-black text-white" : ""}`}
                  onClick={() => setFontKey("ta-fuga-fude")}
                >
                  萬子風
                </button>
                <button
                  className={`px-3 py-1 rounded-lg border ${fontKey === "gothic" ? "bg-black text-white" : ""}`}
                  onClick={() => setFontKey("gothic")}
                >
                  ゴシック
                </button>
                <button
                  className={`px-3 py-1 rounded-lg border ${fontKey === "mincho" ? "bg-black text-white" : ""}`}
                  onClick={() => setFontKey("mincho")}
                >
                  明朝
                </button>
              </div>
            </div>

            {/* 色選択 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm">色の指定</div>
                <button
                  className={`px-3 py-1 rounded-lg border ${colorMode === "global" ? "bg-black text-white" : ""}`}
                  onClick={() => setColorMode("global")}
                >
                  一括
                </button>
                <button
                  className={`px-3 py-1 rounded-lg border ${colorMode === "perChar" ? "bg-black text-white" : ""}`}
                  onClick={() => setColorMode("perChar")}
                >
                  個別
                </button>
              </div>

              {colorMode === "global" ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE.map((sw) => (
                    <ColorOption key={sw.key} swatch={sw} active={globalColor === sw.key} onClick={() => setGlobalColor(sw.key)} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(text || "").map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-right">{ch || "・"}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PALETTE.map((sw) => (
                          <ColorOption
                            key={sw.key}
                            swatch={sw}
                            active={(colorArray[idx] || "black") === sw.key}
                            onClick={() => setColorAt(idx, sw.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* プレビュー */}
        <section className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3">プレビュー</h2>
          <TilePreview text={text} layout={layout} font={FONT_STACKS[fontKey]} colors={colorArray} />
        </section>
      </main>

      {/* 簡易フォント埋め込み */}
      <style>{`
        @font-face {
          font-family: 'ta-fuga-fude';
          src: url('/assets/TA-Fugafude.woff2') format('woff2'), url('/assets/TA-Fugafude.woff') format('woff');
          font-weight: 400; font-style: normal; font-display: swap;
        }
      `}</style>
    </div>
  );
}
