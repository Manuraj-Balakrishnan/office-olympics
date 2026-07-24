export interface DifferenceHotspot {
  id: string;
  /** Normalized 0–1 coordinates relative to image box */
  x: number;
  y: number;
  radius: number;
  label: string;
}

export interface SpotDifferencePair {
  id: string;
  title: string;
  leftUrl: string;
  rightUrl: string;
  differences: DifferenceHotspot[];
  durationSec: number;
}

/**
 * Wikimedia Commons "Spot the difference.png" (CC BY-SA 3.0 / GFDL).
 *
 * All 16 targets are real pixel-diff clusters between left/right
 * (no ghost targets — e.g. tongue is not present at this resolution).
 * Cat covers both spoon→candy change as one difference.
 */
export const SPOT_DIFFERENCE_PAIRS: SpotDifferencePair[] = [
  {
    id: "sd-kitchen",
    title: "Kitchen Cake",
    leftUrl: "/spot-difference/cartoon-left.png",
    rightUrl: "/spot-difference/cartoon-right.png",
    durationSec: 120,
    differences: [
      { id: "d1", x: 0.111, y: 0.13, radius: 0.1, label: "Curtain shape" },
      { id: "d2", x: 0.31, y: 0.098, radius: 0.1, label: "Clock hands" },
      { id: "d3", x: 0.917, y: 0.222, radius: 0.11, label: "Cabinet hearts" },
      { id: "d4", x: 0.883, y: 0.382, radius: 0.11, label: "Shelf dolls" },
      { id: "d5", x: 0.977, y: 0.521, radius: 0.11, label: "Smiley plate" },
      { id: "d6", x: 0.44, y: 0.278, radius: 0.11, label: "Mountain picture" },
      { id: "d7", x: 0.649, y: 0.373, radius: 0.1, label: "Heart-frame birds" },
      { id: "d8", x: 0.249, y: 0.917, radius: 0.11, label: "Bananas" },
      { id: "d9", x: 0.797, y: 0.949, radius: 0.11, label: "Plant flowers" },
      { id: "d10", x: 0.64, y: 0.66, radius: 0.08, label: "Cookie → disk" },
      { id: "d11", x: 0.481, y: 0.715, radius: 0.12, label: "Cake icing" },
      { id: "d12", x: 0.227, y: 0.277, radius: 0.1, label: "Hairpin missing" },
      { id: "d13", x: 0.277, y: 0.543, radius: 0.1, label: "Collar ribbon" },
      // Foot on stool (keep clear of cat/spoon zone)
      { id: "d14", x: 0.7, y: 0.76, radius: 0.09, label: "Girl’s socks" },
      { id: "d15", x: 0.607, y: 0.687, radius: 0.085, label: "Tray / cake edge" },
      // Covers spoon (original) + candy (modified)
      { id: "d16", x: 0.85, y: 0.7, radius: 0.16, label: "Cat’s candy" },
    ],
  },
];
