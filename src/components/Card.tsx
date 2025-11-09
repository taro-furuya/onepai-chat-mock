import React from "react";

const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className,
}) => (
  <section className={`rounded-2xl border shadow-sm bg-white p-4 md:p-6 ${className || ""}`}>
    {title && <h2 className="font-semibold mb-3">{title}</h2>}
    {children}
  </section>
);

export default Card;
