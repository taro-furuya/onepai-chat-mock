/*
  one牌｜AIチャット購入体験 モック（プレビュー改善版 v7.4.1）
  - 牌プレビューを本物っぽく：角丸・単一枠線・陰影。サイズは文字数で自動拡大。
  - レイアウト：縦＝縦書き／横＝牌を横長にし横書き。
  - 文字順の逆転バグを修正（入力順そのまま）。
  - 1文字ずつ色選択（常時展開）。レインボーは上下グラデーションで描画。
  - 4文字超で自動2行（縦は2列、横は2行）。
*/

import React, { $1, useEffect } from "react";

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
const colorCss = (k: ColorKey) => PALETTE.find((p) => p.key === k)!.css;

// ====== 文字分割（4超で自動2行/2列） ======
function splitForTwoLines(chars: string[]) {
  if (chars.length <= 4) return [chars];
  const half = Math.ceil(chars.length / 2);
  return [chars.slice(0, half), chars.slice(half)];
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

  // 牌サイズ（縦：高さ>幅、横：幅>高さ）
  // 牌の縦×横 比率：縦=28:21 / 横=21:28（CSSのaspect-ratioは width/height）
  const aspect = layout === "vertical" ? 21 / 28 : 28 / 21; // おおよそ実寸比

  // 文字サイズの概算：内側の短辺 / 文字数（行/列）で調整
  const cols = groups.reduce((m, g) => Math.max(m, g.length), 0);
  const rows = groups.length; // 1 または 2
  const baseShortSide = 360; // 枠いっぱいまで
  const k = layout === "vertical" ? 1.45 : 1.40;
  const fontSize = Math.max(28, Math.floor((baseShortSide / Math.max(cols, 1)) * k));

  // CSS ヘルパ（レインボー塗り）
  const colorStyle = (k: ColorKey): React.CSSProperties =>
    k === "rainbow"
      ? { background: colorCss(k), WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
      : { color: colorCss(k) as string };

  // 1文字ごとの色取得（不足時は黒）
  const colorAt = (index: number): ColorKey => (colors[index] ? colors[index] : "black");

  return (
    <div
      className="mx-auto select-none shadow-[0_8px_20px_rgba(0,0,0,.08)] bg-white"
      style={{
        width: layout === "vertical" ? 360 : 580,
        aspectRatio: `${aspect}`,
        borderRadius: 18,
        border: "3px solid #111", // 単一の枠線
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
      }}
    >
      {/* 文字ブロック */}
      {layout === "vertical" ? (
        <div style={{ display: "flex", gap: 8 }}>
          {/* 2列（必要時）。列の並びは左→右で入力順どおり */}
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
                <span key={i} style={colorStyle(colorAt(ci * (groups[0].length || 0) + i))}>{ch}</span>
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
                <span key={i} style={colorStyle(colorAt(ri * (groups[0].length || 0) + i))}>{ch}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== 色スウォッチ ======
function ColorOption({
  active,
  swatch,
  onClick,
}: {
  active: boolean;
  swatch: (typeof PALETTE)[number];
  onClick: () => void;
}) {
  const isRainbow = swatch.key === "rainbow";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded-md border ${active ? "border-neutral-900" : "border-neutral-300"}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      title={swatch.label}
    >
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: isRainbow ? (swatch.css as string) : undefined,
          backgroundImage: isRainbow ? (swatch.css as string) : undefined,
          backgroundColor: isRainbow ? undefined : (swatch.css as string),
          display: "inline-block",
        }}
      />
      <span className="text-sm">{swatch.label}</span>
    </button>
  );
}

// ====== アプリ本体 ======
export default function App() {
  // Typekit (TA風雅筆) ロード
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

  const [text, setText] = useState("一刀");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [fontKey, setFontKey] = useState("ta-fuga-fude");

  const FONT_STACKS: Record<string, string> = {
    "ta-fuga-fude": 'ta-fuga-fude, "TA風雅筆", "Yu Mincho", serif',
    gothic: 'system-ui, -apple-system, "Noto Sans JP", sans-serif',
    mincho: '"Yu Mincho", "Hiragino Mincho ProN", serif',
  };

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
    const need = Math.max(1, chars.length);
    const out = colors.slice();
    while (out.length < need) out.push("black");
    return out.slice(0, need);
  }, [colors, chars.length]);

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
                  placeholder="例）一刀"
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
            <div className="space-y-2">
              <div className="text-sm font-medium">1文字ずつ色を選択</div>
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
