"use client";

import type { PlayerOrTeam } from "@/types/tournament";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

export function RankTable({
  rows,
}: {
  rows: { participant: PlayerOrTeam; total: number; lastDelta: number }[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg-card)]/60 backdrop-blur-sm">
      <table className="w-full text-left">
        <thead className="bg-white/5 text-sm uppercase tracking-wide text-[var(--fg-muted)]">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Competitor</th>
            <th className="px-4 py-3 text-right">Last</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <motion.tbody variants={staggerContainer} initial="hidden" animate="show">
          {rows.map((row, i) => (
            <motion.tr
              key={row.participant.id}
              variants={staggerItem}
              className="border-t border-white/5 transition hover:bg-white/[0.04]"
            >
              <td className="px-4 py-3 font-display font-bold text-[var(--fg-muted)]">
                #{i + 1}
              </td>
              <td className="px-4 py-3">
                <span className="mr-2 text-xl">{row.participant.emoji}</span>
                <span className="font-semibold">{row.participant.name}</span>
              </td>
              <td className="px-4 py-3 text-right">
                {row.lastDelta > 0 ? (
                  <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-sm font-semibold text-emerald-400">
                    +{row.lastDelta}
                  </span>
                ) : (
                  <span className="text-[var(--fg-muted)]">—</span>
                )}
              </td>
              <td
                className="px-4 py-3 text-right font-display text-lg font-extrabold"
                style={{ color: row.participant.color }}
              >
                {row.total}
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
