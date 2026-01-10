/**
 * 実ファイルを返すだけの薄いヘルパー。
 * 画像は public/assets/tiles 以下に配置済み（拡張子は .jpg）。
 *
 * ディレクトリ構成:
 *  - /assets/tiles/manzu/{1m..9m, 赤5m}.jpg
 *  - /assets/tiles/pinzu/{1p..9p, 赤5p}.jpg
 *  - /assets/tiles/souzu/{1s..9s, 赤5s}.jpg
 *  - /assets/tiles/honor/{東,南,西,北,白,發,中,春,夏,秋,冬}.jpg
 */

// 共通のアセットパス解決（既存互換）
export const asset = (p: string) => `${import.meta.env.BASE_URL}assets/${p}`;

// 数牌（萬/筒/索）
export function getNumberTileSrc(
  suit: "manzu" | "pinzu" | "souzu",
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  aka5: boolean = false
): string {
  // 5 で赤指定が来たら「赤5{m|p|s}.jpg」を返す
  if (number === 5 && aka5) {
    const suf = suit === "manzu" ? "m" : suit === "pinzu" ? "p" : "s";
    return asset(`tiles/${suit}/赤5${suf}.jpg`);
  }
  const suf = suit === "manzu" ? "m" : suit === "pinzu" ? "p" : "s";
  return asset(`tiles/${suit}/${number}${suf}.jpg`);
}

// 字牌・花牌
export type HonorKey =
  | "東"
  | "南"
  | "西"
  | "北"
  | "白"
  | "發"
  | "中"
  | "春"
  | "夏"
  | "秋"
  | "冬";

export function getHonorTileSrc(honor: HonorKey): string {
  return asset(`tiles/honor/${honor}.jpg`);
}
