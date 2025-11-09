```ts
export type Category = 'original' | 'regular' | 'fullset';
export type TileSize = '28mm' | '30mm';


export type OptionFlags = {
keyholder: boolean;
kiriBox4: boolean; // 4枚用桐箱（28mmのみ）
};


export type DesignTab = 'name' | 'upload' | 'request';


export type ColorSpec = { charIndex: number; color: string };
export type FontKind = 'manzu' | 'gothic' | 'mincho';


export interface NameDesign {
textLines: string[]; // 1〜2行
vertical: boolean; // true=縦, false=横
rainbow: boolean; // 上下グラデ
font: FontKind;
perCharColors: ColorSpec[];
bulkColor?: string; // 一括色
}


export interface UploadDesign {
files: { id: string; name: string; url?: string; size: number; type: string }[];
colorCount: number; // 1色以上、追加1色=+¥200
}


export interface CartItem {
id: string;
category: Category;
size: TileSize;
qty: number;
options: OptionFlags;
note?: string;
designTab: DesignTab;
nameDesign?: NameDesign;
uploadDesign?: UploadDesign;
unitPrice: number; // 算出後の単価（割引前）
breakdown: string[]; // 見積明細（UI表示用）
}


export interface CartState {
items: CartItem[];
subtotal: number;
shipping: number;
discount: number;
total: number;
}
```
