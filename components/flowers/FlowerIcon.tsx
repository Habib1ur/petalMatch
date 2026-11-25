"use client";

import { motion } from "framer-motion";

interface FlowerIconProps {
  className?: string;
  animate?: boolean;
}

export function FlowerIcon({
  className = "w-5 h-5",
  animate = true,
}: FlowerIconProps) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      animate={animate ? { rotate: [0, 360] } : undefined}
      transition={
        animate
          ? { duration: 24, repeat: Infinity, ease: "linear" }
          : undefined
      }
    >
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="16"
          cy="7.5"
          rx="4.1"
          ry="6.5"
          fill="currentColor"
          fillOpacity="0.82"
          transform={`rotate(${angle} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="3.6" fill="#FFF7FA" />
      <circle cx="16" cy="16" r="2" fill="#FFD7C2" />
    </motion.svg>
  );
}
