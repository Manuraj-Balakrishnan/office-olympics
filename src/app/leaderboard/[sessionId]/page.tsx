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
import { LobbyJoinCodeHero, LobbyLiveBadge, LobbyRoster } from "@/components/session/WaitingRoom";
import { FinishedResults } from "@/components/session/FinishedResults";
import { PlayerAvatar } from "@/components/PlayerAvatar";
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
    <PageEnter className="mx-auto w-full max-w-6xl space-y-4 px-3 py-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:space-y-6 sm:px-4 sm:py-8 md:py-10">
      {session.status === "active" && (
        <PageItem>
          <header className="flex flex-col items-center gap-3 text-center sm:gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between md:text-left">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)] sm:text-sm sm:tracking-[0.2em]">
                {session.joinCode} · {session.players.length} players
              </p>
              <h1 className="font-display text-[clamp(2rem,8vw,4.5rem)] font-extrabold tracking-tight">
                <span className="text-gradient">Live Leaderboard</span>
              </h1>
            </div>
            {currentGame && (
              <div className="w-full rounded-2xl bg-tone-5 px-4 py-3 text-left sm:w-auto sm:px-5 sm:py-4">
                <p className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">Now</p>
                <p className="font-display text-xl font-bold sm:text-2xl">{currentGame.title}</p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">
                  {doneThisGame}/{session.players.length} submitted · host starts each round
                </p>
              </div>
            )}
          </header>
        </PageItem>
      )}

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
            <header className="mb-1 space-y-1.5 sm:mb-2 sm:space-y-2">
              <LobbyLiveBadge
                playerCount={session.players.length}
                className="justify-center md:justify-start"
              />
              <h1 className="text-center font-display text-[1.85rem] font-extrabold leading-[1.05] tracking-tight sm:text-4xl md:text-left">
                <span className="text-gradient">Waiting room</span>
              </h1>
              <p className="mx-auto max-w-lg text-center text-sm text-[var(--fg-muted)] sm:text-base md:mx-0 md:text-left">
                Cast this while everyone checks in — the board flips live when you start.
              </p>
            </header>
          </PageItem>

          <PageItem>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-7">
                <LobbyJoinCodeHero
                  joinCode={session.joinCode}
                  playerCount={session.players.length}
                  size="lg"
                  subtitle="Players join from any phone with this code."
                />
              </div>
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:rounded-[1.75rem] sm:p-5 lg:col-span-5">
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 60% at 80% 0%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 55%), radial-gradient(ellipse 50% 45% at 10% 100%, color-mix(in srgb, var(--primary-from) 10%, transparent), transparent 50%)",
                  }}
                />
                <div className="relative">
                  <LobbyRoster
                    mode={session.mode}
                    players={session.players}
                    teams={session.teams}
                    large
                    maxHeightClass="max-h-[min(16rem,36dvh)] sm:max-h-[min(18rem,40dvh)] lg:max-h-[min(22rem,48dvh)]"
                  />
                </div>
              </div>
            </div>
          </PageItem>

          <PageItem>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:rounded-[1.75rem] sm:p-5">
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(ellipse 60% 70% at 100% 0%, color-mix(in srgb, var(--primary-from) 10%, transparent), transparent 50%)",
                }}
              />
              <div className="relative">
                <LobbyGamesList order={session.gameOrder} layout="strip" title="Games lineup" />
              </div>
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
                <div className="border-b border-[var(--border)] px-4 py-3">
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
                              : "bg-tone-5"
                          }`}
                        >
                          <span className="w-6 text-[var(--fg-muted)]">
                            {row.done ? `#${i + 1}` : "·"}
                          </span>
                          <PlayerAvatar
                            avatar={row.emoji}
                            name={row.name}
                            size="sm"
                            rounded="rounded-lg"
                          />
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
                      className="flex items-center justify-between rounded-xl bg-tone-5 px-4 py-3"
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
