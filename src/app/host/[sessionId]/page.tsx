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
import { resolveGame } from "@/data/games";
import { DEFAULT_TEAM_EMBLEM, nextTeamEmblem, getTeamEmblem } from "@/data/teamEmblems";
import { PlayerAvatar, TeamEmblemPicker } from "@/components/PlayerAvatar";
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
  LobbyGamesList,
  OverallLeaderboard,
  PerGameTops,
  gameIconFor,
} from "@/components/session/ScoreBoards";
import { LobbyLiveBadge, LobbyRoster, JoinCodeTiles } from "@/components/session/WaitingRoom";
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
  showAvatar = true,
}: {
  player: Player;
  index?: number;
  sessionStatus: SessionStatus;
  currentGameId: GameId | null;
  gameBoard: GameScoreRow[];
  board: LeaderboardRow[];
  nested?: boolean;
  showAvatar?: boolean;
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
      className={`rounded-xl border px-3 py-2.5 text-sm sm:rounded-2xl ${
        pending
          ? "border-amber-500/30 bg-amber-500/10"
          : doneRound
            ? "border-emerald-500/25 bg-emerald-500/10"
            : nested
              ? "border-[var(--border)] bg-tone-6"
              : "border-[var(--border)] bg-tone-5"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <PlayerAvatar
          avatar={showAvatar ? player.emoji : undefined}
          name={player.name}
          size="sm"
          rounded="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {index != null && (
              <span className="text-[11px] font-semibold tabular-nums text-[var(--fg-muted)]">
                #{index}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
          </div>
          {sessionStatus === "active" && (
            <div className="mt-0.5 flex justify-between gap-2 text-[11px] text-[var(--fg-muted)] sm:text-xs">
              <span className="truncate">
                {doneRound
                  ? `Round ${row?.score}`
                  : pending
                    ? "Still playing…"
                    : "—"}
              </span>
              <span className="shrink-0 font-semibold text-[var(--fg)]">
                {overall?.total ?? 0} total
              </span>
            </div>
          )}
        </div>
        {pending && (
          <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--status-playing)]">
            Playing
          </span>
        )}
        {doneRound && (
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--status-done)]">
            Done
          </span>
        )}
      </div>
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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 sm:px-5 sm:py-3.5">
        <h2 className="min-w-0 truncate font-display text-base font-bold sm:text-lg">
          {title}
        </h2>
        <p className="shrink-0 rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--fg)] sm:px-2.5 sm:py-1 sm:text-xs">
          {done}/{rows.length}
        </p>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {rows.map((row) => {
          const rank = row.done
            ? rows.filter((r) => r.done).findIndex((r) => r.playerId === row.playerId) + 1
            : null;
          return (
            <li
              key={row.playerId}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3 ${
                row.done
                  ? "bg-emerald-500/[0.07]"
                  : "bg-amber-500/[0.05]"
              }`}
            >
              <span className="w-7 shrink-0 text-sm font-semibold tabular-nums text-[var(--fg-muted)]">
                {rank ? `#${rank}` : "·"}
              </span>
              <PlayerAvatar avatar={row.emoji} name={row.name} size="md" rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name}</p>
                <p className="truncate text-[11px] text-[var(--fg-muted)] sm:text-xs">
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
                      className="font-display text-xl font-extrabold tabular-nums"
                      style={{ color: row.color }}
                    >
                      {row.score}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
                      /1000
                    </p>
                  </>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--status-playing)]">
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
  const [teamEmoji, setTeamEmoji] = useState(DEFAULT_TEAM_EMBLEM);
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

  const addTeamFromLobby = () => {
    const name = teamName.trim();
    if (!name || busy) return;
    void run("add-team", { name, emoji: teamEmoji });
    setTeamName("");
    setTeamEmoji(
      nextTeamEmblem([...(data?.session.teams.map((t) => t.emoji) ?? []), teamEmoji]),
    );
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
    <PageEnter className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-5 sm:gap-6 sm:px-4 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
      <div className="min-w-0 flex-1 space-y-5 sm:space-y-7 lg:col-start-1">
        {/* Active header only — lobby uses the join stage as its header */}
        {session.status !== "lobby" && (
          <PageItem>
            <header className="space-y-2 sm:space-y-3">
              <LobbyLiveBadge
                playerCount={session.players.length}
                label={`Live · ${session.joinCode}`}
              />
              <div>
                <h1 className="font-display text-[1.75rem] font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                  <span className="text-gradient">Control room</span>
                </h1>
                <p className="mt-1 max-w-lg text-sm text-[var(--fg-muted)] sm:mt-1.5 sm:text-base">
                  Watch scores come in — advance when the round is ready.
                </p>
              </div>
            </header>
          </PageItem>
        )}

        {actionError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionError}
          </div>
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

        {/* Lobby stage */}
        {session.status === "lobby" && (
          <PageItem>
            <div className="space-y-4 sm:space-y-5">
              <header className="space-y-1.5 sm:space-y-2">
                <LobbyLiveBadge
                  playerCount={session.players.length}
                  className="justify-start"
                />
                <h1 className="font-display text-[1.85rem] font-extrabold leading-[1.05] tracking-tight sm:text-4xl">
                  <span className="text-gradient">Tournament lobby</span>
                </h1>
                <p className="max-w-lg text-sm text-[var(--fg-muted)] sm:text-base">
                  Share the code, watch the room fill, then start when it feels right.
                </p>
              </header>

              <div className="grid gap-3 sm:gap-4 lg:grid-cols-12 lg:items-stretch">
                {/* Join stage */}
                <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] sm:rounded-[1.75rem] lg:col-span-7">
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(ellipse 75% 85% at 100% 55%, color-mix(in srgb, var(--primary-from) 22%, transparent), transparent 58%), radial-gradient(ellipse 45% 50% at 0% 0%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 52%), radial-gradient(ellipse 50% 40% at 40% 100%, color-mix(in srgb, var(--accent-warm) 8%, transparent), transparent 55%)",
                    }}
                  />
                  <div className="relative flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 md:flex-row md:items-center md:gap-7 md:p-7">
                    <div className="min-w-0 flex-1 text-left">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--fg-muted)] sm:mb-2.5 sm:text-[11px]">
                        Join code
                      </p>
                      <JoinCodeTiles joinCode={session.joinCode} size="lg" />
                      <p className="mt-3 text-sm leading-snug text-[var(--fg-muted)] sm:mt-4">
                        Players open the link or type this code on their phone.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-[6px] sm:mt-5">
                        <button
                          type="button"
                          className="btn-secondary !min-h-11 flex-1 !gap-[6px] !px-3.5 !py-2.5 !text-sm sm:flex-none sm:!px-4 sm:!text-base"
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
                          className="btn-secondary !min-h-11 flex-1 !gap-[6px] !px-3.5 !py-2.5 !text-sm sm:flex-none sm:!px-4 sm:!text-base"
                          disabled={busy}
                          onClick={() => void run("shuffle")}
                        >
                          <Shuffle className="h-4 w-4" />
                          Shuffle games
                        </button>
                      </div>
                      <div className="mt-4 hidden sm:block">
                        <button
                          type="button"
                          className={`btn-primary w-full max-w-sm ${canStart ? "animate-pulse-ring" : ""}`}
                          disabled={busy || !canStart}
                          onClick={() => void run("start")}
                        >
                          <Play className="h-5 w-5" /> Start tournament
                        </button>
                        {startHint && (
                          <p className="mt-2 text-sm text-[var(--status-playing)]">{startHint}</p>
                        )}
                      </div>
                    </div>

                    <div className="mx-auto shrink-0 sm:mx-0">
                      <div className="relative">
                        <div
                          className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-80 blur-2xl"
                          aria-hidden
                          style={{
                            background:
                              "radial-gradient(circle, color-mix(in srgb, var(--primary-from) 50%, transparent), transparent 68%)",
                          }}
                        />
                        <div className="relative rounded-[1.35rem] bg-gradient-to-br from-[var(--primary-from)] via-[var(--primary-to)] to-[color-mix(in_srgb,var(--accent-2)_50%,var(--primary-from))] p-[3px] shadow-[0_22px_50px_-22px_color-mix(in_srgb,var(--primary-from)_75%,transparent)]">
                          <div className="rounded-[1.2rem] bg-white p-2.5 sm:p-3">
                            {joinUrl && (
                              <>
                                <span className="sm:hidden">
                                  <QRCodeSVG
                                    value={joinUrl}
                                    size={132}
                                    level="M"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#0a0c10"
                                  />
                                </span>
                                <span className="hidden sm:inline">
                                  <QRCodeSVG
                                    value={joinUrl}
                                    size={148}
                                    level="M"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#0a0c10"
                                  />
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-center text-[11px] font-semibold tracking-wide text-[var(--fg-muted)]">
                        Scan to join
                      </p>
                    </div>
                  </div>
                </div>

                {/* Crowd panel */}
                <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:rounded-[1.75rem] sm:p-5 lg:col-span-5 lg:flex lg:flex-col">
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 60% at 80% 0%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 55%), radial-gradient(ellipse 50% 45% at 10% 100%, color-mix(in srgb, var(--primary-from) 10%, transparent), transparent 50%)",
                    }}
                  />
                  <LobbyRoster
                    mode={session.mode}
                    players={session.players}
                    teams={session.teams}
                    large
                    className="relative lg:flex-1"
                    maxHeightClass="max-h-[min(18rem,42dvh)] sm:max-h-[min(20rem,44dvh)] lg:max-h-[min(24rem,52dvh)]"
                  />
                </div>
              </div>

              {session.mode === "teams" && (
                <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3 sm:rounded-[1.35rem] sm:px-4 sm:py-3.5">
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(ellipse 55% 80% at 0% 50%, color-mix(in srgb, var(--accent-warm) 8%, transparent), transparent 55%)",
                    }}
                  />
                  <div className="relative">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <h3 className="font-display text-sm font-bold sm:text-base">Add a team</h3>
                      <p className="text-[11px] text-[var(--fg-muted)] sm:text-xs">
                        Or let players create one when they join
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <TeamEmblemPicker
                        value={teamEmoji}
                        onChange={setTeamEmoji}
                        label={false}
                        compact
                      />
                    </div>

                    <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-tone-4/80 p-1 pl-1.5">
                        <PlayerAvatar
                          avatar={teamEmoji}
                          name={teamName.trim() || "New team"}
                          size="sm"
                          rounded="rounded-lg"
                          className="shrink-0"
                        />
                        <input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Team name"
                          aria-label="Team name"
                          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-[var(--fg-muted)]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTeamFromLobby();
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary !min-h-10 w-full shrink-0 !px-4 !py-2 !text-sm sm:w-auto"
                        disabled={!teamName.trim() || busy}
                        onClick={addTeamFromLobby}
                      >
                        Add team
                      </button>
                    </div>
                  </div>
                </section>
              )}

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
            </div>
          </PageItem>
        )}

        {/* Active round control — one clear CTA */}
        {session.status === "active" && currentGame && (
          <PageItem>
          <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] sm:rounded-3xl">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background: roundComplete
                  ? "radial-gradient(ellipse 70% 80% at 12% 0%, color-mix(in srgb, var(--primary-from) 20%, transparent), transparent 55%), radial-gradient(ellipse 45% 55% at 95% 90%, color-mix(in srgb, #34d399 12%, transparent), transparent 50%)"
                  : "radial-gradient(ellipse 65% 80% at 10% 0%, color-mix(in srgb, var(--primary-from) 16%, transparent), transparent 55%), radial-gradient(ellipse 45% 55% at 95% 90%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 50%)",
              }}
            />
            <div className="relative space-y-5 p-4 sm:space-y-6 sm:p-6 md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--fg-muted)] sm:text-xs sm:tracking-[0.22em]">
                      Round {gameIndex} of {session.gameOrder.length}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        roundComplete
                          ? "bg-emerald-500/20 text-[var(--status-done)]"
                          : "bg-amber-500/20 text-[var(--status-playing)]"
                      }`}
                    >
                      {roundComplete ? "Round complete" : "In progress"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-start gap-3">
                    {(() => {
                      const Icon = gameIconFor(currentGame.icon);
                      return (
                        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary-from)_18%,transparent)] text-[var(--primary-from)] sm:h-12 sm:w-12 sm:rounded-2xl">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                      );
                    })()}
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
                        {currentGame.title}
                      </h2>
                      <p className="mt-1.5 max-w-xl text-sm text-[var(--fg-muted)] sm:text-base">
                        {currentGame.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-tone-4 px-4 py-3 sm:w-auto sm:min-w-[9.5rem] sm:flex-col sm:justify-center sm:px-5 sm:py-4 sm:text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">
                    Progress
                  </p>
                  <p className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl">
                    {doneThisGame}
                    <span className="text-base text-[var(--fg-muted)] sm:text-lg">
                      /{session.players.length}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--fg-muted)]">
                    {roundComplete ? "Everyone finished" : "players done"}
                  </p>
                </div>
              </div>

              {roundComplete ? (
                <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-[var(--status-done)]">
                  {isLastGame
                    ? "All scores in — crown the winners when you’re ready."
                    : `All scores in — start ${nextGame?.title ?? "the next game"} when you’re ready.`}
                </p>
              ) : (
                waitingPlayers.length > 0 && (
                  <p className="text-sm text-[var(--fg-muted)]">
                    Waiting on{" "}
                    <span className="font-semibold text-[var(--fg)]">
                      {waitingPlayers.map((p) => p.name).join(", ")}
                    </span>
                  </p>
                )
              )}

              <div className="hidden flex-col gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
                {roundComplete ? (
                  isLastGame ? (
                    <button
                      type="button"
                      className={`btn-primary ${roundComplete ? "animate-pulse-ring" : ""}`}
                      disabled={busy}
                      onClick={() => void run("finish")}
                    >
                      <Trophy className="h-4 w-4" /> Crown winners
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary animate-pulse-ring"
                      disabled={busy}
                      onClick={() => void run("next-game")}
                    >
                      <Play className="h-4 w-4" />
                      <span className="truncate">
                        Start next
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
                    {isLastGame ? "Skip & end" : "Skip unfinished → next"}
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
          <PageItem>
            <LiveRoundBoard rows={gameBoard} title="Live scores" />
          </PageItem>
        )}

        {/* Standings once */}
        {session.status === "active" && (
          <PageItem>
            <OverallLeaderboard rows={board} title="Overall standings" />
          </PageItem>
        )}

        {session.status === "active" && (
          <PageItem>
            <PerGameTops games={gameResults} />
          </PageItem>
        )}

      </div>

      {/* Roster above Schedule on mobile; sticky sidebar on desktop */}
      {session.status === "active" && (
        <aside className="w-full shrink-0 space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
          <section className="card-surface !p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 sm:px-5 sm:py-3.5">
              <h3 className="flex min-w-0 items-center gap-2 font-display text-base font-bold sm:text-lg">
                <Users className="h-4 w-4 shrink-0 text-[var(--primary-from)] sm:h-5 sm:w-5" />
                <span className="truncate">
                  {session.mode === "teams" ? "Teams" : "Players"}
                </span>
              </h3>
              <p className="shrink-0 rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--fg)] sm:px-2.5 sm:py-1 sm:text-xs">
                {session.players.length}
              </p>
            </div>
            <div className="max-h-[min(32rem,60dvh)] space-y-2.5 overflow-auto overscroll-contain p-3 sm:space-y-3 sm:p-4">
              {session.mode === "teams" ? (
                <>
                  {session.teams.map((team) => {
                    const members = session.players.filter((p) => p.teamId === team.id);
                    return (
                      <div
                        key={team.id}
                        className="rounded-xl border border-[var(--border)] bg-tone-4 p-2.5 sm:rounded-2xl"
                      >
                        <div className="mb-2 flex items-center gap-2 px-0.5">
                          <PlayerAvatar
                            avatar={team.emoji}
                            name={team.name}
                            size="sm"
                            rounded="rounded-lg"
                            color={(getTeamEmblem(team.emoji)?.color ?? null) ?? team.color}
                          />
                          <span
                            className="min-w-0 flex-1 truncate font-display text-sm font-bold"
                            style={{
                              color:
                                (getTeamEmblem(team.emoji)?.color ?? null) ?? team.color,
                            }}
                          >
                            {team.name}
                          </span>
                          <span className="text-[11px] font-semibold tabular-nums text-[var(--fg-muted)]">
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
                      <div className="rounded-xl border border-[var(--border)] bg-tone-4 p-2.5 sm:rounded-2xl">
                        <div className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] sm:text-xs">
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
                <ul className="space-y-1.5 sm:space-y-2">
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
      )}

      {/* Compact game order — below Players on mobile; main column on desktop */}
      {session.status === "active" && (
        <PageItem className="lg:col-start-1">
          <section className="card-surface !p-0 overflow-hidden">
            <div className="flex items-end justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 sm:px-5 sm:py-3.5">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold sm:text-lg">Schedule</h3>
                <p className="mt-0.5 hidden text-xs text-[var(--fg-muted)] sm:block">
                  Now, done, and what’s next
                </p>
              </div>
              <p className="shrink-0 rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--fg)] sm:px-2.5 sm:py-1 sm:text-xs">
                {session.gameOrder.length}
              </p>
            </div>
            <ol className="divide-y divide-[var(--border)]">
              {session.gameOrder.map((gid, i) => {
                const g = resolveGame(gid);
                if (!g) return null;
                const Icon = gameIconFor(g.icon);
                const isLive = session.currentGameId === gid;
                const done = session.playedGames.includes(gid);
                const top = gameResults.find((r) => r.gameId === gid)?.top[0];
                return (
                  <li
                    key={gid}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm sm:gap-3 sm:px-5 sm:py-3 ${
                      isLive
                        ? "bg-[color-mix(in_srgb,var(--primary-from)_12%,transparent)]"
                        : done
                          ? "opacity-55"
                          : "transition hover:bg-tone-4"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-tone-8 text-[11px] font-bold tabular-nums text-[var(--fg-muted)] sm:h-7 sm:w-7">
                      {i + 1}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
                        isLive
                          ? "bg-[color-mix(in_srgb,var(--primary-from)_22%,transparent)] text-[var(--primary-from)]"
                          : "bg-tone-8 text-[var(--fg-muted)]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{g.title}</span>
                    {top && done && (
                      <span className="hidden max-w-[40%] items-center gap-1 truncate text-xs text-[var(--fg-muted)] sm:inline-flex">
                        <PlayerAvatar
                          avatar={top.emoji}
                          name={top.name}
                          size="xs"
                          rounded="rounded-md"
                        />
                        <span className="truncate">
                          {top.name} · {top.score}
                        </span>
                      </span>
                    )}
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
                        isLive
                          ? "text-[var(--primary-from)]"
                          : "text-[var(--fg-muted)]"
                      }`}
                    >
                      {isLive ? "now" : done ? "done" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </PageItem>
      )}

      {/* Mobile sticky CTAs */}
      {session.status === "lobby" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-xl sm:hidden lg:col-span-2">
          <button
            type="button"
            className={`btn-primary w-full !min-h-12 ${canStart ? "animate-pulse-ring" : ""}`}
            disabled={busy || !canStart}
            onClick={() => void run("start")}
          >
            <Play className="h-5 w-5" /> Start tournament
          </button>
          {startHint && (
            <p className="mt-2 text-center text-xs text-[var(--status-playing)]">{startHint}</p>
          )}
        </div>
      )}
      {session.status === "lobby" && (
        <div className="h-24 sm:hidden lg:col-span-2" aria-hidden />
      )}

      {session.status === "active" && currentGame && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden lg:col-span-2">
          <div className="flex flex-col gap-2">
            {roundComplete ? (
              isLastGame ? (
                <button
                  type="button"
                  className="btn-primary w-full animate-pulse-ring"
                  disabled={busy}
                  onClick={() => void run("finish")}
                >
                  <Trophy className="h-5 w-5" /> Crown winners
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary w-full animate-pulse-ring"
                  disabled={busy}
                  onClick={() => void run("next-game")}
                >
                  <Play className="h-5 w-5" />
                  <span className="truncate">
                    Next{nextGame ? `: ${nextGame.title}` : ""}
                  </span>
                </button>
              )
            ) : (
              <button
                type="button"
                className="btn-secondary w-full"
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
                {isLastGame ? "Skip & end" : "Skip → next"}
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1 !py-2 text-sm"
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
                <RotateCcw className="h-4 w-4" /> Replay
              </button>
              <button
                type="button"
                className="btn-secondary flex-1 !py-2 text-sm text-red-300"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm("End the tournament for everyone?")) return;
                  void run("finish");
                }}
              >
                End
              </button>
            </div>
          </div>
        </div>
      )}
      {session.status === "active" && currentGame && (
        <div className="h-28 sm:hidden lg:col-span-2" aria-hidden />
      )}
    </PageEnter>
  );
}
