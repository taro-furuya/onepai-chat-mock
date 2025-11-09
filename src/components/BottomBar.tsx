import React, { useState } from "react";

type CartRow = {
  id: string;
  title: string;
  qty: number;
  lineTotal: number; // この行の小計
};

type Props = {
  subtotal: number;
  shipping: number;
  total: number;
  onAddToCart: () => void;
  items: CartRow[];   // アコーディオンで表示する簡易カート
  disabled?: boolean;
};

export default function BottomBar({
  subtotal,
  shipping,
  total,
  onAddToCart,
  items,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            <span className="inline-flex items-center text-xs rounded-full border px-2 py-0.5">
              カート {itemCount} 件
            </span>
            <span className="text-neutral-600">
              小計: <b>¥{subtotal.toLocaleString()}</b> ／ 送料: {shipping === 0 ? "¥0（無料）" : `¥${shipping.toLocaleString()}`}
            </span>
          </div>
          <div className="text-xs">{open ? "閉じる ▲" : "中身を表示 ▼"}</div>
        </div>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="mx-auto max-w-5xl px-4 pb-2">
          {items.length === 0 ? (
            <div className="text-xs text-neutral-500 py-2">カートに商品がありません。</div>
          ) : (
            <ul className="divide-y rounded-xl border bg-white">
              {items.map((it) => (
                <li key={it.id} className="px-3 py-2 text-sm flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="font-medium truncate">{it.title}</div>
                    <div className="text-xs text-neutral-600">数量：{it.qty}</div>
                  </div>
                  <div className="whitespace-nowrap">小計：¥{it.lineTotal.toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
        <div className="text-sm">
          <div className="text-neutral-600">
            合計: <span className="font-semibold">¥{total.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50 text-sm"
            onClick={onAddToCart}
            disabled={disabled}
            aria-label="カートに追加"
          >
            カートに追加
          </button>
          <button
            className="px-4 py-2 rounded-xl border text-sm"
            onClick={() => alert("チェックアウトはモックです")}
          >
            購入手続きへ
          </button>
        </div>
      </div>
    </div>
  );
}
