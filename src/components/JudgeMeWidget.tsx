import React, { useEffect, useId } from "react";

const SCRIPT_ID = "judgeme-widget-loader";

const JUDGEME_CONFIG = {
  shopDomain: "onlyonepai.com",
  productId: "onepai-name-tile",
  productHandle: "name-tile",
  productName: "one牌 名入れ牌",
  productUrl: "https://onlyonepai.com/",
};

const refreshJudgeMe = () => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { jdgm?: { renderBadges?: () => void; renderWidgets?: () => void } };
  w.jdgm?.renderBadges?.();
  w.jdgm?.renderWidgets?.();
};

const loadJudgeMeScript = () => {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    refreshJudgeMe();
    return;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://cdn.judge.me/widget_preloader.js";
  script.async = true;
  script.dataset.jdgmShopDomain = JUDGEME_CONFIG.shopDomain;
  script.dataset.jdgmPlatform = "custom";
  script.addEventListener("load", refreshJudgeMe);
  document.body.appendChild(script);
};

const JudgeMeWidget: React.FC = () => {
  const widgetDomId = useId().replace(/:/g, "-");

  useEffect(() => {
    loadJudgeMeScript();
  }, []);

  return (
    <div className="space-y-3">
      <div
        id={widgetDomId}
        className="jdgm-widget jdgm-review-widget"
        data-widget="product_page"
        data-shop-domain={JUDGEME_CONFIG.shopDomain}
        data-product-id={JUDGEME_CONFIG.productId}
        data-product-handle={JUDGEME_CONFIG.productHandle}
        data-product-title={JUDGEME_CONFIG.productName}
        data-url={JUDGEME_CONFIG.productUrl}
      />
      <p className="text-xs text-neutral-500">
        Judge.meのレビューを読み込んでいます。表示されない場合はページを再読み込みしてください。
      </p>
    </div>
  );
};

export default JudgeMeWidget;
