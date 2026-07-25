"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";
import { useTournamentStore } from "@/store/useTournamentStore";

/** Fixed button layout — never shuffled between trials. */
const COLOR_WORDS = ["RED", "YELLOW", "GREEN", "ORANGE", "BLUE", "PURPLE"] as const;
type ColorWord = (typeof COLOR_WORDS)[number];

const INK: Record<ColorWord, string> = {
  RED: "#ef4444",
  YELLOW: "#eab308",
  GREEN: "#22c55e",
  ORANGE: "#f97316",
  BLUE: "#3b82f6",
  PURPLE: "#a855f7",
};

/** More incongruent trials as the run goes on — harder to autopilot. */
function nextTrial(answered: number) {
  const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]!;
  const incongruentChance = Math.min(0.92, 0.55 + answered * 0.008);
  let ink = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]!;
  if (Math.random() < incongruentChance) {
    while (ink === word) {
      ink = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]!;
    }
  } else {
    ink = word;
  }
  return { word, ink };
}

type Flash = { id: number; ok: boolean };

export function StroopChallenge() {
  const { play } = useSound();
  const assistMode = useTournamentStore((s) => s.settings.assistMode);
  const [trial, setTrial] = useState(() => nextTrial(0));
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const flashId = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);

  const finalize = (finalCorrect: number) => {
    if (finalized.current) return;
    finalized.current = true;
    const acc =
      attemptsRef.current > 0
        ? Math.round((finalCorrect / attemptsRef.current) * 100)
        : 0;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalCorrect,
        detail: `${finalCorrect} correct · ${acc}% · streak ×${bestStreakRef.current}`,
      })),
    );
    finishRef.current?.();
  };

  const pick = (choice: ColorWord) => {
    if (finalized.current) return;

    const isCorrect = choice === trial.ink;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    const id = ++flashId.current;
    setFlash({ id, ok: isCorrect });
    window.setTimeout(() => {
      if (flashId.current === id) setFlash(null);
    }, 220);

    if (isCorrect) {
      play("correct");
      correctRef.current += 1;
      setCorrect(correctRef.current);
      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;
      setStreak(nextStreak);
      if (nextStreak > bestStreakRef.current) {
        bestStreakRef.current = nextStreak;
        setBestStreak(nextStreak);
      }
    } else {
      play("wrong");
      streakRef.current = 0;
      setStreak(0);
    }

    setTrial(nextTrial(attemptsRef.current));
  };

  return (
    <GameShell
      gameId="stroop"
      title="Stroop Challenge"
      durationSec={90}
      onTimeUp={() => finalize(correctRef.current)}
      results={
        results ? (
          <ResultsScreen gameId="stroop" title="Stroop Challenge" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results) return null;

        return (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-8">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--fg-muted)]">
              <span className="rounded-xl border border-[var(--border)] bg-tone-5 px-3 py-1.5 font-display font-bold text-[var(--fg)]">
                {correct} correct
              </span>
              <span className="rounded-xl border border-[var(--border)] bg-tone-5 px-3 py-1.5">
                {attempts} taps
              </span>
              <span className="rounded-xl border border-[var(--border)] bg-tone-5 px-3 py-1.5">
                Best ×{bestStreak}
              </span>
            </div>

            <p className="text-center text-sm font-medium text-[var(--fg-muted)]">
              Tap the <strong className="text-[var(--fg)]">ink color</strong>, not the word
            </p>

            <AnimatePresence>
              {streak >= 3 && (
                <motion.p
                  key="streak"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-display text-lg font-bold text-amber-300"
                >
                  Streak ×{streak}
                  {streak >= 8 ? " — on fire" : streak >= 5 ? " — keep going" : ""}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="relative flex min-h-[7.5rem] w-full items-center justify-center">
              <AnimatePresence initial={false}>
                <motion.p
                  key={`${trial.word}-${trial.ink}-${attempts}`}
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.04, opacity: 0 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute font-display text-5xl font-extrabold tracking-tight sm:text-6xl md:text-8xl"
                  style={{ color: INK[trial.ink] }}
                >
                  {trial.word}
                </motion.p>
              </AnimatePresence>

              <AnimatePresence>
                {flash && (
                  <motion.div
                    key={flash.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.18 }}
                    className={`pointer-events-none absolute inset-[-0.75rem] rounded-3xl ring-4 ${
                      flash.ok ? "ring-emerald-400/70" : "ring-rose-500/70"
                    }`}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
              {COLOR_WORDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pick(c)}
                  className="rounded-2xl border border-[var(--border)] bg-tone-5 px-4 py-4 font-display text-lg font-bold transition hover:bg-tone-10 active:scale-[0.98]"
                  style={{ boxShadow: `inset 0 -4px 0 ${INK[c]}` }}
                  aria-label={`Ink color ${c}`}
                >
                  {assistMode && (
                    <span
                      className="mr-2 inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: INK[c] }}
                      aria-hidden
                    />
                  )}
                  {c}
                </button>
              ))}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
