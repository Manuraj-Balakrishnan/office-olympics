"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickLogoRounds } from "@/data/logoRemix";
import { useSound } from "@/hooks/useSound";

const PER_ROUND_MS = 10_000;
const FEEDBACK_MS = 950;
const ROUND_COUNT = 10;
const POINTS_PER_CORRECT = 100;

function LogoMark({
  file,
  className,
}: {
  file: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logo-remix/${file}`}
      alt=""
      className={className}
      draggable={false}
    />
  );
}

export function LogoRemix() {
  const { play } = useSound();
  const rounds = useMemo(() => pickLogoRounds(ROUND_COUNT), []);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [leftMs, setLeftMs] = useState(PER_ROUND_MS);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const indexRef = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const lockedRef = useRef(false);
  const finalized = useRef(false);

  const round = rounds[index];
  const showAnswer = picked !== null;

  const finalize = (finalScore: number) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: `${correctRef.current}/${rounds.length} brands · ${finalScore} pts`,
      })),
    );
    finishRef.current?.();
  };

  const advance = (points: number) => {
    if (finalized.current) return;
    const newScore = scoreRef.current + points;
    scoreRef.current = newScore;
    if (points > 0) correctRef.current += 1;
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= rounds.length) {
      finalize(newScore);
    } else {
      setScore(newScore);
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      lockedRef.current = false;
      setLocked(false);
      setPicked(null);
    }
  };

  useEffect(() => {
    if (!started || results || finalized.current || !round) return;
    lockedRef.current = false;
    setLocked(false);
    setPicked(null);
    setLeftMs(PER_ROUND_MS);
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, PER_ROUND_MS - (Date.now() - start));
      setLeftMs(left);
      if (left <= 0) {
        clearInterval(id);
        if (!lockedRef.current && !finalized.current) {
          lockedRef.current = true;
          setLocked(true);
          setPicked(-1);
          play("timesup");
          setTimeout(() => advance(0), FEEDBACK_MS);
        }
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, index, results]);

  const answer = (optIndex: number) => {
    if (lockedRef.current || !round || finalized.current) return;
    lockedRef.current = true;
    setLocked(true);
    setPicked(optIndex);
    if (optIndex === round.correctIndex) {
      play("correct");
      setTimeout(() => advance(POINTS_PER_CORRECT), FEEDBACK_MS);
    } else {
      play("wrong");
      setTimeout(() => advance(0), FEEDBACK_MS);
    }
  };

  const ring = leftMs / PER_ROUND_MS;
  const urgent = leftMs < 3000;

  return (
    <GameShell
      gameId="logo-remix"
      title="Logo Remix"
      durationSec={100}
      hideTimer
      results={
        results ? (
          <ResultsScreen gameId="logo-remix" title="Logo Remix" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish, phase }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (phase === "playing" && !started) {
          queueMicrotask(() => setStarted(true));
        }
        if (results || !round) return null;

        const wrongPick =
          showAnswer && picked !== null && picked >= 0 && picked !== round.correctIndex;

        return (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-5 sm:gap-5 sm:py-6">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    className="text-tone-10"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={urgent ? "#ef4444" : "url(#logoRemixGrad)"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - ring) }}
                    transition={{ duration: 0.05 }}
                  />
                  <defs>
                    <linearGradient id="logoRemixGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <span
                  className={`font-display text-lg font-bold tabular-nums sm:text-xl ${
                    urgent ? "text-red-400" : ""
                  }`}
                >
                  {(leftMs / 1000).toFixed(1)}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)] sm:text-sm">
                  Logo {index + 1}/{rounds.length}
                </p>
                <p className="font-display text-lg font-bold tabular-nums sm:text-xl">
                  {score} pts
                </p>
              </div>

              <div className="flex w-16 justify-end gap-1 sm:w-20">
                {rounds.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i < index
                        ? "bg-emerald-400/80"
                        : i === index
                          ? "bg-[var(--fg)]"
                          : "bg-tone-10"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="max-w-md text-center text-sm text-[var(--fg-muted)]">
              Guess the brand
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={round.logo.id}
                initial={{ opacity: 0 }}
                animate={
                  wrongPick
                    ? { opacity: 1, x: [0, -8, 8, -5, 5, 0] }
                    : { opacity: 1, x: 0 }
                }
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative flex h-48 w-full max-w-sm items-center justify-center rounded-[1.75rem] border border-[var(--border)] bg-white sm:h-56"
              >
                <LogoMark
                  file={round.logo.file}
                  className="h-28 w-full max-w-[14rem] object-contain sm:h-32"
                />

                {showAnswer && (
                  <p className="absolute inset-x-0 bottom-3 text-center font-display text-base font-bold text-neutral-900 sm:text-lg">
                    {round.logo.brand}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="grid w-full gap-2.5 sm:grid-cols-2 sm:gap-3">
              {round.options.map((opt, i) => {
                const showFeedback = picked !== null;
                const isCorrect = i === round.correctIndex;
                const isWrongPick = picked === i && !isCorrect;
                const feedbackClass = showFeedback
                  ? isCorrect
                    ? "!border-emerald-500 !bg-emerald-500/20 !text-[var(--ok-fg)] ring-2 ring-emerald-500/50"
                    : isWrongPick
                      ? "!border-red-500 !bg-red-500/20 !text-[var(--bad-fg)] ring-2 ring-red-500/50"
                      : "opacity-45"
                  : "";
                return (
                  <motion.button
                    key={`${round.logo.id}-${opt}`}
                    type="button"
                    disabled={locked}
                    onClick={() => answer(i)}
                    whileTap={locked ? undefined : { scale: 0.98 }}
                    className={`rounded-2xl border border-[var(--border)] bg-tone-5 px-4 py-3.5 text-left font-display text-base font-bold transition hover:bg-tone-10 disabled:cursor-default sm:py-4 sm:text-lg ${feedbackClass}`}
                  >
                    <span className="mr-2.5 font-display text-[var(--fg-muted)]">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
