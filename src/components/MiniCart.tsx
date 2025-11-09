```tsx
import React, { useEffect, useRef } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';


type Props = {
open: boolean;
onClose: () => void;
children: React.ReactNode; // アイテムリスト
};


export default function MiniCart({ open, onClose, children }: Props) {
const ref = useRef<HTMLDivElement>(null);
useFocusTrap(ref, open);


useEffect(() => {
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
if (open) document.addEventListener('keydown', onKey);
return () => document.removeEventListener('keydown', onKey);
}, [open, onClose]);


if (!open) return null;


return (
<>
<div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
<div
ref={ref}
role="dialog"
aria-modal="true"
aria-label="ミニカート"
className="fixed bottom-[56px] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl rounded-2xl bg-white shadow-lg p-4"
>
<div className="flex justify-between items-center mb-2">
<h2 className="text-base font-semibold">ミニカート</h2>
<button onClick={onClose} aria-label="閉じる" className="p-1 rounded hover:bg-neutral-100">×</button>
</div>
<div className="max-h-[50vh] overflow-auto">{children}</div>
</div>
</>
);
}
```
