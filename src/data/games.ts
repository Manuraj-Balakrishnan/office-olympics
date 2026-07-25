import type { GameDefinition, GameId } from "@/types/tournament";

export const GAMES: GameDefinition[] = [
  {
    id: "reaction",
    title: "Reaction Time",
    description: "Three rounds — wait for green, tap fast. Best average wins.",
    howToPlay: [
      "3 rounds — your score is the average reaction time.",
      "Wait on red. Do not tap yet.",
      "When it flips green, tap as fast as you can.",
      "Tap too early = false start (that round resets).",
      "Lower average ms = more points.",
    ],
    icon: "Zap",
    difficulty: "Easy",
    durationSec: 90,
    category: "reflex",
    route: "/game/reaction",
  },
  {
    id: "simon",
    title: "Simon Pattern",
    description: "Repeat the growing color sequence before you slip.",
    howToPlay: [
      "Watch the pads light up — then tap the same order back.",
      "Each clear adds one more step to the chain.",
      "Playback speeds up as you climb.",
      "One wrong pad ends the run. Score = longest chain.",
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
    description: "Flip office photo pairs — streak combos and clear bonuses win.",
    howToPlay: [
      "Tap two cards to flip them.",
      "Match identical office photo pairs.",
      "Chain matches for combo bonus points.",
      "Clear the board fast for a speed bonus.",
      "Fewer moves and faster clears = higher score.",
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
    description: "Three original illustrator puzzles — Easy country ride, Medium pirate ships, Hard kitchen cartoon.",
    howToPlay: [
      "Play three stages in order: Easy → Medium → Hard.",
      "Compare the left (original) and right pictures.",
      "Tap every difference on the right image.",
      "Each stage gives you 2 hints — a pulse marks the area (you still tap to score).",
      "Hints cost a few points. Faster full clears earn a speed bonus.",
    ],
    icon: "Search",
    difficulty: "Hard",
    durationSec: 240,
    category: "memory",
    route: "/game/spot-difference",
  },
  {
    id: "one-second",
    title: "Seconds Challenge",
    description: "Three real office photos flash for 3 seconds — then prove what you saw.",
    howToPlay: [
      "3 office photos — each flashes for 3 seconds.",
      "Memorize details: colors, objects, and people.",
      "Then answer 5 questions about what you saw.",
      "Faster correct answers earn a speed bonus.",
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
    description: "Tap the ink color — ignore the word. 90 seconds of rapid-fire chaos.",
    howToPlay: [
      "A color word appears (like RED).",
      "Ignore the word — tap the ink color instead.",
      "Example: BLUE written in green → tap GREEN.",
      "90 seconds — build a streak of correct taps.",
      "Buttons shuffle each round. Wrong tap breaks your streak.",
    ],
    icon: "Palette",
    difficulty: "Medium",
    durationSec: 90,
    category: "reflex",
    route: "/game/stroop",
  },
  {
    id: "typing",
    title: "Typing Speed Race",
    description: "Type the office-humor paragraph. WPM × accuracy.",
    howToPlay: [
      "Type the paragraph exactly as shown.",
      "Green = correct letter; red = typo.",
      "Finish the whole paragraph to lock your score.",
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
    description: "Assemble the jigsaw fast — quicker clears earn more points.",
    howToPlay: [
      "Pieces start scattered in the tray below.",
      "Drag each piece onto the board.",
      "Drop near the right spot — it snaps when it fits.",
      "Faster finishes score more. Slow solves score less.",
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
      "A clue sits under the letters.",
      "Type your answer and hit Check / Enter.",
      "Hint once per word to reveal the first letter.",
      "Pass skips to the next word if you are stuck.",
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
    description: "15 questions, 10 seconds each, speed bonuses like Kahoot.",
    howToPlay: [
      "15 questions — 10 seconds each.",
      "Tap before the ring runs out. Green = correct, red = wrong.",
      "Hint once per question removes 1 wrong answer (smaller bonus).",
      "Faster correct answers earn bigger bonuses.",
      "Wrong or timeout = no points for that question.",
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

/** Drop unknown ids and remap legacy ones; keep order stable and unique.
 *  Empty input stays empty (played / completed lists must not inflate). */
export function sanitizeGameIds(ids: string[]): GameId[] {
  const out: GameId[] = [];
  const seen = new Set<GameId>();
  for (const id of ids) {
    const next = migrateGameId(id);
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

/** Sanitize the tournament lineup. Empty/corrupt → full default roster. */
export function sanitizeGameOrder(ids: string[]): GameId[] {
  const out = sanitizeGameIds(ids);
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
