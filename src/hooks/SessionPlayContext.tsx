"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GameId, PlayerOrTeam } from "@/types/tournament";

type Ctx = {
  sessionId: string;
  playerId: string;
  gameId: GameId;
  participant: PlayerOrTeam;
  /** Results screen is up — don't kick the player until score locks */
  resultsOpen: boolean;
  /** Score successfully submitted (or keepalive fired) */
  scoreLocked: boolean;
  markResultsOpen: () => void;
  markScoreLocked: () => void;
};

const SessionPlayContext = createContext<Ctx | null>(null);

export function SessionPlayProvider({
  sessionId,
  playerId,
  gameId,
  participant,
  children,
}: {
  sessionId: string;
  playerId: string;
  gameId: GameId;
  participant: PlayerOrTeam;
  children: ReactNode;
}) {
  const [resultsOpen, setResultsOpen] = useState(false);
  const [scoreLocked, setScoreLocked] = useState(false);
  const lockedRef = useRef(false);

  const markResultsOpen = useCallback(() => {
    setResultsOpen(true);
  }, []);

  const markScoreLocked = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setScoreLocked(true);
  }, []);

  const value = useMemo(
    () => ({
      sessionId,
      playerId,
      gameId,
      participant,
      resultsOpen,
      scoreLocked,
      markResultsOpen,
      markScoreLocked,
    }),
    [
      sessionId,
      playerId,
      gameId,
      participant,
      resultsOpen,
      scoreLocked,
      markResultsOpen,
      markScoreLocked,
    ],
  );

  return (
    <SessionPlayContext.Provider value={value}>{children}</SessionPlayContext.Provider>
  );
}

export function useSessionPlay() {
  return useContext(SessionPlayContext);
}
