import React, { useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Shop from "./views/Shop";
import Guidelines from "./views/Guidelines";
import Corporate from "./views/Corporate";

export type View = "shop" | "guidelines" | "corporate";

export default function App() {
  const [view, setView] = useState<View>("shop");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Nav active={view} onChange={setView} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Hero />
        {view === "shop" && <Shop />}
        {view === "guidelines" && <Guidelines />}
        {view === "corporate" && <Corporate />}
        <footer className="text-center text-xs text-neutral-500 py-8">
          © {new Date().getFullYear()} one牌 mock
        </footer>
      </main>
    </div>
  );
}
