"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  /** Fire when true */
  active: boolean;
  /** Number of pieces */
  count?: number;
}

interface Piece {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  color: string;
  shape: "circle" | "rect" | "heart";
  delay: number;
}

const COLORS = [
  "#F5A6C8",
  "#C5B5F5",
  "#FFD7C2",
  "#FBCFE8",
  "#D979A7",
  "#E9D5FF",
  "#FDE68A",
  "#A7F3D0",
  "#FCA5A1",
  "#93C5FD",
];

/** Deterministic pseudo-random helper in [0, 1) so render stays pure */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function seededBetween(seed: number, a: number, b: number): number {
  return a + seededUnit(seed) * (b - a);
}

export function Confetti({ active, count = 48 }: ConfettiProps) {
  const pieces = useMemo<Piece[]>(() => {
    const shapes: Piece["shape"][] = ["circle", "rect", "heart"];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededBetween(i * 5 + 1, -220, 220),
      y: seededBetween(i * 5 + 2, -380, -120),
      rotate: seededBetween(i * 5 + 3, -360, 360),
      scale: seededBetween(i * 5 + 4, 0.5, 1.3),
      color: COLORS[i % COLORS.length],
      shape: shapes[i % 3],
      delay: seededBetween(i * 5 + 5, 0, 0.4),
    }));
  }, [count]);

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              initial={{
                opacity: 1,
                x: "50vw",
                y: "50vh",
                scale: 0,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                x: `calc(50vw + ${p.x}px)`,
                y: `calc(50vh + ${p.y}px)`,
                scale: [0, p.scale, p.scale * 0.6],
                rotate: p.rotate,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.6,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute"
              style={{ color: p.color }}
            >
              {p.shape === "circle" && (
                <svg width="10" height="10">
                  <circle cx="5" cy="5" r="5" fill="currentColor" />
                </svg>
              )}
              {p.shape === "rect" && (
                <svg width="8" height="12">
                  <rect
                    width="8"
                    height="12"
                    rx="1.5"
                    fill="currentColor"
                  />
                </svg>
              )}
              {p.shape === "heart" && (
                <svg width="12" height="11" viewBox="0 0 12 11">
                  <path
                    d="M6 10.5C6 10.5 0 7 0 3.5C0 1.5 1.5 0 3.5 0C4.8 0 5.6 0.6 6 1.2C6.4 0.6 7.2 0 8.5 0C10.5 0 12 1.5 12 3.5C12 7 6 10.5 6 10.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
