"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Hourglass, Users } from "lucide-react";
import { springSoft, springSnappy } from "@/lib/motion";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export function ScoreSubmittedCard({
  gameTitle,
  gameIndex,
  gameTotal,
  score,
  detail,
  playerEmoji,
  playerColor,
  submittedCount,
  playerCount,
  roundComplete,
  othersWaiting,
}: {
  gameTitle: string;
  gameIndex: number;
  gameTotal: number;
  score: number;
  detail?: string | null;
  playerEmoji: string;
  playerColor: string;
  submittedCount: number;
  playerCount: number;
  roundComplete: boolean;
  othersWaiting: number;
}) {
  const reduceMotion = useReducedMotion();
  const progress =
    playerCount > 0 ? Math.min(100, (submittedCount / playerCount) * 100) : 0;

  const waitCopy = roundComplete
    ? "Everyone’s in — host will start the next game."
    : othersWaiting > 0
      ? `Waiting for ${othersWaiting} other player${othersWaiting === 1 ? "" : "s"}…`
      : "Waiting for the host…";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springSoft}
      className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] text-left sm:rounded-3xl"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% -10%, color-mix(in srgb, ${playerColor} 22%, transparent), transparent 55%),
            radial-gradient(ellipse 55% 50% at 100% 100%, color-mix(in srgb, var(--primary-from) 12%, transparent), transparent 50%)
          `,
        }}
      />

      <div className="relative space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--fg-muted)] sm:text-[11px] sm:tracking-[0.2em]">
              Game {gameIndex} of {gameTotal}
            </p>
            <h2 className="break-words font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl md:text-3xl">
              {gameTitle}
            </h2>
          </div>
          <span
            className="flex shrink-0 items-center justify-center rounded-xl sm:rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${playerColor} 18%, transparent)`,
              boxShadow: `0 0 0 1.5px color-mix(in srgb, ${playerColor} 40%, transparent)`,
            }}
            aria-hidden
          >
            <PlayerAvatar
              avatar={playerEmoji}
              size="lg"
              rounded="rounded-xl sm:rounded-2xl"
            />
          </span>
        </div>

        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_45%,transparent)] px-3 py-4 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-5">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary-from)_18%,transparent)] text-[var(--primary-from)] ring-1 ring-[color-mix(in_srgb,var(--primary-from)_40%,transparent)] sm:h-12 sm:w-12"
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
          >
            <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.75} aria-hidden />
          </motion.div>

          <div className="w-full min-w-0 text-center">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary-from)] sm:text-sm sm:tracking-[0.16em]">
              Score submitted
            </p>
            <p
              className="mt-1.5 flex flex-wrap items-end justify-center gap-x-1 font-display text-4xl font-extrabold tabular-nums leading-none tracking-tight sm:mt-2 sm:text-5xl md:text-6xl"
              style={{ color: playerColor }}
            >
              <span>{score}</span>
              <span className="mb-0.5 text-sm font-semibold text-[var(--fg-muted)] sm:mb-1 sm:text-base md:text-lg">
                /1000
              </span>
            </p>
            {detail ? (
              <p className="mt-1.5 break-words text-xs leading-snug text-[var(--fg-muted)] sm:mt-2 sm:text-sm">
                {detail}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-[var(--fg)]">
              <Users className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]" aria-hidden />
              <span className="tabular-nums">
                {submittedCount}/{playerCount}
              </span>
              <span className="font-medium text-[var(--fg-muted)]">in</span>
            </span>
            {!roundComplete && (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] sm:text-xs sm:normal-case sm:tracking-normal">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary-from)] opacity-55" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary-from)]" />
                </span>
                Live
              </span>
            )}
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-tone-8">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--primary-from), var(--primary-to))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 120, damping: 20 }
              }
            />
          </div>

          <p className="flex items-start justify-center gap-1.5 text-center text-xs leading-snug text-[var(--fg-muted)] sm:gap-2 sm:text-sm">
            {roundComplete ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary-from)] sm:h-4 sm:w-4" aria-hidden />
            ) : (
              <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-warm)] sm:h-4 sm:w-4" aria-hidden />
            )}
            <span className="min-w-0">{waitCopy}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
