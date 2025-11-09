// src/App.tsx
import React, { useState } from "react";

/**
 * one牌｜AIチャット購入体験（最小モック / 分割前ベース）
 * - まずは GitHub Pages にデプロイして表示確認できる内容。
 * - 後で views/ や components/ に切り出していく想定。
 */

type View = "shop" | "guidelines" | "corporate";

export default function App() {
  const [view, setView] = useState<View>("shop");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-semibold">one牌</div>
          <nav className="flex items-center gap-2 text-sm">
            <Tab active={view === "shop"} onClick={() => setView("shop")}>ショップ</Tab>
            <Tab active={view === "guidelines"} onClick={() => setView("guidelines")}>入稿規定</Tab>
            <Tab active={view === "corporate"} onClick={() => setView("corporate")}>法人お問い合わせ</Tab>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <Hero onPrimary={() => setView("shop")} onSecondary={() => setView("corporate")} />

        {view === "shop" && <ShopView />}
        {view === "guidelines" && <GuidelinesView />}
        {view === "corporate" && <CorporateView />}
      </main>

      {/* Footer (簡易) */}
      <footer className="py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} one牌 mock
      </footer>
    </div>
  );
}

/* ---------------- UI parts (あとで components/ へ分割予定) ---------------- */

function Tab({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded ${
        active ? "bg-black text-white" : "border hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}

function Card({
  title,
  children,
  right,
}: {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function Hero({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <section className="rounded-2xl border shadow-sm overflow-hidden">
      <div className="relative">
        <div className="h-40 md:h-56 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700" />
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
          <div className="text-white">
            <h1 className="text-xl md:text-3xl font-bold drop-shadow">
              one牌｜AIチャット購入体験 モック
            </h1>
            <p className="text-neutral-200 text-xs md:text-sm mt-1">
              チャットの流れで、そのままオリジナル麻雀牌を注文できるUIの試作です。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrimary}
              className="px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white text-neutral-900 shadow text-xs md:text-base font-medium"
            >
              オリジナル麻雀牌を作ってみる
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className="hidden md:inline-block px-4 md:px-5 py-2 md:py-3 rounded-xl bg-white/90 text-neutral-900 shadow text-xs md:text-base font-medium"
            >
              法人お問い合わせ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Views (あとで src/views へ分割予定) ---------------- */

function ShopView() {
  return (
    <Card title="ショップ（最小モック）">
      <p className="text-sm text-neutral-700">
        ここに「カテゴリ選択 → デザイン確認 → 注文情報へ反映 → カート追加」の本格UIを実装していきます。
        まずはデプロイ確認用にシンプルな見た目にしてあります。
      </p>

      {/* 触れる要素が何か一つあるとデプロイ確認がしやすいので簡易カウンタを置いています */}
      <div className="mt-4">
        <MiniCounter />
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        ※ 本番UIは <code>src/views/</code> と <code>src/components/</code> に分割して追加していきます。
      </div>
    </Card>
  );
}

function GuidelinesView() {
  return (
    <Card title="入稿規定">
      <ul className="list-disc ml-5 space-y-1 text-sm text-neutral-800">
        <li>推奨形式：AI / PDF（アウトライン化）/ PSD / PNG・JPG（解像度300dpi以上）</li>
        <li>デザインデータは<strong>白黒二値化</strong>したものでご用意ください。</li>
        <li>
          細すぎる線などは潰れてしまうため、最小線幅は<strong>0.3mm以上</strong>。色入れ面積が小さいと色が入らない場合があります。
        </li>
        <li>白色以外が隣接する場合は、色の間に<strong>凸部</strong>を作る必要があります。</li>
        <li>素材の小傷が残る場合があります。ご了承ください。</li>
      </ul>

      <h3 className="font-semibold mt-6 mb-1">著作権・各種権利</h3>
      <p className="text-sm text-neutral-800">
        ご入稿デザインは第三者の権利を侵害しないものとみなし、万一争いが生じた場合も当社は責任を負いません。
      </p>
    </Card>
  );
}

function CorporateView() {
  return (
    <Card title="法人向けお問い合わせ">
      <p className="text-sm text-neutral-600 mb-3">
        製作ロット・お見積もり・納期のご相談はこちらから。
      </p>
      <form className="grid md:grid-cols-2 gap-2">
        <input className="border rounded px-3 py-2" placeholder="会社名" />
        <input className="border rounded px-3 py-2" placeholder="ご担当者名" />
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="メールアドレス"
        />
        <textarea
          className="border rounded px-3 py-2 md:col-span-2 h-24"
          placeholder="お問い合わせ内容"
        />
        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-black text-white"
            onClick={() => alert("ダミー送信です")}
          >
            送信（ダミー）
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------- 小さな動作確認用コンポーネント ---------------- */

function MiniCounter() {
  const [n, setN] = useState(1);
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        className="px-3 py-1.5 rounded border"
        onClick={() => setN((v) => Math.max(0, v - 1))}
      >
        −
      </button>
      <span className="min-w-[3ch] text-center">{n}</span>
      <button
        type="button"
        className="px-3 py-1.5 rounded border"
        onClick={() => setN((v) => v + 1)}
      >
        ＋
      </button>
    </div>
  );
}
