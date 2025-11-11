// 共通の価格表
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

export type Flow = "original_single" | "fullset" | "regular";
type DesignType = "name_print" | "bring_own" | "commission";
type Variant = "standard" | "mm30" | "default";
type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

export type EstimateInput = {
  flow: Flow;
  variant: Variant;
  qty: number;
  designType: DesignType;
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
  perCharColors: ColorKey[];
  nameText: string;
  bringOwnColorCount: number;
  // 独立オプション数量
  optKeyholderQty: number;
  optKiribakoQty: number;
};

export type Estimate = {
  unit: number;                 // 商品単価
  extras: { label: string; amount: number }[]; // 表示用の明細（単価行）
  optionTotal: number;          // オプション小計（この行の「単価」合計）
  discountRate: number;
  discountAmount: number;       // （商品＋オプション）×qty に対する割引額（単品ベース）
  merchandiseSubtotal: number;  // 割引後小計（税・送料別）
  shipping: number;
  total: number;                // 合計（小計＋送料）
};

function getUnit(flow: Flow, variant: Variant): number {
  const table: any = PRICING.products[flow];
  const v = flow === "regular" ? "default" : variant === "default" ? "standard" : variant;
  return table.variants[v].priceIncl as number;
}

/** 色数課金ロジック
 * - 一括指定：レインボーなら 800、それ以外は 0
 * - 個別指定：レインボー含むなら 800（上限）
 *              含まれない場合、ユニーク色数が2色以上なら (色数-1)*200（上限800）
 *   ※ ユニーク1色（黒以外1色のみでも）0円
 */
function colorSurcharge(params: {
  flow: Flow;
  designType: DesignType;
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
  perCharColors: ColorKey[];
  nameText: string;
}): { label: string; amount: number } | null {
  const { flow, designType, useUnifiedColor, unifiedColor, perCharColors, nameText } = params;
  if (flow !== "original_single") return null;
  if (designType !== "name_print") return null;

  if (useUnifiedColor) {
    if (unifiedColor === "rainbow") {
      return { label: PRICING.options.rainbow.label, amount: PRICING.options.rainbow.priceIncl };
    }
    return null; // 一括指定は黒以外でも1色なら0円
  }

  // 個別指定：入力文字数に揃える
  const need = Math.max(1, Array.from(nameText || "").length);
  const colors = perCharColors.slice(0, need);
  while (colors.length < need) colors.push("black");

  const uniq = Array.from(new Set(colors));
  if (uniq.includes("rainbow")) {
    return { label: PRICING.options.rainbow.label, amount: PRICING.options.rainbow.priceIncl };
  }

  const uniqueCount = uniq.length;
  if (uniqueCount <= 1) return null; // 1色なら0円（黒以外1色でも0円）

  const raw = (uniqueCount - 1) * PRICING.options.multi_color.priceIncl;
  const capped = Math.min(PRICING.options.rainbow.priceIncl, raw); // 上限800
  return { label: `${PRICING.options.multi_color.label} × ${uniqueCount - 1}`, amount: capped };
}

function designBringOwnSurcharge(flow: Flow, bringOwnColorCount: number): { label: string; amount: number }[] {
  const out: { label: string; amount: number }[] = [];
  const addCount = Math.max(0, Math.floor(bringOwnColorCount) - 1);
  if (flow === "fullset") {
    out.push({
      label: PRICING.options.design_submission_fullset.label,
      amount: PRICING.options.design_submission_fullset.priceIncl,
    });
  } else {
    out.push({
      label: PRICING.options.design_submission_single.label,
      amount: PRICING.options.design_submission_single.priceIncl,
    });
    if (addCount > 0) {
      out.push({
        label: `${PRICING.options.bring_own_color_unit.label} × ${addCount}`,
        amount: PRICING.options.bring_own_color_unit.priceIncl * addCount,
      });
    }
  }
  return out;
}

function discountRateOf(flow: Flow, qty: number): number {
  if (flow === "original_single") return qty >= 10 ? 0.15 : qty >= 5 ? 0.1 : 0;
  if (flow === "fullset") return qty >= 5 ? 0.2 : 0;
  return 0;
}

/** 単品見積（UI左側の見積テーブル用。割引はそのアイテムの数量ベース） */
export function computeEstimate(input: EstimateInput): Estimate {
  const {
    flow,
    variant,
    qty,
    designType,
    useUnifiedColor,
    unifiedColor,
    perCharColors,
    nameText,
    bringOwnColorCount,
    optKeyholderQty,
    optKiribakoQty,
  } = input;

  const unit = getUnit(flow, variant);

  // 明細（単価行）
  const extras: { label: string; amount: number }[] = [];

  // デザイン系
  if (designType === "bring_own") {
    extras.push(...designBringOwnSurcharge(flow, bringOwnColorCount));
  } else if (designType === "name_print") {
    const colorExtra = colorSurcharge({
      flow,
      designType,
      useUnifiedColor,
      unifiedColor,
      perCharColors,
      nameText,
    });
    if (colorExtra) extras.push(colorExtra);
  }

  // 独立オプション（メイン数量に比例しない）
  if (optKeyholderQty > 0) {
    extras.push({
      label: `${PRICING.options.keyholder.label} × ${optKeyholderQty}`,
      amount: PRICING.options.keyholder.priceIncl * optKeyholderQty,
    });
  }
  if (optKiribakoQty > 0) {
    extras.push({
      label: `${PRICING.options.kiribako_4.label} × ${optKiribakoQty}`,
      amount: PRICING.options.kiribako_4.priceIncl * optKiribakoQty,
    });
  }

  const optionTotal = extras.reduce((s, d) => s + d.amount, 0);

  // 小計・割引（単品の数量に基づく）
  const productSubtotal = unit * qty;
  const optionsSubtotal = optionTotal * qty;
  const preDiscount = productSubtotal + optionsSubtotal;
  const rate = discountRateOf(flow, qty);
  const discountAmount = Math.floor(preDiscount * rate);
  const merchandiseSubtotal = preDiscount - discountAmount;

  // 送料
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  return {
    unit,
    extras,
    optionTotal,
    discountRate: rate,
    discountAmount,
    merchandiseSubtotal,
    shipping,
    total,
  };
}

/** カート全体（累計）での割引・合計 */
export function computeCartTotals(items: Array<{ flow: Flow; qty: number; unit: number; optionTotal: number }>) {
  // 事前合計（割引前）
  const preDiscountTotal = items.reduce(
    (s, it) => s + it.qty * it.unit + it.qty * (it.optionTotal ?? 0),
    0
  );

  // フロー別で数量と金額を集計
  const agg = {
    original_qty: 0,
    original_amount: 0,
    fullset_qty: 0,
    fullset_amount: 0,
  };

  for (const it of items) {
    const amount = it.qty * it.unit + it.qty * (it.optionTotal ?? 0);
    if (it.flow === "original_single") {
      agg.original_qty += it.qty;
      agg.original_amount += amount;
    } else if (it.flow === "fullset") {
      agg.fullset_qty += it.qty;
      agg.fullset_amount += amount;
    }
  }

  // 累計割引率
  const originalRate = agg.original_qty >= 10 ? 0.15 : agg.original_qty >= 5 ? 0.1 : 0;
  const fullsetRate = agg.fullset_qty >= 5 ? 0.2 : 0;

  // 割引額は流派ごとに計算して合算
  const discount =
    Math.floor(agg.original_amount * originalRate) +
    Math.floor(agg.fullset_amount * fullsetRate);

  const merchandise = preDiscountTotal - discount;
  const ship = merchandise >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  return {
    preDiscount: preDiscountTotal, // 割引前小計
    discount,                      // 割引合計（累計割引）
    merchandise,                   // 割引後小計
    ship,
    total: merchandise + ship,     // 合計
  };
}
