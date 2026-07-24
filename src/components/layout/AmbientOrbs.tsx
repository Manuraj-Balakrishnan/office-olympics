"use client";

import { motion } from "framer-motion";

const ORBS = [
  {
    className: "left-[8%] top-[12%] h-56 w-56",
    color: "var(--primary-to)",
    opacity: 0.18,
    duration: 11,
    delay: 0,
  },
  {
    className: "right-[10%] top-[28%] h-44 w-44",
    color: "var(--accent-2)",
    opacity: 0.14,
    duration: 13,
    delay: 1.4,
  },
  {
    className: "bottom-[18%] left-[30%] h-40 w-40",
    color: "var(--primary-from)",
    opacity: 0.12,
    duration: 12,
    delay: 0.8,
  },
] as const;

export function AmbientOrbs() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          style={{ backgroundColor: orb.color, opacity: orb.opacity }}
          animate={{
            y: [0, -14, 0, 10, 0],
            x: [0, 8, -5, 3, 0],
            scale: [1, 1.06, 0.97, 1.03, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_25%,var(--bg)_80%)] opacity-70" />
    </div>
  );
}
