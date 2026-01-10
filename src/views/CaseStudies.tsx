import React from "react";
import Card from "../components/Card";

const CASE_EXAMPLES = [
  {
    title: "周年記念イベント",
    summary:
      "常連様向けに数量限定で配布したオリジナル名入れ牌。SNSでのシェア施策と組み合わせ、キャンペーン参加率が大幅に向上しました。",
    result: "SNS投稿数 180％UP / 来店予約120％UP",
  },
  {
    title: "展示会ブース演出",
    summary:
      "大型牌を用いたフォトスポットと名入れキーホルダーで企業の世界観を表現。来場者の滞在時間が伸び、商談件数の増加につながりました。",
    result: "名刺交換率 1.6倍 / 商談化率 130％",
  },
  {
    title: "プロリーグ優勝記念セット",
    summary:
      "選手名を刻印した記念セットを制作し、表彰式で贈呈。ライブ配信やファンコミュニティでの話題化にも貢献しました。",
    result: "ライブ配信視聴数 115％ / ECアクセス 140％",
  },
];

const CaseStudies: React.FC = () => (
  <main className="bg-neutral-50 pb-12">
    <div className="mx-auto max-w-5xl px-4">
      <header className="py-10 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">導入事例</h1>
        <p className="mt-3 text-sm text-neutral-600">
          one牌をご活用いただいたお客様の活用シーンをご紹介します。販促からイベント演出まで幅広くご相談ください。
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {CASE_EXAMPLES.map((item) => (
          <Card key={item.title} className="flex h-full flex-col justify-between bg-white/80">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{item.summary}</p>
            </div>
            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {item.result}
            </div>
          </Card>
        ))}
      </div>
    </div>
  </main>
);

export default CaseStudies;
