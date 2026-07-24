"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Podium } from "@/components/leaderboard/Podium";
import { useSessionPoll } from "@/hooks/useSession";
import { useSound } from "@/hooks/useSound";
import { GAME_MAP } from "@/data/games";
import {
  GameProgressBar,
  OverallLeaderboard,
  PerGameTops,
} from "@/components/session/ScoreBoards";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { LoadingPulse } from "@/components/layout/LoadingPulse";

export default function LiveLeaderboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { data, loading, error } = useSessionPoll(sessionId, 1000);
  const { play } = useSound();
  const celebrated = useRef(false);
  const session = data?.session;
  const board = data?.leaderboard ?? [];
  const mvps = data?.mvps ?? [];
  const gameResults = data?.gameResults ?? [];
  const gameBoard = data?.gameScoreboard ?? [];

  useEffect(() => {
    if (!session || celebrated.current) return;
    if (session.status === "finished" && board.length > 0) {
      celebrated.current = true;
      play("fanfare");
      void confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#0F766E", "#14B8A6", "#64748B", "#334155", "#F4F4F5"],
      });
    }
  }, [session, board.length, play]);

  if (loading && !data) {
    return <LoadingPulse label="Live board loading…" />;
  }

  if (error || !session) {
    return <p className="p-10 text-center text-red-400">{error ?? "Session not found"}</p>;
  }

  const individuals = session.players
    .map((p) => {
      const total = session.scores
        .filter((s) => s.playerId === p.id)
        .reduce((sum, s) => sum + s.score, 0);
      return { player: p, total };
    })
    .sort((a, b) => b.total - a.total);

  const currentGame = session.currentGameId ? GAME_MAP[session.currentGameId] : null;
  const doneThisGame = gameBoard.filter((r) => r.done).length;

  return (
    <PageEnter className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:py-12">
      <PageItem>
      <header className="flex flex-wrap items-end justify-between gap-4 text-center md:text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {session.joinCode} · {session.players.length} players
          </p>
          <h1 className="font-display text-5xl font-extrabold md:text-7xl">
            {session.status === "finished" ? (
              <span className="text-gradient">Final Results</span>
            ) : session.status === "lobby" ? (
              <span className="text-gradient">Waiting Room</span>
            ) : (
              <span className="text-gradient">Live Leaderboard</span>
            )}
          </h1>
        </div>
        {session.status === "lobby" && (
          <div className="rounded-2xl bg-white/5 px-5 py-4 text-left">
            <p className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">Join code</p>
            <p className="font-display text-3xl font-extrabold tracking-wider">{session.joinCode}</p>
            <p className="mt-1 text-[var(--fg-muted)]">
              {session.players.length} player{session.players.length === 1 ? "" : "s"} connected
            </p>
          </div>
        )}
        {session.status === "active" && currentGame && (
          <div className="rounded-2xl bg-white/5 px-5 py-4 text-left">
            <p className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">Now</p>
            <p className="font-display text-2xl font-bold">{currentGame.title}</p>
            <p className="mt-1 text-[var(--fg-muted)]">
              {doneThisGame}/{session.players.length} submitted · host starts each round
            </p>
          </div>
        )}
        {session.status === "finished" && (
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
            <Link href="/" className="btn-primary">
              Home
            </Link>
            <Link href="/host" className="btn-secondary">
              Host again
            </Link>
          </div>
        )}
      </header>
      </PageItem>

      {session.status !== "lobby" && (
        <PageItem>
        <GameProgressBar
          order={session.gameOrder}
          currentId={session.currentGameId}
          played={session.playedGames}
        />
        </PageItem>
      )}

      <PageItem>
      <Podium top={board.slice(0, 3)} />
      </PageItem>

      <PageItem>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface !p-0 overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="font-display text-xl font-bold">Overall standings</h2>
          </div>
          <div className="p-4">
            <OverallLeaderboard rows={board} compact />
          </div>
        </div>

        {session.status === "active" && currentGame && (
          <div className="card-surface">
            <h2 className="mb-3 font-display text-xl font-bold">
              {currentGame.title} — this round
            </h2>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {gameBoard.map((row, i) => (
                  <motion.li
                    key={row.playerId}
                    layout
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                      row.isTurn ? "bg-[var(--ring)]/25 ring-1 ring-[var(--ring)]" : "bg-white/5"
                    }`}
                  >
                    <span className="w-6 text-[var(--fg-muted)]">
                      {row.done ? `#${i + 1}` : "·"}
                    </span>
                    <span className="text-xl">{row.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold">{row.name}</span>
                      {row.detail && row.done && (
                        <p className="text-xs text-[var(--fg-muted)]">{row.detail}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className="font-display text-xl font-extrabold"
                        style={{ color: row.color }}
                      >
                        {row.done ? row.score : "—"}
                      </span>
                      {row.done && (
                        <p className="text-[10px] uppercase text-[var(--fg-muted)]">/1000</p>
                      )}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </div>
      </PageItem>

      <PageItem>
      <PerGameTops games={gameResults} showFullRankings={session.status === "finished"} />
      </PageItem>

      {session.status === "finished" && mvps.length > 0 && (
        <PageItem>
        <section className="space-y-4">
          <h2 className="text-center font-display text-3xl font-extrabold">MVP Callouts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mvps.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ y: -4 }}
                className="card-surface text-center"
              >
                <p className="text-4xl">{m.emoji}</p>
                <p className="mt-2 font-display text-xl font-bold text-gradient">{m.title}</p>
                <p className="mt-1 text-lg font-semibold">{m.playerName}</p>
                <p className="text-sm text-[var(--fg-muted)]">{m.description}</p>
                <p className="mt-2 font-display font-bold">{m.valueLabel}</p>
              </motion.div>
            ))}
          </div>
        </section>
        </PageItem>
      )}

      {session.status === "finished" && session.mode === "teams" && (
        <PageItem>
        <section className="space-y-4">
          <h2 className="text-center font-display text-2xl font-bold">
            Individual breakdown
          </h2>
          <div className="mx-auto max-w-xl space-y-2">
            {individuals.map((row, i) => (
              <div
                key={row.player.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
              >
                <span>
                  <span className="mr-2 text-[var(--fg-muted)]">#{i + 1}</span>
                  {row.player.name}
                </span>
                <span className="font-display font-bold">{row.total}</span>
              </div>
            ))}
          </div>
        </section>
        </PageItem>
      )}

      {session.status === "finished" && (
        <PageItem className="flex flex-wrap items-center justify-center gap-3 pb-8">
          <Link href="/" className="btn-primary">
            Home
          </Link>
          <Link href="/host" className="btn-secondary">
            Host again
          </Link>
        </PageItem>
      )}
    </PageEnter>
  );
}
