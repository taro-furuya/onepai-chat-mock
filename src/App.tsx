import React, { useEffect, useState } from "react";
import Nav, { type View } from "./components/Nav";
import Shop from "./views/Shop";
import Guidelines from "./views/Guidelines";
import Corporate from "./views/Corporate";

export default function App() {
  const [activeView, setActiveView] = useState<View>(() => {
    const h = (location.hash || "").replace("#", "");
    return (["shop", "guidelines", "corporate"] as View[]).includes(h as View) ? (h as View) : "shop";
  });

  useEffect(() => {
    const onHash = () => {
      const h = (location.hash || "").replace("#", "");
      if ((["shop", "guidelines", "corporate"] as View[]).includes(h as View)) setActiveView(h as View);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goto = (v: View) => {
    if (location.hash !== `#${v}`) location.hash = v;
    else setActiveView(v);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav active={activeView} goto={goto} />
      {activeView === "shop" && <Shop />}
      {activeView === "guidelines" && <Guidelines />}
      {activeView === "corporate" && <Corporate />}
    </div>
  );
}
