import React from "react";
import Card from "../components/Card";

export default function Guidelines() {
  return (
    <section className="max-w-5xl mx-auto mt-6">
      <Card title="入稿規定">
        <ul className="list-disc ml-5 space-y-1 text-sm text-neutral-800">
          <li>推奨形式：AI / PDF（アウトライン化）/ PSD / PNG・JPG（解像度300dpi以上）</li>
          <li>
            デザインデータは<strong>白黒二値化</strong>したものでご用意ください。
          </li>
          <li>
            最小の線幅は<strong>0.3mm以上</strong>。※ご入稿後に調整をお願いする場合があります。
          </li>
          <li>色同士が隣接する場合は間に<strong>凸部</strong>が必要です。</li>
          <li>素材の個体差・製造時の小傷が残る場合があります。</li>
        </ul>

        <h3 className="font-semibold mt-6 mb-1">著作権・各種権利</h3>
        <p className="text-sm text-neutral-800">
          ご入稿デザインは第三者の権利を侵害しないものとみなします。万一権利者とのトラブルが発生した場合でも当方は責任を負いかねます。
        </p>
      </Card>
    </section>
  );
}
