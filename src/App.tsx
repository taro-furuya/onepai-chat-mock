import React, { useEffect, useMemo, useRef, useState } from "react";
import NameTilePreview, {
  type Layout as PreviewLayout,
  type ColorKey as PreviewColor,
} from "./components/NameTilePreview";

// ==========================
// 型・ユーティリティ
// ==========================
type View = "shop" | "guidelines" | "corporate";
type Flow = "original_single" | "fullset" | "regular";

// 表示用ラベル
const suitLabel = (s: "manzu" | "souzu" | "pinzu") =>
  s === "manzu" ? "萬子" : s === "souzu" ? "索子" : "筒子";

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);

// 文字列を配列化
const splitChars = (s: string) => Array.from(s || "");

// ==========================
// 価格表
// ==========================
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
    keyholder: { priceIncl: 300 },
    design_submission_single: { priceIncl: 500 },
    design_submission_fullset: { priceIncl: 5000 },
    multi_color: { priceIncl: 200 },
    rainbow: { priceIncl: 800 },
    kiribako_4: { priceIncl: 1500 },
    bring_own_color_unit: { priceIncl: 200 },
  },
} as const;

// ==========================
// 小さめUI部品
// ==========================
const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className,
}) => (
  <section className={`rounded-2xl border shadow-sm bg-white p-4 md:p-6 ${className || ""}`}>
    {title && <h2 className="font-semibold mb-3">{title}</h2>}
    {children}
  </section>
);

const Pill: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
  type?: "button" | "submit" | "reset";
}> = ({ active, onClick, children, title, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    title={title}
    className={`px-3 py-1 rounded-xl text-sm border transition ${
      active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50"
    }`}
  >
    {children}
  </button>
);

const ProductCard: React.FC<{
  title: string;
  subtitle?: string;
  desc?: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ title, subtitle, desc, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-xl border p-4 transition hover:shadow ${
      active ? "border-black" : "border-neutral-200"
    }`}
  >
    <div className="text-base font-semibold">{title}</div>
    {subtitle && <div className="text-xs text-neutral-500 mt-0.5">{subtitle}</div>}
    {desc && <div className="text-[12px] text-neutral-700 mt-2">{desc}</div>}
  </button>
);

// ==========================
// 本体
// ==========================
export default function App() {
  // --- ビュー切替（location.hash と同期） ---
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

  // --- スクロール参照 ---
  const selectRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
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

  // --- ステート群 ---
  const [flow, setFlow] = useState<Flow>("original_single");
  const [originalSub, setOriginalSub] = useState<"single" | "fullset">("single");
  const [variant, setVariant] = useState<"standard" | "mm30" | "default">("standard");

  // デザイン
  const [designType, setDesignType] = useState<"name_print" | "bring_own" | "commission">("name_print");
  const [text, setText] = useState("麻雀");
  const [layout, setLayout] = useState<PreviewLayout>("vertical");

  // 色（プレビュー用）
  const [useUnifiedColor, setUseUnifiedColor] = useState(true);
  const [unifiedColor, setUnifiedColor] = useState<PreviewColor>("black");
  const [perCharColors, setPerCharColors] = useState<PreviewColor[]>(["black", "black", "black", "black"]);

  // 持ち込み時の色数
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);

  // オプション
  const [keyholder, setKeyholder] = useState(false);
  const [kiribako4, setKiribako4] = useState(false);

  // 通常牌
  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<"honor" | "manzu" | "souzu" | "pinzu">("honor");
  const [regularNumber, setRegularNumber] = useState(1);
  const [regularHonor, setRegularHonor] = useState<"東" | "南" | "西" | "北" | "白" | "發" | "中">("東");

  // 数量
  const [qty, setQty] = useState(1);

  // アップロード
  const [uploadSummary, setUploadSummary] = useState("");
  const [imagePreviews, setImagePreviews] = useState<
    Array<{ src: string; name: string; type: "image" | "file" }>
  >([]);

  // 下部トースト
  const [toast, setToast] = useState<string | null>(null);

  // --- 依存制御 ---
  useEffect(() => {
    if (flow === "regular") {
      if (variant !== "default") setVariant("default");
      if (designType !== "name_print") setDesignType("name_print"); // 通常牌は名前入れUI以外無効
    } else {
      if (variant === "default") setVariant("standard");
      if (flow === "fullset" && designType === "name_print") setDesignType("bring_own");
      setOriginalSub(flow === "fullset" ? "fullset" : "single");
    }
  }, [flow, variant, designType]);

  // --- 価格計算 ---
  const effectiveVariant = (f: Flow, v: "standard" | "mm30" | "default") =>
    f === "regular" ? "default" : v === "default" ? "standard" : v;

  const baseUnit = useMemo(() => {
    const v = effectiveVariant(flow, variant);
    const obj: any = PRICING.products[flow as keyof typeof PRICING.products];
    return obj?.variants?.[v]?.priceIncl || 0;
  }, [flow, variant]);

  const optionPrice = useMemo(() => {
    let opt = 0;

    const isFull = flow === "fullset";
    const isSingle = flow === "original_single";

    // デザイン持ち込み料
    if (designType === "bring_own") {
      opt += isFull
        ? PRICING.options.design_submission_fullset.priceIncl
        : PRICING.options.design_submission_single.priceIncl;

      const extra = Math.max(0, (bringOwnColorCount || 1) - 1);
      if (extra > 0) opt += PRICING.options.bring_own_color_unit.priceIncl * extra;
    }

    // 名前入れ時の追加色
    if (isSingle && designType === "name_print") {
      if (useUnifiedColor) {
        if (unifiedColor === "rainbow") opt += PRICING.options.rainbow.priceIncl;
      } else {
        const uniq = Array.from(new Set(perCharColors));
        const add = Math.max(0, uniq.length - 1);
        if (add > 0) opt += PRICING.options.multi_color.priceIncl * add;
      }
    }

    // 桐箱（28mm単品 or 通常牌のみ）
    if (!isFull && kiribako4) {
      const ok = (flow === "original_single" && effectiveVariant(flow, variant) === "standard") || flow === "regular";
      if (ok) opt += PRICING.options.kiribako_4.priceIncl;
    }

    if (!isFull && keyholder) opt += PRICING.options.keyholder.priceIncl;

    return opt;
  }, [flow, variant, designType, bringOwnColorCount, useUnifiedColor, unifiedColor, perCharColors, keyholder, kiribako4]);

  const merchandiseSubtotal = baseUnit * Math.max(1, qty) + optionPrice;
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  // --- ファイル選択 ---
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

  // --- 商品名 ---
  const productTitle = useMemo(() => {
    const v = effectiveVariant(flow, variant);
    if (flow === "original_single") return `オリジナル麻雀牌（${v === "standard" ? "28mm" : "30mm"}）`;
    if (flow === "fullset") return `オリジナル麻雀牌（フルセット／${v === "standard" ? "28mm" : "30mm"}）`;
    const tile = regularSuit === "honor" ? regularHonor : `${regularNumber}${suitLabel(regularSuit)}`;
    const back = regularBack === "yellow" ? "黄色" : "青色";
    return `通常牌（28mm／背面:${back}／${tile}）`;
  }, [flow, variant, regularBack, regularSuit, regularNumber, regularHonor]);

  // --- 下部バー高さ ---
  const BOTTOM_BAR_HEIGHT = 72;

  // --- 追加：色選択UI（統一／個別） ---
  const COLOR_LIST: { key: PreviewColor; label: string; dot: string }[] = [
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

  // ==========================
  // 描画
  // ==========================
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
                <p className="text-neutral-200 text-xs md:text-sm mt-1">
                  チャットの流れで、そのままオリジナル麻雀牌を注文できるUIの試作です。
                </p>
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

      {/* ビュー：ショップ */}
      {activeView === "shop" && (
        <section className="max-w-5xl mx-auto mt-6 space-y-6">
          {/* 1. カテゴリ選択 */}
          <Card title="1. カテゴリを選択">
            <div ref={selectRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ProductCard
                title="オリジナル麻雀牌"
                subtitle="28mm / 30mm"
                desc="あなただけのオリジナル牌を作成。アクセサリーやギフトにおすすめ！"
                onClick={() => setFlow(originalSub === "fullset" ? "fullset" : "original_single")}
                active={flow !== "regular"}
              />
              <ProductCard
                title="通常牌（バラ売り）"
                subtitle="28mm"
                desc="通常牌も1枚からご購入可能。キーホルダー対応も！"
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

            {/* 注釈（選択に応じて切替） */}
            <div className="mt-3 text-xs text-neutral-600 space-y-1">
              {flow === "original_single" && (
                <>
                  <div>
                    発送目安：<b>約2〜3週間</b>
                  </div>
                  <div>
                    割引：<b>5個で10%</b> / <b>10個で15%</b>
                  </div>
                </>
              )}
              {flow === "fullset" && (
                <>
                  <div>
                    発送目安：<b>約3ヶ月</b>（<u>デザイン開発期間を除く</u>）
                  </div>
                  <div>
                    割引：<b>5セットで20%</b>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* 2. 分岐 */}
          {flow === "regular" ? (
            <Card title="2. 背面色と牌の選択（通常牌）">
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
                  {["東", "南", "西", "北", "白", "發", "中"].map((h) => (
                    <Pill key={h} active={regularHonor === (h as any)} onClick={() => setRegularHonor(h as any)}>
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
              <div className="mt-4">
                <div className="text-xs text-neutral-600 space-y-1">
                  <div>※ 他の牌と混同しないようご注意ください。個人の鑑賞・コレクション用途を想定しています。</div>
                  <div>※ 製造ロット等により色味が異なる場合があります。</div>
                </div>
              </div>
            </Card>
          ) : (
            <Card title="2. デザイン確認">
              {/* デザイン方式 */}
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

              {/* 名前入れフォーム */}
              {designType === "name_print" && (
                <div className="grid md:grid-cols-2 gap-4 items-start mt-4">
                  {/* 入力カラム */}
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

                    {/* 色指定：統一 or 個別 */}
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

                      {/* 一括指定 */}
                      {useUnifiedColor ? (
                        <div className="flex flex-wrap gap-2 pl-24">
                          {COLOR_LIST.map((c) => (
                            <Pill
                              key={c.key}
                              active={unifiedColor === c.key}
                              onClick={() => setUnifiedColor(c.key)}
                              title={c.label}
                            >
                              {renderColorDot(c.dot)}
                              {c.label}
                            </Pill>
                          ))}
                        </div>
                      ) : (
                        // 個別指定（全選択肢を展開）
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
                                    title={`${ch}の色を${c.label}にする`}
                                  >
                                    {renderColorDot(c.dot)}
                                    {c.label}
                                  </Pill>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* プレビューカラム */}
                  <div>
                    <NameTilePreview
                      text={text || "麻雀"}
                      layout={layout}
                      useUnifiedColor={useUnifiedColor}
                      unifiedColor={unifiedColor}
                      perCharColors={perCharColors}
                    />
                    <div className="text-xs text-neutral-500 mt-2">
                      ※ 全角4文字を超えると自動で2段に分割します（縦：右→左、横：上→下）。
                    </div>
                  </div>
                </div>
              )}

              {/* デザイン持ち込み */}
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
                        <span className="text-xs text-neutral-600">※ 追加1色ごとに+¥200</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* デザイン依頼 */}
              {designType === "commission" && (
                <p className="text-xs text-neutral-600 mt-4">※デザイン料は別途お見積りとなります。</p>
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

              {/* 対応機種（アコーディオン） */}
              <details className="mt-3">
                <summary className="cursor-pointer select-none text-sm font-medium">対応機種（28mmを選択時のみ表示）</summary>
                {variant === "standard" && (
                  <div className="mt-2 grid md:grid-cols-2 gap-3 text-xs text-neutral-700">
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
                  </div>
                )}
              </details>
            </Card>
          )}

          {/* 4. オプション・見積もり */}
          <Card title="4. オプション・見積もり">
            <div className="grid md:grid-cols-2 gap-4">
              {/* オプション（切替） */}
              <div className="space-y-3">
                <div className="text-sm font-medium">オプション</div>

                {flow !== "fullset" && (
                  <div className="flex items-center gap-2">
                    <input
                      id="opt-keyholder"
                      type="checkbox"
                      checked={keyholder}
                      onChange={(e) => setKeyholder(e.target.checked)}
                    />
                    <label htmlFor="opt-keyholder" className="text-sm">
                      キーホルダー（+¥{fmt(PRICING.options.keyholder.priceIncl)}）
                    </label>
                  </div>
                )}

                {((flow === "original_single" && variant === "standard") || flow === "regular") && (
                  <div className="flex items-center gap-2">
                    <input
                      id="opt-kiribako"
                      type="checkbox"
                      checked={kiribako4}
                      onChange={(e) => setKiribako4(e.target.checked)}
                    />
                    <label htmlFor="opt-kiribako" className="text-sm">
                      桐箱（4枚用 / +¥{fmt(PRICING.options.kiribako_4.priceIncl)}）
                    </label>
                  </div>
                )}

                {/* 適用される追加費用の表示だけ（計算は optionPrice 側で実施） */}
                <div className="text-xs text-neutral-600">
                  <ul className="list-disc ml-5 space-y-1">
                    {designType === "bring_own" && (
                      <>
                        <li>持ち込みデザイン料：{flow === "fullset" ? "¥5,000" : "¥500"}</li>
                        {Math.max(1, bringOwnColorCount) > 1 && (
                          <li>
                            追加色 {Math.max(1, bringOwnColorCount) - 1}色：+¥
                            {fmt(PRICING.options.bring_own_color_unit.priceIncl * (Math.max(1, bringOwnColorCount) - 1))}
                          </li>
                        )}
                      </>
                    )}
                    {designType === "name_print" &&
                      (useUnifiedColor ? (
                        unifiedColor === "rainbow" ? <li>レインボー：+¥{fmt(PRICING.options.rainbow.priceIncl)}</li> : null
                      ) : (
                        (() => {
                          const uniq = Array.from(new Set(perCharColors));
                          const add = Math.max(0, uniq.length - 1);
                          return add > 0 ? <li>追加色 {add}色：+¥{fmt(PRICING.options.multi_color.priceIncl * add)}</li> : null;
                        })()
                      ))}
                  </ul>
                </div>
              </div>

              {/* 見積 */}
              <div>
                <div className="text-sm font-medium mb-2">見積</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 text-neutral-600">商品</td>
                      <td className="py-1 text-right">¥{fmt(baseUnit)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-neutral-600">オプション</td>
                      <td className="py-1 text-right">¥{fmt(optionPrice)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-neutral-600">数量</td>
                      <td className="py-1 text-right">× {qty}</td>
                    </tr>
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

                <div className="flex items-center gap-2 mt-3">
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
            </div>
          </Card>
        </section>
      )}

      {/* ビュー：入稿規定 */}
      {activeView === "guidelines" && (
        <section className="max-w-5xl mx-auto mt-6">
          <Card title="入稿規定">
            <ul className="list-disc ml-5 space-y-1 text-sm text-neutral-800">
              <li>推奨形式：AI / PDF（アウトライン化）/ PSD / PNG・JPG（解像度300dpi以上）</li>
              <li>
                デザインデータは<strong>白黒二値化</strong>したものでご用意ください。
              </li>
              <li>
                細すぎる線などは潰れてしまうため、最小の線幅は<strong>0.3mm以上</strong>としてください。※デザインによっては、ご入稿後に調整させていただく可能性がございます。
              </li>
              <li>白色以外の色が隣接する場合は、色と色の間に<strong>凸部</strong>を作る必要がございます。</li>
              <li>素材となる麻雀牌の製造時についた小傷が残ってしまう場合があります。ご了承ください。</li>
            </ul>

            <h3 className="font-semibold mt-6 mb-1">著作権・各種権利</h3>
            <p className="text-sm text-neutral-800">
              お客様からご注文いただいた印刷デザインは、第三者の著作権・肖像権・商標権・意匠権、その他の法的権利を何ら侵害しないものとみなし、万一権利者と争いが生じた場合も弊社は一切その責任を負いません。
            </p>
          </Card>
        </section>
      )}

      {/* ビュー：法人問い合わせ */}
      {activeView === "corporate" && (
        <section className="max-w-5xl mx-auto mt-6">
          <Card title="法人向けお問い合わせ">
            <p className="text-sm text-neutral-600 mb-3">製作ロット・お見積もり・納期のご相談はこちらから。</p>
            <form className="grid md:grid-cols-2 gap-2" onSubmit={(e) => e.preventDefault()}>
              <input className="border rounded px-3 py-2" placeholder="会社名" />
              <input className="border rounded px-3 py-2" placeholder="ご担当者名" />
              <input className="border rounded px-3 py-2 md:col-span-2" placeholder="メールアドレス" />
              <textarea className="border rounded px-3 py-2 md:col-span-2 h-24" placeholder="お問い合わせ内容" />
              <div className="md:col-span-2 flex justify-end">
                <button type="button" className="px-4 py-2 rounded-xl bg-black text-white">
                  送信（ダミー）
                </button>
              </div>
            </form>
          </Card>
        </section>
      )}

      {/* 下部固定バー */}
      <div
        style={{ height: BOTTOM_BAR_HEIGHT }}
        className="fixed left-0 right-0 bottom-0 z-30 bg-white/95 border-t backdrop-blur"
      >
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">{productTitle}</div>
            <div className="text-neutral-600">合計 ¥{fmt(total)}（送料{shipping === 0 ? "0円" : `${fmt(shipping)}円`}）</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border"
              onClick={() => {
                setToast("カートに追加（ダミー）しました。");
                setTimeout(() => setToast(null), 1800);
              }}
            >
              カートに追加
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-black text-white"
              onClick={() => window.open("https://checkout.shopify.com/mock", "_blank")}
            >
              購入手続きへ
            </button>
          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[88px] z-40 px-4 py-2 rounded-xl bg-black text-white text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
