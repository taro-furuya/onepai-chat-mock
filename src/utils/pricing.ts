```ts
const total = keyholder + kiri;
return { keyholder, kiri, total };
}


export function calcDiscount({ category, qty }: DiscountInput) {
if (category === 'fullset') return qty >= 5 ? 0.2 : 0; // 5セット=20%
if (category === 'original') {
if (qty >= 10) return 0.15; // 10個=15%
if (qty >= 5) return 0.1; // 5個=10%
}
return 0; // regularは割引対象外
}


export function basePrice(category: Category) {
return BASE[category];
}


export function calcUnitPrice(args: {
category: Category;
rainbowUpcharge: number;
optionTotal: number;
colorSurcharge: number;
}) {
const base = basePrice(args.category);
return base + args.rainbowUpcharge + args.optionTotal + args.colorSurcharge;
}


export function summarize({
category,
qty,
unitPriceBeforeDiscount,
}: {
category: Category;
qty: number;
unitPriceBeforeDiscount: number;
}) {
const discountRate = calcDiscount({ category, qty });
const lineSubtotal = unitPriceBeforeDiscount * qty;
const discountAmount = Math.floor(lineSubtotal * discountRate);
const lineTotal = lineSubtotal - discountAmount;
return { discountRate, discountAmount, lineSubtotal, lineTotal };
}


export function calcShipping(subtotalAfterDiscount: number) {
return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}
```
