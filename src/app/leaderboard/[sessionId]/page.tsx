"use client";

import { use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Podium } from "@/components/leaderboard/Podium";
import { useSessionPoll } from "@/hooks/useSession";
import { resolveGame } from "@/data/games";
import {
  GameProgressBar,
  LobbyGamesList,
  OverallLeaderboard,
  PerGameTops,
} from "@/components/session/ScoreBoards";
import { FinishedResults } from "@/components/session/FinishedResults";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { LoadingPulse } from "@/components/layout/LoadingPulse";

export default function LiveLeaderboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { data, loading, error } = useSessionPoll(sessionId, 1000);
  const session = data?.session;
  const board = data?.leaderboard ?? [];
  const mvps = data?.mvps ?? [];
  const gameResults = data?.gameResults ?? [];
  const gameBoard = data?.gameScoreboard ?? [];

  if (loading && !data) {
    return <LoadingPulse label="Live board loading…" />;
  }

  if (error || !session) {
    return <p className="p-10 text-center text-red-400">{error ?? "Session not found"}</p>;
  }

  if (session.status === "finished") {
    return (
      <PageEnter>
        <FinishedResults
          joinCode={session.joinCode}
          playerCount={session.players.length}
          gameCount={session.gameOrder.length}
          board={board}
          games={gameResults}
          sessionId={sessionId}
          variant="cast"
          mvps={mvps}
        />
      </PageEnter>
    );
  }

  const individuals = session.players
    .map((p) => {
      const total = session.scores
        .filter((s) => s.playerId === p.id)
        .reduce((sum, s) => sum + s.score, 0);
      return { player: p, total };
    })
    .sort((a, b) => b.total - a.total);

  const currentGame = resolveGame(session.currentGameId);
  const doneThisGame = gameBoard.filter((r) => r.done).length;

  return (
    <PageEnter className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:py-12">
      <PageItem>
      <header className="flex flex-col items-center gap-4 text-center md:flex-row md:flex-wrap md:items-end md:justify-between md:text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {session.joinCode} · {session.players.length} players
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl">
            {session.status === "lobby" ? (
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
      </header>
      </PageItem>

      {session.status === "active" && (
        <PageItem>
        <GameProgressBar
          order={session.gameOrder}
          currentId={session.currentGameId}
          played={session.playedGames}
        />
        </PageItem>
      )}

      {session.status === "lobby" ? (
        <>
          <PageItem>
            <section className="card-surface mx-auto w-full max-w-2xl space-y-4">
              <h2 className="font-display text-xl font-bold">
                {session.mode === "teams" ? "Teams" : "Players"}
              </h2>
              {session.mode === "teams" ? (
                <div className="space-y-4">
                  {session.teams.map((team) => {
                    const members = session.players.filter((p) => p.teamId === team.id);
                    return (
                      <div key={team.id} className="rounded-2xl bg-white/[0.04] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-2xl">{team.emoji}</span>
                          <span
                            className="font-display text-xl font-bold"
                            style={{ color: team.color }}
                          >
                            {team.name}
                          </span>
                          <span className="ml-auto text-sm text-[var(--fg-muted)]">
                            {members.length} player{members.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {members.length === 0 ? (
                            <li className="text-sm text-[var(--fg-muted)]">Waiting for players…</li>
                          ) : (
                            members.map((p) => (
                              <li
                                key={p.id}
                                className="rounded-xl bg-white/[0.06] px-4 py-2.5 font-semibold"
                              >
                                {p.emoji ? `${p.emoji} ` : ""}
                                {p.name}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    );
                  })}
                  {(() => {
                    const unassigned = session.players.filter((p) => !p.teamId);
                    if (unassigned.length === 0) return null;
                    return (
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                          Unassigned
                        </p>
                        <ul className="space-y-2">
                          {unassigned.map((p) => (
                            <li
                              key={p.id}
                              className="rounded-xl bg-white/[0.06] px-4 py-2.5 font-semibold"
                            >
                              {p.emoji ? `${p.emoji} ` : ""}
                              {p.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  {session.teams.length === 0 && session.players.length === 0 && (
                    <p className="text-[var(--fg-muted)]">Waiting for teams and players…</p>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {session.players.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"
                    >
                      <span className="w-6 text-[var(--fg-muted)]">#{i + 1}</span>
                      <span className="font-semibold">
                        {p.emoji ? `${p.emoji} ` : ""}
                        {p.name}
                      </span>
                    </li>
                  ))}
                  {session.players.length === 0 && (
                    <li className="text-[var(--fg-muted)]">Waiting for players…</li>
                  )}
                </ul>
              )}
            </section>
          </PageItem>

          <PageItem>
            <div className="mx-auto w-full max-w-2xl">
              <LobbyGamesList order={session.gameOrder} />
            </div>
          </PageItem>
        </>
      ) : (
        <>
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
                            row.isTurn
                              ? "bg-[var(--ring)]/25 ring-1 ring-[var(--ring)]"
                              : "bg-white/5"
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
            <PerGameTops games={gameResults} />
          </PageItem>

          {session.mode === "teams" && (
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
        </>
      )}

      <PageItem className="flex flex-wrap items-center justify-center gap-3 pb-8">
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </PageItem>
    </PageEnter>
  );
}
