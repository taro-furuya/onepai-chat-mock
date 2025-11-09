import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import Accordion from "../components/Accordion";
import NameTilePreview, { ColorKey } from "../components/NameTilePreview";
import RegularTilePreview from "../components/RegularTilePreview";

/* ---------- utils ---------- */
const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const PALETTE: ColorKey[] = ["black", "red", "blue", "green", "pink", "rainbow"];
const ensureLen = (arr: ColorKey[], len: number) => {
  const out = arr.slice();
  while (out.length < len) out.push("black");
  return out.slice(0, len);
};
const getColorLabel = (c: ColorKey) =>
  c === "rainbow" ? "レインボー" : c === "black" ? "黒" : c === "red" ? "赤" : c === "blue" ? "青" : c === "green" ? "緑" : "ピンク";
const suitLabel = (s: "manzu" | "souzu" | "pinzu") => (s === "manzu" ? "萬子" : s === "souzu" ? "索子" : "筒子");
const HONORS = ["東", "南", "西", "北", "白", "發", "中"] as const;

/* ---------- pricing ---------- */
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
    bring_own_color_unit: { priceIncl: 200 },
  },
} as const;

type Flow = "original_single" | "fullset" | "regular";
type VariantKey = "standard" | "mm30" | "default";

/* ---------- helpers ---------- */
const bringOwnColorLine = (_f: Flow, count: number) => `色数: ${Math.max(1, count || 1)}色`;
const effectiveVariant = (f: Flow, v: VariantKey): VariantKey => (f === "regular" ? "default" : v === "default" ? "standard" : v);
const safePrice = (f: Flow, v: VariantKey) => {
  // @ts-ignore
  const va = PRICING.products[f]?.variants?.[v];
  return typeof va?.priceIncl === "number" ? va.priceIncl : 0;
};
const allocateProportionalDiscounts = (values: number[], rate: number) => {
  if (rate <= 0) return values.map(() => 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const target = Math.floor(total * rate);
  const floors = values.map((v) => Math.floor(v * rate));
  let remain = target - floors.reduce((a, b) => a + b, 0);
  const rems = values.map((v, i) => ({ i, r: v * rate - floors[i] })).sort((a, b) => b.r - a.r);
  const res = floors.slice();
  for (let k = 0; k < rems.length && remain > 0; k++) {
    res[rems[k].i] += 1;
    remain--;
  }
  return res;
};

/* ---------- view ---------- */
export default function Shop() {
  /* layout refs */
  const selectRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollToSelect = () => {
    const container = scrollRef.current, target = selectRef.current;
    if (!container || !target) return;
    const crect = container.getBoundingClientRect();
    const trect = target.getBoundingClientRect();
    container.scrollTo({ top: container.scrollTop + (trect.top - crect.top) - 16, behavior: "smooth" });
  };

  /* states */
  const [activeView, setActiveView] = useState<"shop" | "guidelines" | "corporate">("shop");
  const [flow, setFlow] = useState<Flow>("original_single");
  const [variant, setVariant] = useState<VariantKey>("standard");
  const [designType, setDesignType] = useState<"name_print" | "bring_own" | "commission">("name_print");
  const [originalSub, setOriginalSub] = useState<"single" | "fullset">("single");

  const FONT_OPTIONS = [
    {
      key: "manzu",
      label: "萬子風（TA風雅筆）",
      stack:
        'ta-fuga-fude, "TA風雅筆", "TA-Fugafude", YuKyokasho, "Hiragino Mincho ProN", "Yu Mincho", serif',
    },
    { key: "gothic", label: "ゴシック", stack: 'system-ui, -apple-system, "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif' },
    { key: "mincho", label: "明朝", stack: '"Yu Mincho", "Hiragino Mincho ProN", serif' },
    { key: "gyosho", label: "行書体", stack: '"HG行書体", "HGP行書体", "Klee One", YuKyokasho, cursive' },
  ] as const;
  type FontKey = (typeof FONT_OPTIONS)[number]["key"];
  const [fontKey, setFontKey] = useState<FontKey>("manzu");

  const [text, setText] = useState("一刀");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [colorsPerChar, setColorsPerChar] = useState<ColorKey[]>(["black", "red"]);
  const [usePerChar, setUsePerChar] = useState(true);
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);

  const [keyholder, setKeyholder] = useState(false);
  const [kiribako4, setKiribako4] = useState(false);
  const [uploads, setUploads] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Array<{ src: string; name: string; type: "image" | "file" }>>([]);
  const [uploadSummary, setUploadSummary] = useState("");
  const [note, setNote] = useState("");

  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor" | "manzu" | "souzu" | "pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<(typeof HONORS)[number]>("東");

  const [qty, setQty] = useState(1);
  type CartItem = {
    title: string;
    detail: string;
    priceIncl: number;
    flow: Flow;
    variant: VariantKey;
    qty: number;
  };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  /* effects: guards */
  useEffect(() => {
    if (flow === "regular") {
      if (variant !== "default") setVariant("default");
    } else {
      if (variant === "default") setVariant("standard");
      if (flow === "fullset" && designType === "name_print") setDesignType("bring_own");
      setOriginalSub(flow === "fullset" ? "fullset" : "single");
    }
  }, [flow, variant, designType]);

  /* file accept */
  const ACCEPT = [
    "image/*",
    "application/pdf",
    ".psd",
    ".ai",
    ".tiff",
    ".tif",
    ".heic",
    ".jpg",
    ".jpeg",
    ".png",
  ].join(",");

  /* derived */
  const auto = useMemo(() => {
    const chars = Array.from(text || "");
    const colors = ensureLen(colorsPerChar, chars.length);
    const uniqCount = new Set(colors).size;
    const hasRainbow = colors.includes("rainbow");
    const addColorCount = Math.max(0, uniqCount - 1);
    return { hasRainbow, addColorCount, colors, chars };
  }, [text, colorsPerChar]);

  const estimate = useMemo(() => {
    const p = PRICING;
    const effVariant = effectiveVariant(flow, variant);
    const baseUnit = safePrice(flow, effVariant);
    const base = baseUnit * Math.max(1, qty);
    let option = 0;
    const ws: string[] = [];
    const optionItems: { label: string; price: number }[] = [];
    const isFull = flow === "fullset";
    const isSingle = flow === "original_single";

    // デザイン料
    if (isSingle && designType === "bring_own") {
      option += p.options.design_submission_single.priceIncl;
      optionItems.push({ label: "デザイン持ち込み", price: p.options.design_submission_single.priceIncl });
    }
    if (isFull && designType === "bring_own") {
      option += p.options.design_submission_fullset.priceIncl;
      optionItems.push({ label: "デザイン持ち込み（フルセット）", price: p.options.design_submission_fullset.priceIncl });
    }

    // 持ち込み色数
    if (designType === "bring_own") {
      const extra = Math.max(0, (bringOwnColorCount || 1) - 1);
      if (extra > 0) {
        const add = p.options.bring_own_color_unit.priceIncl * extra;
        option += add;
        optionItems.push({ label: `持ち込み色数（追加${extra}色）`, price: add });
      }
    }

    // 名前入れ色
    if (isSingle && designType === "name_print") {
      if (auto.hasRainbow) {
        option += p.options.rainbow.priceIncl;
        optionItems.push({ label: "レインボー", price: p.options.rainbow.priceIncl });
      } else if (auto.addColorCount > 0) {
        const add = p.options.multi_color.priceIncl * auto.addColorCount;
        option += add;
        optionItems.push({ label: `複数色（追加${auto.addColorCount}色）`, price: add });
      }
    }

    // 桐箱
    if (!isFull && kiribako4) {
      const applicable = (flow === "original_single" && effVariant === "standard") || flow === "regular";
      if (!applicable) ws.push("桐箱は28mm単品/通常牌のみ対応");
      else {
        option += p.options.kiribako_4.priceIncl;
        optionItems.push({ label: "桐箱（4枚用）", price: p.options.kiribako_4.priceIncl });
      }
    }

    // キーホルダー
    if (!isFull && keyholder) {
      option += PRICING.options.keyholder.priceIncl;
      optionItems.push({ label: "キーホルダー", price: PRICING.options.keyholder.priceIncl });
    }

    const merchandiseTotal = base + option;
    const shipping = merchandiseTotal >= p.shipping.freeOver ? 0 : p.shipping.flat;
    const total = merchandiseTotal + shipping;

    return { base, option, shipping, total, warnings: ws, optionItems };
  }, [flow, variant, qty, keyholder, designType, kiribako4, auto, bringOwnColorCount]);

  const productTitle = useMemo(() => {
    const effVariant = effectiveVariant(flow, variant);
    if (flow === "original_single") return `オリジナル麻雀牌（${effVariant === "standard" ? "28mm" : "30mm"}）`;
    if (flow === "fullset") return `オリジナル麻雀牌（フルセット／${effVariant === "standard" ? "28mm" : "30mm"}）`;
    const tile = regularSuit === "honor" ? regularHonor : `${regularNumber}${suitLabel(regularSuit)}`;
    const back = regularBack === "yellow" ? "黄色" : "青色";
    return `通常牌（28mm／背面:${back}／${tile}）`;
  }, [flow, variant, regularBack, regularSuit, regularNumber, regularHonor]);

  const buildLineDetail = ({
    designType,
    text,
    layout,
    colors,
    keyholder,
    kiribako4,
    qty,
    regularBack,
    regularTile,
    note,
  }: {
    designType: "name_print" | "bring_own" | "commission";
    text: string;
    layout: "vertical" | "horizontal";
    colors: ColorKey[];
    keyholder: boolean;
    kiribako4: boolean;
    qty: number;
    regularBack?: "yellow" | "blue";
    regularTile?: string;
    note?: string;
  }) => {
    const parts: string[] = [];
    parts.push(`数量: ${qty}`);
    const isRegular = !!regularBack;
    if (!isRegular) {
      if (designType === "name_print") {
        parts.push(`デザイン: 名前入れ（${layout === "vertical" ? "縦" : "横"}）`);
        if (text) parts.push(`文字: ${text}`);
        if (colors && colors.length) parts.push(`色: ${colors.map((c) => getColorLabel(c)).join(" / ")}`);
      } else if (designType === "bring_own") {
        parts.push("デザイン: 持ち込み");
        parts.push(bringOwnColorLine(flow, bringOwnColorCount));
      } else {
        parts.push("デザイン: 依頼（デザイン料は別途お見積り）");
      }
    }
    if (regularBack) parts.push(`背面: ${regularBack === "yellow" ? "黄色" : "青色"}`);
    if (regularTile) parts.push(`牌: ${regularTile}`);
    const opt: string[] = [];
    if (keyholder && flow !== "fullset") opt.push("キーホルダー（¥300）");
    if (kiribako4 && flow !== "fullset") opt.push("桐箱（4枚用/¥1,500）");
    if (opt.length) parts.push(`オプション: ${opt.join(" / ")}`);
    if (note && note.trim()) parts.push(`備考: ${note.trim()}`);
    return parts.join("\n");
  };

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

    const singleSub = items.filter((i) => i.flow === "original_single").reduce((s, i) => s + i.priceIncl, 0);
    const fullSub = items.filter((i) => i.flow === "fullset").reduce((s, i) => s + i.priceIncl, 0);
    const discount = Math.floor(singleSub * rateSingle) + Math.floor(fullSub * rateFull);
    const notes = [rateSingle > 0 ? `オリジナル麻雀牌${Math.round(rateSingle * 100)}%` : "", rateFull > 0 ? `フルセット${Math.round(rateFull * 100)}%` : ""].filter(Boolean).join("／");

    return { discountTotal: discount, discountedSubtotal: Math.max(0, subtotal - discount), notes, rateSingle, rateFull };
  };

  const perItemDiscounts = (items: CartItem[]) => {
    const { rateSingle, rateFull } = calcCartDiscount(items);
    const singles = items.map((it, idx) => ({ idx, it })).filter(({ it }) => it.flow === "original_single");
    const fullsets = items.map((it, idx) => ({ idx, it })).filter(({ it }) => it.flow === "fullset");
    const singleAlloc = allocateProportionalDiscounts(singles.map(({ it }) => it.priceIncl), rateSingle);
    const fullAlloc = allocateProportionalDiscounts(fullsets.map(({ it }) => it.priceIncl), rateFull);
    const map = items.map(() => 0);
    singles.forEach((row, i) => (map[row.idx] = singleAlloc[i] || 0));
    fullsets.forEach((row, i) => (map[row.idx] = fullAlloc[i] || 0));
    return map;
  };

  /* handlers */
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ALLOWED = ["jpg", "jpeg", "png", "psd", "ai", "tiff", "tif", "heic", "pdf"];
    const filesAll = Array.from(e.target.files || []);
    const files = filesAll.filter((f) => ALLOWED.includes((f.name.split(".").pop() || "").toLowerCase()));
    setUploads(files);
    const previews: Array<{ src: string; name: string; type: "image" | "file" }> = [];
    files.forEach((f) => {
      if (f.type.startsWith("image/") && f.type !== "image/heic") {
        previews.push({ src: URL.createObjectURL(f), name: f.name, type: "image" });
      } else {
        previews.push({ src: "", name: f.name, type: "file" });
      }
    });
    setImagePreviews(previews);
    if (files.length === 0) setUploadSummary("対応形式のファイルが選択されていません。");
    else setUploadSummary(`${files.length} ファイルを読み込みました\n${files.slice(0, 5).map((f) => f.name).join("\n")}${files.length > 5 ? "\n…" : ""}`);
  };

  const handleAddToCart = () => {
    setWarnings(estimate.warnings);
    const linePrice = estimate.base + estimate.option;
    const detail = buildLineDetail({
      designType,
      text: flow === "regular" ? "" : text,
      layout,
      colors: flow === "regular" ? [] : ensureLen(usePerChar ? colorsPerChar : [colorsPerChar[0]], text.length),
      keyholder,
      kiribako4,
      qty,
      regularBack: flow === "regular" ? regularBack : undefined,
      regularTile:
        flow === "regular"
          ? regularSuit === "honor"
            ? (regularHonor as string)
            : `${regularNumber}${suitLabel(regularSuit)}`
          : undefined,
      note,
    });

    const item: CartItem = { title: productTitle, detail, priceIncl: linePrice, flow, variant: effectiveVariant(flow, variant), qty };
    const next = [...cartItems, item];
    setCartItems(next);

    const { discountedSubtotal } = calcCartDiscount(next);
    const remain = Math.max(0, PRICING.shipping.freeOver - discountedSubtotal);
    setToast(remain > 0 ? `カートに追加しました。あと¥${fmt(remain)}で送料無料！` : "カートに追加しました。送料無料です！");
    setTimeout(() => setToast(null), 2500);
  };

  const handleCheckout = () => {
    const { discountTotal, discountedSubtotal } = calcCartDiscount(cartItems);
    const shipping = discountedSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
    const total = discountedSubtotal + shipping;
    const mockUrl = `https://checkout.shopify.com/mock?subtotal=${discountedSubtotal}&discount=${discountTotal}&shipping=${shipping}&total=${total}`;
    if (typeof window !== "undefined") window.open(mockUrl, "_blank");
  };

  /* derived (cart summary) */
  const { discountTotal, discountedSubtotal, notes } = calcCartDiscount(cartItems);
  const perDiscounts = perItemDiscounts(cartItems);
  const shippingFee = discountedSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const payable = discountedSubtotal + shippingFee;

  /* machines list */
  const machines28 = [
    "AMOS REXX",
    "AMOS REXX2",
    "AMOSアルティマ",
    "AMOSセヴィア",
    "AMOSセヴィアHD",
    "AMOSヴィエラ",
    "AMOSシャルム",
    "AMOSジョイ",
    "AMOSキューブ",
    "AMOSキューブHD",
    "ニンジャB4 HD",
    "ニンジャB4 STANDARD",
  ];
  const machines30 = ["AMOS JP2", "AMOS JPEX", "AMOS JPCOLOR", "AMOS JPDG"];

  /* render */
  return (
    <div ref={scrollRef} className="min-h-[100vh]">
      {/* Hero / Header inside App.tsx */}

      {/* 1. カテゴリ */}
      <Card title="1. カテゴリを選択">
        <div ref={selectRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFlow(originalSub === "fullset" ? "fullset" : "original_single")}
            className={`rounded-2xl border p-4 text-left ${flow !== "regular" ? "ring-1 ring-black" : ""}`}
          >
            <div className="font-semibold">オリジナル麻雀牌</div>
            <div className="text-xs text-neutral-600 mt-1">
              あなただけのオリジナル牌が作成できます。アクセサリーやギフトにおすすめ！
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFlow("regular")}
            className={`rounded-2xl border p-4 text-left ${flow === "regular" ? "ring-1 ring-black" : ""}`}
          >
            <div className="font-semibold">通常牌（バラ売り）</div>
            <div className="text-xs text-neutral-600 mt-1">
              通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！
            </div>
          </button>
        </div>

        {flow !== "regular" && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <Pill active={originalSub === "single"} onClick={() => { setOriginalSub("single"); setFlow("original_single"); }}>
                1つから
              </Pill>
              <Pill active={originalSub === "fullset"} onClick={() => { setOriginalSub("fullset"); setFlow("fullset"); }}>
                フルセット
              </Pill>
            </div>
          </div>
        )}

        {/* 注釈（選択時のみ表示 / 注意と割引の差別化） */}
        <div className="mt-3 text-xs space-y-1">
          {flow === "original_single" && (
            <>
              <div className="text-neutral-600">
                ※ <b>1つから</b>の発送目安：<b>約2〜3週間</b>（受注状況により前後）
              </div>
              <div className="text-neutral-900">
                <b>割引</b>：5個で10% / 10個で15%
              </div>
            </>
          )}
          {flow === "fullset" && (
            <>
              <div className="text-neutral-600">
                ※ <b>フルセット</b>の発送目安：<b>約3ヶ月</b>（デザイン開発期間を除く）
              </div>
              <div className="text-neutral-900">
                <b>割引</b>：5セットで20%
              </div>
            </>
          )}
        </div>

        <div className="mt-2 text-xs text-neutral-600">
          ※ すべて<b>税込み</b>です。
        </div>
      </Card>

      {/* 2. 分岐 */}
      {flow === "regular" ? (
        <Card title="2. 背面色と牌の選択（通常牌）">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="w-20">背面色</label>
            <Pill active={regularBack === "yellow"} onClick={() => setRegularBack("yellow")}>黄色</Pill>
            <Pill active={regularBack === "blue"} onClick={() => setRegularBack("blue")}>青色</Pill>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="w-20">種別</label>
            <Pill active={regularSuit === "honor"} onClick={() => setRegularSuit("honor")}>字牌</Pill>
            <Pill active={regularSuit === "manzu"} onClick={() => setRegularSuit("manzu")}>萬子</Pill>
            <Pill active={regularSuit === "souzu"} onClick={() => setRegularSuit("souzu")}>索子</Pill>
            <Pill active={regularSuit === "pinzu"} onClick={() => setRegularSuit("pinzu")}>筒子</Pill>
          </div>

          {regularSuit === "honor" ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className="w-20">字牌</label>
              {HONORS.map((h) => (
                <Pill key={h} active={regularHonor === h} onClick={() => setRegularHonor(h)}>{h}</Pill>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className="w-20">数字</label>
              {Array.from({ length: 9 }).map((_, i) => (
                <Pill key={i + 1} active={regularNumber === i + 1} onClick={() => setRegularNumber(i + 1)}>{i + 1}</Pill>
              ))}
            </div>
          )}

          <div className="mt-3">
            <RegularTilePreview suit={regularSuit} number={regularNumber} honor={regularHonor} back={regularBack} />
          </div>

          <div className="mt-2 text-xs text-neutral-600 space-y-1">
            <div>※ 他の牌と混同しないようにご注意下さい。不正行為は一切認められません。個人利用としてお楽しみください。</div>
            <div>※ 製造ロットの違い等により牌の色味が異なる可能性がございます。</div>
          </div>
        </Card>
      ) : (
        <Card title="2. デザイン確認">
          <div className="flex flex-wrap gap-2">
            {flow !== "fullset" && (
              <Pill active={designType === "name_print"} onClick={() => setDesignType("name_print")}>名前入れ</Pill>
            )}
            <Pill active={designType === "bring_own"} onClick={() => setDesignType("bring_own")}>デザイン持ち込み</Pill>
            <Pill active={designType === "commission"} onClick={() => setDesignType("commission")}>デザイン依頼</Pill>
          </div>

          {/* 名前入れ */}
          {designType === "name_print" && (
            <div className="grid md:grid-cols-2 gap-4 items-start mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-24">フォント</label>
                  <select value={fontKey} onChange={(e) => setFontKey(e.target.value as any)} className="border rounded px-3 py-2">
                    {FONT_OPTIONS.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="w-24">文字</label>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="border rounded px-3 py-2 w-60"
                    placeholder="縦4文字／横半角4×2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-24">レイアウト</label>
                  <Pill active={layout === "vertical"} onClick={() => setLayout("vertical")}>縦</Pill>
                  <Pill active={layout === "horizontal"} onClick={() => setLayout("horizontal")}>横</Pill>
                </div>

                {/* 色の指定 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="w-24">色の指定</label>
                    <Pill active={!usePerChar} onClick={() => setUsePerChar(false)}>単一色で進む</Pill>
                    <Pill active={usePerChar} onClick={() => setUsePerChar(true)}>1文字ずつ指定</Pill>
                  </div>

                  {usePerChar ? (
                    <div className="space-y-2">
                      <div className="text-xs text-neutral-600">各文字をタップして色を切り替えできます（黒→赤→青→緑→ピンク→レインボー）</div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(text || "").map((ch, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="px-2 py-1 rounded border"
                            style={{
                              color: {
                                black: "#0a0a0a", red: "#d10f1b", blue: "#1f57c3", green: "#0d7a3a", pink: "#e75480", rainbow: "#d10f1b",
                              }[ensureLen(colorsPerChar, text.length)[idx]],
                            }}
                            title={getColorLabel(ensureLen(colorsPerChar, text.length)[idx])}
                            onClick={() => {
                              const order = PALETTE;
                              const next = ensureLen(colorsPerChar, text.length);
                              const now = next[idx];
                              next[idx] = order[(order.indexOf(now) + 1) % order.length];
                              setColorsPerChar(next);
                            }}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-neutral-600">
                        文字の色: {Array.from(text || "").map((_, i) => getColorLabel(ensureLen(colorsPerChar, text.length)[i])).join(" / ")}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-neutral-600">単一色:</div>
                      {PALETTE.map((c) => (
                        <Pill
                          key={c}
                          active={ensureLen(colorsPerChar, 1)[0] === c}
                          onClick={() => setColorsPerChar([c])}
                        >
                          {getColorLabel(c)}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <NameTilePreview
                  text={text}
                  layout={layout}
                  fontStack={FONT_OPTIONS.find((f) => f.key === fontKey)?.stack || ""}
                  colors={usePerChar ? ensureLen(colorsPerChar, text.length) : Array.from(text || "").map(() => ensureLen(colorsPerChar, 1)[0])}
                />
              </div>
            </div>
          )}

          {/* 持ち込み */}
          {designType === "bring_own" && (
            <div className="mt-4 space-y-4">
              <div className="text-sm text-neutral-700">
                デザインファイルをアップロードしてください（複数可）。対応形式：{ACCEPT}
              </div>
              <input type="file" multiple accept={ACCEPT} onChange={onFilesSelected} className="block" />
              {uploadSummary && (<pre className="text-xs text-neutral-600 whitespace-pre-wrap bg-neutral-50 p-2 rounded border">{uploadSummary}</pre>)}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {imagePreviews.map((f, i) => (
                    <div key={i} className="border rounded p-2 text-xs">
                      {f.type === "image" ? (<img src={f.src} alt={f.name} className="w-full h-24 object-cover rounded" />) : (<div className="h-24 flex items-center justify-center bg-neutral-100 rounded">{f.name.split(".").pop()?.toUpperCase()} ファイル</div>)}
                      <div className="mt-1 truncate" title={f.name}>{f.name}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="w-36">色数（白黒含まず）</label>
                <input
                  type="number"
                  min={1}
                  value={bringOwnColorCount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBringOwnColorCount(Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1);
                  }}
                  className="border rounded px-3 py-2 w-24"
                />
                <span className="text-sm text-neutral-600">{bringOwnColorLine(flow, bringOwnColorCount)}</span>
              </div>

              {/* 機種アコーディオン（選択サイズに応じて） */}
              {effectiveVariant(flow, variant) === "standard" && (
                <Accordion title="対応機種（28mm）" openDefault>
                  <ul className="list-disc ml-5 space-y-1">
                    {machines28.map((m) => (<li key={m}>{m}</li>))}
                  </ul>
                  <div className="mt-1 text-red-600 text-xs">※ AMOS REXX3 は使用不可</div>
                </Accordion>
              )}
              {effectiveVariant(flow, variant) === "mm30" && (
                <Accordion title="対応機種（30mm）" openDefault>
                  <ul className="list-disc ml-5 space-y-1">
                    {machines30.map((m) => (<li key={m}>{m}</li>))}
                  </ul>
                  <p className="text-xs text-neutral-600 mt-1">※上記を含むJPシリーズに対応</p>
                </Accordion>
              )}

              <p className="text-xs text-neutral-600 mt-2">※ デザイン持ち込み料（{flow === "fullset" ? "¥5,000" : "¥500"}）は自動で加算されます。</p>
            </div>
          )}

          {designType === "commission" && (
            <div className="mt-4 text-sm text-neutral-700">
              デザインのご依頼内容を備考にお書きください。担当デザイナーよりご連絡いたします（デザイン料は別途お見積り）。
            </div>
          )}
        </Card>
      )}

      {/* 3. サイズ選択（オリジナル時のみ） */}
      {(flow === "original_single" || flow === "fullset") && (
        <Card title="3. サイズ選択">
          <div className="flex gap-2">
            <Pill active={effectiveVariant(flow, variant) === "standard"} onClick={() => setVariant("standard")}>28mm</Pill>
            <Pill active={effectiveVariant(flow, variant) === "mm30"} onClick={() => setVariant("mm30")}>30mm</Pill>
          </div>
        </Card>
      )}

      {/* 4. オプション・数量 */}
      <Card title="4. オプションと数量">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-24">キーホルダー</label>
            <input type="checkbox" checked={keyholder} onChange={(e) => setKeyholder(e.target.checked)} />
            <span className="text-sm text-neutral-700">+¥300（フルセット以外）</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-24">桐箱（4枚用）</label>
            <input type="checkbox" checked={kiribako4} onChange={(e) => setKiribako4(e.target.checked)} />
            <span className="text-sm text-neutral-700">+¥1,500（28mm単品/通常牌のみ）</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-24">数量</label>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="border rounded px-3 py-2 w-24" />
          </div>
          <div className="flex items-start gap-3">
            <label className="w-24">備考</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="border rounded px-3 py-2 w-full h-24" placeholder="ご希望など（任意）" />
          </div>
        </div>
      </Card>

      {/* 見積サマリー */}
      <Card title="見積サマリー" right={<div className="text-sm text-neutral-600">税込・送料計算済</div>}>
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            <div className="font-medium">{productTitle}</div>
            {estimate.optionItems.length > 0 && (
              <ul className="text-sm text-neutral-700 list-disc ml-5">
                {estimate.optionItems.map((o, i) => (<li key={i}>{o.label} +¥{fmt(o.price)}</li>))}
              </ul>
            )}
            <div className="text-sm">小計（商品）: ¥{fmt(estimate.base + estimate.option)} / 送料: ¥{fmt(estimate.shipping)}</div>
            <div className="text-lg font-semibold">
              お支払い目安: ¥{fmt(estimate.total)} <span className="text-sm text-neutral-500">（税込）</span>
            </div>
            {warnings.length > 0 && (<div className="text-xs text-red-600">{warnings.join(" / ")}</div>)}
            <div className="pt-2">
              <button type="button" onClick={handleAddToCart} className="px-4 py-2 rounded-xl bg-black text-white">カートに追加</button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {flow === "regular" ? (
              <RegularTilePreview suit={regularSuit} number={regularNumber} honor={regularHonor} back={regularBack} />
            ) : (
              <NameTilePreview
                text={text}
                layout={layout}
                fontStack={FONT_OPTIONS.find((f) => f.key === fontKey)?.stack || ""}
                colors={usePerChar ? ensureLen(colorsPerChar, text.length) : Array.from(text || "").map(() => ensureLen(colorsPerChar, 1)[0])}
              />
            )}
          </div>
        </div>
      </Card>

      {/* カート */}
      <Card title="カート">
        {cartItems.length === 0 ? (
          <div className="text-sm text-neutral-600">カートは空です。</div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((it, i) => (
              <div key={i} className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{it.title} × {it.qty}</div>
                  <div className="text-right">
                    <div>¥{fmt(it.priceIncl)}</div>
                    {perDiscounts[i] > 0 && (<div className="text-xs text-red-600">-¥{fmt(perDiscounts[i])}</div>)}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-neutral-600 mt-2">{it.detail}</pre>
              </div>
            ))}

            <div className="border-t pt-3 text-sm">
              <div className="flex justify-between"><span>小計</span><span>¥{fmt(cartItems.reduce((s, it) => s + it.priceIncl, 0))}</span></div>
              <div className="flex justify-between text-red-600"><span>割引{notes ? `（${notes}）` : ""}</span><span>-¥{fmt(discountTotal)}</span></div>
              <div className="flex justify-between"><span>送料</span><span>¥{fmt(shippingFee)}</span></div>
              <div className="flex justify-between font-semibold text-lg mt-1"><span>お支払い合計</span><span>¥{fmt(payable)}</span></div>
              <div className="text-right mt-2">
                <button type="button" onClick={handleCheckout} className="px-4 py-2 rounded-xl bg-black text-white">チェックアウトへ</button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* トースト */}
      {toast && (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full shadow">{toast}</div>)}

      {/* 固定ボトムバー（リンクは無し） */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span>小計: ¥{fmt(discountedSubtotal)}</span>
            <span className="text-red-600">割引: -¥{fmt(discountTotal)}</span>
            <span>送料: ¥{fmt(shippingFee)}</span>
          </div>
          <div className="font-semibold">合計: ¥{fmt(payable)}</div>
        </div>
      </div>
    </div>
  );
}
