import React from "react";

export default function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border shadow-sm bg-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base md:text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
