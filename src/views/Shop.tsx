import React, { useMemo, useState } from "react";
import Accordion from "../components/Accordion";
import { NameTilePreview, RegularTilePreview, mapColor, ColorKey } from "../components/TilePreviews";

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const PALETTE: ColorKey[] = ["black", "red", "blue", "green", "pink", "rainbow"];
const HONORS = ["東","南","西","北","白","發","中"] as const;

const PRICING = {
  shipping: { flat: 390, freeOver: 5000 },
  products: {
    original_single: { variants: { standard: 1980, mm30: 2700 } },
    fullset: { variants: { standard: 206700, mm30: 206700 } },
    regular: { variants: { default: 550 } },
  },
  options: {
    keyholder: 300,
    design_submission_single: 500,
    design_submission_fullset: 5000,
    multi_color: 200,
    rainbow: 800,
    kiribako_4: 1500,
    bring_own_color_unit: 200,
  },
} as const;

const ACCEPT = ["image/*","application/pdf",".psd",".ai",".tiff",".tif",".heic",".jpg",".jpeg",".png"].join(",");

const FONT_OPTIONS = [
  { key: "manzu", label: "萬子風（TA風雅筆）", stack: 'ta-fuga-fude, "TA風雅筆", "TA-Fugafude", YuKyokasho, "Hiragino Mincho ProN", "Yu Mincho", serif' },
  { key: "gothic", label: "ゴシック", stack: 'system-ui, -apple-system, "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif' },
  { key: "mincho", label: "明朝", stack: '"Yu Mincho", "Hiragino Mincho ProN", serif' },
  { key: "gyosho", label: "行書体", stack: '"HG行書体","HGP行書体","Klee One", YuKyokasho, cursive' },
] as const;
type FontKey = typeof FONT_OPTIONS[number]["key"];

const machines28 = ["AMOS REXX","AMOS REXX2","AMOSアルティマ","AMOSセヴィア","AMOSセヴィアHD","AMOSヴィエラ","AMOSシャルム","AMOSジョイ","AMOSキューブ","AMOSキューブHD","ニンジャB4 HD","ニンジャB4 STANDARD"];
const machines30 = ["AMOS JP2","AMOS JPEX","AMOS JPCOLOR","AMOS JPDG"];

function allocate(values: number[], rate: number) {
  if (rate <= 0) return values.map(() => 0);
  const total = values.reduce((a,b)=>a+b,0);
  const target = Math.floor(total * rate);
  const floors = values.map(v=>Math.floor(v*rate));
  let rest = target - floors.reduce((a,b)=>a+b,0);
  const order = values.map((v,i)=>({i,rem:v*rate-floors[i]})).sort((a,b)=>b.rem-a.rem);
  const out = floors.slice();
  for (let k=0;k<order.length && rest>0;k++){ out[order[k].i]+=1; rest--; }
  return out;
}

export default function Shop() {
  // Flow
  type Flow = "original_single" | "fullset" | "regular";
  const [flow, setFlow] = useState<Flow>("original_single");
  type VariantKey = "standard" | "mm30" | "default";
  const [variant, setVariant] = useState<VariantKey>("standard");
  const [originalSub, setOriginalSub] = useState<"single"|"fullset">("single");

  // デザイン
  const [designType, setDesignType] = useState<"name_print"|"bring_own"|"commission">("name_print");
  const [fontKey, setFontKey] = useState<FontKey>("manzu");
  const [text, setText] = useState("一刀");
  const [layout, setLayout] = useState<"vertical"|"horizontal">("vertical");
  const [usePerChar, setUsePerChar] = useState(true);
  const [colorsPerChar, setColorsPerChar] = useState<ColorKey[]>(["black"]);
  const [bringOwnColorCount, setBringOwnColorCount] = useState(1);

  // 通常牌
  const [regularBack, setRegularBack] = useState<"yellow"|"blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor"|"manzu"|"souzu"|"pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<(typeof HONORS)[number]>("東");

  // オプション
  const [keyholder, setKeyholder] = useState(false);
  const [kiribako4, setKiribako4] = useState(false);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // ファイル（ダミー表示のみ）
  const [uploadSummary, setUploadSummary] = useState("");
  const [imagePreviews, setImagePreviews] = useState<Array<{src:string; name:string; type:"image"|"file"}>>([]);

  // カート
  type CartItem = { title: string; detail: string; priceIncl: number; flow: Flow; variant: VariantKey; qty: number; };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string|null>(null);

  // ガード
  if (flow === "regular" && variant !== "default") setVariant("default");
  if (flow !== "regular" && variant === "default") setVariant("standard");
  if (flow === "fullset" && designType === "name_print") setDesignType("bring_own");
  if (flow === "fullset" && originalSub !== "fullset") setOriginalSub("fullset");

  const effVariant: VariantKey = flow === "regular" ? "default" : variant;

  const buildColors = (len: number): ColorKey[] => {
    if (usePerChar) {
      const out = colorsPerChar.slice();
      while (out.length < len) out.push(out[0] ?? "black");
      return out.slice(0, len);
    } else {
      const c = colorsPerChar[0] ?? "black";
      return Array(len).fill(c) as ColorKey[];
    }
  };

  const priceUnit = useMemo(() => {
    const v = PRICING.products[flow].variants as any;
    return v[effVariant];
  }, [flow, effVariant]);

  // 見積
  const estimate = useMemo(() => {
    const unit = priceUnit;
    const base = unit * qty;
    let option = 0;
    const items: {label:string; price:number}[] = [];

    const dt = designType;
    if (flow === "original_single" && dt === "bring_own") {
      option += PRICING.options.design_submission_single;
      items.push({label:"デザイン持ち込み", price: PRICING.options.design_submission_single});
    }
    if (flow === "fullset" && dt === "bring_own") {
      option += PRICING.options.design_submission_fullset;
      items.push({label:"デザイン持ち込み（フルセット）", price: PRICING.options.design_submission_fullset});
    }

    if (dt === "bring_own") {
      const extra = Math.max(0, bringOwnColorCount - 1);
      if (extra > 0) {
        const add = PRICING.options.bring_own_color_unit * extra;
        option += add;
        items.push({label:`持ち込み色数（追加${extra}色）`, price: add});
      }
    }

    if (flow === "original_single" && dt === "name_print") {
      const colors = buildColors(text.length);
      const uniq = [...new Set(colors)];
      if (uniq.includes("rainbow")) {
        option += PRICING.options.rainbow;
        items.push({label:"レインボー（レインボー）", price: PRICING.options.rainbow});
      } else if (uniq.length > 1) {
        const add = PRICING.options.multi_color * (uniq.length - 1);
        option += add;
        items.push({label:`複数色（追加${uniq.length - 1}色）`, price: add});
      }
    }

    if (flow !== "fullset" && keyholder) {
      option += PRICING.options.keyholder;
      items.push({label:"キーホルダー", price: PRICING.options.keyholder});
    }
    if (flow !== "fullset" && kiribako4) {
      const ok = (flow === "original_single" && effVariant === "standard") || flow === "regular";
      if (ok) {
        option += PRICING.options.kiribako_4;
        items.push({label:"桐箱（4枚用）", price: PRICING.options.kiribako_4});
      }
    }

    const merchandise = base + option;
    const shipping = merchandise >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
    return { base, option, shipping, total: merchandise + shipping, optionItems: items };
  }, [priceUnit, qty, designType, flow, effVariant, keyholder, kiribako4, text, bringOwnColorCount, usePerChar, colorsPerChar]);

  // タイトル/明細
  const productTitle = useMemo(() => {
    if (flow === "original_single") return `オリジナル麻雀牌（${effVariant === "standard" ? "28mm" : "30mm"}）`;
    if (flow === "fullset") return `オリジナル麻雀牌（フルセット／${effVariant === "standard" ? "28mm" : "30mm"}）`;
    const tile = regularSuit === "honor" ? regularHonor : `${regularNumber}${regularSuit === "manzu" ? "萬子" : regularSuit === "souzu" ? "索子" : "筒子"}`;
    const back = regularBack === "yellow" ? "黄色" : "青色";
    return `通常牌（28mm／背面:${back}／${tile}）`;
  }, [flow, effVariant, regularSuit, regularHonor, regularNumber, regularBack]);

  const buildDetail = (): string => {
    const parts: string[] = [];
    parts.push(`数量: ${qty}`);
    if (flow !== "regular") {
      if (designType === "name_print") {
        parts.push(`デザイン: 名前入れ（${layout === "vertical" ? "縦" : "横"}）`);
        if (text) parts.push(`文字: ${text}`);
        const uniq = [...new Set(buildColors(text.length))];
        parts.push(`色: ${uniq.map(c => c === "rainbow" ? "レインボー" : c === "black" ? "黒" : c === "red" ? "赤" : c === "blue" ? "青" : c === "green" ? "緑" : "ピンク").join(" / ")}`);
      }
      if (designType === "bring_own") {
        parts.push("デザイン: 持ち込み");
        parts.push(`色数: ${bringOwnColorCount}色`);
      }
      if (designType === "commission") parts.push("デザイン: 依頼（デザイン料は別途お見積り）");
    } else {
      parts.push(`背面: ${regularBack === "yellow" ? "黄色" : "青色"}`);
    }
    if (note.trim()) parts.push(`備考: ${note.trim()}`);
    return parts.join("\n");
  };

  // ディスカウント（行按分）
  const calcCartDiscount = (items: CartItem[]) => {
    const singles = items.filter(i=>i.flow==="original_single");
    const fulls   = items.filter(i=>i.flow==="fullset");
    const rateSingle = singles.reduce((n,i)=>n+i.qty,0) >= 10 ? 0.15 : singles.reduce((n,i)=>n+i.qty,0) >= 5 ? 0.1 : 0;
    const rateFull   = fulls.reduce((n,i)=>n+i.qty,0) >= 5 ? 0.2 : 0;
    const singleSub  = singles.reduce((s,i)=>s+i.priceIncl,0);
    const fullSub    = fulls.reduce((s,i)=>s+i.priceIncl,0);
    const discount   = Math.floor(singleSub*rateSingle)+Math.floor(fullSub*rateFull);
    const notes = [rateSingle>0?`オリジナル麻雀牌${Math.round(rateSingle*100)}%`:"", rateFull>0?`フルセット${Math.round(rateFull*100)}%`:""].filter(Boolean).join("／");
    return {discount, notes, rateSingle, rateFull};
  };

  const perItemDiscounts = (items: CartItem[]) => {
    const {rateSingle, rateFull} = calcCartDiscount(items);
    const singles = items.map((it,idx)=>({it,idx})).filter(x=>x.it.flow==="original_single");
    const fulls   = items.map((it,idx)=>({it,idx})).filter(x=>x.it.flow==="fullset");
    const singleAlloc = allocate(singles.map(s=>s.it.priceIncl), rateSingle);
    const fullAlloc   = allocate(fulls.map(f=>f.it.priceIncl), rateFull);
    const map = items.map(()=>0);
    singles.forEach((row,i)=>map[row.idx]=singleAlloc[i]||0);
    fulls.forEach((row,i)=>map[row.idx]=fullAlloc[i]||0);
    return map;
  };

  const colorCycle = (c: ColorKey): ColorKey => PALETTE[(PALETTE.indexOf(c)+1)%PALETTE.length];

  // ファイル選択（ダミー表示）
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews: Array<{src:string;name:string;type:"image"|"file"}> = [];
    files.forEach(f=>{
      if (f.type.startsWith("image/") && f.type !== "image/heic") {
        previews.push({ src: URL.createObjectURL(f), name: f.name, type: "image" });
      } else {
        previews.push({ src: "", name: f.name, type: "file" });
      }
    });
    setImagePreviews(previews);
    setUploadSummary(files.length ? `${files.length} ファイルを読み込みました\n${files.slice(0,5).map(f=>f.name).join("\n")}${files.length>5?"\n…":""}` : "対応形式のファイルが選択されていません。");
  };

  // カート操作
  const handleAddToCart = () => {
    const linePrice = estimate.base + estimate.option;
    const item: CartItem = {
      title: productTitle,
      detail: buildDetail(),
      priceIncl: linePrice,
      flow,
      variant: effVariant,
      qty,
    };
    const next = [...cartItems, item];
    setCartItems(next);
    const { discount } = calcCartDiscount(next);
    const subAfter = next.reduce((s,i)=>s+i.priceIncl,0) - discount;
    const remain = Math.max(0, PRICING.shipping.freeOver - subAfter);
    setToast(remain>0 ? `カートに追加しました。あと¥${fmt(remain)}で送料無料！` : "カートに追加しました。送料無料です！");
    setTimeout(()=>setToast(null), 2200);
  };

  const handleCheckout = () => {
    const {discount} = calcCartDiscount(cartItems);
    const discountedSubtotal = Math.max(0, cartItems.reduce((s,i)=>s+i.priceIncl,0)-discount);
    const shipping = discountedSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
    const total = discountedSubtotal + shipping;
    const mockUrl = `https://checkout.shopify.com/mock?subtotal=${discountedSubtotal}&discount=${discount}&shipping=${shipping}&total=${total}`;
    if (typeof window !== "undefined") window.open(mockUrl, "_blank");
  };

  // 集計（ボトムバー表示用）
  const {discount, notes} = calcCartDiscount(cartItems);
  const perDiscounts = perItemDiscounts(cartItems);
  const discountedSubtotal = Math.max(0, cartItems.reduce((s,i)=>s+i.priceIncl,0) - discount);
  const shippingFee = discountedSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const payable = discountedSubtotal + shippingFee;

  // UI
  return (
    <section className="space-y-6">
      {/* 1. カテゴリ */}
      <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">1. カテゴリを選択</h2>

        <div className="grid md:grid-cols-2 gap-3">
          <button
            className={`text-left rounded-xl border p-3 ${flow !== "regular" ? "ring-2 ring-black/70" : ""}`}
            onClick={() => setFlow(originalSub === "fullset" ? "fullset" : "original_single")}
          >
            <div className="font-medium">オリジナル麻雀牌</div>
            <div className="text-xs text-neutral-500 mt-1">
              あなただけのオリジナル牌が作成できます。アクセサリーやギフトにおすすめ！
            </div>
          </button>

          <button
            className={`text-left rounded-xl border p-3 ${flow === "regular" ? "ring-2 ring-black/70" : ""}`}
            onClick={() => setFlow("regular")}
          >
            <div className="font-medium">通常牌（バラ売り）</div>
            <div className="text-xs text-neutral-500 mt-1">
              通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！
            </div>
          </button>
        </div>

        {flow !== "regular" && (
          <div className="mt-3">
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${originalSub==="single"?"bg-black text-white":"border"}`}
                onClick={() => { setOriginalSub("single"); setFlow("original_single"); }}
              >
                1つから
              </button>
              <button
                className={`px-3 py-1 rounded ${originalSub==="fullset"?"bg-black text-white":"border"}`}
                onClick={() => { setOriginalSub("fullset"); setFlow("fullset"); }}
              >
                フルセット
              </button>
            </div>
          </div>
        )}

        {/* 注釈（選択時のみ表示 & 注意と割引を分離） */}
        <div className="mt-3 text-xs space-y-1">
          {flow === "original_single" && (
            <>
              <div className="text-neutral-600">※ 発送目安：<b>約2〜3週間</b></div>
              <div className="text-neutral-500">割引：<b>5個で10%</b> / <b>10個で15%</b></div>
            </>
          )}
          {flow === "fullset" && (
            <>
              <div className="text-neutral-600">※ 発送目安：<b>約3ヶ月</b>（デザイン開発期間を除く）</div>
              <div className="text-neutral-500">割引：<b>5セットで20%</b></div>
            </>
          )}
          <div className="text-neutral-600">※ 金額はすべて<b>税込み</b>です。数量や受注状況で前後します。</div>
        </div>
      </div>

      {/* 2. 分岐 */}
      {flow === "regular" ? (
        <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3">2. 背面色と牌の選択（通常牌）</h2>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <label className="w-20">背面色</label>
            {(["yellow","blue"] as const).map((b)=>(
              <button key={b} className={`px-3 py-1 rounded ${regularBack===b?"bg-black text-white":"border"}`} onClick={()=>setRegularBack(b)}>
                {b==="yellow"?"黄色":"青色"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="w-20">種別</label>
            {(["honor","manzu","souzu","pinzu"] as const).map((s)=>(
              <button key={s} className={`px-3 py-1 rounded ${regularSuit===s?"bg-black text-white":"border"}`} onClick={()=>setRegularSuit(s)}>
                {s==="honor"?"字牌":s==="manzu"?"萬子":s==="souzu"?"索子":"筒子"}
              </button>
            ))}
          </div>

          {regularSuit==="honor" ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className="w-20">字牌</label>
              {HONORS.map(h=>(
                <button key={h} className={`px-3 py-1 rounded ${regularHonor===h?"bg-black text-white":"border"}`} onClick={()=>setRegularHonor(h)}>{h}</button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className="w-20">数字</label>
              {Array.from({length:9}).map((_,i)=>(
                <button key={i+1} className={`px-3 py-1 rounded ${regularNumber===i+1?"bg-black text-white":"border"}`} onClick={()=>setRegularNumber(i+1)}>{i+1}</button>
              ))}
            </div>
          )}

          <div className="mt-3">
            <RegularTilePreview suit={regularSuit} number={regularNumber} honor={regularHonor} back={regularBack} />
          </div>
        </div>
      ) : (
        <>
          {/* 2. デザイン確認 */}
          <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-3">2. デザイン確認</h2>

            <div className="flex gap-2 mb-3">
              {flow!=="fullset" && (
                <button className={`px-3 py-1 rounded ${designType==="name_print"?"bg-black text-white":"border"}`} onClick={()=>setDesignType("name_print")}>名前入れ</button>
              )}
              <button className={`px-3 py-1 rounded ${designType==="bring_own"?"bg-black text-white":"border"}`} onClick={()=>setDesignType("bring_own")}>デザイン持ち込み</button>
              <button className={`px-3 py-1 rounded ${designType==="commission"?"bg-black text-white":"border"}`} onClick={()=>setDesignType("commission")}>デザイン依頼</button>
            </div>

            {/* サイズ選択 */}
            <div className="flex gap-2 mb-3">
              <button className={`px-3 py-1 rounded ${effVariant==="standard"?"bg-black text-white":"border"}`} onClick={()=>setVariant("standard")}>28mm</button>
              <button className={`px-3 py-1 rounded ${effVariant==="mm30"?"bg-black text-white":"border"}`} onClick={()=>setVariant("mm30")}>30mm</button>
            </div>

            {designType==="name_print" && (
              <div className="grid md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="w-24">フォント</label>
                    <select value={fontKey} onChange={(e)=>setFontKey(e.target.value as FontKey)} className="border rounded px-3 py-2">
                      {FONT_OPTIONS.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-24">文字</label>
                    <input value={text} onChange={(e)=>setText(e.target.value)} className="border rounded px-3 py-2 w-60" placeholder="縦4文字／横半角4×2" />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-24">レイアウト</label>
                    <button className={`px-3 py-1 rounded ${layout==="vertical"?"bg-black text-white":"border"}`} onClick={()=>setLayout("vertical")}>縦</button>
                    <button className={`px-3 py-1 rounded ${layout==="horizontal"?"bg-black text-white":"border"}`} onClick={()=>setLayout("horizontal")}>横</button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="w-24">色の指定</label>
                      <button className={`px-3 py-1 rounded ${!usePerChar?"bg-black text-white":"border"}`} onClick={()=>setUsePerChar(false)}>単一色で進む</button>
                      <button className={`px-3 py-1 rounded ${usePerChar?"bg-black text-white":"border"}`} onClick={()=>setUsePerChar(true)}>1文字ずつ指定</button>
                    </div>

                    {usePerChar && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {Array.from(text || "").map((ch, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="px-2 py-1 rounded border"
                              style={{ color: mapColor((colorsPerChar[idx] ?? colorsPerChar[0] ?? "black") as ColorKey) }}
                              title="クリックで色を切替"
                              onClick={()=>{
                                const next = colorsPerChar.slice();
                                const cur = (next[idx] ?? next[0] ?? "black") as ColorKey;
                                next[idx] = (PALETTE[(PALETTE.indexOf(cur)+1)%PALETTE.length]);
                                setColorsPerChar(next);
                              }}
                            >
                              {ch || "・"}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-neutral-600">
                          文字の色: {Array.from(text || "").map((_,i)=> (colorsPerChar[i] ?? colorsPerChar[0] ?? "black")).join(" / ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <NameTilePreview
                    text={text}
                    layout={layout}
                    fontStack={FONT_OPTIONS.find(f=>f.key===fontKey)?.stack || ""}
                    colors={buildColors(text.length)}
                  />
                </div>
              </div>
            )}

            {designType==="bring_own" && (
              <div className="mt-4 space-y-4">
                <div className="text-sm text-neutral-700">
                  デザインファイルをアップロードしてください（複数可）。対応形式：{ACCEPT}
                </div>
                <input type="file" multiple accept={ACCEPT} onChange={onFilesSelected} className="block" />
                {uploadSummary && <pre className="text-xs text-neutral-600 whitespace-pre-wrap bg-neutral-50 p-2 rounded border">{uploadSummary}</pre>}
                {imagePreviews.length>0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {imagePreviews.map((f,i)=>(
                      <div key={i} className="border rounded p-2 text-xs">
                        {f.type==="image" ? <img src={f.src} alt={f.name} className="w-full h-24 object-cover rounded" /> : <div className="h-24 flex items-center justify-center bg-neutral-100 rounded">{f.name.split(".").pop()?.toUpperCase()} ファイル</div>}
                        <div className="mt-1 truncate" title={f.name}>{f.name}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="w-36">色数（白黒含まず）</label>
                  <input
                    type="number"
                    value={bringOwnColorCount}
                    onChange={(e)=>{ const v = Number(e.target.value); setBringOwnColorCount(Number.isFinite(v) && v>=1 ? Math.floor(v) : 1); }}
                    className="border rounded px-3 py-2 w-24"
                  />
                  <span className="text-sm text-neutral-600">色数: {Math.max(1, bringOwnColorCount)}色</span>
                </div>

                {/* 機種アコーディオン（選択サイズのみ開く） */}
                <Accordion title="対応機種（28mm）" openDefault={effVariant==="standard"}>
                  <ul className="list-disc ml-5 space-y-1">{machines28.map(m=><li key={m}>{m}</li>)}</ul>
                </Accordion>
                <Accordion title="対応機種（30mm）" openDefault={effVariant==="mm30"}>
                  <ul className="list-disc ml-5 space-y-1">{machines30.map(m=><li key={m}>{m}</li>)}</ul>
                </Accordion>

                <p className="text-xs text-neutral-600">※ デザイン持ち込み料（{flow==="fullset"?"¥5,000":"¥500"}）は自動で加算されます。</p>
              </div>
            )}

            {designType==="commission" && (
              <p className="mt-2 text-sm text-neutral-700">
                デザインのご依頼内容を備考にお書きください。担当デザイナーよりご連絡いたします（デザイン料は別途お見積り）。
              </p>
            )}
          </div>

          {/* 3. オプション/数量 */}
          <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-3">3. オプションと数量</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="w-24">キーホルダー</label>
                <input type="checkbox" checked={keyholder} onChange={(e)=>setKeyholder(e.target.checked)} />
                <span className="text-sm text-neutral-700">+¥300（フルセット以外）</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-24">桐箱（4枚用）</label>
                <input type="checkbox" checked={kiribako4} onChange={(e)=>setKiribako4(e.target.checked)} />
                <span className="text-sm text-neutral-700">+¥1,500（28mm単品/通常牌のみ）</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-24">数量</label>
                <input type="number" value={qty} onChange={(e)=>setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="border rounded px-3 py-2 w-24" />
              </div>
              <div className="flex items-start gap-3">
                <label className="w-24">備考</label>
                <textarea value={note} onChange={(e)=>setNote(e.target.value)} className="border rounded px-3 py-2 w-full h-24" placeholder="ご希望など（任意）" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* サマリー + プレビュー */}
      <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">見積サマリー</h2>
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            <div className="font-medium">{productTitle}</div>
            {estimate.optionItems.length>0 && (
              <ul className="text-sm text-neutral-700 list-disc ml-5">
                {estimate.optionItems.map((o,i)=><li key={i}>{o.label} +¥{fmt(o.price)}</li>)}
              </ul>
            )}
            <div className="text-sm">小計（商品）: ¥{fmt(estimate.base + estimate.option)} / 送料: ¥{fmt(estimate.shipping)}</div>
            <div className="text-lg font-semibold">
              お支払い目安: ¥{fmt(estimate.total)} <span className="text-sm text-neutral-500">（税込）</span>
            </div>
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
                fontStack={FONT_OPTIONS.find(f=>f.key===fontKey)?.stack || ""}
                colors={buildColors(text.length)}
              />
            )}
          </div>
        </div>
      </div>

      {/* カート */}
      <div className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-3">カート</h2>
        {cartItems.length===0 ? (
          <div className="text-sm text-neutral-600">カートは空です。</div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((it,i)=>(
              <div key={i} className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{it.title} × {it.qty}</div>
                  <div className="text-right">
                    <div>¥{fmt(it.priceIncl)}</div>
                    {perDiscounts[i] > 0 && <div className="text-xs text-red-600">-¥{fmt(perDiscounts[i])}</div>}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-neutral-600 mt-2">{it.detail}</pre>
              </div>
            ))}

            <div className="border-t pt-3 text-sm">
              <div className="flex justify-between"><span>小計</span><span>¥{fmt(cartItems.reduce((s,i)=>s+i.priceIncl,0))}</span></div>
              <div className="flex justify-between text-red-600"><span>割引{notes?`（${notes}）`:""}</span><span>-¥{fmt(discount)}</span></div>
              <div className="flex justify-between"><span>送料</span><span>¥{fmt(shippingFee)}</span></div>
              <div className="flex justify-between font-semibold text-lg mt-1"><span>お支払い合計</span><span>¥{fmt(payable)}</span></div>
              <div className="text-right mt-2">
                <button type="button" onClick={handleCheckout} className="px-4 py-2 rounded-xl bg-black text-white">チェックアウトへ</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full shadow">{toast}</div>)}

      {/* フッターバー（リンク削除済み） */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span>小計: ¥{fmt(discountedSubtotal)}</span>
            <span className="text-red-600">割引: -¥{fmt(discount)}</span>
            <span>送料: ¥{fmt(shippingFee)}</span>
          </div>
          <div className="font-semibold">合計: ¥{fmt(payable)}</div>
        </div>
      </div>
    </section>
  );
}
