import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import NameTilePreview, { ColorKey, Layout as PreviewLayout } from "../components/NameTilePreview";

type Flow = "original_single" | "fullset" | "regular";

const suitLabel = (s: "manzu" | "souzu" | "pinzu") =>
  s === "manzu" ? "萬子" : s === "souzu" ? "索子" : "筒子";

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const splitChars = (s: string) => Array.from(s || "");

const PRICING = {
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
    regular: {
      variants: { default: { label: "28mm 牌（通常）", priceIncl: 550 } },
    },
  },
  options: {
    keyholder: { priceIncl: 300 }, // 1つにつき
    design_submission_single: { priceIncl: 500 },
    design_submission_fullset: { priceIncl: 5000 },
    multi_color: { priceIncl: 200 },
    rainbow: { priceIncl: 800 },
    kiribako_4: { priceIncl: 1500 }, // 個数指定
    bring_own_color_unit: { priceIncl: 200 },
  },
} as const;

const COLOR_LIST: { key: ColorKey; label: string; dot: string }[] = [
  { key: "black", label: "ブラック", dot: "#0a0a0a" },
  { key: "red", label: "レッド", dot: "#d10f1b" },
  { key: "blue", label: "ブルー", dot: "#1e5ad7" },
  { key: "green", label: "グリーン", dot: "#2e7d32" },
  { key: "pink", label: "ピンク", dot: "#e24a86" },
  {
    key: "rainbow",
    label: "レインボー",
    dot: "linear-gradient(180deg,#ff2a2a 0%,#ff7a00 16%,#ffd400 33%,#00d06c 50%,#00a0ff 66%,#7a3cff 83%,#b400ff 100%)",
  },
];

const renderColorDot = (css: string) => {
  const isGrad = css.startsWith("linear-gradient");
  return (
    <span
      aria-hidden
      className="inline-block w-3.5 h-3.5 rounded-full mr-1 align-[-1px] border"
      style={isGrad ? { backgroundImage: css } : { background: css }}
    />
  );
};

export default function Shop() {
  /* スクロール参照 */
  const selectRef = useRef<HTMLDivElement | null>(null);
  const scrollToSelect = () => selectRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ステート */
  const [flow, setFlow] = useState<Flow>("original_single");
  const [originalSub, setOriginalSub] = useState<"single" | "fullset">("single");
  const [variant, setVariant] = useState<"standard" | "mm30" | "default">("standard");

  const [designType, setDesignType] = useState<"name_print" | "bring_own" | "commission">("name_print");
  const [text, setText] = useState("麻雀");
  const [layout, setLayout] = useState<PreviewLayout>("vertical");
  const [note, setNote] = useState("");

  const [useUnifiedColor, setUseUnifiedColor] = useState(true);
  const [unifiedColor, setUnifiedColor] = useState<ColorKey>("black");
  const [perCharColors, setPerCharColors] = useState<ColorKey[]>(["black", "black", "black", "black"]);

  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);

  // オプション
  const [keyholder, setKeyholder] = useState(false);
  const [kiribakoQty, setKiribakoQty] = useState<number>(0); // ← 任意個数

  // 通常牌
  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor" | "manzu" | "souzu" | "pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<"東" | "南" | "西" | "北" | "白" | "發" | "中">("東");

  // 数量（独立）
  const [qty, setQty] = useState(1);

  // アップロード
  const [uploadSummary, setUploadSummary] = useState("");
  const [imagePreviews, setImagePreviews] = useState<
    Array<{ id: string; src: string; name: string; type: "image" | "file" }>
  >([]);

  // カート & トースト & ドロワー
  type CartLine = {
    id: string;
    title: string;
    qty: number;
    unitPrice: number;
    options: string[];
    note?: string;
    previewText?: string;
  };
  const [cart, setCart] = useState<CartLine[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  /* 相互制御 */
  useEffect(() => {
    if (flow === "regular") {
      if (variant !== "default") setVariant("default");
      if (designType !== "name_print") setDesignType("name_print");
    } else {
      if (variant === "default") setVariant("standard");
      if (flow === "fullset" && designType === "name_print") setDesignType("bring_own");
      setOriginalSub(flow === "fullset" ? "fullset" : "single");
    }
  }, [flow, variant, designType]);

  const effectiveVariant = (f: Flow, v: "standard" | "mm30" | "default") =>
    f === "regular" ? "default" : v === "default" ? "standard" : v;

  const baseUnit = useMemo(() => {
    const v = effectiveVariant(flow, variant);
    const obj: any = PRICING.products[flow as keyof typeof PRICING.products];
    return obj?.variants?.[v]?.priceIncl || 0;
  }, [flow, variant]);

  /* オプション明細（数量連動） */
  const optionBreakdown = useMemo(() => {
    const rows: { label: string; price: number }[] = [];
    const isFull = flow === "fullset";
    const isSingle = flow === "original_single";

    if (designType === "bring_own") {
      rows.push({
        label: "デザイン持ち込み料",
        price: isFull ? PRICING.options.design_submission_fullset.priceIncl : PRICING.options.design_submission_single.priceIncl,
      });
      const extra = Math.max(0, (bringOwnColorCount || 1) - 1);
      if (extra > 0) rows.push({ label: `持ち込み 追加色 ${extra}色`, price: PRICING.options.bring_own_color_unit.priceIncl * extra });
    }

    if (isSingle && designType === "name_print") {
      if (useUnifiedColor) {
        if (unifiedColor === "rainbow") rows.push({ label: "レインボー", price: PRICING.options.rainbow.priceIncl });
      } else {
        const uniq = Array.from(new Set(perCharColors));
        const add = Math.max(0, uniq.length - 1);
        if (add > 0) rows.push({ label: `追加色 ${add}色`, price: PRICING.options.multi_color.priceIncl * add });
      }
    }

    // 桐箱：任意個数
    if (!isFull) {
      const boxes = Math.max(0, Math.floor(kiribakoQty || 0));
      if (boxes > 0) rows.push({ label: `桐箱（4枚用）× ${boxes}`, price: PRICING.options.kiribako_4.priceIncl * boxes });
    }

    // キーホルダー：1つにつき300円 → 数量連動
    if (!isFull && keyholder) {
      const q = Math.max(1, qty);
      rows.push({ label: `キーホルダー × ${q}`, price: PRICING.options.keyholder.priceIncl * q });
    }

    return rows;
  }, [
    flow,
    variant,
    designType,
    bringOwnColorCount,
    useUnifiedColor,
    unifiedColor,
    perCharColors,
    keyholder,
    kiribakoQty,
    qty,
  ]);

  const optionPrice = useMemo(() => optionBreakdown.reduce((a, b) => a + b.price, 0), [optionBreakdown]);
  const merchandiseSubtotal = baseUnit * Math.max(1, qty) + optionPrice;
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  /* アップロード */
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ALLOWED = ["jpg", "jpeg", "png", "psd", "ai", "tiff", "tif", "heic", "pdf"];
    const filesAll = Array.from(e.target.files || []);
    const files = filesAll.filter((f) => ALLOWED.includes((f.name.split(".").pop() || "").toLowerCase()));

    const previews: Array<{ id: string; src: string; name: string; type: "image" | "file" }> = [];
    files.forEach((f) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (f.type.startsWith("image/") && f.type !== "image/heic") {
        previews.push({ id, src: URL.createObjectURL(f), name: f.name, type: "image" });
      } else {
        previews.push({ id, src: "", name: f.name, type: "file" });
      }
    });
    setImagePreviews((prev) => [...prev, ...previews]);

    if (files.length === 0) {
      setUploadSummary("対応形式のファイルが選択されていません。");
      return;
    }
    const names = files.map((f) => f.name).slice(0, 5);
    setUploadSummary(`${files.length} ファイルを読み込みました\n${names.join("\n")}${files.length > 5 ? "\n…" : ""}`);
    e.currentTarget.value = ""; // 同じファイルを再選択できるように
  };

  const removePreview = (id: string) => {
    setImagePreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.src) URL.revokeObjectURL(target.src);
      return prev.filter((p) => p.id !== id);
    });
  };

  /* 商品名 */
  const effectiveTitle = useMemo(() => {
    const v = effectiveVariant(flow, variant);
    if (flow === "original_single") return `オリジナル麻雀牌（${v === "standard" ? "28mm" : "30mm"}）`;
    if (flow === "fullset") return `オリジナル麻雀牌（フルセット／${v === "standard" ? "28mm" : "30mm"}）`;
    const tile = regularSuit === "honor" ? regularHonor : `${regularNumber}${suitLabel(regularSuit)}`;
    const back = regularBack === "yellow" ? "黄色" : "青色";
    return `通常牌（28mm／背面:${back}／${tile}）`;
  }, [flow, variant, regularBack, regularSuit, regularNumber, regularHonor]);

  /* カート操作 */
  const addToCart = () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optionsText = optionBreakdown.map((r) => `${r.label}: +¥${fmt(r.price)}`);
    if (designType === "name_print" && (flow === "original_single" || flow === "regular")) {
      optionsText.unshift(`デザイン: ${text || "（未入力）"} / レイアウト:${layout === "vertical" ? "縦" : "横"}`);
    }
    if (note.trim()) optionsText.push(`備考: ${note.trim()}`);

    setCart((prev) => [
      ...prev,
      { id, title: effectiveTitle, qty: Math.max(1, qty), unitPrice: baseUnit + optionPrice, options: optionsText, note, previewText: text },
    ]);
    setToast("カートに追加しました。");
    setShowCart(true);
    setTimeout(() => setToast(null), 1200);
  };
  const removeCartLine = (id: string) => setCart((prev) => prev.filter((l) => l.id !== id));

  const cartMerch = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const cartShipping = cartMerch >= PRICING.shipping.freeOver || cartMerch === 0 ? 0 : PRICING.shipping.flat;
  const cartTotal = cartMerch + cartShipping;

  return (
    <section className="max-w-5xl mx-auto mt-4">
      {/* ヒーロー */}
      <div className="rounded-2xl border shadow-sm overflow-hidden">
        <div className="relative">
          <div className="h-40 md:h-56 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700" />
          <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
            <div className="text-white">
              <h1 className="text-xl md:text-3xl font-bold drop-shadow">one牌｜AIチャット購入体験 モック</h1>
              <p className="text-neutral-200 text-xs md:text-sm mt-1">チャットの流れで、そのままオリジナル麻雀牌を注文できるUIの試作です。</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={scrollToSelect}
                className="px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white text-neutral-900 shadow text-xs md:text-base font-medium"
              >
                オリジナル麻雀牌を作ってみる
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. カテゴリ */}
      <Card title="1. カテゴリを選択">
        <div ref={selectRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`text-left rounded-xl border p-4 transition hover:shadow ${
              flow !== "regular" ? "border-black" : "border-neutral-200"
            }`}
            role="button"
            onClick={() => setFlow(originalSub === "fullset" ? "fullset" : "original_single")}
          >
            <div className="text-base font-semibold">オリジナル麻雀牌</div>
            <div className="text-xs text-neutral-500 mt-0.5">28mm / 30mm</div>
            <div className="text-[12px] text-neutral-700 mt-2">あなただけのオリジナル牌。アクセサリーやギフトにおすすめ！</div>
          </div>

          <div
            className={`text-left rounded-xl border p-4 transition hover:shadow ${
              flow === "regular" ? "border-black" : "border-neutral-200"
            }`}
            role="button"
            onClick={() => setFlow("regular")}
          >
            <div className="text-base font-semibold">通常牌（バラ売り）</div>
            <div className="text-xs text-neutral-500 mt-0.5">28mm</div>
            <div className="text-[12px] text-neutral-700 mt-2">通常牌も1枚からご購入可能。キーホルダー対応も！</div>
          </div>
        </div>

        {flow !== "regular" && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill active={originalSub === "single"} onClick={() => { setOriginalSub("single"); setFlow("original_single"); }}>
              1つから
            </Pill>
            <Pill active={originalSub === "fullset"} onClick={() => { setOriginalSub("fullset"); setFlow("fullset"); }}>
              フルセット
            </Pill>
          </div>
        )}
      </Card>

      {/* 2. デザイン or 通常牌設定 */}
      {flow === "regular" ? (
        <Card title="2. デザイン（通常牌）">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="w-20">背面色</label>
            <Pill big active={regularBack === "yellow"} onClick={() => setRegularBack("yellow")}>黄色</Pill>
            <Pill big active={regularBack === "blue"} onClick={() => setRegularBack("blue")}>青色</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="w-20">種別</label>
            <Pill big active={regularSuit === "honor"} onClick={() => setRegularSuit("honor")}>字牌</Pill>
            <Pill big active={regularSuit === "manzu"} onClick={() => setRegularSuit("manzu")}>萬子</Pill>
            <Pill big active={regularSuit === "souzu"} onClick={() => setRegularSuit("souzu")}>索子</Pill>
            <Pill big active={regularSuit === "pinzu"} onClick={() => setRegularSuit("pinzu")}>筒子</Pill>
          </div>
          {regularSuit === "honor" ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className="w-20">字牌</label>
              {["東", "南", "西", "北", "白", "發", "中"].map((h) => (
                <Pill big key={h} active={regularHonor === (h as any)} onClick={() => setRegularHonor(h as any)}>
                  {h}
                </Pill>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className="w-20">数字</label>
              {Array.from({ length: 9 }).map((_, i) => (
                <Pill big key={i + 1} active={regularNumber === i + 1} onClick={() => setRegularNumber(i + 1)}>
                  {i + 1}
                </Pill>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card title="2. デザイン">
          {/* フルセットは名前入れを非表示 */}
          <div className="flex flex-wrap gap-2">
            {flow !== "fullset" && (
              <Pill big active={designType === "name_print"} onClick={() => setDesignType("name_print")}>名前入れ</Pill>
            )}
            <Pill big active={designType === "bring_own"} onClick={() => setDesignType("bring_own")}>デザイン持ち込み</Pill>
            <Pill big active={designType === "commission"} onClick={() => setDesignType("commission")}>デザイン依頼</Pill>
          </div>

          {/* 名前入れ */}
          {designType === "name_print" && (
            <div className="grid md:grid-cols-2 gap-4 items-start mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-24">文字</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} className="border rounded px-3 py-2 w-60" placeholder="縦4文字／横は自動改行" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24">レイアウト</label>
                  <Pill big active={layout === "vertical"} onClick={() => setLayout("vertical")}>縦</Pill>
                  <Pill big active={layout === "horizontal"} onClick={() => setLayout("horizontal")}>横</Pill>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="w-24">色指定</label>
                    <Pill big active={useUnifiedColor} onClick={() => setUseUnifiedColor(true)}>一括指定</Pill>
                    <Pill big active={!useUnifiedColor} onClick={() => setUseUnifiedColor(false)}>1文字ずつ</Pill>
                  </div>
                  {useUnifiedColor ? (
                    <div className="flex flex-wrap gap-2 pl-24">
                      {COLOR_LIST.map((c) => (
                        <Pill big key={c.key} active={unifiedColor === c.key} onClick={() => setUnifiedColor(c.key)} title={c.label}>
                          {renderColorDot(c.dot)}{c.label}
                        </Pill>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-24 space-y-2">
                      {splitChars(text || "麻雀").map((ch, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-6 text-center text-sm">{ch}</div>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_LIST.map((c) => (
                              <Pill big key={c.key} active={(perCharColors[idx] || "black") === c.key}
                                onClick={() => { const arr = perCharColors.slice(); arr[idx] = c.key; setPerCharColors(arr); }}
                                title={`${ch}の色を${c.label}にする`}>
                                {renderColorDot(c.dot)}{c.label}
                              </Pill>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <label className="w-24 mt-2">備考</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="border rounded px-3 py-2 w-full h-32"
                    placeholder="例）右上の文字だけ赤に、など"
                  />
                </div>
              </div>

              <div>
                <NameTilePreview
                  text={text || "麻雀"}
                  layout={layout}
                  useUnifiedColor={useUnifiedColor}
                  unifiedColor={unifiedColor}
                  perCharColors={perCharColors}
                />
                <div className="text-xs text-neutral-500 mt-2">※ 全角4文字を超えると自動で2段に分割します（縦：右→左、横：上→下）。</div>
              </div>
            </div>
          )}

          {/* 持ち込み */}
          {designType === "bring_own" && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-neutral-600">デザイン持ち込み料（{flow === "fullset" ? "¥5,000" : "¥500"}）は自動計算されます。</div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-2">ファイル選択（複数可）</div>
                  {/* ← ボタンは1つだけ */}
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white cursor-pointer shadow">
                    <span>ファイルを選択</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.psd,.ai,.tiff,.tif,.heic"
                      onChange={onFilesSelected}
                      className="hidden"
                    />
                  </label>
                  {uploadSummary && <div className="text-xs text-neutral-700 mt-2 whitespace-pre-line">{uploadSummary}</div>}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                      {imagePreviews.map((p) => (
                        <div key={p.id} className="relative text-center text-xs group">
                          {p.type === "image" ? (
                            <img src={p.src} alt={p.name} className="w-full h-24 object-cover rounded border" />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center border rounded bg-neutral-100 text-neutral-600">
                              {p.name.split(".").pop()?.toUpperCase()}
                            </div>
                          )}
                          <button
                            className="absolute top-1 right-1 text-[11px] px-1.5 py-0.5 rounded bg-white/90 border shadow hover:bg-white"
                            onClick={() => removePreview(p.id)}
                            type="button"
                          >
                            削除
                          </button>
                          <div className="truncate mt-1">{p.name}</div>
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
                    <span className="text-xs text-neutral-600">※ 追加1色ごとに+¥200</span>
                  </div>

                  <div className="mt-3">
                    <label className="text-sm block mb-1">備考</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="border rounded px-3 py-2 w-full h-32"
                      placeholder="例）白フチあり、など"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 依頼 */}
          {designType === "commission" && (
            <div className="mt-3">
              <div className="text-xs text-neutral-600 mb-2">※デザイン料は別途お見積りとなります。</div>
              <div className="flex items-start gap-2">
                <label className="w-24 mt-2">備考</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="border rounded px-3 py-2 w-full h-32"
                  placeholder="ご要望をご記入ください（参考画像は問い合わせから添付してください）"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 3. サイズ選択 */}
      {(flow === "original_single" || flow === "fullset") && (
        <Card title="3. サイズ選択">
          <div className="flex flex-wrap items-center gap-2">
            <Pill big active={variant === "standard"} onClick={() => setVariant("standard")}>28mm</Pill>
            <Pill big active={variant === "mm30"} onClick={() => setVariant("mm30")}>30mm</Pill>
          </div>

          {/* 対応機種：選択中サイズのみ表示 */}
          <details className="mt-3">
            <summary className="cursor-pointer select-none text-sm font-medium">対応機種</summary>
            <div className="mt-2 grid md:grid-cols-2 gap-3 text-xs text-neutral-700">
              {variant === "standard" ? (
                <div>
                  <div className="font-semibold mb-1">対応機種（28mm）</div>
                  <ul className="list-disc ml-5 space-y-0.5">
                    <li>AMOS REXX</li><li>AMOS REXX2</li><li>AMOSアルティマ</li><li>AMOSセヴィア</li>
                    <li>AMOSセヴィアHD</li><li>AMOSヴィエラ</li><li>AMOSシャルム</li><li>AMOSジョイ</li>
                    <li>AMOSキューブ</li><li>AMOSキューブHD</li><li>ニンジャB4 HD</li><li>ニンジャB4 STANDARD</li>
                  </ul>
                  <div className="mt-1 text-red-600">※ AMOS REXX3 は使用不可</div>
                </div>
              ) : (
                <div>
                  <div className="font-semibold mb-1">対応機種（30mm）</div>
                  <ul className="list-disc ml-5 space-y-0.5">
                    <li>AMOS JP2</li><li>AMOS JPEX</li><li>AMOS JPCOLOR</li><li>AMOS JPDG</li>
                  </ul>
                  <p className="text-xs text-neutral-600 mt-1">※上記を含むJPシリーズに対応</p>
                </div>
              )}
            </div>
          </details>
        </Card>
      )}

      {/* 4. 数量（独立） */}
      <Card title="4. 数量">
        <div className="flex items-center gap-2">
          <label className="text-sm">数量</label>
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
      </Card>

      {/* 5. オプション（押しやすいUI + ルール変更） */}
      <Card title="5. オプション">
        <div className="flex flex-col gap-3">
          {flow !== "fullset" && (
            <label className="inline-flex items-center gap-3 p-3 border rounded-xl hover:bg-neutral-50 cursor-pointer">
              <input type="checkbox" checked={keyholder} onChange={(e) => setKeyholder(e.target.checked)} />
              <span className="text-sm">キーホルダー（1つにつき +¥{fmt(PRICING.options.keyholder.priceIncl)}）</span>
            </label>
          )}
          {((flow === "original_single" && variant === "standard") || flow === "regular") && (
            <div className="flex items-center gap-3 p-3 border rounded-xl">
              <div className="text-sm">桐箱（4枚用）</div>
              <input
                type="number"
                min={0}
                value={kiribakoQty}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setKiribakoQty(Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
                }}
                className="border rounded px-3 py-2 w-28"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <span className="text-xs text-neutral-600">※ 個数 × ¥{fmt(PRICING.options.kiribako_4.priceIncl)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* 6. 見積（ボタンサイズを少し控えめに） */}
      <Card title="6. 見積">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-2">明細</div>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1 text-neutral-600">商品</td><td className="py-1 text-right">¥{fmt(baseUnit)}</td></tr>
                {optionBreakdown.map((r, i) => (
                  <tr key={i}><td className="py-1 text-neutral-600">{r.label}</td><td className="py-1 text-right">+¥{fmt(r.price)}</td></tr>
                ))}
                <tr><td className="py-1 text-neutral-600">数量</td><td className="py-1 text-right">× {qty}</td></tr>
                <tr><td className="py-1 font-semibold">小計</td><td className="py-1 text-right font-semibold">¥{fmt(merchandiseSubtotal)}</td></tr>
                <tr><td className="py-1 text-neutral-600">送料</td><td className="py-1 text-right">{shipping === 0 ? "¥0（送料無料）" : `¥${fmt(shipping)}`}</td></tr>
                <tr><td className="py-1 font-semibold">合計</td><td className="py-1 text-right font-semibold">¥{fmt(total)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-end justify-end">
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 rounded-xl border text-sm hover:bg-neutral-50" onClick={addToCart}>
                カートに追加
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                onClick={() => window.open("https://checkout.shopify.com/mock", "_blank")}
              >
                購入手続きへ
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ボトムバー（中央寄せ & カート統合） */}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30">
        <div className="pointer-events-auto mx-auto max-w-xl w-[92%]">
          <div className="rounded-2xl border bg-white/95 backdrop-blur shadow-lg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{effectiveTitle}</div>
                <div className="text-xs text-neutral-600">現在の見積 ¥{fmt(total)}（送料{shipping === 0 ? "0円" : `${fmt(shipping)}円`}）</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="px-3 py-2 rounded-xl border text-xs hover:bg-neutral-50" onClick={() => setShowCart((v) => !v)}>
                  カートを見る
                </button>
                <button type="button" className="px-3 py-2 rounded-xl border text-xs hover:bg-neutral-50" onClick={addToCart}>
                  カートへ
                </button>
                <button type="button" className="px-3 py-2 rounded-xl bg-black text-white text-xs" onClick={() => window.open("https://checkout.shopify.com/mock", "_blank")}>
                  購入
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* カートドロワー */}
      {showCart && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">カート</div>
              <button className="px-3 py-1 rounded border text-sm" onClick={() => setShowCart(false)}>閉じる</button>
            </div>
            {cart.length === 0 ? (
              <div className="text-sm text-neutral-500 mt-3">カートは空です。</div>
            ) : (
              <div className="mt-3 space-y-3">
                {cart.map((l) => (
                  <div key={l.id} className="border rounded-lg p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-xs text-neutral-600">単価 ¥{fmt(l.unitPrice)} / 数量 {l.qty}</div>
                      </div>
                      <button className="text-xs px-2 py-1 rounded border hover:bg-neutral-50" onClick={() => removeCartLine(l.id)}>
                        削除
                      </button>
                    </div>
                    {l.options.length > 0 && (
                      <ul className="text-xs text-neutral-700 list-disc ml-5 mt-1 space-y-0.5">
                        {l.options.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <div className="border-t pt-2 text-sm">
                  <div className="flex justify-between"><span>小計</span><span>¥{fmt(cartMerch)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>送料</span><span>{cartShipping === 0 ? "¥0（送料無料）" : `¥${fmt(cartShipping)}`}</span></div>
                  <div className="flex justify-between font-semibold"><span>合計</span><span>¥{fmt(cartTotal)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[110px] z-40 px-4 py-2 rounded-xl bg-black text-white text-sm shadow">
          {toast}
        </div>
      )}
    </section>
  );
}
