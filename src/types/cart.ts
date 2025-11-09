// src/types/cart.ts
export type CartExtra = { label: string; unit: number };

export type CartFile = {
  id: string;
  name: string;
  src: string;
  type: "image" | "file";
};

export type CartItem = {
  id: string;
  title: string;
  qty: number;
  unit: number;        // 商品単価（税込）
  optionUnit: number;  // オプション単価合計（税込）
  discount: number;    // 行に対する割引額（税込）
  note?: string;
  extras: CartExtra[]; // オプション明細（ラベル＋単価）
  files?: CartFile[];  // プレビュー/添付
};
