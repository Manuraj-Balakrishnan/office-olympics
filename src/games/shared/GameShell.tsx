"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CountdownIntro } from "./CountdownIntro";
import { HowToPlayIntro } from "./HowToPlayIntro";
import { TimerBar } from "@/components/layout/TimerBar";
import { useTournamentStore } from "@/store/useTournamentStore";
import type { GameId, PlayerOrTeam } from "@/types/tournament";
import { useSound } from "@/hooks/useSound";
import { useSessionPlay } from "@/hooks/SessionPlayContext";

type Phase = "howto" | "huddle" | "countdown" | "playing" | "results";

export function GameShell({
  gameId,
  title,
  durationSec,
  supportsHuddle,
  children,
  onTimeUp,
  results,
  hideTimer,
}: {
  gameId: GameId;
  title: string;
  durationSec: number;
  supportsHuddle?: boolean;
  hideTimer?: boolean;
  onTimeUp?: () => void;
  results?: React.ReactNode;
  children: (ctx: {
    phase: Phase;
    remainingMs: number;
    activeParticipant: PlayerOrTeam | null;
    participants: PlayerOrTeam[];
    finish: () => void;
  }) => React.ReactNode;
}) {
  const sessionPlay = useSessionPlay();
  const mode = useTournamentStore((s) => s.mode);
  const settings = useTournamentStore((s) => s.settings);
  const getParticipants = useTournamentStore((s) => s.getParticipants);
  const localParticipants = getParticipants();
  const participants = sessionPlay
    ? [sessionPlay.participant]
    : localParticipants.length
      ? [localParticipants[0]!]
      : [];
  const { play } = useSound();
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const backHref = sessionPlay ? null : "/dashboard";

  const huddle =
    !sessionPlay &&
    supportsHuddle &&
    mode === "teams" &&
    settings.huddleEnabled &&
    settings.teamPlayMode === "one-rep";

  const [phase, setPhase] = useState<Phase>("howto");
  const [remainingMs, setRemainingMs] = useState(durationSec * 1000);
  const [huddleLeft, setHuddleLeft] = useState(10);
  const timedOut = useRef(false);

  const finish = useCallback(() => {
    setPhase("results");
  }, []);

  const afterHowTo = useCallback(() => {
    setPhase(huddle ? "huddle" : "countdown");
  }, [huddle]);

  const startPlaying = useCallback(() => {
    setPhase("playing");
  }, []);

  // Whenever a game sets results, flip into results phase so the screen isn't blank
  useEffect(() => {
    if (results) setPhase("results");
  }, [results]);

  useEffect(() => {
    if (phase !== "huddle") return;
    if (huddleLeft <= 0) {
      setPhase("countdown");
      return;
    }
    const t = setTimeout(() => setHuddleLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, huddleLeft]);

  useEffect(() => {
    if (phase !== "playing" || hideTimer || results) return;
    timedOut.current = false;
    const started = Date.now();
    const total = durationSec * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, total - (Date.now() - started));
      setRemainingMs(left);
      if (left <= 0 && !timedOut.current) {
        timedOut.current = true;
        clearInterval(id);
        play("timesup");
        onTimeUpRef.current?.();
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, durationSec, hideTimer, results, play]);

  const activeParticipant = participants[0] ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:py-4"
      >
        <div className="flex items-center justify-between gap-3 sm:contents">
          {backHref ? (
            <Link href={backHref} className="btn-secondary !py-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          ) : (
            <div className="hidden w-24 sm:block" aria-hidden />
          )}
          {activeParticipant && phase === "playing" ? (
            <div className="flex max-w-[50%] items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm backdrop-blur sm:order-last sm:max-w-none">
              <span className="shrink-0">{activeParticipant.emoji}</span>
              <span className="truncate">{activeParticipant.name}</span>
            </div>
          ) : (
            <div className="hidden w-24 sm:block" />
          )}
        </div>
        <h1 className="text-center font-display text-xl font-extrabold sm:text-2xl md:text-3xl">
          {title}
        </h1>
      </motion.div>

      {phase === "playing" && !hideTimer && !results && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-2">
          <TimerBar remainingMs={remainingMs} totalMs={durationSec * 1000} />
          <p className="mt-1 text-right text-sm tabular-nums text-[var(--fg-muted)]">
            {(remainingMs / 1000).toFixed(1)}s
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "howto" && (
          <motion.div
            key="howto"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            <HowToPlayIntro gameId={gameId} onComplete={afterHowTo} />
          </motion.div>
        )}

        {phase === "huddle" && (
          <motion.div
            key="huddle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
              Team Huddle
            </p>
            <motion.p
              key={huddleLeft}
              initial={{ scale: 1.25, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-5xl font-extrabold"
            >
              {huddleLeft}
            </motion.p>
            <p className="max-w-md text-lg text-[var(--fg-muted)]">
              Strategize with your teammates — then the rep plays!
            </p>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => setPhase("countdown")}
            >
              Skip huddle
            </button>
          </motion.div>
        )}

        {phase === "countdown" && (
          <motion.div
            key="cd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
          >
            <CountdownIntro onComplete={startPlaying} />
          </motion.div>
        )}

        {(phase === "playing" || phase === "results") && (
          <motion.div
            key="play"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="flex flex-1 flex-col"
          >
            {results ? (
              results
            ) : phase === "results" ? (
              <p className="p-10 text-center text-[var(--fg-muted)]">Saving results…</p>
            ) : (
              children({
                phase,
                remainingMs,
                activeParticipant,
                participants,
                finish,
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
