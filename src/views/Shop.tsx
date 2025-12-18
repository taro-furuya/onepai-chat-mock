import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Card from "../components/Card";
import Pill from "../components/Pill";
import NameTilePreview, { ColorKey, Layout } from "../components/NameTilePreview";
import RegularTilePreview, { RegularTileSelection } from "../components/RegularTilePreview";
import Hero from "../components/Hero";
import { computeEstimate, computeCartTotals, PRICING, type Flow } from "../utils/pricing";
import { asset, type HonorKey } from "../utils/asset";
import JudgeMeWidget from "../components/JudgeMeWidget";

/** ----------------- 型・定数 ----------------- */
type FontKey = "ta-fuga-fude" | "gothic" | "mincho";

type CartItem = {
  id: string;
  flow: Flow;
  title: string;
  qty: number;
  unit: number;          // 商品の単価
  optionTotal: number;   // そのアイテムに紐づくオプション合計（単価）
  note?: string;
  extras: { label: string; amount: number }[]; // オプション明細（単価×数まで展開済み）
  designSummary?: string;                      // デザインの要約
  thumbs?: string[];                           // 持ち込み画像のサムネURL
};

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);
const splitChars = (s: string) => Array.from(s || "");
const SUIT_SUFFIX: Record<"manzu" | "souzu" | "pinzu", string> = {
  manzu: "萬",
  souzu: "索",
  pinzu: "筒",
};
const HONOR_LIST: HonorKey[] = ["東", "南", "西", "北", "白", "發", "中"];
const KANJI_NUMBERS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
const RED_TILE_LABELS: Record<"manzu" | "souzu" | "pinzu", string> = {
  manzu: "五萬（赤）",
  souzu: "五索（赤）",
  pinzu: "五筒（赤）",
};
const SEASON_TILE_LABELS: Record<"spring" | "summer" | "autumn" | "winter", string> = {
  spring: "季節牌（春）",
  summer: "季節牌（夏）",
  autumn: "季節牌（秋）",
  winter: "季節牌（冬）",
};
const SEASON_HONOR_MAP: Record<"spring" | "summer" | "autumn" | "winter", HonorKey> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};
const containerStyle: React.CSSProperties = { maxWidth: "min(1024px, 92vw)", margin: "0 auto" };
const formRowClass = "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3";
const formRowContentClass = "flex flex-wrap gap-2";
const formLabelClass = "text-sm font-medium sm:w-24";
const BOTTOM_BAR_HEIGHT = 76;

const CASE_STUDIES = [
  {
    title: "周年記念ノベルティ",
    client: "麻雀カフェ 雀友 様",
    outcome:
      "常連向けの周年イベントで来店特典として配布。SNSハッシュタグ投稿が通常比で180％増加しました。",
  },
  {
    title: "展示会ブース装飾",
    client: "株式会社NEXT ENTERTAINMENT 様",
    outcome:
      "企業カラーをあしらった特大牌を制作し、来場者のフォトスポットとして活用。名刺交換率が1.6倍になりました。",
  },
  {
    title: "プロリーグ記念セット",
    client: "麻雀プロ協会 様",
    outcome:
      "優勝チームのメンバー名を刻印した限定セットを授与。ライブ配信視聴者からの問い合わせが多数寄せられました。",
  },
];

const FAQS = [
  {
    q: "納期はどれくらいかかりますか？",
    a: "デザイン確定後、単品は約2〜3週間、フルセットは約2〜3か月でお届けします。スケジュールに余裕を持ってご相談ください。",
  },
  {
    q: "データ入稿はどの形式に対応していますか？",
    a: "AI、PDF、PSD、PNG、JPGなど主要な形式に対応しています。解像度300dpi以上、白黒二値化したデータをご用意いただくと仕上がりが安定します。",
  },
  {
    q: "複数色を使用したい場合の追加料金は？",
    a: "2色目以降は1色追加ごとに¥200、レインボー指定は¥800の追加となります。お見積り時に自動で計算されます。",
  },
];

const COLOR_LIST: { key: ColorKey; label: string; css: string }[] = [
  { key: "black", label: "ブラック", css: "#0a0a0a" },
  { key: "red", label: "レッド", css: "#d10f1b" },
  { key: "blue", label: "ブルー", css: "#1e5ad7" },
  { key: "green", label: "グリーン", css: "#2e7d32" },
  { key: "pink", label: "ピンク", css: "#e24a86" },
  { key: "gold", label: "ゴールド", css: "#d8ad3d" },
  { key: "silver", label: "シルバー", css: "#b4bcc2" },
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

type StepperFieldProps = {
  value: string;
  onInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
  min?: number;
  max?: number;
};

const StepperField: React.FC<StepperFieldProps> = ({
  value,
  onInput,
  onIncrement,
  onDecrement,
  className = "",
  min,
  max,
}) => {
  const wrapperClass = ["inline-flex overflow-hidden rounded-xl border bg-white", className].filter(Boolean).join(" ");
  return (
    <div className={wrapperClass}>
      <input
        type="number"
        value={value}
        onChange={onInput}
        min={min}
        max={max}
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-full border-0 px-3 py-2 text-base focus:outline-none focus:ring-0"
      />
      <div className="flex flex-col border-l">
        <button
          type="button"
          onClick={onIncrement}
          className="flex-1 px-2 text-xs leading-tight hover:bg-neutral-50"
          aria-label="数量を増やす"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onDecrement}
          className="flex-1 px-2 text-xs leading-tight hover:bg-neutral-50"
          aria-label="数量を減らす"
        >
          ▼
        </button>
      </div>
    </div>
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
const Shop: React.FC = () => {
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
  const previewFrameStyle: React.CSSProperties =
    layout === "horizontal"
      ? { maxWidth: "min(520px, calc(100vw - 1.5rem))" }
      : { maxWidth: "min(360px, calc(100vw - 2.5rem))" };
  const previewSizeProps: { minWidth: number; maxWidth?: number } =
    layout === "horizontal" ? { minWidth: 220 } : { minWidth: 160, maxWidth: 240 };

  // 色
  const [useUnifiedColor, setUseUnifiedColor] = useState(true);
  const [unifiedColor, setUnifiedColor] = useState<ColorKey>("black");
  const [perCharColors, setPerCharColors] = useState<ColorKey[]>(["black", "black", "black", "black"]);

  // 通常牌
  const [regularBack, setRegularBack] = useState<"yellow" | "blue">("yellow");
  const [regularSuit, setRegularSuit] = useState<
    "honor" | "manzu" | "souzu" | "pinzu" | "red" | "season"
  >("honor");
  const [regularNumber, setRegularNumber] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);
  const [regularHonor, setRegularHonor] = useState<HonorKey>("東");
  const [regularRedSuit, setRegularRedSuit] = useState<"manzu" | "souzu" | "pinzu">("manzu");
  const [regularSeason, setRegularSeason] = useState<"spring" | "summer" | "autumn" | "winter">("spring");

  // 数量
  const [qty, setQty] = useState(1);
  const [qtyInput, setQtyInput] = useState("1");

  // 持ち込み
  const [bringOwnColorCount, setBringOwnColorCount] = useState<number>(1);
  const [bringOwnColorInput, setBringOwnColorInput] = useState("1");
  const [files, setFiles] = useState<{ id: string; src: string; name: string; type: "image" | "file" }[]>([]);

  // オプション（数量はメイン数量と独立）
  const [optKeyholderQty, setOptKeyholderQty] = useState<number>(0);
  const [optKiribakoQty, setOptKiribakoQty] = useState<number>(0);
  const [optKeyholderInput, setOptKeyholderInput] = useState("0");
  const [optKiribakoInput, setOptKiribakoInput] = useState("0");

  const regularPreviewProps = useMemo(
    () =>
      regularSuit === "season"
        ? {
            suit: "honor" as const,
            number: 1 as const,
            honor: SEASON_HONOR_MAP[regularSeason],
            aka5: false,
          }
        : regularSuit === "red"
        ? {
            suit: regularRedSuit,
            number: 5 as const,
            honor: "東" as HonorKey, // honorは未使用
            aka5: true,
          }
        : regularSuit === "honor"
        ? {
            suit: "honor" as const,
            number: 1 as const,
            honor: regularHonor,
            aka5: false,
          }
        : {
            suit: regularSuit,
            number: regularNumber,
            honor: "東" as HonorKey, // honorは未使用
            aka5: false,
          },
    [regularSuit, regularSeason, regularRedSuit, regularHonor, regularNumber]
  );

  const regularTileLabel = useMemo(() => {
    if (regularSuit === "honor") {
      return regularHonor;
    }
    if (regularSuit === "season") {
      return SEASON_TILE_LABELS[regularSeason];
    }
    if (regularSuit === "red") {
      return RED_TILE_LABELS[regularRedSuit];
    }
    return `${KANJI_NUMBERS[regularNumber - 1]}${SUIT_SUFFIX[regularSuit]}`;
  }, [regularHonor, regularRedSuit, regularNumber, regularSeason, regularSuit]);

  // ミニカート
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "error">("info");
  const toastTimerRef = useRef<number | null>(null);

  const syncKeyholderForQty = useCallback((nextQty: number) => {
    setOptKeyholderQty((prev) => Math.min(prev, nextQty));
    setOptKeyholderInput((prev) => {
      if (prev === "") return prev;
      const parsed = Number(prev);
      if (!Number.isFinite(parsed)) return prev;
      const normalized = Math.max(0, Math.floor(parsed));
      const clamped = Math.min(normalized, nextQty);
      return clamped === normalized ? prev : String(clamped);
    });
  }, []);

  const showToast = useCallback(
    (message: string, tone: "info" | "error" = "info") => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      setToastTone(tone);
      setToast(message);
      const duration = tone === "error" ? 2400 : 1500;
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, duration);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    syncKeyholderForQty(qty);
  }, [qty, syncKeyholderForQty]);

  /** フルセットでは「名前入れ」を非表示 → 自動で切替 */
  useEffect(() => {
    setOriginalSub((prev) => {
      const next = flow === "fullset" ? "fullset" : "single";
      return prev === next ? prev : next;
    });

    if (flow === "regular") {
      setVariant((prev) => (prev === "default" ? prev : "default"));
      setDesignType((prev) => (prev === "name_print" ? prev : "name_print"));
      return;
    }

    if (variant === "default") {
      setVariant((prev) => (prev === "default" ? "standard" : prev));
    }

    if (flow === "fullset") {
      setDesignType((prev) => (prev === "name_print" ? "bring_own" : prev));
    }
  }, [flow, variant, designType]);

  /** ----- 単価・オプション内訳（共通ロジック） ----- */
  const est = computeEstimate({
    flow,
    variant: flow === "regular" ? "default" : variant,
    qty,
    designType,
    useUnifiedColor,
    unifiedColor,
    perCharColors,
    nameText: text,
    bringOwnColorCount,
    optKeyholderQty,
    optKiribakoQty,
  });

  const productUnit = est.unit;
  const extraDetails = est.extras;
  const discountRate = est.discountRate;
  const discountAmount = est.discountAmount;
  const merchandiseSubtotal = est.merchandiseSubtotal;
  const shipping = est.shipping;
  const total = est.total;

  /** タイトル */
  const productTitle = useMemo(() => {
    if (flow === "regular") {
      const back = regularBack === "yellow" ? "黄色" : "青色";
      return `通常牌（28mm／背面:${back}／${regularTileLabel}）`;
    }
    return `オリジナル麻雀牌（${variant === "standard" ? "28mm" : "30mm"}${flow === "fullset" ? "／フルセット" : ""}）`;
  }, [flow, variant, regularBack, regularTileLabel]);

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

  /** デザイン要約 */
  const buildDesignSummary = (): string => {
    if (flow === "regular") return "通常牌の選択";
    if (designType === "name_print") {
      const layoutLabel = layout === "vertical" ? "縦" : "横";
      const fontLabel = fontKey === "ta-fuga-fude" ? "萬子風" : fontKey === "gothic" ? "ゴシック" : "明朝";
      const colorLabel = useUnifiedColor
        ? `色：一括（${unifiedColor}）`
        : `色：個別（${(text || "麻雀")
            .split("")
            .map((_, i) => (perCharColors[i] || "black"))
            .slice(0, Math.max(1, (text || "麻雀").length))
            .join("・")}）`;
      return `名前入れ／文字：「${text || "（未入力）"}」／${layoutLabel}／${fontLabel}／${colorLabel}`;
    }
    if (designType === "bring_own") {
      return `デザイン持ち込み（色数:${Math.max(1, bringOwnColorCount)}色／ファイル:${files.length}件）`;
    }
    return "デザイン依頼（別途お見積り）";
  };

  /** カート追加 */
  const addToCart = () => {
    const qtyValueRaw = qtyInput.trim();
    const qtyParsed = Number(qtyValueRaw);
    if (!qtyValueRaw || !Number.isFinite(qtyParsed) || qtyParsed < 1) {
      showToast("数量は1以上で入力してください", "error");
      return;
    }

    if (designType === "bring_own") {
      const bringOwnRaw = bringOwnColorInput.trim();
      const bringOwnParsed = Number(bringOwnRaw);
      if (!bringOwnRaw || !Number.isFinite(bringOwnParsed) || bringOwnParsed < 1) {
        showToast("色数は1以上で入力してください", "error");
        return;
      }
    }

    const kiribakoVisible = (flow === "original_single" && variant === "standard") || flow === "regular";
    if (optKeyholderInput.trim() === "" || (kiribakoVisible && optKiribakoInput.trim() === "")) {
      showToast("未入力のオプション数量があります", "error");
      return;
    }

    const item: CartItem = {
      id: cryptoRandom(),
      flow,
      title: productTitle,
      qty,
      unit: est.unit,
      optionTotal: est.optionTotal,
      note,
      extras: est.extras.map((d) => ({ label: d.label, amount: d.amount })),
      designSummary: buildDesignSummary(),
      thumbs: files.filter((f) => f.type === "image").map((f) => f.src),
    };
    setCartItems((prev) => [...prev, item]);
    setMiniCartOpen(true);
    showToast("カートに追加しました");
  };

  const removeFromCart = (id: string) =>
    setCartItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (next.length === 0) setMiniCartOpen(false); // すべて削除されたら閉じる
      return next;
    });

  /** ミニカート（全体合計：累計割引対応） */
  const cartTotals = useMemo(
    () =>
      computeCartTotals(
        cartItems.map((ci) => ({
          flow: ci.flow,
          qty: ci.qty,
          unit: ci.unit,
          optionTotal: ci.optionTotal ?? 0,
        }))
      ),
    [cartItems]
  );

  /** ----------------- UI ----------------- */
  return (
    <div style={{ paddingBottom: BOTTOM_BAR_HEIGHT + 16 }}>
      <Hero />

      <section style={containerStyle} className="mt-6 space-y-6">
        {/* 1. カテゴリ */}
        <Card title="1. カテゴリを選択">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* オリジナル麻雀牌 */}
            <button
              type="button"
              onClick={() => {
                setFlow(originalSub === "fullset" ? "fullset" : "original_single");
              }}
              className={`group relative text-left rounded-2xl border transition hover:shadow ${
                flow !== "regular" ? "border-black" : "border-neutral-200"
              } p-0 overflow-hidden`}
            >
              <div className="relative h-[180px] md:h-[220px]">
                <img
                  src={asset("category-original.jpg")}
                  alt="オリジナル麻雀牌"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="p-4">
                <div className="text-base font-semibold">オリジナル麻雀牌</div>
                <div className="mt-0.5 text-xs text-neutral-500">28mm / 30mm</div>
                <div className="mt-2 text-[12px] text-neutral-700">
                  あなただけのオリジナル牌を作成。アクセサリーやギフトにも最適です。
                </div>
              </div>
            </button>

            {/* 通常牌（バラ売り） */}
            <button
              type="button"
              onClick={() => setFlow("regular")}
              className={`group relative text-left rounded-2xl border transition hover:shadow ${
                flow === "regular" ? "border-black" : "border-neutral-200"
              } p-0 overflow-hidden`}
            >
              <div className="relative h-[180px] md:h-[220px]">
                <img
                  src={asset("category-regular.jpg")}
                  alt="通常牌（バラ売り）"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="p-4">
                <div className="text-base font-semibold">通常牌（バラ売り）</div>
                <div className="mt-0.5 text-xs text-neutral-500">28mm</div>
                <div className="mt-2 text-[12px] text-neutral-700">
                  通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！
                </div>
              </div>
            </button>
          </div>

          {/* 28/30mmや納期の注記（通常牌以外のときだけ表示） */}
          {flow !== "regular" && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <Pill
                  tone="indigo"
                  active={originalSub === "single"}
                  onClick={() => {
                    setOriginalSub("single");
                    setFlow("original_single");
                  }}
                >
                  1つから
                </Pill>
                <Pill
                  tone="indigo"
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
              <div className="mt-3 space-y-1 text-xs text-neutral-600">
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
                <div className={formRowClass}>
                  <label className={formLabelClass}>背面色</label>
                  <Pill tone="slate" active={regularBack === "yellow"} onClick={() => setRegularBack("yellow")}>黄色</Pill>
                  <Pill tone="slate" active={regularBack === "blue"} onClick={() => setRegularBack("blue")}>青色</Pill>
                </div>
                <div className={formRowClass}>
                  <label className={formLabelClass}>種別</label>
                  <Pill tone="emerald" active={regularSuit === "honor"} onClick={() => setRegularSuit("honor")}>字牌</Pill>
                  <Pill tone="emerald" active={regularSuit === "manzu"} onClick={() => setRegularSuit("manzu")}>萬子</Pill>
                  <Pill tone="emerald" active={regularSuit === "souzu"} onClick={() => setRegularSuit("souzu")}>索子</Pill>
                  <Pill tone="emerald" active={regularSuit === "pinzu"} onClick={() => setRegularSuit("pinzu")}>筒子</Pill>
                  <Pill tone="emerald" active={regularSuit === "red"} onClick={() => setRegularSuit("red")}>赤牌</Pill>
                  <Pill tone="emerald" active={regularSuit === "season"} onClick={() => setRegularSuit("season")}>季節牌</Pill>
                </div>
                {regularSuit === "honor" ? (
                  <div className={formRowClass}>
                    <label className={formLabelClass}>字牌</label>
                    {HONOR_LIST.map((h) => (
                      <Pill tone="rose" key={h} active={regularHonor === h} onClick={() => setRegularHonor(h)}>{h}</Pill>
                    ))}
                  </div>
                ) : regularSuit === "red" ? (
                  <div className={formRowClass}>
                    <label className={formLabelClass}>赤牌</label>
                    {([
                      { key: "manzu", label: RED_TILE_LABELS.manzu },
                      { key: "pinzu", label: RED_TILE_LABELS.pinzu },
                      { key: "souzu", label: RED_TILE_LABELS.souzu },
                    ] as const).map(({ key, label }) => (
                      <Pill tone="amber" key={key} active={regularRedSuit === key} onClick={() => setRegularRedSuit(key)}>{label}</Pill>
                    ))}
                  </div>
                ) : regularSuit === "season" ? (
                  <div className={formRowClass}>
                    <label className={formLabelClass}>季節牌</label>
                    {([
                      { key: "spring", label: SEASON_TILE_LABELS.spring },
                      { key: "summer", label: SEASON_TILE_LABELS.summer },
                      { key: "autumn", label: SEASON_TILE_LABELS.autumn },
                      { key: "winter", label: SEASON_TILE_LABELS.winter },
                    ] as const).map(({ key, label }) => (
                      <Pill tone="amber" key={key} active={regularSeason === key} onClick={() => setRegularSeason(key)}>{label}</Pill>
                    ))}
                  </div>
                ) : (
                  <div className={formRowClass}>
                    <label className={formLabelClass}>数字</label>
                    {KANJI_NUMBERS.map((kanji, index) => {
                      const value = (index + 1) as typeof regularNumber;
                      return (
                        <Pill tone="amber" key={kanji} active={regularNumber === value} onClick={() => setRegularNumber(value)}>{kanji}</Pill>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <RegularTilePreview back={regularBack} {...regularPreviewProps} />
              </div>
            </div>
          </Card>
        ) : (
          <Card title="2. デザイン">
            {/* デザイン方式 */}
            <div className="flex flex-wrap gap-2">
              {flow !== "fullset" && (
                <Pill tone="rose" active={designType === "name_print"} onClick={() => setDesignType("name_print")}>
                  名前入れ
                </Pill>
              )}
              <Pill tone="rose" active={designType === "bring_own"} onClick={() => setDesignType("bring_own")}>
                デザイン持ち込み
              </Pill>
              <Pill tone="rose" active={designType === "commission"} onClick={() => setDesignType("commission")}>
                デザイン依頼
              </Pill>
            </div>

            {/* 名前入れ */}
            {designType === "name_print" && (
              <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:items-start">
                <div className="order-1 md:sticky md:top-24 md:order-none">
                  <div className="mx-auto w-full md:max-w-[260px] lg:max-w-[280px]" style={previewFrameStyle}>
                    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-3 shadow-lg">
                      <div className="mb-2 text-xs font-semibold tracking-wide text-neutral-500">プレビュー</div>
                      <NameTilePreview
                        text={text || "麻雀"}
                        layout={layout}
                        useUnifiedColor={useUnifiedColor}
                        unifiedColor={unifiedColor}
                        perCharColors={perCharColors}
                        fontKey={fontKey}
                        downloadable
                        {...previewSizeProps}
                      />
                    </div>
                  </div>
                </div>

                <div className="order-2 space-y-4 md:order-none">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500">文字</label>
                    <div className="mt-2 w-full sm:w-60">
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm"
                        placeholder="縦4文字／横は自動改行"
                      />
                    </div>
                  </div>

                  <fieldset className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">レイアウト</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="emerald" active={layout === "vertical"} onClick={() => setLayout("vertical")}>縦</Pill>
                      <Pill tone="emerald" active={layout === "horizontal"} onClick={() => setLayout("horizontal")}>横</Pill>
                    </div>
                  </fieldset>

                  <fieldset className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-amber-700">フォント</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="amber" active={fontKey === "ta-fuga-fude"} onClick={() => setFontKey("ta-fuga-fude")}>
                        萬子風
                      </Pill>
                      <Pill tone="amber" active={fontKey === "gothic"} onClick={() => setFontKey("gothic")}>ゴシック</Pill>
                      <Pill tone="amber" active={fontKey === "mincho"} onClick={() => setFontKey("mincho")}>明朝</Pill>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-700">色指定</legend>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="slate" active={useUnifiedColor} onClick={() => setUseUnifiedColor(true)}>一括指定</Pill>
                      <Pill tone="slate" active={!useUnifiedColor} onClick={() => setUseUnifiedColor(false)}>1文字ずつ</Pill>
                    </div>

                    {useUnifiedColor ? (
                      <div className="grid max-w-[360px] grid-cols-2 gap-2 sm:grid-cols-3">
                        {COLOR_LIST.map((c) => (
                          <Pill key={c.key} active={unifiedColor === c.key} onClick={() => setUnifiedColor(c.key)}>
                            {renderDot(c.css)}
                            {c.label}
                          </Pill>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {splitChars(text || "麻雀").map((ch, idx) => (
                          <div key={idx} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 py-3 sm:flex-row sm:items-center sm:gap-3">
                            <div className="text-sm font-medium text-neutral-600 sm:w-8 sm:text-center">{ch}</div>
                            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
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
                    <div className="space-y-1 text-[12px] text-neutral-500">
                      <p>※ 他の色をご希望の場合は備考欄に記載ください。</p>
                      <p>※2色以上選択の場合は、1色追加につき200円発生いたします。またレインボーは800円発生いたします。</p>
                    </div>
                  </fieldset>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500">備考</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-2 h-40 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm md:h-48"
                      placeholder="ご希望・注意点など（任意）"
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
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <StepperField
                        value={bringOwnColorInput}
                        onInput={(e) => {
                          const raw = e.target.value;
                          setBringOwnColorInput(raw);
                          if (raw === "") return;
                          const parsed = Number(raw);
                          if (!Number.isFinite(parsed)) return;
                          const next = Math.max(1, Math.floor(parsed));
                          setBringOwnColorCount(next);
                          if (String(next) !== raw) setBringOwnColorInput(String(next));
                        }}
                        onIncrement={() => {
                          const next = bringOwnColorCount + 1;
                          setBringOwnColorCount(next);
                          setBringOwnColorInput(String(next));
                        }}
                        onDecrement={() => {
                          const next = Math.max(1, bringOwnColorCount - 1);
                          setBringOwnColorCount(next);
                          setBringOwnColorInput(String(next));
                        }}
                        className="w-full sm:w-28"
                        min={1}
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
              <Pill tone="indigo" active={variant === "standard"} onClick={() => setVariant("standard")}>28mm</Pill>
              <Pill tone="indigo" active={variant === "mm30"} onClick={() => setVariant("mm30")}>30mm</Pill>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <StepperField
              value={qtyInput}
              onInput={(e) => {
                const raw = e.target.value;
                setQtyInput(raw);
                if (raw === "") return;
                const parsed = Number(raw);
                if (!Number.isFinite(parsed)) return;
                const next = Math.max(1, Math.floor(parsed));
                setQty(next);
                syncKeyholderForQty(next);
                if (String(next) !== raw) setQtyInput(String(next));
              }}
              onIncrement={() => {
                const next = qty + 1;
                setQty(next);
                setQtyInput(String(next));
                syncKeyholderForQty(next);
              }}
              onDecrement={() => {
                const next = Math.max(1, qty - 1);
                setQty(next);
                setQtyInput(String(next));
                syncKeyholderForQty(next);
              }}
              className="w-full sm:w-32"
              min={1}
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
              {/* キーホルダー（独立数量：メイン数量より多く不可） */}
              <div className="flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium">キーホルダー</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <StepperField
                    value={optKeyholderInput}
                    onInput={(e) => {
                      const raw = e.target.value;
                      setOptKeyholderInput(raw);
                      if (raw === "") return;
                      const parsed = Number(raw);
                      if (!Number.isFinite(parsed)) return;
                      const normalized = Math.max(0, Math.floor(parsed));
                      const clamped = Math.min(normalized, qty);
                      setOptKeyholderQty(clamped);
                      if (String(clamped) !== raw) setOptKeyholderInput(String(clamped));
                    }}
                    onIncrement={() => {
                      const next = Math.min(qty, optKeyholderQty + 1);
                      setOptKeyholderQty(next);
                      setOptKeyholderInput(String(next));
                    }}
                    onDecrement={() => {
                      const next = Math.max(0, optKeyholderQty - 1);
                      setOptKeyholderQty(next);
                      setOptKeyholderInput(String(next));
                    }}
                    className="w-full sm:w-24"
                    min={0}
                    max={qty}
                  />
                  <span>× ¥{fmt(PRICING.options.keyholder.priceIncl)}</span>
                </div>
              </div>

              {/* 桐箱（28mm単品/通常のみ・独立数量） */}
              {((flow === "original_single" && variant === "standard") || flow === "regular") && (
                <>
                  <div className="flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-medium">桐箱（4枚用）</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <StepperField
                        value={optKiribakoInput}
                        onInput={(e) => {
                          const raw = e.target.value;
                          setOptKiribakoInput(raw);
                          if (raw === "") return;
                          const parsed = Number(raw);
                          if (!Number.isFinite(parsed)) return;
                          const next = Math.max(0, Math.floor(parsed));
                          setOptKiribakoQty(next);
                          if (String(next) !== raw) setOptKiribakoInput(String(next));
                        }}
                        onIncrement={() => {
                          const next = optKiribakoQty + 1;
                          setOptKiribakoQty(next);
                          setOptKiribakoInput(String(next));
                        }}
                        onDecrement={() => {
                          const next = Math.max(0, optKiribakoQty - 1);
                          setOptKiribakoQty(next);
                          setOptKiribakoInput(String(next));
                        }}
                        className="w-full sm:w-24"
                        min={0}
                      />
                      <span>× ¥{fmt(PRICING.options.kiribako_4.priceIncl)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600">※ 桐箱は4枚用です。28mm専用となります。</p>
                </>
              )}
            </div>
            {/* 右側注釈は不要（ご要望反映済み） */}
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
              <button
                type="button"
                onClick={addToCart}
                className="w-full px-5 py-3 rounded-2xl border shadow-sm bg-white hover:bg-neutral-50 sm:w-auto"
              >
                カートに追加
              </button>
              <button
                type="button"
                onClick={() => setMiniCartOpen(true)}
                className="w-full px-5 py-3 rounded-2xl bg-black text-white shadow sm:w-auto"
              >
                購入手続きへ
              </button>
            </div>
          </div>
        </Card>
      </section>

      <section style={containerStyle} className="mt-12 space-y-6">
        <Card title="事例紹介">
          <div className="grid gap-4 md:grid-cols-3">
            {CASE_STUDIES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 shadow-sm">
                <div className="text-[13px] font-semibold text-emerald-600">{item.title}</div>
                <div className="mt-1 text-base font-bold text-neutral-900">{item.client}</div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">{item.outcome}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="口コミ">
          <JudgeMeWidget />
        </Card>

        <Card title="Q＆A">
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <summary className="cursor-pointer select-none text-sm font-semibold text-neutral-800 group-open:text-black">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{faq.a}</p>
              </details>
            ))}
          </div>
        </Card>
      </section>

      {/* ===== ボトムバー（画面下“全面”、中央寄せ） ===== */}
      <div className="fixed left-0 right-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div style={{ ...containerStyle }} className="px-4 py-2">
          {/* 上段：合計サマリ */}
          <div className="flex items-end justify-between gap-3 sm:h-[44px] sm:items-center">
            <div className="text-sm">
              <div className="font-semibold">カート</div>
              <div className="text-neutral-600">
                小計 ¥{fmt(cartTotals.preDiscount)} ・ 送料{" "}
                {cartTotals.ship === 0 ? "¥0（無料）" : `¥${fmt(cartTotals.ship)}`}
                {cartTotals.discount > 0 && (
                  <span className="text-rose-600 ml-2">
                    割引 -¥{fmt(cartTotals.discount)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-xl font-bold whitespace-nowrap leading-tight sm:text-2xl">
              合計 ¥{fmt(cartTotals.total)}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:flex sm:justify-end sm:gap-3">
            {/* 追加：購入手続きへ */}
            <button
              type="button"
              className="w-full px-2 py-2 rounded-xl bg-black text-white text-[13px] font-medium leading-tight whitespace-nowrap sm:w-auto sm:px-5 sm:text-sm"
              onClick={() => setMiniCartOpen(true)}
            >
              購入手続きへ
            </button>

            {/* 既存：カートに追加 */}
            <button
              type="button"
              className="w-full px-2 py-2 rounded-xl border text-[13px] font-medium leading-tight whitespace-nowrap sm:w-auto sm:px-4 sm:text-sm"
              onClick={addToCart}
            >
              カートに追加
            </button>

            {/* アコーディオン開閉 */}
            <button
              type="button"
              className="w-full px-2 py-2 rounded-xl bg-white border text-[13px] font-medium leading-tight whitespace-nowrap sm:w-auto sm:px-5 sm:text-sm"
              onClick={() => setMiniCartOpen((v) => !v)}
              aria-expanded={miniCartOpen}
              aria-controls="cart-accordion"
            >
              {miniCartOpen ? "カートを閉じる" : "カートを表示"}
            </button>
          </div>

          {/* 下段：アコーディオン（開閉） */}
          <div
            id="cart-accordion"
            className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${
              miniCartOpen ? "max-h-[50vh]" : "max-h-0"
            }`}
          >
            <div className="mt-3 border rounded-xl p-3 bg-white shadow-sm max-h-[46vh] overflow-auto">
              {cartItems.length === 0 ? (
                <div className="text-sm text-neutral-600 p-4 text-center">カートは空です。</div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((ci) => (
                    <div key={ci.id} className="border rounded-lg p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="font-medium">{ci.title}</div>
                          <div className="text-sm text-neutral-600">数量：{ci.qty}</div>

                          {ci.designSummary && (
                            <div className="text-xs text-neutral-700 mt-1">
                              <span className="font-semibold">デザイン：</span>
                              {ci.designSummary}
                            </div>
                          )}

                          {ci.thumbs && ci.thumbs.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {ci.thumbs.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt={`thumb_${i}`}
                                  className="w-full h-16 object-cover rounded border"
                                />
                              ))}
                            </div>
                          )}

                          {ci.extras.length > 0 && (
                            <div className="text-xs mt-2">
                              <div className="font-semibold mb-1">オプション：</div>
                              <ul className="list-disc ml-5 space-y-0.5">
                                {ci.extras.map((e, i) => (
                                  <li key={i}>
                                    {e.label}：¥{fmt(e.amount)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {ci.note && (
                            <div className="text-xs text-neutral-600 mt-2">備考：{ci.note}</div>
                          )}
                        </div>

                        <div className="mt-2 text-left sm:mt-0 sm:text-right sm:shrink-0">
                          <div className="text-sm">
                            小計：¥{fmt(ci.qty * ci.unit + ci.qty * (ci.optionTotal ?? 0))}
                          </div>
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

              {/* 合計行（カート全体） */}
              <div className="mt-3 border-t pt-3 space-y-1 text-left sm:text-right">
                <div>小計：¥{fmt(cartTotals.preDiscount)}</div>
                {cartTotals.discount > 0 && (
                  <div className="text-rose-600">割引：-¥{fmt(cartTotals.discount)}</div>
                )}
                <div>送料：{cartTotals.ship === 0 ? "¥0（無料）" : `¥${fmt(cartTotals.ship)}`}</div>
                <div className="text-lg font-semibold">合計：¥{fmt(cartTotals.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-[88px] z-50 px-4 py-2 rounded-xl text-white text-sm shadow ${
            toastTone === "error" ? "bg-rose-600" : "bg-black"
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default Shop;
