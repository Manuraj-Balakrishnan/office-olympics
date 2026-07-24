"use client";

import Link from "next/link";
import {
  Zap,
  Music,
  LayoutGrid,
  Search,
  Eye,
  Palette,
  Keyboard,
  Puzzle,
  Shuffle,
  HelpCircle,
  Check,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { CATEGORY_COLORS, GAME_MAP, GAMES } from "@/data/games";
import { MiniLeaderboard } from "@/components/leaderboard/MiniLeaderboard";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useSound } from "@/hooks/useSound";
import type { GameId } from "@/types/tournament";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { staggerContainer, staggerItem } from "@/lib/motion";

const ICONS: Record<string, LucideIcon> = {
  Zap,
  Music,
  LayoutGrid,
  Search,
  Eye,
  Palette,
  Keyboard,
  Puzzle,
  Shuffle,
  HelpCircle,
};

export default function DashboardPage() {
  const router = useRouter();
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);
  const gameOrder = useTournamentStore((s) => s.gameOrder);
  const playedGames = useTournamentStore((s) => s.playedGames);
  const shuffleGames = useTournamentStore((s) => s.shuffleGames);
  const { play } = useSound();

  useEffect(() => {
    if (!tournamentStarted) router.replace("/setup");
  }, [tournamentStarted, router]);

  const ordered = gameOrder.map((id) => GAME_MAP[id]);

  return (
    <PageEnter className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <PageItem className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Host Dashboard</h1>
            <p className="mt-1 text-[var(--fg-muted)]">
              Pick a game — or shuffle the order for surprise rounds.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                play("click");
                shuffleGames();
              }}
            >
              <Shuffle className="h-4 w-4" /> Shuffle Order
            </button>
            <Link href="/leaderboard" className="btn-primary !py-3">
              Leaderboard
            </Link>
          </div>
        </PageItem>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {ordered.map((game) => {
            const Icon = ICONS[game.icon] ?? Zap;
            const played = playedGames.includes(game.id as GameId);
            return (
              <motion.div
                key={game.id}
                variants={staggerItem}
                whileHover={played ? undefined : { y: -4, scale: 1.01 }}
                className={`card-surface relative flex flex-col gap-4 ${
                  played ? "opacity-55 grayscale" : ""
                }`}
              >
                {played && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                )}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[game.category]} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">{game.title}</h2>
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">{game.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-lg bg-white/10 px-2 py-1">{game.difficulty}</span>
                  <span className="rounded-lg bg-white/10 px-2 py-1">
                    {game.durationSec}s
                  </span>
                </div>
                <Link
                  href={game.route}
                  className={`btn-primary mt-auto text-center ${played ? "pointer-events-none opacity-50" : ""}`}
                  onClick={() => play("click")}
                >
                  {played ? "Played" : "Play"}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {playedGames.length === GAMES.length && (
          <PageItem>
            <Link href="/leaderboard" className="btn-primary mx-auto block w-fit text-xl">
              View Final Results
            </Link>
          </PageItem>
        )}
      </div>

      <PageItem>
        <MiniLeaderboard />
      </PageItem>
    </PageEnter>
  );
}
