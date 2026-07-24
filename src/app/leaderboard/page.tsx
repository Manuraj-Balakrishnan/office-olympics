"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import { Download, RotateCcw, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Podium } from "@/components/leaderboard/Podium";
import { RankTable } from "@/components/leaderboard/RankTable";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useSound } from "@/hooks/useSound";
import { GAME_MAP } from "@/data/games";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";

export default function LeaderboardPage() {
  const router = useRouter();
  const board = useLeaderboard();
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);
  const tournamentFinished = useTournamentStore((s) => s.tournamentFinished);
  const playedGames = useTournamentStore((s) => s.playedGames);
  const gameOrder = useTournamentStore((s) => s.gameOrder);
  const playAgain = useTournamentStore((s) => s.playAgain);
  const { play } = useSound();
  const burstOnce = useRef(false);

  useEffect(() => {
    if (!tournamentStarted) router.replace("/setup");
  }, [tournamentStarted, router]);

  useEffect(() => {
    if (burstOnce.current || board.length === 0) return;
    burstOnce.current = true;
    play(tournamentFinished ? "fanfare" : "complete");
    void confetti({
      particleCount: tournamentFinished ? 160 : 90,
      spread: 90,
      origin: { y: 0.55 },
      colors: ["#0085C7", "#F4C300", "#DF0024", "#009F3D", "#000000"],
    });
  }, [board.length, tournamentFinished, play]);

  const nextUnplayed = gameOrder.find((id) => !playedGames.includes(id));
  const winner = board[0];

  const exportPng = async () => {
    const el = document.getElementById("podium-export");
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: "#000000",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = "office-olympics-podium.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <PageEnter className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      {tournamentFinished && winner ? (
        <PageItem className="text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <Trophy className="mx-auto h-16 w-16 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]" />
          </motion.div>
          <h1 className="mt-4 font-display text-5xl font-extrabold md:text-6xl">
            <span className="text-gradient">Champions!</span>
          </h1>
          <p className="mt-3 text-2xl">
            <span className="text-4xl">{winner.participant.emoji}</span>{" "}
            <span
              className="font-display font-bold"
              style={{ color: winner.participant.color }}
            >
              {winner.participant.name}
            </span>{" "}
            takes the gold with {winner.total} pts
          </p>
        </PageItem>
      ) : (
        <PageItem className="text-center">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Leaderboard</h1>
          <p className="mt-2 text-[var(--fg-muted)]">
            {playedGames.length} of {gameOrder.length} games complete
          </p>
        </PageItem>
      )}

      <PageItem>
        <Podium top={board.slice(0, 3)} />
      </PageItem>
      <PageItem>
        <RankTable rows={board} />
      </PageItem>

      <PageItem className="flex flex-wrap items-center justify-center gap-3">
        {!tournamentFinished && nextUnplayed && (
          <Link
            href={GAME_MAP[nextUnplayed].route}
            className="btn-primary text-lg"
            onClick={() => play("click")}
          >
            Next Game: {GAME_MAP[nextUnplayed].title}
          </Link>
        )}
        <Link href="/dashboard" className="btn-secondary">
          All Games
        </Link>
        {tournamentFinished && (
          <>
            <button type="button" className="btn-secondary" onClick={() => void exportPng()}>
              <Download className="h-4 w-4" /> Export Results
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                playAgain();
                router.push("/dashboard");
              }}
            >
              <RotateCcw className="h-4 w-4" /> Play Again
            </button>
          </>
        )}
      </PageItem>
    </PageEnter>
  );
}
