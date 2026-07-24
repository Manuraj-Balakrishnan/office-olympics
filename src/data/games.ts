import type { GameDefinition, GameId } from "@/types/tournament";

export const GAMES: GameDefinition[] = [
  {
    id: "reaction",
    title: "Reaction Time",
    description: "Wait for green, then tap as fast as you can.",
    howToPlay: [
      "The screen starts red — do not tap yet.",
      "When it turns green, tap as fast as you can.",
      "Tapping too early is a false start (big penalty).",
      "Faster time = more points.",
    ],
    icon: "Zap",
    difficulty: "Easy",
    durationSec: 60,
    category: "reflex",
    route: "/game/reaction",
  },
  {
    id: "simon",
    title: "Simon Pattern",
    description: "Repeat the growing color sequence before you slip.",
    howToPlay: [
      "Watch the pads light up in order.",
      "Tap the same sequence back from memory.",
      "Each round adds one more step.",
      "Your score is the longest sequence you finish.",
    ],
    icon: "Music",
    difficulty: "Medium",
    durationSec: 120,
    category: "memory",
    route: "/game/simon",
  },
  {
    id: "memory",
    title: "Memory Match",
    description: "Flip office emoji pairs — streak combos and clear bonuses win.",
    howToPlay: [
      "Tap two cards to flip them.",
      "Match identical office emoji pairs.",
      "Chain matches for combo bonus points.",
      "Clear the board fast for a speed bonus.",
      "Fewer moves = higher score.",
    ],
    icon: "LayoutGrid",
    difficulty: "Easy",
    durationSec: 90,
    category: "memory",
    route: "/game/memory",
  },
  {
    id: "spot-difference",
    title: "Spot the Difference",
    description: "Find all 15 hidden differences in a classic cartoon illustration.",
    howToPlay: [
      "Compare the two cartoon pictures.",
      "Tap every difference on the right image.",
      "There are 15 differences — find them all.",
      "Clear all 15 faster for a bigger speed bonus.",
    ],
    icon: "Search",
    difficulty: "Medium",
    durationSec: 120,
    category: "memory",
    route: "/game/spot-difference",
  },
  {
    id: "one-second",
    title: "Seconds Challenge",
    description: "Memorize a busy photo in 1.5 seconds, then answer.",
    howToPlay: [
      "A photo flashes for 1.5 seconds — memorize it.",
      "Then answer questions about what you saw.",
      "Faster correct answers earn more points.",
      "Wrong answers score zero for that question.",
    ],
    icon: "Eye",
    difficulty: "Hard",
    durationSec: 120,
    category: "memory",
    route: "/game/one-second",
  },
  {
    id: "stroop",
    title: "Stroop Challenge",
    description: "Tap the ink color — ignore the word. Rapid-fire chaos.",
    howToPlay: [
      "You will see a color word (like RED).",
      "Ignore the word — tap the ink color instead.",
      "Example: BLUE written in green → tap GREEN.",
      "15 rapid rounds — stay sharp.",
    ],
    icon: "Palette",
    difficulty: "Medium",
    durationSec: 30,
    category: "reflex",
    route: "/game/stroop",
  },
  {
    id: "typing",
    title: "Typing Speed Race",
    description: "Type the office-humor paragraph. WPM × accuracy.",
    howToPlay: [
      "Type the paragraph exactly as shown.",
      "Green letters are correct; red means a typo.",
      "Finish before time runs out.",
      "Score = WPM × accuracy.",
    ],
    icon: "Keyboard",
    difficulty: "Medium",
    durationSec: 90,
    category: "typing",
    route: "/game/typing",
  },
  {
    id: "speed-puzzle",
    title: "Speed Puzzle",
    description: "Assemble the jigsaw as fast as you can. Fastest player wins.",
    howToPlay: [
      "Pieces start scattered in the tray below.",
      "Drag each piece onto the wooden board.",
      "Drop near the right spot — it snaps in when it fits.",
      "Finish the jigsaw as fast as you can.",
    ],
    icon: "Puzzle",
    difficulty: "Medium",
    durationSec: 90,
    category: "memory",
    route: "/game/speed-puzzle",
  },
  {
    id: "word-scramble",
    title: "Word Scramble Sprint",
    description: "Unscramble office words as fast as you can.",
    howToPlay: [
      "Letters are jumbled — unscramble the word.",
      "Type your answer and hit Check / Enter.",
      "Need help? Use Hint once per word to reveal the first letter.",
      "Still stuck? Hit Pass to skip to the next word.",
      "Solve as many as you can in 60 seconds.",
    ],
    icon: "Shuffle",
    difficulty: "Easy",
    durationSec: 60,
    category: "typing",
    route: "/game/word-scramble",
  },
  {
    id: "trivia",
    title: "Rapid-Fire Quiz",
    description: "15 questions, 8 seconds each, speed bonuses like Kahoot.",
    howToPlay: [
      "15 questions — 8 seconds each.",
      "Tap an answer before the ring runs out.",
      "Need help? Use Hint once per question to remove 2 wrong answers (smaller speed bonus).",
      "Faster correct answers earn bigger bonuses.",
      "Wrong or timeout = no points for that Q.",
    ],
    icon: "HelpCircle",
    difficulty: "Medium",
    durationSec: 120,
    category: "knowledge",
    route: "/game/trivia",
  },
];

export const GAME_MAP = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
) as Record<GameId, GameDefinition>;

/** Legacy ids remapped after game roster changes (e.g. emoji-decode → speed-puzzle). */
const LEGACY_GAME_IDS: Record<string, GameId> = {
  "emoji-decode": "speed-puzzle",
};

export function migrateGameId(id: string): GameId | null {
  if (id in GAME_MAP) return id as GameId;
  return LEGACY_GAME_IDS[id] ?? null;
}

export function resolveGame(id: string | null | undefined): GameDefinition | null {
  if (!id) return null;
  const migrated = migrateGameId(id);
  return migrated ? GAME_MAP[migrated] : null;
}

/** Drop unknown ids and remap legacy ones; keep order stable and unique. */
export function sanitizeGameIds(ids: string[]): GameId[] {
  const out: GameId[] = [];
  const seen = new Set<GameId>();
  for (const id of ids) {
    const next = migrateGameId(id);
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out.length > 0 ? out : GAMES.map((g) => g.id);
}

export const CATEGORY_COLORS: Record<GameDefinition["category"], string> = {
  reflex: "from-teal-600 to-cyan-500",
  memory: "from-slate-600 to-slate-400",
  knowledge: "from-emerald-700 to-teal-500",
  typing: "from-sky-700 to-teal-500",
};

export const TEAM_COLORS = [
  "#0F766E",
  "#334155",
  "#0369A1",
  "#BE123C",
  "#A16207",
  "#7C3AED",
  "#0E7490",
  "#C2410C",
];

export const TEAM_EMOJIS = ["🦁", "🐯", "🦅", "🐉", "🐺", "🦊", "🐻", "🦈"];
