"use client";

import { motion } from "framer-motion";

export function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const pct = total === 0 ? 0 : Math.min(100, (current / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-[var(--fg-muted)]">
        <span>{label ?? `Game ${Math.min(current, total)} of ${total}`}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full gradient-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
