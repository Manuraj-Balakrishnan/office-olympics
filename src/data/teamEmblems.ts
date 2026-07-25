export const TEAM_EMBLEMS = [
  { id: "emblem-flame", label: "Flame", icon: "flame", bg: "BE123C" },
  { id: "emblem-bolt", label: "Bolt", icon: "bolt", bg: "A16207" },
  { id: "emblem-summit", label: "Summit", icon: "mountain", bg: "334155" },
  { id: "emblem-shield", label: "Shield", icon: "shield", bg: "0F766E" },
  { id: "emblem-crown", label: "Crown", icon: "crown", bg: "7C3AED" },
  { id: "emblem-rocket", label: "Rocket", icon: "rocket", bg: "0369A1" },
  { id: "emblem-anchor", label: "Anchor", icon: "anchor", bg: "0E7490" },
  { id: "emblem-target", label: "Target", icon: "target", bg: "C2410C" },
  { id: "emblem-swords", label: "Swords", icon: "swords", bg: "9F1239" },
  { id: "emblem-gem", label: "Gem", icon: "gem", bg: "5B21B6" },
  { id: "emblem-star", label: "Star", icon: "star", bg: "B45309" },
  { id: "emblem-hex", label: "Hex", icon: "hexagon", bg: "155E75" },
  { id: "emblem-orbit", label: "Orbit", icon: "orbit", bg: "1D4ED8" },
  { id: "emblem-leaf", label: "Leaf", icon: "leaf", bg: "15803D" },
  { id: "emblem-wave", label: "Wave", icon: "waves", bg: "0369A1" },
  { id: "emblem-spark", label: "Spark", icon: "sparkles", bg: "C026D3" },
  { id: "emblem-trophy", label: "Trophy", icon: "trophy", bg: "A16207" },
  { id: "emblem-flag", label: "Flag", icon: "flag", bg: "B91C1C" },
  { id: "emblem-compass", label: "Compass", icon: "compass", bg: "0F766E" },
  { id: "emblem-coffee", label: "Coffee", icon: "coffee", bg: "44403C" },
] as const;

export type TeamEmblemId = (typeof TEAM_EMBLEMS)[number]["id"];

export const DEFAULT_TEAM_EMBLEM: TeamEmblemId = TEAM_EMBLEMS[0]!.id;

export function isTeamEmblemId(
  value: string | undefined | null,
): value is TeamEmblemId {
  return !!value && TEAM_EMBLEMS.some((e) => e.id === value);
}

export function getTeamEmblem(id: string) {
  const emblem = TEAM_EMBLEMS.find((e) => e.id === id);
  if (!emblem) return null;
  return { ...emblem, color: `#${emblem.bg}` as const };
}

export function nextTeamEmblem(
  used: Array<string | undefined>,
): TeamEmblemId {
  const taken = new Set(used.filter(isTeamEmblemId));
  const free = TEAM_EMBLEMS.find((e) => !taken.has(e.id));
  return free?.id ?? TEAM_EMBLEMS[used.length % TEAM_EMBLEMS.length]!.id;
}
