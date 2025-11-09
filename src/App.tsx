// src/App.tsx
import React, { useMemo, useRef, useState, useLayoutEffect } from "react";

/** ========== 型とユーティリティ ========== **/
type ColorKey = "black" | "red" | "blue" | "green" | "pink" | "rainbow";
const PALETTE: { key: ColorKey; label: string; style: React.CSSProperties }[] = [
  { key: "black", label: "黒", style: { background: "#0a0a0a" } },
  { key: "red", label: "赤", style: { background: "#d10f1b" } },
  { key: "blue", label: "青", style: { background: "#1f57c3" } },
  { key: "green", label: "緑", style: { background: "#0d7a3a" } },
  { key: "pink", label: "ピンク", style: { background: "#e75480" } },
  {
    key: "rainbow",
    label: "レインボー",
    style: {
      background:
        "linear-gradient(90deg,#d10f1b,#ffa500,#ffd400,#15b300,#1f57c3,#8b00ff)",
    },
  },
];

function mapColorStyle(c: ColorKey): React.CSSProperties {
  if (c === "rainbow") {
    return {
      background:
        "linear-gradient(90deg,#d10f1b,#ffa500,#ffd400,#15b300,#1f57c3,#8b00ff)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    } as React.CSSProperties;
  }
  const color =
    c === "black"
      ? "#0a0a0a"
      : c === "red"
      ? "#d10f1b"
      : c === "blue"
      ? "#1f57c3"
      : c === "green"
      ? "#0d7a3a"
      : "#e75480";
  return { color };
}

function sliceToTwoLines(src: string): [string, string] {
  // 4文字を超えたら 4 + 残り で2行へ
  const arr = Array.from(src);
  if (arr.length <= 4) return [arr.join(""), ""];
  return [arr.slice(0, 4).join(""), arr.slice(4).join("")];
}

function fillColors(perChar: ColorKey[], length: number): ColorKey[] {
  const base = perChar.length ? perChar.slice() : [];
  while (base.length < length) base.push("black");
  return base.slice(0, length);
}

/** ========== 牌プレビュー ========== **/
type TileProps = {
  lines: [string, string]; // 1行目/2行目（2行目は空文字の可）
  colors: ColorKey[]; // 各文字色（行またぎで 1行目→2行目の順）
  layout: "vertical" | "horizontal";
  fontFamily: string;
};

const MahjongTile: React.FC<TileProps> = ({
  lines,
  colors,
  layout,
  fontFamily,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(64); // 初期値は後で調整

  // 自動フィット：枠のサイズと文字数から大まかに算出（安定・高速）
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    // 牌の内側マージン
    const pad = Math.min(box.width, box.height) * 0.12;
    const innerW = box.width - pad * 2;
    const innerH = box.height - pad * 2;

    const line1 = Array.from(lines[0]).length || 1;
    const line2 = Array.from(lines[1]).length;
    const maxLineChars = Math.max(line1, line2);

    // 縦：縦書き1～2列／横：横書き1～2行として概算
    const lineCount = lines[1] ? 2 : 1;

    if (layout === "vertical") {
      // 1文字のボックスサイズ（内枠の高さを縦に均等割）
      const sizeByHeight = innerH / (maxLineChars + 0.2);
      // 横に 1～2 列ある想定なので、文字の幅にも余裕を見る
      const sizeByWidth = innerW / (lineCount + 0.4);
      setFontSize(Math.floor(Math.min(sizeByHeight, sizeByWidth)));
    } else {
      // 横の場合は 1～2 行に分ける
      const sizeByHeight = innerH / (lineCount + 0.1);
      const sizeByWidth = innerW / (maxLineChars + 0.2);
      setFontSize(Math.floor(Math.min(sizeByHeight, sizeByWidth)));
    }
  }, [lines, layout]);

  // 行を1つの文字配列に
  const chars = useMemo(() => {
    const a = Array.from(lines[0]);
    const b = Array.from(lines[1] || "");
    return [a, b] as [string[], string[]];
  }, [lines]);

  const content = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 18,
        background: "#fff",
        boxShadow: "inset 0 0 0 2px #111, 0 8px 24px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 面取り風の内枠 */}
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: 14,
          boxShadow: "inset 0 0 0 2px #111",
        }}
      />

      {/* 文字 */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          writingMode: layout === "vertical" ? "vertical-rl" : "horizontal-tb",
          gap: layout === "vertical" ? 10 : 4,
        }}
      >
        {chars.map((line, li) => (
          <div
            key={li}
            style={{
              display: "flex",
              flexDirection: layout === "vertical" ? "column" : "row",
              alignItems: "center",
              justifyContent: "center",
              // 文字間を詰め気味に
              gap: layout === "vertical" ? 6 : 8,
            }}
          >
            {line.map((ch, ci) => {
              const color = colors[li === 0 ? ci : chars[0].length + ci] || "black";
              return (
                <span
                  key={`${li}-${ci}`}
                  style={{
                    fontSize,
                    fontWeight: 600,
                    ...mapColorStyle(color),
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={outerRef}
      style={{
        width: 360,
        height: 480,
        borderRadius: 24,
        padding: 12,
        background:
          "linear-gradient(180deg,#f9fafb,#f3f4f6 35%,#f3f4f6 65%,#e5e7eb)",
        boxShadow:
          "0 10px 24px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.6) inset",
        transform: layout === "horizontal" ? "rotate(90deg)" : "none",
        transition: "transform .25s ease",
      }}
    >
      {content}
    </div>
  );
};

/** ========== メイン ========== **/
const App: React.FC = () => {
  const [text, setText] = useState("一刀");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [fontKey, setFontKey] = useState<"manzu" | "gothic" | "mincho">(
    "manzu"
  );
  const fontStack =
    fontKey === "manzu"
      ? `ta-fuga-fude, "TA風雅筆", "Hiragino Mincho ProN", "Yu Mincho", serif`
      : fontKey === "gothic"
      ? `system-ui, -apple-system, "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif`
      : `"Yu Mincho","Hiragino Mincho ProN",serif`;

  // 文字列を2行に分割
  const lines = useMemo(() => sliceToTwoLines(text.trim()), [text]);

  // 1文字ごとの色（行またぎで 1行目→2行目の順）
  const totalChars = Array.from(lines[0]).length + Array.from(lines[1]).length;
  const [perCharColor, setPerCharColor] = useState<ColorKey[]>([]);
  const safeColors = useMemo(
    () => fillColors(perCharColor, totalChars || 1),
    [perCharColor, totalChars]
  );

  // 文字ごと色のスウォッチ UI
  const ColorPickerRow: React.FC<{ index: number; char: string }> = ({
    index,
    char,
  }) => {
    const current = safeColors[index] || "black";
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "28px repeat(6, 28px)",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 600 }}>{char || "　"}</div>
        {PALETTE.map((p) => (
          <button
            key={p.key}
            title={p.label}
            onClick={() => {
              const next = safeColors.slice();
              next[index] = p.key;
              setPerCharColor(next);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              cursor: "pointer",
              ...(p.style as React.CSSProperties),
              outline:
                current === p.key ? "2px solid #111" : "1px solid #d1d5db",
              boxShadow:
                current === p.key ? "0 0 0 2px #fff inset" : "none",
            }}
          />
        ))}
      </div>
    );
  };

  // 1行目+2行目の配列化（色指定の一覧に使う）
  const charList = useMemo(() => {
    const a = Array.from(lines[0]);
    const b = Array.from(lines[1] || "");
    return [...a, ...b];
  }, [lines]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7f9",
        color: "#111827",
        fontFamily:
          'system-ui, -apple-system, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji"',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700 }}>one牌</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            プレビュー改善版（牌デザイン / 自動フィット / 1文字ごと色）
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
        {/* コントロール */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: 12 }}>入力</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>文字</div>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="全角4文字を超えると2行になります"
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>レイアウト</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setLayout("vertical")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: layout === "vertical" ? "#111" : "#fff",
                  color: layout === "vertical" ? "#fff" : "#111",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                縦
              </button>
              <button
                onClick={() => setLayout("horizontal")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: layout === "horizontal" ? "#111" : "#fff",
                  color: layout === "horizontal" ? "#fff" : "#111",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                横（牌ごと回転）
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 12,
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div>フォント</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setFontKey("manzu")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: fontKey === "manzu" ? "#111" : "#fff",
                  color: fontKey === "manzu" ? "#fff" : "#111",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                萬子風（TA風雅筆）
              </button>
              <button
                onClick={() => setFontKey("gothic")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: fontKey === "gothic" ? "#111" : "#fff",
                  color: fontKey === "gothic" ? "#fff" : "#111",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ゴシック
              </button>
              <button
                onClick={() => setFontKey("mincho")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: fontKey === "mincho" ? "#111" : "#fff",
                  color: fontKey === "mincho" ? "#fff" : "#111",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                明朝
              </button>
            </div>
          </div>
        </section>

        {/* プレビュー + 色指定 */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(360px, 420px) 1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 520,
            }}
          >
            <MahjongTile
              lines={lines}
              colors={safeColors}
              layout={layout}
              fontFamily={fontStack}
            />
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 10 }}>
              1文字ずつ色を選択
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {charList.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  文字を入力すると、ここに色の選択肢が表示されます。
                </div>
              ) : (
                charList.map((ch, i) => (
                  <ColorPickerRow key={i} index={i} char={ch} />
                ))
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
              ※ デフォルトは黒。レインボーはグラデーションで表現します。
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
