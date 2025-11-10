import React, { useEffect, useSyncExternalStore } from "react";
import Nav from "./components/Nav";
import Shop from "./views/Shop";
import Guidelines from "./views/Guidelines";
import Corporate from "./views/Corporate";

const useHash = () =>
  useSyncExternalStore(
    (cb) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); },
    () => window.location.hash || "#/",
    () => "#/"
  );

const App: React.FC = () => {
  const hash = useHash();

  const gotoCorporate = () => { window.location.hash = "#/corporate"; };

  let View: React.ReactNode = <Shop gotoCorporate={gotoCorporate} />;
  if (hash.startsWith("#/guidelines")) View = <Guidelines />;
  if (hash.startsWith("#/corporate")) View = <Corporate />;

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "#/";
  }, []);

  return (
    <>
      <Nav />
      {View}
    </>
  );
};

export default App;
