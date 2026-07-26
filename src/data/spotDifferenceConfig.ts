export interface HitZone {
  x: number;
  y: number;
  radius: number;
}

export interface DifferenceHotspot {
  id: string;
  /** Primary marker position (checkmark) — normalized 0–1 */
  x: number;
  y: number;
  radius: number;
  label: string;
  /** Extra tap zones that count as the same difference */
  zones?: HitZone[];
}

export type SpotDifficulty = "easy" | "medium" | "hard";

export interface SpotDifferencePair {
  id: string;
  title: string;
  difficulty: SpotDifficulty;
  leftUrl: string;
  rightUrl: string;
  differences: DifferenceHotspot[];
  /** Soft time budget for this stage (used in combined speed bonus) */
  durationSec: number;
}

/** All tap zones for a difference (primary + extras) */
export function hotspotZones(d: DifferenceHotspot): HitZone[] {
  return [{ x: d.x, y: d.y, radius: d.radius }, ...(d.zones ?? [])];
}

export const SPOT_DIFFICULTY_LABEL: Record<SpotDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * Three stages — always played in order: Easy → Medium → Hard.
 *
 * Assets (original illustrator / vector spot-the-difference puzzles):
 * - Easy: Openclipart country bike ride (CC0) — 5 original differences
 * - Medium: Wikimedia pirate ships (CC BY 3.0) — 6 original differences
 * - Hard: Wikimedia kitchen cartoon (CC BY-SA) — 15 original differences
 *
 * Hotspots are normalized to each image's content box (0–1) and verified
 * against pixel diffs of the left/right pair.
 */
export const SPOT_DIFFERENCE_STAGES: SpotDifferencePair[] = [
  {
    id: "sd-bike",
    title: "Country Ride",
    difficulty: "easy",
    leftUrl: "/spot-difference/bike-left.png",
    rightUrl: "/spot-difference/bike-right.png",
    durationSec: 60,
    differences: [
      { id: "d1", x: 0.145, y: 0.275, radius: 0.085, label: "Birds" },
      { id: "d2", x: 0.72, y: 0.15, radius: 0.085, label: "Extra cloud" },
      { id: "d3", x: 0.215, y: 0.6, radius: 0.085, label: "Extra tree" },
      { id: "d4", x: 0.785, y: 0.43, radius: 0.07, label: "Mouth" },
      { id: "d5", x: 0.845, y: 0.2, radius: 0.085, label: "Raised hand" },
    ],
  },
  {
    id: "sd-pirates",
    title: "Pirate Ships",
    difficulty: "medium",
    leftUrl: "/spot-difference/pirates-left.png",
    rightUrl: "/spot-difference/pirates-right.png",
    durationSec: 120,
    differences: [
      {
        id: "d1",
        x: 0.07,
        y: 0.531,
        radius: 0.075,
        label: "Lanterns",
        zones: [{ x: 0.218, y: 0.509, radius: 0.07 }],
      },
      { id: "d2", x: 0.35, y: 0.55, radius: 0.085, label: "Deck sword" },
      { id: "d3", x: 0.324, y: 0.886, radius: 0.09, label: "Gun ports" },
      { id: "d4", x: 0.647, y: 0.773, radius: 0.085, label: "Bow chest" },
      { id: "d5", x: 0.559, y: 0.824, radius: 0.08, label: "Fleur-de-lis" },
      { id: "d6", x: 0.594, y: 0.103, radius: 0.07, label: "Flag bone" },
    ],
  },
  {
    id: "sd-kitchen",
    title: "Kitchen Cake",
    difficulty: "hard",
    leftUrl: "/spot-difference/cartoon-left.png",
    rightUrl: "/spot-difference/cartoon-right.png",
    durationSec: 180,
    differences: [
      { id: "d1", x: 0.106, y: 0.13, radius: 0.1, label: "Curtain shape" },
      { id: "d2", x: 0.314, y: 0.096, radius: 0.1, label: "Clock hands" },
      { id: "d3", x: 0.906, y: 0.22, radius: 0.11, label: "Cabinet hearts" },
      { id: "d4", x: 0.888, y: 0.384, radius: 0.11, label: "Shelf dolls" },
      { id: "d5", x: 0.979, y: 0.509, radius: 0.1, label: "Smiley plate" },
      { id: "d6", x: 0.44, y: 0.27, radius: 0.1, label: "Mountain picture" },
      { id: "d7", x: 0.635, y: 0.355, radius: 0.1, label: "Heart-frame birds" },
      { id: "d8", x: 0.261, y: 0.928, radius: 0.11, label: "Bananas" },
      { id: "d9", x: 0.977, y: 0.82, radius: 0.11, label: "Plant flowers" },
      { id: "d10", x: 0.8, y: 0.957, radius: 0.1, label: "Cookie → disk" },
      { id: "d11", x: 0.518, y: 0.733, radius: 0.11, label: "Cake icing" },
      { id: "d12", x: 0.23, y: 0.274, radius: 0.1, label: "Hairpin missing" },
      { id: "d13", x: 0.266, y: 0.529, radius: 0.09, label: "Collar ribbon" },
      { id: "d14", x: 0.664, y: 0.651, radius: 0.07, label: "Girl’s socks" },
      { id: "d15", x: 0.766, y: 0.616, radius: 0.09, label: "Cat’s candy" },
    ],
  },
];

/** @deprecated use SPOT_DIFFERENCE_STAGES */
export const SPOT_DIFFERENCE_PAIRS = SPOT_DIFFERENCE_STAGES;
