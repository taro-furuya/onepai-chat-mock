import React from "react";
import { motion } from "framer-motion";

type Props = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

const Pill: React.FC<Props> = ({ active, onClick, className = "", children }) => {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      className={`pill ${active ? "pill-active" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default Pill;
