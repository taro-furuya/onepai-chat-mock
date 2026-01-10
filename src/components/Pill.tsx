import React from "react";
import { motion } from "framer-motion";

type Tone = "neutral" | "slate" | "indigo" | "emerald" | "amber" | "rose";

type Props = {
  active?: boolean;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

const Pill: React.FC<Props> = ({ active, tone = "neutral", onClick, className = "", children, disabled = false }) => {
  const handleClick = disabled ? undefined : onClick;
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      data-tone={tone}
      className={`pill ${active ? "pill-active" : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={active}
      aria-disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

export default Pill;
