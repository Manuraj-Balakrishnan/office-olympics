"use client";

import { motion } from "framer-motion";
import type { PlayerOrTeam } from "@/types/tournament";

const PODIUM = [
  { place: 2, height: "h-28 md:h-36", gradient: "from-slate-300 to-slate-500", label: "Silver" },
  { place: 1, height: "h-40 md:h-52", gradient: "from-amber-300 to-yellow-600", label: "Gold" },
  { place: 3, height: "h-24 md:h-28", gradient: "from-amber-700 to-orange-900", label: "Bronze" },
] as const;

export function Podium({
  top,
}: {
  top: { participant: PlayerOrTeam; total: number }[];
}) {
  const ordered = [top[1], top[0], top[2]];

  return (
    <div
      id="podium-export"
      className="flex items-end justify-center gap-3 px-4 py-8 md:gap-6"
    >
      {PODIUM.map((slot, i) => {
        const row = ordered[i];
        if (!row) {
          return (
            <div key={slot.place} className={`w-24 md:w-36 ${slot.height} rounded-t-2xl bg-white/5`} />
          );
        }
        return (
          <div key={slot.place} className="flex w-28 flex-col items-center md:w-40">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.15 * i, stiffness: 200 }}
              className="mb-3 text-center"
            >
              <div className="text-4xl md:text-5xl">{row.participant.emoji}</div>
              <p className="mt-1 font-display text-sm font-bold md:text-base">
                {row.participant.name}
              </p>
              <p className="font-display text-lg font-extrabold" style={{ color: row.participant.color }}>
                {row.total}
              </p>
            </motion.div>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.1 * i }}
              style={{ originY: 1 }}
              className={`flex w-full ${slot.height} items-start justify-center rounded-t-2xl bg-gradient-to-b ${slot.gradient} pt-3 shadow-xl`}
            >
              <span className="font-display text-3xl font-extrabold text-black/70">
                {slot.place}
              </span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
