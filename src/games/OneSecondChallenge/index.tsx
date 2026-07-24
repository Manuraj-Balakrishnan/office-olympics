"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickOneSecondRound } from "@/data/oneSecondRounds";
import { useSound } from "@/hooks/useSound";

type Step = "flash" | "hidden" | "questions";

export function OneSecondChallenge() {
  const { play } = useSound();
  const round = useMemo(() => pickOneSecondRound(), []);
  const [step, setStep] = useState<Step>("flash");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredAt, setAnsweredAt] = useState(Date.now());
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const started = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);

  const beginFlash = () => {
    setStep("flash");
    window.setTimeout(() => {
      setStep("hidden");
      window.setTimeout(() => {
        setStep("questions");
        setAnsweredAt(Date.now());
      }, 400);
    }, 1500);
  };

  const finalize = (finalScore: number) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: `${correctRef.current}/${round.questions.length} correct · ${finalScore} pts`,
      })),
    );
    finishRef.current?.();
  };

  const answer = (idx: number) => {
    const question = round.questions[qIndex];
    if (!question || finalized.current) return;
    const elapsed = Date.now() - answeredAt;
    const speedBonus = Math.max(0, Math.round((8000 - elapsed) / 80));
    let add = 0;
    if (idx === question.correctIndex) {
      play("correct");
      add = 100 + speedBonus;
      correctRef.current += 1;
    } else {
      play("wrong");
    }
    const newScore = scoreRef.current + add;
    scoreRef.current = newScore;
    setScore(newScore);

    if (qIndex + 1 >= round.questions.length) {
      finalize(newScore);
    } else {
      setQIndex((i) => i + 1);
      setAnsweredAt(Date.now());
    }
  };

  return (
    <GameShell
      gameId="one-second"
      title="Seconds Challenge"
      durationSec={120}
      hideTimer
      results={
        results ? (
          <ResultsScreen
            gameId="one-second"
            title="Seconds Challenge"
            results={results}
          />
        ) : undefined
      }
    >
      {({ participants, phase, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (phase === "playing" && !started.current) {
          started.current = true;
          queueMicrotask(beginFlash);
        }
        if (results) return null;
        const question = round.questions[qIndex];

        return (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-6">
            <AnimatePresence mode="wait">
              {step === "flash" && (
                <motion.div
                  key="flash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full overflow-hidden rounded-2xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={round.imageUrl}
                    alt="Memorize this scene"
                    className="max-h-[55vh] w-full object-cover"
                  />
                  <p className="mt-3 text-center font-display text-2xl font-bold">
                    Memorize — 1.5 seconds!
                  </p>
                </motion.div>
              )}
              {step === "hidden" && (
                <motion.p
                  key="hide"
                  className="font-display text-4xl font-extrabold"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  Gone! Get ready…
                </motion.p>
              )}
              {step === "questions" && question && (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-6"
                >
                  <p className="text-center text-sm text-[var(--fg-muted)]">
                    Question {qIndex + 1} of {round.questions.length} · Score {score}
                  </p>
                  <h2 className="text-center font-display text-2xl font-bold md:text-3xl">
                    {question.prompt}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {question.options.map((opt, i) => (
                      <button
                        key={opt}
                        type="button"
                        className="btn-secondary !justify-start !rounded-2xl !px-5 !py-4 text-left text-lg"
                        onClick={() => answer(i)}
                      >
                        <span className="mr-3 font-display text-[var(--fg-muted)]">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }}
    </GameShell>
  );
}
