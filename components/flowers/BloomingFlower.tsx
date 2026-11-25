"use client";

import { motion } from "framer-motion";

interface BloomingFlowerProps {
  phase: "blooming" | "open";
  size?: number;
}

export function BloomingFlower({
  phase,
  size = 132,
}: BloomingFlowerProps) {
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Ambient halo */}
      <motion.div
        className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#F5A6C8]/40 via-[#C5B5F5]/35 to-[#FFD7C2]/40 blur-xl"
        animate={{
          scale: phase === "open" ? [1, 1.18, 1.05] : [0.92, 1.08, 0.92],
          opacity: phase === "open" ? 0.9 : 0.65,
        }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.svg
        viewBox="0 0 140 140"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-[0_10px_24px_rgba(217,121,167,0.22)]"
        animate={{ rotate: phase === "blooming" ? 360 : 12 }}
        transition={
          phase === "blooming"
            ? { duration: 10, repeat: Infinity, ease: "linear" }
            : { duration: 1.1, ease: "easeOut" }
        }
      >
        <defs>
          <linearGradient id="petalGradOuter" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5A6C8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#C5B5F5" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="petalGradInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF7FA" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#FBCFE8" stopOpacity="0.92" />
          </linearGradient>
        </defs>

        {/* Outer petals */}
        {petalAngles.map((angle, i) => (
          <motion.g
            key={`outer-${angle}`}
            initial={{ scale: 0.45, opacity: 0.5 }}
            animate={{
              scale: phase === "open" ? 1 : 0.85,
              opacity: 1,
            }}
            transition={{
              duration: 0.9,
              delay: i * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ originX: "70px", originY: "70px" }}
          >
            <ellipse
              cx="70"
              cy="30"
              rx="13"
              ry="26"
              fill="url(#petalGradOuter)"
              transform={`rotate(${angle} 70 70)`}
            />
          </motion.g>
        ))}

        {/* Inner petals */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(
          (angle, i) => (
            <motion.g
              key={`inner-${angle}`}
              initial={{ scale: 0.3, opacity: 0.4 }}
              animate={{
                scale: phase === "open" ? 1 : 0.72,
                opacity: 0.95,
              }}
              transition={{
                duration: 0.85,
                delay: 0.1 + i * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ originX: "70px", originY: "70px" }}
            >
              <ellipse
                cx="70"
                cy="42"
                rx="9"
                ry="18"
                fill="url(#petalGradInner)"
                transform={`rotate(${angle} 70 70)`}
              />
            </motion.g>
          )
        )}

        {/* Glowing flower core */}
        <circle cx="70" cy="70" r="14" fill="#FFF7FA" />
        <circle cx="70" cy="70" r="9" fill="#FFD7C2" />
      </motion.svg>
    </div>
  );
}
