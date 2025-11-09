import React, { useState } from "react";

export default function Accordion({
  title,
  openDefault = false,
  children,
}: {
  title: string;
  openDefault?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(openDefault);
  return (
    <div className="border rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2"
      >
        <span className="font-medium">{title}</span>
        <span className="text-xs text-neutral-500">{open ? "閉じる" : "開く"}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
