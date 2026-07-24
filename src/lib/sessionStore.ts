import {
  GAMES,
  GAME_MAP,
  TEAM_COLORS,
  TEAM_EMOJIS,
  migrateGameId,
  sanitizeGameIds,
} from "@/data/games";
import type {
  CreateSessionInput,
  GameId,
  GameScoreEntry,
  JoinSessionInput,
  MvpAward,
  Player,
  PlayerOrTeam,
  Team,
  TournamentSession,
} from "@/types/tournament";
import { normalizeToThousand, clampRawScore } from "@/lib/normalizeScore";
import { getDB } from "@/lib/d1";
import { randomUUID } from "crypto";

type Store = {
  byId: Map<string, TournamentSession>;
  byCode: Map<string, string>;
};

const g = globalThis as unknown as { __ooSessions?: Store };

/**
 * In-process fallback for Node scripts only.
 * When Cloudflare context is available, D1 is required — memory sessions
 * disappear across Worker isolates and cause "Session not found".
 */
function memoryStore(): Store {
  if (!g.__ooSessions) {
    g.__ooSessions = { byId: new Map(), byCode: new Map() };
  }
  return g.__ooSessions;
}

function normalizeSession(session: TournamentSession): TournamentSession {
  session.gameOrder = sanitizeGameIds(session.gameOrder as string[]);
  session.playedGames = sanitizeGameIds(session.playedGames as string[]);
  if (session.currentGameId) {
    session.currentGameId = migrateGameId(session.currentGameId);
  }
  session.scores = session.scores
    .map((s) => {
      const gameId = migrateGameId(s.gameId);
      return gameId ? { ...s, gameId } : null;
    })
    .filter((s): s is NonNullable<typeof s> => s != null);
  for (const player of session.players) {
    if (player.completedGames) {
      player.completedGames = sanitizeGameIds(player.completedGames as string[]);
    }
  }
  return session;
}

function parseSession(payload: string): TournamentSession | null {
  try {
    const session = JSON.parse(payload) as TournamentSession;
    return normalizeSession(session);
  } catch {
    return null;
  }
}

async function loadFromD1(
  query: string,
  ...binds: unknown[]
): Promise<TournamentSession | null> {
  const db = await getDB();
  if (!db) return null;
  const row = await db
    .prepare(query)
    .bind(...binds)
    .first<{ payload: string }>();
  return row ? parseSession(row.payload) : null;
}

function makeJoinCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `OFFICE-${n}`;
}

function defaultSettings() {
  return {
    teamPlayMode: "one-rep" as const,
    assistMode: false,
    huddleEnabled: true,
  };
}

export async function createSession(input: CreateSessionInput): Promise<TournamentSession> {
  const id = randomUUID();
  let joinCode = makeJoinCode();
  while (await getSessionByCode(joinCode)) joinCode = makeJoinCode();

  const session: TournamentSession = {
    id,
    joinCode,
    hostToken: randomUUID(),
    status: "lobby",
    mode: input.mode,
    pacing: input.pacing,
    selfPacedWindowMinutes: input.selfPacedWindowMinutes ?? 45,
    settings: { ...defaultSettings(), ...input.settings },
    gameOrder: GAMES.map((g) => g.id),
    currentGameId: null,
    currentPlayerId: null,
    turnOrder: [],
    playedGames: [],
    players: [],
    teams: [],
    scores: [],
    createdAt: Date.now(),
  };

  await persist(session);
  return session;
}

export async function getSession(id: string): Promise<TournamentSession | null> {
  const fromD1 = await loadFromD1(`SELECT payload FROM sessions WHERE id = ?`, id);
  if (fromD1) return fromD1;
  // Only hit memory when D1 context is absent (Node scripts)
  if (await getDB()) return null;
  const mem = memoryStore().byId.get(id);
  return mem ? normalizeSession(structuredClone(mem)) : null;
}

export async function getSessionByCode(code: string): Promise<TournamentSession | null> {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const fromD1 = await loadFromD1(
    `SELECT payload FROM sessions WHERE join_code = ?`,
    normalized,
  );
  if (fromD1) return fromD1;
  if (await getDB()) return null;
  const id = memoryStore().byCode.get(normalized);
  if (!id) return null;
  const mem = memoryStore().byId.get(id);
  return mem ? normalizeSession(structuredClone(mem)) : null;
}

export function publicSession(session: TournamentSession) {
  const { hostToken: _, ...rest } = session;
  return {
    ...rest,
    players: rest.players.map(({ playerToken: _t, ...p }) => p),
  };
}

export function assertHost(session: TournamentSession, hostToken: string | null) {
  if (!hostToken || hostToken !== session.hostToken) {
    throw new Error("Unauthorized host");
  }
}

export async function joinSession(input: JoinSessionInput): Promise<{
  session: TournamentSession;
  player: Player;
}> {
  const session = await getSessionByCode(input.code);
  if (!session) throw new Error("Session not found");
  if (session.status === "finished") throw new Error("Tournament already finished");
  if (session.status === "active") {
    throw new Error(
      "Tournament already started — wait for the next session or ask the host to create a new one",
    );
  }

  const name = input.name.trim();
  if (!name) throw new Error("Name required");

  let teamId = input.teamId;

  if (input.createTeam && session.mode === "teams") {
    const team: Team = {
      id: randomUUID(),
      name: input.createTeam.name.trim() || `${name}'s Team`,
      emoji: input.createTeam.emoji || TEAM_EMOJIS[session.teams.length % TEAM_EMOJIS.length]!,
      color: TEAM_COLORS[session.teams.length % TEAM_COLORS.length]!,
    };
    session.teams.push(team);
    teamId = team.id;
  }

  if (session.mode === "teams" && !teamId && !input.asIndividual) {
    throw new Error("Pick a team or create one before joining");
  }

  if (session.mode === "individuals") {
    teamId = undefined;
  }

  const playerToken = randomUUID();
  const player: Player = {
    id: randomUUID(),
    name,
    teamId: session.mode === "teams" ? teamId : undefined,
    emoji: "🙋",
    joinedAt: Date.now(),
    completedGames: [],
    playerToken,
  };
  session.players.push(player);
  // Keep roster in sync for live boards
  if (!session.turnOrder.includes(player.id)) {
    session.turnOrder.push(player.id);
  }
  await persist(session);
  // Return token once — publicSession strips it from later polls
  return { session, player: { ...player, playerToken } };
}

export async function startSession(sessionId: string, hostToken: string): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  if (session.players.length < 1) throw new Error("Need at least one player");
  if (session.mode === "teams" && session.teams.length < 1) {
    throw new Error("Need at least one team");
  }

  session.status = "active";
  session.startedAt = Date.now();
  session.turnOrder = session.players.map((p) => p.id);
  session.playedGames = [];

  // Games in order; everyone plays the current game at the same time
  session.pacing = "host";
  session.currentGameId = session.gameOrder[0] ?? null;
  session.currentPlayerId = null;
  session.endsAt = undefined;

  await persist(session);
  return session;
}

function playersWhoScored(session: TournamentSession, gameId: GameId): Set<string> {
  return new Set(
    session.scores.filter((s) => s.gameId === gameId && s.playerId).map((s) => s.playerId!),
  );
}

function everyoneScored(session: TournamentSession, gameId: GameId): boolean {
  if (session.players.length === 0) return false;
  const scored = playersWhoScored(session, gameId);
  return session.players.every((p) => scored.has(p.id));
}

function beginGame(session: TournamentSession, gameId: GameId | null) {
  session.currentGameId = gameId;
  session.currentPlayerId = null;
}

/** Marker for host-skip forfeits — late real scores may overwrite these */
export const SKIPPED_SCORE_DETAIL = "Didn't finish";

function isForfeitScore(entry: GameScoreEntry | undefined) {
  return entry?.detail === SKIPPED_SCORE_DETAIL;
}

/** Mark unfinished players as 0 so host boards / standings stay consistent on skip */
function forfeitUnscoredPlayers(session: TournamentSession, gameId: GameId) {
  for (const player of session.players) {
    const has = session.scores.some((s) => s.playerId === player.id && s.gameId === gameId);
    if (has) continue;

    const participantId =
      session.mode === "teams" && player.teamId ? player.teamId : player.id;

    session.scores.push({
      id: randomUUID(),
      playerId: player.id,
      participantId,
      gameId,
      score: 0,
      rawScore: 0,
      detail: SKIPPED_SCORE_DETAIL,
      timestamp: Date.now(),
    });

    if (!player.completedGames) player.completedGames = [];
    if (!player.completedGames.includes(gameId)) {
      player.completedGames.push(gameId);
    }
  }
}

/** After everyone scores a game, move to the next game in order */
function advanceAfterGameComplete(session: TournamentSession, gameId: GameId) {
  if (!session.playedGames.includes(gameId)) {
    session.playedGames.push(gameId);
  }
  const idx = session.gameOrder.indexOf(gameId);
  const next = session.gameOrder[idx + 1] ?? null;
  if (!next) {
    session.currentGameId = null;
    session.currentPlayerId = null;
    maybeFinish(session);
    return;
  }
  beginGame(session, next);
}

export async function setCurrentGame(
  sessionId: string,
  hostToken: string,
  gameId: GameId | null,
): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  if (gameId) {
    const idx = session.gameOrder.indexOf(gameId);
    const currentIdx = session.currentGameId
      ? session.gameOrder.indexOf(session.currentGameId)
      : -1;
    if (idx < 0 || (currentIdx >= 0 && idx > currentIdx + 1)) {
      throw new Error("Games must be played in order");
    }
  }
  beginGame(session, gameId);
  await persist(session);
  return session;
}

export async function markGameComplete(
  sessionId: string,
  hostToken: string,
  gameId?: GameId | null,
): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  const target = gameId ?? session.currentGameId;
  if (!target) throw new Error("No active game");
  forfeitUnscoredPlayers(session, target);
  advanceAfterGameComplete(session, target);
  await persist(session);
  return session;
}

/** Host skips waiting for remaining players and advances to the next game */
export async function skipTurn(sessionId: string, hostToken: string): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  if (!session.currentGameId) throw new Error("No active game");
  const gameId = session.currentGameId;
  forfeitUnscoredPlayers(session, gameId);
  advanceAfterGameComplete(session, gameId);
  await persist(session);
  return session;
}

export async function finishSession(sessionId: string, hostToken: string): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  if (session.currentGameId) {
    forfeitUnscoredPlayers(session, session.currentGameId);
    if (!session.playedGames.includes(session.currentGameId)) {
      session.playedGames.push(session.currentGameId);
    }
  }
  session.status = "finished";
  session.finishedAt = Date.now();
  session.currentGameId = null;
  session.currentPlayerId = null;
  await persist(session);
  return session;
}

export async function submitScore(
  sessionId: string,
  playerId: string,
  gameId: GameId,
  rawScore: number,
  detail?: string,
  lowerIsBetter?: boolean,
  playerToken?: string,
): Promise<TournamentSession> {
  if (!Number.isFinite(Number(rawScore))) {
    throw new Error("Invalid score");
  }
  const raw = clampRawScore(gameId, Number(rawScore));

  // Retry + verify: concurrent D1 blob writes can overwrite each other
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error("Session not found");
      if (session.status !== "active" && session.status !== "finished") {
        throw new Error("Tournament not active");
      }

      const player = session.players.find((p) => p.id === playerId);
      if (!player) throw new Error("Player not found");
      if (player.playerToken) {
        if (!playerToken || player.playerToken !== playerToken) {
          throw new Error("Unauthorized player");
        }
      }

      const existing = session.scores.find(
        (s) => s.playerId === playerId && s.gameId === gameId,
      );

      const isLive = session.currentGameId === gameId && session.status === "active";
      const isLate =
        session.playedGames.includes(gameId) && (isForfeitScore(existing) || !existing);

      if (!isLive && !isLate) {
        if (existing && !isForfeitScore(existing)) {
          throw new Error("Score already submitted");
        }
        throw new Error(
          session.status === "finished"
            ? "Tournament already finished"
            : "This game is not active yet",
        );
      }

      // One score per player per game (overwrite while live, or overwrite forfeit after skip)
      session.scores = session.scores.filter(
        (s) => !(s.playerId === playerId && s.gameId === gameId),
      );

      const normalized = normalizeToThousand(gameId, raw, { lowerIsBetter });
      const participantId =
        session.mode === "teams" && player.teamId ? player.teamId : player.id;

      const entry: GameScoreEntry = {
        id: randomUUID(),
        playerId,
        participantId,
        gameId,
        score: normalized,
        rawScore: raw,
        lowerIsBetter,
        detail,
        timestamp: Date.now(),
      };
      session.scores.push(entry);

      if (!player.completedGames) player.completedGames = [];
      if (!player.completedGames.includes(gameId)) {
        player.completedGames.push(gameId);
      }

      await persist(session);

      // Confirm our score survived a concurrent overwrite
      const verify = await getSession(sessionId);
      const landed = verify?.scores.find(
        (s) =>
          s.playerId === playerId &&
          s.gameId === gameId &&
          !isForfeitScore(s) &&
          s.rawScore === raw,
      );
      if (landed && verify) return verify;

      lastError = new Error("Score write conflict");
      await new Promise((r) => setTimeout(r, 20 * (attempt + 1)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      if (
        msg === "Score already submitted" ||
        msg === "Unauthorized player" ||
        msg === "Player not found" ||
        msg === "Session not found" ||
        msg === "Tournament not active" ||
        msg === "Tournament already finished" ||
        msg === "This game is not active yet" ||
        msg.startsWith("Invalid")
      ) {
        throw e;
      }
      lastError = e instanceof Error ? e : new Error(msg);
      await new Promise((r) => setTimeout(r, 20 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("Failed to submit score");
}

/** Clear scores for the live game so everyone can play it again */
export async function resetCurrentGame(
  sessionId: string,
  hostToken: string,
): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  const gameId = session.currentGameId;
  if (!gameId) throw new Error("No active game");

  session.scores = session.scores.filter((s) => s.gameId !== gameId);
  for (const player of session.players) {
    if (player.completedGames) {
      player.completedGames = player.completedGames.filter((g) => g !== gameId);
    }
  }
  session.playedGames = session.playedGames.filter((g) => g !== gameId);
  session.currentPlayerId = null;
  await persist(session);
  return session;
}

export function isRoundComplete(session: TournamentSession): boolean {
  if (!session.currentGameId || session.status !== "active") return false;
  return everyoneScored(session, session.currentGameId);
}

export function peekNextGameId(session: TournamentSession): GameId | null {
  if (!session.currentGameId) {
    const remaining = session.gameOrder.find((g) => !session.playedGames.includes(g));
    return remaining ?? null;
  }
  const idx = session.gameOrder.indexOf(session.currentGameId);
  return session.gameOrder[idx + 1] ?? null;
}

export function getGameScoreboard(session: TournamentSession, gameId: GameId | null) {
  if (!gameId) return [];
  // Always use current player roster (not a stale turn snapshot)
  const order =
    session.players.length > 0
      ? session.players.map((p) => p.id)
      : session.turnOrder;
  const rows = order.map((pid, i) => {
    const player = session.players.find((p) => p.id === pid);
    const entry = session.scores.find((s) => s.playerId === pid && s.gameId === gameId);
    const done = Boolean(entry);
    return {
      playerId: pid,
      name: player?.name ?? "Unknown",
      emoji: player?.emoji ?? "🙋",
      color: TEAM_COLORS[i % TEAM_COLORS.length]!,
      score: entry?.score ?? null,
      rawScore: entry?.rawScore ?? null,
      detail: entry?.detail ?? null,
      lowerIsBetter: Boolean(entry?.lowerIsBetter),
      /** Still needs to submit for this simultaneous round */
      isTurn: !done && session.currentGameId === gameId,
      done,
    };
  });

  return [...rows].sort((a, b) => {
    if (a.done && b.done) return (b.score ?? 0) - (a.score ?? 0);
    if (a.done !== b.done) return a.done ? -1 : 1;
    return 0;
  });
}

export type GameResultSummary = {
  gameId: GameId;
  title: string;
  isCurrent: boolean;
  isComplete: boolean;
  rankings: ReturnType<typeof getGameScoreboard>;
  top: ReturnType<typeof getGameScoreboard>;
};

export function getGameResultsSummaries(session: TournamentSession): GameResultSummary[] {
  return session.gameOrder
    .filter(
      (gid) =>
        session.playedGames.includes(gid) ||
        session.currentGameId === gid ||
        session.scores.some((s) => s.gameId === gid),
    )
    .map((gameId) => {
      const rankings = getGameScoreboard(session, gameId);
      const scored = rankings.filter((r) => r.done);
      return {
        gameId,
        title: GAME_MAP[gameId]?.title ?? gameId,
        isCurrent: session.currentGameId === gameId,
        isComplete: session.playedGames.includes(gameId),
        rankings,
        top: scored.slice(0, 3),
      };
    });
}

export async function addTeam(
  sessionId: string,
  hostToken: string | null,
  name: string,
  emoji: string,
): Promise<Team> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  if (hostToken) assertHost(session, hostToken);
  if (session.mode !== "teams") throw new Error("Not team mode");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Team name required");

  const team: Team = {
    id: randomUUID(),
    name: trimmed,
    emoji,
    color: TEAM_COLORS[session.teams.length % TEAM_COLORS.length]!,
  };
  session.teams.push(team);
  await persist(session);
  return team;
}

export async function assignPlayerTeam(
  sessionId: string,
  playerId: string,
  teamId: string | undefined,
): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  const player = session.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  player.teamId = teamId;
  await persist(session);
  return session;
}

function maybeFinish(session: TournamentSession) {
  if (session.status === "finished") return;
  if (session.playedGames.length >= session.gameOrder.length) {
    session.status = "finished";
    session.finishedAt = Date.now();
    session.currentGameId = null;
    session.currentPlayerId = null;
  }
}

async function persist(session: TournamentSession) {
  const mem = memoryStore();
  mem.byId.set(session.id, session);
  mem.byCode.set(session.joinCode, session.id);

  const db = await getDB();
  if (!db) {
    if (process.env.VERCEL) {
      throw new Error(
        "Cloudflare D1 is required on Vercel. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and CLOUDFLARE_D1_DATABASE_ID.",
      );
    }
    // Plain Node scripts without bindings — memory only
    return;
  }

  try {
    await db
      .prepare(
        `INSERT INTO sessions (id, join_code, host_token, payload, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           join_code = excluded.join_code,
           host_token = excluded.host_token,
           payload = excluded.payload,
           updated_at = datetime('now')`,
      )
      .bind(session.id, session.joinCode, session.hostToken, JSON.stringify(session))
      .run();
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    throw new Error(
      `Failed to save session to D1 (${detail}). Run \`npm run cf:migrate:local\` (dev) or \`npm run cf:migrate\` (remote).`,
    );
  }
}

export function getParticipants(session: TournamentSession): PlayerOrTeam[] {
  if (session.mode === "teams") {
    const teams = session.teams.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      emoji: t.emoji,
      kind: "team" as const,
      memberIds: session.players.filter((p) => p.teamId === t.id).map((p) => p.id),
    }));
    const solos = session.players
      .filter((p) => !p.teamId)
      .map((p, i) => ({
        id: p.id,
        name: p.name,
        color: TEAM_COLORS[i % TEAM_COLORS.length]!,
        emoji: p.emoji ?? "🙋",
        kind: "player" as const,
      }));
    return [...teams, ...solos];
  }
  return session.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    color: TEAM_COLORS[i % TEAM_COLORS.length]!,
    emoji: p.emoji ?? "🙋",
    kind: "player" as const,
  }));
}

export function getLeaderboard(session: TournamentSession) {
  const participants = getParticipants(session);
  return participants
    .map((participant) => {
      const entries = session.scores.filter((s) => s.participantId === participant.id);
      // Teams: sum unique game bests from members already stored as team participantId
      // For team mode with per-player scores rolled to team id — take max per game then sum
      const byGame = new Map<GameId, number>();
      for (const e of entries) {
        const prev = byGame.get(e.gameId) ?? 0;
        byGame.set(e.gameId, Math.max(prev, e.score));
      }
      const total = [...byGame.values()].reduce((a, b) => a + b, 0);

      let topPlayer:
        | { id: string; name: string; emoji: string; total: number }
        | undefined;
      if (participant.kind === "team" && participant.memberIds?.length) {
        const ranked = participant.memberIds
          .map((memberId) => {
            const player = session.players.find((p) => p.id === memberId);
            if (!player) return null;
            const memberTotal = session.scores
              .filter((s) => s.playerId === memberId)
              .reduce((sum, s) => sum + s.score, 0);
            return {
              id: player.id,
              name: player.name,
              emoji: player.emoji ?? "🙋",
              total: memberTotal,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row != null)
          .sort((a, b) => b.total - a.total);
        topPlayer = ranked[0];
      }

      return {
        participant,
        total,
        byGame: Object.fromEntries(byGame) as Record<string, number>,
        topPlayer,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function computeMvps(session: TournamentSession): MvpAward[] {
  const awards: MvpAward[] = [];
  const players = session.players;

  const bestFor = (
    gameId: GameId,
    preferHigh: boolean,
  ): { player: Player; entry: GameScoreEntry } | null => {
    const entries = session.scores.filter((s) => s.gameId === gameId);
    if (!entries.length) return null;
    const sorted = [...entries].sort((a, b) => {
      const ar = a.rawScore ?? a.score;
      const br = b.rawScore ?? b.score;
      return preferHigh ? br - ar : ar - br;
    });
    const top = sorted[0]!;
    const player = players.find((p) => p.id === top.playerId);
    if (!player) return null;
    return { player, entry: top };
  };

  const reflex = bestFor("reaction", false);
  if (reflex) {
    awards.push({
      id: "fastest-reflexes",
      title: "Fastest Reflexes",
      description: "Lowest reaction time",
      playerId: reflex.player.id,
      playerName: reflex.player.name,
      emoji: reflex.player.emoji ?? "⚡",
      valueLabel: `${reflex.entry.rawScore ?? reflex.entry.score}ms`,
    });
  }

  const simon = bestFor("simon", true);
  const memory = bestFor("memory", true);
  const memWinner = [simon, memory].filter(Boolean).sort((a, b) => {
    const as = a!.entry.score;
    const bs = b!.entry.score;
    return bs - as;
  })[0];
  if (memWinner) {
    awards.push({
      id: "sharpest-memory",
      title: "Sharpest Memory",
      description: "Best memory-game performance",
      playerId: memWinner.player.id,
      playerName: memWinner.player.name,
      emoji: memWinner.player.emoji ?? "🧠",
      valueLabel: `${memWinner.entry.score} pts`,
    });
  }

  const trivia = bestFor("trivia", true);
  if (trivia) {
    awards.push({
      id: "trivia-titan",
      title: "Quiz Champ",
      description: "Top rapid-fire quiz score",
      playerId: trivia.player.id,
      playerName: trivia.player.name,
      emoji: trivia.player.emoji ?? "❓",
      valueLabel: `${trivia.entry.score} pts`,
    });
  }

  const typing = bestFor("typing", true);
  if (typing) {
    awards.push({
      id: "keyboard-warrior",
      title: "Keyboard Warrior",
      description: "Fastest accurate typer",
      playerId: typing.player.id,
      playerName: typing.player.name,
      emoji: typing.player.emoji ?? "⌨️",
      valueLabel: typing.entry.detail ?? `${typing.entry.score} pts`,
    });
  }

  // Overall MVP = highest individual sum
  const totals = players.map((p) => {
    const total = session.scores
      .filter((s) => s.playerId === p.id)
      .reduce((sum, s) => {
        // one score per game already
        return sum + s.score;
      }, 0);
    return { player: p, total };
  });
  totals.sort((a, b) => b.total - a.total);
  const overall = totals[0];
  if (overall && overall.total > 0) {
    awards.unshift({
      id: "overall-mvp",
      title: "Tournament MVP",
      description: "Highest individual point total",
      playerId: overall.player.id,
      playerName: overall.player.name,
      emoji: overall.player.emoji ?? "🏆",
      valueLabel: `${overall.total} pts`,
    });
  }

  return awards;
}

export async function shuffleGames(
  sessionId: string,
  hostToken: string,
): Promise<TournamentSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertHost(session, hostToken);
  if (session.status !== "lobby") {
    throw new Error("Can only shuffle before the tournament starts");
  }
  const order = [...session.gameOrder];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  session.gameOrder = order;
  await persist(session);
  return session;
}
