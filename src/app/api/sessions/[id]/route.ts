import { NextResponse } from "next/server";
import {
  addTeam,
  assertHost,
  computeMvps,
  finishSession,
  getGameResultsSummaries,
  getGameScoreboard,
  getLeaderboard,
  getParticipants,
  getSession,
  isRoundComplete,
  markGameComplete,
  peekNextGameId,
  publicSession,
  resetCurrentGame,
  setCurrentGame,
  shuffleGames,
  skipTurn,
  startSession,
  submitScore,
} from "@/lib/sessionStore";
import type { GameId, TournamentSession } from "@/types/tournament";

type Ctx = { params: Promise<{ id: string }> };

function payload(session: TournamentSession) {
  return {
    session: publicSession(session),
    leaderboard: getLeaderboard(session),
    participants: getParticipants(session),
    gameScoreboard: getGameScoreboard(session, session.currentGameId),
    gameResults: getGameResultsSummaries(session),
    mvps: session.status === "finished" ? computeMvps(session) : [],
    roundComplete: isRoundComplete(session),
    nextGameId: peekNextGameId(session),
  };
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(payload(session));
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const hostToken = (request.headers.get("x-host-token") || body.hostToken) as string;
    const action = body.action as string;

    let session: TournamentSession;
    switch (action) {
      case "start":
        session = await startSession(id, hostToken);
        break;
      case "set-game":
        session = await setCurrentGame(id, hostToken, body.gameId as GameId | null);
        break;
      case "complete-game":
      case "next-game":
        session = await markGameComplete(id, hostToken, body.gameId as GameId | undefined);
        break;
      case "skip-turn":
      case "skip-remaining":
        session = await skipTurn(id, hostToken);
        break;
      case "reset-game":
        session = await resetCurrentGame(id, hostToken);
        break;
      case "finish":
        session = await finishSession(id, hostToken);
        break;
      case "shuffle":
        session = await shuffleGames(id, hostToken);
        break;
      case "add-team": {
        const s = await getSession(id);
        if (!s) throw new Error("Session not found");
        assertHost(s, hostToken);
        await addTeam(id, hostToken, body.name, body.emoji);
        session = (await getSession(id))!;
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json(payload(session));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    if (body.action === "score" || body.gameId) {
      const session = await submitScore(
        id,
        body.playerId as string,
        body.gameId as GameId,
        Number(body.rawScore),
        body.detail as string | undefined,
        body.lowerIsBetter as boolean | undefined,
        (body.playerToken as string | undefined) ??
          (request.headers.get("x-player-token") || undefined),
      );
      return NextResponse.json(payload(session));
    }
    return NextResponse.json({ error: "Unknown POST" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Score failed" },
      { status: 400 },
    );
  }
}
