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

  designType: DesignType;
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
  perCharColors: ColorKey[];
  nameText: string;
  bringOwnColorCount: number;

  optKeyholderQty: number;
  optKiribakoQty: number;
};

type ExtraRow = { label: string; amount: number };

export type Estimate = {
  unit: number;
  extras: ExtraRow[];
  optionTotal: number;           // このラインアイテム全体のオプション合計（qty分含む）
  discountRate: number;
  discountAmount: number;        // このラインアイテムにかかった割引額
  merchandiseSubtotal: number;   // 小計＝(商品×qty + optionTotal - 割引)
  shipping: number;
  total: number;
};

// ユニーク色（文字数に合わせて切り詰め）
function uniqueColors(perCharColors: ColorKey[], nameText: string): Set<ColorKey> {
  const need = Math.max(1, Array.from(nameText || "").length);
  const arr = perCharColors.slice(0, need);
  while (arr.length < need) arr.push("black");
  return new Set(arr);
}

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

  const v: Variant = flow === "regular" ? "default" : (variant === "default" ? "standard" : variant);
  const unit = (PRICING.products as any)[flow].variants[v].priceIncl as number;

  const extras: ExtraRow[] = [];
  let optionTotal = 0;

  // ---- デザイン（色課金・持ち込み） ----
  if (flow === "original_single") {
    if (designType === "name_print") {
      // ◆レインボーを含めば800円（上限800円/枚）
      // 一括指定：rainbow=800円、黒以外1色でも0円
      // 個別指定：ユニーク色数（黒含む）2色以上で(色数-1)*200、rainbow含めば800円、上限800円
      let colorFeePerPiece = 0;

      if (useUnifiedColor) {
        colorFeePerPiece = unifiedColor === "rainbow" ? PRICING.options.rainbow.priceIncl : 0;
      } else {
        const uniq = uniqueColors(perCharColors, nameText);
        const hasRainbow = uniq.has("rainbow");
        if (hasRainbow) {
          colorFeePerPiece = PRICING.options.rainbow.priceIncl; // 800
        } else {
          const count = uniq.size;
          const addSteps = Math.max(0, count - 1); // 黒含め2色以上で加算
          colorFeePerPiece = Math.min(addSteps * PRICING.options.multi_color.priceIncl, PRICING.options.rainbow.priceIncl);
        }
      }

      if (colorFeePerPiece > 0) {
        optionTotal += colorFeePerPiece * qty;
        extras.push({
          label: colorFeePerPiece === PRICING.options.rainbow.priceIncl ? PRICING.options.rainbow.label : PRICING.options.multi_color.label,
          amount: colorFeePerPiece
        });
      }
    }

    if (designType === "bring_own") {
      extras.push({ label: PRICING.options.design_submission_single.label, amount: PRICING.options.design_submission_single.priceIncl });
      optionTotal += PRICING.options.design_submission_single.priceIncl * qty;
      const add = Math.max(0, bringOwnColorCount - 1);
      if (add > 0) {
        const addFee = PRICING.options.bring_own_color_unit.priceIncl * add;
        extras.push({ label: `${PRICING.options.bring_own_color_unit.label} × ${add}`, amount: addFee });
        optionTotal += addFee * qty;
      }
    }
  } else if (flow === "fullset") {
    if (designType === "bring_own") {
      extras.push({ label: PRICING.options.design_submission_fullset.label, amount: PRICING.options.design_submission_fullset.priceIncl });
      optionTotal += PRICING.options.design_submission_fullset.priceIncl * qty;
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
  const preDiscount = productSubtotal + optionTotal;      // ★割引前小計（小計として表示したい値）
  const discountAmount = Math.floor(preDiscount * discountRate);
  const merchandiseSubtotal = preDiscount - discountAmount;

  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  return { unit, extras, optionTotal, discountRate, discountAmount, merchandiseSubtotal, shipping, total };
}

// ★カート合計：小計（割引前）、割引、送料、合計
export function computeCartTotals(
  items: { qty: number; unit: number; optionTotal: number; discount: number }[]
): { preMerch: number; ship: number; discount: number; total: number } {
  const preMerch = items.reduce((s, it) => s + it.qty * it.unit + it.optionTotal, 0); // 割引前小計
  const discount = items.reduce((s, it) => s + it.discount, 0);
  const afterDiscount = preMerch - discount;
  const ship = afterDiscount >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = afterDiscount + ship;
  return { preMerch, ship, discount, total };
}
