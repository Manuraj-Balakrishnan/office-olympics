"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radio, Users } from "lucide-react";
import { springSoft } from "@/lib/motion";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { getTeamEmblem } from "@/data/teamEmblems";
import type { Player, Team, TournamentMode } from "@/types/tournament";

export function LobbyLiveBadge({
  playerCount,
  label = "Lobby open",
  className = "",
}: {
  playerCount: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-[var(--fg-muted)] sm:gap-2 sm:text-xs ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary-from)] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary-from)]" />
      </span>
      <Radio className="h-3.5 w-3.5 shrink-0 text-[var(--primary-from)]" aria-hidden />
      <span className="truncate">{label}</span>
      <span className="tabular-nums text-[var(--fg)]" aria-hidden>
        ·
      </span>
      <span className="font-bold tabular-nums text-[var(--fg)]">{playerCount}</span>
    </div>
  );
}

function JoinCodeTiles({
  joinCode,
  size = "md",
}: {
  joinCode: string;
  size?: "md" | "lg";
}) {
  const chars = joinCode.split("");
  const tile =
    size === "lg"
      ? "h-8 min-w-0 flex-1 basis-0 px-0.5 text-sm sm:h-9 sm:px-1 sm:text-base md:h-10 md:text-lg"
      : "h-7 min-w-0 flex-1 basis-0 px-0.5 text-xs sm:h-8 sm:text-sm";

  return (
    <p
      className="flex w-full max-w-full flex-nowrap items-center gap-0.5 sm:gap-1"
      aria-label={`Join code ${joinCode}`}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: i * 0.03 }}
          className={`inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-tone-5/90 font-display font-extrabold leading-none tracking-wide text-gradient shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:rounded-xl ${tile}`}
        >
          {ch}
        </motion.span>
      ))}
    </p>
  );
}

/** Join-code stage — letter tiles, scales across viewports */
export function LobbyJoinCodeHero({
  joinCode,
  playerCount,
  subtitle = "Share this code — players join from any phone",
  size = "md",
}: {
  joinCode: string;
  playerCount: number;
  subtitle?: string;
  size?: "md" | "lg";
}) {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] sm:rounded-[1.75rem]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 100%, color-mix(in srgb, var(--primary-from) 20%, transparent), transparent 55%), radial-gradient(ellipse 45% 50% at 0% 0%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 50%), radial-gradient(ellipse 40% 35% at 100% 0%, color-mix(in srgb, var(--accent-warm) 8%, transparent), transparent 50%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-3.5 px-4 py-6 text-center sm:items-start sm:gap-4 sm:px-6 sm:py-7 sm:text-left md:px-8 md:py-8">
        <LobbyLiveBadge playerCount={playerCount} />
        <div className="w-full">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--fg-muted)] sm:text-[11px]">
            Join code
          </p>
          <JoinCodeTiles joinCode={joinCode} size={size} />
        </div>
        <p className="max-w-md text-sm leading-relaxed text-[var(--fg-muted)] sm:text-[0.95rem]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function CrowdTile({
  player,
  highlight = false,
  size = "md",
}: {
  player: Player;
  highlight?: boolean;
  size?: "md" | "lg";
}) {
  const initial = player.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.82, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={springSoft}
      className="flex w-[4.25rem] min-w-0 flex-col items-center gap-1.5 sm:w-[4.75rem]"
    >
      <div
        className={`relative ${
          highlight
            ? "rounded-[1.15rem] ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg-elevated)]"
            : ""
        }`}
      >
        <PlayerAvatar
          avatar={player.emoji}
          name={player.name || initial}
          size={size === "lg" ? "lg" : "md"}
          rounded="rounded-[1.15rem]"
        />
        {highlight ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary-from)] px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-[var(--primary-fg)]">
            You
          </span>
        ) : null}
      </div>
      <p className="w-full truncate text-center text-[10px] font-semibold leading-tight sm:text-[11px]">
        {player.name}
      </p>
    </motion.li>
  );
}

function crowdGridClass(count: number) {
  // Size tiles to content — avoid a lonely avatar stuck in a 4-col void
  if (count <= 2) {
    return "flex flex-wrap justify-start gap-x-4 gap-y-3 sm:gap-x-5";
  }
  if (count <= 5) {
    return "grid grid-cols-3 gap-x-2.5 gap-y-3 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-4";
  }
  if (count <= 8) {
    return "grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-4 sm:gap-3 md:grid-cols-5";
  }
  return "grid grid-cols-4 gap-x-1.5 gap-y-3 sm:grid-cols-5 sm:gap-x-2.5 sm:gap-y-3.5 md:grid-cols-6";
}

function EmptyCrowd({ mode }: { mode: TournamentMode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed border-[var(--border)] bg-tone-3/40 px-4 py-9 text-center sm:py-11">
      <div className="flex -space-x-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-tone-5 text-[var(--fg-muted)] sm:h-12 sm:w-12 sm:rounded-2xl"
            style={{ opacity: 1 - i * 0.22 }}
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        ))}
      </div>
      <div>
        <p className="font-display text-sm font-bold sm:text-base">
          {mode === "teams" ? "Teams will land here" : "Waiting for faces…"}
        </p>
        <p className="mt-1.5 max-w-[16rem] text-xs leading-relaxed text-[var(--fg-muted)] sm:max-w-xs sm:text-sm">
          They appear the second someone joins with the code.
        </p>
      </div>
    </div>
  );
}

/** Responsive avatar grid — densifies with player count */
export function LobbyRoster({
  mode,
  players,
  teams,
  title,
  large = false,
  maxHeightClass = "",
  highlightPlayerId,
  columns = false,
  className = "",
  variant = "crowd",
}: {
  mode: TournamentMode;
  players: Player[];
  teams: Team[];
  title?: string;
  large?: boolean;
  maxHeightClass?: string;
  highlightPlayerId?: string;
  columns?: boolean;
  className?: string;
  variant?: "crowd" | "list";
}) {
  const heading =
    title ?? (mode === "teams" ? "Teams checking in" : "Who’s here");
  const isEmpty =
    mode === "teams"
      ? teams.length === 0 && players.length === 0
      : players.length === 0;

  if (variant === "list") {
    return (
      <LobbyRosterList
        mode={mode}
        players={players}
        teams={teams}
        title={heading}
        large={large}
        maxHeightClass={maxHeightClass || "max-h-[min(28rem,50dvh)]"}
        highlightPlayerId={highlightPlayerId}
        columns={columns}
        className={className}
      />
    );
  }

  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-3 flex items-end justify-between gap-2 sm:mb-3.5">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight sm:text-lg">
            {heading}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--fg-muted)] sm:text-sm">
            {mode === "teams" ? "Teams and teammates checking in" : "Live as people join"}
          </p>
        </div>
        <p className="shrink-0 rounded-full bg-tone-8 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[var(--fg)] sm:text-xs">
          {players.length}
        </p>
      </div>

      <div
        className={`${maxHeightClass} ${maxHeightClass ? "overflow-auto overscroll-contain" : ""}`}
      >
        {mode === "teams" ? (
          isEmpty ? (
            <EmptyCrowd mode={mode} />
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <AnimatePresence initial={false}>
                {teams.map((team) => {
                  const members = players.filter((p) => p.teamId === team.id);
                  const color =
                    (getTeamEmblem(team.emoji)?.color ?? null) ?? team.color;
                  return (
                    <motion.div
                      key={team.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={springSoft}
                      className="rounded-2xl border border-[var(--border)] bg-tone-4/70 p-3 sm:p-3.5"
                    >
                      <div className="mb-2.5 flex items-center gap-2">
                        <PlayerAvatar
                          avatar={team.emoji}
                          name={team.name}
                          size="sm"
                          rounded="rounded-lg"
                          color={color}
                        />
                        <span
                          className="min-w-0 flex-1 truncate font-display text-sm font-bold"
                          style={{ color }}
                        >
                          {team.name}
                        </span>
                        <span className="text-[11px] tabular-nums text-[var(--fg-muted)]">
                          {members.length}
                        </span>
                      </div>
                      {members.length === 0 ? (
                        <p className="text-xs text-[var(--fg-muted)]">
                          Waiting for teammates…
                        </p>
                      ) : (
                        <ul className={crowdGridClass(members.length)}>
                          <AnimatePresence initial={false}>
                            {members.map((p) => (
                              <CrowdTile
                                key={p.id}
                                player={p}
                                size={large ? "lg" : "md"}
                                highlight={p.id === highlightPlayerId}
                              />
                            ))}
                          </AnimatePresence>
                        </ul>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(() => {
                const unassigned = players.filter((p) => !p.teamId);
                if (unassigned.length === 0) return null;
                return (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                      Unassigned
                    </p>
                    <ul className={crowdGridClass(unassigned.length)}>
                      {unassigned.map((p) => (
                        <CrowdTile
                          key={p.id}
                          player={p}
                          size={large ? "lg" : "md"}
                          highlight={p.id === highlightPlayerId}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          )
        ) : isEmpty ? (
          <EmptyCrowd mode={mode} />
        ) : (
          <ul className={crowdGridClass(players.length)}>
            <AnimatePresence initial={false}>
              {players.map((p) => (
                <CrowdTile
                  key={p.id}
                  player={p}
                  size={large ? "lg" : "md"}
                  highlight={p.id === highlightPlayerId}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}

function ListChip({
  player,
  index,
  large,
  highlight,
  compact,
}: {
  player: Player;
  index: number;
  large?: boolean;
  highlight?: boolean;
  compact?: boolean;
}) {
  const initial = player.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={springSoft}
      className={`flex min-w-0 items-center gap-2 rounded-xl border bg-tone-5 ${
        highlight
          ? "border-[var(--ring)] bg-[color-mix(in_srgb,var(--ring)_14%,transparent)]"
          : "border-[var(--border)]"
      } ${compact ? "px-2 py-1.5" : "px-2.5 py-2"}`}
    >
      <PlayerAvatar
        avatar={player.emoji}
        name={player.name || initial}
        size={compact ? "sm" : large ? "md" : "sm"}
        rounded="rounded-lg"
      />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold">
        {player.name}
        {highlight ? (
          <span className="ml-1.5 text-[10px] font-bold uppercase text-[var(--primary-from)]">
            You
          </span>
        ) : null}
      </p>
      <span className="text-[10px] font-semibold tabular-nums text-[var(--fg-muted)]">
        #{index}
      </span>
    </motion.li>
  );
}

function LobbyRosterList({
  mode,
  players,
  teams,
  title,
  large,
  maxHeightClass,
  highlightPlayerId,
  columns,
  className,
}: {
  mode: TournamentMode;
  players: Player[];
  teams: Team[];
  title: string;
  large?: boolean;
  maxHeightClass?: string;
  highlightPlayerId?: string;
  columns?: boolean;
  className?: string;
}) {
  const useGrid = columns && mode === "individuals" && players.length > 0;
  const isEmpty =
    mode === "teams"
      ? teams.length === 0 && players.length === 0
      : players.length === 0;

  return (
    <section
      className={`card-surface !p-0 flex h-full min-h-0 flex-col overflow-hidden ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-3.5 py-2.5 sm:px-4">
        <h2 className="font-display text-sm font-bold sm:text-base">{title}</h2>
        <p className="rounded-full bg-tone-8 px-2 py-0.5 text-[11px] font-bold tabular-nums">
          {players.length}
        </p>
      </div>
      <div
        className={`min-h-0 flex-1 overflow-auto overscroll-contain p-2.5 sm:p-3 ${maxHeightClass}`}
      >
        {mode === "teams" ? (
          <div className="space-y-2">
            {teams.map((team) => {
              const members = players.filter((p) => p.teamId === team.id);
              return (
                <div
                  key={team.id}
                  className="rounded-xl border border-[var(--border)] bg-tone-4 p-2"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <PlayerAvatar
                      avatar={team.emoji}
                      name={team.name}
                      size="sm"
                      rounded="rounded-lg"
                      color={(getTeamEmblem(team.emoji)?.color ?? null) ?? team.color}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">
                      {team.name}
                    </span>
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      {members.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {members.map((p, i) => (
                      <ListChip
                        key={p.id}
                        player={p}
                        index={i + 1}
                        large={large}
                        highlight={p.id === highlightPlayerId}
                      />
                    ))}
                    {members.length === 0 && (
                      <li className="px-2 py-1 text-xs text-[var(--fg-muted)]">
                        No players yet
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
            {isEmpty && <EmptyCrowd mode={mode} />}
          </div>
        ) : isEmpty ? (
          <EmptyCrowd mode={mode} />
        ) : (
          <ul className={useGrid ? "grid grid-cols-2 gap-1.5" : "space-y-1"}>
            {players.map((p, i) => (
              <ListChip
                key={p.id}
                player={p}
                index={i + 1}
                large={large}
                compact={useGrid}
                highlight={p.id === highlightPlayerId}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Player waiting — identity hero while the lobby fills */
export function LobbyReadyBanner({
  name,
  playerCount,
  avatar,
  joinCode,
  teamName,
  teamEmoji,
  teamColor,
}: {
  name: string;
  playerCount: number;
  avatar?: string | null;
  joinCode?: string;
  teamName?: string;
  teamEmoji?: string | null;
  teamColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-elevated)] sm:rounded-[1.75rem]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 90% at 100% 0%, color-mix(in srgb, var(--primary-from) 22%, transparent), transparent 55%), radial-gradient(ellipse 50% 60% at 0% 100%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 50%)",
        }}
      />
      <div className="relative flex items-start gap-3.5 p-4 sm:gap-4 sm:p-5">
        <div className="relative shrink-0">
          <div
            className="pointer-events-none absolute -inset-2 rounded-[1.35rem] opacity-70 blur-lg"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--primary-from) 45%, transparent), transparent 70%)",
            }}
          />
          <PlayerAvatar
            avatar={avatar}
            name={name}
            size="xl"
            rounded="rounded-[1.15rem]"
            className="relative ring-2 ring-[color-mix(in_srgb,var(--primary-from)_35%,transparent)]"
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <LobbyLiveBadge playerCount={playerCount} label="You're in" />
            {joinCode ? (
              <p
                className="rounded-full border border-[var(--border)] bg-tone-5 px-2.5 py-0.5 font-display text-[11px] font-bold tracking-wider text-[var(--fg)]"
                aria-label={`Room code ${joinCode}`}
              >
                {joinCode}
              </p>
            ) : null}
          </div>
          <h1 className="mt-1.5 truncate font-display text-[1.65rem] font-extrabold leading-none tracking-tight sm:text-[2rem]">
            Hey, <span className="text-gradient">{name}</span>
          </h1>
          {teamName ? (
            <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-[var(--fg-muted)]">
              {teamEmoji ? (
                <PlayerAvatar
                  avatar={teamEmoji}
                  name={teamName}
                  size="xs"
                  rounded="rounded-md"
                  color={teamColor}
                />
              ) : null}
              <span
                className="truncate font-semibold"
                style={teamColor ? { color: teamColor } : undefined}
              >
                {teamName}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm leading-snug text-[var(--fg-muted)]">
              Stay here — games start automatically when the host is ready.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { JoinCodeTiles };
