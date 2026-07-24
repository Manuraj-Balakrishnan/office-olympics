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
import { GAME_MAP, TEAM_EMOJIS } from "@/data/games";
import {
  hostAction,
  loadIdentity,
  saveIdentity,
  useSessionPoll,
  type GameScoreRow,
} from "@/hooks/useSession";
import {
  GameProgressBar,
  OverallLeaderboard,
  PerGameTops,
} from "@/components/session/ScoreBoards";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { LoadingPulse } from "@/components/layout/LoadingPulse";

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
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm font-semibold text-[var(--fg-muted)]">
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
              className={`flex items-center gap-3 px-5 py-3 ${
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
  const currentGame = session.currentGameId ? GAME_MAP[session.currentGameId] : null;
  const doneThisGame = gameBoard.filter((r) => r.done).length;
  const waitingPlayers = gameBoard.filter((r) => !r.done);
  // Prefer live board counts so the CTA flips as soon as the last score lands
  const roundComplete =
    Boolean(data?.roundComplete) ||
    (session.players.length > 0 && doneThisGame >= session.players.length);
  const nextGameId = data?.nextGameId as string | null | undefined;
  const nextGame = nextGameId ? GAME_MAP[nextGameId as keyof typeof GAME_MAP] : null;
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
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              {session.status === "lobby"
                ? "Waiting room"
                : session.status === "finished"
                  ? "Final results"
                  : "Control room"}
            </h1>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {session.status === "lobby"
                ? "Share the code. Start when everyone is in."
                : session.status === "finished"
                  ? "Tournament over — standings below."
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

        {session.status !== "lobby" && (
          <GameProgressBar
            order={session.gameOrder}
            currentId={session.currentGameId}
            played={session.playedGames}
          />
        )}

        {/* Lobby join card */}
        {session.status === "lobby" && (
          <PageItem>
          <section className="card-surface grid gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-[var(--fg-muted)]">Join code</p>
              <p className="mt-1 font-display text-5xl font-extrabold tracking-wider text-gradient">
                {session.joinCode}
              </p>
              <p className="mt-3 break-all text-xs text-[var(--fg-muted)]">{joinUrl}</p>
              <div className="mt-5 flex flex-wrap gap-2">
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
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4">
              {joinUrl && <QRCodeSVG value={joinUrl} size={168} level="M" includeMargin />}
              <p className="mt-2 text-xs font-semibold text-black/60">Scan to join</p>
            </div>
          </section>
          </PageItem>
        )}

        {/* Active round control — one clear CTA */}
        {session.status === "active" && currentGame && (
          <PageItem>
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--bg-elevated)]">
            <div className="bg-gradient-to-br from-teal-600/20 via-transparent to-slate-500/10 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
                    Round {gameIndex} of {session.gameOrder.length}
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">
                    {currentGame.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-[var(--fg-muted)]">
                    {currentGame.description}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/25 px-5 py-4 text-center backdrop-blur">
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

              <div className="mt-6 flex flex-wrap items-center gap-2">
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
                      Start next game
                      {nextGame ? `: ${nextGame.title}` : ""}
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
        {(session.status === "active" || session.status === "finished") && (
          <OverallLeaderboard
            rows={board}
            title={session.status === "finished" ? "Final standings" : "Overall standings"}
          />
        )}

        {(session.status === "active" || session.status === "finished") && (
          <PerGameTops
            games={gameResults}
            showFullRankings={session.status === "finished"}
          />
        )}

        {/* Compact game order */}
        {session.status === "active" && (
          <section className="card-surface">
            <h3 className="mb-3 font-display text-lg font-bold">Upcoming</h3>
            <ol className="space-y-1.5">
              {session.gameOrder.map((gid, i) => {
                const g = GAME_MAP[gid];
                const isLive = session.currentGameId === gid;
                const done = session.playedGames.includes(gid);
                const top = gameResults.find((r) => r.gameId === gid)?.top[0];
                return (
                  <li
                    key={gid}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                      isLive
                        ? "bg-teal-500/15 ring-1 ring-teal-400/40"
                        : done
                          ? "opacity-60"
                          : "bg-white/5"
                    }`}
                  >
                    <span className="w-5 text-[var(--fg-muted)]">{i + 1}</span>
                    <span className="flex-1 font-medium">{g.title}</span>
                    {top && done && (
                      <span className="truncate text-xs text-[var(--fg-muted)]">
                        {top.emoji} {top.name} {top.score}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">
                      {isLive ? "now" : done ? "done" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {session.status === "finished" && (
          <section className="card-surface space-y-5 text-center">
            {board[0] && (
              <>
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
                  Champion
                </p>
                <p className="mt-2 text-5xl">{board[0].participant.emoji}</p>
                <p className="mt-2 font-display text-3xl font-extrabold">
                  {board[0].participant.name}
                </p>
                <p className="mt-1 text-[var(--fg-muted)]">{board[0].total} points</p>
              </>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/" className="btn-primary">
                Home
              </Link>
              <Link href="/host" className="btn-secondary">
                Host new tournament
              </Link>
              <Link href={`/leaderboard/${sessionId}`} className="btn-secondary">
                Final podium
              </Link>
            </div>
          </section>
        )}

        {session.mode === "teams" && session.status === "lobby" && (
          <section className="card-surface space-y-3">
            <h3 className="font-display text-lg font-bold">Teams</h3>
            <p className="text-sm text-[var(--fg-muted)]">
              Seed teams here, or let players create one when they join.
            </p>
            {session.teams.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {session.teams.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-xl bg-white/5 px-3 py-1.5 text-sm font-semibold"
                  >
                    {t.emoji} {t.name}
                  </li>
                ))}
              </ul>
            )}
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
            <div className="flex gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              />
              <button
                type="button"
                className="btn-primary !px-4"
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
            Players
            <span className="text-[var(--fg-muted)]">({session.players.length})</span>
          </h3>
          <ul className="max-h-[32rem] space-y-2 overflow-auto">
            {session.players.map((p, i) => {
              const row = gameBoard.find((r) => r.playerId === p.id);
              const pending =
                session.status === "active" && Boolean(session.currentGameId) && row && !row.done;
              const doneRound =
                session.status === "active" && Boolean(session.currentGameId) && row?.done;
              const overall = board.find(
                (b) => b.participant.id === p.id || b.participant.id === p.teamId,
              );
              return (
                <li
                  key={p.id}
                  className={`rounded-xl px-3 py-2.5 text-sm ${
                    pending
                      ? "bg-amber-500/10"
                      : doneRound
                        ? "bg-emerald-500/10"
                        : "bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-[var(--fg-muted)]">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
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
                  {(session.status === "active" || session.status === "finished") && (
                    <div className="mt-1 flex justify-between pl-5 text-xs text-[var(--fg-muted)]">
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
            })}
            {session.players.length === 0 && (
              <li className="text-sm text-[var(--fg-muted)]">Waiting for joins…</li>
            )}
          </ul>
        </section>
      </aside>
    </PageEnter>
  );
}
