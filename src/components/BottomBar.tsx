import React, { useEffect, useMemo, useRef, useState } from "react";

type CartRow = {
  id: string;
  title: string;
  qty: number;
  lineTotal: number;       // （この行の）割引後小計
  details?: string[];      // デザイン内容など
  options?: string[];      // オプション明細
};

type Props = {
  subtotal: number;        // カート小計（割引後／送料前）
  shipping: number;        // 送料（小計に応じた実額）
  discount: number;        // 割引合計
  total: number;           // 支払合計（小計＋送料）
  onAddToCart: () => void;
  items: CartRow[];
  disabled?: boolean;
  onOpenHeightChange?: (extraHeight: number) => void; // バーの総高さを親へ通知
};

export default function BottomBar({
  subtotal,
  shipping,
  discount,
  total,
  onAddToCart,
  items,
  disabled,
  onOpenHeightChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const itemCount = useMemo(() => items.reduce((s, it) => s + it.qty, 0), [items]);

  // 高さ通知（重なり防止）
  useEffect(() => {
    const h =
      (headerRef.current?.offsetHeight || 0) +
      (open ? bodyRef.current?.offsetHeight || 0 : 0) +
      (actionsRef.current?.offsetHeight || 0);
    onOpenHeightChange?.(h);
  }, [open, items, onOpenHeightChange]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t">
      {/* ヘッダー（中央コンテナ） */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div
          ref={headerRef}
          className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between"
        >
          <div className="text-sm flex items-center gap-3 mx-auto">
            <span className="inline-flex items-center text-xs rounded-full border px-2 py-0.5">
              カート {itemCount} 件
            </span>
            <span className="text-neutral-600">
              小計: <b>¥{subtotal.toLocaleString()}</b>
            </span>
            <span className="text-neutral-600">
              送料: {shipping === 0 ? "¥0（無料）" : `¥${shipping.toLocaleString()}`}
            </span>
            <span className="text-neutral-600">
              割引: <b>-¥{discount.toLocaleString()}</b>
            </span>
          </div>
          <div className="text-xs shrink-0 ml-3">{open ? "閉じる ▲" : "中身を表示 ▼"}</div>
        </div>
      </button>

      {/* 中身（中央コンテナ） */}
      {open && (
        <div ref={bodyRef} className="mx-auto max-w-5xl px-4 pb-2">
          {items.length === 0 ? (
            <div className="text-xs text-neutral-500 py-2 text-center">カートに商品がありません。</div>
          ) : (
            <ul className="divide-y rounded-xl border bg-white">
              {items.map((it) => (
                <li key={it.id} className="px-3 py-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.title}</div>
                      <div className="text-xs text-neutral-600">数量：{it.qty}</div>
                      {it.details && it.details.length > 0 && (
                        <ul className="mt-1 text-xs text-neutral-700 list-disc list-inside space-y-0.5">
                          {it.details.map((d, i) => (
                            <li key={i} className="whitespace-nowrap">{d}</li>
                          ))}
                        </ul>
                      )}
                      {it.options && it.options.length > 0 && (
                        <ul className="mt-1 text-xs text-neutral-700 list-disc list-inside space-y-0.5">
                          {it.options.map((d, i) => (
                            <li key={i} className="whitespace-nowrap">{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="whitespace-nowrap">小計：¥{it.lineTotal.toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* アクション行（中央コンテナ） */}
      <div
        ref={actionsRef}
        className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between"
      >
        <div className="text-sm mx-auto">
          合計: <span className="font-semibold">¥{total.toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          <button
            className="px-5 py-2 rounded-xl bg-black text-white disabled:opacity-50 text-sm"
            onClick={onAddToCart}
            disabled={disabled}
            aria-label="カートに追加"
          >
            カートに追加
          </button>
          <button
            className="px-5 py-2 rounded-xl border text-sm"
            onClick={() => alert("チェックアウトはモックです")}
          >
            購入手続きへ
          </button>
        </div>
      </div>
    </div>
  );
}
