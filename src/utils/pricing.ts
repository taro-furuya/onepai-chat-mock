// src/utils/pricing.ts
/** 価格テーブル & ユーティリティ */

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

export const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);

/** 数量→割引率（オリジナル合算5個10%/10個15%、フルセット5セット20%） */
export const discountRateFor = (
  flow: "original_single" | "fullset" | "regular",
  qty: number
) => {
  if (flow === "original_single") return qty >= 10 ? 0.15 : qty >= 5 ? 0.1 : 0;
  if (flow === "fullset") return qty >= 5 ? 0.2 : 0;
  return 0;
};
