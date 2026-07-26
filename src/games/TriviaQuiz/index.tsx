"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickTrivia } from "@/data/triviaQuestions";
import { useSound } from "@/hooks/useSound";

const PER_QUESTION_MS = 10000;
const FEEDBACK_MS = 900;
const QUESTION_COUNT = 10;
const POINTS_PER_CORRECT = 100;

export function TriviaQuiz() {
  const { play } = useSound();
  const questions = useMemo(() => pickTrivia(QUESTION_COUNT), []);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [leftMs, setLeftMs] = useState(PER_QUESTION_MS);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [locked, setLocked] = useState(false);
  /** Selected option index, or -1 when time ran out with no pick. */
  const [picked, setPicked] = useState<number | null>(null);
  // Don't run the per-question clock during how-to / countdown — only once playing.
  const [started, setStarted] = useState(false);
  /** Option index removed by the hint (reset each question). */
  const [hiddenOpts, setHiddenOpts] = useState<number[]>([]);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const indexRef = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const lockedRef = useRef(false);
  const finalized = useRef(false);

  const q = questions[index];
  const hintUsed = hiddenOpts.length > 0;

  const finalize = (finalScore: number) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: `${correctRef.current}/${questions.length} correct · ${finalScore} pts`,
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
    if (nextIndex >= questions.length) {
      finalize(newScore);
    } else {
      setScore(newScore);
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      lockedRef.current = false;
      setLocked(false);
      setPicked(null);
      setHiddenOpts([]);
    }
  };

  useEffect(() => {
    if (!started || results || finalized.current || !q) return;
    lockedRef.current = false;
    setLocked(false);
    setPicked(null);
    setHiddenOpts([]);
    setLeftMs(PER_QUESTION_MS);
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, PER_QUESTION_MS - (Date.now() - start));
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

  const useHint = () => {
    if (!q || lockedRef.current || finalized.current || hintUsed) return;
    const wrong = q.options
      .map((_, i) => i)
      .filter((i) => i !== q.correctIndex)
      .sort(() => Math.random() - 0.5)
      .slice(0, 1);
    play("click");
    setHiddenOpts(wrong);
  };

  const answer = (optIndex: number) => {
    if (lockedRef.current || !q || finalized.current) return;
    if (hiddenOpts.includes(optIndex)) return;
    lockedRef.current = true;
    setLocked(true);
    setPicked(optIndex);
    if (optIndex === q.correctIndex) {
      play("correct");
      setTimeout(() => advance(POINTS_PER_CORRECT), FEEDBACK_MS);
    } else {
      play("wrong");
      setTimeout(() => advance(0), FEEDBACK_MS);
    }
  };

  const ring = leftMs / PER_QUESTION_MS;

  return (
    <GameShell
      gameId="trivia"
      title="Rapid-Fire Quiz"
      durationSec={100}
      hideTimer
      results={
        results ? (
          <ResultsScreen gameId="trivia" title="Rapid-Fire Quiz" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish, phase }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        // GameShell only invokes children once playing — arm the clock then.
        // Defer setState so we don't update TriviaQuiz while GameShell is rendering.
        if (phase === "playing" && !started) {
          queueMicrotask(() => setStarted(true));
        }
        if (results || !q) return null;

        return (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-6">
            <div className="relative flex h-24 w-24 items-center justify-center">
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
                  stroke="url(#triviaGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - ring) }}
                  transition={{ duration: 0.05 }}
                />
                <defs>
                  <linearGradient id="triviaGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-display text-xl font-bold">
                {(leftMs / 1000).toFixed(1)}
              </span>
            </div>

            <p className="text-sm text-[var(--fg-muted)]">
              Q{index + 1}/{questions.length} · {q.category} · Score {score}
            </p>
            <h2 className="text-center font-display text-2xl font-bold md:text-3xl">
              {q.question}
            </h2>
            <button
              type="button"
              disabled={locked || hintUsed}
              onClick={useHint}
              className="btn-secondary !py-2 text-sm disabled:opacity-50"
            >
              {hintUsed ? "Hint used" : "Hint · remove 1"}
            </button>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const removed = hiddenOpts.includes(i);
                const showFeedback = picked !== null;
                const isCorrect = i === q.correctIndex;
                const isWrongPick = picked === i && !isCorrect;
                const feedbackClass = showFeedback
                  ? isCorrect
                    ? "!border-emerald-500 !bg-emerald-500/20 !text-[var(--ok-fg)] ring-2 ring-emerald-500/50"
                    : isWrongPick
                      ? "!border-red-500 !bg-red-500/20 !text-[var(--bad-fg)] ring-2 ring-red-500/50"
                      : "opacity-50"
                  : "";
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={locked || removed}
                    onClick={() => answer(i)}
                    aria-hidden={removed}
                    className={`btn-secondary !justify-start !rounded-2xl !px-4 !py-3.5 text-left text-base disabled:opacity-60 sm:!px-5 sm:!py-4 sm:text-lg ${
                      removed ? "pointer-events-none line-through opacity-30" : ""
                    } ${feedbackClass}`}
                  >
                    <span className="mr-3 shrink-0 font-display text-[var(--fg-muted)]">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="min-w-0 text-wrap">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
