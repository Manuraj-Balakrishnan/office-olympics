"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";
import { useTournamentStore } from "@/store/useTournamentStore";

const COLOR_WORDS = ["RED", "BLUE", "GREEN", "YELLOW", "ORANGE", "PURPLE"] as const;
const INK: Record<(typeof COLOR_WORDS)[number], string> = {
  RED: "#ef4444",
  BLUE: "#3b82f6",
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  ORANGE: "#f97316",
  PURPLE: "#a855f7",
};

function nextTrial() {
  const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]!;
  let ink = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]!;
  if (ink === word && Math.random() > 0.25) {
    ink = COLOR_WORDS[(COLOR_WORDS.indexOf(word) + 1) % COLOR_WORDS.length]!;
  }
  return { word, ink };
}

export function StroopChallenge() {
  const { play } = useSound();
  const assistMode = useTournamentStore((s) => s.settings.assistMode);
  const [trial, setTrial] = useState(nextTrial);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const totalRounds = 15;
  const finalized = useRef(false);

  const finalize = (finalCorrect: number) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalCorrect,
        detail: `${finalCorrect}/${totalRounds} correct`,
      })),
    );
    finishRef.current?.();
  };

  const pick = (choice: (typeof COLOR_WORDS)[number]) => {
    if (finalized.current) return;
    const isCorrect = choice === trial.ink;
    if (isCorrect) {
      play("correct");
      correctRef.current += 1;
      setCorrect(correctRef.current);
    } else {
      play("wrong");
    }
    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    if (nextRound >= totalRounds) {
      finalize(correctRef.current);
    } else {
      setRound(nextRound);
      setTrial(nextTrial());
    }
  };

  return (
    <GameShell
      gameId="stroop"
      title="Stroop Challenge"
      durationSec={30}
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
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-8">
            <p className="text-[var(--fg-muted)]">
              Round {Math.min(round + 1, totalRounds)}/{totalRounds} · Correct {correct}
            </p>
            <p className="text-center text-sm font-medium text-[var(--fg-muted)]">
              Tap the <strong className="text-[var(--fg)]">ink color</strong>, not the word
            </p>
            <motion.p
              key={`${trial.word}-${trial.ink}-${round}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 16 }}
              className="font-display text-6xl font-extrabold md:text-8xl"
              style={{ color: INK[trial.ink] }}
            >
              {trial.word}
            </motion.p>
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
              {COLOR_WORDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pick(c)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-display text-lg font-bold transition hover:bg-white/10"
                  style={{ boxShadow: `inset 0 -4px 0 ${INK[c]}` }}
                  aria-label={`Ink color ${c}`}
                >
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: INK[c] }}
                    aria-hidden={!assistMode}
                  />
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
