import React from "react";
import Card from "../components/Card";

export default function Shop() {
  return (
    <Card title="ショップ（最小モック）">
      <p className="text-sm text-neutral-700 mb-3">
        ここに「AIチャット購入体験」の本体 UI を差し込みます。まずはカテゴリの説明だけ配置します。
      </p>

      <div className="grid gap-3 md:grid-cols-2">
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
