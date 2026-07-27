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
      "Each clear adds one more step — up to 10.",
      "Playback speeds up as you climb.",
      "One wrong pad ends the run. Clear all 10 for a perfect score.",
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
      "You have 60 seconds to clear the board.",
      "Chain matches for combo bonus points.",
      "Clear fast for a speed bonus — fewer moves score higher.",
    ],
    icon: "LayoutGrid",
    difficulty: "Easy",
    durationSec: 60,
    category: "memory",
    route: "/game/memory",
  },
  {
    id: "spot-difference",
    title: "Spot the Difference",
    description: "Three original illustrator puzzles — Easy country ride, Medium pirate ships, Hard kitchen cartoon.",
    howToPlay: [
      "Play three stages in order: Easy (1 min) → Medium (2 min) → Hard (3 min).",
      "Compare the left (original) and right pictures.",
      "Tap every difference on the right image.",
      "Each stage gives you 2 hints — a pulse marks the area (you still tap to score).",
      "Hints cost 25 pts each. Full clear faster than the 6 min budget earns a speed bonus.",
    ],
    icon: "Search",
    difficulty: "Hard",
    durationSec: 360,
    category: "memory",
    route: "/game/spot-difference",
  },
  {
    id: "one-second",
    title: "Seconds Challenge",
    description: "Two real office photos flash for 5 seconds — then prove what you saw.",
    howToPlay: [
      "2 office photos — each flashes for 5 seconds.",
      "Memorize details: colors, objects, and people.",
      "Then answer 5 questions about each scene.",
      "Each correct answer = 100 points. Perfect run = 1000.",
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
    description: "Tap the ink color — ignore the word. 10 points correct, −5 wrong.",
    howToPlay: [
      "A color word appears (like RED).",
      "Ignore the word — tap the ink color instead.",
      "Example: BLUE written in green → tap GREEN.",
      "90 seconds — each correct tap = 10 points.",
      "Wrong taps cost 5 points and break your streak.",
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
      "Score = WPM × accuracy × 14 (~71 WPM @ 100% = perfect).",
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
    description: "Clear a 9-piece jigsaw, then a tougher 16-piece — speed wins.",
    howToPlay: [
      "Level 1: 3×3 logo — 1 minute. Level 2: 4×4 scene — 3 minutes.",
      "Pieces start scattered in the tray below.",
      "Use the Goal preview to match the real picture.",
      "Drag each piece onto any empty slot — wrong fits can be moved again.",
      "Faster clears score more (up to 400 + 600 = 1000 pts).",
    ],
    icon: "Puzzle",
    difficulty: "Medium",
    durationSec: 240,
    category: "memory",
    route: "/game/speed-puzzle",
  },
  {
    id: "logo-remix",
    title: "Logo Remix",
    description: "Famous logos — guess the brand before time runs out.",
    howToPlay: [
      "Each round shows a famous logo.",
      "Pick the brand from four options before the 10s ring empties.",
      "Correct = 100 pts. 10 logos. Perfect run = 1000.",
    ],
    icon: "ScanSearch",
    difficulty: "Medium",
    durationSec: 100,
    category: "knowledge",
    route: "/game/logo-remix",
  },
  {
    id: "trivia",
    title: "Rapid-Fire Quiz",
    description: "10 questions, 10 seconds each — 100 points per correct answer.",
    howToPlay: [
      "10 questions — 10 seconds each.",
      "Tap before the ring runs out. Green = correct, red = wrong.",
      "Hint once per question removes 1 wrong answer (−25 pts if you get it right).",
      "Each correct answer = 100 points (75 with a hint). Perfect run = 1000.",
      "Wrong or timeout = no points for that question.",
    ],
    icon: "HelpCircle",
    difficulty: "Medium",
    durationSec: 100,
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
  "word-scramble": "logo-remix",
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

/** Sanitize the tournament lineup. Empty/corrupt → full default roster.
 *  Also appends any newly added games missing from a saved order. */
export function sanitizeGameOrder(ids: string[]): GameId[] {
  const out = sanitizeGameIds(ids);
  if (out.length === 0) return GAMES.map((g) => g.id);
  const seen = new Set(out);
  for (const g of GAMES) {
    if (!seen.has(g.id)) {
      seen.add(g.id);
      out.push(g.id);
    }
  }
  return out;
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
