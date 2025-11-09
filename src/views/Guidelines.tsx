import React from "react";
import Card from "../components/Card";

export default function Guidelines() {
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
