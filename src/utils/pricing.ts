// src/utils/pricing.ts
// 金額計算の共通ロジックだけ切り出し（UIは変更しない）

export type Flow = "original_single" | "fullset" | "regular";
export type Variant = "standard" | "mm30" | "default";
export type DesignType = "name_print" | "bring_own" | "commission";
export type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";

export const PRICING = {
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
    regular: {
      variants: {
        default: { label: "28mm 牌（通常）", priceIncl: 550 },
      },
    },
  },
} as const;

export type ExtraRow = { label: string; amount: number };

export type EstimateInput = {
  flow: Flow;
  variant: Variant;                 // regular のときは "default"
  qty: number;                      // メイン数量
  designType: DesignType;

  // 名前入れ（色）
  useUnifiedColor: boolean;
  unifiedColor: ColorKey;
  perCharColors: ColorKey[];
  nameText: string;

  // 持ち込み
  bringOwnColorCount: number;

  // オプション（メイン数量と独立）
  optKeyholderQty: number;
  optKiribakoQty: number;
};

export type EstimateOutput = {
  unit: number;                     // 商品単価
  extras: ExtraRow[];               // オプション・加算の明細
  optionTotal: number;              // extras の合計
  productSubtotal: number;          // 単価×数量
  discountRate: number;             // 0〜0.2
  discountAmount: number;           // 値引金額
  merchandiseSubtotal: number;      // 商品＋オプション−割引
  shipping: number;                 // 送料
  total: number;                    // 合計
};

// ユニーク色数（黒を含めたユニークでカウント）
const uniqueColorCount = (colors: ColorKey[]) => new Set(colors).size;

export function computeEstimate(i: EstimateInput): EstimateOutput {
  const unit =
    i.flow === "regular"
      ? PRICING.products.regular.variants.default.priceIncl
      : PRICING.products[i.flow].variants[
          (i.variant === "default" ? "standard" : i.variant) as "standard" | "mm30"
        ].priceIncl;

  // 追加明細を積み上げ
  const extras: ExtraRow[] = [];

  // デザイン持ち込みの基本料
  if (i.designType === "bring_own") {
    if (i.flow === "fullset") {
      extras.push({
        label: PRICING.options.design_submission_fullset.label,
        amount: PRICING.options.design_submission_fullset.priceIncl,
      });
    } else {
      extras.push({
        label: PRICING.options.design_submission_single.label,
        amount: PRICING.options.design_submission_single.priceIncl,
      });
    }
  }

  // 色加算：要件通り
  // ・一括レインボー = +800
  // ・個別指定 = （黒を含むユニーク色数 − 1）×200（上限800）
  if (i.flow === "original_single" && i.designType === "name_print") {
    if (i.useUnifiedColor) {
      if (i.unifiedColor === "rainbow") {
        extras.push({ label: PRICING.options.rainbow.label, amount: PRICING.options.rainbow.priceIncl });
      }
    } else {
      const textLen = Math.max(1, Array.from(i.nameText || "").length);
      const picked = (i.perCharColors.slice(0, textLen) as ColorKey[]).concat(
        ...Array(Math.max(0, textLen - i.perCharColors.length)).fill("black")
      );
      const u = uniqueColorCount(picked);
      const addColors = Math.max(0, u - 1);
      const addAmount = Math.min(addColors * PRICING.options.multi_color.priceIncl, PRICING.options.rainbow.priceIncl);
      if (addAmount > 0) {
        extras.push({ label: `${PRICING.options.multi_color.label} × ${addColors}`, amount: addAmount });
      }
    }
  }

  // キーホルダー（独立数量、メイン数量を上限に）
  const keyQty = Math.max(0, Math.min(i.optKeyholderQty | 0, Math.max(1, i.qty)));
  if (keyQty > 0) {
    extras.push({
      label: `${PRICING.options.keyholder.label} × ${keyQty}`,
      amount: keyQty * PRICING.options.keyholder.priceIncl,
    });
  }

  // 桐箱（28mm単品 or 通常のみ／独立数量）
  const allowKiribako = (i.flow === "original_single" && i.variant === "standard") || i.flow === "regular";
  if (allowKiribako && i.optKiribakoQty > 0) {
    extras.push({
      label: `${PRICING.options.kiribako_4.label} × ${i.optKiribakoQty}`,
      amount: i.optKiribakoQty * PRICING.options.kiribako_4.priceIncl,
    });
  }

  // 持ち込みの追加色（1色以上で、追加分×200）
  if (i.designType === "bring_own") {
    const add = Math.max(0, (i.bringOwnColorCount | 0) - 1);
    if (add > 0) {
      extras.push({ label: `持ち込み追加色 × ${add}`, amount: add * PRICING.options.multi_color.priceIncl });
    }
  }

  const optionTotal = extras.reduce((s, e) => s + e.amount, 0);
  const productSubtotal = unit * Math.max(1, i.qty);

  // 割引率
  let discountRate = 0;
  if (i.flow === "original_single") discountRate = i.qty >= 10 ? 0.15 : i.qty >= 5 ? 0.1 : 0;
  if (i.flow === "fullset") discountRate = i.qty >= 5 ? 0.2 : 0;

  const discountAmount = Math.floor((productSubtotal + optionTotal) * discountRate);
  const merchandiseSubtotal = productSubtotal + optionTotal - discountAmount;
  const shipping = merchandiseSubtotal >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  const total = merchandiseSubtotal + shipping;

  return {
    unit,
    extras,
    optionTotal,
    productSubtotal,
    discountRate,
    discountAmount,
    merchandiseSubtotal,
    shipping,
    total,
  };
}

// 既存カート配列からフッター/ミニカート用の集計（UIは既存のまま利用）
export function computeCartTotals(items: { qty: number; unit: number; optionTotal: number; discount: number }[]) {
  const merchandise = items.reduce((s, it) => s + (it.qty * it.unit + it.optionTotal - it.discount), 0);
  const ship = merchandise === 0 || merchandise >= PRICING.shipping.freeOver ? 0 : PRICING.shipping.flat;
  return { merchandise, ship, total: merchandise + ship };
}
