"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { OfficeGamesScene } from "@/components/home/OfficeGamesScene";
import { springSoft } from "@/lib/motion";

export default function HomePage() {
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[calc(100dvh-5.5rem)] flex-1 flex-col overflow-x-hidden sm:min-h-[calc(100dvh-4.75rem)]">
      <OfficeGamesScene />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-8 sm:py-16 lg:py-20">
        <div className="relative z-10 w-full max-w-xl lg:max-w-[34rem]">
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.08 }}
            className="font-display text-[clamp(2.5rem,12vw,6.75rem)] font-extrabold leading-[0.92] tracking-[-0.045em]"
          >
            <span className="text-[var(--fg)]">Office</span>
            <br />
            <span className="text-gradient">Olympics</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.18 }}
            className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-[var(--fg-muted)] sm:mt-6 sm:text-lg"
          >
            Turn the open plan into a tournament floor — host a code, play mini-games,
            cast the leaderboard.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.28 }}
            className="mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:max-w-none sm:flex-row sm:items-center sm:gap-3"
          >
            <Link
              href="/host"
              className="btn-primary animate-pulse-ring w-full justify-center sm:w-auto sm:text-lg"
            >
              Host tournament
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>
            <Link
              href="/join"
              className="btn-secondary w-full justify-center sm:w-auto sm:text-base"
            >
              Join with code
            </Link>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48, duration: 0.45 }}
            className="mt-6 flex flex-col gap-2.5 text-sm text-[var(--fg-muted)] sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2"
          >
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 transition hover:text-[var(--fg)]"
            >
              <Users className="h-4 w-4 shrink-0" />
              Classic single-device
            </Link>
            {tournamentStarted && (
              <Link
                href="/dashboard"
                className="underline-offset-2 transition hover:text-[var(--fg)] hover:underline"
              >
                Resume local tournament
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
