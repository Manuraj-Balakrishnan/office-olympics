"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { fuzzyMatch, pickEmojiPuzzles } from "@/data/emojiPuzzles";
import { useSound } from "@/hooks/useSound";
import { useSessionPlay } from "@/hooks/SessionPlayContext";

export function EmojiDecode() {
  const { play } = useSound();
  const sessionPlay = useSessionPlay();
  const puzzles = useMemo(() => pickEmojiPuzzles(10), []);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundStarted, setRoundStarted] = useState(Date.now());
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);

  const puzzle = puzzles[index]!;

  const finalize = (finalScore: number) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: `${correctRef.current}/${puzzles.length} solved · ${finalScore} pts`,
      })),
    );
    finishRef.current?.();
  };

  const next = (correct: boolean) => {
    if (finalized.current) return;
    const elapsed = Date.now() - roundStarted;
    const speedBonus = correct ? Math.max(0, Math.round((12000 - elapsed) / 100)) : 0;
    // Base 70 so slow perfect ≠ auto-1000 after normalize; speed still matters
    const add = correct ? 70 + speedBonus : 0;
    const newScore = scoreRef.current + add;
    scoreRef.current = newScore;
    if (correct) {
      play("correct");
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    } else {
      play("wrong");
    }

    if (index + 1 >= puzzles.length) {
      finalize(newScore);
    } else {
      setScore(newScore);
      setIndex((i) => i + 1);
      setGuess("");
      setRoundStarted(Date.now());
    }
  };

  return (
    <GameShell
      gameId="emoji-decode"
      title="Emoji Decode"
      durationSec={120}
      onTimeUp={() => finalize(scoreRef.current)}
      results={
        results ? (
          <ResultsScreen gameId="emoji-decode" title="Emoji Decode" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results) return null;

        return (
          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-8">
            <p className="text-[var(--fg-muted)]">
              Puzzle {index + 1}/{puzzles.length} · Score {score} · Solved {correctCount}
            </p>
            <motion.div
              key={puzzle.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl md:text-7xl"
            >
              {puzzle.emoji}
            </motion.div>
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && guess.trim()) {
                  next(fuzzyMatch(guess, puzzle));
                }
              }}
              className="w-full rounded-2xl border border-white/15 bg-[var(--bg-elevated)] px-5 py-4 text-center text-xl outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="What is it?"
              autoFocus
            />
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => next(fuzzyMatch(guess, puzzle))}
              >
                Submit guess
              </button>
              {!sessionPlay && (
                <>
                  <button
                    type="button"
                    className="btn-secondary !bg-emerald-500/20"
                    onClick={() => next(true)}
                  >
                    Host: Correct
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !bg-red-500/20"
                    onClick={() => next(false)}
                  >
                    Host: Incorrect
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-[var(--fg-muted)]">Category: {puzzle.category}</p>
          </div>
        );
      }}
    </GameShell>
  );
}
