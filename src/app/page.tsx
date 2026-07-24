"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QrCode, Trophy, Users } from "lucide-react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { fadeUp, springSoft } from "@/lib/motion";

export default function HomePage() {
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);

  return (
    <PageEnter className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      <PageItem className="relative z-10 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springSoft}
          className="mb-8 inline-flex items-center justify-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-teal-500/25 md:h-16 md:w-16">
            <Trophy className="h-7 w-7 md:h-8 md:w-8" />
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp}
          className="font-display text-[clamp(3.2rem,12vw,7rem)] font-extrabold leading-[0.92] tracking-tight"
        >
          <span className="text-gradient">Office Olympics</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-lg text-[var(--fg-muted)] md:text-xl"
        >
          Host shares a code & QR. Everyone plays each game together. You control when
          rounds advance — live big-screen scores included.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.22 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/host" className="btn-primary animate-pulse-ring text-xl">
            <Trophy className="h-5 w-5" /> Host tournament
          </Link>
          <Link href="/join" className="btn-secondary text-lg">
            <QrCode className="h-5 w-5" /> Join with code
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--fg-muted)]"
        >
          <Link
            href="/setup"
            className="inline-flex items-center gap-1.5 transition hover:text-[var(--fg)]"
          >
            <Users className="h-4 w-4" />
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
      </PageItem>
    </PageEnter>
  );
}
