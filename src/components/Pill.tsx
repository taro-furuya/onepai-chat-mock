import React from "react";
import { motion } from "framer-motion";

type Tone = "neutral" | "slate" | "indigo" | "emerald" | "amber" | "rose";

type Props = {
  active?: boolean;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

const Pill: React.FC<Props> = ({ active, tone = "neutral", onClick, className = "", children }) => {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      data-tone={tone}
      className={`pill ${active ? "pill-active" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default Pill;
