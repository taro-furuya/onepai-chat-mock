// 共通の価格定義（必要に応じてShop.tsx側のPRICINGと同一にする）
export const PRICING = {
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

type Flow = "original_single" | "fullset" | "regular";
type Variant = "standard" | "mm30" | "default";
type DesignType = "name_print" | "bring_own" | "commission";
export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

type EstimateInput = {
  flow: Flow;
  variant: Variant;
  qty: number;

  // デザイン
  designType: DesignType;
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
  perCharColors: ColorKey[];
  nameText: string;
  bringOwnColorCount: number;

  // オプション数量（メイン数量に非連動）
  optKeyholderQty: number;
  optKiribakoQty: number;
};

type ExtraRow = { label: string; amount: number };

export type Estimate = {
  unit: number;                  // 商品単価
  extras: ExtraRow[];            // 明細行（UI表示用）
  optionTotal: number;           // オプション合計（このラインアイテムの qty を含む全体額）
  discountRate: number;          // 0〜0.2
  discountAmount: number;        // 金額
  merchandiseSubtotal: number;   // 小計（商品×qty + optionTotal - 割引）
  shipping: number;              // 送料
  total: number;                 // 合計
};

// ユニーク色のカウント（文字数に合わせて切り詰め）
function uniqueColors(perCharColors: ColorKey[], nameText: string): Set<ColorKey> {
  const need = Math.max(1, Array.from(nameText || "").length);
  const arr = perCharColors.slice(0, need);
  while (arr.length < need) arr.push("black");
  return new Set(arr);
}

// オリジナル（単品）割引：5個=10%, 10個=15%／フルセットは5=20%
function discountRateOf(flow: Flow, qty: number): number {
  if (flow === "original_single") return qty >= 10 ? 0.15 : qty >= 5 ? 0.1 : 0;
  if (flow === "fullset") return qty >= 5 ? 0.2 : 0;
  return 0;
}

export function computeEstimate(input: EstimateInput): Estimate {
  const {
    flow, variant, qty,
    designType,
    useUnifiedColor, unifiedColor, perCharColors, nameText, bringOwnColorCount,
    optKeyholderQty, optKiribakoQty,
  } = input;

  // 商品単価
  const v: Variant = flow === "regular" ? "default" : (variant === "default" ? "standard" : variant);
  const unit = (PRICING.products as any)[flow].variants[v].priceIncl as number;

  const extras: ExtraRow[] = [];
  let optionTotal = 0;

  // ---- デザイン関連（色課金・持ち込み料） ----
  if (flow === "original_single") {
    if (designType === "name_print") {
      // ■ 色課金ロジック
      // ルール：
      // - 一括指定：rainbowなら800円、黒以外1色でも追加料金なし、2色以上なら(色数-1)*200、上限800円
      // - 1文字ずつ：ユニーク色数（黒含む）が2色以上なら(色数-1)*200、rainbowが含まれれば800円、上限800円
      let colorFeePerPiece = 0;

      if (useUnifiedColor) {
        if (unifiedColor === "rainbow") {
          colorFeePerPiece = PRICING.options.rainbow.priceIncl; // 800
        } else {
          // 一括で黒以外1色は0円、2色以上（黒＋他色）という概念は無し（一括は1色のみ）
          colorFeePerPiece = 0;
        }
      } else {
        const uniq = uniqueColors(perCharColors, nameText);
        const hasRainbow = uniq.has("rainbow");
        if (hasRainbow) {
          colorFeePerPiece = PRICING.options.rainbow.priceIncl; // 800
        } else {
          const count = uniq.size;
          const addSteps = Math.max(0, count - 1); // 黒含め2色以上で加算
          colorFeePerPiece = Math.min(addSteps * PRICING.options.multi_color.priceIncl, 800);
        }
      }

      if (colorFeePerPiece > 0) {
        const line = colorFeePerPiece * qty; // 1枚あたり → qty倍
        optionTotal += line;
        extras.push({ label: colorFeePerPiece === 800 ? PRICING.options.rainbow.label : PRICING.options.multi_color.label, amount: colorFeePerPiece });
      }
    }

    if (designType === "bring_own") {
      extras.push({ label: PRICING.options.design_submission_single.label, amount: PRICING.options.design_submission_single.priceIncl });
      optionTotal += PRICING.options.design_submission_single.priceIncl * qty; // 単品は基本的に枚数分
      const add = Math.max(0, bringOwnColorCount - 1);
      if (add > 0) {
        const addFee = PRICING.options.bring_own_color_unit.priceIncl * add;
        extras.push({ label: `${PRICING.options.bring_own_color_unit.label} × ${add}`, amount: addFee });
        optionTotal += addFee * qty; // こちらも枚数分
      }
    }
  } else if (flow === "fullset") {
    if (designType === "bring_own") {
      extras.push({ label: PRICING.options.design_submission_fullset.label, amount: PRICING.options.design_submission_fullset.priceIncl });
      optionTotal += PRICING.options.design_submission_fullset.priceIncl * qty; // セット数分
      const add = Math.max(0, bringOwnColorCount - 1);
      if (add > 0) {
        const addFee = PRICING.options.bring_own_color_unit.priceIncl * add;
        extras.push({ label: `${PRICING.options.bring_own_color_unit.label} × ${add}`, amount: addFee });
        optionTotal += addFee * qty;
      }
    }
  }

  // ---- 物理オプション（独立数量） ----
  if (optKeyholderQty > 0) {
    const fee = PRICING.options.keyholder.priceIncl * optKeyholderQty;
    extras.push({ label: `${PRICING.options.keyholder.label} × ${optKeyholderQty}`, amount: PRICING.options.keyholder.priceIncl });
    optionTotal += fee;
  }
  if (optKiribakoQty > 0) {
    const fee = PRICING.options.kiribako_4.priceIncl * optKiribakoQty;
    extras.push({ label: `${PRICING.options.kiribako_4.label} × ${optKiribakoQty}`, amount: PRICING.options.kiribako_4.priceIncl });
    optionTotal += fee;
  }

  // 割引（行単位）
  const discountRate = discountRateOf(flow, qty);
  const productSubtotal = unit * qty;
  const preDiscount = productSubtotal + optionTotal;
  const discountAmount = Math.floor(preDiscount * discountRate);
  const merchandiseSubtotal = preDiscount - discountAmount;

  // 送料
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  return { unit, extras, optionTotal, discountRate, discountAmount, merchandiseSubtotal, shipping, total };
}

// カート合計（小計・送料・割引・合計）を算出
export function computeCartTotals(
  items: { qty: number; unit: number; optionTotal: number; discount: number }[]
): { merchandise: number; ship: number; discount: number; total: number } {
  const merchandise = items.reduce((s, it) => s + it.qty * it.unit + it.optionTotal - it.discount, 0);
  const ship = merchandise >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const discount = items.reduce((s, it) => s + it.discount, 0);
  const total = merchandise + ship;
  return { merchandise, ship, discount, total };
}
