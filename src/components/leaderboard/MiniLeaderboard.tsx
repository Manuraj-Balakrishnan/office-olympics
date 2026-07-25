"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useTournamentStore } from "@/store/useTournamentStore";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export function MiniLeaderboard({ collapsible = true }: { collapsible?: boolean }) {
  const board = useLeaderboard();
  const played = useTournamentStore((s) => s.playedGames.length);
  const total = useTournamentStore((s) => s.gameOrder.length);

  return (
    <aside className="card-surface flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
      <div>
        <h3 className="font-display text-lg font-bold">Live Rankings</h3>
        <div className="mt-3">
          <ProgressBar current={played} total={total} />
        </div>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {board.map((row, i) => (
            <motion.li
              key={row.participant.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="flex items-center gap-3 rounded-xl bg-tone-5 px-3 py-2"
            >
              <span className="w-6 font-display text-sm font-bold text-[var(--fg-muted)]">
                {i + 1}
              </span>
              <PlayerAvatar
                avatar={row.participant.emoji}
                name={row.participant.name}
                size="sm"
                rounded="rounded-lg"
                color={row.participant.color}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.participant.name}</p>
                {row.lastDelta > 0 && (
                  <p className="text-xs text-emerald-400">+{row.lastDelta}</p>
                )}
              </div>
              <span
                className="font-display font-extrabold"
                style={{ color: row.participant.color }}
              >
                {row.total}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        {board.length === 0 && (
          <li className="text-sm text-[var(--fg-muted)]">Add players to see rankings.</li>
        )}
      </ul>
      {collapsible && (
        <p className="text-xs text-[var(--fg-muted)]">Ranks animate as scores update.</p>
      )}
    </aside>
  );
}
