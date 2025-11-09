import React from "react";

export default function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border bg-white shadow-sm p-4 md:p-6 ${className}`}>
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : <div />}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
