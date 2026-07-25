"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactionTest } from "@/games/ReactionTest";
import { SimonPattern } from "@/games/SimonPattern";
import { MemoryMatch } from "@/games/MemoryMatch";
import { SpotTheDifference } from "@/games/SpotTheDifference";
import { OneSecondChallenge } from "@/games/OneSecondChallenge";
import { StroopChallenge } from "@/games/StroopChallenge";
import { TypingRace } from "@/games/TypingRace";
import { SpeedPuzzle } from "@/games/SpeedPuzzle";
import { WordScramble } from "@/games/WordScramble";
import { TriviaQuiz } from "@/games/TriviaQuiz";
import { loadIdentity } from "@/hooks/useSession";
import { SessionPlayProvider, useSessionPlay } from "@/hooks/SessionPlayContext";
import { useTournamentStore } from "@/store/useTournamentStore";
import type { GameId, PlayerOrTeam, TournamentSettings } from "@/types/tournament";
import { TEAM_COLORS } from "@/data/games";
import { getTeamEmblem } from "@/data/teamEmblems";

const GAME_COMPONENTS: Record<GameId, React.ComponentType> = {
  reaction: ReactionTest,
  simon: SimonPattern,
  memory: MemoryMatch,
  "spot-difference": SpotTheDifference,
  "one-second": OneSecondChallenge,
  stroop: StroopChallenge,
  typing: TypingRace,
  "speed-puzzle": SpeedPuzzle,
  "word-scramble": WordScramble,
  trivia: TriviaQuiz,
};

function GameSync({
  sessionId,
  slug,
}: {
  sessionId: string;
  slug: string;
}) {
  const router = useRouter();
  const sessionPlay = useSessionPlay();
  const resultsOpen = sessionPlay?.resultsOpen ?? false;
  const scoreLocked = sessionPlay?.scoreLocked ?? false;

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        const session = json.session;
        const id = loadIdentity(sessionId);
        if (!id?.playerId) {
          router.replace(`/join`);
          return;
        }

        const already = session.scores?.some(
          (s: { playerId?: string; gameId: string }) =>
            s.playerId === id.playerId && s.gameId === slug,
        );

        if (session.status === "finished") {
          router.replace(`/play/${sessionId}`);
          return;
        }
        if (session.status !== "active") {
          router.replace(`/play/${sessionId}`);
          return;
        }

        // Leave only after score is in (or host skip forfeit landed) — never mid-results submit
        if (already || scoreLocked) {
          if (session.currentGameId !== slug || already) {
            router.replace(`/play/${sessionId}`);
          }
          return;
        }

        if (session.currentGameId !== slug) {
          // Host advanced while we were mid-game (not results) — go lobby for next round
          if (!resultsOpen) {
            router.replace(`/play/${sessionId}`);
          }
          // If results are open, stay put so submit / keepalive can finish
        }
      } catch {
        /* retry on next tick */
      }
    };

    void sync();
    const interval = setInterval(() => void sync(), 800);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, slug, router, resultsOpen, scoreLocked]);

  return null;
}

export default function PlayGamePage({
  params,
}: {
  params: Promise<{ sessionId: string; slug: string }>;
}) {
  const { sessionId, slug } = use(params);
  const router = useRouter();
  const [participant, setParticipant] = useState<PlayerOrTeam | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const Game = GAME_COMPONENTS[slug as GameId];
  const booted = useRef(false);
  const updateSettings = useTournamentStore((s) => s.updateSettings);

  useEffect(() => {
    const id = loadIdentity(sessionId);
    if (!id?.playerId) {
      router.replace(`/join`);
      return;
    }
    setPlayerId(id.playerId);

    let cancelled = false;

    const boot = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        const session = json.session;
        const player = session.players.find(
          (p: { id: string }) => p.id === id.playerId,
        );
        if (!player) {
          router.replace(`/join/${session.joinCode}`);
          return;
        }

        if (session.status === "finished" || session.status !== "active") {
          router.replace(`/play/${sessionId}`);
          return;
        }

        const already = session.scores?.some(
          (s: { playerId?: string; gameId: string }) =>
            s.playerId === id.playerId && s.gameId === slug,
        );
        if (already || session.currentGameId !== slug) {
          router.replace(`/play/${sessionId}`);
          return;
        }

        if (!booted.current) {
          booted.current = true;
          const settings = session.settings as TournamentSettings | undefined;
          if (settings) {
            updateSettings({
              assistMode: Boolean(settings.assistMode),
              huddleEnabled: Boolean(settings.huddleEnabled),
              teamPlayMode:
                settings.teamPlayMode === "everyone" ? "everyone" : "one-rep",
            });
          }
          const idx = session.players.findIndex(
            (p: { id: string }) => p.id === player.id,
          );
          const team =
            session.mode === "teams" && player.teamId
              ? session.teams?.find((t: { id: string }) => t.id === player.teamId)
              : undefined;
          setBootError(null);
          setParticipant({
            id: player.id,
            name: player.name,
            emoji: player.emoji ?? "",
            color:
              (team
                ? (getTeamEmblem(team.emoji)?.color ?? null) ?? team.color
                : null) ?? TEAM_COLORS[idx % TEAM_COLORS.length]!,
            kind: "player",
          });
        }
      } catch {
        if (!cancelled && !booted.current) {
          setBootError("Could not load game — retrying…");
        }
      }
    };

    void boot();
    const interval = setInterval(() => {
      if (!booted.current) void boot();
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, slug, router, updateSettings]);

  if (!Game) {
    return <p className="p-8 text-center">Unknown game</p>;
  }

  if (bootError && !participant) {
    return <p className="p-8 text-center text-[var(--fg-muted)]">{bootError}</p>;
  }

  if (!playerId || !participant) {
    return <p className="p-8 text-center font-display text-xl">Starting game…</p>;
  }

  return (
    <SessionPlayProvider
      sessionId={sessionId}
      playerId={playerId}
      gameId={slug as GameId}
      participant={participant}
    >
      <GameSync sessionId={sessionId} slug={slug} />
      <Game />
    </SessionPlayProvider>
  );
}
