```tsx
import React from 'react';


type Props = {
subtotal: number;
shipping: number;
total: number;
onAddToCart: () => void;
onOpenMiniCart: () => void;
disabled?: boolean;
};


export default function BottomBar({ subtotal, shipping, total, onAddToCart, onOpenMiniCart, disabled }: Props) {
return (
<div className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t">
<div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
<div className="text-sm">
<div>小計: <span className="font-semibold">¥{subtotal.toLocaleString()}</span></div>
<div className="text-xs">送料: ¥{shipping.toLocaleString()}（¥5,000以上で無料）</div>
<div className="text-xs">合計: <span className="font-semibold">¥{total.toLocaleString()}</span></div>
</div>
<div className="flex gap-2">
<button className="px-4 py-2 rounded-xl border" onClick={onOpenMiniCart} aria-label="ミニカートを開く">
ミニカート
</button>
<button
className="px-5 py-2 rounded-xl bg-black text-white disabled:opacity-50"
onClick={onAddToCart}
disabled={disabled}
aria-label="カートに追加"
>
カートに追加
</button>
</div>
</div>
</div>
);
}
```
