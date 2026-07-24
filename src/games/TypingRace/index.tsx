"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickTypingSentence } from "@/data/typingSentences";
import { useSound } from "@/hooks/useSound";

export function TypingRace() {
  const { play } = useSound();
  const sentence = useMemo(() => pickTypingSentence(), []);
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const finalized = useRef(false);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const statsRef = useRef({ wpm: 0, accuracy: 100, score: 0 });

  useEffect(() => {
    if (!startedAt || results) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [startedAt, results]);

  const correctChars = [...input].filter((ch, i) => sentence[i] === ch).length;
  const accuracy = input.length === 0 ? 100 : Math.round((correctChars / input.length) * 100);
  // Min 1 second elapsed once typing starts — blocks paste-instant 1000s
  const elapsedMin = startedAt
    ? Math.max((now - startedAt) / 60000, 1 / 60)
    : 1 / 60;
  const rawWpm = correctChars / 5 / elapsedMin;
  const wpm = Math.min(150, Math.round(rawWpm)); // hard cap honest elite WPM
  const progress = Math.min(1, input.length / sentence.length);
  const score = Math.round(wpm * (accuracy / 100) * 10);
  statsRef.current = { wpm, accuracy, score };

  const finalize = (override?: { wpm: number; accuracy: number; score: number }) => {
    if (finalized.current) return;
    finalized.current = true;
    const s = override ?? statsRef.current;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: s.score,
        detail: `${s.wpm} WPM · ${s.accuracy}%`,
      })),
    );
    finishRef.current?.();
  };

  useEffect(() => {
    if (input === sentence && sentence.length > 0) {
      play("correct");
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, sentence]);

  return (
    <GameShell
      gameId="typing"
      title="Typing Speed Race"
      durationSec={90}
      onTimeUp={() => finalize()}
      results={
        results ? (
          <ResultsScreen gameId="typing" title="Typing Speed Race" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results) return null;

        return (
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6">
            <div className="flex justify-between font-display text-lg font-bold">
              <span>{wpm} WPM</span>
              <span>{accuracy}% accuracy</span>
            </div>

            <div className="relative h-10 rounded-full bg-white/10">
              <motion.div
                className="absolute top-1/2 flex -translate-y-1/2 items-center"
                animate={{ left: `calc(${progress * 100}% - 16px)` }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <span className="text-2xl">🏃</span>
              </motion.div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🏁</div>
            </div>

            <p className="rounded-2xl bg-white/5 p-5 font-display text-xl leading-relaxed tracking-wide md:text-2xl">
              {sentence.split("").map((ch, i) => {
                let color = "text-[var(--fg-muted)]";
                if (i < input.length) {
                  color = input[i] === ch ? "text-emerald-400" : "text-red-400";
                }
                return (
                  <span key={i} className={color}>
                    {ch}
                  </span>
                );
              })}
            </p>

            <input
              autoFocus
              value={input}
              onPaste={(e) => e.preventDefault()}
              onChange={(e) => {
                if (!startedAt) setStartedAt(Date.now());
                setInput(e.target.value);
              }}
              className="w-full rounded-2xl border border-white/15 bg-[var(--bg-elevated)] px-5 py-4 font-mono text-lg outline-none ring-[var(--ring)] focus:ring-2"
              placeholder="Start typing here…"
              aria-label="Type the sentence"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        );
      }}
    </GameShell>
  );
}
