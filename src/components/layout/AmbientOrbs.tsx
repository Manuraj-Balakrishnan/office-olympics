"use client";

import { motion } from "framer-motion";

const ORBS = [
  {
    className: "left-[6%] top-[18%] h-40 w-40",
    color: "var(--accent-blue)",
    opacity: 0.28,
    duration: 9,
    delay: 0,
  },
  {
    className: "right-[8%] top-[22%] h-48 w-48",
    color: "var(--accent-yellow)",
    opacity: 0.22,
    duration: 11,
    delay: 1.2,
  },
  {
    className: "bottom-[16%] left-[22%] h-44 w-44",
    color: "var(--accent-red)",
    opacity: 0.2,
    duration: 10,
    delay: 0.6,
  },
  {
    className: "bottom-[22%] right-[18%] h-36 w-36",
    color: "var(--accent-green)",
    opacity: 0.2,
    duration: 12,
    delay: 1.8,
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
            y: [0, -18, 0, 12, 0],
            x: [0, 10, -6, 4, 0],
            scale: [1, 1.08, 0.96, 1.04, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,var(--bg)_75%)] opacity-60" />
    </div>
  );
}
