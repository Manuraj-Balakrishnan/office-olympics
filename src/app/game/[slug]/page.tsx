"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReactionTest } from "@/games/ReactionTest";
import { SimonPattern } from "@/games/SimonPattern";
import { MemoryMatch } from "@/games/MemoryMatch";
import { SpotTheDifference } from "@/games/SpotTheDifference";
import { OneSecondChallenge } from "@/games/OneSecondChallenge";
import { StroopChallenge } from "@/games/StroopChallenge";
import { TypingRace } from "@/games/TypingRace";
import { EmojiDecode } from "@/games/EmojiDecode";
import { WordScramble } from "@/games/WordScramble";
import { TriviaQuiz } from "@/games/TriviaQuiz";
import { useTournamentStore } from "@/store/useTournamentStore";
import type { GameId } from "@/types/tournament";

const GAME_COMPONENTS: Record<GameId, React.ComponentType> = {
  reaction: ReactionTest,
  simon: SimonPattern,
  memory: MemoryMatch,
  "spot-difference": SpotTheDifference,
  "one-second": OneSecondChallenge,
  stroop: StroopChallenge,
  typing: TypingRace,
  "emoji-decode": EmojiDecode,
  "word-scramble": WordScramble,
  trivia: TriviaQuiz,
};

export default function GamePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);
  const slug = params.slug as GameId;
  const Game = GAME_COMPONENTS[slug];

  useEffect(() => {
    if (!tournamentStarted) router.replace("/setup");
  }, [tournamentStarted, router]);

  if (!Game) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="font-display text-2xl font-bold">Unknown game</p>
        <button type="button" className="btn-primary" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return <Game />;
}
