"use client";

import { motion } from "framer-motion";
import type { PlayerOrTeam } from "@/types/tournament";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const PODIUM = [
  { place: 2, height: "h-24 sm:h-28 md:h-36", gradient: "from-slate-300 to-slate-500", label: "Silver" },
  { place: 1, height: "h-32 sm:h-40 md:h-52", gradient: "from-amber-300 to-yellow-600", label: "Gold" },
  { place: 3, height: "h-20 sm:h-24 md:h-28", gradient: "from-amber-700 to-orange-900", label: "Bronze" },
] as const;

export function Podium({
  top,
}: {
  top: {
    participant: PlayerOrTeam;
    total: number;
    topPlayer?: { id: string; name: string; emoji: string; total: number };
  }[];
}) {
  const ordered = [top[1], top[0], top[2]];

  return (
    <div
      id="podium-export"
      className="flex items-end justify-center gap-2 px-2 py-6 sm:gap-3 sm:px-4 sm:py-8 md:gap-6"
    >
      {PODIUM.map((slot, i) => {
        const row = ordered[i];
        if (!row) {
          return (
            <div
              key={slot.place}
              className={`w-[4.5rem] sm:w-24 md:w-36 ${slot.height} rounded-t-2xl bg-tone-5`}
            />
          );
        }
        const isTeam = row.participant.kind === "team";
        const topPlayer = row.topPlayer;
        return (
          <div
            key={slot.place}
            className="flex w-[5.25rem] flex-col items-center sm:w-28 md:w-40"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.15 * i, stiffness: 200 }}
              className="mb-2 text-center sm:mb-3"
            >
              <PlayerAvatar
                avatar={row.participant.emoji}
                name={row.participant.name}
                size="xl"
                rounded="rounded-2xl"
                className="mx-auto"
                color={row.participant.color}
              />
              <p className="mt-1 max-w-full truncate font-display text-xs font-bold sm:text-sm md:text-base">
                {row.participant.name}
              </p>
              <p
                className="font-display text-base font-extrabold sm:text-lg"
                style={{ color: row.participant.color }}
              >
                {row.total}
              </p>
              {isTeam && topPlayer && (
                <p className="mt-0.5 flex max-w-full items-center justify-center gap-1 truncate text-[10px] leading-tight text-[var(--fg-muted)] sm:text-xs">
                  <span>Top</span>
                  <PlayerAvatar
                    avatar={topPlayer.emoji}
                    name={topPlayer.name}
                    size="xs"
                    rounded="rounded-md"
                  />
                  <span className="truncate">
                    {topPlayer.name} · {topPlayer.total}
                  </span>
                </p>
              )}
            </motion.div>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.1 * i }}
              style={{ originY: 1 }}
              className={`flex w-full ${slot.height} items-start justify-center rounded-t-2xl bg-gradient-to-b ${slot.gradient} pt-2 shadow-xl sm:pt-3`}
            >
              <span className="font-display text-2xl font-extrabold text-black/70 sm:text-3xl">
                {slot.place}
              </span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
