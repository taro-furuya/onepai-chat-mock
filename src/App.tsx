// src/App.tsx
import React from "react";
import Shop from "./views/Shop";
import Guidelines from "./views/Guidelines";
import Corporate from "./views/Corporate";

const App: React.FC = () => {
  const hash = typeof window !== "undefined" ? window.location.hash : "";

  const gotoCorporate = () => {
    window.location.hash = "#/corporate";
  };

  const gotoGuidelines = () => {
    window.location.hash = "#/guidelines";
  };

  // 簡易ルーティング（ハッシュ）
  if (hash.startsWith("#/guidelines")) return <Guidelines />;
  if (hash.startsWith("#/corporate")) return <Corporate />;

  // ★ Shop へ必須の gotoCorporate を渡す
  return <Shop gotoCorporate={gotoCorporate} />;
};

export default App;
