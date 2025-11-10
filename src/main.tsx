import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ★ Tailwind を有効化するための読み込み（必須）
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
