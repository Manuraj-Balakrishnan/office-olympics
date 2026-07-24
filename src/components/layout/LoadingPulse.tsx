"use client";

import { motion } from "framer-motion";

const RING_COLORS = [
  "var(--accent-blue)",
  "var(--accent-yellow)",
  "#111111",
  "var(--accent-green)",
  "var(--accent-red)",
] as const;

export function LoadingPulse({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4">
      <div className="flex items-end gap-2">
        {RING_COLORS.map((color, i) => (
          <motion.span
            key={i}
            className="h-10 w-2.5 rounded-full"
            style={{ background: color }}
            animate={{ scaleY: [0.45, 1, 0.45], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.12,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <motion.p
        className="font-display text-xl font-bold text-gradient"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {label}
      </motion.p>
    </div>
  );
}
