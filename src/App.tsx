// src/App.tsx
import React, { useMemo, useState } from "react";
import NameTilePreview, { ColorKey } from "./components/NameTilePreview";

/** ---------------------------------------
 *  定数・ユーティリティ
 * ------------------------------------- */
type Layout = "vertical" | "horizontal";

const FONT_OPTIONS = [
  // デフォルトはご要望の TA風雅筆を優先
  { key: "ta-fuga-fude", label: "TA風雅筆（推奨）", stack: "ta-fuga-fude, sans-serif" },
  { key: "noto", label: "Noto Sans JP", stack: "'Noto Sans JP', system-ui, sans-serif" },
  { key: "gothic", label: "ゴシック（太め）", stack: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, Helvetica Neue, Arial, 'Apple Color Emoji','Segoe UI Emoji', 'Segoe UI Symbol', sans-serif" },
  { key: "kyokasho", label: "教科書体 風", stack: "'TsukuARdGothic-Regular', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif" },
  { key: "hand", label: "手書き風", stack: "'Yomogi', 'Kaisei Decol', 'M PLUS Rounded 1c', cursive, sans-serif" },
];

const COLOR_OPTIONS: { key: ColorKey; label: string }[] = [
  { key: "black", label: "黒" },
  { key: "red", label: "赤" },
  { key: "blue", label: "青" },
  { key: "green", label: "緑" },
  { key: "pink", label: "ピンク" },
  { key: "rainbow", label: "レインボー" },
];

const ensureLen = (arr: ColorKey[], len: number): ColorKey[] => {
  const out = arr.slice();
  while (out.length < len) out.push(out[0] ?? "black");
  return out.slice(0, len);
};

/** ---------------------------------------
 *  小物UI
 * ------------------------------------- */
function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1 rounded-full border text-sm",
        active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** ---------------------------------------
 *  アプリ本体
 * ------------------------------------- */
export default function App() {
  // カテゴリ
  const [category, setCategory] = useState<"original" | "regular">("original");

  // デザイン確認（名前入れ前提のプレビューUI）
  const [text, setText] = useState<string>("一刀");
  const [layout, setLayout] = useState<Layout>("vertical");
  const [fontKey, setFontKey] = useState<string>("ta-fuga-fude");

  // 色指定：単一色 or 1文字ずつ
  const [usePerChar, setUsePerChar] = useState<boolean>(false);
  const [colorsPerChar, setColorsPerChar] = useState<ColorKey[]>(["black"]);

  // セレクトUI用（単一色選択）
  const [singleColor, setSingleColor] = useState<ColorKey>("black");

  // NameTilePreview へ渡す colors
  const colorsForPreview: ColorKey[] = useMemo(() => {
    const len = Math.max(1, Array.from(text || "").length);
    if (!usePerChar) return Array(len).fill(singleColor) as ColorKey[];
    return ensureLen(colorsPerChar, len);
  }, [text, usePerChar, singleColor, colorsPerChar]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* ヘッダー */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold">one牌｜AIチャット購入体験 モック</div>
          <nav className="flex items-center gap-2">
            <a href="#" className="px-3 py-1 text-sm rounded border hover:bg-neutral-50">
              ショップ
            </a>
            <a href="#" className="px-3 py-1 text-sm rounded border hover:bg-neutral-50">
              入稿規定
            </a>
            <a href="#" className="px-3 py-1 text-sm rounded border hover:bg-neutral-50">
              法人お問い合わせ
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-16">
        {/* 1. カテゴリ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. カテゴリを選択</h2>

          <div className="grid md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCategory("original")}
              className={[
                "rounded-xl border p-4 text-left bg-white",
                category === "original" ? "ring-2 ring-black" : "hover:bg-neutral-50",
              ].join(" ")}
            >
              <div className="font-semibold">オリジナル麻雀牌</div>
              <div className="text-xs text-neutral-600 mt-1">
                あなただけのオリジナル牌が作成できます。アクセサリーやギフトにおすすめ！
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCategory("regular")}
              className={[
                "rounded-xl border p-4 text-left bg-white",
                category === "regular" ? "ring-2 ring-black" : "hover:bg-neutral-50",
              ].join(" ")}
            >
              <div className="font-semibold">通常牌（バラ売り）</div>
              <div className="text-xs text-neutral-600 mt-1">
                通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！
              </div>
            </button>
          </div>

          <ul className="text-sm text-neutral-700 list-disc ml-5 mt-2">
            <li>1つからの発送目安：<b>約2〜3週間</b>（受注状況により前後）</li>
            <li>割引：5個で10% / 10個で15%</li>
            <li>すべて税込みです。</li>
          </ul>
        </section>

        {/* 2. デザイン確認（オリジナルのみ表示） */}
        {category === "original" && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">2. デザイン確認</h2>

            {/* 入力エリア */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {/* タブ風（固定：名前入れ） */}
                <div className="flex items-center gap-2">
                  <Pill active>名前入れ</Pill>
                  <Pill>デザイン持ち込み</Pill>
                  <Pill>デザイン依頼</Pill>
                </div>

                {/* フォント */}
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm">フォント</label>
                  <select
                    className="border rounded px-3 py-2 w-60 bg-white"
                    value={fontKey}
                    onChange={(e) => setFontKey(e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 文字 */}
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm">文字</label>
                  <input
                    className="border rounded px-3 py-2 w-60 bg-white"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="例：一刀"
                  />
                </div>

                {/* レイアウト */}
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm">レイアウト</label>
                  <Pill active={layout === "vertical"} onClick={() => setLayout("vertical")}>
                    縦
                  </Pill>
                  <Pill active={layout === "horizontal"} onClick={() => setLayout("horizontal")}>
                    横
                  </Pill>
                </div>

                {/* 色の指定（セレクト化） */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm">色の指定</label>
                    <Pill active={!usePerChar} onClick={() => setUsePerChar(false)}>
                      単一色で進む
                    </Pill>
                    <Pill active={usePerChar} onClick={() => setUsePerChar(true)}>
                      1文字ずつ指定
                    </Pill>
                  </div>

                  {/* 単一色 */}
                  {!usePerChar && (
                    <div className="flex items-center gap-2">
                      <label className="w-24 text-sm">色</label>
                      <select
                        className="border rounded px-3 py-2 bg-white"
                        value={singleColor}
                        onChange={(e) => setSingleColor(e.target.value as ColorKey)}
                      >
                        {COLOR_OPTIONS.map((o) => (
                          <option key={o.key} value={o.key}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 1文字ずつ */}
                  {usePerChar && (
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-600">各文字の色を選択</div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {Array.from(text || "").map((ch, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-10 text-right text-sm">{ch}</div>
                            <select
                              className="border rounded px-3 py-2 bg-white flex-1"
                              value={ensureLen(colorsPerChar, text.length)[idx]}
                              onChange={(e) => {
                                const next = ensureLen(colorsPerChar, text.length);
                                next[idx] = e.target.value as ColorKey;
                                setColorsPerChar(next);
                              }}
                            >
                              {COLOR_OPTIONS.map((o) => (
                                <option key={o.key} value={o.key}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 大きめプレビュー */}
              <div className="flex items-center justify-center">
                <NameTilePreview
                  text={text}
                  layout={layout}
                  fontStack={FONT_OPTIONS.find((f) => f.key === fontKey)?.stack || ""}
                  colors={colorsForPreview}
                  size={1.15} // 大きめ表示
                />
              </div>
            </div>

            <p className="text-xs text-neutral-600">
              ※ 全角4文字を超えると自動的に2行になります。縦レイアウトでは縦書き、横レイアウトでは牌自体が横向き・横書きで表示されます。
            </p>
          </section>
        )}

        {/* 3. サイズ選択（ダミーUI） */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3. サイズ選択</h2>
          <div className="flex items-center gap-2">
            <Pill active>28mm</Pill>
            <Pill>30mm</Pill>
          </div>
        </section>

        {/* 4. オプション（ダミーUI） */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">4. オプションと数量</h2>
          <div className="text-sm text-neutral-600">
            キーホルダー / 桐箱 などのオプションは今後ここに追加予定です。
          </div>
        </section>
      </main>

      {/* ボトムサマリー（簡易） */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t">
        <div className="max-w-5xl mx-auto px-4 py-2 text-sm flex items-center justify-between">
          <div>小計: ¥0 / 割引: -¥0 / 送料: ¥0</div>
          <div className="font-semibold">合計: ¥0</div>
        </div>
      </div>
    </div>
  );
}
