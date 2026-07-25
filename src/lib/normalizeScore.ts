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
      return Math.max(0, Math.min(30, Math.round(n)));
    case "memory":
      return Math.max(0, Math.min(1200, Math.round(n)));
    case "spot-difference":
      return Math.max(0, Math.min(1100, Math.round(n)));
    case "one-second":
      return Math.max(0, Math.min(800, Math.round(n)));
    case "stroop":
      // Correct taps in 90s — elite ~45–55; clamp wild reports
      return Math.max(0, Math.min(80, Math.round(n)));
    case "typing":
      return Math.max(0, Math.min(1500, Math.round(n)));
    case "speed-puzzle":
      // Points 0–1000 (faster solve → higher). Legacy ms scores clamp into range.
      return Math.max(0, Math.min(1000, Math.round(n)));
    case "word-scramble":
      return Math.max(0, Math.min(25, Math.round(n)));
    case "trivia":
      return Math.max(0, Math.min(3000, Math.round(n)));
    default:
      return Math.max(0, Math.round(n));
  }
}

/**
 * Map each game's raw performance to a fair 0–1000 contribution.
 *
 * Raw units:
 * - reaction: average ms over 3 rounds (lower better)
 * - simon: longest completed sequence length
 * - memory: matches*100 + move efficiency + combo + clear/speed bonus
 * - spot-difference: round((found/15)*1000) + speed clear bonus 0–100 (1100 max)
 * - one-second: answer points (≈100–200 per correct × 3)
 * - stroop: correct taps in 90s (elite ~45)
 * - typing: round(wpm * accuracy/100 * 10), wpm capped
 * - speed-puzzle: points 0–1000 (faster completion → higher)
 * - word-scramble: words solved
 * - trivia: quiz points (100–200 per correct × 15)
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
      // Avg of 3 rounds: elite ~160–200ms → near 1000; 300ms → ~790; 450ms → ~580; 800ms → ~90
      const ms = Math.max(120, raw); // floor absurd sub-human times
      return clamp(1000 - (ms - 150) * 1.4);
    }
    case "simon":
      // 10 steps ≈ strong; 15+ is elite → 1000
      return clamp((raw / 15) * 1000);
    case "memory":
      // Perfect clear ~1050–1100 raw → 1000; messy clears land lower
      return clamp((raw / 1100) * 1000);
    case "spot-difference":
      // Clear all 15 + full time left: 1000 + 100 = 1100
      return clamp((raw / 1100) * 1000);
    case "one-second":
      // 3 scenes × 5 questions, ~100–200 each → max ~3000
      return clamp((raw / 3000) * 1000);
    case "stroop":
      // ~45 correct in 90s is elite → 1000
      return clamp((raw / 45) * 1000);
    case "typing":
      // ~100 WPM @ 100% → raw 1000; scale so ~83 WPM ≈ 1000 after *1.0
      return clamp(raw);
    case "speed-puzzle":
      // Already scored as 0–1000 points (faster = higher)
      return clamp(raw);
    case "word-scramble":
      // ~12 words in 60s is elite
      return clamp((raw / 12) * 1000);
    case "trivia":
      // Max ~3000 (15×200)
      return clamp((raw / 3000) * 1000);
    default:
      return clamp(raw);
  }
}

export function relativeNormalize(scores: number[]): number[] {
  const max = Math.max(...scores, 1);
  return scores.map((s) => Math.round((s / max) * 1000));
}
