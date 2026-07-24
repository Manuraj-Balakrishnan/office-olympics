import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
const uuid = () => uuidv4();
import { GAMES, TEAM_COLORS, TEAM_EMOJIS, migrateGameId, sanitizeGameIds } from "@/data/games";
import type {
  GameId,
  GameScoreEntry,
  Player,
  PlayerOrTeam,
  Team,
  TeamPlayMode,
  ThemeMode,
  TournamentMode,
  TournamentSettings,
} from "@/types/tournament";

interface TournamentState {
  hydrated: boolean;
  mode: TournamentMode | null;
  players: Player[];
  teams: Team[];
  settings: TournamentSettings;
  gameOrder: GameId[];
  playedGames: GameId[];
  currentGameIndex: number;
  scores: GameScoreEntry[];
  muted: boolean;
  theme: ThemeMode;
  tournamentStarted: boolean;
  tournamentFinished: boolean;
  lastGameScores: GameScoreEntry[];

  setHydrated: (v: boolean) => void;
  setMode: (mode: TournamentMode) => void;
  setMuted: (muted: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  updateSettings: (partial: Partial<TournamentSettings>) => void;

  addPlayer: (name: string, teamId?: string) => void;
  removePlayer: (id: string) => void;
  reorderPlayers: (from: number, to: number) => void;
  assignPlayerTeam: (playerId: string, teamId: string | undefined) => void;

  addTeam: (name: string, emoji: string) => void;
  removeTeam: (id: string) => void;
  updateTeam: (id: string, patch: Partial<Pick<Team, "name" | "emoji" | "color">>) => void;

  beginTournament: () => void;
  shuffleGames: () => void;
  markGamePlayed: (gameId: GameId) => void;
  setCurrentGameIndex: (i: number) => void;
  addScores: (entries: Omit<GameScoreEntry, "timestamp">[]) => void;
  getParticipants: () => PlayerOrTeam[];
  getLeaderboard: () => { participant: PlayerOrTeam; total: number; lastDelta: number }[];
  resetTournament: () => void;
  playAgain: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const defaultSettings: TournamentSettings = {
  teamPlayMode: "one-rep",
  assistMode: false,
  huddleEnabled: true,
};

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      mode: null,
      players: [],
      teams: [],
      settings: defaultSettings,
      gameOrder: GAMES.map((g) => g.id),
      playedGames: [],
      currentGameIndex: 0,
      scores: [],
      muted: false,
      theme: "dark",
      tournamentStarted: false,
      tournamentFinished: false,
      lastGameScores: [],

      setHydrated: (v) => set({ hydrated: v }),
      setMode: (mode) => set({ mode }),
      setMuted: (muted) => set({ muted }),
      setTheme: (theme) => set({ theme }),
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      addPlayer: (name, teamId) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          players: [
            ...s.players,
            { id: uuid(), name: trimmed, teamId, emoji: "🙋" },
          ],
        }));
      },

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      reorderPlayers: (from, to) =>
        set((s) => {
          const players = [...s.players];
          const [item] = players.splice(from, 1);
          players.splice(to, 0, item);
          return { players };
        }),

      assignPlayerTeam: (playerId, teamId) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === playerId ? { ...p, teamId } : p,
          ),
        })),

      addTeam: (name, emoji) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          const color = TEAM_COLORS[s.teams.length % TEAM_COLORS.length];
          return {
            teams: [
              ...s.teams,
              {
                id: uuid(),
                name: trimmed,
                color,
                emoji: emoji || TEAM_EMOJIS[s.teams.length % TEAM_EMOJIS.length],
              },
            ],
          };
        });
      },

      removeTeam: (id) =>
        set((s) => ({
          teams: s.teams.filter((t) => t.id !== id),
          players: s.players.map((p) =>
            p.teamId === id ? { ...p, teamId: undefined } : p,
          ),
        })),

      updateTeam: (id, patch) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      beginTournament: () =>
        set({
          tournamentStarted: true,
          tournamentFinished: false,
          playedGames: [],
          currentGameIndex: 0,
          scores: [],
          lastGameScores: [],
        }),

      shuffleGames: () => set({ gameOrder: shuffle(get().gameOrder) }),

      markGamePlayed: (gameId) =>
        set((s) => {
          const playedGames = s.playedGames.includes(gameId)
            ? s.playedGames
            : [...s.playedGames, gameId];
          const allDone = playedGames.length >= s.gameOrder.length;
          return {
            playedGames,
            currentGameIndex: Math.min(
              playedGames.length,
              s.gameOrder.length - 1,
            ),
            tournamentFinished: allDone,
          };
        }),

      setCurrentGameIndex: (i) => set({ currentGameIndex: i }),

      addScores: (entries) => {
        const stamped = entries.map((e) => ({
          ...e,
          timestamp: Date.now(),
        }));
        set((s) => ({
          scores: [...s.scores, ...stamped],
          lastGameScores: stamped,
        }));
      },

      getParticipants: () => {
        const { mode, players, teams } = get();
        if (mode === "teams") {
          return teams.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            emoji: t.emoji,
            kind: "team" as const,
            memberIds: players.filter((p) => p.teamId === t.id).map((p) => p.id),
          }));
        }
        return players.map((p, i) => ({
          id: p.id,
          name: p.name,
          color: TEAM_COLORS[i % TEAM_COLORS.length],
          emoji: p.emoji ?? "🙋",
          kind: "player" as const,
        }));
      },

      getLeaderboard: () => {
        const participants = get().getParticipants();
        const { scores, lastGameScores, players } = get();
        return participants
          .map((participant) => {
            const total = scores
              .filter((s) => s.participantId === participant.id)
              .reduce((sum, s) => sum + s.score, 0);
            const lastDelta = lastGameScores
              .filter((s) => s.participantId === participant.id)
              .reduce((sum, s) => sum + s.score, 0);

            let topPlayer:
              | { id: string; name: string; emoji: string; total: number }
              | undefined;
            if (participant.kind === "team" && participant.memberIds?.length) {
              const ranked = participant.memberIds
                .map((memberId) => {
                  const player = players.find((p) => p.id === memberId);
                  if (!player) return null;
                  const memberTotal = scores
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

            return { participant, total, lastDelta, topPlayer };
          })
          .sort((a, b) => b.total - a.total);
      },

      resetTournament: () =>
        set({
          mode: null,
          players: [],
          teams: [],
          settings: defaultSettings,
          gameOrder: GAMES.map((g) => g.id),
          playedGames: [],
          currentGameIndex: 0,
          scores: [],
          lastGameScores: [],
          tournamentStarted: false,
          tournamentFinished: false,
        }),

      playAgain: () =>
        set({
          playedGames: [],
          currentGameIndex: 0,
          scores: [],
          lastGameScores: [],
          tournamentStarted: true,
          tournamentFinished: false,
          gameOrder: GAMES.map((g) => g.id),
        }),
    }),
    {
      name: "office-olympics-tournament",
      partialize: (s) => ({
        mode: s.mode,
        players: s.players,
        teams: s.teams,
        settings: s.settings,
        gameOrder: s.gameOrder,
        playedGames: s.playedGames,
        currentGameIndex: s.currentGameIndex,
        scores: s.scores,
        muted: s.muted,
        theme: s.theme,
        tournamentStarted: s.tournamentStarted,
        tournamentFinished: s.tournamentFinished,
        lastGameScores: s.lastGameScores,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.gameOrder = sanitizeGameIds(state.gameOrder as string[]);
          state.playedGames = sanitizeGameIds(state.playedGames as string[]);
          state.scores = state.scores
            .map((s) => {
              const gameId = migrateGameId(s.gameId);
              return gameId ? { ...s, gameId } : null;
            })
            .filter((s): s is NonNullable<typeof s> => s != null);
          state.lastGameScores = state.lastGameScores
            .map((s) => {
              const gameId = migrateGameId(s.gameId);
              return gameId ? { ...s, gameId } : null;
            })
            .filter((s): s is NonNullable<typeof s> => s != null);
          if (state.currentGameIndex >= state.gameOrder.length) {
            state.currentGameIndex = Math.max(0, state.gameOrder.length - 1);
          }
        }
        state?.setHydrated(true);
      },
    },
  ),
);
