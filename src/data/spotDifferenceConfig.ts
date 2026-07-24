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

export interface SpotDifferencePair {
  id: string;
  title: string;
  leftUrl: string;
  rightUrl: string;
  differences: DifferenceHotspot[];
  durationSec: number;
}

/** All tap zones for a difference (primary + extras) */
export function hotspotZones(d: DifferenceHotspot): HitZone[] {
  return [{ x: d.x, y: d.y, radius: d.radius }, ...(d.zones ?? [])];
}

/**
 * Wikimedia Commons "Spot the difference.png" (CC BY-SA 3.0 / GFDL).
 * Coordinates from pixel-diff centroids of left vs right.
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
      // Extra pink flower on the plant’s right edge (not the tray disk below)
      { id: "d9", x: 0.979, y: 0.817, radius: 0.12, label: "Plant flowers" },
      // Yellow disk on the baking tray (was wrongly used as the flower marker)
      { id: "d10", x: 0.795, y: 0.954, radius: 0.1, label: "Cookie → disk" },
      { id: "d11", x: 0.481, y: 0.715, radius: 0.12, label: "Cake icing" },
      { id: "d12", x: 0.227, y: 0.277, radius: 0.1, label: "Hairpin missing" },
      { id: "d13", x: 0.277, y: 0.543, radius: 0.1, label: "Collar ribbon" },
      // On the stool foot — was wrongly on empty table by the fork
      { id: "d14", x: 0.661, y: 0.643, radius: 0.07, label: "Girl’s socks" },
      // Spoon (left) → lollipop (right) are the same spot
      { id: "d15", x: 0.764, y: 0.615, radius: 0.1, label: "Cat’s candy" },
    ],
  },
];
