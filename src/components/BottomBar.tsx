import React, { useEffect, useMemo, useRef, useState } from "react";

type CartRow = {
  id: string;
  title: string;
  qty: number;
  lineTotal: number;      // 割引前の行小計（単価×数量＋OP合計）
  details?: string[];     // デザイン詳細
  options?: string[];     // OP内訳（行ベース）
  files?: { id: string; name: string; src: string; type: "image" | "file" }[];
};

type Props = {
  subtotal: number;   // 割引適用後の小計（送料除く）
  shipping: number;
  discount: number;
  total: number;
  items: CartRow[];
  onAddToCart?: () => void;
  onRemoveItem?: (id: string) => void;
  disabled?: boolean;
  onOpenHeightChange?: (height: number) => void;
};

const fmt = (n: number) => new Intl.NumberFormat("ja-JP").format(n);

const BottomBar: React.FC<Props> = ({
  subtotal,
  shipping,
  discount,
  total,
  items,
  onAddToCart,
  onRemoveItem,
  disabled,
  onOpenHeightChange,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // 開閉時に高さを親へ通知（被り回避）
  useEffect(() => {
    const height = wrapRef.current?.getBoundingClientRect().height || 0;
    onOpenHeightChange?.(height);
  }, [open, items.length, subtotal, discount, shipping, total]);

  const count = useMemo(() => items.reduce((s, it) => s + it.qty, 0), [items]);

  return (
    <div ref={wrapRef} className="fixed left-0 right-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
      {/* ヘッダー（金額を出さず、件数＋中身表示） */}
      <div className="border-b">
        <div className="h-[52px] max-w-[min(1024px,92vw)] mx-auto px-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="inline-block px-2 py-1 rounded bg-neutral-100 border">カート {count} 件</span>
          </div>
          <button
            type="button"
            className="text-sm underline underline-offset-2"
            onClick={() => setOpen((v) => !v)}
          >
            中身を表示 {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* ミニカート（センター・被り低減のため最大高さを制御） */}
      {open && (
        <div className="max-w-[min(1024px,92vw)] mx-auto px-4 pb-2">
          <div
            className="mx-auto bg-white rounded-2xl shadow-2xl p-4 mt-2"
            style={{
              maxHeight: "40vh",
              overflow: "auto",
            }}
          >
            {items.length === 0 ? (
              <div className="text-sm text-neutral-600 p-6 text-center">カートは空です。</div>
            ) : (
              <div className="space-y-4">
                {items.map((ci) => (
                  <div key={ci.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{ci.title}</div>
                        <div className="text-sm text-neutral-600">数量：{ci.qty}</div>
                      </div>
                      <div className="text-right font-medium">小計：¥{fmt(ci.lineTotal)}</div>
                    </div>

                    {/* デザイン詳細 */}
                    {ci.details && ci.details.length > 0 && (
                      <ul className="text-xs list-disc ml-5 mt-2 space-y-1">
                        {ci.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}

                    {/* オプション明細 */}
                    {ci.options && ci.options.length > 0 && (
                      <ul className="text-xs list-disc ml-5 mt-2 space-y-1">
                        {ci.options.map((op, i) => <li key={i}>{op}</li>)}
                      </ul>
                    )}

                    {/* 添付ファイルプレビュー */}
                    {ci.files && ci.files.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 md:grid-cols-6 gap-2">
                        {ci.files.map((f) => (
                          <div key={f.id} className="text-center">
                            {f.type === "image" ? (
                              <img src={f.src} alt={f.name} className="w-full h-16 object-cover rounded border" />
                            ) : (
                              <div className="w-full h-16 flex items-center justify-center border rounded bg-neutral-100 text-neutral-600 text-xs">
                                {f.name.split(".").pop()?.toUpperCase()}
                              </div>
                            )}
                            <div className="truncate text-[11px] mt-1">{f.name}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-right mt-2">
                      <button
                        type="button"
                        className="text-xs underline underline-offset-2 text-neutral-600"
                        onClick={() => onRemoveItem?.(ci.id)}
                      >
                        この商品を削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 合計欄（誤認防止：小計→送料→割引→合計） */}
            <div className="mt-3 border-t pt-3 text-right space-y-1">
              <div className="text-sm">小計：¥{fmt(subtotal)}</div>
              <div className="text-sm">送料：{shipping === 0 ? "¥0（無料）" : `¥${fmt(shipping)}`}</div>
              {discount > 0 && <div className="text-sm text-red-500">割引：-¥{fmt(discount)}</div>}
              <div className="text-2xl font-bold">合計：¥{fmt(total)}</div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="h-10 px-6 rounded-xl border bg-white text-sm"
                  onClick={onAddToCart}
                  disabled={disabled}
                >
                  カートに追加
                </button>
                <button type="button" className="h-10 px-6 rounded-xl bg-black text-white text-sm">
                  購入手続きへ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomBar;
