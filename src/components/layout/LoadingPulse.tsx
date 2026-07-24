"use client";

import { motion } from "framer-motion";

export function LoadingPulse({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4">
      <div className="flex items-end gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-9 w-2 rounded-full"
            style={{
              background: `color-mix(in srgb, var(--primary-to) ${55 + i * 10}%, var(--accent-2))`,
            }}
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.45, 1, 0.45] }}
            transition={{
              duration: 0.85,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <motion.p
        className="font-display text-xl font-bold text-[var(--fg-muted)]"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {label}
      </motion.p>
    </div>
  );
}
