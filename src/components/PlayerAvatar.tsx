"use client";

import type { ReactNode } from "react";
import {
  Anchor,
  Coffee,
  Compass,
  Crown,
  Flag,
  Flame,
  Gem,
  Hexagon,
  Leaf,
  Mountain,
  Orbit,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  PLAYER_AVATARS,
  isPlayerAvatarId,
  playerAvatarUrl,
  type PlayerAvatarId,
} from "@/data/playerAvatars";
import {
  TEAM_EMBLEMS,
  getTeamEmblem,
  isTeamEmblemId,
  type TeamEmblemId,
} from "@/data/teamEmblems";

const SIZE = {
  xs: "h-6 w-6 text-sm",
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-base",
  lg: "h-11 w-11 text-lg",
  xl: "h-14 w-14 text-2xl",
  pick: "h-full w-full aspect-square",
} as const;

const ICON_SIZE = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-7 w-7",
  pick: "h-[42%] w-[42%]",
} as const;

const EMBLEM_ICONS: Record<(typeof TEAM_EMBLEMS)[number]["icon"], LucideIcon> = {
  flame: Flame,
  bolt: Zap,
  mountain: Mountain,
  shield: Shield,
  crown: Crown,
  rocket: Rocket,
  anchor: Anchor,
  target: Target,
  swords: Swords,
  gem: Gem,
  star: Star,
  hexagon: Hexagon,
  orbit: Orbit,
  leaf: Leaf,
  waves: Waves,
  sparkles: Sparkles,
  trophy: Trophy,
  flag: Flag,
  compass: Compass,
  coffee: Coffee,
};

type Size = keyof typeof SIZE;

export function PlayerAvatar({
  avatar,
  name = "",
  size = "md",
  className = "",
  rounded = "rounded-xl",
  color,
}: {
  avatar?: string | null;
  name?: string;
  size?: Size;
  className?: string;
  rounded?: string;
  /** Optional tint — used for team emblems */
  color?: string;
}) {
  const box = `${SIZE[size]} ${rounded} ${className}`.trim();

  // Team emblems first — symbol + brand color are always paired
  if (avatar && isTeamEmblemId(avatar)) {
    const emblem = getTeamEmblem(avatar)!;
    const Icon = EMBLEM_ICONS[emblem.icon];
    const bg = `#${emblem.bg}`;
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center text-white ${box}`}
        style={{ background: bg }}
        aria-hidden
      >
        <Icon className={ICON_SIZE[size]} strokeWidth={2.25} />
      </span>
    );
  }

  if (avatar && isPlayerAvatarId(avatar)) {
    const url = playerAvatarUrl(avatar);
    return (
      // eslint-disable-next-line @next/next/no-img-element -- DiceBear SVG avatars; plain img avoids remotePatterns churn
      <img
        src={url!}
        alt=""
        aria-hidden
        className={`shrink-0 object-cover bg-[color-mix(in_srgb,var(--primary-from)_12%,transparent)] ${box}`}
      />
    );
  }

  if (avatar) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center bg-[color-mix(in_srgb,var(--primary-from)_16%,transparent)] leading-none ${box}`}
        aria-hidden
      >
        {avatar}
      </span>
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-[color-mix(in_srgb,var(--primary-from)_16%,transparent)] font-display font-bold text-[var(--primary-from)] ${box}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function PickerGrid({
  label,
  children,
  compact = false,
}: {
  label?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-3"}>
      {label ? (
        <p
          className={
            compact
              ? "text-[11px] font-semibold text-[var(--fg-muted)]"
              : "text-sm font-semibold"
          }
        >
          {label}
        </p>
      ) : null}
      <div
        className={
          compact
            ? "grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2"
            : "grid grid-cols-6 gap-2 sm:grid-cols-8 sm:gap-2.5"
        }
      >
        {children}
      </div>
    </div>
  );
}

export function AvatarPicker({
  value,
  onChange,
  label = "Pick an avatar",
}: {
  value: string;
  onChange: (id: PlayerAvatarId) => void;
  label?: string;
}) {
  return (
    <PickerGrid label={label}>
      {PLAYER_AVATARS.map((a) => {
        const selected = value === a.id;
        return (
          <button
            key={a.id}
            type="button"
            aria-label={`Avatar ${a.seed}`}
            aria-pressed={selected}
            onClick={() => onChange(a.id)}
            className={`aspect-square rounded-xl p-0.5 transition sm:rounded-2xl sm:p-1 ${
              selected
                ? "bg-tone-20 ring-2 ring-[var(--ring)]"
                : "bg-tone-5 hover:bg-tone-10"
            }`}
          >
            <PlayerAvatar
              avatar={a.id}
              name={a.seed}
              size="pick"
              rounded="rounded-[0.65rem] sm:rounded-xl"
              className="!h-full !w-full"
            />
          </button>
        );
      })}
    </PickerGrid>
  );
}

export function TeamEmblemPicker({
  value,
  onChange,
  label = "Pick a team emblem",
  compact = false,
}: {
  value: string;
  onChange: (id: TeamEmblemId) => void;
  label?: string | false;
  compact?: boolean;
}) {
  return (
    <PickerGrid label={label || undefined} compact={compact}>
      {TEAM_EMBLEMS.map((e) => {
        const selected = value === e.id;
        return (
          <button
            key={e.id}
            type="button"
            aria-label={`Emblem ${e.label}`}
            aria-pressed={selected}
            onClick={() => onChange(e.id)}
            className={`aspect-square transition ${
              compact
                ? "w-full rounded-lg p-0.5 sm:rounded-xl"
                : "rounded-xl p-0.5 sm:rounded-2xl sm:p-1"
            } ${
              selected
                ? "bg-tone-20 ring-2 ring-[var(--ring)]"
                : "bg-tone-5 hover:bg-tone-10"
            }`}
          >
            <PlayerAvatar
              avatar={e.id}
              name={e.label}
              size="pick"
              rounded={compact ? "rounded-md sm:rounded-lg" : "rounded-[0.65rem] sm:rounded-xl"}
              className="!h-full !w-full"
            />
          </button>
        );
      })}
    </PickerGrid>
  );
}
