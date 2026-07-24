"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_MAP } from "@/data/games";
import { loadIdentity, useSessionPoll } from "@/hooks/useSession";
import type { GameId } from "@/types/tournament";
import {
  CurrentGameScores,
  GameProgressBar,
  OverallLeaderboard,
  PerGameTops,
} from "@/components/session/ScoreBoards";
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
  const roundComplete = Boolean(data?.roundComplete);

  const currentGame = session?.currentGameId ? GAME_MAP[session.currentGameId] : null;
  const myGameRow = gameBoard.find((r) => r.playerId === playerId);
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

  if (canPlay && currentGame) {
    return <LoadingPulse label={`Starting ${currentGame.title}…`} />;
  }

  return (
    <PageEnter className="mx-auto w-full max-w-lg space-y-5 px-4 py-8">
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
          <motion.div
            className="card-surface text-center"
            animate={{ boxShadow: ["0 0 0 0 rgba(56,189,248,0)", "0 0 0 8px rgba(56,189,248,0.12)", "0 0 0 0 rgba(56,189,248,0)"] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <p className="font-display text-xl font-bold">You&apos;re in!</p>
            <p className="mt-2 text-[var(--fg-muted)]">
              {session.players.length} player{session.players.length === 1 ? "" : "s"} connected.
              Keep this screen open — games launch automatically when the host starts each round.
            </p>
          </motion.div>
        </PageItem>
      )}

      {session.status === "active" && currentGame && (
        <PageItem>
          <div className="card-surface space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
              Game {gameIndex} of {session.gameOrder.length}
            </p>
            <h2 className="font-display text-3xl font-extrabold">{currentGame.title}</h2>

            {myGameRow?.done ? (
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl bg-emerald-500/15 px-4 py-5"
              >
                <p className="font-display text-xl font-bold">Score submitted</p>
                <p className="mt-1 text-[var(--fg-muted)]">
                  {myGameRow.score}
                  {myGameRow.detail ? ` · ${myGameRow.detail}` : ""}
                </p>
                <p className="mt-3 text-sm text-[var(--fg-muted)]">
                  {roundComplete
                    ? "Everyone’s in — waiting for the host to start the next game."
                    : othersWaiting > 0
                      ? `Waiting for ${othersWaiting} other player${othersWaiting === 1 ? "" : "s"}…`
                      : "Waiting for the host…"}
                </p>
              </motion.div>
            ) : (
              <p className="text-[var(--fg-muted)]">Waiting for the host…</p>
            )}
          </div>
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

      {session.status === "finished" && (
        <PageItem>
          <div className="card-surface space-y-4 text-center">
            <p className="font-display text-2xl font-bold text-gradient">Tournament complete</p>
            <p className="text-[var(--fg-muted)]">Check the podium for final standings.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={`/leaderboard/${sessionId}`} className="btn-primary inline-flex text-xl">
                Final podium
              </Link>
              <Link href="/" className="btn-secondary inline-flex">
                Home
              </Link>
            </div>
          </div>
        </PageItem>
      )}

      {session.status === "active" && currentGame && (
        <PageItem>
          <CurrentGameScores title="This game" rows={gameBoard} highlightId={playerId} />
        </PageItem>
      )}

      {(session.status === "active" || session.status === "finished") && (
        <PageItem>
          <PerGameTops games={gameResults} />
        </PageItem>
      )}

      <PageItem>
        <OverallLeaderboard
          rows={board}
          highlightId={session.mode === "teams" ? me.teamId : me.id}
        />
      </PageItem>

      {session.status === "active" && (
        <PageItem>
          <p className="text-center text-xs text-[var(--fg-muted)]">
            Up next:{" "}
            {session.gameOrder
              .slice(gameIndex)
              .slice(0, 3)
              .map((g) => GAME_MAP[g as GameId].title)
              .join(" → ") || "Final results"}
          </p>
        </PageItem>
      )}
    </PageEnter>
  );
}
