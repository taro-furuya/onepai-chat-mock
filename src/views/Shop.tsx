import React, { useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import NameTilePreview, { ColorKey, Layout } from "../components/NameTilePreview";
import RegularTilePreview from "../components/RegularTilePreview";
import Hero from "../components/Hero";

type Flow = "original_single" | "fullset" | "regular";

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const splitChars = (s: string) => Array.from(s || "");

const PRICING = {
  shipping: { flat: 390, freeOver: 5000 },
  options: {
    keyholder: { priceIncl: 300, label: "キーホルダー" },
    design_submission_single: { priceIncl: 500, label: "持ち込み料（単品）" },
    design_submission_fullset: { priceIncl: 5000, label: "持ち込み料（フルセット）" },
    multi_color: { priceIncl: 200, label: "追加色" },
    rainbow: { priceIncl: 800, label: "レインボー" }, // ← 800円に統一
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
    regular: {
      variants: { default: { label: "28mm 牌（通常）", priceIncl: 550 } },
    },
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

const renderDot = (css: string) => {
  const isGrad = css.startsWith("linear-gradient");
  return (
    <span
      aria-hidden
      className="inline-block w-3.5 h-3.5 rounded-full mr-1 align-[-1px] border"
      style={isGrad ? { backgroundImage: css } : { background: css }}
    />
  );
};

const BOTTOM_BAR_HEIGHT = 76;

const Shop: React.FC<{
  gotoCorporate: () => void;
}> = ({ gotoCorporate }) => {
  const selectRef = useRef<HTMLDivElement | null>(null);
  const scrollToSelect = () => selectRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // フロー・バリアント
  const [flow, setFlow] = useState<Flow>("original_single");
  const [variant, setVariant] = useState<"standard" | "mm30" | "default">("standard");

  // デザイン
  const [designType, setDesignType] = useState<"name_print" | "bring_own" | "commission">("name_print");
  const [text, setText] = useState("麻雀");
  const [layout, setLayout] = useState<Layout>("vertical");
  const [note, setNote] = useState("");

  // 色
  const [useUnifiedColor, setUseUnifiedColor] = useState(true);
  const [unifiedColor, setUnifiedColor] = useState<ColorKey>("black");
  const [perCharColors, setPerCharColors] = useState<ColorKey[]>(["black", "black", "black", "black"]);

  // 数量はサイズ選択の直後に
  const [qty, setQty] = useState(1);

  // 持ち込み
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);
  const [files, setFiles] = useState<{ id: string; src: string; name: string; type: "image" | "file" }[]>([]);

  // オプション
  const [optKeyholder, setOptKeyholder] = useState(false);
  const [optKiribako4, setOptKiribako4] = useState(false);

  // 通常牌のみ使うが保持
  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor" | "manzu" | "souzu" | "pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<"東" | "南" | "西" | "北" | "白" | "發" | "中">("東");

  // ミニカート
  const [cartOpen, setCartOpen] = useState(false);

  const productUnit = useMemo(() => {
    const table: any = PRICING.products[flow as keyof typeof PRICING.products];
    const v = flow === "regular" ? "default" : variant === "default" ? "standard" : variant;
    return table.variants[v].priceIncl as number;
  }, [flow, variant]);

  // 追加費用詳細
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
      if (useUnifiedColor) {
        if (unifiedColor === "rainbow") {
          out.push({ label: PRICING.options.rainbow.label, amount: PRICING.options.rainbow.priceIncl });
        }
      } else {
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

    if (!isFull && optKiribako4) {
      const ok = (flow === "original_single" && variant === "standard") || flow === "regular";
      if (ok) out.push({ label: PRICING.options.kiribako_4.label, amount: PRICING.options.kiribako_4.priceIncl });
    }

    if (!isFull && optKeyholder) {
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

  const optionsTotal = extraDetails.reduce((s, d) => s + d.amount, 0);

  // 割引率
  const discountRate = useMemo(() => {
    if (flow === "original_single") {
      if (qty >= 10) return 0.15;
      if (qty >= 5) return 0.1;
      return 0;
    }
    if (flow === "fullset") {
      if (qty >= 5) return 0.2;
      return 0;
    }
    return 0;
  }, [flow, qty]);

  const productSubtotal = productUnit * qty;
  const optionsSubtotal = optionsTotal * qty;
  const discountAmount = Math.floor((productSubtotal + optionsSubtotal) * discountRate);
  const merchandiseSubtotal = productSubtotal + optionsSubtotal - discountAmount;
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  const productTitle = useMemo(() => {
    if (flow === "regular") return `通常牌（28mm）`;
    return `オリジナル麻雀牌（${variant === "standard" ? "28mm" : "30mm"}${flow === "fullset" ? "／フルセット" : ""}）`;
  }, [flow, variant]);

  // ファイル選択
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

  return (
    <div style={{ paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}>
      <Hero onPrimary={scrollToSelect} onSecondary={gotoCorporate} />

      <section className="max-w-5xl mx-auto mt-6 space-y-6">
        {/* 1. カテゴリ */}
        <Card title="1. カテゴリを選択">
          <div ref={selectRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFlow("original_single");
                setDesignType("name_print");
              }}
              className={`text-left rounded-xl border p-4 transition hover:shadow ${
                flow !== "regular" ? "border-black" : "border-neutral-200"
              }`}
            >
              <div className="text-base font-semibold">オリジナル麻雀牌</div>
              <div className="text-xs text-neutral-500 mt-0.5">28mm / 30mm</div>
              <div className="text-[12px] text-neutral-700 mt-2">
                あなただけのオリジナル牌を作成。アクセサリーやギフトにおすすめ！
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFlow("regular");
                setDesignType("name_print");
              }}
              className={`text-left rounded-xl border p-4 transition hover:shadow ${
                flow === "regular" ? "border-black" : "border-neutral-200"
              }`}
            >
              <div className="text-base font-semibold">通常牌（バラ売り）</div>
              <div className="text-xs text-neutral-500 mt-0.5">28mm</div>
              <div className="text-[12px] text-neutral-700 mt-2">
                通常牌も1枚からご購入可能。キーホルダー対応も！
              </div>
            </button>
          </div>
        </Card>

        {/* 2. デザイン or 通常牌選択 */}
        {flow === "regular" ? (
          <Card title="2. 背面色と牌の選択（通常牌）">
            {/* 既存の通常牌UI（省略可） */}
            <RegularTilePreview />
          </Card>
        ) : (
          <Card title="2. デザイン">
            <div className="flex flex-wrap gap-2">
              {/* フルセットでは「名前入れ」を非表示 */}
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

                  {/* 色指定：統一or個別 */}
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
                      <div className="flex flex-wrap gap-2 pl-24">
                        {COLOR_LIST.map((c) => (
                          <Pill key={c.key} active={unifiedColor === c.key} onClick={() => setUnifiedColor(c.key)}>
                            {renderDot(c.dot)}
                            {c.label}
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
                                <Pill
                                  key={c.key}
                                  active={(perCharColors[idx] || "black") === c.key}
                                  onClick={() => {
                                    const arr = perCharColors.slice();
                                    arr[idx] = c.key;
                                    setPerCharColors(arr);
                                  }}
                                >
                                  {renderDot(c.dot)}
                                  {c.label}
                                </Pill>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 備考 */}
                  <div className="flex items-start gap-2">
                    <label className="w-24 mt-2">備考</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="border rounded px-3 py-2 w-full h-24"
                      placeholder="ご希望・注意点など（任意）"
                    />
                  </div>
                </div>

                <NameTilePreview
                  text={text || "麻雀"}
                  layout={layout}
                  useUnifiedColor={useUnifiedColor}
                  unifiedColor={unifiedColor}
                  perCharColors={perCharColors}
                />
              </div>
            )}

            {/* 持ち込み */}
            {designType === "bring_own" && (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-neutral-600">
                  デザイン持ち込み料（{flow === "fullset" ? "¥5,000" : "¥500"}）は自動計算されます。
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-medium mb-2">ファイル選択（複数可）</div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white cursor-pointer shadow">
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
                          <div key={p.id} className="relative text-center text-xs group">
                            {p.type === "image" ? (
                              <img src={p.src} alt={p.name} className="w-full h-24 object-cover rounded border" />
                            ) : (
                              <div className="w-full h-24 flex items-center justify-center border rounded bg-neutral-100 text-neutral-600">
                                {p.name.split(".").pop()?.toUpperCase()}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(p.id)}
                              className="absolute top-1 right-1 px-2 py-0.5 text-[11px] rounded bg-black/80 text-white opacity-0 group-hover:opacity-100"
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
                  </div>
                </div>
              </div>
            )}

            {designType === "commission" && (
              <p className="text-xs text-neutral-600 mt-4">※デザイン料は別途お見積りとなります。</p>
            )}
          </Card>
        )}

        {/* 3. サイズ選択（数量をここへ） */}
        {(flow === "original_single" || flow === "fullset") && (
          <Card title="3. サイズ選択">
            <div className="flex flex-wrap items-center gap-2">
              <Pill active={variant === "standard"} onClick={() => setVariant("standard")}>
                28mm
              </Pill>
              <Pill active={variant === "mm30"} onClick={() => setVariant("mm30")}>
                30mm
              </Pill>
              <div className="ml-4 flex items-center gap-2">
                <label className="text-sm">数量</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setQty(Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1);
                  }}
                  className="border rounded px-3 py-2 w-24"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>

            {/* 対応機種（選択サイズで出し分け） */}
            <details className="mt-3">
              <summary className="cursor-pointer select-none text-sm font-medium">対応機種</summary>
              <div className="mt-2 grid md:grid-cols-2 gap-3 text-xs text-neutral-700">
                {variant === "standard" ? (
                  <>
                    <div>
                      <div className="font-semibold mb-1">対応機種（28mm）</div>
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
                  </>
                ) : (
                  <>
                    <div>
                      <div className="font-semibold mb-1">対応機種（30mm）</div>
                      <ul className="list-disc ml-5 space-y-0.5">
                        <li>AMOS JP2</li>
                        <li>AMOS JPEX</li>
                        <li>AMOS JPCOLOR</li>
                        <li>AMOS JPDG</li>
                      </ul>
                      <p className="text-xs text-neutral-600 mt-1">※上記を含むJPシリーズに対応</p>
                    </div>
                  </>
                )}
              </div>
            </details>
          </Card>
        )}

        {/* 4. オプション（見積と分離して、押しやすいUI） */}
        <Card title="4. オプション">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setOptKeyholder((v) => !v)}
              className={`px-4 py-2 rounded-2xl border shadow-sm ${
                optKeyholder ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50"
              }`}
            >
              キーホルダー（+¥{fmt(PRICING.options.keyholder.priceIncl)}）
            </button>

            {((flow === "original_single" && variant === "standard") || flow === "regular") && (
              <button
                type="button"
                onClick={() => setOptKiribako4((v) => !v)}
                className={`px-4 py-2 rounded-2xl border shadow-sm ${
                  optKiribako4 ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50"
                }`}
              >
                桐箱 4枚用（+¥{fmt(PRICING.options.kiribako_4.priceIncl)}）
              </button>
            )}
          </div>
        </Card>

        {/* 5. 見積もり（明細・割引反映） */}
        <Card title="5. 見積">
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

            {/* ミニカート トリガー */}
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="px-5 py-3 rounded-2xl bg-black text-white shadow"
              >
                カートを見る
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* ボトムバー（中央寄せ） */}
      <div className="fixed left-0 right-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="max-w-3xl mx-auto h-[76px] px-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-semibold">{productTitle}</div>
            <div className="text-neutral-600">
              合計 ¥{fmt(total)}（送料{shipping === 0 ? "0円" : `${fmt(shipping)}円`}）
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border"
              onClick={() => setCartOpen(true)}
            >
              ミニカート
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-xl bg-black text-white"
              onClick={() => setCartOpen(true)}
            >
              購入手続きへ
            </button>
          </div>
        </div>
      </div>

      {/* ミニカート ドロワー */}
      {cartOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
            aria-hidden
          />
          <aside className="absolute right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-white shadow-2xl p-4 overflow-auto">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">カート</div>
              <button className="px-3 py-1 rounded border" onClick={() => setCartOpen(false)}>
                閉じる
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="border rounded-lg p-3">
                <div className="font-medium">{productTitle}</div>
                <div className="text-sm text-neutral-600">数量：{qty}</div>
                {note && <div className="mt-1 text-xs text-neutral-600">備考：{note}</div>}
                {extraDetails.length > 0 && (
                  <ul className="mt-2 text-xs list-disc ml-5 space-y-1">
                    {extraDetails.map((d, i) => (
                      <li key={i}>
                        {d.label}：¥{fmt(d.amount)}（×{qty}）
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 text-right text-sm">小計：¥{fmt(merchandiseSubtotal)}</div>
              </div>
            </div>

            <div className="mt-4 border-t pt-3 text-right space-y-1">
              {discountRate > 0 && (
                <div className="text-emerald-700">
                  割引：-¥{fmt(discountAmount)}（{Math.round(discountRate * 100)}%）
                </div>
              )}
              <div>送料：{shipping === 0 ? "¥0（送料無料）" : `¥${fmt(shipping)}`}</div>
              <div className="text-lg font-semibold">合計：¥{fmt(total)}</div>
              <button className="mt-2 px-5 py-2 rounded-xl bg-black text-white w-full">この内容で注文（ダミー）</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Shop;
