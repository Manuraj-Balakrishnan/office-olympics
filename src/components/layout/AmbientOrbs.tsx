"use client";

import { motion } from "framer-motion";

const ORBS = [
  {
    className: "left-[6%] top-[10%] h-64 w-64",
    color: "var(--primary-from)",
    opacity: 0.12,
    duration: 12,
    delay: 0,
  },
  {
    className: "right-[8%] top-[22%] h-52 w-52",
    color: "var(--accent-2)",
    opacity: 0.12,
    duration: 14,
    delay: 1.2,
  },
  {
    className: "bottom-[12%] left-[36%] h-44 w-44",
    color: "var(--accent-warm)",
    opacity: 0.1,
    duration: 13,
    delay: 0.7,
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,var(--bg)_85%)] opacity-60" />
    </div>
  );
}
