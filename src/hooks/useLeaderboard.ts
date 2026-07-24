"use client";

import { useTournamentStore } from "@/store/useTournamentStore";

/**
 * Leaderboard derived from store state.
 * Must not call getLeaderboard() inside a Zustand selector — a new array every
 * getSnapshot trips React's useSyncExternalStore into an infinite update loop.
 */
export function useLeaderboard() {
  const getLeaderboard = useTournamentStore((s) => s.getLeaderboard);
  useTournamentStore((s) => s.scores);
  useTournamentStore((s) => s.lastGameScores);
  useTournamentStore((s) => s.players);
  useTournamentStore((s) => s.teams);
  useTournamentStore((s) => s.mode);
  return getLeaderboard();
}
