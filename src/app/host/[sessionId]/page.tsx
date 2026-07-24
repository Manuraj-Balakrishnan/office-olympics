"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  Copy,
  Play,
  RotateCcw,
  SkipForward,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";
import { TEAM_EMOJIS, resolveGame } from "@/data/games";
import {
  hostAction,
  loadIdentity,
  saveIdentity,
  useSessionPoll,
  type GameScoreRow,
  type LeaderboardRow,
} from "@/hooks/useSession";
import {
  GameProgressBar,
  OverallLeaderboard,
  PerGameTops,
} from "@/components/session/ScoreBoards";
import { FinishedResults } from "@/components/session/FinishedResults";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { LoadingPulse } from "@/components/layout/LoadingPulse";
import type { GameId, Player, SessionStatus } from "@/types/tournament";

function PlayerRosterRow({
  player,
  index,
  sessionStatus,
  currentGameId,
  gameBoard,
  board,
  nested = false,
}: {
  player: Player;
  index?: number;
  sessionStatus: SessionStatus;
  currentGameId: GameId | null;
  gameBoard: GameScoreRow[];
  board: LeaderboardRow[];
  nested?: boolean;
}) {
  const row = gameBoard.find((r) => r.playerId === player.id);
  const pending =
    sessionStatus === "active" && Boolean(currentGameId) && row && !row.done;
  const doneRound =
    sessionStatus === "active" && Boolean(currentGameId) && row?.done;
  const overall = board.find(
    (b) => b.participant.id === player.id || b.participant.id === player.teamId,
  );

  return (
    <li
      className={`rounded-xl px-3 py-2.5 text-sm ${
        pending
          ? "bg-amber-500/10"
          : doneRound
            ? "bg-emerald-500/10"
            : nested
              ? "bg-white/[0.06]"
              : "bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2">
        {index != null && (
          <span className="w-4 text-[var(--fg-muted)]">{index}</span>
        )}
        <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
        {pending && (
          <span className="text-[10px] font-bold uppercase text-amber-300">
            playing
          </span>
        )}
        {doneRound && (
          <span className="text-[10px] font-bold uppercase text-emerald-400">
            done
          </span>
        )}
      </div>
      {sessionStatus === "active" && (
        <div
          className={`mt-1 flex justify-between text-xs text-[var(--fg-muted)] ${
            index != null ? "pl-5" : ""
          }`}
        >
          <span>
            {doneRound ? `Round ${row?.score}` : pending ? "…" : "—"}
          </span>
          <span className="font-semibold text-[var(--fg)]">
            {overall?.total ?? 0} total
          </span>
        </div>
      )}
    </li>
  );
}

function LiveRoundBoard({
  rows,
  title,
}: {
  rows: GameScoreRow[];
  title: string;
}) {
  const done = rows.filter((r) => r.done).length;
  return (
    <section className="card-surface !p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="min-w-0 truncate font-display text-lg font-bold sm:text-xl">{title}</h2>
        <p className="shrink-0 text-sm font-semibold text-[var(--fg-muted)]">
          {done}/{rows.length} scored
        </p>
      </div>
      <ul className="divide-y divide-white/5">
        {rows.map((row, i) => {
          const rank = row.done
            ? rows.filter((r) => r.done).findIndex((r) => r.playerId === row.playerId) + 1
            : null;
          return (
            <li
              key={row.playerId}
              className={`flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5 ${
                row.done ? "bg-emerald-500/[0.07]" : "bg-amber-500/[0.06]"
              }`}
            >
              <span className="w-8 text-sm font-semibold text-[var(--fg-muted)]">
                {rank ? `#${rank}` : "·"}
              </span>
              <span className="text-2xl">{row.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name}</p>
                <p className="text-xs text-[var(--fg-muted)]">
                  {row.done
                    ? row.detail === "Didn't finish"
                      ? "Skipped — 0 pts"
                      : row.detail || "Finished"
                    : "Still playing…"}
                </p>
              </div>
              <div className="text-right">
                {row.done ? (
                  <>
                    <p
                      className="font-display text-xl font-extrabold"
                      style={{ color: row.color }}
                    >
                      {row.score}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
                      /1000
                    </p>
                  </>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                    Playing
                  </span>
                )}
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="px-5 py-6 text-sm text-[var(--fg-muted)]">No players yet.</li>
        )}
      </ul>
    </section>
  );
}

export default function HostSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { data, refresh, error, loading } = useSessionPoll(sessionId, 1000);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamEmoji, setTeamEmoji] = useState(TEAM_EMOJIS[0]!);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const id = loadIdentity(sessionId);
    if (id?.hostToken) {
      setHostToken(id.hostToken);
      saveIdentity({ ...id, role: "host", sessionId });
    }
  }, [sessionId]);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined" || !data) return "";
    return `${window.location.origin}/join/${data.session.joinCode}`;
  }, [data]);

  const session = data?.session;
  const board = data?.leaderboard ?? [];
  const gameBoard = data?.gameScoreboard ?? [];
  const gameResults = data?.gameResults ?? [];
  const mvps = data?.mvps ?? [];

  const run = async (action: string, body: Record<string, unknown> = {}) => {
    if (!hostToken) return;
    setBusy(true);
    setActionError(null);
    try {
      await hostAction(sessionId, hostToken, action, body);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return <LoadingPulse label="Loading session…" />;
  }
  if (error || !session) {
    return <p className="p-10 text-center text-red-400">{error ?? "Session missing"}</p>;
  }
  if (!hostToken) {
    return (
      <PageEnter className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <PageItem>
          <p className="font-display text-2xl font-bold">Host key missing</p>
          <p className="text-[var(--fg-muted)]">
            Open this page from the same browser that created the session.
          </p>
        </PageItem>
        <PageItem>
          <Link href="/host" className="btn-primary inline-flex">
            Create new session
          </Link>
        </PageItem>
      </PageEnter>
    );
  }

  const gameIndex = session.currentGameId
    ? session.gameOrder.indexOf(session.currentGameId) + 1
    : session.playedGames.length;
  const currentGame = resolveGame(session.currentGameId);
  const doneThisGame = gameBoard.filter((r) => r.done).length;
  const waitingPlayers = gameBoard.filter((r) => !r.done);
  // Prefer live board counts so the CTA flips as soon as the last score lands
  const roundComplete =
    Boolean(data?.roundComplete) ||
    (session.players.length > 0 && doneThisGame >= session.players.length);
  const nextGameId = data?.nextGameId as string | null | undefined;
  const nextGame = resolveGame(nextGameId);
  const isLastGame = Boolean(currentGame && !nextGameId);

  const canStart =
    session.players.length >= 1 &&
    (session.mode === "individuals" || session.teams.length >= 1);

  const startHint =
    session.players.length < 1
      ? "Waiting for at least one player to join"
      : session.mode === "teams" && session.teams.length < 1
        ? "Add or create a team before starting"
        : null;

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
          mvps={mvps}
        />
      </PageEnter>
    );
  }

  return (
    <PageEnter className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <PageItem>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
              Host · {session.joinCode}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {session.status === "lobby" ? "Waiting room" : "Control room"}
            </h1>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {session.status === "lobby"
                ? "Share the code. Start when everyone is in."
                : "Everyone plays together. You advance each round."}
            </p>
          </div>
        </header>
        </PageItem>

        {actionError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionError}
          </div>
        )}

        {session.status === "active" && (
          <GameProgressBar
            order={session.gameOrder}
            currentId={session.currentGameId}
            played={session.playedGames}
          />
        )}

        {/* Lobby join card */}
        {session.status === "lobby" && (
          <PageItem>
          <section className="card-surface grid gap-6 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--fg-muted)]">Join code</p>
              <p className="mt-1 break-all font-display text-4xl font-extrabold tracking-wider text-gradient sm:text-5xl">
                {session.joinCode}
              </p>
              <p className="mt-3 break-all text-xs text-[var(--fg-muted)]">{joinUrl}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(joinUrl || session.joinCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void run("shuffle")}
                >
                  <Shuffle className="h-4 w-4" /> Shuffle games
                </button>
              </div>
              <button
                type="button"
                className="btn-primary mt-4 w-full max-w-sm text-lg"
                disabled={busy || !canStart}
                onClick={() => void run("start")}
              >
                <Play className="h-5 w-5" /> Start tournament
              </button>
              {startHint && (
                <p className="mt-2 text-sm text-amber-300">{startHint}</p>
              )}
            </div>
            <div className="mx-auto flex w-fit flex-col items-center justify-center rounded-2xl bg-white p-3 sm:p-4">
              {joinUrl && <QRCodeSVG value={joinUrl} size={148} level="M" includeMargin />}
              <p className="mt-2 text-xs font-semibold text-black/60">Scan to join</p>
            </div>
          </section>
          </PageItem>
        )}

        {/* Active round control — one clear CTA */}
        {session.status === "active" && currentGame && (
          <PageItem>
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--bg-elevated)]">
            <div className="bg-gradient-to-br from-teal-600/20 via-transparent to-slate-500/10 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
                    Round {gameIndex} of {session.gameOrder.length}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
                    {currentGame.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-[var(--fg-muted)] sm:text-base">
                    {currentGame.description}
                  </p>
                </div>
                <div className="w-full rounded-2xl bg-black/25 px-5 py-4 text-center backdrop-blur sm:w-auto">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">
                    Progress
                  </p>
                  <p className="font-display text-4xl font-extrabold">
                    {doneThisGame}
                    <span className="text-lg text-[var(--fg-muted)]">
                      /{session.players.length}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">
                    {roundComplete ? "Everyone finished" : "players done"}
                  </p>
                </div>
              </div>

              {roundComplete ? (
                <p className="mt-4 text-sm font-medium text-emerald-300">
                  {isLastGame
                    ? "All scores in — crown the winners when you’re ready."
                    : `All scores in — start ${nextGame?.title ?? "the next game"} when you’re ready.`}
                </p>
              ) : (
                waitingPlayers.length > 0 && (
                  <p className="mt-4 text-sm text-[var(--fg-muted)]">
                    Waiting on{" "}
                    <span className="font-semibold text-[var(--fg)]">
                      {waitingPlayers.map((p) => p.name).join(", ")}
                    </span>
                  </p>
                )
              )}

              <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {roundComplete ? (
                  isLastGame ? (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => void run("finish")}
                    >
                      <Trophy className="h-4 w-4" /> Crown winners
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => void run("next-game")}
                    >
                      <Play className="h-4 w-4" />
                      <span className="truncate">
                        Start next game
                        {nextGame ? `: ${nextGame.title}` : ""}
                      </span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          isLastGame
                            ? "End now and skip players who haven’t finished?"
                            : `Skip unfinished players and start ${nextGame?.title ?? "the next game"}?`,
                        )
                      ) {
                        return;
                      }
                      void run("skip-remaining");
                    }}
                  >
                    <SkipForward className="h-4 w-4" />
                    {isLastGame ? "Skip & end" : `Skip unfinished → next`}
                  </button>
                )}

                <button
                  type="button"
                  className="btn-secondary !py-2 text-sm"
                  disabled={busy}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Clear this round’s scores and let everyone play it again?",
                      )
                    ) {
                      return;
                    }
                    void run("reset-game");
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Replay round
                </button>

                <button
                  type="button"
                  className="btn-secondary !py-2 text-sm text-red-300"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm("End the tournament for everyone?")) return;
                    void run("finish");
                  }}
                >
                  End tournament
                </button>
              </div>
            </div>
          </section>
          </PageItem>
        )}

        {/* One live board — who finished + scores */}
        {session.status === "active" && currentGame && (
          <LiveRoundBoard rows={gameBoard} title={`${currentGame.title} — live scores`} />
        )}

        {/* Standings once */}
        {session.status === "active" && (
          <OverallLeaderboard rows={board} title="Overall standings" />
        )}

        {session.status === "active" && (
          <PerGameTops games={gameResults} />
        )}

        {/* Compact game order */}
        {session.status === "active" && (
          <section className="card-surface">
            <h3 className="mb-3 font-display text-lg font-bold">Upcoming</h3>
            <ol className="space-y-1.5">
              {session.gameOrder.map((gid, i) => {
                const g = resolveGame(gid);
                if (!g) return null;
                const isLive = session.currentGameId === gid;
                const done = session.playedGames.includes(gid);
                const top = gameResults.find((r) => r.gameId === gid)?.top[0];
                return (
                  <li
                    key={gid}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm sm:gap-3 ${
                      isLive
                        ? "bg-teal-500/15 ring-1 ring-teal-400/40"
                        : done
                          ? "opacity-60"
                          : "bg-white/5"
                    }`}
                  >
                    <span className="w-5 shrink-0 text-[var(--fg-muted)]">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{g.title}</span>
                    {top && done && (
                      <span className="hidden max-w-[40%] truncate text-xs text-[var(--fg-muted)] sm:inline">
                        {top.emoji} {top.name} {top.score}
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">
                      {isLive ? "now" : done ? "done" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {session.mode === "teams" && session.status === "lobby" && (
          <section className="card-surface space-y-3">
            <h3 className="font-display text-lg font-bold">Add a team</h3>
            <p className="text-sm text-[var(--fg-muted)]">
              Seed teams here, or let players create one when they join. Roster is on the right.
            </p>
            <div className="flex flex-wrap gap-2">
              {TEAM_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`rounded-lg px-2 py-1 text-xl ${
                    teamEmoji === e ? "bg-white/20" : "bg-white/5"
                  }`}
                  onClick={() => setTeamEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              />
              <button
                type="button"
                className="btn-primary sm:!px-4"
                disabled={!teamName.trim() || busy}
                onClick={() => {
                  void run("add-team", { name: teamName.trim(), emoji: teamEmoji });
                  setTeamName("");
                }}
              >
                Add
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar roster */}
      <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-20 lg:w-80 lg:self-start">
        <section className="card-surface">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Users className="h-5 w-5" />
            {session.mode === "teams" ? "Teams" : "Players"}
            <span className="text-[var(--fg-muted)]">({session.players.length})</span>
          </h3>
          <div className="max-h-[32rem] space-y-3 overflow-auto">
            {session.mode === "teams" ? (
              <>
                {session.teams.map((team) => {
                  const members = session.players.filter((p) => p.teamId === team.id);
                  return (
                    <div key={team.id} className="rounded-xl bg-white/[0.04] p-2.5">
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <span className="text-lg" style={{ color: team.color }}>
                          {team.emoji}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-display font-bold">
                          {team.name}
                        </span>
                        <span className="text-xs text-[var(--fg-muted)]">
                          {members.length}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {members.length === 0 ? (
                          <li className="px-2 py-1.5 text-xs text-[var(--fg-muted)]">
                            No players yet
                          </li>
                        ) : (
                          members.map((p) => (
                            <PlayerRosterRow
                              key={p.id}
                              player={p}
                              sessionStatus={session.status}
                              currentGameId={session.currentGameId}
                              gameBoard={gameBoard}
                              board={board}
                              nested
                            />
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
                    <div className="rounded-xl bg-white/[0.04] p-2.5">
                      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                        Unassigned
                      </div>
                      <ul className="space-y-1.5">
                        {unassigned.map((p) => (
                          <PlayerRosterRow
                            key={p.id}
                            player={p}
                            sessionStatus={session.status}
                            currentGameId={session.currentGameId}
                            gameBoard={gameBoard}
                            board={board}
                            nested
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                {session.teams.length === 0 && session.players.length === 0 && (
                  <p className="text-sm text-[var(--fg-muted)]">Waiting for joins…</p>
                )}
              </>
            ) : (
              <ul className="space-y-2">
                {session.players.map((p, i) => (
                  <PlayerRosterRow
                    key={p.id}
                    player={p}
                    index={i + 1}
                    sessionStatus={session.status}
                    currentGameId={session.currentGameId}
                    gameBoard={gameBoard}
                    board={board}
                  />
                ))}
                {session.players.length === 0 && (
                  <li className="text-sm text-[var(--fg-muted)]">Waiting for joins…</li>
                )}
              </ul>
            )}
          </div>
        </section>
      </aside>
    </PageEnter>
  );
}
