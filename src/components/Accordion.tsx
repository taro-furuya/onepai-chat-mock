import React, { useState } from "react";

export default function Accordion({
  title,
  children,
  openDefault = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  openDefault?: boolean;
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
        <span className="text-neutral-500">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
