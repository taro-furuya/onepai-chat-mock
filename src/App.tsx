import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================
   0) 型・ヘルパー
   ========================= */
type View = "shop" | "guidelines" | "corporate";
type Flow = "original_single" | "fullset" | "regular";
type Layout = "vertical" | "horizontal";
type VariantKey = "standard" | "mm30" | "default";
type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const splitChars = (s: string) => Array.from(s || "");
const ensureLen = (arr: ColorKey[], need: number): ColorKey[] => {
  const out = arr.slice();
  while (out.length < need) out.push("black");
  return out.slice(0, need);
};
const suitLabel = (s: "manzu" | "souzu" | "pinzu") =>
  s === "manzu" ? "萬子" : s === "souzu" ? "索子" : "筒子";

/* =========================
   1) ルーター（hash）
   ========================= */
function useHashView(defaultView: View = "shop") {
  const get = (): View => {
    if (typeof window === "undefined") return defaultView;
    const h = (window.location.hash || "").replace("#", "");
    return (["shop", "guidelines", "corporate"] as View[]).includes(h as View) ? (h as View) : defaultView;
  };
  const [view, setView] = useState<View>(get);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => setView(get());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const goto = (v: View) => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${v}`) window.location.hash = v;
    else setView(v);
  };
  return { view, goto };
}

/* =========================
   2) 価格・割引・配送
   ========================= */
const PRICING = {
  taxRate: 0.1,
  shipping: { flat: 390, freeOver: 5000 },
  products: {
    original_single: {
      variants: {
        standard: { label: "28mm 牌", priceIncl: 1980 },
        mm30: { label: "30mm 牌", priceIncl: 2700 },
      },
    },
    fullset: {
      variants: {
        standard: { label: "28mm 牌（フルセット）", priceIncl: 206700 },
        mm30: { label: "30mm 牌（フルセット）", priceIncl: 206700 },
      },
    },
    regular: { variants: { default: { label: "28mm 牌（通常）", priceIncl: 550 } } },
  },
  options: {
    keyholder: { priceIncl: 300 },
    design_submission_single: { priceIncl: 500 },
    design_submission_fullset: { priceIncl: 5000 },
    multi_color: { priceIncl: 200 },
    rainbow: { priceIncl: 800 },
    kiribako_4: { priceIncl: 1500 },
    bring_own_color_unit: { priceIncl: 200 }, // 持ち込みの追加色
  },
} as const;

const allocateProportionalDiscounts = (values: number[], rate: number) => {
  if (rate <= 0) return values.map(() => 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const target = Math.floor(total * rate);
  const floors = values.map((v) => Math.floor(v * rate));
  let remain = target - floors.reduce((a, b) => a + b, 0);
  const remainders = values.map((v, i) => ({ i, rem: v * rate - floors[i] }));
  remainders.sort((a, b) => b.rem - a.rem);
  const result = floors.slice();
  for (let k = 0; k < remainders.length && remain > 0; k++) {
    result[remainders[k].i] += 1;
    remain -= 1;
  }
  return result;
};

/* =========================
   3) カラー定義
   ========================= */
const COLORS: { key: ColorKey; label: string; css: string; isGradient?: boolean }[] = [
  { key: "black", label: "●ブラック", css: "#0a0a0a" },
  { key: "red", label: "●レッド", css: "#d10f1b" },
  { key: "blue", label: "●ブルー", css: "#1e5ad7" },
  { key: "green", label: "●グリーン", css: "#2e7d32" },
  { key: "pink", label: "●ピンク", css: "#e24a86" },
  {
    key: "rainbow",
    label: "●レインボー",
    css:
      "linear-gradient(180deg,#ff2a2a 0%,#ff7a00 16%,#ffd400 33%,#00d06c 50%,#00a0ff 66%,#7a3cff 83%,#b400ff 100%)",
    isGradient: true,
  },
];

/* =========================
   4) 小パーツ
   ========================= */
const Pill: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-2xl border text-sm ${active ? "bg-black text-white border-black" : "bg-white"}`}
  >
    {children}
  </button>
);

const ProductCard: React.FC<{
  title: string;
  subtitle?: string;
  description?: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ title, subtitle, description, onClick, active }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-2xl border p-4 shadow-sm hover:shadow transition ${
      active ? "ring-2 ring-black" : ""
    }`}
  >
    <div className="font-semibold">{title}</div>
    {subtitle && <div className="text-xs text-neutral-600 mt-0.5">{subtitle}</div>}
    {description && <div className="text-xs text-neutral-700 mt-2">{description}</div>}
  </button>
);

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

/* =========================
   5) 牌プレビュー
   ========================= */
const DEFAULT_TEXT = "麻雀";
const splitToLines = (chars: string[]): [string[], string[]] => {
  if (chars.length <= 4) return [chars, []];
  const first = chars.slice(0, Math.ceil(chars.length / 2));
  const second = chars.slice(Math.ceil(chars.length / 2));
  return [first, second]; // 右→左の順で描画
};

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

  const chars = useMemo(() => splitChars(text || DEFAULT_TEXT), [text]);
  const [lineR, lineL] = useMemo(() => splitToLines(chars), [chars]);

  const colorsFor = (line: string[]) => {
    const base = useUnifiedColor ? new Array(chars.length).fill(unifiedColor) : ensureLen(perCharColors, chars.length);
    if (line === lineR) return base.slice(0, line.length);
    return base.slice(lineR.length, lineR.length + line.length);
  };

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

/* =========================
   6) アプリ本体（ショップUI含む）
   ========================= */
export default function App() {
  const { view, goto } = useHashView("shop");

  // --- 共通UI状態 ---
  const [flow, setFlow] = useState<Flow>("original_single");
  const [originalSub, setOriginalSub] = useState<"single" | "fullset">("single");
  const [variant, setVariant] = useState<VariantKey>("standard");
  const [designType, setDesignType] = useState<"name_print" | "bring_own" | "commission">("name_print");

  // 通常牌
  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor" | "manzu" | "souzu" | "pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<"東" | "南" | "西" | "北" | "白" | "發" | "中">("東");

  // 数量 / カート
  type CartItem = {
    title: string;
    detail: string;
    priceIncl: number;
    flow: Flow;
    variant: VariantKey;
    qty: number;
  };
  const [qty, setQty] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ファイルアップロード（ダミー）
  const [uploadSummary, setUploadSummary] = useState("");
  const [imagePreviews, setImagePreviews] = useState<Array<{ src: string; name: string; type: "image" | "file" }>>([]);
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);

  // プレビュー状態
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [layout, setLayout] = useState<Layout>("vertical");
  const [useUnifiedColor, setUseUnifiedColor] = useState<boolean>(true);
  const [unifiedColor, setUnifiedColor] = useState<ColorKey>("black");
  const [perCharColors, setPerCharColors] = useState<ColorKey[]>([]);
  useEffect(() => {
    const len = splitChars(text).length;
    setPerCharColors((prev) => ensureLen(prev, len));
  }, [text]);

  // フローによる制御
  useEffect(() => {
    if (flow === "regular") {
      if (variant !== "default") setVariant("default");
    } else {
      if (variant === "default") setVariant("standard");
      if (flow === "fullset" && designType === "name_print") setDesignType("bring_own");
      setOriginalSub(flow === "fullset" ? "fullset" : "single");
    }
  }, [flow, variant, designType]);

  const effectiveVariant = (f: Flow, v: VariantKey): VariantKey => (f === "regular" ? "default" : v === "default" ? "standard" : v);
  const safePrice = (f: Flow, v: VariantKey) => {
    const obj: any = PRICING.products[f as keyof typeof PRICING.products];
    const va = obj?.variants?.[v];
    return typeof va?.priceIncl === "number" ? va.priceIncl : 0;
  };

  // 見積（行）
  const isFull = flow === "fullset";
  const isSingle = flow === "original_single";
  const baseUnit = safePrice(flow, effectiveVariant(flow, variant));
  const auto = useMemo(() => {
    const chars = splitChars(text || "");
    const colors = ensureLen(perCharColors, chars.length);
    const uniqCount = useUnifiedColor ? 1 : new Set(colors).size;
    const hasRainbow = (useUnifiedColor ? [unifiedColor] : colors).includes("rainbow");
    const addColorCount = Math.max(0, uniqCount - 1);
    return { hasRainbow, addColorCount, colors, chars };
  }, [text, perCharColors, useUnifiedColor, unifiedColor]);

  const optionPrice = useMemo(() => {
    let op = 0;
    if (isSingle && designType === "bring_own") op += PRICING.options.design_submission_single.priceIncl;
    if (isFull && designType === "bring_own") op += PRICING.options.design_submission_fullset.priceIncl;
    if (designType === "bring_own") {
      const extra = Math.max(0, (bringOwnColorCount || 1) - 1);
      op += PRICING.options.bring_own_color_unit.priceIncl * extra;
    }
    if (isSingle && designType === "name_print") {
      if (auto.hasRainbow) op += PRICING.options.rainbow.priceIncl;
      else if (auto.addColorCount > 0) op += PRICING.options.multi_color.priceIncl * auto.addColorCount;
    }
    return op;
  }, [designType, isSingle, isFull, auto, bringOwnColorCount]);

  const lineTotal = baseUnit * Math.max(1, qty) + optionPrice;

  // カート割引
  const calcCartDiscount = (items: { flow: Flow; qty: number; priceIncl: number }[]) => {
    const count = { original_single: 0, fullset: 0 } as Record<"original_single" | "fullset", number>;
    let subtotal = 0;
    items.forEach((it) => {
      subtotal += it.priceIncl;
      if (it.flow === "original_single") count.original_single += it.qty;
      if (it.flow === "fullset") count.fullset += it.qty;
    });
    const rateSingle = count.original_single >= 10 ? 0.15 : count.original_single >= 5 ? 0.1 : 0;
    const rateFull = count.fullset >= 5 ? 0.2 : 0;
    const singleSub = items.filter((it) => it.flow === "original_single").reduce((s, it) => s + it.priceIncl, 0);
    const fullSub = items.filter((it) => it.flow === "fullset").reduce((s, it) => s + it.priceIncl, 0);
    const discount = Math.floor(singleSub * rateSingle) + Math.floor(fullSub * rateFull);
    return { discount, subtotal, rateSingle, rateFull };
  };

  const perItemDiscounts = (items: CartItem[]) => {
    const { rateSingle, rateFull } = calcCartDiscount(items);
    const singles = items.map((it, idx) => ({ idx, it })).filter(({ it }) => it.flow === "original_single");
    const fullsets = items.map((it, idx) => ({ idx, it })).filter(({ it }) => it.flow === "fullset");
    const singleVals = singles.map(({ it }) => it.priceIncl);
    const fullVals = fullsets.map(({ it }) => it.priceIncl);
    const singleAlloc = allocateProportionalDiscounts(singleVals, rateSingle);
    const fullAlloc = allocateProportionalDiscounts(fullVals, rateFull);
    const map = items.map(() => 0);
    singles.forEach((row, i) => (map[row.idx] = singleAlloc[i] || 0));
    fullsets.forEach((row, i) => (map[row.idx] = fullAlloc[i] || 0));
    return map;
  };

  // UI refs
  const selectRef = useRef<HTMLDivElement | null>(null);
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

  // ファイル選択
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ALLOWED = ["jpg", "jpeg", "png", "psd", "ai", "tiff", "tif", "heic", "pdf"];
    const filesAll = Array.from(e.target.files || []);
    const files = filesAll.filter((f) => ALLOWED.includes((f.name.split(".").pop() || "").toLowerCase()));
    const previews: Array<{ src: string; name: string; type: "image" | "file" }> = [];
    files.forEach((f) => {
      if (f.type.startsWith("image/") && f.type !== "image/heic") {
        previews.push({ src: URL.createObjectURL(f), name: f.name, type: "image" });
      } else {
        previews.push({ src: "", name: f.name, type: "file" });
      }
    });
    setImagePreviews(previews);
    if (files.length === 0) {
      setUploadSummary("対応形式のファイルが選択されていません。");
      return;
    }
    const names = files.map((f) => f.name).slice(0, 5);
    setUploadSummary(`${files.length} ファイルを読み込みました\n${names.join("\n")}${files.length > 5 ? "\n…" : ""}`);
  };

  // 商品タイトル
  const productTitle = useMemo(() => {
    const effVariant = effectiveVariant(flow, variant);
    if (flow === "original_single") return `オリジナル麻雀牌（${effVariant === "standard" ? "28mm" : "30mm"}）`;
    if (flow === "fullset") return `オリジナル麻雀牌（フルセット／${effVariant === "standard" ? "28mm" : "30mm"}）`;
    const tile = regularSuit === "honor" ? regularHonor : `${regularNumber}${suitLabel(regularSuit)}`;
    const back = regularBack === "yellow" ? "黄色" : "青色";
    return `通常牌（28mm／背面:${back}／${tile}）`;
  }, [flow, variant, regularBack, regularSuit, regularNumber, regularHonor]);

  // 行の詳細
  const buildLineDetail = (args: {
    designType: "name_print" | "bring_own" | "commission";
    text: string;
    layout: "vertical" | "horizontal";
    colors: ColorKey[];
    qty: number;
    bringOwnColorCount: number;
    regularBack?: "yellow" | "blue";
    regularTile?: string;
  }) => {
    const { designType, text, layout, colors, qty, bringOwnColorCount, regularBack, regularTile } = args;
    const parts: string[] = [];
    parts.push(`数量: ${qty}`);
    const isRegular = !!regularBack;
    if (!isRegular) {
      if (designType === "name_print") {
        parts.push(`デザイン: 名前入れ（${layout === "vertical" ? "縦" : "横"}）`);
        if (text) parts.push(`文字: ${text}`);
        if (colors && colors.length) {
          const colorLabel = colors
            .map((c) => (c === "rainbow" ? "レインボー" : c === "black" ? "黒" : c === "red" ? "赤" : c === "blue" ? "青" : c === "green" ? "緑" : "ピンク"))
            .join(" / ");
          parts.push(`色: ${colorLabel}`);
        }
      } else if (designType === "bring_own") {
        parts.push("デザイン: 持ち込み");
        parts.push(`色数: ${Math.max(1, bringOwnColorCount)}色`);
      } else if (designType === "commission") {
        parts.push("デザイン: 依頼（デザイン料は別途お見積り）");
      }
    }
    if (regularBack) parts.push(`背面: ${regularBack === "yellow" ? "黄色" : "青色"}`);
    if (regularTile) parts.push(`牌: ${regularTile}`);
    return parts.join("\n");
  };

  // カート操作
  const handleAddToCart = () => {
    const detail = buildLineDetail({
      designType,
      text: flow === "regular" ? "" : text,
      layout,
      colors: flow === "regular" ? [] : ensureLen(useUnifiedColor ? [unifiedColor] : perCharColors, splitChars(text).length),
      qty,
      bringOwnColorCount,
      regularBack: flow === "regular" ? regularBack : undefined,
      regularTile:
        flow === "regular"
          ? regularSuit === "honor"
            ? (regularHonor as string)
            : `${regularNumber}${suitLabel(regularSuit)}`
          : undefined,
    });
    const item: CartItem = {
      title: productTitle,
      detail,
      priceIncl: lineTotal,
      flow,
      variant: effectiveVariant(flow, variant),
      qty,
    };
    setCartItems((prev) => [...prev, item]);
  };

  const handleCheckout = () => {
    const { discount } = calcCartDiscount(cartItems);
    const discountedSubtotal = Math.max(0, cartItems.reduce((s, it) => s + it.priceIncl, 0) - discount);
    const shipping = discountedSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
    const total = discountedSubtotal + shipping;
    const mockUrl = `https://checkout.shopify.com/mock?subtotal=${discountedSubtotal}&discount=${discount}&shipping=${shipping}&total=${total}`;
    if (typeof window !== "undefined") window.open(mockUrl, "_blank");
  };

  const [acc28Open, setAcc28Open] = useState(true);
  const [acc30Open, setAcc30Open] = useState(false);

  const BOTTOM_BAR_HEIGHT = 72;

  return (
    <div className="bg-neutral-50" style={{ minHeight: "100dvh", paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="font-semibold">one牌</div>
          <nav className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className={`px-3 py-1 rounded ${view === "shop" ? "bg-black text-white" : "border"}`}
              onClick={() => goto("shop")}
            >
              ショップ
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${view === "guidelines" ? "bg-black text-white" : "border"}`}
              onClick={() => goto("guidelines")}
            >
              入稿規定
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${view === "corporate" ? "bg-black text-white" : "border"}`}
              onClick={() => goto("corporate")}
            >
              法人お問い合わせ
            </button>
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      {view === "shop" && (
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

      {/* ショップ */}
      {view === "shop" && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          {/* 1. カテゴリ選択 */}
          <div ref={selectRef} className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
            <h2 className="font-semibold mb-3">1. カテゴリを選択</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ProductCard
                title="オリジナル麻雀牌"
                subtitle="28mm / 30mm"
                description="あなただけのオリジナル牌が作成できます。アクセサリーやギフトにおすすめ！"
                onClick={() => setFlow(originalSub === "fullset" ? "fullset" : "original_single")}
                active={flow !== "regular"}
              />
              <ProductCard
                title="通常牌（バラ売り）"
                subtitle="28mm"
                description="通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！"
                onClick={() => setFlow("regular")}
                active={flow === "regular"}
              />
            </div>
            {flow !== "regular" && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  <Pill
                    active={originalSub === "single"}
                    onClick={() => {
                      setOriginalSub("single");
                      setFlow("original_single");
                    }}
                  >
                    1つから
                  </Pill>
                  <Pill
                    active={originalSub === "fullset"}
                    onClick={() => {
                      setOriginalSub("fullset");
                      setFlow("fullset");
                    }}
                  >
                    フルセット
                  </Pill>
                </div>
              </div>
            )}

            {/* 注釈：選択時のみ切替／注意と割引を差別化 */}
            <div className="mt-3 text-xs text-neutral-700 space-y-1">
              {flow === "original_single" && (
                <>
                  <div className="font-semibold">発送目安</div>
                  <div>・「1つから」の発送目安：<b>約2〜3週間</b></div>
                </>
              )}
              {flow === "fullset" && (
                <>
                  <div className="font-semibold">発送目安</div>
                  <div>・フルセットの発送目安：<b>約3ヶ月</b>（<u>デザイン開発期間を除く</u>）</div>
                </>
              )}
              {(flow === "original_single" || flow === "fullset") && (
                <div className="text-neutral-500">※ 数量や受注状況によって前後します。</div>
              )}
              <div className="pt-2 border-t">
                <div className="font-semibold">割引情報</div>
                <div>・単品：<b>5個で10%</b> / <b>10個で15%</b></div>
                <div>・フルセット：<b>5セットで20%</b></div>
              </div>
            </div>
          </div>

          {/* 2. デザイン確認 or 通常牌 */}
          {flow === "regular" ? (
            <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
              <h2 className="font-semibold mb-3">2. 背面色と牌の選択（通常牌）</h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <label className="w-20">背面色</label>
                <Pill active={regularBack === "yellow"} onClick={() => setRegularBack("yellow")}>
                  黄色
                </Pill>
                <Pill active={regularBack === "blue"} onClick={() => setRegularBack("blue")}>
                  青色
                </Pill>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="w-20">種別</label>
                <Pill active={regularSuit === "honor"} onClick={() => setRegularSuit("honor")}>
                  字牌
                </Pill>
                <Pill active={regularSuit === "manzu"} onClick={() => setRegularSuit("manzu")}>
                  萬子
                </Pill>
                <Pill active={regularSuit === "souzu"} onClick={() => setRegularSuit("souzu")}>
                  索子
                </Pill>
                <Pill active={regularSuit === "pinzu"} onClick={() => setRegularSuit("pinzu")}>
                  筒子
                </Pill>
              </div>
              {regularSuit === "honor" ? (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <label className="w-20">字牌</label>
                  {(["東", "南", "西", "北", "白", "發", "中"] as const).map((h) => (
                    <Pill key={h} active={regularHonor === h} onClick={() => setRegularHonor(h)}>
                      {h}
                    </Pill>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <label className="w-20">数字</label>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Pill key={i + 1} active={regularNumber === i + 1} onClick={() => setRegularNumber(i + 1)}>
                      {i + 1}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
              <h2 className="font-semibold mb-3">2. デザイン確認</h2>
              <div className="flex flex-wrap gap-2">
                <Pill active={designType === "name_print"} onClick={() => setDesignType("name_print")}>
                  名前入れ
                </Pill>
                <Pill active={designType === "bring_own"} onClick={() => setDesignType("bring_own")}>
                  デザイン持ち込み
                </Pill>
                <Pill active={designType === "commission"} onClick={() => setDesignType("commission")}>
                  デザイン依頼
                </Pill>
              </div>

              {designType === "bring_own" && (
                <div className="mt-3 p-3 border rounded-xl bg-neutral-50">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium mb-2">ファイル選択（複数可）</div>
                      <label className="inline-block px-4 py-2 rounded-xl bg-black text-white cursor-pointer shadow">
                        ファイルを選択
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf,.psd,.ai,.tiff,.tif,.heic"
                          onChange={onFilesSelected}
                          className="hidden"
                        />
                      </label>
                      {uploadSummary && (
                        <div className="text-xs text-neutral-700 mt-2 whitespace-pre-line">{uploadSummary}</div>
                      )}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                          {imagePreviews.map((p, i) => (
                            <div key={i} className="relative text-center text-xs">
                              {p.type === "image" ? (
                                <img src={p.src} alt={p.name} className="w-full h-24 object-cover rounded border" />
                              ) : (
                                <div className="w-full h-24 flex items-center justify-center border rounded bg-neutral-100 text-neutral-600">
                                  {p.name.split(".").pop()?.toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm">色数</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          value={bringOwnColorCount}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setBringOwnColorCount(Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1);
                          }}
                          className="border rounded px-3 py-2 w-28"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <span className="text-xs text-neutral-600">※ 追加1色ごとに+¥200（持ち込み時）</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {designType === "commission" && (
                <p className="text-xs text-neutral-600 mt-2">※デザイン料は別途お見積りとなります。</p>
              )}
            </div>
          )}

          {/* 3. サイズ選択（オリジナルのみ） */}
          {(flow === "original_single" || flow === "fullset") && (
            <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
              <h2 className="font-semibold mb-3">3. サイズ選択</h2>
              <div className="flex gap-2">
                <Pill active={effectiveVariant(flow, variant) === "standard"} onClick={() => setVariant("standard")}>
                  28mm
                </Pill>
                <Pill active={effectiveVariant(flow, variant) === "mm30"} onClick={() => setVariant("mm30")}>
                  30mm
                </Pill>
              </div>

              {/* アコーディオン：28mm */}
              {effectiveVariant(flow, variant) === "standard" && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setAcc28Open((v) => !v)}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="font-semibold text-sm">対応機種（28mm）</span>
                    <span className="text-xs text-neutral-600">{acc28Open ? "閉じる" : "開く"}</span>
                  </button>
                  {acc28Open && (
                    <ul className="list-disc ml-6 mt-2 text-sm text-neutral-700 space-y-1">
                      <li>AMOS REXX</li>
                      <li>AMOS REXX2</li>
                      <li>AMOSアルティマ</li>
                      <li>AMOSセヴィア</li>
                      <li>AMOSセヴィアHD</li>
                      <li>AMOSヴィエラ</li>
                      <li>AMOSシャルム</li>
                      <li>AMOSジョイ</li>
                      <li>AMOSキューブ</li>
                      <li>AMOSキューブHD</li>
                      <li>ニンジャB4 HD</li>
                      <li>ニンジャB4 STANDARD</li>
                      <li className="text-red-600">※ AMOS REXX3 は使用不可</li>
                    </ul>
                  )}
                </div>
              )}

              {/* アコーディオン：30mm */}
              {effectiveVariant(flow, variant) === "mm30" && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setAcc30Open((v) => !v)}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="font-semibold text-sm">対応機種（30mm）</span>
                    <span className="text-xs text-neutral-600">{acc30Open ? "閉じる" : "開く"}</span>
                  </button>
                  {acc30Open && (
                    <ul className="list-disc ml-6 mt-2 text-sm text-neutral-700 space-y-1">
                      <li>AMOS JP2</li>
                      <li>AMOS JPEX</li>
                      <li>AMOS JPCOLOR</li>
                      <li>AMOS JPDG</li>
                      <li className="text-neutral-500">※ 上記を含むJPシリーズに対応</li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. プレビュー（入力付き） */}
          {flow !== "regular" && designType === "name_print" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 入力 */}
              <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
                <h2 className="font-semibold mb-4">4. 名前入れ情報</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">文字</label>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="例）麻雀好き"
                    />
                    <p className="text-xs text-neutral-500 mt-1">全角4文字超で自動的に2行（右→左）になります。</p>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">レイアウト</label>
                    <div className="flex gap-2">
                      <Pill active={layout === "vertical"} onClick={() => setLayout("vertical")}>
                        縦
                      </Pill>
                      <Pill active={layout === "horizontal"} onClick={() => setLayout("horizontal")}>
                        横
                      </Pill>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-600 mb-2">色の指定</label>
                    <div className="flex gap-2 mb-3">
                      <Pill active={useUnifiedColor} onClick={() => setUseUnifiedColor(true)}>
                        一括指定
                      </Pill>
                      <Pill active={!useUnifiedColor} onClick={() => setUseUnifiedColor(false)}>
                        1文字ずつ指定
                      </Pill>
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
                        {splitChars(text).map((ch, i) => (
                          <div key={`${ch}-${i}`} className="flex items-center gap-3">
                            <div className="w-6 text-right font-medium">{ch}</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                              {COLORS.map((c) => (
                                <DotLabel
                                  key={c.key}
                                  color={c.css}
                                  text={c.label}
                                  active={(perCharColors[i] || "black") === c.key}
                                  onClick={() =>
                                    setPerCharColors((prev) => {
                                      const next = ensureLen(prev, splitChars(text).length);
                                      next[i] = c.key;
                                      return next;
                                    })
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">数量</label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setQty(Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1);
                      }}
                      className="border rounded px-3 py-2 w-28"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-4 py-2 rounded-xl bg-black text-white"
                    >
                      カートに追加（¥{fmt(lineTotal)}）
                    </button>
                  </div>
                </div>
              </div>

              {/* プレビュー */}
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
            </div>
          )}
        </section>
      )}

      {/* 入稿規定 */}
      {view === "guidelines" && (
        <section className="max-w-5xl mx-auto mt-6">
          <div className="rounded-2xl border shadow-sm bg-white p-6">
            <h2 className="font-semibold mb-3">入稿規定</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
              <li>推奨形式：AI / PDF（アウトライン化）/ PSD / PNG・JPG（解像度300dpi以上）</li>
              <li>デザインデータは白黒二値化したものをご用意ください。</li>
              <li>細線や細かいディテールは潰れる可能性があります。</li>
            </ul>
            <h3 className="font-semibold mt-4 mb-1">著作権・各種権利</h3>
            <p className="text-sm text-neutral-700">
              ご入稿デザインは第三者の権利を侵害しないものとして取り扱います。権利者と争いが生じた場合も当社は責任を負いません。
            </p>
          </div>
        </section>
      )}

      {/* 法人問い合わせ */}
      {view === "corporate" && (
        <section className="max-w-5xl mx-auto mt-6">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-2xl border shadow-sm bg-white p-4 md:p-6 grid md:grid-cols-2 gap-3"
          >
            <h2 className="font-semibold md:col-span-2">法人向けお問い合わせ</h2>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">会社名</label>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="株式会社〇〇" />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">ご担当者名</label>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="山田 太郎" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-600 mb-1">メールアドレス</label>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="example@example.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-600 mb-1">お問い合わせ内容</label>
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

      {/* 固定下部バー：割引／送料込みの小計 */}
      <div className="fixed left-0 right-0 bottom-0 z-30 bg-white/95 border-t backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-[72px] flex items-center justify-between gap-3">
          <div className="text-sm">
            {(() => {
              if (cartItems.length === 0) return <span className="text-neutral-500">カートは空です</span>;
              const per = perItemDiscounts(cartItems);
              const discount = per.reduce((a, b) => a + b, 0);
              const subtotal = cartItems.reduce((s, it) => s + it.priceIncl, 0);
              const discounted = Math.max(0, subtotal - discount);
              const shipping = discounted >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
              const total = discounted + shipping;
              return (
                <div className="space-x-3">
                  <span>小計: ¥{fmt(subtotal)}</span>
                  <span>割引: -¥{fmt(discount)}</span>
                  <span>送料: ¥{fmt(shipping)}</span>
                  <span className="font-semibold">お支払い合計: ¥{fmt(total)}</span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
              className={`px-4 py-2 rounded-xl ${cartItems.length === 0 ? "bg-neutral-200 text-neutral-500" : "bg-black text-white"}`}
            >
              レジに進む
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
