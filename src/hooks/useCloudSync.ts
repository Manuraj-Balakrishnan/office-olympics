"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTournamentStore } from "@/store/useTournamentStore";

/** Optional sync of tournament snapshot to Cloudflare D1 via API route */
export function useCloudSync(enabled = true) {
  const snapshot = useTournamentStore(
    useShallow((s) => ({
      mode: s.mode,
      players: s.players,
      teams: s.teams,
      scores: s.scores,
      gameOrder: s.gameOrder,
      playedGames: s.playedGames,
      tournamentStarted: s.tournamentStarted,
      tournamentFinished: s.tournamentFinished,
    })),
  );

  useEffect(() => {
    if (!enabled || !snapshot.tournamentStarted) return;
    const t = setTimeout(() => {
      void fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      }).catch(() => {
        /* D1 optional — localStorage remains source of truth */
      });
    }, 800);
    return () => clearTimeout(t);
  }, [snapshot, enabled]);
}
