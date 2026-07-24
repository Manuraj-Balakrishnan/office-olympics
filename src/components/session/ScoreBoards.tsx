"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GameResultSummary, GameScoreRow, LeaderboardRow } from "@/hooks/useSession";
import { Medal, Trophy } from "lucide-react";

const MEDAL = ["🥇", "🥈", "🥉"];

export function OverallLeaderboard({
  rows,
  highlightId,
  compact,
  title = "Overall leaderboard",
}: {
  rows: LeaderboardRow[];
  highlightId?: string;
  compact?: boolean;
  title?: string;
}) {
  return (
    <div className={compact ? "" : "card-surface"}>
      {!compact && (
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Trophy className="h-5 w-5 text-yellow-400" />
          {title}
        </h3>
      )}
      <ol className="space-y-2">
        <AnimatePresence initial={false}>
          {rows.map((row, i) => {
            const mine = highlightId === row.participant.id;
            return (
              <motion.li
                key={row.participant.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  mine ? "bg-[var(--ring)]/25 ring-1 ring-[var(--ring)]" : "bg-white/5"
                }`}
              >
                <span className="w-7 font-display font-bold text-[var(--fg-muted)]">
                  {i < 3 ? MEDAL[i] : `#${i + 1}`}
                </span>
                <span className="text-lg">{row.participant.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.participant.name}
                  {mine ? " · you" : ""}
                </span>
                <span
                  className="font-display text-lg font-extrabold"
                  style={{ color: row.participant.color }}
                >
                  {row.total}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {rows.length === 0 && (
          <li className="text-sm text-[var(--fg-muted)]">No scores yet — first game pending.</li>
        )}
      </ol>
    </div>
  );
}

export function CurrentGameScores({
  rows,
  title,
  highlightId,
}: {
  rows: GameScoreRow[];
  title: string;
  highlightId?: string;
}) {
  const scoredRank = new Map<string, number>();
  rows.filter((r) => r.done).forEach((r, i) => scoredRank.set(r.playerId, i));

  return (
    <div className="card-surface">
      <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
      <ul className="space-y-2">
        {rows.map((row) => {
          const rank = scoredRank.get(row.playerId);
          return (
            <li
              key={row.playerId}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                row.isTurn
                  ? "bg-[var(--ring)]/25 ring-1 ring-[var(--ring)]"
                  : highlightId === row.playerId
                    ? "bg-white/10"
                    : "bg-white/5"
              }`}
            >
              <span className="w-6 text-sm text-[var(--fg-muted)]">
                {rank === undefined ? "·" : rank < 3 ? MEDAL[rank] : `#${rank + 1}`}
              </span>
              <span className="text-xl">{row.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {row.name}
                  {row.isTurn && (
                    <span className="ml-2 text-xs font-bold uppercase text-[var(--ring)]">
                      playing
                    </span>
                  )}
                </p>
                {row.detail && row.done && (
                  <p className="text-xs text-[var(--fg-muted)]">{row.detail}</p>
                )}
              </div>
              <div className="text-right">
                <span className="font-display text-lg font-extrabold" style={{ color: row.color }}>
                  {row.done ? row.score : "—"}
                </span>
                {row.done && (
                  <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
                    /1000
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PerGameTops({
  games,
  showFullRankings,
}: {
  games: GameResultSummary[];
  showFullRankings?: boolean;
}) {
  const list = games.filter((g) => g.top.length > 0 || g.isCurrent);
  if (list.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold sm:text-xl">
        <Medal className="h-5 w-5 text-[var(--accent-warm)]" />
        Per-game leaders
      </h3>
      <ul className="overflow-hidden rounded-2xl border border-[var(--border)] divide-y divide-white/5">
        {list.map((g) => {
          const rows = showFullRankings
            ? g.rankings.filter((r) => r.done)
            : g.top;
          const winner = rows[0];
          return (
            <li
              key={g.gameId}
              className={`px-4 py-3 sm:px-5 ${
                g.isCurrent
                  ? "bg-[color-mix(in_srgb,var(--ring)_12%,transparent)]"
                  : "bg-[color-mix(in_srgb,var(--bg-card)_75%,transparent)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold sm:text-base">
                      {g.title}
                    </p>
                    {g.isCurrent && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--ring)]">
                        Live
                      </span>
                    )}
                  </div>
                  {!showFullRankings && winner && (
                    <p className="mt-0.5 truncate text-xs text-[var(--fg-muted)] sm:text-sm">
                      {MEDAL[0]} {winner.emoji} {winner.name}
                    </p>
                  )}
                </div>
                {!showFullRankings && winner && (
                  <span
                    className="shrink-0 font-display text-lg font-extrabold tabular-nums"
                    style={{ color: winner.color }}
                  >
                    {winner.score}
                  </span>
                )}
              </div>
              {showFullRankings && rows.length > 0 && (
                <ol className="mt-2 space-y-1">
                  {rows.map((row, i) => (
                    <li
                      key={row.playerId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-6">
                        {i < 3 ? MEDAL[i] : `#${i + 1}`}
                      </span>
                      <span>{row.emoji}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {row.name}
                      </span>
                      <span
                        className="font-display font-bold tabular-nums"
                        style={{ color: row.color }}
                      >
                        {row.score}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {rows.length === 0 && (
                <p className="mt-1 text-xs text-[var(--fg-muted)]">
                  Waiting for first score…
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GameProgressBar({
  order,
  currentId,
  played,
}: {
  order: string[];
  currentId: string | null;
  played: string[];
}) {
  const allDone = order.length > 0 && order.every((id) => played.includes(id));
  const idx = currentId ? order.indexOf(currentId) : played.length - 1;

  if (allDone && !currentId) {
    return (
      <p className="text-sm font-medium text-[var(--fg-muted)]">
        <span className="text-[var(--primary-from)]">{order.length}/{order.length}</span>
        {" · "}all games complete
      </p>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {order.map((id, i) => {
        const done = played.includes(id);
        const active = currentId === id;
        return (
          <div
            key={id}
            title={`${i + 1}`}
            className={`h-1.5 flex-1 rounded-full transition ${
              done
                ? "bg-[var(--primary-from)]"
                : active
                  ? "bg-[var(--ring)]"
                  : "bg-white/10"
            }`}
          />
        );
      })}
      <span className="ml-2 shrink-0 text-xs tabular-nums text-[var(--fg-muted)]">
        {Math.min(idx + 1, order.length)}/{order.length}
      </span>
    </div>
  );
}
