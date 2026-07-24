"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";
import type { PlayerOrTeam } from "@/types/tournament";
import { springSnappy, springSoft } from "@/lib/motion";

const ROUNDS = 3;
/** Random wait before green — long enough to stop guessing */
const WAIT_MIN_MS = 1800;
const WAIT_MAX_MS = 5200;
const BETWEEN_ROUNDS_MS = 900;
const FALSE_START_PAUSE_MS = 750;

type Stage = "ready" | "wait" | "go" | "hit" | "too-soon";

function ratingFor(ms: number): { label: string; hint: string } {
  if (ms < 180) return { label: "Lightning", hint: "Esports territory" };
  if (ms < 220) return { label: "Elite", hint: "Top-tier reflexes" };
  if (ms < 280) return { label: "Fast", hint: "Sharp and clean" };
  if (ms < 350) return { label: "Solid", hint: "Above average" };
  if (ms < 450) return { label: "Average", hint: "Human range" };
  if (ms < 600) return { label: "Slow", hint: "Room to improve" };
  return { label: "Sluggish", hint: "Warm up next time" };
}

function averageMs(times: number[]) {
  if (times.length === 0) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

export function ReactionTest() {
  const { play } = useSound();
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [stage, setStage] = useState<Stage>("ready");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [falseStarts, setFalseStarts] = useState(0);

  const goAt = useRef(0);
  const stageRef = useRef<Stage>("ready");
  const timesRef = useRef<number[]>([]);
  const roundRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const finishRef = useRef<(() => void) | null>(null);
  const participantRef = useRef<PlayerOrTeam | null>(null);
  const finalized = useRef(false);

  const setStageSafe = (next: Stage) => {
    stageRef.current = next;
    setStage(next);
  };

  const clearTimers = () => {
    if (timer.current) clearTimeout(timer.current);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    timer.current = null;
    pauseTimer.current = null;
  };

  const endGame = useCallback((finalTimes: number[], participant: PlayerOrTeam) => {
    if (finalized.current) return;
    finalized.current = true;
    clearTimers();
    const avg = averageMs(finalTimes);
    const best = Math.min(...finalTimes);
    const { label } = ratingFor(avg);
    setResults([
      {
        participant,
        score: avg,
        detail: `avg ${avg}ms · best ${best}ms · ${label}`,
      },
    ]);
    finishRef.current?.();
  }, []);

  const armWait = useCallback(() => {
    clearTimers();
    setLastMs(null);
    setStageSafe("wait");
    const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
    timer.current = setTimeout(() => {
      goAt.current = performance.now();
      setStageSafe("go");
      play("go");
    }, delay);
  }, [play]);

  const beginRound = useCallback(
    (nextRound: number) => {
      roundRef.current = nextRound;
      setRound(nextRound);
      armWait();
    },
    [armWait],
  );

  const onTap = (e?: React.PointerEvent | React.KeyboardEvent) => {
    if (e && "button" in e && e.button !== 0) return;
    const participant = participantRef.current;
    if (!participant || finalized.current) return;

    const current = stageRef.current;

    if (current === "ready") {
      play("click");
      beginRound(1);
      return;
    }

    if (current === "wait") {
      clearTimers();
      play("wrong");
      setFalseStarts((n) => n + 1);
      setStageSafe("too-soon");
      pauseTimer.current = setTimeout(() => {
        // Same round — try again
        armWait();
      }, FALSE_START_PAUSE_MS);
      return;
    }

    if (current === "go") {
      const ms = Math.max(1, Math.round(performance.now() - goAt.current));
      play("correct");
      setLastMs(ms);
      setStageSafe("hit");

      const nextTimes = [...timesRef.current, ms];
      timesRef.current = nextTimes;
      setTimes(nextTimes);

      const finishedRound = roundRef.current;
      if (finishedRound >= ROUNDS) {
        pauseTimer.current = setTimeout(() => endGame(nextTimes, participant), BETWEEN_ROUNDS_MS);
      } else {
        pauseTimer.current = setTimeout(() => beginRound(finishedRound + 1), BETWEEN_ROUNDS_MS);
      }
    }
  };

  useEffect(
    () => () => {
      clearTimers();
    },
    [],
  );

  const avgSoFar = times.length > 0 ? averageMs(times) : null;
  const hitRating = lastMs != null ? ratingFor(lastMs) : null;

  return (
    <GameShell
      gameId="reaction"
      title="Reaction Time"
      durationSec={90}
      hideTimer
      results={
        results ? (
          <ResultsScreen
            gameId="reaction"
            title="Reaction Time"
            results={results}
            lowerIsBetter
          />
        ) : undefined
      }
    >
      {({ participants, phase, finish }) => {
        finishRef.current = finish;
        if (phase === "playing" && !startedRef.current && participants[0] && !results) {
          startedRef.current = true;
          participantRef.current = participants[0]!;
          queueMicrotask(() => setStageSafe("ready"));
        }
        if (results) return null;

        const palette =
          stage === "go"
            ? {
                bg: "from-emerald-500 via-lime-400 to-emerald-600",
                ring: "rgba(255,255,255,0.45)",
                glow: "rgba(52, 211, 153, 0.55)",
              }
            : stage === "too-soon"
              ? {
                  bg: "from-amber-500 via-orange-400 to-amber-600",
                  ring: "rgba(255,255,255,0.35)",
                  glow: "rgba(251, 191, 36, 0.5)",
                }
              : stage === "hit"
                ? {
                    bg: "from-sky-500 via-cyan-400 to-teal-500",
                    ring: "rgba(255,255,255,0.4)",
                    glow: "rgba(34, 211, 238, 0.45)",
                  }
                : stage === "wait"
                  ? {
                      bg: "from-rose-700 via-red-600 to-rose-800",
                      ring: "rgba(255,255,255,0.2)",
                      glow: "rgba(225, 29, 72, 0.35)",
                    }
                  : {
                      bg: "from-slate-700 via-slate-600 to-slate-800",
                      ring: "rgba(255,255,255,0.18)",
                      glow: "rgba(148, 163, 184, 0.25)",
                    };

        return (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onTap(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTap(e);
              }
            }}
            className="relative flex min-h-[min(72vh,640px)] w-full flex-1 flex-col items-center justify-center overflow-hidden touch-manipulation outline-none"
            aria-live="polite"
          >
            <motion.div
              key={stage === "go" ? "go" : stage === "wait" ? "wait" : stage}
              className={`absolute inset-0 bg-gradient-to-br ${palette.bg}`}
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 1 }}
              transition={{ duration: stage === "go" ? 0.05 : 0.25 }}
            />

            {/* Pulse rings */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`${stage}-${i}`}
                  className="absolute rounded-full border-2"
                  style={{
                    width: `${42 + i * 18}%`,
                    aspectRatio: "1",
                    maxWidth: 420 + i * 72,
                    borderColor: palette.ring,
                    boxShadow: `0 0 40px ${palette.glow}`,
                  }}
                  animate={
                    stage === "wait"
                      ? { scale: [1, 1.04, 1], opacity: [0.25, 0.45, 0.25] }
                      : stage === "go"
                        ? { scale: [0.92, 1.06], opacity: [0.7, 0.15] }
                        : { scale: 1, opacity: 0.3 }
                  }
                  transition={
                    stage === "go"
                      ? { duration: 0.55, repeat: Infinity, ease: "easeOut" }
                      : { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }
                  }
                />
              ))}
            </div>

            <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 px-5 py-8 text-center text-white">
              {/* Round progress */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                  {stage === "ready"
                    ? "Best of three"
                    : `Round ${Math.min(round, ROUNDS)} / ${ROUNDS}`}
                </p>
                <div className="flex items-center gap-2">
                  {Array.from({ length: ROUNDS }).map((_, i) => {
                    const done = i < times.length;
                    const active = stage !== "ready" && i === round - 1 && !done;
                    return (
                      <motion.span
                        key={i}
                        layout
                        className={`h-2.5 rounded-full transition-colors ${
                          done
                            ? "w-7 bg-white"
                            : active
                              ? "w-7 bg-white/70"
                              : "w-2.5 bg-white/30"
                        }`}
                        transition={springSnappy}
                      />
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={stage + String(lastMs)}
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 1.02 }}
                  transition={springSoft}
                  className="space-y-3"
                >
                  {stage === "ready" && (
                    <>
                      <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                        Ready?
                      </p>
                      <p className="text-base text-white/75 sm:text-lg">
                        Tap to start. Screen turns red — wait for green, then hit as fast as you can.
                      </p>
                      <p className="pt-2 font-display text-sm font-bold uppercase tracking-widest text-white/90">
                        Tap anywhere
                      </p>
                    </>
                  )}

                  {stage === "wait" && (
                    <>
                      <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl">
                        Wait…
                      </p>
                      <p className="text-base text-white/75 sm:text-lg">
                        Hold steady — don&apos;t tap until it flips green
                      </p>
                    </>
                  )}

                  {stage === "go" && (
                    <>
                      <p className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl md:text-8xl">
                        GO!
                      </p>
                      <p className="text-lg font-semibold text-white/90 sm:text-xl">
                        Tap now
                      </p>
                    </>
                  )}

                  {stage === "too-soon" && (
                    <>
                      <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                        Too soon!
                      </p>
                      <p className="text-base text-white/80 sm:text-lg">
                        False start — round {round} resets
                      </p>
                    </>
                  )}

                  {stage === "hit" && lastMs != null && hitRating && (
                    <>
                      <p className="font-display text-6xl font-extrabold tabular-nums tracking-tight sm:text-7xl md:text-8xl">
                        {lastMs}
                        <span className="text-3xl font-bold text-white/80 sm:text-4xl">ms</span>
                      </p>
                      <p className="font-display text-2xl font-bold sm:text-3xl">
                        {hitRating.label}
                      </p>
                      <p className="text-sm text-white/75 sm:text-base">{hitRating.hint}</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Live attempt strip */}
              {(times.length > 0 || falseStarts > 0) && stage !== "ready" && (
                <div className="mt-2 w-full max-w-sm space-y-2 rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {times.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-white/15 px-2.5 py-1 font-display text-sm font-bold tabular-nums"
                      >
                        {t}
                        <span className="text-[10px] font-semibold opacity-70">ms</span>
                      </span>
                    ))}
                    {times.length < ROUNDS && stage !== "hit" && (
                      <span className="rounded-lg border border-dashed border-white/30 px-2.5 py-1 text-xs text-white/50">
                        …
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 text-xs text-white/65">
                    {avgSoFar != null && (
                      <span>
                        Avg <strong className="text-white">{avgSoFar}ms</strong>
                      </span>
                    )}
                    {falseStarts > 0 && (
                      <span>
                        False starts <strong className="text-white">{falseStarts}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      }}
    </GameShell>
  );
}
