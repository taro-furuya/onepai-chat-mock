```tsx
import React from 'react';
import type { TileSize } from '../types/cart';


type Props = {
size: TileSize;
value: { keyholder: boolean; kiriBox4: boolean };
onChange: (v: Props['value']) => void;
colorCount: number;
onColorCountChange: (n: number) => void;
};


export default function OptionsPanel({ size, value, onChange, colorCount, onColorCountChange }: Props) {
const kiriDisabled = size !== '28mm';
return (
<div className="space-y-3">
<div className="flex gap-2">
<button
className={`px-3 py-2 rounded-xl border ${value.keyholder ? 'bg-black text-white' : ''}`}
onClick={() => onChange({ ...value, keyholder: !value.keyholder })}
aria-pressed={value.keyholder}
>キーホルダー</button>


<button
disabled={kiriDisabled}
className={`px-3 py-2 rounded-xl border disabled:opacity-50 ${value.kiriBox4 ? 'bg-black text-white' : ''}`}
onClick={() => !kiriDisabled && onChange({ ...value, kiriBox4: !value.kiriBox4 })}
aria-pressed={value.kiriBox4}
>桐箱（4枚用）</button>
</div>


<label className="block text-sm">
色数（1色以上/追加1色ごと+¥200）
<input
type="number"
min={1}
value={colorCount}
onChange={(e) => onColorCountChange(Math.max(1, Number(e.target.value)))}
className="mt-1 w-28 rounded border px-2 py-1"
aria-label="色数"
/>
</label>
</div>
);
}
```
