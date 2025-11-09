import React from "react";
import Card from "../components/Card";

export default function Corporate() {
  return (
    <section className="max-w-5xl mx-auto mt-6">
      <Card title="法人向けお問い合わせ">
        <p className="text-sm text-neutral-600 mb-3">製作ロット・お見積もり・納期のご相談はこちらから。</p>
        <form className="grid md:grid-cols-2 gap-2" onSubmit={(e) => e.preventDefault()}>
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
    </section>
  );
}
