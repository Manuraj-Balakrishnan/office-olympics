export const PLAYER_AVATARS = [
  { id: "spark", seed: "Spark", bg: "b6e3f4" },
  { id: "bolt", seed: "Bolt", bg: "ffd5dc" },
  { id: "nova", seed: "Nova", bg: "c0aede" },
  { id: "ace", seed: "Ace", bg: "d1f4d1" },
  { id: "pixel", seed: "Pixel", bg: "ffdfbf" },
  { id: "echo", seed: "Echo", bg: "c9e4ff" },
  { id: "blaze", seed: "Blaze", bg: "ffd6a5" },
  { id: "orbit", seed: "Orbit", bg: "e0d4ff" },
  { id: "quake", seed: "Quake", bg: "b8f2e6" },
  { id: "comet", seed: "Comet", bg: "fde2e4" },
  { id: "radar", seed: "Radar", bg: "fff1b8" },
  { id: "flux", seed: "Flux", bg: "d4f0ff" },
  { id: "zen", seed: "Zen", bg: "c5f6c8" },
  { id: "riot", seed: "Riot", bg: "ffc9de" },
  { id: "glow", seed: "Glow", bg: "ffe8a3" },
  { id: "pulse", seed: "Pulse", bg: "cbb2fe" },
] as const;

export type PlayerAvatarId = (typeof PLAYER_AVATARS)[number]["id"];

export const DEFAULT_PLAYER_AVATAR: PlayerAvatarId = PLAYER_AVATARS[0]!.id;

export function isPlayerAvatarId(value: string | undefined | null): value is PlayerAvatarId {
  return !!value && PLAYER_AVATARS.some((a) => a.id === value);
}

export function playerAvatarUrl(id: string): string | null {
  const avatar = PLAYER_AVATARS.find((a) => a.id === id);
  if (!avatar) return null;
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(avatar.seed)}&backgroundColor=${avatar.bg}`;
}

export function nextPlayerAvatar(used: Array<string | undefined>): PlayerAvatarId {
  const taken = new Set(used.filter(isPlayerAvatarId));
  const free = PLAYER_AVATARS.find((a) => !taken.has(a.id));
  return free?.id ?? PLAYER_AVATARS[used.length % PLAYER_AVATARS.length]!.id;
}
