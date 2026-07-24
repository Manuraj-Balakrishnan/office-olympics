"use client";

import { motion } from "framer-motion";

export function TimerBar({
  remainingMs,
  totalMs,
}: {
  remainingMs: number;
  totalMs: number;
}) {
  const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
  const color =
    ratio > 0.45
      ? "from-emerald-400 to-green-500"
      : ratio > 0.2
        ? "from-amber-300 to-yellow-500"
        : "from-orange-500 to-red-500";

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={false}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </div>
  );
}
