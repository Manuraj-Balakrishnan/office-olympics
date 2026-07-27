import type { GameId } from "@/types/tournament";

/**
 * Cap client-reported raw scores before normalizing (anti-cheat / sanity).
 */
export function clampRawScore(gameId: GameId, rawScore: number): number {
  const n = Number(rawScore);
  if (!Number.isFinite(n)) return 0;

  switch (gameId) {
    case "reaction":
      return Math.max(1, Math.min(5000, Math.round(n)));
    case "simon":
      // Game caps at 10 steps
      return Math.max(0, Math.min(10, Math.round(n)));
    case "memory":
      return Math.max(0, Math.min(1200, Math.round(n)));
    case "spot-difference":
      // Finds ≤800 + speed ≤300 − hints; max 1100
      return Math.max(0, Math.min(1100, Math.round(n)));
    case "one-second":
      // 2 scenes × 5 questions × 100 pts → max 1000
      return Math.max(0, Math.min(1000, Math.round(n)));
    case "stroop":
      // 10 pts per correct − 5 per miss; ~100 net → 1000
      return Math.max(0, Math.min(1000, Math.round(n)));
    case "typing":
      // WPM×accuracy×12; WPM capped at 150 → raw ≤1800
      return Math.max(0, Math.min(1800, Math.round(n)));
    case "speed-puzzle":
      // Points 0–1000 (L1 ≤400 + L2 ≤600; faster clears → higher)
      return Math.max(0, Math.min(1000, Math.round(n)));
    case "logo-remix":
      // 10 logos × 100 pts → max 1000
      return Math.max(0, Math.min(1000, Math.round(n)));
    case "trivia":
      // 10 questions × 100 pts → max 1000
      return Math.max(0, Math.min(1000, Math.round(n)));
    default:
      return Math.max(0, Math.round(n));
  }
}

/**
 * Map each game's raw performance to a fair 0–1000 contribution.
 *
 * Raw units:
 * - reaction: average ms over 3 rounds (lower better)
 * - simon: longest completed sequence length (max 10)
 * - memory: matches*100 + move efficiency + combo + clear/speed bonus
 * - spot-difference: (found/total)*800 + speed≤300 − 25×hints (1100 max)
 * - one-second: 100 pts per correct × 10 (2 scenes × 5; max 1000)
 * - stroop: 10 pts per correct − 5 per miss (elite ~100 → 1000)
 * - typing: round(wpm * accuracy/100 * 12), wpm capped at 150
 * - speed-puzzle: points 0–1000 (L1≤400 + L2≤600; faster clears → higher)
 * - logo-remix: 100 pts per correct brand × 10 (max 1000)
 * - trivia: 100 pts per correct × 10 (max 1000)
 */
export function normalizeToThousand(
  gameId: GameId,
  rawScore: number,
  _opts?: { lowerIsBetter?: boolean },
): number {
  const clamp = (n: number) => Math.max(0, Math.min(1000, Math.round(n)));
  const raw = clampRawScore(gameId, rawScore);

  switch (gameId) {
    case "reaction": {
      // Avg of 3 rounds: elite ~150ms → 1000; 300ms → ~790; 450ms → ~580; 800ms → ~90
      const ms = Math.max(120, raw); // floor absurd sub-human times
      return clamp(1000 - (ms - 150) * 1.4);
    }
    case "simon":
      // Perfect clear = 10 steps → 1000
      return clamp((raw / 10) * 1000);
    case "memory":
      // Perfect clear ~1050–1200 raw → 1000; messy clears land lower
      return clamp((raw / 1100) * 1000);
    case "spot-difference":
      // Full clear + instant: 800 find + 300 speed = 1100
      return clamp((raw / 1100) * 1000);
    case "one-second":
      // Already 0–1000 (2 × 5 × 100)
      return clamp(raw);
    case "stroop":
      // Already 0–1000 (correct × 10)
      return clamp(raw);
    case "typing":
      // ~83 WPM @ 100% → raw 1000 → 1000; higher WPM still caps at 1000
      return clamp(raw);
    case "speed-puzzle":
      // Already scored as 0–1000 points (faster = higher)
      return clamp(raw);
    case "logo-remix":
      // Already 0–1000 (10 × 100)
      return clamp(raw);
    case "trivia":
      // Already 0–1000 (10 × 100)
      return clamp(raw);
    default:
      return clamp(raw);
  }
}

export function relativeNormalize(scores: number[]): number[] {
  const max = Math.max(...scores, 1);
  return scores.map((s) => Math.round((s / max) * 1000));
}
