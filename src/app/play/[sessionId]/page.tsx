"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveGame } from "@/data/games";
import { loadIdentity, useSessionPoll } from "@/hooks/useSession";
import {
  CurrentGameScores,
  GameProgressBar,
  LobbyGamesList,
  OverallLeaderboard,
  PerGameTops,
} from "@/components/session/ScoreBoards";
import { LobbyReadyBanner, LobbyRoster } from "@/components/session/WaitingRoom";
import { ScoreSubmittedCard } from "@/components/session/ScoreSubmittedCard";
import { FinishedResults } from "@/components/session/FinishedResults";
import { getTeamEmblem } from "@/data/teamEmblems";
import { useSound } from "@/hooks/useSound";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { LoadingPulse } from "@/components/layout/LoadingPulse";

export default function PlaySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data, loading, error } = useSessionPoll(sessionId, 800);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const { play } = useSound();
  const launchedGame = useRef<string | null>(null);
  const wasReady = useRef(false);

  useEffect(() => {
    const id = loadIdentity(sessionId);
    setPlayerId(id?.playerId ?? null);
  }, [sessionId]);

  const session = data?.session;
  const me = session?.players.find((p) => p.id === playerId);
  const board = data?.leaderboard ?? [];
  const gameBoard = data?.gameScoreboard ?? [];
  const gameResults = data?.gameResults ?? [];
  const mvps = data?.mvps ?? [];
  const roundComplete = Boolean(data?.roundComplete);

  const currentGame = resolveGame(session?.currentGameId);
  const myGameRow = gameBoard.find((r) => r.playerId === playerId);
  const myTeam =
    session?.mode === "teams" && me?.teamId
      ? session.teams.find((t) => t.id === me.teamId)
      : undefined;
  const teamColor = myTeam
    ? (getTeamEmblem(myTeam.emoji)?.color ?? null) ?? myTeam.color
    : undefined;
  const canPlay = Boolean(
    session &&
      me &&
      session.status === "active" &&
      session.currentGameId &&
      !myGameRow?.done,
  );
  const othersWaiting = gameBoard.filter(
    (r) => !r.done && r.playerId !== playerId,
  ).length;
  const myOverallRank =
    board.findIndex(
      (r) => r.participant.id === me?.id || r.participant.id === me?.teamId,
    ) + 1;

  useEffect(() => {
    if (!canPlay || !session?.currentGameId) {
      wasReady.current = false;
      return;
    }
    const key = session.currentGameId;
    const freshLaunch = launchedGame.current !== key || !wasReady.current;
    if (freshLaunch) {
      launchedGame.current = key;
      play("go");
    }
    wasReady.current = true;
    router.replace(`/play/${sessionId}/game/${key}`);
  }, [canPlay, session?.currentGameId, sessionId, router, play]);

  if (loading && !data) {
    return <LoadingPulse label="Connecting…" />;
  }
  if (error || !session) {
    return <p className="p-10 text-center text-red-400">{error ?? "Missing session"}</p>;
  }
  if (!playerId || !me) {
    return (
      <PageEnter className="mx-auto max-w-md space-y-4 p-10 text-center">
        <PageItem>
          <p className="font-display text-2xl font-bold">Join to play</p>
        </PageItem>
        <PageItem>
          <Link href={`/join/${session.joinCode}`} className="btn-primary inline-flex">
            Join {session.joinCode}
          </Link>
        </PageItem>
      </PageEnter>
    );
  }

  const gameIndex = session.currentGameId
    ? session.gameOrder.indexOf(session.currentGameId) + 1
    : 0;

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
          variant="player"
          mvps={mvps}
          highlightId={session.mode === "teams" ? me.teamId : me.id}
        />
      </PageEnter>
    );
  }

  if (canPlay && currentGame) {
    return <LoadingPulse label={`Starting ${currentGame.title}…`} />;
  }

  return (
    <PageEnter className="mx-auto w-full max-w-md space-y-4 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-lg sm:space-y-5 sm:px-4 sm:py-8">
      {session.status === "lobby" ? (
        <PageItem>
          <LobbyReadyBanner
            name={me.name}
            playerCount={session.players.length}
            avatar={me.emoji}
            joinCode={session.joinCode}
            teamName={myTeam?.name}
            teamEmoji={myTeam?.emoji}
            teamColor={teamColor}
          />
        </PageItem>
      ) : (
        <PageItem className="text-center">
          <p className="text-sm text-[var(--fg-muted)]">{session.joinCode}</p>
          <h1 className="font-display text-3xl font-extrabold">Hey, {me.name}</h1>
          {myOverallRank > 0 && (
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Overall rank <span className="font-bold text-[var(--fg)]">#{myOverallRank}</span>
              {board[myOverallRank - 1] ? ` · ${board[myOverallRank - 1]!.total} pts` : ""}
            </p>
          )}
        </PageItem>
      )}

      {session.status !== "lobby" && (
        <PageItem>
          <GameProgressBar
            order={session.gameOrder}
            currentId={session.currentGameId}
            played={session.playedGames}
          />
        </PageItem>
      )}

      {session.status === "lobby" && (
        <PageItem>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:rounded-[1.75rem] sm:p-5">
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
                maxHeightClass={
                  session.players.length > 8
                    ? "max-h-[min(22rem,48dvh)] sm:max-h-[min(26rem,50dvh)]"
                    : ""
                }
                highlightPlayerId={me.id}
              />
            </div>
          </div>
        </PageItem>
      )}

      {session.status === "lobby" && (
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
              <LobbyGamesList order={session.gameOrder} layout="strip" title="Up next" />
            </div>
          </div>
        </PageItem>
      )}

      {session.status === "active" && currentGame && (
        <PageItem>
          {myGameRow?.done ? (
            <ScoreSubmittedCard
              gameTitle={currentGame.title}
              gameIndex={gameIndex}
              gameTotal={session.gameOrder.length}
              score={myGameRow.score ?? 0}
              detail={myGameRow.detail}
              playerEmoji={myGameRow.emoji || me.emoji || ""}
              playerColor={teamColor || myGameRow.color}
              submittedCount={gameBoard.filter((r) => r.done).length}
              playerCount={session.players.length}
              roundComplete={roundComplete}
              othersWaiting={othersWaiting}
            />
          ) : (
            <div className="card-surface space-y-3 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
                Game {gameIndex} of {session.gameOrder.length}
              </p>
              <h2 className="font-display text-3xl font-extrabold">{currentGame.title}</h2>
              <p className="text-[var(--fg-muted)]">Waiting for the host…</p>
            </div>
          )}
        </PageItem>
      )}

      {session.status === "active" && !currentGame && (
        <PageItem>
          <div className="card-surface text-center">
            <p className="font-display text-xl font-bold">Between rounds</p>
            <p className="mt-2 text-[var(--fg-muted)]">
              Next game starts automatically when the host launches it.
            </p>
          </div>
        </PageItem>
      )}

      {session.status === "active" && currentGame && (
        <PageItem>
          <CurrentGameScores title="This game" rows={gameBoard} highlightId={playerId} />
        </PageItem>
      )}

      {session.status === "active" && (
        <PageItem>
          <PerGameTops games={gameResults} />
        </PageItem>
      )}

      {session.status !== "lobby" && (
        <PageItem>
          <OverallLeaderboard
            rows={board}
            highlightId={session.mode === "teams" ? me.teamId : me.id}
          />
        </PageItem>
      )}

      {session.status === "active" && (
        <PageItem>
          <p className="text-center text-xs text-[var(--fg-muted)]">
            Up next:{" "}
            {session.gameOrder
              .slice(gameIndex)
              .slice(0, 3)
              .map((g) => resolveGame(g)?.title)
              .filter(Boolean)
              .join(" → ") || "Final results"}
          </p>
        </PageItem>
      )}
    </PageEnter>
  );
}
