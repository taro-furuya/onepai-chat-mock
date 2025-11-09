import React, { useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import NameTilePreview, { ColorKey, Layout } from "../components/NameTilePreview";
import RegularTilePreview from "../components/RegularTilePreview";
import Hero from "../components/Hero";

type Flow = "original_single" | "fullset" | "regular";
type FontKey = "ta-fuga-fude" | "gothic" | "mincho";

type CartItem = {
  id: string;
  title: string;
  qty: number;
  unit: number;
  optionUnit: number;
  discount: number;
  note?: string;
  extras: { label: string; unit: number }[];
};

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const splitChars = (s: string) => Array.from(s || "");

const PRICING = {
  shipping: { flat: 390, freeOver: 5000 },
  options: {
    keyholder: { priceIncl: 300, label: "キーホルダー" },
    design_submission_single: { priceIncl: 500, label: "持ち込み料（単品）" },
    design_submission_fullset: { priceIncl: 5000, label: "持ち込み料（フルセット）" },
    multi_color: { priceIncl: 200, label: "追加色" },
    rainbow: { priceIncl: 800, label: "レインボー" },
    kiribako_4: { priceIncl: 1500, label: "桐箱（4枚用）" },
    bring_own_color_unit: { priceIncl: 200, label: "持ち込み追加色（1色）" },
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

const renderColorBar = (css: string) => {
  const isGrad = css.startsWith("linear-gradient");
  return (
    <span
      aria-hidden
      className="inline-block mr-2 align-[-1px] rounded-sm"
      style={{
        width: 10,
        height: 14,
        background: isGrad ? undefined : css,
        backgroundImage: isGrad ? css : undefined,
        border: "1px solid #e5e7eb",
      }}
    />
  );
};

const BOTTOM_BAR_HEIGHT = 76;

const Shop: React.FC<{ gotoCorporate: () => void }> = ({ gotoCorporate }) => {
  const selectRef = useRef<HTMLDivElement | null>(null);
  const scrollToSelect = () => selectRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // フロー・バリアント
  const [flow, setFlow] = useState<Flow>("original_single");
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

  // 数量
  const [qty, setQty] = useState(1);

  // 持ち込み
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);
  const [files, setFiles] = useState<{ id: string; src: string; name: string; type: "image" | "file" }[]>([]);

  // オプション
  const [optKeyholder, setOptKeyholder] = useState(false);
  const [optKiribako4, setOptKiribako4] = useState(false);

  // ミニカート
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ----- 単価算出 -----
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
        amount: isFull
          ? PRICING.options.design_submission_fullset.priceIncl
          : PRICING.options.design_submission_single.priceIncl,
      });
      const add = Math.max(0, bringOwnColorCount - 1);
      if (add > 0) {
        out.push({
          label: `${PRICING.options.bring_own_color_unit.label} × ${add}`,
          amount: PRICING.options.bring_own_color_unit.priceIncl * add,
        });
      }
    }

    if (isSingle && designType === "name_print") {
      if (useUnifiedColor && unifiedColor === "rainbow") {
        out.push({ label: PRICING.options.rainbow.label, amount: PRICING.options.rainbow.priceIncl });
      } else if (!useUnifiedColor) {
        const uniq = Array.from(new Set(perCharColors));
        const add = Math.max(0, uniq.length - 1);
        if (add > 0) {
          out.push({
            label: `${PRICING.options.multi_color.label} × ${add}`,
            amount: PRICING.options.multi_color.priceIncl * add,
          });
        }
      }
    }

    if (!(flow === "fullset") && optKiribako4) {
      const ok = (flow === "original_single" && variant === "standard") || flow === "regular";
      if (ok) out.push({ label: PRICING.options.kiribako_4.label, amount: PRICING.options.kiribako_4.priceIncl });
    }
    if (!(flow === "fullset") && optKeyholder) {
      out.push({ label: PRICING.options.keyholder.label, amount: PRICING.options.keyholder.priceIncl });
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
    optKeyholder,
    optKiribako4,
  ]);

  const optionsUnit = extraDetails.reduce((s, d) => s + d.amount, 0);

  // 割引
  const discountRate = useMemo(() => {
    if (flow === "original_single") return qty >= 10 ? 0.15 : qty >= 5 ? 0.1 : 0;
    if (flow === "fullset") return qty >= 5 ? 0.2 : 0;
    return 0;
  }, [flow, qty]);

  const productSubtotal = productUnit * qty;
  const optionsSubtotal = optionsUnit * qty;
  const discountAmount = Math.floor((productSubtotal + optionsSubtotal) * discountRate);
  const merchandiseSubtotal = productSubtotal + optionsSubtotal - discountAmount;
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  const productTitle = useMemo(() => {
    if (flow === "regular") return `通常牌（28mm）`;
    return `オリジナル麻雀牌（${variant === "standard" ? "28mm" : "30mm"}${flow === "fullset" ? "／フルセット" : ""}）`;
  }, [flow, variant]);

  // ----- ファイル選択 -----
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

  // ----- カート追加（実データを持つ） -----
  const addToCart = () => {
    const item: CartItem = {
      id: cryptoRandom(),
      title: productTitle,
      qty,
      unit: productUnit,
      optionUnit: optionsUnit,
      discount: discountAmount,
      note,
      extras: extraDetails.map((d) => ({ label: d.label, unit: d.amount })),
    };
    setCartItems((prev) => [...prev, item]);
    setMiniCartOpen(true);
    setToast("カートに追加しました");
    setTimeout(() => setToast(null), 1200);
  };

  const lineTotal = (ci: CartItem) => ci.qty * (ci.unit + ci.optionUnit);

  // ----- UI -----
  return (
    <div style={{ paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}>
      <Hero onPrimary={scrollToSelect} onSecondary={gotoCorporate} />

      {/* 以降：カテゴリ〜見積（※前回と同等のUI。変更点は addToCart の呼び先だけ） */}
      {/* …（中略：前回お渡しした「カテゴリ」「デザイン」「サイズ」「数量」「オプション」セクションはそのまま） */}
      {/* ------------- ここでは最後の見積セクションだけ掲載 ------------- */}

      <section className="max-w-5xl mx-auto mt-6 space-y-6">
        {/* 見積 */}
        <Card title="6. 見積">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-neutral-600">商品（単価）</td>
                    <td className="py-1 text-right">¥{fmt(productUnit)}</td>
                  </tr>
                  {extraDetails.map((d, i) => (
                    <tr key={i}>
                      <td className="py-1 text-neutral-600">{d.label}（単価）</td>
                      <td className="py-1 text-right">¥{fmt(d.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1 text-neutral-600">数量</td>
                    <td className="py-1 text-right">× {qty}</td>
                  </tr>
                  <tr>
                    <td className="py-1">小計（商品+オプション）</td>
                    <td className="py-1 text-right">¥{fmt(productSubtotal + optionsSubtotal)}</td>
                  </tr>
                  {discountRate > 0 && (
                    <tr>
                      <td className="py-1 text-emerald-700 font-semibold">
                        割引（{flow === "fullset" ? "フルセット" : "オリジナル"} {Math.round(discountRate * 100)}%OFF）
                      </td>
                      <td className="py-1 text-right text-emerald-700 font-semibold">-¥{fmt(discountAmount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 font-semibold">小計</td>
                    <td className="py-1 text-right font-semibold">¥{fmt(merchandiseSubtotal)}</td>
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

            <div className="flex items-end justify-end gap-2">
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
                カートを見る
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-3">
            プレビューはイメージです。色味などは実際と異なる可能性がございます。
          </p>
        </Card>
      </section>

      {/* ボトムバー：画面下全面（中央に内容を寄せる） */}
      <div className="fixed left-0 right-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto h-[76px] px-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">{productTitle}</div>
            <div className="text-neutral-600">
              合計 ¥{fmt(total)}（送料{shipping === 0 ? "0円" : `${fmt(shipping)}円`}）
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-4 py-2 rounded-xl border" onClick={addToCart}>
              カートに追加
            </button>
            <button type="button" className="px-4 py-2 rounded-xl border" onClick={() => setMiniCartOpen(true)}>
              ミニカート
            </button>
            <button type="button" className="px-5 py-2 rounded-xl bg-black text-white" onClick={() => setMiniCartOpen(true)}>
              購入手続きへ
            </button>
          </div>
        </div>
      </div>

      {/* ミニカート：ボトムバーの“上”にセンター配置 */}
      {miniCartOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMiniCartOpen(false)} aria-hidden />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[min(640px,92vw)] bg-white rounded-2xl shadow-2xl p-4"
            style={{ bottom: BOTTOM_BAR_HEIGHT + 12 }}
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
              <div className="mt-3 space-y-3">
                {cartItems.map((ci) => (
                  <div key={ci.id} className="border rounded-lg p-3">
                    <div className="font-medium">{ci.title}</div>
                    <div className="text-sm text-neutral-600">数量：{ci.qty}</div>
                    {ci.note && <div className="text-xs text-neutral-600 mt-1">備考：{ci.note}</div>}
                    {ci.extras.length > 0 && (
                      <ul className="text-xs list-disc ml-5 mt-1 space-y-1">
                        {ci.extras.map((e, i) => (
                          <li key={i}>
                            {e.label}：¥{fmt(e.unit)}（単価）
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="text-right text-sm mt-1">小計：¥{fmt(lineTotal(ci))}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 border-t pt-3 text-right space-y-1">
              <div className="text-lg font-semibold">
                合計：¥
                {fmt(
                  cartItems.reduce((s, it) => s + lineTotal(it), 0) -
                    cartItems.reduce((s, it) => s + it.discount, 0)
                )}
              </div>
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

// 安全な乱数ID
function cryptoRandom() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0].toString(36);
  }
  return Math.random().toString(36).slice(2);
}
