// --- 先頭付近 ---
import React, { useEffect, useMemo, useRef, useState } from "react";

// 追加: 擬似ルーターで使うビュー型
type View = "shop" | "guidelines" | "corporate";

/** ========= プレビュー用の型・定数 ========= */
type Layout = "vertical" | "horizontal";
type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

const COLORS: { key: ColorKey; label: string; css: string; isGradient?: boolean }[] = [
  { key: "black", label: "●ブラック", css: "#0a0a0a" },
  { key: "red", label: "●レッド", css: "#d10f1b" },
  { key: "blue", label: "●ブルー", css: "#1e5ad7" },
  { key: "green", label: "●グリーン", css: "#2e7d32" },
  { key: "pink", label: "●ピンク", css: "#e24a86" },
  // レインボーは上下（縦方向）グラデーション
  {
    key: "rainbow",
    label: "●レインボー",
    css:
      "linear-gradient(180deg,#ff2a2a 0%,#ff7a00 16%,#ffd400 33%,#00d06c 50%,#00a0ff 66%,#7a3cff 83%,#b400ff 100%)",
    isGradient: true,
  },
];

const DEFAULT_TEXT = "麻雀";

/** ========= ユーティリティ ========= */
const splitChars = (input: string): string[] => Array.from(input || "");
const ensureLen = (arr: ColorKey[], need: number): ColorKey[] => {
  const out = arr.slice();
  while (out.length < need) out.push("black");
  return out.slice(0, need);
};
// 右→左の改行順を意識して 2 行に分割
const splitToLines = (chars: string[]): [string[], string[]] => {
  if (chars.length <= 4) return [chars, []];
  const first = chars.slice(0, Math.ceil(chars.length / 2));
  const second = chars.slice(Math.ceil(chars.length / 2));
  return [first, second]; // 描画時に右列=first, 左列=second として扱う
};

/** ========= 小パーツ ========= */
const DotLabel: React.FC<{ color: string; text: string; active?: boolean; onClick?: () => void }> = ({
  color,
  text,
  active,
  onClick,
}) => {
  const isGradient = color.startsWith("linear-gradient");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-neutral-50 ${
        active ? "border-neutral-900" : "border-neutral-300"
      }`}
    >
      <span
        aria-hidden
        className="inline-block w-4 h-4 rounded-full"
        style={isGradient ? { backgroundImage: color } : { backgroundColor: color }}
      />
      <span>{text}</span>
    </button>
  );
};

/** ========= 牌プレビュー ========= */
const TilePreview: React.FC<{
  text: string;
  layout: Layout;
  perCharColors: ColorKey[];
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
}> = ({ text, layout, perCharColors, useUnifiedColor, unifiedColor }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const chars = useMemo(() => splitChars(text), [text]);
  const [lineR, lineL] = useMemo(() => splitToLines(chars), [chars]);

  const colorsFor = (line: string[]) => {
    const base = useUnifiedColor ? new Array(chars.length).fill(unifiedColor) : ensureLen(perCharColors, chars.length);
    if (line === lineR) return base.slice(0, line.length);
    return base.slice(lineR.length, lineR.length + line.length);
  };

  // 自動スケール
  const fontSizePx = useMemo(() => {
    const pad = 28;
    const w = Math.max(0, box.w - pad * 2);
    const h = Math.max(0, box.h - pad * 2);
    if (!w || !h) return 48;

    const oneLine = chars.length <= 4;
    if (layout === "vertical") {
      const columns = oneLine ? 1 : 2;
      const colWidth = w / columns;
      const perColChars = oneLine ? chars.length : Math.ceil(chars.length / 2);
      const fitByHeight = (h / perColChars) * 0.9;
      const fitByWidth = colWidth * 0.9;
      return Math.floor(Math.min(fitByHeight, fitByWidth));
    } else {
      const rows = oneLine ? 1 : 2;
      const rowHeight = h / rows;
      const perRowChars = oneLine ? chars.length : Math.ceil(chars.length / 2);
      const fitByWidth = (w / perRowChars) * 0.9;
      const fitByHeight = rowHeight * 0.9;
      return Math.floor(Math.min(fitByWidth, fitByHeight));
    }
  }, [box, layout, chars.length]);

  const tileRatio = layout === "vertical" ? 28 / 21 : 21 / 28; // w/h
  const borderRadius = 18;

  const renderChar = (ch: string, idx: number, colorKey: ColorKey) => {
    const cDef = COLORS.find((c) => c.key === colorKey)!;
    const style: React.CSSProperties = cDef.isGradient
      ? { backgroundImage: cDef.css, WebkitBackgroundClip: "text", color: "transparent" }
      : { color: cDef.css };
    return (
      <span key={idx} style={style}>
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
          aspectRatio: `${tileRatio} / 1`,
          borderRadius,
          border: "2px solid #111",
        }}
      >
        <div className="h-full w-full" style={{ padding: 18 }}>
          {layout === "vertical" ? (
            <div className="h-full w-full flex flex-row-reverse gap-1">
              {/* 右列 */}
              <div
                className="flex-1 h-full flex items-center justify-center"
                style={{
                  writingMode: "vertical-rl",
                  fontSize: fontSizePx,
                  lineHeight: 1,
                  fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
                }}
              >
                {lineR.map((ch, i) => renderChar(ch, i, colorsFor(lineR)[i] as ColorKey))}
              </div>
              {/* 左列 */}
              {lineL.length > 0 && (
                <div
                  className="flex-1 h-full flex items-center justify-center"
                  style={{
                    writingMode: "vertical-rl",
                    fontSize: fontSizePx,
                    lineHeight: 1,
                    fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
                  }}
                >
                  {lineL.map((ch, i) => renderChar(ch, i, colorsFor(lineL)[i] as ColorKey))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col justify-center">
              <div
                className="w-full text-center"
                style={{ fontSize: fontSizePx, lineHeight: 1, fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
              >
                {lineR.map((ch, i) => renderChar(ch, i, colorsFor(lineR)[i] as ColorKey))}
              </div>
              {lineL.length > 0 && (
                <div
                  className="w-full text-center"
                  style={{
                    fontSize: fontSizePx,
                    lineHeight: 1,
                    fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
                  }}
                >
                  {lineL.map((ch, i) => renderChar(ch, i, colorsFor(lineL)[i] as ColorKey))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** ========= アプリ本体（ルーター＋入力UI＋プレビュー） ========= */
export default function App() {
  // 追加: ビュー切替（location.hash と同期）
  const [activeView, setActiveView] = useState<View>(() => {
    const h = (location.hash || "").replace("#", "");
    return (["shop", "guidelines", "corporate"] as View[]).includes(h as View) ? (h as View) : "shop";
  });
  useEffect(() => {
    const onHash = () => {
      const h = (location.hash || "").replace("#", "");
      if ((["shop", "guidelines", "corporate"] as View[]).includes(h as View)) {
        setActiveView(h as View);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const goto = (v: View) => {
    if (location.hash !== `#${v}`) location.hash = v;
    else setActiveView(v);
  };

  // 既存: 各state（プレビュー）
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [layout, setLayout] = useState<Layout>("vertical");
  const [useUnifiedColor, setUseUnifiedColor] = useState<boolean>(true);
  const [unifiedColor, setUnifiedColor] = useState<ColorKey>("black");
  const [perCharColors, setPerCharColors] = useState<ColorKey[]>([]);
  useEffect(() => {
    const len = splitChars(text).length;
    setPerCharColors((prev) => ensureLen(prev, len));
  }, [text]);
  const setColorAt = (idx: number, key: ColorKey) =>
    setPerCharColors((prev) => {
      const next = prev.slice();
      next[idx] = key;
      return next;
    });
  const chars = useMemo(() => splitChars(text), [text]);

  // 置換: スクロール先参照
  const selectRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  // 置換: スクロール関数（暴走対策）
  const scrollToSelect = () => {
    const el = selectRef.current;
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      const top = el.getBoundingClientRect().top + (document.scrollingElement?.scrollTop || 0) - 16;
      window.scrollTo({ top });
    }
  };

  // 追加: フッターバーに隠れない余白
  const BOTTOM_BAR_HEIGHT = 72;

  return (
    <div
      ref={pageRef}
      style={{ minHeight: "100dvh", paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}
      className="bg-neutral-50"
    >
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="font-semibold">one牌</div>
          <nav className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className={`px-3 py-1 rounded ${activeView === "shop" ? "bg-black text-white" : "border"}`}
              onClick={() => goto("shop")}
            >
              ショップ
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${activeView === "guidelines" ? "bg-black text-white" : "border"}`}
              onClick={() => goto("guidelines")}
            >
              入稿規定
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${activeView === "corporate" ? "bg-black text-white" : "border"}`}
              onClick={() => goto("corporate")}
            >
              法人お問い合わせ
            </button>
          </nav>
        </div>
      </header>

      {/* ヒーロー（ショップのみ） */}
      {activeView === "shop" && (
        <section className="rounded-2xl border shadow-sm overflow-hidden mt-4 max-w-5xl mx-auto">
          <div className="relative">
            <div className="h-40 md:h-56 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700" />
            <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
              <div className="text-white">
                <h1 className="text-xl md:text-3xl font-bold drop-shadow">one牌｜AIチャット購入体験 モック</h1>
                <p className="text-neutral-200 text-xs md:text-sm mt-1">チャットの流れで注文できるUIの試作です。</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={scrollToSelect}
                  className="px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white text-neutral-900 shadow text-xs md:text-base font-medium"
                >
                  オリジナル麻雀牌を作ってみる
                </button>
                <button
                  type="button"
                  onClick={() => goto("corporate")}
                  className="hidden md:inline-block px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white/90 text-neutral-900 shadow text-xs md:text-base font-medium"
                >
                  法人お問い合わせ
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ショップビュー：入力＆プレビュー */}
      {activeView === "shop" && (
        <section className="max-w-5xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
          {/* 入力カード */}
          <div ref={selectRef} className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
            <h2 className="font-semibold mb-4">入力</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">文字</label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="例）麻雀好き"
                />
                <p className="text-xs text-neutral-500 mt-1">全角4文字超で自動的に2行になります。</p>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-1">レイアウト</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border ${layout === "vertical" ? "bg-black text-white" : ""}`}
                    onClick={() => setLayout("vertical")}
                  >
                    縦
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border ${layout === "horizontal" ? "bg-black text-white" : ""}`}
                    onClick={() => setLayout("horizontal")}
                  >
                    横
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">色の指定</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border ${useUnifiedColor ? "bg-black text-white" : ""}`}
                    onClick={() => setUseUnifiedColor(true)}
                  >
                    一括指定
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border ${!useUnifiedColor ? "bg-black text-white" : ""}`}
                    onClick={() => setUseUnifiedColor(false)}
                  >
                    1文字ずつ指定
                  </button>
                </div>

                {useUnifiedColor ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLORS.map((c) => (
                      <DotLabel
                        key={c.key}
                        color={c.css}
                        text={c.label}
                        active={unifiedColor === c.key}
                        onClick={() => setUnifiedColor(c.key)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chars.map((ch, i) => (
                      <div key={`${ch}-${i}`} className="flex items-center gap-3">
                        <div className="w-6 text-right font-medium">{ch}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                          {COLORS.map((c) => (
                            <DotLabel
                              key={c.key}
                              color={c.css}
                              text={c.label}
                              active={(perCharColors[i] || "black") === c.key}
                              onClick={() => setColorAt(i, c.key)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* プレビューカード */}
          <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
            <h2 className="font-semibold mb-4">プレビュー</h2>
            <TilePreview
              text={text || DEFAULT_TEXT}
              layout={layout}
              perCharColors={perCharColors}
              useUnifiedColor={useUnifiedColor}
              unifiedColor={unifiedColor}
            />
          </div>
        </section>
      )}

      {/* 入稿規定ビュー（仮） */}
      {activeView === "guidelines" && (
        <section className="max-w-5xl mx-auto mt-6">
          <div className="rounded-2xl border shadow-sm bg-white p-6">
            <h2 className="font-semibold mb-3">入稿規定</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
              <li>推奨形式：AI / PDF（アウトライン化）/ PSD / PNG・JPG（解像度300dpi以上）</li>
              <li>デザインデータは白黒二値化したものをご用意ください。</li>
              <li>細線や細かいディテールは潰れる可能性があります。</li>
            </ul>
          </div>
        </section>
      )}

      {/* 法人問い合わせビュー（仮） */}
      {activeView === "corporate" && (
        <section className="max-w-5xl mx-auto mt-6">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-2xl border shadow-sm bg-white p-4 md:p-6 grid md:grid-cols-2 gap-3"
          >
            <h2 className="font-semibold md:col-span-2">法人お問い合わせ</h2>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">会社名</label>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="株式会社〇〇" />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">ご担当者名</label>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="山田 太郎" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-600 mb-1">ご要件</label>
              <textarea className="w-full border rounded-lg px-3 py-2 h-28" placeholder="ご相談内容をご記入ください" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="button" className="px-4 py-2 rounded-xl bg-black text-white">
                送信（ダミー）
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 下部固定バー（小計などの将来スペース） */}
      <div
        style={{ height: BOTTOM_BAR_HEIGHT }}
        className="fixed left-0 right-0 bottom-0 z-30 bg-white/95 border-t backdrop-blur"
      >
        {/* ここに小計やカート導線を配置予定。ボタンは必ず type="button" にしてください。 */}
      </div>
    </div>
  );
}
