"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion, useReducedMotion } from "framer-motion";
import { Medal, Sparkles } from "lucide-react";
import type { GameResultSummary, LeaderboardRow } from "@/hooks/useSession";
import type { MvpAward } from "@/types/tournament";
import { useSound } from "@/hooks/useSound";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { PageItem } from "@/components/layout/PageEnter";
import { Podium } from "@/components/leaderboard/Podium";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const MEDAL = ["🥇", "🥈", "🥉"] as const;

export function FinishedResults({
  joinCode,
  playerCount,
  gameCount,
  board,
  games,
  mvps = [],
  variant = "host",
  highlightId,
}: {
  joinCode: string;
  playerCount: number;
  gameCount: number;
  board: LeaderboardRow[];
  games: GameResultSummary[];
  sessionId?: string;
  variant?: "host" | "cast" | "player";
  mvps?: MvpAward[];
  highlightId?: string;
}) {
  const champion = board[0];
  const rest = board.slice(1);
  const completedGames = games.filter((g) => g.isComplete && g.top.length > 0);
  const myRank =
    highlightId != null
      ? board.findIndex((r) => r.participant.id === highlightId) + 1
      : 0;
  const { play } = useSound();
  const celebrated = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!champion || celebrated.current) return;
    celebrated.current = true;
    play("fanfare");
    if (reduceMotion) return;
    void confetti({
      particleCount: 140,
      spread: 88,
      origin: { y: 0.42 },
      colors: ["#b8e62e", "#d4ff4f", "#5b8def", "#ff8f5c", "#f4f6f8"],
    });
  }, [champion, play, reduceMotion]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:gap-10 md:py-12">
      <PageItem>
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fg-muted)]">
            {joinCode} · {playerCount} player{playerCount === 1 ? "" : "s"} ·{" "}
            {gameCount} games
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="text-gradient">Final results</span>
          </h1>
          {variant === "player" && myRank > 0 && (
            <p className="mt-3 text-base text-[var(--fg-muted)] sm:text-lg">
              You finished{" "}
              <span className="font-display font-bold text-[var(--fg)]">#{myRank}</span>
              {board[myRank - 1] ? ` · ${board[myRank - 1]!.total} pts` : ""}
            </p>
          )}
        </header>
      </PageItem>

      {board.length > 0 && (
        <PageItem>
          <section className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-elevated)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 80% at 50% -10%, color-mix(in srgb, var(--primary-from) 22%, transparent), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 55%)",
              }}
            />
            <div className="relative px-2 pb-2 pt-4 sm:px-4 sm:pt-6">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-soft)]">
                Podium
              </p>
              <Podium top={board.slice(0, 3)} />
            </div>
          </section>
        </PageItem>
      )}

      {board.length > 0 && (
        <PageItem>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--primary-from)]" />
              <h2 className="font-display text-xl font-bold sm:text-2xl">
                Standings
              </h2>
            </div>

            <motion.ol
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_88%,transparent)]"
            >
              {board.map((row, i) => {
                const isChamp = i === 0;
                const isMe = highlightId != null && row.participant.id === highlightId;
                return (
                  <motion.li
                    key={row.participant.id}
                    variants={staggerItem}
                    className={`flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 ${
                      i > 0 ? "border-t border-[var(--border)]" : ""
                    } ${
                      isMe
                        ? "bg-[color-mix(in_srgb,var(--primary-from)_14%,transparent)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--primary-from)_35%,transparent)]"
                        : isChamp
                          ? "bg-[color-mix(in_srgb,var(--primary-from)_8%,transparent)]"
                          : ""
                    }`}
                  >
                    <span className="w-8 shrink-0 text-center font-display text-lg font-bold">
                      {i < 3 ? (
                        MEDAL[i]
                      ) : (
                        <span className="text-[var(--fg-muted)]">#{i + 1}</span>
                      )}
                    </span>
                    <PlayerAvatar
                      avatar={row.participant.emoji}
                      name={row.participant.name}
                      size="lg"
                      rounded="rounded-xl"
                      color={row.participant.color}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-bold sm:text-lg">
                        {row.participant.name}
                        {isMe ? (
                          <span className="ml-2 text-xs font-semibold text-[var(--accent-soft)]">
                            You
                          </span>
                        ) : null}
                      </p>
                      {isChamp && (
                        <p className="text-xs font-medium text-[var(--fg-muted)]">
                          Tournament winner
                        </p>
                      )}
                    </div>
                    <p
                      className="font-display text-xl font-extrabold tabular-nums sm:text-2xl"
                      style={{ color: row.participant.color }}
                    >
                      {row.total}
                    </p>
                  </motion.li>
                );
              })}
            </motion.ol>

            {rest.length === 0 && board.length === 1 && (
              <p className="mt-3 text-center text-sm text-[var(--fg-muted)]">
                Solo run complete — invite more players next time to race the board.
              </p>
            )}
          </section>
        </PageItem>
      )}

      {completedGames.length > 0 && (
        <PageItem>
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Medal className="h-5 w-5 text-[var(--accent-warm)]" />
              <h2 className="font-display text-xl font-bold sm:text-2xl">
                By game
              </h2>
            </div>

            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]"
            >
              {completedGames.map((g) => {
                const winner = g.top[0];
                return (
                  <motion.li
                    key={g.gameId}
                    variants={staggerItem}
                    className="flex items-center gap-3 bg-[color-mix(in_srgb,var(--bg-card)_70%,transparent)] px-4 py-3.5 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold sm:text-base">
                        {g.title}
                      </p>
                      {winner && (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--fg-muted)] sm:text-sm">
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
                    {winner && (
                      <p
                        className="shrink-0 font-display text-lg font-extrabold tabular-nums sm:text-xl"
                        style={{ color: winner.color }}
                      >
                        {winner.score}
                      </p>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          </section>
        </PageItem>
      )}

      {mvps.length > 0 && playerCount > 1 && (
        <PageItem>
          <section className="space-y-4">
            <h2 className="text-center font-display text-2xl font-extrabold sm:text-3xl">
              MVP callouts
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mvps.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={reduceMotion ? false : { y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.06 * i }}
                  className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_85%,transparent)] px-4 py-5 text-center"
                >
                  <PlayerAvatar
                    avatar={m.emoji}
                    name={m.playerName}
                    size="xl"
                    rounded="rounded-2xl"
                    className="mx-auto"
                  />
                  <p className="mt-2 font-display text-lg font-bold text-gradient">
                    {m.title}
                  </p>
                  <p className="mt-1 text-base font-semibold">{m.playerName}</p>
                  <p className="text-sm text-[var(--fg-muted)]">{m.description}</p>
                  <p className="mt-2 font-display font-bold">{m.valueLabel}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </PageItem>
      )}

      <PageItem className="flex flex-col items-stretch justify-center gap-3 pb-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        {variant !== "player" && (
          <Link href="/host" className="btn-secondary">
            Host again
          </Link>
        )}
      </PageItem>
    </div>
  );
}
