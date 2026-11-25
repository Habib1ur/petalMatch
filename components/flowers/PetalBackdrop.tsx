"use client";

import type { CSSProperties } from "react";

interface PetalBackdropProps {
  intensity?: "calm" | "celebrate";
}

const PETALS = [
  { left: "6%", size: 16, duration: 15, delay: 0, drift: "38px", rot: "220deg", color: "#F5A6C8" },
  { left: "15%", size: 12, duration: 19, delay: -4, drift: "-32px", rot: "300deg", color: "#E9D5FF" },
  { left: "26%", size: 18, duration: 17, delay: -8, drift: "46px", rot: "190deg", color: "#FFD7C2" },
  { left: "37%", size: 13, duration: 21, delay: -2, drift: "-28px", rot: "270deg", color: "#FBCFE8" },
  { left: "49%", size: 15, duration: 16, delay: -11, drift: "34px", rot: "250deg", color: "#C5B5F5" },
  { left: "61%", size: 17, duration: 18, delay: -6, drift: "-42px", rot: "210deg", color: "#F5A6C8" },
  { left: "73%", size: 12, duration: 20, delay: -13, drift: "26px", rot: "320deg", color: "#FFD7C2" },
  { left: "84%", size: 16, duration: 15, delay: -3, drift: "-35px", rot: "240deg", color: "#FBCFE8" },
  { left: "92%", size: 14, duration: 18, delay: -9, drift: "-24px", rot: "280deg", color: "#E9D5FF" },
  { left: "44%", size: 11, duration: 14, delay: -5, drift: "20px", rot: "180deg", color: "#F5A6C8" },
];

const PARTICLES = [
  { top: "18%", left: "14%", size: 7, delay: "0s", duration: "4.8s" },
  { top: "28%", left: "82%", size: 9, delay: "-1.5s", duration: "5.5s" },
  { top: "64%", left: "18%", size: 6, delay: "-2.2s", duration: "6s" },
  { top: "74%", left: "78%", size: 8, delay: "-0.8s", duration: "5.2s" },
  { top: "45%", left: "88%", size: 5, delay: "-3.1s", duration: "4.4s" },
  { top: "14%", left: "60%", size: 6, delay: "-1.9s", duration: "5.8s" },
];

export function PetalBackdrop({ intensity = "calm" }: PetalBackdropProps) {
  const speedFactor = intensity === "celebrate" ? 0.62 : 1;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      {/* Dreamy pastel gradient base */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background:
            intensity === "celebrate"
              ? "linear-gradient(135deg, #FDF2F8 0%, #F3E8FF 52%, #FFF7ED 100%)"
              : "linear-gradient(135deg, #FBCFE8 0%, #E9D5FF 50%, #FFF1E6 100%)",
          opacity: intensity === "celebrate" ? 0.92 : 0.72,
        }}
      />

      {/* Soft ambient radial glows */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F5A6C8]/25 blur-3xl" />
      <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#C5B5F5]/25 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-[#FFD7C2]/30 blur-3xl" />

      {/* Slowly rotating transparent SVG flowers in corners */}
      <svg
        viewBox="0 0 200 200"
        className="animate-slow-spin absolute -top-20 -right-20 h-72 w-72 text-[#D979A7]/12 hidden sm:block"
        fill="currentColor"
      >
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx="100"
            cy="42"
            rx="22"
            ry="42"
            transform={`rotate(${a} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="18" fill="#FFF7FA" fillOpacity="0.6" />
      </svg>

      <svg
        viewBox="0 0 200 200"
        className="animate-slow-spin absolute -bottom-24 -left-24 h-80 w-80 text-[#C5B5F5]/16 hidden sm:block"
        fill="currentColor"
      >
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="100"
            cy="44"
            rx="24"
            ry="44"
            transform={`rotate(${a} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="16" fill="#FFF7FA" fillOpacity="0.6" />
      </svg>

      {/* Subtle glowing particles */}
      {PARTICLES.map((p, idx) => (
        <span
          key={idx}
          className="animate-particle-glow absolute rounded-full bg-white/80 shadow-[0_0_16px_rgba(255,255,255,0.9)]"
          style={
            {
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              "--glow-delay": p.delay,
              "--glow-duration": p.duration,
            } as CSSProperties
          }
        />
      ))}

      {/* Falling & floating flower petals */}
      {PETALS.map((petal, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 32"
          className="animate-petal-fall absolute -top-10"
          style={
            {
              left: petal.left,
              width: petal.size,
              height: petal.size * 1.3,
              "--petal-duration": `${(petal.duration * speedFactor).toFixed(1)}s`,
              "--petal-delay": `${petal.delay}s`,
              "--petal-drift": petal.drift,
              "--petal-rot": petal.rot,
            } as CSSProperties
          }
        >
          <path
            d="M12 1C17.5 6.5 21 13.5 19.5 21C18.3 27 14.8 30.5 12 31C9.2 30.5 5.7 27 4.5 21C3 13.5 6.5 6.5 12 1Z"
            fill={petal.color}
            fillOpacity="0.72"
          />
        </svg>
      ))}
    </div>
  );
}
