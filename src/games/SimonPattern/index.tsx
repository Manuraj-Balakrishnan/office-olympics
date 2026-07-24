"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";
import { useTournamentStore } from "@/store/useTournamentStore";

const COLORS = [
  { id: 0, bg: "bg-red-500", glow: "shadow-red-500/60" },
  { id: 1, bg: "bg-blue-500", glow: "shadow-blue-500/60" },
  { id: 2, bg: "bg-green-500", glow: "shadow-green-500/60" },
  { id: 3, bg: "bg-yellow-400", glow: "shadow-yellow-400/60" },
] as const;

type SfxSimon = "simon0" | "simon1" | "simon2" | "simon3";

export function SimonPattern() {
  const { play } = useSound();
  const assistMode = useTournamentStore((s) => s.settings.assistMode);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [acceptInput, setAcceptInput] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [status, setStatus] = useState("Watch the pattern…");
  const scoreRef = useRef(0);
  const finishRef = useRef<(() => void) | null>(null);
  const sequenceRef = useRef<number[]>([]);
  const finalized = useRef(false);
  const startedRef = useRef(false);

  const flashPad = useCallback(
    async (id: number) => {
      setLit(id);
      play(`simon${id}` as SfxSimon);
      await new Promise((r) => setTimeout(r, 420));
      setLit(null);
      await new Promise((r) => setTimeout(r, 140));
    },
    [play],
  );

  const playSequence = useCallback(
    async (seq: number[]) => {
      sequenceRef.current = seq;
      setSequence(seq);
      setAcceptInput(false);
      setStatus("Watch the pattern…");
      await new Promise((r) => setTimeout(r, 400));
      for (const id of seq) {
        await flashPad(id);
      }
      setAcceptInput(true);
      setStatus("Your turn — repeat it!");
      setPlayerIdx(0);
    },
    [flashPad],
  );

  const endGame = useCallback(
    (finalScore: number, participants: ResultRow["participant"][]) => {
      if (finalized.current) return;
      finalized.current = true;
      play("wrong");
      setAcceptInput(false);
      setStatus(`Game over! Longest sequence: ${finalScore}`);
      setResults(
        participants.map((p) => ({
          participant: p,
          score: finalScore,
          detail: `${finalScore} steps`,
        })),
      );
      finishRef.current?.();
    },
    [play],
  );

  const onPad = (id: number, participants: ResultRow["participant"][]) => {
    if (!acceptInput || finalized.current) return;
    void flashPad(id);
    const seq = sequenceRef.current;
    if (seq[playerIdx] !== id) {
      endGame(scoreRef.current, participants);
      return;
    }
    play("correct");
    const nextIdx = playerIdx + 1;
    if (nextIdx >= seq.length) {
      const newScore = seq.length;
      scoreRef.current = newScore;
      setScore(newScore);
      setAcceptInput(false);
      setStatus(`Nice! Sequence length ${newScore}`);
      setTimeout(() => {
        const next = [...seq, Math.floor(Math.random() * 4)];
        void playSequence(next);
      }, 700);
    } else {
      setPlayerIdx(nextIdx);
    }
  };

  return (
    <GameShell
      gameId="simon"
      title="Simon Pattern"
      durationSec={120}
      supportsHuddle
      hideTimer
      results={
        results ? (
          <ResultsScreen gameId="simon" title="Simon Pattern" results={results} />
        ) : undefined
      }
    >
      {({ participants, phase, finish }) => {
        finishRef.current = finish;
        if (results || phase !== "playing") return null;

        if (!startedRef.current) {
          startedRef.current = true;
          queueMicrotask(() => {
            const first = [Math.floor(Math.random() * 4)];
            void playSequence(first);
          });
        }

        return (
          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6 sm:gap-8">
            <p className="text-center text-base text-[var(--fg-muted)] sm:text-lg">{status}</p>
            <p className="font-display text-2xl font-bold sm:text-3xl">Score: {score}</p>

            <div className="mx-auto grid w-full max-w-[min(100%,20rem)] grid-cols-2 gap-3 sm:max-w-none sm:w-auto sm:gap-4">
              {COLORS.map((c) => (
                <motion.button
                  key={c.id}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onPad(c.id, participants)}
                  className={`aspect-square w-full rounded-3xl sm:h-36 sm:w-36 md:h-40 md:w-40 ${c.bg} shadow-2xl transition ${
                    lit === c.id ? `scale-105 brightness-125 shadow-xl ${c.glow}` : "opacity-85"
                  }`}
                  aria-label={assistMode ? `Pad ${c.id + 1}` : `Color pad ${c.id + 1}`}
                >
                  {assistMode && (
                    <span className="font-display text-2xl font-bold text-black/50">
                      {c.id + 1}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => endGame(scoreRef.current, participants)}
            >
              End & save score
            </button>
          </div>
        );
      }}
    </GameShell>
  );
}
