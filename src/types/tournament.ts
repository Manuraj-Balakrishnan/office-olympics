export type TournamentMode = "individuals" | "teams";
export type TeamPlayMode = "everyone" | "one-rep";
export type ThemeMode = "dark" | "light";
export type PacingMode = "host" | "self";
export type SessionStatus = "lobby" | "active" | "finished";

export type GameId =
  | "reaction"
  | "simon"
  | "memory"
  | "spot-difference"
  | "one-second"
  | "stroop"
  | "typing"
  | "speed-puzzle"
  | "word-scramble"
  | "trivia";

export interface Player {
  id: string;
  name: string;
  teamId?: string;
  emoji?: string;
  joinedAt?: number;
  /** Secret token returned only at join — required to submit scores */
  playerToken?: string;
  /** Games this player has completed (self-paced tracking) */
  completedGames?: GameId[];
}

export interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface PlayerOrTeam {
  id: string;
  name: string;
  color: string;
  emoji: string;
  kind: "player" | "team";
  memberIds?: string[];
}

export interface GameScoreEntry {
  id?: string;
  playerId?: string;
  participantId: string;
  gameId: GameId;
  /** Normalized 0–1000 contribution to leaderboard */
  score: number;
  rawScore?: number;
  lowerIsBetter?: boolean;
  detail?: string;
  timestamp: number;
}

export interface GameDefinition {
  id: GameId;
  title: string;
  description: string;
  /** Short steps shown for 10s before the game starts */
  howToPlay: string[];
  icon: string;
  difficulty: "Easy" | "Medium" | "Hard";
  durationSec: number;
  category: "reflex" | "memory" | "knowledge" | "typing";
  route: string;
}

export interface TournamentSettings {
  teamPlayMode: TeamPlayMode;
  assistMode: boolean;
  huddleEnabled: boolean;
}

export interface TournamentSession {
  id: string;
  joinCode: string;
  hostToken: string;
  status: SessionStatus;
  mode: TournamentMode;
  pacing: PacingMode;
  /** Minutes allowed after start for self-paced mode */
  selfPacedWindowMinutes: number;
  settings: TournamentSettings;
  gameOrder: GameId[];
  /** Current game in sequence — all players play this together */
  currentGameId: GameId | null;
  /** @deprecated unused in simultaneous play; kept for payload compatibility */
  currentPlayerId: string | null;
  /** Player ids (roster order for scoreboards) */
  turnOrder: string[];
  playedGames: GameId[];
  players: Player[];
  teams: Team[];
  scores: GameScoreEntry[];
  createdAt: number;
  startedAt?: number;
  endsAt?: number;
  finishedAt?: number;
}

export interface MvpAward {
  id: string;
  title: string;
  description: string;
  playerId: string;
  playerName: string;
  emoji: string;
  valueLabel: string;
}

export interface CreateSessionInput {
  mode: TournamentMode;
  pacing: PacingMode;
  selfPacedWindowMinutes?: number;
  settings?: Partial<TournamentSettings>;
  hostName?: string;
}

export interface JoinSessionInput {
  code: string;
  name: string;
  teamId?: string;
  /** Player avatar id (individuals) or legacy emoji */
  emoji?: string;
  createTeam?: { name: string; emoji: string };
  asIndividual?: boolean;
}
