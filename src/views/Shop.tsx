import React, { useMemo, useRef, useState, useEffect } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import NameTilePreview, { ColorKey, Layout } from "../components/NameTilePreview";
import RegularTilePreview from "../components/RegularTilePreview";
import Hero from "../components/Hero";

/** ----------------- 型・定数 ----------------- */
type Flow = "original_single" | "fullset" | "regular";
type FontKey = "ta-fuga-fude" | "gothic" | "mincho";
type CartItem = {
  id: string;
  title: string;
  qty: number;
  unit: number;          // 商品の単価
  optionTotal: number;   // そのアイテムに紐づくオプション合計（数量連動しない）
  discount: number;      // アイテムにかかった割引額
  note?: string;
  extras: { label: string; amount: number }[]; // オプション明細（単価×数まで展開済み）
};

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const splitChars = (s: string) => Array.from(s || "");
const suitLabel = (s: "manzu" | "souzu" | "pinzu") => (s === "manzu" ? "萬子" : s === "souzu" ? "索子" : "筒子");
const containerStyle: React.CSSProperties = { maxWidth: "min(1024px, 92vw)", margin: "0 auto" };
const BOTTOM_BAR_HEIGHT = 76;

const PRICING = {
  shipping: { flat: 390, freeOver: 5000 },
  options: {
    keyholder: { priceIncl: 300, label: "キーホルダー" },
    design_submission_single: { priceIncl: 500, label: "持ち込み料（単品）" },
    design_submission_fullset: { priceIncl: 5000, label: "持ち込み料（フルセット）" },
    multi_color: { priceIncl: 200, label: "追加色" },
    rainbow: { priceIncl: 800, label: "レインボー" },
    kiribako_4: { priceIncl: 1500, label: "桐箱（4枚用）" },
  },
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
} as const;

const COLOR_LIST: { key: ColorKey; label: string; css: string }[] = [
  { key: "black", label: "ブラック", css: "#0a0a0a" },
  { key: "red", label: "レッド", css: "#d10f1b" },
  { key: "blue", label: "ブルー", css: "#1e5ad7" },
  { key: "green", label: "グリーン", css: "#2e7d32" },
  { key: "pink", label: "ピンク", css: "#e24a86" },
  {
    key: "rainbow",
    label: "レインボー",
    css: "linear-gradient(180deg,#ff2a2a 0%,#ff7a00 16%,#ffd400 33%,#00d06c 50%,#00a0ff 66%,#7a3cff 83%,#b400ff 100%)",
  },
];

const renderDot = (css: string) => {
  const isGrad = css.startsWith("linear-gradient");
  return (
    <span
      aria-hidden
      className="inline-block mr-2 align-[-2px] rounded-full"
      style={{
        width: 12,
        height: 12,
        background: isGrad ? undefined : css,
        backgroundImage: isGrad ? css : undefined,
        border: "1px solid #e5e7eb",
      }}
    />
  );
};

function cryptoRandom() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0].toString(36);
  }
  return Math.random().toString(36).slice(2);
}

/** ----------------- 本体 ----------------- */
const Shop: React.FC<{ gotoCorporate: () => void }> = ({ gotoCorporate }) => {
  const selectRef = useRef<HTMLDivElement | null>(null);
  const scrollToSelect = () => selectRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // フロー・バリアント
  const [flow, setFlow] = useState<Flow>("original_single");
  const [originalSub, setOriginalSub] = useState<"single" | "fullset">("single");
  const [variant, setVariant] = useState<"standard" | "mm30" | "default">("standard");

  // デザイン
  const [designType, setDesignType] = useState<"name_print" | "bring_own" | "commission">("name_print");
  const [text, setText] = useState("麻雀");
  const [layout, setLayout] = useState<Layout>("vertical");
  const [fontKey, setFontKey] = useState<FontKey>("ta-fuga-fude");
  const [note, setNote] = useState("");

  // 色
  const [useUnifiedColor, setUseUnifiedColor] = useState(true);
  const [unifiedColor, setUnifiedColor] = useState<ColorKey>("black");
  const [perCharColors, setPerCharColors] = useState<ColorKey[]>(["black", "black", "black", "black"]);

  // 通常牌
  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor" | "manzu" | "souzu" | "pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<"東" | "南" | "西" | "北" | "白" | "發" | "中">("東");

  // 数量
  const [qty, setQty] = useState(1);

  // 持ち込み
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);
  const [files, setFiles] = useState<{ id: string; src: string; name: string; type: "image" | "file" }[]>([]);

  // オプション（数量はメイン数量と独立）
  const [optKeyholderQty, setOptKeyholderQty] = useState<number>(0);
  const [optKiribakoQty, setOptKiribakoQty] = useState<number>(0);

  // ミニカート
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /** フルセットでは「名前入れ」を非表示 → 自動で切替 */
  useEffect(() => {
    if (flow === "fullset" && designType === "name_print") setDesignType("bring_own");
    setOriginalSub(flow === "fullset" ? "fullset" : "single");
    if (flow === "regular") {
      setVariant("default");
      if (designType !== "name_print") setDesignType("name_print");
    } else if (variant === "default") {
      setVariant("standard");
    }
  }, [flow]); // eslint-disable-line

  /** ----- 単価・オプション内訳 ----- */
  const productUnit = useMemo(() => {
    const table: any = PRICING.products[flow as keyof typeof PRICING.products];
    const v = flow === "regular" ? "default" : variant === "default" ? "standard" : variant;
    return table.variants[v].priceIncl as number;
  }, [flow, variant]);

  const extraDetails: { label: string; amount: number }[] = useMemo(() => {
    const out: { label: string; amount: number }[] = [];
    const isFull = flow === "fullset";
    const isSingle = flow === "original_single";

    if (designType === "bring_own") {
      out.push({
        label: isFull ? PRICING.options.design_submission_fullset.label : PRICING.options.design_submission_single.label,
        amount: isFull ? PRICING.options.design_submission_fullset.priceIncl : PRICING.options.design_submission_single.priceIncl,
      });
    }

    // 色加算：一括レインボーは+800、個別指定はユニーク色数の増加分×200（上限800）
    if (isSingle && designType === "name_print") {
      if (useUnifiedColor) {
        if (unifiedColor === "rainbow") {
          out.push({ label: PRICING.options.rainbow.label, amount: PRICING.options.rainbow.priceIncl });
        }
      } else {
        const uniq = Array.from(new Set(perCharColors.slice(0, Math.max(1, splitChars(text).length))));
        // 黒を含めたユニーク色数が2色以上なら追加色＝(色数-1)×200。上限800。
        const addColors = Math.max(0, uniq.length - 1);
        const addAmount = Math.min(PRICING.options.multi_color.priceIncl * addColors, PRICING.options.rainbow.priceIncl);
        if (addAmount > 0) out.push({ label: `${PRICING.options.multi_color.label} × ${addColors}`, amount: addAmount });
      }
    }

    // キーホルダー＆桐箱（数量はメイン数量に比例しない）
    if (optKeyholderQty > 0) {
      out.push({
        label: `${PRICING.options.keyholder.label} × ${optKeyholderQty}`,
        amount: PRICING.options.keyholder.priceIncl * optKeyholderQty,
      });
    }
    if (optKiribakoQty > 0) {
      const ok = (flow === "original_single" && variant === "standard") || flow === "regular";
      if (ok) {
        out.push({
          label: `${PRICING.options.kiribako_4.label} × ${optKiribakoQty}`,
          amount: PRICING.options.kiribako_4.priceIncl * optKiribakoQty,
        });
      }
    }

    // 持ち込みの追加色（1色以上の入力で、追加分×200）
    if (designType === "bring_own") {
      const add = Math.max(0, bringOwnColorCount - 1);
      if (add > 0) {
        out.push({
          label: `持ち込み追加色 × ${add}`,
          amount: PRICING.options.multi_color.priceIncl * add,
        });
      }
    }

    return out;
  }, [
    flow,
    variant,
    designType,
    bringOwnColorCount,
    useUnifiedColor,
    unifiedColor,
    perCharColors,
    optKeyholderQty,
    optKiribakoQty,
    text,
  ]);

  const optionTotal = extraDetails.reduce((s, d) => s + d.amount, 0);

  /** 割引率（アイテム単位） */
  const discountRate = useMemo(() => {
    if (flow === "original_single") return qty >= 10 ? 0.15 : qty >= 5 ? 0.1 : 0;
    if (flow === "fullset") return qty >= 5 ? 0.2 : 0;
    return 0;
  }, [flow, qty]);

  const productSubtotal = productUnit * qty;
  const optionsSubtotal = optionTotal; // オプションはメイン数量に比例しない仕様
  const discountAmount = Math.floor((productSubtotal + optionsSubtotal) * discountRate);
  const merchandiseSubtotal = productSubtotal + optionsSubtotal - discountAmount;
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  /** タイトル */
  const productTitle = useMemo(() => {
    if (flow === "regular") {
      const tile = regularSuit === "honor" ? regularHonor : `${regularNumber}${suitLabel(regularSuit)}`;
      const back = regularBack === "yellow" ? "黄色" : "青色";
      return `通常牌（28mm／背面:${back}／${tile}）`;
    }
    return `オリジナル麻雀牌（${variant === "standard" ? "28mm" : "30mm"}${flow === "fullset" ? "／フルセット" : ""}）`;
  }, [flow, variant, regularBack, regularSuit, regularNumber, regularHonor]);

  /** ファイル選択 */
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ALLOWED = ["jpg", "jpeg", "png", "psd", "ai", "tiff", "tif", "heic", "pdf"];
    const fs = Array.from(e.target.files || []);
    const ok = fs.filter((f) => ALLOWED.includes((f.name.split(".").pop() || "").toLowerCase()));
    const mapped = ok.map((f) => {
      const isImg = f.type.startsWith("image/") && f.type !== "image/heic";
      return {
        id: `${f.name}_${f.size}_${Math.random().toString(36).slice(2)}`,
        name: f.name,
        src: isImg ? URL.createObjectURL(f) : "",
        type: isImg ? "image" : "file",
      } as const;
    });
    setFiles((prev) => [...prev, ...mapped]);
    e.currentTarget.value = "";
  };
  const removeFile = (id: string) => setFiles((prev) => prev.filter((x) => x.id !== id));

  /** カート追加 */
  const lineTotal = (ci: CartItem) => ci.qty * ci.unit + ci.optionTotal - ci.discount;
  const addToCart = () => {
    const item: CartItem = {
      id: cryptoRandom(),
      title: productTitle,
      qty,
      unit: productUnit,
      optionTotal,
      discount: discountAmount,
      note,
      extras: extraDetails.map((d) => ({ label: d.label, amount: d.amount })),
    };
    setCartItems((prev) => [...prev, item]);
    setMiniCartOpen(true);
    setToast("カートに追加しました");
    setTimeout(() => setToast(null), 1200);
  };
  const removeFromCart = (id: string) =>
    setCartItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      // すべて削除されたら閉じる
      if (next.length === 0) setMiniCartOpen(false);
      return next;
    });

  /** ミニカートの合計（送料無料・割引の表示用） */
  const cartTotals = useMemo(() => {
    const merchandise = cartItems.reduce((s, it) => s + (it.qty * it.unit + it.optionTotal - it.discount), 0);
    const ship = merchandise >= PRICING.shipping.freeOver || merchandise === 0 ? 0 : PRICING.shipping.flat;
    const total = merchandise + ship;
    return { merchandise, ship, total };
  }, [cartItems]);

  /** ----------------- UI ----------------- */
  return (
    <div style={{ paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}>
      <Hero onPrimary={scrollToSelect} onSecondary={gotoCorporate} />

      <section style={containerStyle} className="mt-6 space-y-6">
        {/* 1. カテゴリ */}
        <Card title="1. カテゴリを選択">
          <div ref={selectRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFlow(originalSub === "fullset" ? "fullset" : "original_single");
              }}
              className={`text-left rounded-xl border p-4 transition hover:shadow ${
                flow !== "regular" ? "border-black" : "border-neutral-200"
              }`}
            >
              <div className="text-base font-semibold">オリジナル麻雀牌</div>
              <div className="text-xs text-neutral-500 mt-0.5">28mm / 30mm</div>
              <div className="text-[12px] text-neutral-700 mt-2">
                あなただけのオリジナル牌を作成。アクセサリーやギフトにも最適です。
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFlow("regular")}
              className={`text-left rounded-xl border p-4 transition hover:shadow ${
                flow === "regular" ? "border-black" : "border-neutral-200"
              }`}
            >
              <div className="text-base font-semibold">通常牌（バラ売り）</div>
              <div className="text-xs text-neutral-500 mt-0.5">28mm</div>
              <div className="text-[12px] text-neutral-700 mt-2">
                通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！
              </div>
            </button>
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

              {/* 納期（選択時のみ表示） */}
              <div className="mt-3 text-xs text-neutral-600 space-y-1">
                {flow === "original_single" && <div>発送目安：<b>約2〜3週間</b></div>}
                {flow === "fullset" && (
                  <div>
                    納期：<b>デザイン確定から2〜3か月</b>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 2. 分岐 */}
        {flow === "regular" ? (
          <Card title="2. 牌の選択（通常牌）">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-24">背面色</label>
                  <Pill active={regularBack === "yellow"} onClick={() => setRegularBack("yellow")}>
                    黄色
                  </Pill>
                  <Pill active={regularBack === "blue"} onClick={() => setRegularBack("blue")}>
                    青色
                  </Pill>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24">種別</label>
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
                  <div className="flex items-center gap-2">
                    <label className="w-24">字牌</label>
                    {["東", "南", "西", "北", "白", "發", "中"].map((h) => (
                      <Pill key={h} active={regularHonor === (h as any)} onClick={() => setRegularHonor(h as any)}>
                        {h}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="w-24">数字</label>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Pill key={i + 1} active={regularNumber === i + 1} onClick={() => setRegularNumber(i + 1)}>
                        {i + 1}
                      </Pill>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <RegularTilePreview
                  back={regularBack}
                  suit={regularSuit}
                  number={regularNumber}
                  honor={regularHonor}
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card title="2. デザイン">
            {/* デザイン方式 */}
            <div className="flex flex-wrap gap-2">
              {flow !== "fullset" && (
                <Pill active={designType === "name_print"} onClick={() => setDesignType("name_print")}>
                  名前入れ
                </Pill>
              )}
              <Pill active={designType === "bring_own"} onClick={() => setDesignType("bring_own")}>
                デザイン持ち込み
              </Pill>
              <Pill active={designType === "commission"} onClick={() => setDesignType("commission")}>
                デザイン依頼
              </Pill>
            </div>

            {/* 名前入れ */}
            {designType === "name_print" && (
              <div className="grid md:grid-cols-2 gap-4 items-start mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="w-24">文字</label>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="border rounded px-3 py-2 w-60"
                      placeholder="縦4文字／横は自動改行"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-24">レイアウト</label>
                    <Pill active={layout === "vertical"} onClick={() => setLayout("vertical")}>
                      縦
                    </Pill>
                    <Pill active={layout === "horizontal"} onClick={() => setLayout("horizontal")}>
                      横
                    </Pill>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-24">フォント</label>
                    <Pill active={fontKey === "ta-fuga-fude"} onClick={() => setFontKey("ta-fuga-fude")}>
                      萬子風
                    </Pill>
                    <Pill active={fontKey === "gothic"} onClick={() => setFontKey("gothic")}>
                      ゴシック
                    </Pill>
                    <Pill active={fontKey === "mincho"} onClick={() => setFontKey("mincho")}>
                      明朝
                    </Pill>
                  </div>

                  {/* 色指定 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="w-24">色指定</label>
                      <Pill active={useUnifiedColor} onClick={() => setUseUnifiedColor(true)}>
                        一括指定
                      </Pill>
                      <Pill active={!useUnifiedColor} onClick={() => setUseUnifiedColor(false)}>
                        1文字ずつ
                      </Pill>
                    </div>

                    {useUnifiedColor ? (
                      <div className="pl-24 grid grid-cols-3 gap-2 max-w-[420px]">
                        {COLOR_LIST.map((c) => (
                          <Pill key={c.key} active={unifiedColor === c.key} onClick={() => setUnifiedColor(c.key)}>
                            {renderDot(c.css)}
                            {c.label}
                          </Pill>
                        ))}
                      </div>
                    ) : (
                      <div className="pl-24 space-y-2">
                        {splitChars(text || "麻雀").map((ch, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-6 text-center text-sm">{ch}</div>
                            <div className="grid grid-cols-3 gap-2">
                              {COLOR_LIST.map((c) => (
                                <Pill
                                  key={c.key}
                                  active={(perCharColors[idx] || "black") === c.key}
                                  onClick={() => {
                                    const arr = perCharColors.slice();
                                    arr[idx] = c.key;
                                    setPerCharColors(arr);
                                  }}
                                >
                                  {renderDot(c.css)}
                                  {c.label}
                                </Pill>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pl-24 text-[12px] text-neutral-500">
                      ※ 他の色をご希望の場合は備考欄に記載ください。
                    </div>
                  </div>

                  {/* 備考 */}
                  <div className="flex gap-2 items-start">
                    <label className="w-24 mt-2">備考</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="border rounded-xl px-3 py-2 w-full h-40 md:h-48"
                      placeholder="ご希望・注意点など（任意）"
                    />
                  </div>
                </div>

                {/* プレビュー（右側に固定／重なり防止のため幅を調整） */}
                <div className="flex justify-center md:justify-end">
                  <div className="max-w-[460px] md:max-w-[420px]">
                    <NameTilePreview
                      text={text || "麻雀"}
                      layout={layout}
                      useUnifiedColor={useUnifiedColor}
                      unifiedColor={unifiedColor}
                      perCharColors={perCharColors}
                      fontKey={fontKey}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* デザイン持ち込み */}
            {designType === "bring_own" && (
              <div className="mt-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-medium mb-2">ファイル選択（複数可）</div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border cursor-pointer shadow-sm">
                      <span>ファイルを選択</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.psd,.ai,.tiff,.tif,.heic"
                        onChange={onPickFiles}
                        className="hidden"
                      />
                    </label>

                    {files.length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                        {files.map((p) => (
                          <div key={p.id} className="relative text-center text-xs">
                            {p.type === "image" ? (
                              <img src={p.src} alt={p.name} className="w-full h-24 object-cover rounded border" />
                            ) : (
                              <div className="w-full h-24 flex items-center justify-center border rounded bg-neutral-100 text-neutral-600">
                                {p.name.split(".").pop()?.toUpperCase()}
                              </div>
                            )}
                            <div className="truncate mt-1">{p.name}</div>
                            <button
                              type="button"
                              onClick={() => removeFile(p.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white text-xs"
                              title="削除"
                            >
                              ×
                            </button>
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
                        className="border rounded-xl px-3 py-2 w-full h-40 md:h-48"
                        placeholder="ご希望・注意点など（任意）"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* デザイン依頼 */}
            {designType === "commission" && (
              <div className="mt-3">
                <label className="text-sm block mb-1">備考</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="border rounded-xl px-3 py-2 w-full h-40 md:h-48"
                  placeholder="ご希望・注意点など（任意）"
                />
                <p className="text-xs text-neutral-600 mt-2">※デザイン料は別途お見積りとなります。</p>
              </div>
            )}
          </Card>
        )}

        {/* 3. サイズ選択（オリジナルのみ） */}
        {(flow === "original_single" || flow === "fullset") && (
          <Card title="3. サイズ選択">
            <div className="flex gap-2">
              <Pill active={variant === "standard"} onClick={() => setVariant("standard")}>
                28mm
              </Pill>
              <Pill active={variant === "mm30"} onClick={() => setVariant("mm30")}>
                30mm
              </Pill>
            </div>

            {/* 対応機種（選んだサイズだけ表示） */}
            <details className="mt-3">
              <summary className="cursor-pointer select-none text-sm font-medium">対応機種</summary>
              {variant === "standard" ? (
                <div className="mt-2 grid md:grid-cols-2 gap-3 text-xs text-neutral-700">
                  <div>
                    <div className="font-semibold mb-1">28mm 対応機種</div>
                    <ul className="list-disc ml-5 space-y-0.5">
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
                    </ul>
                    <div className="mt-1 text-red-600">※ AMOS REXX3 は使用不可</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 grid md:grid-cols-2 gap-3 text-xs text-neutral-700">
                  <div>
                    <div className="font-semibold mb-1">30mm 対応機種</div>
                    <ul className="list-disc ml-5 space-y-0.5">
                      <li>AMOS JP2</li>
                      <li>AMOS JPEX</li>
                      <li>AMOS JPCOLOR</li>
                      <li>AMOS JPDG</li>
                    </ul>
                    <p className="text-xs text-neutral-600 mt-1">※上記を含むJPシリーズに対応</p>
                  </div>
                </div>
              )}
            </details>
            <p className="text-xs text-neutral-600 mt-2">※ 背面の色は黄色となります。</p>
          </Card>
        )}

        {/* 4. 数量 */}
        <Card title="4. 数量">
          <div className="flex items-center gap-2">
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
            <div className="text-xs text-neutral-600">
              {flow === "original_single" && "※ 合計5個以上で10％OFF、10個以上で15％OFF"}
              {flow === "fullset" && "※ 5セット以上で20％OFF"}
            </div>
          </div>
        </Card>

        {/* 5. オプション */}
        <Card title="5. オプション">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {/* キーホルダー（独立数量） */}
              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div className="font-medium">キーホルダー</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={optKeyholderQty}
                    onChange={(e) => {
                      const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                      // メイン数量より多くは選べない
                      setOptKeyholderQty(Math.min(v, qty));
                    }}
                    className="border rounded px-3 py-2 w-24"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <span>× ¥{fmt(PRICING.options.keyholder.priceIncl)}</span>
                </div>
              </div>

              {/* 桐箱（28mm単品/通常のみ・独立数量） */}
              {((flow === "original_single" && variant === "standard") || flow === "regular") && (
                <>
                  <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                    <div className="font-medium">桐箱（4枚用）</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={optKiribakoQty}
                        onChange={(e) => {
                          const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                          setOptKiribakoQty(v);
                        }}
                        className="border rounded px-3 py-2 w-24"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <span>× ¥{fmt(PRICING.options.kiribako_4.priceIncl)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600">
                    ※ 桐箱は4枚用です。28mm専用となります。
                  </p>
                </>
              )}
            </div>

            {/* 右側の注釈は不要とのことなので削除済み */}
          </div>
        </Card>

        {/* 6. 見積 */}
        <Card title="6. 見積">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-neutral-600">商品</td>
                    <td className="py-1 text-right">¥{fmt(productUnit)}</td>
                  </tr>
                  {extraDetails.map((d, i) => (
                    <tr key={i}>
                      <td className="py-1 text-neutral-600">{d.label}</td>
                      <td className="py-1 text-right">¥{fmt(d.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1 text-neutral-600">数量</td>
                    <td className="py-1 text-right">× {qty}</td>
                  </tr>

                  {/* 中間小計行は不要なので削除 */}

                  {discountRate > 0 && (
                    <tr>
                      <td className="py-1 text-emerald-700 font-semibold">
                        割引（{flow === "fullset" ? "フルセット" : "オリジナル"} {Math.round(discountRate * 100)}%OFF）
                      </td>
                      <td className="py-1 text-right text-emerald-700 font-semibold">-¥{fmt(discountAmount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1">小計</td>
                    <td className="py-1 text-right">¥{fmt(merchandiseSubtotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-600">送料</td>
                    <td className="py-1 text-right">{shipping === 0 ? "¥0（送料無料）" : `¥${fmt(shipping)}`}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">合計</td>
                    <td className="py-1 text-right font-semibold">¥{fmt(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-end justify-end gap-8">
              <button
                type="button"
                onClick={addToCart}
                className="px-5 py-3 rounded-2xl border shadow-sm bg-white hover:bg-neutral-50"
              >
                カートに追加
              </button>
              <button
                type="button"
                onClick={() => setMiniCartOpen(true)}
                className="px-5 py-3 rounded-2xl bg-black text-white shadow"
              >
                購入手続きへ
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* ===== ボトムバー（画面下“全面”、中央寄せ） ===== */}
      <div className="fixed left-0 right-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div style={{ ...containerStyle }} className="h-[76px] px-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">{productTitle}</div>
            <div className="text-neutral-600">
              小計 ¥{fmt(merchandiseSubtotal)} ・ 送料 {shipping === 0 ? "¥0（無料）" : `¥${fmt(shipping)}`}{" "}
              {discountAmount > 0 && (
                <span className="text-rose-500 ml-2">割引 -¥{fmt(discountAmount)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold mr-2">合計 ¥{fmt(total)}</div>
            <button type="button" className="px-4 py-2 rounded-xl border" onClick={addToCart}>
              カートに追加
            </button>
            <button type="button" className="px-5 py-2 rounded-xl bg-black text-white" onClick={() => setMiniCartOpen(true)}>
              購入手続きへ
            </button>
          </div>
        </div>
      </div>

      {/* ===== ミニカート（ボトムバー“の上”にセンター表示） ===== */}
      {miniCartOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMiniCartOpen(false)} aria-hidden />
          <div
            className="absolute w-[min(960px,92vw)] bg-white rounded-2xl shadow-2xl p-4"
            style={{ left: "50%", transform: "translateX(-50%)", bottom: BOTTOM_BAR_HEIGHT + 12 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">カート</div>
              <button className="px-3 py-1 rounded border" onClick={() => setMiniCartOpen(false)}>
                閉じる
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-sm text-neutral-600 p-6 text-center">カートは空です。</div>
            ) : (
              <div className="mt-3 space-y-3 max-h-[40vh] overflow-auto">
                {cartItems.map((ci) => (
                  <div key={ci.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{ci.title}</div>
                        <div className="text-sm text-neutral-600">数量：{ci.qty}</div>
                        {ci.note && <div className="text-xs text-neutral-600 mt-1">備考：{ci.note}</div>}
                        {ci.extras.length > 0 && (
                          <ul className="text-xs list-disc ml-5 mt-1 space-y-1">
                            {ci.extras.map((e, i) => (
                              <li key={i}>
                                {e.label}：¥{fmt(e.amount)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm">小計：¥{fmt(lineTotal(ci))}</div>
                        <button
                          className="mt-2 px-2 py-1 rounded border text-xs"
                          onClick={() => removeFromCart(ci.id)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 合計表示：小計＋送料－割引＝合計（オプション＆割引を反映） */}
            <div className="mt-3 border-t pt-3 text-right space-y-1">
              <div>小計：¥{fmt(cartTotals.merchandise)}</div>
              <div>送料：{cartTotals.ship === 0 ? "¥0（無料）" : `¥${fmt(cartTotals.ship)}`}</div>
              <div className="text-lg font-semibold">合計：¥{fmt(cartTotals.total)}</div>
              <button className="mt-2 px-5 py-2 rounded-xl bg-black text-white">この内容で注文（ダミー）</button>
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[88px] z-50 px-4 py-2 rounded-xl bg-black text-white text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Shop;
