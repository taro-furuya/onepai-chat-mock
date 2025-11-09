// src/App.tsx
import React, { useState } from "react";

/**
 * one牌｜AIチャット購入体験 モック（App Shell / v1）
 * - まずはデプロイ確認用の最小構成
 * - 3ビュー（ショップ / 入稿規定 / 法人問い合わせ）をタブ切替で表示
 * - 後で本実装を views/* に差し替えていく前提
 */

type View = "shop" | "guidelines" | "corporate";

export default function App() {
  const [view, setView] = useState<View>("shop");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-semibold">one牌</div>
          <nav className="flex gap-2 text-sm">
            <button
              className={`px-3 py-1 rounded ${view === "shop" ? "bg-black text-white" : "border"}`}
              onClick={() => setView("shop")}
            >
              ショップ
            </button>
            <button
              className={`px-3 py-1 rounded ${view === "guidelines" ? "bg-black text-white" : "border"}`}
              onClick={() => setView("guidelines")}
            >
              入稿規定
            </button>
            <button
              className={`px-3 py-1 rounded ${view === "corporate" ? "bg-black text-white" : "border"}`}
              onClick={() => setView("corporate")}
            >
              法人お問い合わせ
            </button>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Hero />

        {view === "shop" && <ShopStub />}
        {view === "guidelines" && <GuidelinesStub />}
        {view === "corporate" && <CorporateStub />}

        {/* フッタ（最低限） */}
        <footer className="text-center text-xs text-neutral-500 py-8">
          © {new Date().getFullYear()} one牌 mock
        </footer>
      </main>
    </div>
  );
}

/* ------- 以下は “まずは表示確認” 用のスタブ。後で views/* へ差し替えます。 ------- */

function Hero() {
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
              まずはデプロイ確認版です。あとから本実装（分割ファイル）を流し込みます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold mb-2">{title}</h2>
      {children}
    </section>
  );
}

function ShopStub() {
  return (
    <Card title="ショップ（モック最小版）">
      <p className="text-sm text-neutral-700">
        ここに「AIチャット購入体験」の本体 UI を差し込みます。
        <br />
        次のステップで
        <code className="px-1 py-0.5 bg-neutral-100 rounded mx-1">views/Shop.tsx</code>
        を作成し、App から読み込む形に差し替えます。
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-3">
          <div className="font-medium">オリジナル麻雀牌</div>
          <div className="text-xs text-neutral-500 mt-1">
            あなただけのオリジナル牌が作成できます。アクセサリーやギフトにおすすめ！
          </div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="font-medium">通常牌（バラ売り）</div>
          <div className="text-xs text-neutral-500 mt-1">
            通常牌も1枚からご購入いただけます。もちろんキーホルダー対応も！
          </div>
        </div>
      </div>
    </Card>
  );
}

function GuidelinesStub() {
  return (
    <Card title="入稿規定（要点）">
      <ul className="list-disc ml-5 space-y-1 text-sm text-neutral-800">
        <li>推奨形式：AI / PDF（アウトライン化）/ PSD / PNG・JPG（300dpi以上）</li>
        <li>デザインデータは<strong>白黒二値化</strong>でご用意ください。</li>
        <li>最小線幅は<strong>0.3mm以上</strong>を推奨します。</li>
      </ul>
    </Card>
  );
}

function CorporateStub() {
  return (
    <Card title="法人向けお問い合わせ（ダミー）">
      <form className="grid md:grid-cols-2 gap-2">
        <input className="border rounded px-3 py-2" placeholder="会社名" />
        <input className="border rounded px-3 py-2" placeholder="ご担当者名" />
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="メールアドレス" />
        <textarea className="border rounded px-3 py-2 md:col-span-2 h-24" placeholder="お問い合わせ内容" />
        <div className="md:col-span-2 flex justify-end">
          <button type="button" className="px-4 py-2 rounded-xl bg-black text-white">
            送信（ダミー）
          </button>
        </div>
      </form>
    </Card>
  );
}
