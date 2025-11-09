import React from "react";

const Pill: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
  type?: "button" | "submit" | "reset";
  big?: boolean;
}> = ({ active, onClick, children, title, type = "button", big }) => (
  <button
    type={type}
    onClick={onClick}
    title={title}
    className={`${big ? "px-4 py-2" : "px-3 py-1"} rounded-xl text-sm border transition ${
      active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50"
    }`}
  >
    {children}
  </button>
);

export default Pill;
