"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickTrivia } from "@/data/triviaQuestions";
import { useSound } from "@/hooks/useSound";

const PER_QUESTION_MS = 8000;

export function TriviaQuiz() {
  const { play } = useSound();
  const questions = useMemo(() => pickTrivia(15), []);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [leftMs, setLeftMs] = useState(PER_QUESTION_MS);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [locked, setLocked] = useState(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const indexRef = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const lockedRef = useRef(false);
  const finalized = useRef(false);

  const q = questions[index];

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
    }
  };

  useEffect(() => {
    if (results || finalized.current || !q) return;
    lockedRef.current = false;
    setLocked(false);
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
          play("timesup");
          setTimeout(() => advance(0), 250);
        }
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, results]);

  const answer = (optIndex: number) => {
    if (lockedRef.current || !q || finalized.current) return;
    lockedRef.current = true;
    setLocked(true);
    const speedRatio = leftMs / PER_QUESTION_MS;
    if (optIndex === q.correctIndex) {
      play("correct");
      const points = Math.round(100 + speedRatio * 100);
      setTimeout(() => advance(points), 300);
    } else {
      play("wrong");
      setTimeout(() => advance(0), 300);
    }
  };

  const ring = leftMs / PER_QUESTION_MS;

  return (
    <GameShell
      gameId="trivia"
      title="Rapid-Fire Trivia"
      durationSec={150}
      hideTimer
      results={
        results ? (
          <ResultsScreen gameId="trivia" title="Rapid-Fire Trivia" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
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
                  className="text-white/10"
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
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {q.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  disabled={locked}
                  onClick={() => answer(i)}
                  className="btn-secondary !justify-start !rounded-2xl !px-5 !py-4 text-left text-lg disabled:opacity-60"
                >
                  <span className="mr-3 font-display text-[var(--fg-muted)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
