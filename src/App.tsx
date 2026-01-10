import React, { useEffect, useSyncExternalStore } from "react";
import Nav from "./components/Nav";
import Shop from "./views/Shop";
import Guidelines from "./views/Guidelines";
import Corporate from "./views/Corporate";
import CaseStudies from "./views/CaseStudies";
import QAWidget from "./components/QAWidget";

const useHash = () =>
  useSyncExternalStore(
    (cb) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); },
    () => window.location.hash || "#/",
    () => "#/"
  );

const App: React.FC = () => {
  const hash = useHash();

  let View: React.ReactNode = <Shop />;
  if (hash.startsWith("#/guidelines")) View = <Guidelines />;
  if (hash.startsWith("#/corporate")) View = <Corporate />;
  if (hash.startsWith("#/cases")) View = <CaseStudies />;

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "#/";
  }, []);

  return (
    <>
      <Nav />
      {View}
      <QAWidget />
    </>
  );
};

export default App;
