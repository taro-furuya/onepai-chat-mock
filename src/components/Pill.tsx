import React from "react";

export default function Pill({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded ${active ? "bg-black text-white" : "border hover:bg-neutral-50"} ${className}`}
    >
      {children}
    </button>
  );
}
