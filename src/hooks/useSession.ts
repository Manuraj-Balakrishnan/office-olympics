"use client";

import { useCallback, useEffect, useState } from "react";
import type { MvpAward, PlayerOrTeam, TournamentSession } from "@/types/tournament";

export type LeaderboardRow = {
  participant: PlayerOrTeam;
  total: number;
  byGame: Record<string, number>;
  /** Best individual on a team — set when participant.kind === "team" */
  topPlayer?: { id: string; name: string; emoji: string; total: number };
};

export type GameScoreRow = {
  playerId: string;
  name: string;
  emoji: string;
  color: string;
  score: number | null;
  rawScore: number | null;
  detail: string | null;
  lowerIsBetter?: boolean;
  isTurn: boolean;
  done: boolean;
};

export type GameResultSummary = {
  gameId: string;
  title: string;
  isCurrent: boolean;
  isComplete: boolean;
  rankings: GameScoreRow[];
  top: GameScoreRow[];
};

export type SessionPayload = {
  session: Omit<TournamentSession, "hostToken">;
  leaderboard: LeaderboardRow[];
  participants?: PlayerOrTeam[];
  gameScoreboard?: GameScoreRow[];
  gameResults?: GameResultSummary[];
  mvps?: MvpAward[];
  /** True when every player has scored the live game — host must advance */
  roundComplete?: boolean;
  nextGameId?: string | null;
};

const IDENTITY_PREFIX = "oo-identity:";
/** Legacy single-slot key — migrated on read */
const LEGACY_IDENTITY_KEY = "oo-identity";

export type LocalIdentity = {
  sessionId: string;
  playerId?: string;
  playerToken?: string;
  hostToken?: string;
  role: "host" | "player";
};

function identityKey(sessionId: string) {
  return `${IDENTITY_PREFIX}${sessionId}`;
}

export function loadIdentity(sessionId?: string): LocalIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    if (sessionId) {
      const scoped = localStorage.getItem(identityKey(sessionId));
      if (scoped) return JSON.parse(scoped) as LocalIdentity;

      // Migrate legacy single key if it matches this session
      const legacy = localStorage.getItem(LEGACY_IDENTITY_KEY);
      if (legacy) {
        const data = JSON.parse(legacy) as LocalIdentity;
        if (data.sessionId === sessionId) {
          saveIdentity(data);
          return data;
        }
      }
      return null;
    }

    const legacy = localStorage.getItem(LEGACY_IDENTITY_KEY);
    return legacy ? (JSON.parse(legacy) as LocalIdentity) : null;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: LocalIdentity) {
  localStorage.setItem(identityKey(identity.sessionId), JSON.stringify(identity));
  // Keep legacy pointer for older call sites that omit sessionId
  localStorage.setItem(LEGACY_IDENTITY_KEY, JSON.stringify(identity));
}

export function useSessionPoll(sessionId: string | undefined, intervalMs = 1500) {
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load session");
      }
      const json = (await res.json()) as SessionPayload;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
    if (!sessionId) return;
    const id = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(id);
  }, [sessionId, intervalMs, refresh]);

  return { data, error, loading, refresh };
}

export async function hostAction(
  sessionId: string,
  hostToken: string,
  action: string,
  body: Record<string, unknown> = {},
) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-host-token": hostToken,
    },
    body: JSON.stringify({ action, hostToken, ...body }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Action failed");
  return json as SessionPayload;
}

export async function submitPlayerScore(
  sessionId: string,
  playerId: string,
  gameId: string,
  rawScore: number,
  detail?: string,
  lowerIsBetter?: boolean,
  playerToken?: string,
) {
  const token = playerToken ?? loadIdentity(sessionId)?.playerToken;
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-player-token": token } : {}),
    },
    body: JSON.stringify({
      action: "score",
      playerId,
      gameId,
      rawScore,
      detail,
      lowerIsBetter,
      playerToken: token,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Score failed");
  return json as SessionPayload;
}
