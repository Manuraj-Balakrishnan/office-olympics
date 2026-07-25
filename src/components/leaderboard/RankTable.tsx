"use client";

import type { PlayerOrTeam } from "@/types/tournament";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export function RankTable({
  rows,
}: {
  rows: { participant: PlayerOrTeam; total: number; lastDelta: number }[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/60 backdrop-blur-sm">
      {/* Mobile: stacked cards */}
      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="divide-y divide-[var(--border)] sm:hidden"
      >
        {rows.map((row, i) => (
          <motion.li
            key={row.participant.id}
            variants={staggerItem}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <span className="w-8 shrink-0 font-display text-sm font-bold text-[var(--fg-muted)]">
              #{i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate">
              <span className="mr-1.5 inline-flex align-middle">
                <PlayerAvatar
                  avatar={row.participant.emoji}
                  name={row.participant.name}
                  size="sm"
                  rounded="rounded-lg"
                  color={row.participant.color}
                />
              </span>
              <span className="font-semibold">{row.participant.name}</span>
            </span>
            <div className="shrink-0 text-right">
              <p
                className="font-display text-lg font-extrabold"
                style={{ color: row.participant.color }}
              >
                {row.total}
              </p>
              {row.lastDelta > 0 ? (
                <span className="text-xs font-semibold text-emerald-400">
                  +{row.lastDelta}
                </span>
              ) : (
                <span className="text-xs text-[var(--fg-muted)]">—</span>
              )}
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {/* Desktop: table */}
      <table className="hidden w-full text-left sm:table">
        <thead className="bg-tone-5 text-sm uppercase tracking-wide text-[var(--fg-muted)]">
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
              className="border-t border-[var(--border)] transition hover:bg-tone-4"
            >
              <td className="px-4 py-3 font-display font-bold text-[var(--fg-muted)]">
                #{i + 1}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <PlayerAvatar
                    avatar={row.participant.emoji}
                    name={row.participant.name}
                    size="sm"
                    rounded="rounded-lg"
                    color={row.participant.color}
                  />
                  <span className="font-semibold">{row.participant.name}</span>
                </span>
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
