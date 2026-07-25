"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  HelpCircle,
  Keyboard,
  LayoutGrid,
  Medal,
  Music,
  Palette,
  Puzzle,
  Search,
  Shuffle,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { GameResultSummary, GameScoreRow, LeaderboardRow } from "@/hooks/useSession";
import { resolveGame } from "@/data/games";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const MEDAL = ["🥇", "🥈", "🥉"];

const GAME_ICONS: Record<string, LucideIcon> = {
  Zap,
  Music,
  LayoutGrid,
  Search,
  Eye,
  Palette,
  Keyboard,
  Puzzle,
  Shuffle,
  HelpCircle,
};

export function gameIconFor(iconName: string): LucideIcon {
  return GAME_ICONS[iconName] ?? Zap;
}

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
    <div className={compact ? "" : "card-surface !p-0 overflow-hidden"}>
      {!compact && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 sm:px-5 sm:py-3.5">
          <h3 className="flex min-w-0 items-center gap-2 font-display text-base font-bold sm:text-lg">
            <Trophy className="h-4 w-4 shrink-0 text-[var(--primary-from)] sm:h-5 sm:w-5" />
            <span className="truncate">{title}</span>
          </h3>
          <p className="shrink-0 rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--fg)] sm:px-2.5 sm:py-1 sm:text-xs">
            {rows.length}
          </p>
        </div>
      )}
      <ol className={compact ? "space-y-2" : "divide-y divide-[var(--border)]"}>
        <AnimatePresence initial={false}>
          {rows.map((row, i) => {
            const mine = highlightId === row.participant.id;
            return (
              <motion.li
                key={row.participant.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm sm:gap-3 sm:px-5 sm:py-3 ${
                  compact
                    ? `rounded-xl ${mine ? "bg-[var(--ring)]/25 ring-1 ring-[var(--ring)]" : "bg-tone-5"}`
                    : mine
                      ? "bg-[color-mix(in_srgb,var(--ring)_12%,transparent)]"
                      : "transition hover:bg-tone-4"
                }`}
              >
                <span className="w-7 shrink-0 font-display font-bold text-[var(--fg-muted)]">
                  {i < 3 ? MEDAL[i] : `#${i + 1}`}
                </span>
                <PlayerAvatar
                  avatar={row.participant.emoji}
                  name={row.participant.name}
                  size="sm"
                  rounded="rounded-lg"
                  color={row.participant.color}
                />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.participant.name}
                  {mine ? " · you" : ""}
                </span>
                <span
                  className="font-display text-lg font-extrabold tabular-nums"
                  style={{ color: row.participant.color }}
                >
                  {row.total}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {rows.length === 0 && (
          <li className={`text-sm text-[var(--fg-muted)] ${compact ? "" : "px-5 py-6"}`}>
            No scores yet — first game pending.
          </li>
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
                    ? "bg-tone-10"
                    : "bg-tone-5"
              }`}
            >
              <span className="w-6 text-sm text-[var(--fg-muted)]">
                {rank === undefined ? "·" : rank < 3 ? MEDAL[rank] : `#${rank + 1}`}
              </span>
              <PlayerAvatar avatar={row.emoji} name={row.name} size="sm" rounded="rounded-lg" />
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
    <div className="card-surface !p-0 space-y-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 sm:px-5 sm:py-3.5">
        <h3 className="flex min-w-0 items-center gap-2 font-display text-base font-bold sm:text-lg">
          <Medal className="h-4 w-4 shrink-0 text-[var(--accent-warm)] sm:h-5 sm:w-5" />
          <span className="truncate">Per-game leaders</span>
        </h3>
        <p className="shrink-0 rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--fg)] sm:px-2.5 sm:py-1 sm:text-xs">
          {list.length}
        </p>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {list.map((g) => {
          const rows = showFullRankings
            ? g.rankings.filter((r) => r.done)
            : g.top;
          const winner = rows[0];
          return (
            <li
              key={g.gameId}
              className={`px-3.5 py-3 transition hover:bg-tone-4 sm:px-5 ${
                g.isCurrent
                  ? "bg-[color-mix(in_srgb,var(--primary-from)_10%,transparent)]"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold sm:text-base">
                      {g.title}
                    </p>
                    {g.isCurrent && (
                      <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary-from)_20%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--primary-from)]">
                        Live
                      </span>
                    )}
                  </div>
                  {!showFullRankings && winner && (
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--fg-muted)] sm:text-sm">
                      <span>{MEDAL[0]}</span>
                      <PlayerAvatar
                        avatar={winner.emoji}
                        name={winner.name}
                        size="xs"
                        rounded="rounded-md"
                      />
                      <span className="truncate">{winner.name}</span>
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
                      <PlayerAvatar
                        avatar={row.emoji}
                        name={row.name}
                        size="xs"
                        rounded="rounded-md"
                      />
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
    <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-tone-4 px-3 py-2.5 sm:px-4">
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
                  ? "bg-[var(--ring)] shadow-[0_0_10px_color-mix(in_srgb,var(--ring)_45%,transparent)]"
                  : "bg-tone-10"
            }`}
          />
        );
      })}
      <span className="ml-1.5 shrink-0 text-xs font-semibold tabular-nums text-[var(--fg-muted)]">
        {Math.min(idx + 1, order.length)}/{order.length}
      </span>
    </div>
  );
}

/** Ordered lineup shown in waiting rooms before the tournament starts */
export function LobbyGamesList({
  order,
  title = "Games lineup",
  columns = false,
  compact = false,
  layout = "list",
}: {
  order: string[];
  title?: string;
  /** 2-column grid from sm up (cast / wide screens) */
  columns?: boolean;
  /** Denser rows — hide descriptions (player waiting room) */
  compact?: boolean;
  /** strip = horizontal filmstrip (waiting room stage layout) */
  layout?: "list" | "strip";
}) {
  const games = order
    .map((id, i) => {
      const game = resolveGame(id);
      return game ? { index: i + 1, game } : null;
    })
    .filter((g): g is NonNullable<typeof g> => g != null);

  if (layout === "strip") {
    return (
      <section className="@container min-w-0">
        <div className="mb-3 flex items-baseline justify-between gap-3 sm:mb-3.5">
          <h3 className="font-display text-base font-bold sm:text-lg">{title}</h3>
          <p className="text-xs tabular-nums text-[var(--fg-muted)] sm:text-sm">
            <span className="font-bold text-[var(--fg)]">{games.length}</span>
            {" round"}
            {games.length === 1 ? "" : "s"}
          </p>
        </div>
        {/* Container-aware cols so narrow player pages stay readable */}
        <ol className="grid grid-cols-2 gap-2.5 @min-[22rem]:grid-cols-3 @min-[32rem]:grid-cols-4 @min-[44rem]:grid-cols-5">
          {games.map(({ index, game }) => {
            const Icon = GAME_ICONS[game.icon] ?? Zap;
            return (
              <li
                key={game.id}
                className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-tone-4/90 p-2.5 transition hover:border-[var(--border-strong)] hover:bg-tone-5 sm:gap-2.5 sm:p-3"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 70% at 100% 0%, color-mix(in srgb, var(--primary-from) 14%, transparent), transparent 55%)",
                  }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tabular-nums tracking-wide text-[var(--fg-muted)]">
                    {String(index).padStart(2, "0")}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary-from)_18%,transparent)] text-[var(--primary-from)] sm:h-8 sm:w-8 sm:rounded-xl">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
                <p className="relative line-clamp-2 text-[12px] font-semibold leading-snug sm:text-[13px]">
                  {game.title}
                </p>
              </li>
            );
          })}
          {games.length === 0 && (
            <li className="col-span-full px-2 py-4 text-sm text-[var(--fg-muted)]">
              No games scheduled.
            </li>
          )}
        </ol>
      </section>
    );
  }

  return (
    <section className="card-surface !p-0 overflow-hidden">
      <div
        className={`flex items-center justify-between gap-3 border-b border-[var(--border)] ${
          compact ? "px-3.5 py-2.5 sm:px-4" : "px-3.5 py-3 sm:px-5 sm:py-3.5"
        }`}
      >
        <div className="min-w-0">
          <h3
            className={`font-display font-bold ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}
          >
            {title}
          </h3>
          {!compact && (
            <p className="mt-0.5 hidden text-xs text-[var(--fg-muted)] sm:block">
              Play order for this tournament
            </p>
          )}
        </div>
        <p className="shrink-0 rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--fg)]">
          {games.length} round{games.length === 1 ? "" : "s"}
        </p>
      </div>
      <ol
        className={
          columns
            ? "grid divide-y divide-[var(--border)] sm:grid-cols-2 sm:gap-px sm:divide-y-0 sm:bg-[var(--border)]"
            : "divide-y divide-[var(--border)]"
        }
      >
        {games.map(({ index, game }) => {
          const Icon = GAME_ICONS[game.icon] ?? Zap;
          return (
            <li
              key={game.id}
              className={`flex items-center gap-2.5 transition hover:bg-tone-4 sm:gap-3 ${
                compact
                  ? "px-3.5 py-2 sm:px-4 sm:py-2.5"
                  : "px-3.5 py-2.5 sm:px-5 sm:py-3"
              } ${
                columns
                  ? "bg-[var(--bg-card)] sm:bg-[color-mix(in_srgb,var(--bg-card)_92%,transparent)]"
                  : ""
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-tone-8 text-[11px] font-bold tabular-nums text-[var(--fg-muted)]">
                {index}
              </span>
              <span
                className={`flex shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary-from)_18%,transparent)] text-[var(--primary-from)] ${
                  compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9 sm:rounded-xl"
                }`}
              >
                <Icon className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5 sm:h-4 sm:w-4"} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{game.title}</p>
                {!compact && (
                  <p className="truncate text-[11px] text-[var(--fg-muted)] sm:text-xs">
                    {game.description}
                  </p>
                )}
              </div>
              {!compact && (
                <span className="hidden shrink-0 rounded-lg border border-[var(--border)] bg-tone-5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--fg-muted)] md:inline">
                  {game.difficulty}
                </span>
              )}
            </li>
          );
        })}
        {games.length === 0 && (
          <li className="px-5 py-6 text-sm text-[var(--fg-muted)]">No games scheduled.</li>
        )}
      </ol>
    </section>
  );
}
